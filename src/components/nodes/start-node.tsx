'use client'

import { memo, useState, useCallback } from 'react'
import { Handle, Position } from '@xyflow/react'
import { StartNodeData } from '@/types'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import LICard from "@/components/imported/legacy-styled-input-card";

function StartNode({ data, selected }: { data: StartNodeData; selected?: boolean }) {
  const [params, setParams] = useState<Record<string, string>>(data.parameters || {})

  const handleParamChange = useCallback((paramName: string, value: string) => {
    setParams(prev => ({ ...prev, [paramName]: value }))
  }, [])
  /*
  return (
    <Card className={`min-w-20 border-2 ${
      selected ? 'border-purple-500 shadow-lg' : 'border-purple-400'
    } bg-background`}>
      <CardContent className="">
        <CardTitle className="text-sm font-semibold text-purple-600 flex">
          <span>▶</span> {data.label}
        </CardTitle>
      </CardContent>
      <Handle
        type="source"
        position={Position.Right}
        className="!bg-purple-500 !w-3 !h-3"
      />
    </Card>
  )*/
  return (
      <LICard data={data}></LICard>
  )
}

export default memo(StartNode)
