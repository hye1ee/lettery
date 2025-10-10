// Export all service classes
import PreviewBox from './previewBox'
import Cursor from './cursor';
import Logger from './logger';
import Zoom from './zoom';
import BoundingBox from './boundingBox';
import ContextMenu from './contextMenu';
import SyllableModal from './syllableModal';
import JamoModal from './jamoModal';

// Create and export singleton instances
export const previewBox = PreviewBox.getInstance();
export const cursor = Cursor.getInstance();
export const logger = Logger.getInstance();
export const zoom = Zoom.getInstance();
export const boundingBox = BoundingBox.getInstance();
export const contextMenu = ContextMenu.getInstance();
export const syllableModal = SyllableModal.getInstance();
export const jamoModal = JamoModal.getInstance();

// Export types
export type { ContextMenuItem } from './contextMenu';

