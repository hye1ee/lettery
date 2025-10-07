import paper from 'paper'
import type { Tool } from './index'
import { cursor, logger } from '../helpers';
import { colors } from '../utils/styles';
import { closePath } from '../utils/paperUtils';

export class PenTool implements Tool {
  private static instance: PenTool | null = null;

  readonly id: string = 'pen';
  readonly shortcut: string = 'p';
  readonly cursorStyle: string = 'default';

  private path: paper.Path | null = null;
  private renderCallback: (() => void) | null = null;

  activate(): void {
    cursor.updateCursor(this.cursorStyle);
    // TODO: Implement activate logic
  }

  deactivate(): void {
    this.terminatePathing();
    cursor.resetCursor();
    // TODO: Implement deactivate logic
  }

  setRenderCallback(callback: () => void): void {
    this.renderCallback = callback;
  }

  private constructor() { }

  static getInstance(): PenTool {
    if (!PenTool.instance) {
      PenTool.instance = new PenTool()
    }
    return PenTool.instance
  }

  onMouseDown = (event: paper.ToolEvent): void => {
    if (!this.path) { // (1) Start a new path
      this.path = new paper.Path();

      paper.project.activeLayer.addChild(this.path);
      this.renderCallback?.();

      this.path.strokeColor = new paper.Color(colors.black);
      this.path.strokeWidth = 1;
      this.path.add(event.point);
      this.path.selected = true;
    } else {
      // (2) Add a new point to existing path
      this.path.add(event.point);
    }
    logger.updateStatus('Pen tool - click to add points, drag to adjust curves');
  }

  onMouseMove = (event: paper.ToolEvent): void => {
    // TODO: Implement mouse move logic
  }

  onMouseUp = (event: paper.ToolEvent): void => {
    if (!this.path) return;

    const segments = this.path.segments;

    if (segments.length > 1) { // prev point is existing
      const lastSegment = segments[segments.length - 2];
      const currentSegment = segments[segments.length - 1];

      // if prev has dragged, and current hasn't dragged
      if (lastSegment.handleOut.x !== 0 && lastSegment.handleOut.y !== 0 && currentSegment.handleOut.x === 0 && currentSegment.handleOut.y === 0) {
        // set current inner handle to the tangent of the line between current and prev point
        const direction = event.point.subtract(lastSegment.point);
        currentSegment.handleIn = direction.normalize();
      }
    }
    logger.updateStatus('Point added - continue clicking to add more points');
  }

  terminatePathing() {
    // Terminate the current path and add it to the layer
    if (this.path) {
      this.path.selected = false;
      closePath(this.path);
      this.path = null;
    }
  }

  onMouseDrag = (event: paper.ToolEvent): void => {
    if (!this.path) return;

    const segments = this.path.segments;
    if (segments.length > 0) {
      const currentSegment = segments[segments.length - 1];
      // Create a smooth curve by setting the handle out point
      const handleVector = event.point.subtract(currentSegment.point);
      currentSegment.handleOut = handleVector;
      if (segments.length > 1) {
        // if current point is not the first point, set inner handle
        currentSegment.handleIn = currentSegment.handleOut.clone().multiply(-1);

        // if prev point hasn't dragged, set it's outer handle to the tangent of the line between current and prev point
        const lastSegment = segments[segments.length - 2];
        const direction = event.point.subtract(lastSegment.point);
        lastSegment.handleOut = direction.normalize();
      }
    }
    logger.updateStatus('Adjusting curve handle...');

  }
}
