'use client'

import { useState, useEffect, useMemo } from 'react'
import { useFlowStore } from '@/hooks/use-flow'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Save, 
  FolderOpen, 
  Trash2, 
  Plus,
  Play,
  Loader2,
  ChevronDown,
  ChevronRight,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { buildCategoryTree } from '@/lib/category-tree'
import type { CategoryNode } from '@/types'

function CategoryItem({ 
  node, 
  level, 
  expandedCategories, 
  toggleCategory, 
  addNode 
}: { 
  node: CategoryNode
  level: number
  expandedCategories: Set<string>
  toggleCategory: (path: string) => void
  addNode: (type: 'function', functionName: string) => void
}) {
  const hasChildren = node.children.length > 0
  const hasFunctions = node.functions.length > 0
  const isExpanded = expandedCategories.has(node.path)
  const paddingLeft = level * 12

  return (
    <div>
      {(hasChildren || hasFunctions) && (
        <button
          onClick={() => toggleCategory(node.path)}
          className="w-full flex items-center gap-2 px-2 py-1.5 text-sm font-medium hover:bg-accent rounded transition-colors"
          style={{ paddingLeft: `${paddingLeft + 8}px` }}
        >
          {isExpanded ? (
            <ChevronDown className="w-3 h-3 flex-shrink-0" />
          ) : (
            <ChevronRight className="w-3 h-3 flex-shrink-0" />
          )}
          <span className="text-muted-foreground truncate">{node.name}</span>
          <span className="text-xs text-muted-foreground ml-auto flex-shrink-0">
            ({node.functions.length + node.children.length})
          </span>
        </button>
      )}
      
      {isExpanded && (
        <>
          {node.functions.map((func) => (
            <Button
              key={func.name}
              variant="outline"
              size="sm"
              className="w-full justify-start text-left h-auto py-1.5"
              style={{ marginLeft: `${paddingLeft + 16}px`, width: `calc(100% - ${paddingLeft + 16}px)` }}
              onClick={() => addNode('function', func.name)}
            >
              <span className="text-blue-500 mr-2 flex-shrink-0">◆</span>
              <div className="flex flex-col items-start min-w-0">
                <span className="font-medium text-xs truncate">{func.name}</span>
                <span className="text-xs text-muted-foreground truncate">
                  {func.parameters.map(p => p.name).join(', ') || 'No params'}
                </span>
              </div>
            </Button>
          ))}
          
          {node.children.map((child) => (
            <CategoryItem
              key={child.path}
              node={child}
              level={level + 1}
              expandedCategories={expandedCategories}
              toggleCategory={toggleCategory}
              addNode={addNode}
            />
          ))}
        </>
      )}
    </div>
  )
}

export function LeftSidebar() {
  const { 
    functions, 
    fetchFunctions, 
    addNode, 
    saveFlow, 
    loadFlow, 
    getSavedFlows, 
    deleteFlow,
    currentFlowName,
    executeFlow,
    isExecuting,
  } = useFlowStore()
  
  const [saveDialogOpen, setSaveDialogOpen] = useState(false)
  const [flowName, setFlowName] = useState('')
  const [savedFlows, setSavedFlows] = useState<{ name: string; createdAt: string }[]>([])
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchFunctions()
  }, [fetchFunctions])

  useEffect(() => {
    setSavedFlows(getSavedFlows())
  }, [getSavedFlows])

  const categoryTree = useMemo(() => {
    return buildCategoryTree(functions)
  }, [functions])

  useEffect(() => {
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

  const handleSave = () => {
    if (flowName.trim()) {
      saveFlow(flowName.trim())
      setSavedFlows(getSavedFlows())
      setSaveDialogOpen(false)
      setFlowName('')
      toast('Flow saved', { description: `"${flowName}" has been saved` })
    }
  }

  const handleLoad = (name: string) => {
    loadFlow(name)
    toast('Flow loaded', { description: `"${name}" has been loaded` })
  }

  const handleDelete = (name: string, e: React.MouseEvent) => {
    e.stopPropagation()
    deleteFlow(name)
    setSavedFlows(getSavedFlows())
    toast('Flow deleted', { description: `"${name}" has been deleted` })
  }

  return (
    <div className="w-64 border-r bg-background flex flex-col h-full">
      <div className="p-4 border-b">
        <h2 className="text-lg font-bold">Contextual-Liminal</h2>
        <p className="text-xs text-muted-foreground">Flow Editor</p>
      </div>
      
      <div className="p-4 space-y-4">
        <div className="flex gap-2">
          <Button 
            className="flex-1" 
            size="sm"
            onClick={() => setSaveDialogOpen(true)}
          >
            <Save className="w-4 h-4 mr-1" /> Save
          </Button>
          
          <Button 
            onClick={executeFlow} 
            disabled={isExecuting}
            className="flex-1" 
            size="sm"
            variant="secondary"
          >
            {isExecuting ? (
              <Loader2 className="w-4 h-4 mr-1 animate-spin" />
            ) : (
              <Play className="w-4 h-4 mr-1" />
            )}
            Run
          </Button>
        </div>
        
        {currentFlowName && (
          <p className="text-xs text-muted-foreground text-center">
            Current: {currentFlowName}
          </p>
        )}
      </div>

      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Flow</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <Input
              placeholder="Enter flow name"
              value={flowName}
              onChange={(e) => setFlowName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            />
            <Button onClick={handleSave} className="w-full">Save Flow</Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="px-4 py-2">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Node
          </h3>
        </div>
        
        <div className="flex-1 px-4 overflow-auto">
          <div className="space-y-2 pb-2">
            <Button
                variant="outline"
                className="w-full justify-start text-left h-auto py-2"
                onClick={() => addNode('start')}
            >
              <span className="text-purple-500 mr-2">▶</span>
              Static flow input / OEP
            </Button>
          </div>
          
          <div className="space-y-1 pb-4">
            {categoryTree.map((node) => (
              <CategoryItem
                key={node.path}
                node={node}
                level={0}
                expandedCategories={expandedCategories}
                toggleCategory={toggleCategory}
                addNode={addNode}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="border-t">
        <div className="p-4">
          <h3 className="text-sm font-semibold flex items-center gap-2 mb-2">
            <FolderOpen className="w-4 h-4" /> Saved Flows
          </h3>
        </div>
        <div className="h-[150px] overflow-auto px-4 pb-4">
          <div className="space-y-2">
            {savedFlows.length === 0 ? (
              <p className="text-xs text-muted-foreground">No saved flows</p>
            ) : (
              savedFlows.map((flow) => (
                <div
                  key={flow.name}
                  onClick={() => handleLoad(flow.name)}
                  className="flex items-center justify-between p-2 rounded hover:bg-accent cursor-pointer text-sm"
                >
                  <span className="truncate">{flow.name}</span>
                  <button
                    onClick={(e) => handleDelete(flow.name, e)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
