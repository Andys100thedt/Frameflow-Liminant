'use client'

import { memo, useState, useCallback } from 'react'
import { Handle, Position } from '@xyflow/react'
import { FunctionNodeData } from '@/types'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import LCCard from '@/components/imported/legacy-styled-code-card'

function FunctionNode({ data, selected }: { data: FunctionNodeData; selected?: boolean }) {
  const [params, setParams] = useState<Record<string, string>>(data.parameters || {})

  const handleParamChange = useCallback((paramName: string, value: string) => {
    setParams(prev => ({ ...prev, [paramName]: value }))
  }, [])

  const paramKeys = Object.keys(params)
  /*
  return (
    <Card className={`min-w-[220px] border-2 ${
      selected ? 'border-blue-500 shadow-lg' : 'border-blue-400'
    } bg-background`}>
      <CardHeader className="p-3 pb-2">
        <CardTitle className="text-sm font-semibold text-blue-600 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <span>◆</span> {data.label}
          </span>
          {data.executed && (
            <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
              ✓
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 pt-0 space-y-2">
          <span className={"grid"}><p className={""}>{data.func?.return_type}</p><p className="text-2xl font-jetbrains-monof text-muted-foreground mb-2">{data.functionName}(</p></span>
        
        {paramKeys.length > 0 && (
          <div className="space-y-1">
            {paramKeys.map((key,idx) => (
              <div key={key} className="relative">
                <Handle
                  type="target"
                  position={Position.Left}
                  id={key}
                  className="!bg-blue-500 !w-3 !h-3 !-left-1.5"
                />
                <div className="flex flex-col gap-1 pl-2">
                  <Label className="text-xs text-muted-foreground">{key}: {data.func?.parameters[idx].type}</Label>
                </div>
              </div>
            ))}
          </div>
        )}

        {paramKeys.length === 0 && (
          <>
            <Handle
              type="target"
              position={Position.Left}
              className="!bg-blue-500 !w-3 !h-3"
            />
            <p className="text-xs text-muted-foreground">No parameters</p>
          </>
        )}
        
        {data.result && (
          <div className="mt-2 p-2 bg-green-50 rounded text-xs">
            <span className="text-green-700">Result: </span>
            <span className="text-green-800">{String(data.result)}</span>
          </div>
        )}
        {data.error && (
          <div className="mt-2 p-2 bg-red-50 rounded text-xs">
            <span className="text-red-700">Error: </span>
            <span className="text-red-800">{data.error}</span>
          </div>
        )}
      </CardContent>
      <Handle
        type="source"
        position={Position.Right}
        className="!bg-green-500 !w-3 !h-3"
      />
    </Card>
  )*/
  return <LCCard func={data.func} ></LCCard>
}

export default memo(FunctionNode)
