// Export all service classes
import PreviewBox from './previewBox'
import Cursor from './cursor';
import Logger from './logger';
import Zoom from './zoom';

// Create and export singleton instances
export const previewBox = PreviewBox.getInstance();
export const cursor = Cursor.getInstance();
export const logger = Logger.getInstance();
export const zoom = Zoom.getInstance();
// Export types

