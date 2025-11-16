// Export all helper classes
import PreviewBox from './previewBox'
import Cursor from './cursor';
import Logger from './logger';
import Zoom from './zoom';
import Grid from './grid';
import BoundingBox from './boundingBox';
import ContextMenu from './contextMenu';
import SyllableModal from './syllableModal';
import JamoModal from './jamoModal';
import ExportModal from './exportModal';
import FontLoader from './fontLoader';
import OpenAIClient from './openaiClient';
import Exporter from './exporter';
import FirebaseService from './firebaseService';

// Create and export singleton instances
export const previewBox = PreviewBox.getInstance();
export const cursor = Cursor.getInstance();
export const logger = Logger.getInstance();
export const zoom = Zoom.getInstance();
export const grid = Grid.getInstance();
export const boundingBox = BoundingBox.getInstance();
export const contextMenu = ContextMenu.getInstance();
export const syllableModal = SyllableModal.getInstance();
export const jamoModal = JamoModal.getInstance();
export const exportModal = ExportModal.getInstance();
export const fontLoader = FontLoader.getInstance();
export const openaiClient = OpenAIClient.getInstance();
export const exporter = Exporter.getInstance();
export const firebaseService = FirebaseService.getInstance();

// Export agent animation
export { agentAnimation } from './agentAnimation';

// Export types
export type { ContextMenuItem } from './contextMenu';

