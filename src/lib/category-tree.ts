import type { FunctionMetadata, CategoryNode } from '@/types'

export function buildCategoryTree(functions: FunctionMetadata[]): CategoryNode[] {
  const root: CategoryNode = {
    name: '',
    path: '',
    functions: [],
    children: []
  }

  functions.forEach(func => {
    const category = func.category || 'default'
    const parts = category.split('/').filter(Boolean)
    
    let current = root
    let currentPath = ''
    
    parts.forEach((part) => {
      currentPath = currentPath ? `${currentPath}/${part}` : part
      
      let child = current.children.find(c => c.name === part)
      if (!child) {
        child = {
          name: part,
          path: currentPath,
          functions: [],
          children: []
        }
        current.children.push(child)
      }
      
      current = child
    })
    
    current.functions.push(func)
  })

  return sortCategoryTree(root.children)
}

function sortCategoryTree(nodes: CategoryNode[]): CategoryNode[] {
  return nodes
    .map(node => ({
      ...node,
      children: sortCategoryTree(node.children),
      functions: node.functions.sort((a, b) => a.name.localeCompare(b.name))
    }))
    .sort((a, b) => a.name.localeCompare(b.name))
}

export function flattenCategoryTree(nodes: CategoryNode[], level = 0): Array<{ node: CategoryNode; level: number }> {
  const result: Array<{ node: CategoryNode; level: number }> = []
  
  nodes.forEach(node => {
    result.push({ node, level })
    result.push(...flattenCategoryTree(node.children, level + 1))
  })
  
  return result
}
