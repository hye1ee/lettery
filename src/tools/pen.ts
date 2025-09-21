import paper from 'paper'
import type { Tool } from './index'
import { cursor } from '../helpers';

export class PenTool implements Tool {
  private static instance: PenTool | null = null;

  readonly id: string = 'pen';
  readonly shortcut: string = 'a';
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

  static getInstance(): PenTool {
    if (!PenTool.instance) {
      PenTool.instance = new PenTool()
    }
    return PenTool.instance
  }

  onMouseDown = (event: paper.ToolEvent): void => {
    // TODO: Implement mouse down logic

    //   } else if (currentTool === TOOLS.PEN) {
    //     canvasService.startPathing(event.point);
    //     logger.updateStatus('Pen tool - click to add points, drag to adjust curves');
    //   }
  }

  onMouseMove = (event: paper.ToolEvent): void => {
    // TODO: Implement mouse move logic
  }

  onMouseUp = (event: paper.ToolEvent): void => {
    // TODO: Implement mouse up logic

    //   } else if (currentTool === TOOLS.PEN) {
    //     canvasService.finishPathing(event.point);
    //     logger.updateStatus('Point added - continue clicking to add more points');

  }

  onMouseDrag = (event: paper.ToolEvent): void => {
    // TODO: Implement mouse up logic

    //   } else if (currentTool === TOOLS.PEN) {
    //     canvasService.continuePathing(event.point);
    //     logger.updateStatus('Adjusting curve handle...');
    //   }
  }
}
