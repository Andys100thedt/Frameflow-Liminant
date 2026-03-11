'use client'

import { useCallback, useEffect, useState } from 'react'
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
import { MousePointer2 } from 'lucide-react'

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

  useEffect(() => {
    fetchFunctions()
  }, [fetchFunctions])

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
  }, [])

  const { addNode, functions } = useFlowStore()

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
              className="fixed bg-background border rounded-lg shadow-lg py-2 z-50 min-w-[180px]"
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
                <span className="text-purple-500">▶</span> Start
              </button>
              {functions.map((func) => (
                <button
                  key={func.name}
                  className="w-full px-3 py-1.5 text-left text-sm hover:bg-accent flex items-center gap-2"
                  onClick={() => {
                    addNode('function', func.name)
                    setContextMenu(null)
                  }}
                >
                  <span className="text-blue-500">◆</span> {func.name}
                </button>
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
