'use client'

import { useFlowStore } from '@/hooks/use-flow'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Trash2, Play, X } from 'lucide-react'
import type { StartNodeData, FunctionNodeData } from '@/types'

export function RightSidebar() {
  const { 
    nodes, 
    edges, 
    selectedNode, 
    selectNode, 
    updateNodeData, 
    removeNode,
    executeNode,
    functions,
  } = useFlowStore()

  const selectedNodeData = nodes.find(n => n.id === selectedNode)
  
  if (!selectedNodeData) {
    return (
      <div className="w-72 border-l bg-background flex flex-col h-full">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Node Configuration</h2>
          <p className="text-xs text-muted-foreground">Select a node to configure</p>
        </div>
        <div className="flex-1 flex items-center justify-center p-4">
          <p className="text-sm text-muted-foreground text-center">
            Click on a node to view its configuration
          </p>
        </div>
      </div>
    )
  }

  const isStartNode = selectedNodeData.type === 'start'
  const data = selectedNodeData.data as unknown as StartNodeData | FunctionNodeData

  const handleParamChange = (paramName: string, value: string) => {
    if (isStartNode) {
      const startData = data as StartNodeData
      updateNodeData(selectedNode!, {
        parameters: { ...startData.parameters, [paramName]: value }
      })
    } else {
      const funcData = data as FunctionNodeData
      updateNodeData(selectedNode!, {
        parameters: { ...funcData.parameters, [paramName]: value }
      })
    }
  }

  const handleAddParam = () => {
    const paramName = `param${Object.keys((data as StartNodeData).parameters || {}).length + 1}`
    if (isStartNode) {
      const startData = data as StartNodeData
      updateNodeData(selectedNode!, {
        parameters: { ...startData.parameters, [paramName]: '' }
      })
    }
  }

  const handleRemoveParam = (paramName: string) => {
    if (isStartNode) {
      const startData = data as StartNodeData
      const newParams = { ...startData.parameters }
      delete newParams[paramName]
      updateNodeData(selectedNode!, { parameters: newParams })
    }
  }

  const getIncomingEdges = () => {
    return edges.filter(e => e.target === selectedNode)
  }

  const incomingEdges = getIncomingEdges()

  return (
    <div className="w-72 border-l bg-background flex flex-col h-full">
      <div className="p-4 border-b flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Node Configuration</h2>
          <p className="text-xs text-muted-foreground">
            {isStartNode ? 'Start Node' : (data as FunctionNodeData).functionName}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => selectNode(null)}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-4">
        <div className="space-y-2">
          <Label>Node Type</Label>
          <div className="p-2 rounded bg-accent text-sm">
            {isStartNode ? (
              <span className="text-purple-600">Start Node</span>
            ) : (
              <span className="text-blue-600">{(data as FunctionNodeData).functionName}</span>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Parameters</Label>
          {isStartNode ? (
            <div className="space-y-2">
              {Object.entries((data as StartNodeData).parameters).map(([key, value]) => (
                <div key={key} className="flex items-center gap-2">
                  <Input
                    placeholder={key}
                    value={value}
                    onChange={(e) => handleParamChange(key, e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveParam(key)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={handleAddParam} className="w-full">
                + Add Parameter
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {Object.entries((data as FunctionNodeData).parameters).map(([key, value]) => {
                const edgeForParam = incomingEdges.find(e => e.targetHandle === key)
                const funcDef = functions.find(f => f.name === (data as FunctionNodeData).functionName)
                const paramDef = funcDef?.parameters.find(p => p.name === key)
                
                return (
                  <div key={key} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">
                        {key}
                        {paramDef && <span className="text-muted-foreground ml-1">({paramDef.type})</span>}
                      </Label>
                      {edgeForParam && (
                        <span className="text-xs text-green-600">← Connected</span>
                      )}
                    </div>
                    <Input
                      placeholder={key}
                      value={value}
                      onChange={(e) => handleParamChange(key, e.target.value)}
                      disabled={!!edgeForParam}
                    />
                    {edgeForParam && (
                      <p className="text-xs text-muted-foreground">
                        Parameter from: {edgeForParam.source}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {(data as FunctionNodeData).result && (
          <div className="space-y-2">
            <Label>Result</Label>
            <div className="p-2 rounded bg-green-50 text-sm text-green-800 break-all">
              {(data as FunctionNodeData).result}
            </div>
          </div>
        )}

        {(data as FunctionNodeData).error && (
          <div className="space-y-2">
            <Label>Error</Label>
            <div className="p-2 rounded bg-red-50 text-sm text-red-800 break-all">
              {(data as FunctionNodeData).error}
            </div>
          </div>
        )}
      </div>

      <div className="p-4 border-t space-y-2">
        {!isStartNode && (
          <Button 
            onClick={() => executeNode(selectedNode!)} 
            className="w-full"
            variant="secondary"
          >
            <Play className="w-4 h-4 mr-1" /> Execute Function
          </Button>
        )}
        <Button 
          onClick={() => {
            removeNode(selectedNode!)
          }} 
          className="w-full"
          variant="destructive"
        >
          <Trash2 className="w-4 h-4 mr-1" /> Delete Node
        </Button>
      </div>
    </div>
  )
}
