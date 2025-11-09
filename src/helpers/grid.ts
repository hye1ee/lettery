import paper from 'paper';

class Grid {
  private static instance: Grid;
  private view: paper.View | null = null;
  private layer: paper.Layer | null = null;
  private group: paper.Group | null = null;

  /**
   * Base logical spacing between grid lines (in project units) when zoom = 1.
   * This is the default spacing the grid tries to use before zoom adjustments.
   */
  private readonly baseSpacing: number = 30;

  /**
   * Smallest logical spacing allowed after zoom adjustments.
   * Prevents the grid from becoming too dense when the user zooms in far.
   */
  private readonly smallestSpacing: number = 16;

  /**
   * Minimum pixel distance between grid lines on screen.
   * If spacing in screen pixels drops below this value the step size is multiplied.
   */
  private readonly minPixelSpacing: number = 10;

  /**
   * Maximum pixel distance between grid lines on screen.
   * If spacing exceeds this value the step size is reduced (down to smallestSpacing).
   */
  private readonly maxPixelSpacing: number = 80;

  private lastCenter: paper.Point | null = null;
  private lastZoom: number = 1;

  private frameHandler: ((event: paper.Event) => void) | null = null;
  private resizeHandler: ((event: paper.Event) => void) | null = null;

  private constructor() { }

  public static getInstance(): Grid {
    if (!Grid.instance) {
      Grid.instance = new Grid();
    }
    return Grid.instance;
  }

  public init(project: paper.Project, view: paper.View): void {
    this.view = view;

    const existingLayer = project.layers.find(layer => layer.name === 'system-helper');
    if (existingLayer) {
      this.layer = existingLayer;
    } else {
      const previousActiveLayer = project.activeLayer;
      this.layer = new paper.Layer();
      this.layer.name = 'system-helper';
      this.layer.locked = true;
      this.layer.visible = true;
      this.layer.activate();
      previousActiveLayer?.activate();
      this.layer.sendToBack();
    }

    if (!this.group || !this.group.isInserted()) {
      this.group = new paper.Group({ name: 'system-grid', locked: true });
      this.layer.addChild(this.group);
    }

    this.updateGrid();

    this.lastCenter = view.center.clone();
    this.lastZoom = view.zoom;

    if (!this.resizeHandler) {
      this.resizeHandler = () => this.updateGrid();
      view.on('resize', this.resizeHandler);
    }

    if (!this.frameHandler) {
      this.frameHandler = () => {
        if (!this.view) return;
        const center = this.view.center;
        const zoom = this.view.zoom;

        const spacing = this.computeSpacing();
        const threshold = spacing / 2;

        const centerChanged = !this.lastCenter || center.getDistance(this.lastCenter) > threshold;
        const zoomChanged = Math.abs(zoom - this.lastZoom) > 0.001;

        if (centerChanged || zoomChanged) {
          this.updateGrid();
        }
      };
      view.on('frame', this.frameHandler);
    }
  }

  private computeSpacing(): number {
    if (!this.view) return this.baseSpacing;

    const zoom = this.view.zoom;
    let spacing = this.baseSpacing;
    let spacingPx = spacing * zoom;

    while (spacingPx < this.minPixelSpacing) {
      spacing *= 5;
      spacingPx = spacing * zoom;
    }

    while (spacingPx > this.maxPixelSpacing && spacing / 5 >= this.smallestSpacing) {
      spacing /= 5;
      spacingPx = spacing * zoom;
    }

    return spacing;
  }

  private updateGrid(): void {
    if (!this.view || !this.layer || !this.group) return;

    const spacing = this.computeSpacing();
    const bounds = this.view.bounds.expand(spacing * 2);

    const startX = Math.floor(bounds.left / spacing) * spacing;
    const endX = Math.ceil(bounds.right / spacing) * spacing;
    const startY = Math.floor(bounds.top / spacing) * spacing;
    const endY = Math.ceil(bounds.bottom / spacing) * spacing;

    this.group.removeChildren();

    const minorStroke = new paper.Color(0.890, 0.965, 1.000);
    const majorStroke = new paper.Color(0.725, 0.902, 1.000);
    const strokeWidth = 1 / this.view.zoom;
    const majorEvery = 5;

    let index = 0;
    for (let x = startX; x <= endX; x += spacing) {
      const line = new paper.Path.Line(
        new paper.Point(x, bounds.top),
        new paper.Point(x, bounds.bottom)
      );
      line.strokeColor = (index % majorEvery === 0) ? majorStroke : minorStroke;
      line.strokeWidth = strokeWidth;
      line.parent = this.group;
      index += 1;
    }

    index = 0;
    for (let y = startY; y <= endY; y += spacing) {
      const line = new paper.Path.Line(
        new paper.Point(bounds.left, y),
        new paper.Point(bounds.right, y)
      );
      line.strokeColor = (index % majorEvery === 0) ? majorStroke : minorStroke;
      line.strokeWidth = strokeWidth;
      line.parent = this.group;
      index += 1;
    }

    this.lastCenter = this.view.center.clone();
    this.lastZoom = this.view.zoom;
  }
}

export default Grid;

