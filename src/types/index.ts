// Tool types
export type ToolType = 'select' | 'pencil' | 'pen' | 'hand'

// Tool configurations
export const TOOLS = {
  SELECT: 'select',
  PENCIL: 'pencil',
  PEN: 'pen',
  HAND: 'hand'
} as const

// Keyboard shortcuts
export const KEYBOARD_SHORTCUTS = {
  SELECT_TOOL: 'v',
  PENCIL_TOOL: 'p',
  PEN_TOOL: 'a',
  HAND_TOOL: 'h',
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
  currentDrawing: any | null
  currentPath: any | null
  selectedItems: any[] // Array of selected items
  selectedPoint: any | null
  dragOffset: any | null
  initialDragPositions: any[] // Store initial positions when starting drag
  isDragSelecting: boolean // Whether we're in drag selection mode
  dragSelectionStart: any | null // Starting point of drag selection
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




