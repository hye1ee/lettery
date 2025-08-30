// Export all service classes
import CanvasService from './canvasService'
import DrawingService from './drawingService'
import ToolService from './toolService'
import UIService from './uiService'

// Create and export singleton instances
export const canvasService = CanvasService.getInstance();
export const drawingService = DrawingService.getInstance();
export const toolService = ToolService.getInstance();
export const uiService = UIService.getInstance();