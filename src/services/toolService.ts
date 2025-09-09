import type { ToolType } from '../types'
import { TOOLS, KEYBOARD_SHORTCUTS } from '../types'

class ToolService {
  private static instance: ToolService | null = null
  private currentTool: ToolType = TOOLS.SELECT

  private constructor() { }

  /**
   * Get the singleton instance
   */
  static getInstance(): ToolService {
    if (!ToolService.instance) {
      ToolService.instance = new ToolService()
    }
    return ToolService.instance
  }

  /**
   * Get current tool
   */
  getCurrentTool(): ToolType {
    return this.currentTool
  }

  /**
   * Switch to a different tool
   */
  switchTool(tool: ToolType): void {
    this.currentTool = tool
  }

  /**
   * Check if a specific tool is active
   */
  isToolActive(tool: ToolType): boolean {
    return this.currentTool === tool
  }

  /**
   * Get tool name for display
   */
  getToolName(tool: ToolType): string {
    switch (tool) {
      case TOOLS.SELECT:
        return 'Select Tool'
      case TOOLS.PEN:
        return 'Pen Tool'
      case TOOLS.ADD_POINT:
        return 'Add Point Tool'
      default:
        return 'Unknown Tool'
    }
  }

  /**
   * Get tool description
   */
  getToolDescription(tool: ToolType): string {
    switch (tool) {
      case TOOLS.SELECT:
        return 'Select and manipulate paths and points'
      case TOOLS.PEN:
        return 'Draw freehand vector paths'
      case TOOLS.ADD_POINT:
        return 'Add control points to existing paths'
      default:
        return 'Unknown tool functionality'
    }
  }

  /**
   * Get keyboard shortcut for a tool
   */
  getToolShortcut(tool: ToolType): string {
    switch (tool) {
      case TOOLS.SELECT:
        return KEYBOARD_SHORTCUTS.SELECT_TOOL.toUpperCase()
      case TOOLS.PEN:
        return KEYBOARD_SHORTCUTS.PEN_TOOL.toUpperCase()
      case TOOLS.ADD_POINT:
        return KEYBOARD_SHORTCUTS.ADD_POINT_TOOL.toUpperCase()
      default:
        return ''
    }
  }

  /**
   * Get cursor style for a tool
   */
  getToolCursor(tool: ToolType): string {
    switch (tool) {
      case TOOLS.SELECT:
        return 'default'
      case TOOLS.PEN:
        return 'crosshair'
      case TOOLS.ADD_POINT:
        return 'pointer'
      default:
        return 'default'
    }
  }

  /**
   * Handle keyboard shortcut
   */
  handleKeyboardShortcut(key: string): ToolType | null {
    const lowerKey = key.toLowerCase()

    switch (lowerKey) {
      case KEYBOARD_SHORTCUTS.SELECT_TOOL:
        return TOOLS.SELECT
      case KEYBOARD_SHORTCUTS.PEN_TOOL:
        return TOOLS.PEN
      case KEYBOARD_SHORTCUTS.ADD_POINT_TOOL:
        return TOOLS.ADD_POINT
      default:
        return null
    }
  }

  /**
   * Get all available tools
   */
  getAllTools(): ToolType[] {
    return [TOOLS.SELECT, TOOLS.PEN, TOOLS.ADD_POINT]
  }

  /**
   * Get tool icon name (for UI)
   */
  getToolIcon(tool: ToolType): string {
    switch (tool) {
      case TOOLS.SELECT:
        return 'cursor-pointer'
      case TOOLS.PEN:
        return 'pen'
      case TOOLS.ADD_POINT:
        return 'plus-circle'
      default:
        return 'question-mark'
    }
  }

  /**
   * Validate tool type
   */
  isValidTool(tool: string): tool is ToolType {
    return Object.values(TOOLS).includes(tool as ToolType)
  }
}

export default ToolService;



