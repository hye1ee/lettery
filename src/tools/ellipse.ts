import paper from 'paper'
import type { Tool } from '../types'
import { cursor, logger } from '../helpers';
import { colors } from '../utils/styles';
import { historyService } from '../services';
import { closePath } from '../utils/paperUtils';

export default class EllipseTool implements Tool {
  private static instance: EllipseTool | null = null;

  readonly id: string = 'ellipse';
  readonly shortcut: string = 'l';
  readonly cursorStyle: string = 'crosshair';

  private startPoint: paper.Point | null = null;
  private ellipse: paper.Shape.Ellipse | null = null;
  private renderCallback: (() => void) | null = null;

  activate(): void {
    cursor.updateCursor(this.cursorStyle);
    logger.updateStatus('Ellipse tool activated - Click and drag to create ellipse');
  }

  deactivate(): void {
    cursor.resetCursor();
    this.startPoint = null;
    this.ellipse = null;
  }

  setRenderCallback(callback: () => void): void {
    this.renderCallback = callback;
  }

  private constructor() { }

  static getInstance(): EllipseTool {
    if (!EllipseTool.instance) {
      EllipseTool.instance = new EllipseTool()
    }
    return EllipseTool.instance
  }

  onMouseDown = (event: paper.ToolEvent): void => {
    this.startPoint = event.point;

    // Create the ellipse once
    this.ellipse = new paper.Shape.Ellipse({
      point: event.point,
      size: new paper.Size(0, 0)
    });

    this.ellipse.strokeColor = new paper.Color(colors.black);
    this.ellipse.strokeWidth = 1;
    this.ellipse.fillColor = null;

    logger.updateStatus('Ellipse started - Drag to set size');
  }

  onMouseMove = (event: paper.ToolEvent): void => {
    // Optional: Could show preview on hover
  }

  onMouseUp = (event: paper.ToolEvent): void => {
    if (!this.startPoint || !this.ellipse) return;
    if (Math.abs(this.ellipse.size.width) > 0.1) { // ignore if the ellipse is not dragged

      paper.project.activeLayer.addChild(closePath(this.ellipse.toPath()));

      historyService.saveSnapshot("ellipse");
      logger.updateStatus(`Ellipse created - Size: ${this.ellipse.bounds.width.toFixed(1)} × ${this.ellipse.bounds.height.toFixed(1)}`);
    }

    // init data
    this.startPoint = null;
    this.ellipse.remove();
    this.ellipse = null;

    this.renderCallback?.();
  }

  onMouseDrag = (event: paper.ToolEvent): void => {
    if (!this.startPoint || !this.ellipse) return;

    const sizePoint = this.startPoint.clone().subtract(event.point);

    if (event.modifiers?.shift) {
      sizePoint.y = sizePoint.x;
    }

    this.ellipse.size = new paper.Size(sizePoint.x, sizePoint.y);
    this.ellipse.position = this.startPoint.clone().add(event.point).divide(2);
  }
}

