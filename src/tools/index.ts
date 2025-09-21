export { PencilTool } from './pencil';
export { PenTool } from './pen';
export { SelectTool } from './select';
export { HandTool } from './hand';
export { EditTool } from './edit';

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
}