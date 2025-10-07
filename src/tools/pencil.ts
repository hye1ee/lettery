import paper from 'paper'
import type { Tool } from './index'
import { cursor, logger } from '../helpers';
import { colors } from '../utils/styles';
import { closePath, simplifyPath } from '../utils/paperUtils';
import { historyService } from '../services';

export default class PencilTool implements Tool {
  private static instance: PencilTool | null = null;

  readonly id: string = 'pencil';
  readonly shortcut: string = 'b';
  readonly cursorStyle: string = 'crosshair';

  private path: paper.Path | null = null;
  private renderCallback: (() => void) | null = null;

  activate(): void {
    cursor.updateCursor(this.cursorStyle);
    // TODO: Implement activate logic
  }

  deactivate(): void {
    cursor.resetCursor();
    // TODO: Implement deactivate logic
  }

  setRenderCallback(callback: () => void): void {
    this.renderCallback = callback;
  }

  private constructor() { }

  static getInstance(): PencilTool {
    if (!PencilTool.instance) {
      PencilTool.instance = new PencilTool()
    }
    return PencilTool.instance
  }

  onMouseDown = (event: paper.ToolEvent): void => {
    this.path = new paper.Path();
    paper.project.activeLayer.addChild(this.path);
    this.renderCallback?.();

    this.path.selected = true;
    this.path.strokeColor = new paper.Color(colors.black);
    this.path.strokeWidth = 1;
    this.path.add(event.point);

    logger.updateStatus('Pencil drawing started')
  }

  onMouseMove = (event: paper.ToolEvent): void => {
    // TODO: Implement mouse move logic
  }

  onMouseUp = (event: paper.ToolEvent): void => {
    if (!this.path) return;

    this.path.add(event.point);
    const result = simplifyPath(this.path);
    closePath(this.path);

    this.path.selected = false;
    this.path = null;

    historyService.saveSnapshot("pencil");
    logger.updateStatus(`Pencil drawing finished - Simplified: ${result?.saved} segments removed (${result?.percentage}% saved)`);
  }

  onMouseDrag = (event: paper.ToolEvent): void => {
    if (!this.path) return;
    this.path.add(event.point);

  }
}
