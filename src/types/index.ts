// Tool types
export type ToolType = 'select' | 'pen' | 'addPoint'

// Tool configurations
export const TOOLS = {
  SELECT: 'select',
  PEN: 'pen',
  ADD_POINT: 'addPoint'
} as const

// Keyboard shortcuts
export const KEYBOARD_SHORTCUTS = {
  SELECT_TOOL: 'v',
  PEN_TOOL: 'p',
  ADD_POINT_TOOL: 'a',
  ESCAPE: 'escape'
} as const

// Application state
export interface AppState {
  currentTool: ToolType
  isDrawing: boolean
  isPaperJSInitialized: boolean
}

// Drawing state
export interface DrawingState {
  currentPath: any | null
  selectedPath: any | null
  selectedPoint: any | null
}

// Canvas configuration
export interface CanvasConfig {
  dotSize: number
  dotSpacing: number
  backgroundColor: string
  dotColor: string
}

// Event handlers
export interface CanvasEventHandlers {
  onMouseDown: (event: any) => void
  onMouseDrag: (event: any) => void
  onMouseUp: (event: any) => void
  onMouseMove: (event: any) => void
}

// File operations
export interface FileOperationResult {
  success: boolean
  message: string
  error?: Error
  data?: string
}
