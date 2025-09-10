
import paper from 'paper'
import { lerpPoint } from '../utils/helper'
import { colors } from '../utils/styles'
import type { DrawingState } from '../types'

class CanvasService {
  private static instance: CanvasService | null = null
  private project: paper.Project | null = null
  private view: paper.View | null = null
  private point: { x: number, y: number } = { x: 0, y: 0 };
  private activeLayer: paper.Layer | null = null;
  private updateItemsCallback: ((element: any) => void) | null = null;

  // Drawing state (merged from DrawingService)
  private drawingState: DrawingState = {
    currentPath: null,
    selectedItem: null,
    selectedPoint: null
  };

  // Callback for UI event listeners
  private onSelectionChange: ((itemId: string, selected: boolean) => void) | null = null;

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

  getItemById(id: string): paper.Item | null {
    if (!this.project) throw new Error("Project not found");
    return this.project.getItem({ id: parseInt(id) });
  }

  getActiveLayer(): paper.Layer | null {
    if (!this.project) throw new Error("Layer not found");
    return this.project.activeLayer;
  }

  /**
   * Manage the canvas
   */

  addLayer(name: string): void {
    if (!this.project) throw new Error("Project not found");
    const layer = new paper.Layer();
    layer.name = name;

    // Update active layer
    this.activeLayer = layer;
    this.project.addLayer(layer);
    layer.activate();

    this.updateItems();
  }


  importSVG(file: File): void {
    if (!this.project || !this.activeLayer) throw new Error("Project or layer not found");

    const reader = new FileReader();

    reader.onload = (e) => {
      if (!this.activeLayer) throw new Error("Active layer not found");
      const svgContent = e.target?.result as string;

      // Import SVG to active layer
      const svg = this.activeLayer.importSVG(svgContent);
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

  // Drawing methods (merged from DrawingService)

  /**
   * Get current drawing state
   */
  getDrawingState(): DrawingState {
    return { ...this.drawingState }
  }

  /**
   * Set selection change callback
   */
  setSelectionChangeCallback(callback: (itemId: string, selected: boolean) => void): void {
    this.onSelectionChange = callback;
  }

  /**
   * Start drawing a new path
   */
  startDrawing(point: paper.Point): paper.Path | null {
    try {
      if (!this.project) {
        throw new Error('Paper.js project not initialized')
      }

      this.drawingState.currentPath = new paper.Path()
      this.drawingState.currentPath.strokeColor = new paper.Color(colors.black)
      this.drawingState.currentPath.strokeWidth = 1
      this.drawingState.currentPath.add(point)

      return this.drawingState.currentPath
    } catch (error) {
      console.error('Error starting drawing:', error)
      return null
    }
  }

  /**
   * Continue drawing the current path
   */
  continueDrawing(point: paper.Point): boolean {
    if (this.drawingState.currentPath) {
      this.drawingState.currentPath.add(point)
      return true
    }
    return false
  }

  /**
   * Finish drawing the current path
   */
  finishDrawing(point: paper.Point): boolean {
    if (this.drawingState.currentPath) {
      this.drawingState.currentPath.add(point)
      this.smoothPath(this.drawingState.currentPath)
      this.drawingState.currentPath = null
      return true
    }
    return false
  }

  /**
   * Smooth a path
   */
  smoothPath(path: paper.Path): void {
    if (path && path.segments.length > 2) {
      path.smooth()
    }
  }

  /**
   * Select an item
   */
  selectItem(item: paper.Item): void {
    this.deselectAll()
    this.drawingState.selectedItem = item
    item.selected = true;

    // Notify UI service about selection
    if (item.id && this.onSelectionChange) {
      this.onSelectionChange(item.id.toString(), true);
    }
  }

  /**
   * Deselect a path
   */
  deselectPath(path: paper.PathItem): void {
    path.strokeColor = new paper.Color(colors.black)
    path.strokeWidth = 1

    // Notify UI service about deselection
    if (path.id && this.onSelectionChange) {
      this.onSelectionChange(path.id.toString(), false);
    }
  }

  /**
   * Select a point
   */
  selectPoint(point: paper.PathItem): void {
    this.deselectAll()
    this.drawingState.selectedPoint = point
    point.fillColor = new paper.Color(colors.error)
  }

  /**
   * Deselect a point
   */
  deselectPoint(point: paper.PathItem): void {
    point.fillColor = new paper.Color(colors.black)
  }

  /**
   * Deselect all items
   */
  deselectAll(): void {
    if (this.drawingState.selectedItem) {
      this.deselectPath(this.drawingState.selectedItem)
      this.drawingState.selectedItem.selected = false;
      this.drawingState.selectedItem = null
    }

    if (this.drawingState.selectedPoint) {
      this.deselectPoint(this.drawingState.selectedPoint)
      this.drawingState.selectedPoint.selected = false;
      this.drawingState.selectedPoint = null
    }

    // Clear all selections in UI
    if (this.onSelectionChange) {
      this.onSelectionChange('', false); // Empty string indicates clear all
    }
  }

  /**
   * Move a selected point
   */
  moveSelectedPoint(point: paper.Point): void {
    if (this.drawingState.selectedPoint) {
      this.drawingState.selectedPoint.position = point;
    }
    if (this.drawingState.selectedItem) {
      this.drawingState.selectedItem.position = point;
    }
  }

  /**
   * Add a point to an existing path
   */
  addPointToPath(path: paper.Path, point: paper.Point): paper.Segment | null {
    try {
      const segment = path.getNearestLocation(point)

      if (segment) {
        const newSegment = path.insert(segment.index + 1, point)

        // Create a visual indicator for the new point
        const pointIndicator = new paper.Path.Circle(newSegment.point, 10)
        pointIndicator.fillColor = new paper.Color(colors.error)
        pointIndicator.strokeColor = new paper.Color(colors.warning)
        pointIndicator.strokeWidth = 1

        return newSegment
      }
    } catch (error) {
      console.error('Error adding point to path:', error)
    }

    return null
  }

  /**
   * Create a rectangle
   */
  createRectangle(point: paper.Point, size: paper.Size): paper.Path | null {
    try {
      if (!this.project) {
        throw new Error('Paper.js project not initialized')
      }

      const rect = new paper.Path.Rectangle(point, size)
      rect.strokeColor = new paper.Color(colors.black)
      rect.strokeWidth = 1
      rect.fillColor = new paper.Color(colors.lightGray)

      return rect
    } catch (error) {
      console.error('Error creating rectangle:', error)
      return null
    }
  }

  /**
   * Create a circle
   */
  createCircle(center: paper.Point, radius: number): paper.Path | null {
    try {
      if (!this.project) {
        throw new Error('Paper.js project not initialized')
      }

      const circle = new paper.Path.Circle(center, radius)
      circle.strokeColor = new paper.Color(colors.black)
      circle.strokeWidth = 1
      circle.fillColor = new paper.Color(colors.info)

      return circle
    } catch (error) {
      console.error('Error creating circle:', error)
      return null
    }
  }

  /**
   * Get hit test result at a point
   */
  hitTest(point: paper.Point, options?: any): paper.HitResult | null {
    if (!this.project) {
      return null
    }

    return this.project.hitTest(point, options)
  }

} export default CanvasService;




