# Contextual-Liminal (Frameflow-Liminant) 项目文档

## 项目概述

**Contextual-Liminal**（也称为 Frameflow-Liminant）是一个前后端本地全栈应用，基于 Next.js Web App 模板和 Python FastAPI 框架构建。该系统允许用户通过图形化界面管理函数间的执行逻辑，并直接在网页端调用本地后端框架注册的任意函数。

### 核心特性

- **图形化节点编辑器**：支持拖拽创建函数节点，支持节点间连接和数据流定义
- **函数注册与发现**：后端支持注册任意函数，前端能够自动发现并获取函数元数据
- **函数调用执行**：前端能够调用后端函数，支持任意参数类型和返回值类型
- **本地通信机制**：实现前后端本地 HTTP 通信，支持跨域请求处理
- **流程执行管理**：支持单个函数执行和整个流程顺序执行
- **数据持久化**：支持流程的保存、加载和删除

---

## 技术栈

### 前端技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| Next.js | 16.1.6 | React 全栈框架 |
| React | 19.2.3 | UI 组件库 |
| TypeScript | ^5 | 类型安全 |
| ReactFlow (@xyflow/react) | ^12.10.1 | 图形化流程编辑器 |
| Zustand | ^5.0.11 | 状态管理 |
| shadcn/ui | ^4.0.2 | UI 组件库 |
| Tailwind CSS | ^4 | CSS 框架 |
| styled-components | ^6.3.11 | CSS-in-JS 样式方案 |
| Lucide React | ^0.577.0 | 图标库 |
| Sonner | ^2.0.7 | Toast 通知 |

### 后端技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| Python | 3.14+ | 后端编程语言 |
| FastAPI | - | Web 框架 |
| Uvicorn | - | ASGI 服务器 |
| Pydantic | - | 数据验证 |

---

## 项目结构

```
Frameflow-Liminant/
├── backend/                    # 后端服务
│   └── app.py                 # FastAPI 应用主文件
├── src/                       # 前端源代码
│   ├── app/                   # Next.js App Router
│   │   ├── favicon.ico
│   │   ├── globals.css        # 全局样式
│   │   ├── layout.tsx         # 根布局组件
│   │   └── page.tsx           # 主页面组件
│   ├── components/            # React 组件
│   │   ├── imported/          # 导入的遗留组件
│   │   │   ├── legacy-styled-code-card.tsx    # 函数节点卡片（Windows 95 风格）
│   │   │   └── legacy-styled-input-card.tsx   # 输入节点卡片（Windows 95 风格）
│   │   ├── nodes/             # 流程节点组件
│   │   │   ├── function-node.tsx              # 函数节点组件
│   │   │   └── start-node.tsx                 # 起始节点组件
│   │   ├── ui/                # UI 基础组件（shadcn/ui）
│   │   │   ├── badge.tsx
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   ├── input.tsx
│   │   │   ├── label.tsx
│   │   │   ├── sonner.tsx
│   │   │   └── textarea.tsx
│   │   ├── example-card.tsx   # 示例卡片组件
│   │   ├── left-sidebar.tsx   # 左侧边栏组件
│   │   ├── node-types.ts      # 节点类型定义
│   │   ├── right-sidebar.tsx  # 右侧边栏组件
│   │   └── terminal-panel.tsx # 终端面板组件
│   ├── constants/             # 常量定义
│   │   └── index.ts           # 应用常量
│   ├── hooks/                 # 自定义 Hooks
│   │   ├── use-example.ts     # 示例 Hook
│   │   └── use-flow.ts        # 流程管理状态 Hook（核心）
│   ├── lib/                   # 工具库
│   │   └── utils.ts           # 工具函数
│   ├── services/              # API 服务
│   │   └── api.ts             # 后端 API 调用封装
│   └── types/                 # TypeScript 类型定义
│       └── index.ts           # 全局类型定义
├── public/                    # 静态资源
├── docs/                      # 文档目录
│   └── doc.md                 # 本文档
├── package.json               # NPM 配置
├── next.config.ts             # Next.js 配置
├── tsconfig.json              # TypeScript 配置
├── tailwind.config            # Tailwind CSS 配置
├── postcss.config.mjs         # PostCSS 配置
├── components.json            # shadcn/ui 配置
├── eslint.config.mjs          # ESLint 配置
├── protoplan.md               # 项目最初框架设想文档
└── README.md                  # 项目说明文档
```

---

## 核心功能实现

### 1. 后端服务实现

#### 1.1 函数注册机制

后端使用 Python 装饰器实现函数注册功能，通过反射机制获取函数元数据：

**文件位置**: [backend/app.py](../backend/app.py)

**核心代码**:

```python
def register_function(func: Callable = None, *, name: Optional[str] = None, description: str = ""):
    def decorator(f: Callable) -> Callable:
        sig = inspect.signature(f)
        func_name = name or f.__name__
        
        parameters = []
        for param_name, param in sig.parameters.items():
            param_info = {
                "name": param_name,
                "type": str(param.annotation) if param.annotation != inspect.Parameter.empty else "Any",
                "has_default": param.default != inspect.Parameter.empty,
            }
            if param.default != inspect.Parameter.empty:
                param_info["default"] = param.default
            parameters.append(param_info)
        
        return_type = "Any"
        if sig.return_annotation != inspect.Signature.empty:
            return_type = str(sig.return_annotation)
        
        registered_functions[func_name] = {
            "name": func_name,
            "description": description or f.__doc__ or "",
            "parameters": parameters,
            "return_type": return_type,
            "function": f
        }
        
        return f
    
    if func is None:
        return decorator
    return decorator(func)
```

**使用示例**:

```python
@register_function(description="Add two numbers")
def add(a: int, b: int) -> int:
    return a + b
```

#### 1.2 API 端点

| 端点 | 方法 | 描述 | 请求体 | 响应体 |
|------|------|------|--------|--------|
| `/` | GET | 根路径健康检查 | - | `{"message": "Contextual-Liminal API Server"}` |
| `/functions` | GET | 获取所有注册函数 | - | `{"functions": [FunctionMetadata]}` |
| `/execute` | POST | 执行指定函数 | `{"function_name": string, "parameters": object}` | `ExecuteResponse` |

**数据模型**:

```python
class FunctionMetadata(BaseModel):
    name: str
    description: str
    parameters: List[Dict[str, Any]]
    return_type: str

class ExecuteRequest(BaseModel):
    function_name: str
    parameters: Dict[str, Any]

class ExecuteResponse(BaseModel):
    result: Any
    success: bool
    message: str
```

#### 1.3 预置函数

系统预置了以下函数供测试：

| 函数名 | 参数 | 返回类型 | 描述 |
|--------|------|----------|------|
| `cast_to_int` | `objectt: Any` | `int` | 将对象转换为整数 |
| `cast_to_str` | `objectt: Any` | `str` | 将对象转换为字符串 |
| `cast_to_float` | `objectt: Any` | `float` | 将对象转换为浮点数 |
| `add` | `a: int, b: int` | `int` | 两数相加 |
| `multiply` | `a: int, b: int` | `int` | 两数相乘 |
| `greet` | `name: str` | `str` | 问候函数 |
| `to_uppercase` | `text: str` | `str` | 转换为大写 |
| `string_length` | `text: str` | `int` | 获取字符串长度 |

---

### 2. 前端应用实现

#### 2.1 状态管理

**文件位置**: [src/hooks/use-flow.ts](../src/hooks/use-flow.ts)

使用 Zustand 进行全局状态管理，主要状态包括：

```typescript
interface FlowState {
  nodes: Node[]                           // 流程节点数组
  edges: Edge[]                           // 节点连接边数组
  functions: FunctionMetadata[]           // 后端注册的函数列表
  logs: LogEntry[]                        // 执行日志
  selectedNode: string | null             // 当前选中的节点 ID
  isExecuting: boolean                    // 是否正在执行流程
  currentFlowName: string | null          // 当前流程名称
}
```

**核心方法**:

| 方法 | 描述 |
|------|------|
| `addNode(type, functionName)` | 添加新节点到画布 |
| `removeNode(nodeId)` | 删除节点及其连接 |
| `updateNodeData(nodeId, data)` | 更新节点数据 |
| `executeNode(nodeId)` | 执行单个函数节点 |
| `executeFlow()` | 执行整个流程（拓扑排序） |
| `saveFlow(name)` | 保存流程到 localStorage |
| `loadFlow(name)` | 从 localStorage 加载流程 |
| `deleteFlow(name)` | 删除已保存的流程 |

#### 2.2 图形化节点编辑器

**文件位置**: [src/app/page.tsx](../src/app/page.tsx)

采用 ReactFlow 库实现拖拽式节点编辑器，支持：

- **节点拖拽移动**：自由拖动节点位置
- **节点间连接**：从输出连接点拖拽至输入连接点
- **缩放和平移**：支持画布缩放和拖动
- **流程图自动布局**：自动适应视图
- **右键菜单**：右键点击画布添加节点
- **小地图**：右下角显示流程缩略图

**默认边配置**:

```typescript
defaultEdgeOptions={{
  type: 'smoothstep',
  animated: true,
  style: { stroke: '#3b82f6', strokeWidth: 2 },
}}
```

#### 2.3 节点类型设计

##### FunctionNode（函数节点）

**文件位置**: [src/components/nodes/function-node.tsx](../src/components/nodes/function-node.tsx)

**特性**:
- 使用 Windows 95 风格的代码编辑器卡片样式
- 左侧输入连接点（蓝色），每个参数对应一个连接点
- 右侧输出连接点（绿色）
- 显示函数名称、参数列表和返回类型
- 执行后显示结果或错误信息

**视觉设计**:
- 采用 Windows 95 复古风格的代码编辑器外观
- 包含行号、语法高亮
- 可调整大小（resize: both）

##### StartNode（起始节点）

**文件位置**: [src/components/nodes/start-node.tsx](../src/components/nodes/start-node.tsx)

**特性**:
- 使用 Windows 95 风格的代码编辑器卡片样式
- 右侧输出连接点（绿色）
- 用于定义流程的初始参数
- 显示当前输入值

#### 2.4 连接逻辑

- 使用 `smoothstep` 类型边
- 带动画效果
- 蓝色线条表示数据流向
- 从输出连接点拖拽至输入连接点完成连接
- 支持参数级别的精确连接（通过 Handle ID）

#### 2.5 执行流程

**拓扑排序算法**:

```typescript
function topologicalSort(nodes: Node[], edges: Edge[]): Node[] {
  const nodeMap = new Map(nodes.map(n => [n.id, n]))
  const inDegree = new Map<string, number>()
  const adjacency = new Map<string, string[]>()
  
  nodes.forEach(n => {
    inDegree.set(n.id, 0)
    adjacency.set(n.id, [])
  })
  
  edges.forEach(e => {
    const current = inDegree.get(e.target) || 0
    inDegree.set(e.target, current + 1)
    adjacency.get(e.source)?.push(e.target)
  })
  
  const queue: string[] = []
  inDegree.forEach((degree, id) => {
    if (degree === 0) queue.push(id)
  })
  
  const sorted: Node[] = []
  while (queue.length > 0) {
    const id = queue.shift()!
    const node = nodeMap.get(id)
    if (node) sorted.push(node)
    adjacency.get(id)?.forEach(target => {
      const newDegree = (inDegree.get(target) || 0) - 1
      inDegree.set(target, newDegree)
      if (newDegree === 0) queue.push(target)
    })
  }
  
  return sorted
}
```

**执行步骤**:

1. 拓扑排序确定执行顺序
2. 从 StartNode 开始依次执行
3. 前一个节点的输出作为后一个节点的输入
4. 实时更新节点执行状态
5. 在终端面板显示执行日志

---

### 3. 用户界面设计

#### 3.1 布局结构

```
+------------------+------------------------------------------+------------------+
|                  |                                          |                  |
|   左侧菜单栏     |           中间流程图区域                 |   右侧配置面板   |
|                  |                                          |                  |
|  - 系统标题      |  +--------+       +--------+            |  - 节点名称     |
|  - 保存/运行按钮 |  | Start  |------>|  add   |            |  - 参数配置     |
|  - 已保存流程    |  +--------+       +--------+            |  - 执行结果     |
|  - 添加节点列表  |                                          |  - 错误信息     |
|                  |                                          |                  |
+------------------+------------------------------------------+------------------+
|                      底部终端（可折叠）                       |
+------------------------------------------------------------------+
```

#### 3.2 左侧边栏（LeftSidebar）

**文件位置**: [src/components/left-sidebar.tsx](../src/components/left-sidebar.tsx)

**功能**:
- 显示应用标题
- 保存流程按钮（弹出对话框输入流程名称）
- 运行流程按钮（执行整个流程）
- 显示当前流程名称
- 添加节点列表：
  - Start 节点（静态流输入）
  - 所有后端注册的函数节点
- 已保存流程列表（支持加载和删除）

#### 3.3 右侧边栏（RightSidebar）

**文件位置**: [src/components/right-sidebar.tsx](../src/components/right-sidebar.tsx)

**功能**:
- 显示选中节点的配置信息
- 节点类型显示
- 参数配置：
  - 无连接：可直接在输入框填写参数
  - 有连接：输入框禁用，显示"参数将从连接节点获取"
- 执行结果展示
- 错误信息展示
- 执行单个函数按钮
- 删除节点按钮

#### 3.4 终端面板（TerminalPanel）

**文件位置**: [src/components/terminal-panel.tsx](../src/components/terminal-panel.tsx)

**功能**:
- 终端风格设计（深色背景）
- 可折叠/展开
- 显示执行日志，带有时间戳
- 支持不同日志类型（info、success、error、command）
- 清空日志按钮

**日志类型**:
- `info`: 普通信息（白色）
- `success`: 成功信息（绿色）
- `error`: 错误信息（红色）
- `command`: 命令提示（黄色，带 `$` 前缀）

#### 3.5 交互设计

- **右键菜单**：在画布空白处右键点击，弹出添加节点菜单
- **节点选择**：点击节点时自动选中，显示在右侧配置面板
- **节点拖拽**：支持拖拽移动节点位置
- **连接创建**：从输出连接点拖拽至输入连接点
- **参数配置**：在右侧面板配置节点参数

---

### 4. 数据持久化

#### 4.1 流程保存

**存储位置**: 浏览器 localStorage

**存储键**: `frameflow_flows`

**保存内容**:
```typescript
interface SavedFlow {
  name: string              // 流程名称
  createdAt: string         // 创建时间（ISO 字符串）
  nodes: FlowNode[]         // 节点数组
  edges: FlowEdge[]         // 边数组
}
```

**特性**:
- 支持覆盖同名流程
- 自动保存创建时间
- 完整保存节点和连接状态

#### 4.2 流程加载

- 从 localStorage 读取已保存流程
- 完整恢复节点和连接状态
- 自动更新当前流程名称

---

## 类型定义

**文件位置**: [src/types/index.ts](../src/types/index.ts)

### 核心类型

```typescript
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
```

---

## API 服务

**文件位置**: [src/services/api.ts](../src/services/api.ts)

### API 基础配置

```typescript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'
```

### API 方法

```typescript
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
```

---

## 常量定义

**文件位置**: [src/constants/index.ts](../src/constants/index.ts)

```typescript
export const APP_NAME = 'Contextual-Liminal'

export const ROUTES = {
  HOME: '/',
} as const

export const STORAGE_KEYS = {
  FLOWS: 'frameflow_flows',
  CURRENT_FLOW: 'frameflow_current_flow',
} as const

export const API_BASE_URL = 'http://127.0.0.1:8000'
```

---

## 开发指南

### 环境要求

- Node.js 18+
- Python 3.14+
- npm 或 yarn 或 pnpm

### 安装依赖

**前端依赖**:
```bash
npm install
```

**后端依赖**:
```bash
pip install fastapi uvicorn pydantic
```

### 启动开发服务器

**启动后端服务**:
```bash
cd backend
python app.py
```

后端服务将运行在 `http://127.0.0.1:8000`

**启动前端服务**:
```bash
npm run dev
```

前端服务将运行在 `http://localhost:3000`

### 构建生产版本

```bash
npm run build
npm start
```

### 代码检查

```bash
npm run lint
```

---

## 使用指南

### 创建流程步骤

1. **添加起始节点**：
   - 在左侧边栏点击"Static flow input / OEP"按钮
   - 或在画布空白处右键，选择"Start"

2. **添加函数节点**：
   - 在左侧边栏点击所需函数节点
   - 或在画布空白处右键，选择函数名称

3. **连接节点**：
   - 从 Start 节点右侧的绿色连接点拖拽
   - 连接到函数节点左侧的蓝色参数连接点

4. **配置参数**：
   - 点击节点选中
   - 在右侧配置面板设置参数值
   - 如果参数已连接，将自动从连接节点获取值

5. **执行流程**：
   - 点击左侧边栏的"Run"按钮执行整个流程
   - 或在右侧配置面板点击"Execute Function"执行单个函数

6. **保存流程**：
   - 点击左侧边栏的"Save"按钮
   - 输入流程名称并保存

### 添加新函数

在后端 [backend/app.py](../backend/app.py) 中使用装饰器注册：

```python
@register_function(description="自定义函数描述")
def my_function(param1: str, param2: int) -> dict:
    """自定义函数"""
    return {"result": f"{param1} - {param2}"}
```

重启后端服务后，前端将自动发现新函数。

---

## 架构设计亮点

### 1. 前后端分离架构

- 前端使用 Next.js + React，提供现代化的用户界面
- 后端使用 FastAPI，提供高性能的 API 服务
- 通过 HTTP REST API 进行通信，支持跨域请求

### 2. 函数注册机制

- 使用 Python 装饰器和反射机制，实现函数的自动注册
- 自动提取函数元数据（参数、类型、返回值）
- 支持自定义函数名称和描述

### 3. 图形化流程编辑

- 使用 ReactFlow 实现拖拽式节点编辑器
- 支持节点级别的精确连接（通过 Handle ID）
- 拓扑排序确保流程执行顺序正确

### 4. 状态管理

- 使用 Zustand 进行轻量级状态管理
- 集中管理节点、边、函数列表、日志等状态
- 提供清晰的状态更新方法

### 5. 数据持久化

- 使用 localStorage 进行本地持久化
- 支持流程的保存、加载、删除
- 完整保存流程状态，支持恢复

### 6. 视觉设计

- 采用 Windows 95 复古风格的代码编辑器卡片
- 使用 styled-components 实现复杂的样式效果
- 提供良好的用户体验和视觉反馈

---

## 未来改进方向

1. **功能增强**:
   - 支持更多节点类型（条件节点、循环节点等）
   - 支持异步函数执行
   - 支持函数的批量导入导出
   - 支持流程的版本管理

2. **性能优化**:
   - 大型流程的性能优化
   - 节点渲染优化（虚拟化）
   - 状态更新的性能优化

3. **用户体验**:
   - 撤销/重做功能
   - 节点搜索功能
   - 流程模板功能
   - 节点分组功能

4. **安全性**:
   - 函数执行的权限控制
   - 参数验证和类型检查
   - 错误处理的完善

5. **扩展性**:
   - 支持插件系统
   - 支持自定义节点类型
   - 支持第三方函数库

---

## 常见问题

### Q: 后端服务无法启动？

A: 请确保已安装所有依赖：
```bash
pip install fastapi uvicorn pydantic
```

### Q: 前端无法连接后端？

A: 请检查：
1. 后端服务是否已启动（访问 http://127.0.0.1:8000）
2. 后端是否配置了 CORS（已在 app.py 中配置）
3. 防火墙是否阻止了连接

### Q: 函数执行失败？

A: 请检查：
1. 函数是否已正确注册（使用 `@register_function` 装饰器）
2. 参数类型是否正确
3. 查看终端面板的错误日志

### Q: 流程无法保存？

A: 请检查：
1. 浏览器是否支持 localStorage
2. localStorage 是否已满
3. 是否有隐私模式限制

---

## 贡献指南

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

---

## 许可证

本项目为私有项目，仅供团队内部使用。

---

## 联系方式

如有问题或建议，请联系项目维护团队。

---

**文档版本**: 1.0.0  
**最后更新**: 2026-03-12  
**维护者**: Contextual-Liminal 开发团队
