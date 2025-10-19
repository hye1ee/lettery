/**
 * Exports singleton instances of all application services
 */
import CanvasService from './canvasService'
import ToolService from './toolService'
import UIService from './uiService'
import HistoryService from './historyService'
import AgentService from './agentService'

// Create and export singleton instances
export const canvasService = CanvasService.getInstance();
export const toolService = ToolService.getInstance();
export const uiService = UIService.getInstance();
export const historyService = HistoryService.getInstance();
export const agentService = AgentService.getInstance();
// Export types
export type { Layer, LayerAction, CanvasElement } from './uiService';

