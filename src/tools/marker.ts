import paper from 'paper'
import type { Tool } from '../types'
import { cursor, logger } from '../helpers';
// import { colors } from '../utils/styles';
import { simplifyPath } from '../utils/paperUtils';
import { historyService } from '../services';

export default class MarkerTool implements Tool {
  private static instance: MarkerTool | null = null;

  readonly id: string = 'marker';
  readonly shortcut: string = 'm';
  readonly cursorStyle: string = 'crosshair';

  private path: paper.Path | null = null;
  private renderCallback: (() => void) | null = null;

  activate(): void {
    console.log('MarkerTool activate');
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

  static getInstance(): MarkerTool {
    if (!MarkerTool.instance) {
      MarkerTool.instance = new MarkerTool()
    }
    return MarkerTool.instance
  }

  onMouseDown = (event: paper.ToolEvent): void => {
    this.path = new paper.Path();
    paper.project.activeLayer.addChild(this.path);
    this.renderCallback?.();

    this.path.selected = true;
    this.path.strokeColor = new paper.Color("#ffd79a"); // Orange color
    this.path.strokeWidth = 20; // Thicker stroke
    this.path.add(event.point);

    logger.updateStatus('Marker drawing started')
  }

  onMouseMove = (_event: paper.ToolEvent): void => {
    // TODO: Implement mouse move logic
  }

  onMouseUp = (event: paper.ToolEvent): void => {
    if (!this.path) return;

    this.path.add(event.point);
    const result = simplifyPath(this.path);
    // closePath(this.path);

    this.path.selected = false;
    this.path.name = "strokesketch";
    this.path.opacity = 0.8;
    this.path.bringToFront();

    this.path = null;


    historyService.saveSnapshot("marker");
    logger.updateStatus(`Marker drawing finished - Simplified: ${result?.saved} segments removed (${result?.percentage}% saved)`);
  }

  onMouseDrag = (event: paper.ToolEvent): void => {
    if (!this.path) return;
    this.path.add(event.point);

  }
}

