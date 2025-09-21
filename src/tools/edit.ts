import paper from 'paper'
import type { Tool } from './index'
import { cursor } from '../helpers';

export class EditTool implements Tool {
  private static instance: EditTool | null = null;

  readonly id: string = 'edit';
  readonly shortcut: string = 'e';
  readonly cursorStyle: string = 'default';

  activate(): void {
    cursor.updateCursor(this.cursorStyle);
    // TODO: Implement activate logic
  }

  deactivate(): void {
    cursor.resetCursor();
    // TODO: Implement deactivate logic
  }

  private constructor() { }

  static getInstance(): EditTool {
    if (!EditTool.instance) {
      EditTool.instance = new EditTool()
    }
    return EditTool.instance
  }

  onMouseDown = (event: paper.ToolEvent): void => {
    // TODO: Implement mouse down logic
  }

  onMouseMove = (event: paper.ToolEvent): void => {
    // TODO: Implement mouse move logic
  }

  onMouseUp = (event: paper.ToolEvent): void => {
    // TODO: Implement mouse up logic
  }

  onMouseDrag = (event: paper.ToolEvent): void => {
    // TODO: Implement mouse up logic
  }
}
