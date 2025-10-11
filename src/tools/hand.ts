import paper from 'paper'
import type { Tool } from '../types'
import { cursor, logger } from '../helpers';

export default class HandTool implements Tool {
  private static instance: HandTool | null = null;

  readonly id: string = 'hand';
  readonly shortcut: string = 'h';
  readonly cursorStyle: string = 'grab';

  private panPoint: paper.Point | null = null;

  activate(): void {
    cursor.updateCursor(this.cursorStyle);
    // TODO: Implement activate logic
  }

  deactivate(): void {
    cursor.resetCursor();
    // TODO: Implement deactivate logic
  }

  private constructor() { }

  static getInstance(): HandTool {
    if (!HandTool.instance) {
      HandTool.instance = new HandTool()
    }
    return HandTool.instance
  }

  onMouseDown = (event: paper.ToolEvent): void => {
    logger.updateStatus('start panning');
    cursor.updateCursor('grabbing');

    this.panPoint = event.point.clone();
  }

  onMouseMove = (event: paper.ToolEvent): void => {
    // TODO: Implement mouse move logic
  }

  onMouseUp = (event: paper.ToolEvent): void => {
    logger.updateStatus('end panning');
    cursor.updateCursor(this.cursorStyle);

    this.panPoint = null;
  }

  onMouseDrag = (event: paper.ToolEvent): void => {
    const view = paper.project.view;
    if (!this.panPoint || !view) return;

    const dx = event.point.x - this.panPoint.x;
    const dy = event.point.y - this.panPoint.y;
    view.translate(new paper.Point(dx, dy));
  }
}
