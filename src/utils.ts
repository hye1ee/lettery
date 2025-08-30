// This file now serves as a legacy compatibility layer
// All functionality has been moved to dedicated service classes

// Re-export everything from the services index
export * from './services'

// Re-export types and constants for convenience
export type { ToolType, AppState, DrawingState, CanvasConfig, CanvasEventHandlers, FileOperationResult } from './types'
export { STATUS_MESSAGES, ERROR_MESSAGES, TOOLS, KEYBOARD_SHORTCUTS } from './types'
export { COLORS, CANVAS_CONFIG, DRAWING_CONFIG } from './constants' 