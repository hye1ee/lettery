// Export all service classes
import CanvasService from './canvasService'
import ToolService from './toolService'
import UIService from './uiService'
import HistoryService from './historyService'
import ModelService from './modelService'

// Create and export singleton instances
export const canvasService = CanvasService.getInstance();
export const toolService = ToolService.getInstance();
export const uiService = UIService.getInstance();
export const historyService = HistoryService.getInstance();
export const modelService = ModelService.getInstance();
// Export types
export type { Layer, LayerAction, CanvasElement } from './uiService';

