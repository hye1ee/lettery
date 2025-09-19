import paper from 'paper';
import { colors } from '../utils/styles';

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

  public init(): void {
    this.previewBox = new paper.Path.Rectangle(new paper.Point(0, 0), new paper.Size(10, 10));
    this.previewBox.strokeColor = new paper.Color(colors.primary);
    this.previewBox.strokeWidth = 1;
    this.previewBox.dashArray = [5, 8];
    this.previewBox.fillColor = null; // No fill color for selection box
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

  public static getInstance(): PreviewBox {
    if (!PreviewBox.instance) {
      PreviewBox.instance = new PreviewBox();
    }
    return PreviewBox.instance;
  }

  public show(startPoint: paper.Point): void {
    if (!this.boundingBox || !this.previewBox) throw new Error("Bounding box or preview box not initialized");

    // Initialize bounding box with start point
    this.boundingBox.x = startPoint.x;
    this.boundingBox.y = startPoint.y;
    this.boundingBox.width = 0.1;
    this.boundingBox.height = 0.1;

    // Update the preview box bounds and make it visible
    this.previewBox.bounds = this.boundingBox;
    this.previewBox.visible = true;
    this.previewBox.bringToFront();
  }

  public update(endPoint: paper.Point): void {
    if (!this.boundingBox || !this.previewBox) throw new Error("Bounding box or preview box not initialized");

    // Calculate the actual rectangle bounds based on start and end points
    const startX = this.boundingBox.x;
    const startY = this.boundingBox.y;
    const endX = endPoint.x;
    const endY = endPoint.y;

    // Calculate the top-left corner and dimensions
    const left = Math.min(startX, endX);
    const top = Math.min(startY, endY);
    const right = Math.max(startX, endX);
    const bottom = Math.max(startY, endY);

    const width = Math.max(right - left, 0.1);
    const height = Math.max(bottom - top, 0.1);

    // Update the bounding box
    this.boundingBox.x = left;
    this.boundingBox.y = top;
    this.boundingBox.width = width;
    this.boundingBox.height = height;

    // Update the actual preview box rectangle bounds
    this.previewBox.bounds = this.boundingBox;

    console.log("update pos and size: ", this.boundingBox.x, this.boundingBox.y, this.boundingBox.width, this.boundingBox.height);

    this.previewBox.bringToFront();
  }

  public hide(): void {
    if (!this.previewBox) throw new Error("Preview box not initialized");

    this.previewBox.visible = false;
  }
}

export default PreviewBox;