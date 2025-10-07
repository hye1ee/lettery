import paper from 'paper';
import { colors } from '../utils/styles';

/**
 * Singleton class for managing drag selection preview box
 */
class BoundingBox {
  private static instance: BoundingBox;

  private boxGroup: paper.Group | null = null;
  private box: paper.Path.Rectangle | null = null;
  private rotationHandle: paper.Path.Circle | null = null;
  private scaleHandles: paper.Path.Rectangle[] = [];

  private constructor() {
    // Private constructor for singleton pattern
  }

  public init(): void {
    this.boxGroup = new paper.Group();
    this.box = new paper.Path.Rectangle(new paper.Point(0, 0), new paper.Size(10, 10));

    this.box.strokeColor = new paper.Color(colors.secondary);
    this.box.strokeWidth = 1;
    this.box.locked = true;
    this.box.strokeScaling = false;

    this.box.curves[0].divideAtTime(0.5);
    this.box.curves[2].divideAtTime(0.5);
    this.box.curves[4].divideAtTime(0.5);
    this.box.curves[6].divideAtTime(0.5);

    this.boxGroup.addChild(this.box);


    this.box.name = 'system-bounding-box';

    this.hide();
  }

  public updateHandles(): void {
    if (!this.box) throw new Error("Bounding box not initialized");

    // remove old handles
    if (this.rotationHandle) this.rotationHandle.remove();
    this.scaleHandles.forEach(handle => handle.remove());

    // create new handles
    this.box.segments.forEach((segment, index) => {
      let size = 4;

      if (index % 2 === 0) {
        size = 6;
      }

      if (index === 7) {
        var offset = new paper.Point(0, 10 / paper.view.zoom);
        this.rotationHandle = new paper.Path.Circle({
          name: 'system-rotation-handle',
          center: segment.point.add(offset),
          radius: 5 / paper.view.zoom,
          strokeColor: colors.secondary,
          fillColor: 'white',
          strokeWidth: 0.5 / paper.view.zoom,
          parent: paper.project.layers.find(layer => layer.name === 'system-helper')
        });
        this.boxGroup?.addChild(this.rotationHandle);
      }

      this.scaleHandles[index] =
        new paper.Path.Rectangle({
          name: 'system-scale-handle-' + index,
          center: segment.point,
          size: [size / paper.view.zoom, size / paper.view.zoom],
          fillColor: colors.secondary,
          parent: paper.project.layers.find(layer => layer.name === 'system-helper')
        });
      this.boxGroup?.addChild(this.scaleHandles[index]);
    });
  }

  public static getInstance(): BoundingBox {
    if (!BoundingBox.instance) {
      BoundingBox.instance = new BoundingBox();
    }
    return BoundingBox.instance;
  }

  public getbox(): paper.Path.Rectangle {
    if (!this.box) throw new Error("Bounding box not initialized");
    return this.box;
  }


  public show(items: paper.Item[]): void {
    if (!this.boxGroup || !this.box) throw new Error("Bounding box not initialized");

    if (items.length === 0) {
      this.hide();
      return;
    }

    // Initialize bounding box with start point
    let box: paper.Rectangle = items[0].bounds;
    items.forEach(item => {
      box = box.unite(item.bounds);
    });

    console.log('show bounding box', box);

    this.box.bounds = box;
    this.updateHandles();

    // Update the preview box bounds and make it visible
    // this.BoundingBox.bounds = this.boundingBox;
    this.boxGroup.visible = true;
    this.boxGroup.bringToFront();
  }

  public hide(): void {
    if (!this.boxGroup) throw new Error("Bounding box not initialized");

    this.boxGroup.visible = false;
  }
}

export default BoundingBox;