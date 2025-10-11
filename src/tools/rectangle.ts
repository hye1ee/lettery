import paper from 'paper'
import type { Tool } from '../types'
import { cursor, logger } from '../helpers';
import { colors } from '../utils/styles';
import { historyService } from '../services';
import { closePath } from '../utils/paperUtils';

export default class RectangleTool implements Tool {
  private static instance: RectangleTool | null = null;

  readonly id: string = 'rectangle';
  readonly shortcut: string = 'r';
  readonly cursorStyle: string = 'crosshair';

  private startPoint: paper.Point | null = null;
  private rectangle: paper.Shape.Rectangle | null = null;
  private renderCallback: (() => void) | null = null;

  activate(): void {
    cursor.updateCursor(this.cursorStyle);
    logger.updateStatus('Rectangle tool activated - Click and drag to create rectangle');
  }

  deactivate(): void {
    cursor.resetCursor();
    this.startPoint = null;
    this.rectangle = null;
  }

  setRenderCallback(callback: () => void): void {
    this.renderCallback = callback;
  }

  private constructor() { }

  static getInstance(): RectangleTool {
    if (!RectangleTool.instance) {
      RectangleTool.instance = new RectangleTool()
    }
    return RectangleTool.instance
  }

  onMouseDown = (event: paper.ToolEvent): void => {
    this.startPoint = event.point;

    // Create the rectangle once
    this.rectangle = new paper.Shape.Rectangle({
      point: event.point,
      size: new paper.Size(0, 0)
    });

    this.rectangle.strokeColor = new paper.Color(colors.black);
    this.rectangle.strokeWidth = 1;
    this.rectangle.fillColor = null;
    logger.updateStatus('Rectangle started - Drag to set size');
  }

  onMouseMove = (event: paper.ToolEvent): void => {
    // Optional: Could show preview on hover
  }

  onMouseUp = (event: paper.ToolEvent): void => {
    if (!this.startPoint || !this.rectangle) return;
    if (Math.abs(this.rectangle.size.width) > 0.1) { // ignore if the rectangle is not dragged

      paper.project.activeLayer.addChild(closePath(this.rectangle.toPath()));

      historyService.saveSnapshot("rectangle");
      logger.updateStatus(`Rectangle created - Size: ${this.rectangle.bounds.width.toFixed(1)} × ${this.rectangle.bounds.height.toFixed(1)}`);
    }

    // init data
    this.startPoint = null;
    this.rectangle.remove();
    this.rectangle = null;

    this.renderCallback?.();
  }
  onMouseDrag = (event: paper.ToolEvent): void => {
    if (!this.startPoint || !this.rectangle) return;

    const sizePoint = this.startPoint.clone().subtract(event.point);

    if (event.modifiers?.shift) {
      sizePoint.y = sizePoint.x;
    }

    this.rectangle.size = new paper.Size(sizePoint.x, sizePoint.y);
    this.rectangle.position = this.startPoint.clone().add(event.point).divide(2);
  }
}

