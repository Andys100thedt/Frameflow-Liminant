'use client'

import { create } from 'zustand'
import {
  type Node,
  type Edge,
  applyNodeChanges,
  applyEdgeChanges,
  type NodeChange,
  type EdgeChange,
  addEdge,
  type Connection,
} from '@xyflow/react'
import { api } from '@/services/api'
import type { FunctionMetadata, LogEntry, StartNodeData, FunctionNodeData } from '@/types'
import { STORAGE_KEYS } from '@/constants'

interface FlowState {
  nodes: Node[]
  edges: Edge[]
  functions: FunctionMetadata[]
  logs: LogEntry[]
  selectedNode: string | null
  isExecuting: boolean
  currentFlowName: string | null
  
  setNodes: (nodes: Node[]) => void
  setEdges: (edges: Edge[]) => void
  onNodesChange: (changes: NodeChange[]) => void
  onEdgesChange: (changes: EdgeChange[]) => void
  onConnect: (connection: Connection) => void
  addNode: (type: 'start' | 'function', functionName?: string) => void
  removeNode: (nodeId: string) => void
  updateNodeData: (nodeId: string, data: Partial<StartNodeData | FunctionNodeData>) => void
  selectNode: (nodeId: string | null) => void
  setFunctions: (functions: FunctionMetadata[]) => void
  fetchFunctions: () => Promise<void>
  addLog: (type: LogEntry['type'], message: string) => void
  clearLogs: () => void
  executeNode: (nodeId: string) => Promise<void>
  executeFlow: () => Promise<void>
  saveFlow: (name: string) => void
  loadFlow: (name: string) => void
  getSavedFlows: () => { name: string; createdAt: string }[]
  deleteFlow: (name: string) => void
}

function generateId() {
  return Math.random().toString(36).substring(2, 9)
}

function topologicalSort(nodes: Node[], edges: Edge[]): Node[] {
  const nodeMap = new Map(nodes.map(n => [n.id, n]))
  const inDegree = new Map<string, number>()
  const adjacency = new Map<string, string[]>()
  
  nodes.forEach(n => {
    inDegree.set(n.id, 0)
    adjacency.set(n.id, [])
  })
  
  edges.forEach(e => {
    const current = inDegree.get(e.target) || 0
    inDegree.set(e.target, current + 1)
    adjacency.get(e.source)?.push(e.target)
  })
  
  const queue: string[] = []
  inDegree.forEach((degree, id) => {
    if (degree === 0) queue.push(id)
  })
  
  const sorted: Node[] = []
  while (queue.length > 0) {
    const id = queue.shift()!
    const node = nodeMap.get(id)
    if (node) sorted.push(node)
    adjacency.get(id)?.forEach(target => {
      const newDegree = (inDegree.get(target) || 0) - 1
      inDegree.set(target, newDegree)
      if (newDegree === 0) queue.push(target)
    })
  }
  
  return sorted
}

export const useFlowStore = create<FlowState>((set, get) => ({
  nodes: [],
  edges: [],
  functions: [],
  logs: [],
  selectedNode: null,
  isExecuting: false,
  currentFlowName: null,

  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),
  
  onNodesChange: (changes) => {
    set({ nodes: applyNodeChanges(changes, get().nodes) })
  },
  
  onEdgesChange: (changes) => {
    set({ edges: applyEdgeChanges(changes, get().edges) })
  },
  
  onConnect: (connection) => {
    set({ edges: addEdge({ ...connection, animated: true }, get().edges) })
  },

  addNode: (type, functionName) => {
    const id = generateId()
    const position = { x: 100 + Math.random() * 200, y: 100 + Math.random() * 200 }
    
    if (type === 'start') {
      const newNode: Node = {
        id,
        type: 'start',
        position,
        data: { label: 'Flow input', parameters: { input: '' } },
      }
      set({ nodes: [...get().nodes, newNode] })
    } else if (functionName) {
      const func = get().functions.find(f => f.name === functionName)
      const params: Record<string, string> = {}
      func?.parameters.forEach(p => {
        params[p.name] = ''
      })
      
      const newNode: Node = {
        id,
        type: 'function',
        position,
        data: {
          label: func?.description,
          functionName,
          parameters: params,
          func
        },
      }
      set({ nodes: [...get().nodes, newNode] })
    }
  },

  removeNode: (nodeId) => {
    set({
      nodes: get().nodes.filter(n => n.id !== nodeId),
      edges: get().edges.filter(e => e.source !== nodeId && e.target !== nodeId),
      selectedNode: get().selectedNode === nodeId ? null : get().selectedNode,
    })
  },

  updateNodeData: (nodeId, data) => {
    set({
      nodes: get().nodes.map(node => {
        if (node.id === nodeId) {
          return { ...node, data: { ...node.data, ...data } }
        }
        return node
      }),
    })
  },

  selectNode: (nodeId) => {
    set({ selectedNode: nodeId })
  },

  setFunctions: (functions) => {
    set({ functions })
  },

  fetchFunctions: async () => {
    try {
      const response = await api.getFunctions()
      // if no category, set to .root
      const functions = response.functions.map((metadata: FunctionMetadata, idx: number)=>(
        metadata.category === "" ? metadata.category = ".root" : metadata.category
      ))
      set({ functions: response.functions })
    } catch (error) {
      get().addLog('error', `Failed to fetch functions: ${error}`)
    }
  },

  addLog: (type, message) => {
    const log: LogEntry = {
      id: generateId(),
      type,
      message,
      timestamp: new Date(),
    }
    set({ logs: [...get().logs, log] })
  },

  clearLogs: () => {
    set({ logs: [] })
  },

  executeNode: async (nodeId) => {
    const node = get().nodes.find(n => n.id === nodeId)
    if (!node || node.type !== 'function') return

    const funcNode = node.data as unknown as FunctionNodeData
    get().addLog('command', `> Executing ${funcNode.functionName}...`)
    get().updateNodeData(nodeId, { executed: false, error: undefined, result: undefined })

    const params: Record<string, unknown> = {}
    const edges = get().edges.filter(e => e.target === nodeId)
    
    for (const paramName of Object.keys(funcNode.parameters)) {
      const edge = edges.find(e => {
        const targetHandle = e.targetHandle as string
        return targetHandle === paramName
      })
      
      if (edge) {
        const sourceNode = get().nodes.find(n => n.id === edge.source)
        if (sourceNode) {
          if (sourceNode.type === 'start') {
            const startData = sourceNode.data as unknown as StartNodeData
            params[paramName] = startData.parameters.input || ''
          } else {
            const sourceFuncData = sourceNode.data as unknown as FunctionNodeData
            params[paramName] = sourceFuncData.result || ''
          }
        }
      } else {
        const value = funcNode.parameters[paramName]
        if (value !== undefined && value !== '') {
          params[paramName] = isNaN(Number(value)) ? value : Number(value)
        }
      }
    }

    try {
      const response = await api.executeFunction(funcNode.functionName, params)
      if (response.success) {
        get().updateNodeData(nodeId, { 
          result: JSON.stringify(response.result), 
          executed: true,
          error: undefined,
        })
        get().addLog('success', `✓ ${funcNode.functionName} returned: ${JSON.stringify(response.result)}`)
      } else {
        get().updateNodeData(nodeId, { error: response.message, executed: false })
        get().addLog('error', `✗ ${funcNode.functionName} failed: ${response.message}`)
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error)
      get().updateNodeData(nodeId, { error: errorMsg, executed: false })
      get().addLog('error', `✗ Error: ${errorMsg}`)
    }
  },

  executeFlow: async () => {
    const { nodes, edges, addLog } = get()
    if (nodes.length === 0) {
      addLog('error', 'No nodes in flow')
      return
    }

    set({ isExecuting: true })
    addLog('info', 'Starting flow execution...')

    const sortedNodes = topologicalSort(nodes, edges)
    const startNode = sortedNodes.find(n => n.type === 'start')
    
    if (!startNode) {
      addLog('error', 'No Start node found')
      set({ isExecuting: false })
      return
    }

    const nodeResults = new Map<string, unknown>()

    for (const node of sortedNodes) {
      if (node.type === 'start') continue

      const funcNode = node.data as unknown as FunctionNodeData
      addLog('command', `> Executing ${funcNode.functionName}...`)

      const params: Record<string, unknown> = {}
      const nodeEdges = edges.filter(e => e.target === node.id)

      for (const paramName of Object.keys(funcNode.parameters)) {
        const edge = nodeEdges.find((e: Edge) => {
          const targetHandle = e.targetHandle as string
          return targetHandle === paramName
        })

        if (edge) {
          const sourceNode = sortedNodes.find(n => n.id === edge.source)
          if (sourceNode) {
            if (sourceNode.type === 'start') {
              const startData = sourceNode.data as unknown as StartNodeData
              params[paramName] = startData.parameters.input || ''
            } else {
              params[paramName] = nodeResults.get(sourceNode.id) ?? ''
            }
          }
        } else {
          const value = funcNode.parameters[paramName]
          if (value !== undefined && value !== '') {
            params[paramName] = isNaN(Number(value)) ? value : Number(value)
          }
        }
      }

      try {
        const response = await api.executeFunction(funcNode.functionName, params)
        if (response.success) {
          nodeResults.set(node.id, response.result)
          get().updateNodeData(node.id, { 
            result: JSON.stringify(response.result), 
            executed: true,
            error: undefined,
          })
          addLog('success', `✓ ${funcNode.functionName} returned: ${JSON.stringify(response.result)}`)
        } else {
          get().updateNodeData(node.id, { error: response.message, executed: false })
          addLog('error', `✗ ${funcNode.functionName} failed: ${response.message}`)
          set({ isExecuting: false })
          return
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error)
        get().updateNodeData(node.id, { error: errorMsg, executed: false })
        addLog('error', `✗ Error: ${errorMsg}`)
        set({ isExecuting: false })
        return
      }
    }

    addLog('info', 'Flow execution completed!')
    set({ isExecuting: false })
  },

  saveFlow: (name) => {
    const { nodes, edges } = get()
    const savedFlows = JSON.parse(localStorage.getItem(STORAGE_KEYS.FLOWS) || '[]')
    const existingIndex = savedFlows.findIndex((f: { name: string }) => f.name === name)
    
    const flow = {
      name,
      createdAt: new Date().toISOString(),
      nodes,
      edges,
    }
    
    if (existingIndex >= 0) {
      savedFlows[existingIndex] = flow
    } else {
      savedFlows.push(flow)
    }
    
    localStorage.setItem(STORAGE_KEYS.FLOWS, JSON.stringify(savedFlows))
    set({ currentFlowName: name })
    get().addLog('success', `Flow "${name}" saved`)
  },

  loadFlow: (name) => {
    const savedFlows = JSON.parse(localStorage.getItem(STORAGE_KEYS.FLOWS) || '[]')
    const flow = savedFlows.find((f: { name: string }) => f.name === name)
    
    if (flow) {
      set({ 
        nodes: flow.nodes, 
        edges: flow.edges, 
        currentFlowName: name,
        selectedNode: null,
      })
      get().addLog('info', `Flow "${name}" loaded`)
    }
  },

  getSavedFlows: () => {
    const savedFlows = JSON.parse(localStorage.getItem(STORAGE_KEYS.FLOWS) || '[]')
    return savedFlows.map((f: { name: string; createdAt: string }) => ({
      name: f.name,
      createdAt: f.createdAt,
    }))
  },

  deleteFlow: (name) => {
    const savedFlows = JSON.parse(localStorage.getItem(STORAGE_KEYS.FLOWS) || '[]')
    const filtered = savedFlows.filter((f: { name: string }) => f.name !== name)
    localStorage.setItem(STORAGE_KEYS.FLOWS, JSON.stringify(filtered))
    
    if (get().currentFlowName === name) {
      set({ currentFlowName: null, nodes: [], edges: [] })
    }
    get().addLog('info', `Flow "${name}" deleted`)
  },
}))
