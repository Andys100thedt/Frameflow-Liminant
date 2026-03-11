export interface Parameter {
  name: string
  type: string
  has_default: boolean
  default?: string
}

export interface FunctionMetadata {
  name: string
  description: string
  parameters: Parameter[]
  return_type: string
}

export interface FunctionDefinition extends FunctionMetadata {
  id: string
}

export interface StartNodeData {
  label: string
  parameters: Record<string, string>
}

export interface FunctionNodeData {
  label: string
  functionName: string
  parameters: Record<string, string>
  func?: FunctionMetadata
  result?: string
  executed?: boolean
  error?: string
}

export interface ConnectionData {
  sourceParam?: string
}

export interface FlowNode {
  id: string
  type: 'start' | 'function'
  position: { x: number; y: number }
  data: StartNodeData | FunctionNodeData
}

export interface FlowEdge {
  id: string
  source: string
  target: string
  sourceHandle?: string
  targetHandle?: string
}

export interface SavedFlow {
  name: string
  createdAt: string
  nodes: FlowNode[]
  edges: FlowEdge[]
}

export interface ExecuteResponse {
  result: unknown
  success: boolean
  message: string
}

export interface LogEntry {
  id: string
  type: 'info' | 'success' | 'error' | 'command'
  message: string
  timestamp: Date
}
