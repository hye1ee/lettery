import paper from 'paper'
import type { Tool } from './index'
import { cursor } from '../helpers';

export class PencilTool implements Tool {
  private static instance: PencilTool | null = null;

  readonly id: string = 'pencil';
  readonly shortcut: string = 'p';
  readonly cursorStyle: string = 'crosshair';

  activate(): void {
    cursor.updateCursor(this.cursorStyle);
    // TODO: Implement activate logic
  }

  deactivate(): void {
    cursor.resetCursor();
    // TODO: Implement deactivate logic
  }

  private constructor() { }

  static getInstance(): PencilTool {
    if (!PencilTool.instance) {
      PencilTool.instance = new PencilTool()
    }
    return PencilTool.instance
  }

  onMouseDown = (event: paper.ToolEvent): void => {
    // TODO: Implement mouse down logic

    //   if (currentTool === TOOLS.PENCIL) {
    //     const path = canvasService.startDrawing(event.point)
    //     if (path) {
    //       logger.updateStatus('Pencil drawing started')
    //     }
  }

  onMouseMove = (event: paper.ToolEvent): void => {
    // TODO: Implement mouse move logic
  }

  onMouseUp = (event: paper.ToolEvent): void => {
    // TODO: Implement mouse up logic


    //   if (currentTool === TOOLS.PENCIL) {
    //     const result = canvasService.finishDrawing(event.point);
    //     if (result.success) {
    //       if (result.simplificationInfo) {
    //         const { original, simplified, saved, percentage } = result.simplificationInfo;
    //         logger.updateStatus(`Pencil drawing finished - Simplified: ${saved} segments removed (${percentage}% saved)`);
    //       } else {
    //         logger.updateStatus('Pencil drawing finished');
    //       }
    //       // Update layer after finishing drawing
    //       canvasService.updateItems();
    //     }
  }

  onMouseDrag = (event: paper.ToolEvent): void => {
    // TODO: Implement mouse up logic

    //   if (currentTool === TOOLS.PENCIL) {
    //     canvasService.continueDrawing(event.point)

  }
}
