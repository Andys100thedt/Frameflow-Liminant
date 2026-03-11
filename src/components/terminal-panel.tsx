'use client'

import { useEffect, useRef } from 'react'
import { useFlowStore } from '@/hooks/use-flow'
import { Button } from '@/components/ui/button'
import { ChevronUp, ChevronDown, Trash2, Terminal } from 'lucide-react'
import { useState } from 'react'

export function TerminalPanel() {
  const { logs, clearLogs } = useFlowStore()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [logs])

  return (
    <div className={`border-t bg-background transition-all ${
      isCollapsed ? 'h-10' : 'h-48'
    }`}>
      <div 
        className="flex items-center justify-between px-4 py-2 border-b bg-zinc-950"
      >
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-zinc-400" />
          <span className="text-sm text-zinc-400 font-medium">Terminal</span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={clearLogs}
            className="h-6 w-6 text-zinc-400 hover:text-zinc-100"
          >
            <Trash2 className="w-3 h-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="h-6 w-6 text-zinc-400 hover:text-zinc-100"
          >
            {isCollapsed ? (
              <ChevronUp className="w-3 h-3" />
            ) : (
              <ChevronDown className="w-3 h-3" />
            )}
          </Button>
        </div>
      </div>
      
      {!isCollapsed && (
        <div 
          ref={scrollRef}
          className="h-[calc(100%-40px)] overflow-auto p-2 font-mono text-sm bg-zinc-950"
        >
          {logs.length === 0 ? (
            <span className="text-zinc-600">No logs yet...</span>
          ) : (
            logs.map((log) => (
              <div 
                key={log.id} 
                className={`mb-1 ${
                  log.type === 'error' ? 'text-red-400' :
                  log.type === 'success' ? 'text-green-400' :
                  log.type === 'command' ? 'text-yellow-400' :
                  'text-zinc-300'
                }`}
              >
                <span className="text-zinc-600 mr-2">
                  [{log.timestamp.toLocaleTimeString()}]
                </span>
                {log.type === 'command' && <span className="mr-1">$</span>}
                {log.message}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
