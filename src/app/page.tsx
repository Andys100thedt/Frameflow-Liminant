'use client'

import { useCallback, useEffect, useState, useMemo } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Panel,
  type NodeMouseHandler,
  BackgroundVariant,
  SelectionMode,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useFlowStore } from '@/hooks/use-flow'
import { nodeTypes } from '@/components/node-types'
import { LeftSidebar } from '@/components/left-sidebar'
import { RightSidebar } from '@/components/right-sidebar'
import { TerminalPanel } from '@/components/terminal-panel'
import { Toaster } from '@/components/ui/sonner'
import { MousePointer2, ChevronDown, ChevronRight } from 'lucide-react'
import { buildCategoryTree } from '@/lib/category-tree'
import type { CategoryNode } from '@/types'

function ContextMenuCategory({ 
  node, 
  level, 
  expandedCategories, 
  toggleCategory, 
  addNode,
  closeMenu 
}: { 
  node: CategoryNode
  level: number
  expandedCategories: Set<string>
  toggleCategory: (path: string) => void
  addNode: (type: 'function', functionName: string) => void
  closeMenu: () => void
}) {
  const hasChildren = node.children.length > 0
  const hasFunctions = node.functions.length > 0
  const isExpanded = expandedCategories.has(node.path)
  const paddingLeft = level * 12

  return (
    <div>
      {(hasChildren || hasFunctions) && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            toggleCategory(node.path)
          }}
          className="w-full px-3 py-1.5 text-left text-xs font-semibold text-muted-foreground hover:bg-accent flex items-center gap-2"
          style={{ paddingLeft: `${paddingLeft + 12}px` }}
        >
          {isExpanded ? (
            <ChevronDown className="w-3 h-3 flex-shrink-0" />
          ) : (
            <ChevronRight className="w-3 h-3 flex-shrink-0" />
          )}
          <span className="truncate">{node.name}</span>
          <span className="ml-auto flex-shrink-0">
            ({node.functions.length + node.children.length})
          </span>
        </button>
      )}
      
      {isExpanded && (
        <>
          {node.functions.map((func) => (
            <button
              key={func.name}
              className="w-full px-3 py-1.5 text-left text-sm hover:bg-accent flex items-center gap-2"
              style={{ paddingLeft: `${paddingLeft + 28}px` }}
              onClick={() => {
                addNode('function', func.name)
                closeMenu()
              }}
            >
              <span className="text-blue-500 flex-shrink-0">◆</span>
              <span className="truncate">{func.name}</span>
            </button>
          ))}
          
          {node.children.map((child) => (
            <ContextMenuCategory
              key={child.path}
              node={child}
              level={level + 1}
              expandedCategories={expandedCategories}
              toggleCategory={toggleCategory}
              addNode={addNode}
              closeMenu={closeMenu}
            />
          ))}
        </>
      )}
    </div>
  )
}

export default function Home() {
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    selectNode,
    fetchFunctions,
  } = useFlowStore()

  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchFunctions()
  }, [fetchFunctions])

  const { addNode, functions } = useFlowStore()

  const categoryTree = useMemo(() => {
    return buildCategoryTree(functions)
  }, [functions])

  const toggleCategory = (path: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev)
      if (newSet.has(path)) {
        newSet.delete(path)
      } else {
        newSet.add(path)
      }
      return newSet
    })
  }

  const onNodeClick: NodeMouseHandler = useCallback((_, node) => {
    selectNode(node.id)
  }, [selectNode])

  const onPaneClick = useCallback(() => {
    selectNode(null)
    setContextMenu(null)
  }, [selectNode])

  const onContextMenu = useCallback((event: React.MouseEvent) => {
    event.preventDefault()
    setContextMenu({
      x: event.clientX,
      y: event.clientY,
    })
    const allPaths = new Set<string>()
    const collectPaths = (nodes: CategoryNode[]) => {
      nodes.forEach(node => {
        allPaths.add(node.path)
        collectPaths(node.children)
      })
    }
    collectPaths(categoryTree)
    setExpandedCategories(allPaths)
  }, [categoryTree])

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <div className="flex-1 flex overflow-hidden">
        <LeftSidebar />
        
        <div className="flex-1 relative">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            onContextMenu={onContextMenu}
            nodeTypes={nodeTypes}
            fitView
            //snapToGrid
            //snapGrid={[1, 1]}
            selectionMode={SelectionMode.Partial}
            defaultEdgeOptions={{
              type: 'smoothstep',
              animated: true,
              style: { stroke: '#3b82f6', strokeWidth: 2 },
            }}
          >
            <Background variant={BackgroundVariant.Lines} gap={15} size={1} />
            <Controls />
            <MiniMap 
              nodeColor={(node) => {
                if (node.type === 'start') return '#a855f7'
                return '#3b82f6'
              }}
              maskColor="rgb(0, 0, 0, 0.1)"
            />
            <Panel position="top-right" className="bg-background p-2 rounded border shadow-sm">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MousePointer2 className="w-4 h-4" />
                <span>Right-click to add nodes</span>
              </div>
            </Panel>
          </ReactFlow>

          {contextMenu && (
            <div
              className="fixed bg-background border rounded-lg shadow-lg py-2 z-50 min-w-45 max-h-96 overflow-y-auto"
              style={{ left: contextMenu.x, top: contextMenu.y }}
              onClick={() => setContextMenu(null)}
            >
              <div className="px-3 py-1.5 text-xs font-semibold text-muted-foreground">
                Add Node
              </div>
              <div className="border-t my-1" />
              <button
                className="w-full px-3 py-1.5 text-left text-sm hover:bg-accent flex items-center gap-2"
                onClick={() => {
                  addNode('start')
                  setContextMenu(null)
                }}
              >
                <span className="text-purple-500">▶</span> Static flow input / OEP
              </button>
              <div className="border-t my-1" />
              {categoryTree.map((node) => (
                <ContextMenuCategory
                  key={node.path}
                  node={node}
                  level={0}
                  expandedCategories={expandedCategories}
                  toggleCategory={toggleCategory}
                  addNode={addNode}
                  closeMenu={() => setContextMenu(null)}
                />
              ))}
            </div>
          )}
        </div>

        <RightSidebar />
      </div>
      
      <TerminalPanel />
      <Toaster />
    </div>
  )
}
