'use client'

import { useState, useEffect } from 'react'
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
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'

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

  useEffect(() => {
    fetchFunctions()
  }, [fetchFunctions])

  useEffect(() => {
    setSavedFlows(getSavedFlows())
  }, [getSavedFlows])

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
        
        <div className="px-4 pb-2">
          <Button
            variant="outline"
            className="w-full justify-start text-left h-auto py-2"
            onClick={() => addNode('start')}
          >
            <span className="text-purple-500 mr-2">▶</span>
            Start (起始节点)
          </Button>
        </div>
        
        <div className="flex-1 overflow-auto px-4">
          <div className="space-y-2 pb-4">
            {functions.map((func) => (
              <Button
                key={func.name}
                variant="outline"
                className="w-full justify-start text-left h-auto py-2"
                onClick={() => addNode('function', func.name)}
              >
                <span className="text-blue-500 mr-2">◆</span>
                <div className="flex flex-col items-start">
                  <span className="font-medium">{func.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {func.parameters.map(p => p.name).join(', ') || 'No params'}
                  </span>
                </div>
              </Button>
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
