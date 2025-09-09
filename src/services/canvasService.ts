
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
    this.createMainLayer();
  }

  setUpdateItemsCallback(callback: (element: any) => void): void {
    this.updateItemsCallback = callback;
  }

  updateItems() {
    if (this.updateItemsCallback) {
      this.updateItemsCallback(this.layer?.children || []);
    }
  }

  createBackgroundLayer(): void {
    const backgroundLayer = new paper.Layer();
    this.project?.addLayer(backgroundLayer);

    const background = new paper.Path.Rectangle(this.view!.bounds)
    background.fillColor = new paper.Color(colors.lightGray)

    // Create dots
    const dotSize = 2;
    const spacing = 20;

    for (let x = spacing; x < this.view!.bounds.width; x += spacing) {
      for (let y = spacing; y < this.view!.bounds.height; y += spacing) {
        const dot = new paper.Path.Circle(new paper.Point(x, y), dotSize)
        dot.fillColor = new paper.Color(colors.gray)
        backgroundLayer.addChild(dot);
      }
    }
    backgroundLayer.locked = true;
    backgroundLayer.sendToBack();
  }

  createMainLayer(): void {
    this.layer = new paper.Layer();
    this.project?.addLayer(this.layer);
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

  importSVG(file: File): void {
    if (!this.project || !this.layer) throw new Error("Project or layer not found");

    const reader = new FileReader();

    reader.onload = (e) => {
      if (!this.layer) return;
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

    const { x, y } = lerpPoint(this.view.center, { x: this.point.x, y: this.point.y }, 0.1);
    this.view.center = new paper.Point(x, y);
  }

  moveCanvas(x: number, y: number): void {
    if (!this.view) throw new Error("View not found");
    this.view.center = new paper.Point(x, y);
  }

} export default CanvasService;




