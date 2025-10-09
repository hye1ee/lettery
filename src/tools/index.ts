
import SelectTool from './select';
import PencilTool from './pencil';
import PenTool from './pen';
import HandTool from './hand';
import EditTool from './edit';
import RectangleTool from './rectangle';
import EllipseTool from './ellipse';

export const pencilTool = PencilTool.getInstance();
export const penTool = PenTool.getInstance();
export const handTool = HandTool.getInstance();
export const editTool = EditTool.getInstance();
export const selectTool = SelectTool.getInstance();
export const rectangleTool = RectangleTool.getInstance();
export const ellipseTool = EllipseTool.getInstance();

export interface Tool {
  id: string;
  shortcut: string;
  cursorStyle: string;

  activate(): void;
  deactivate(): void;

  onMouseDown(event: paper.ToolEvent): void;
  onMouseMove(event: paper.ToolEvent): void;
  onMouseUp(event: paper.ToolEvent): void;
  onMouseDrag(event: paper.ToolEvent): void;
  onDoubleClick?(event: paper.ToolEvent): void;
  setToolSwitchCallback?(callback: (toolId: string) => void): void;
  setRenderCallback?(callback: () => void): void;
}