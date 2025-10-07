import paper from 'paper';
import { colors, hexToRgba } from '../utils/styles';
import { rgbaToPaperColor } from '../utils/paperUtils';

/**
 * Singleton class for managing drag selection preview box
 */
class PreviewBox {
  private static instance: PreviewBox;
  private previewBox: paper.Path.Rectangle | null = null;
  private boundingBox: paper.Rectangle | null = null;

  private constructor() {
    // Private constructor for singleton pattern
  }

  public static getInstance(): PreviewBox {
    if (!PreviewBox.instance) {
      PreviewBox.instance = new PreviewBox();
    }
    return PreviewBox.instance;
  }

  public init(): void {
    this.previewBox = new paper.Path.Rectangle(new paper.Point(0, 0), new paper.Size(10, 10));
    this.previewBox.strokeColor = new paper.Color(colors.secondary);
    this.previewBox.strokeWidth = 1;
    this.previewBox.fillColor = rgbaToPaperColor(hexToRgba(colors.quaternary, 0.2)); // No fill color for selection box
    this.previewBox.locked = true;

    this.boundingBox = this.previewBox.bounds;
    this.previewBox.name = 'system-selection-box';
    this.hide();
  }

  public getPreviewBox(): paper.Path.Rectangle {
    if (!this.previewBox) throw new Error("Preview box not initialized");
    return this.previewBox;
  }

  public getBoundingBox(): paper.Rectangle {
    if (!this.boundingBox) throw new Error("Bounding box not initialized");
    return this.boundingBox;
  }

  public getNormalizedBoundingBox(): paper.Rectangle {
    if (!this.boundingBox) throw new Error("Bounding box not initialized");

    // Create a normalized rectangle for intersection testing
    const left = Math.min(this.boundingBox.x, this.boundingBox.x + this.boundingBox.width);
    const top = Math.min(this.boundingBox.y, this.boundingBox.y + this.boundingBox.height);
    const right = Math.max(this.boundingBox.x, this.boundingBox.x + this.boundingBox.width);
    const bottom = Math.max(this.boundingBox.y, this.boundingBox.y + this.boundingBox.height);

    return new paper.Rectangle(left, top, right - left, bottom - top);
  }



  public show(startPoint: paper.Point): void {
    if (!this.boundingBox || !this.previewBox) throw new Error("Bounding box or preview box not initialized");

    // Initialize bounding box with start point
    this.boundingBox.x = startPoint.x;
    this.boundingBox.y = startPoint.y;
    this.boundingBox.width = 0.1;
    this.boundingBox.height = 0.1;

    // Update the preview box bounds and make it visible
    // this.previewBox.bounds = this.boundingBox;
    this.previewBox.visible = true;
    this.previewBox.bringToFront();
  }

  public update(endPoint: paper.Point): void {
    if (!this.boundingBox || !this.previewBox) throw new Error("Bounding box or preview box not initialized");

    // Calculate the actual width and height (can be negative for reverse dragging)
    let width = endPoint.x - this.boundingBox.x;
    let height = endPoint.y - this.boundingBox.y;

    // Ensure minimum absolute size, but preserve direction
    if (Math.abs(width) < 0.1) {
      width = width >= 0 ? 0.1 : -0.1;
    }
    if (Math.abs(height) < 0.1) {
      height = height >= 0 ? 0.1 : -0.1;
    }

    this.boundingBox.width = width;
    this.boundingBox.height = height;

    // Update the actual preview box rectangle bounds
    // this.previewBox.bounds = this.boundingBox;

    this.previewBox.bringToFront();
  }

  public hide(): void {
    if (!this.previewBox) throw new Error("Preview box not initialized");

    this.previewBox.visible = false;
  }
}

export default PreviewBox;