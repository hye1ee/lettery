
import paper from 'paper'
import { lerpPoint } from '../utils/helper'
import { colors } from '../utils/styles'

class CanvasService {
  private static instance: CanvasService | null = null
  private project: paper.Project | null = null
  private view: paper.View | null = null
  private point: { x: number, y: number } = { x: 0, y: 0 };
  private layer: paper.Layer | null = null;
  private updateItemsCallback: ((element: any) => void) | null = null;

  private constructor() { }

  static getInstance(): CanvasService {
    if (!CanvasService.instance) {
      CanvasService.instance = new CanvasService();
    }
    return CanvasService.instance
  }

  /**
   * Init function to initialize the canvas
   */

  init(canvasId: string) {
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement
    if (!canvas) throw new Error("Canvas element not found");

    paper.setup(canvas);

    this.view = paper.view;
    paper.view.autoUpdate = true;

    this.project = paper.project;

    this.createBackgroundLayer();
  }

  setUpdateItemsCallback(callback: (element: any) => void): void {
    this.updateItemsCallback = callback;
  }

  updateItems() {
    if (this.updateItemsCallback && this.project) {
      const layers = this.project.layers.filter(layer => layer.name !== 'Background');
      this.updateItemsCallback(layers || []);
    }
  }

  createBackgroundLayer(): void {
    const backgroundLayer = new paper.Layer();
    backgroundLayer.name = 'Background';
    this.project?.addLayer(backgroundLayer);

    const background = new paper.Path.Rectangle(this.view!.bounds)
    background.fillColor = new paper.Color(colors.white)

    // Create dots
    const dotSize = 2;
    const spacing = 20;

    for (let x = spacing; x < this.view!.bounds.width; x += spacing) {
      for (let y = spacing; y < this.view!.bounds.height; y += spacing) {
        const dot = new paper.Path.Circle(new paper.Point(x, y), dotSize)
        dot.fillColor = new paper.Color(colors.lightGray)
        backgroundLayer.addChild(dot);
      }
    }
    backgroundLayer.locked = true;
    backgroundLayer.sendToBack();
  }

  setupEventHandlers(handlers: {
    onMouseDown: (event: paper.ToolEvent) => void
    onMouseDrag: (event: paper.ToolEvent) => void
    onMouseUp: (event: paper.ToolEvent) => void
    onMouseMove: (event: paper.ToolEvent) => void
  }): void {
    if (!this.view) throw new Error("view not found");

    this.view.onMouseDown = handlers.onMouseDown
    this.view.onMouseDrag = handlers.onMouseDrag
    this.view.onMouseUp = handlers.onMouseUp
    this.view.onMouseMove = (event: paper.ToolEvent) => {
      this.point = { x: event.point.x, y: event.point.y };
      handlers.onMouseMove(event);
    }
  }

  /**
   * Get the current project properties
   */

  getProject(): paper.Project {
    if (!this.project) throw new Error("Project not found");
    return this.project
  }

  getView(): paper.View {
    if (!this.view) throw new Error("View not found");
    return this.view
  }

  getBounds(): paper.Rectangle | null {
    if (!this.view) throw new Error("view not found");
    return this.view.bounds;
  }

  /**
   * Manage the canvas
   */

  addLayer(name: string): void {
    if (!this.project) throw new Error("Project not found");
    const layer = new paper.Layer();
    layer.name = name;
    this.layer = layer; // update active layer
    this.project.addLayer(layer);
    this.updateItems();
  }


  importSVG(file: File): void {
    if (!this.project || !this.layer) throw new Error("Project or layer not found");

    const reader = new FileReader();

    reader.onload = (e) => {
      if (!this.layer) throw new Error("Layer not found");
      const svgContent = e.target?.result as string;

      // Import SVG
      const svg = this.layer.importSVG(svgContent);
      if (svg instanceof paper.Group) {
        svg.clipped = false;
      }

      this.updateItems();
    }

    reader.readAsText(file);
  }


  exportSVG() {
    if (!this.project) throw new Error("Project not found");

    const svgContent = this.project.exportSVG({ asString: true }) as string
    const blob = new Blob([svgContent], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)

    const a = document.createElement('a')
    a.href = url
    a.download = 'lettery-sample.svg'
    a.click()

    URL.revokeObjectURL(url)
  }

  clearCanvas(): void {
    this.project?.clear();
    this.createBackgroundLayer();
  }

  zoomIn(): void {
    if (!this.view) throw new Error("View not found");
    this.view.zoom += 0.05;
    this.moveCenter();
  }

  zoomOut(): void {
    if (!this.view) throw new Error("View not found");
    this.view.zoom -= 0.05;
  }

  moveCenter(): void {
    if (!this.view) throw new Error("View not found");

    const { x, y } = lerpPoint(this.view.center, { x: this.point.x, y: this.point.y }, 0.4);
    this.view.center = new paper.Point(x, y);
  }

  // Pan helpers
  private panStartCenter: paper.Point | null = null;
  private panStartPoint: paper.Point | null = null;

  startPan(startPoint: paper.Point): void {
    if (!this.view) throw new Error("View not found");
    this.panStartCenter = this.view.center.clone();
    this.panStartPoint = startPoint.clone();
  }

  panTo(currentPoint: paper.Point): void {
    if (!this.view || !this.panStartCenter || !this.panStartPoint) return;
    // Move opposite to mouse movement: newCenter = startCenter - (current - startPoint)
    const dx = currentPoint.x - this.panStartPoint.x;
    const dy = currentPoint.y - this.panStartPoint.y;
    this.view.translate(new paper.Point(dx, dy));
  }

  endPan(): void {
    this.panStartCenter = null;
    this.panStartPoint = null;
  }

} export default CanvasService;




