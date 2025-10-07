import paper from 'paper';
import { boundingBox } from '.';

/**
 * Singleton class for managing zoom
 */

class Zoom {
  private static instance: Zoom;
  private zoomIndicator: HTMLElement | null = null;

  private constructor() {
    this.zoomIndicator = document.getElementById('zoom-percentage');

    const zoomInBtn = document.getElementById('zoom-in');
    const zoomOutBtn = document.getElementById('zoom-out');

    zoomInBtn?.addEventListener('click', () => this.setZoom(this.getZoomValue() + 0.1));
    zoomOutBtn?.addEventListener('click', () => this.setZoom(this.getZoomValue() - 0.1));
  }

  public static getInstance(): Zoom {
    if (!Zoom.instance) {
      Zoom.instance = new Zoom();
    }
    return Zoom.instance;
  }

  public setZoom(zoom: number): void {
    paper.project.view.zoom = zoom;
    this.updateZoomValue();
    boundingBox.updateHandles();
  }

  public updateZoomValue(): void {
    if (!this.zoomIndicator) return;
    this.zoomIndicator.textContent = `${Math.round(paper.project.view.zoom * 100)}%`;
  }

  public getZoomValue(): number {
    return paper.project.view.zoom;
  }
}
export default Zoom;