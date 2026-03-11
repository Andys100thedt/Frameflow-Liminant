import type { FunctionMetadata, ExecuteResponse } from '@/types'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'

async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  })

  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`)
  }

  return response.json()
}

export const api = {
  getFunctions: async (): Promise<{ functions: FunctionMetadata[] }> => {
    return fetchApi<{ functions: FunctionMetadata[] }>('/functions')
  },

  executeFunction: async (
    functionName: string,
    parameters: Record<string, unknown>
  ): Promise<ExecuteResponse> => {
    return fetchApi<ExecuteResponse>('/execute', {
      method: 'POST',
      body: JSON.stringify({
        function_name: functionName,
        parameters,
      }),
    })
  },
}
