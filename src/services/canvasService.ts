import paper from 'paper';

/**
 * Manages Paper.js canvas, drawing operations, and user interactions
 */
import { colors } from '../utils/styles';
import type { DrawingState } from '../types';
import { closePath, findParentLayer, ungroupSVG } from '../utils/paperUtils';
import { boundingBox, logger, previewBox, zoom } from '../helpers';
import { uiService } from '.';
import { grid } from '../helpers';


class CanvasService {
  private static instance: CanvasService | null = null
  private project: paper.Project | null = null
  private view: paper.View | null = null
  private point: { x: number, y: number } = { x: 0, y: 0 };

  private onMouseDownCallbacks: ((event: paper.ToolEvent) => void)[] = [];
  private onMouseDragCallbacks: ((event: paper.ToolEvent) => void)[] = [];
  private onMouseUpCallbacks: ((event: paper.ToolEvent) => void)[] = [];
  private onMouseMoveCallbacks: ((event: paper.ToolEvent) => void)[] = [];
  private onDoubleClickCallbacks: ((event: paper.ToolEvent) => void)[] = [];
  private onKeyDownCallbacks: ((event: KeyboardEvent) => void)[] = [];

  // Drawing state (merged from DrawingService)
  private drawingState: DrawingState = {
    currentDrawing: null,
    currentPath: null,
    selectedItems: [],
    selectedPoint: null,
    dragOffset: null,
    initialDragPositions: [],
    isDragSelecting: false,
    dragSelectionStart: null
  };

  // Callback for UI event listeners
  private alertSelectionChange: (({ id, layer }: { id: string | null, layer?: boolean }) => void) | null = null;

  // Path simplification configuration
  private simplificationTolerance: number = 10;

  // Hover state management
  private hoveredItem: paper.Item | null = null;

  private constructor() {
  }

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

    // create system helper layer
    this.createSystemLayer();

    this.initHelpers();

    this.initEventHandlers();
    // this.createBackgroundLayer();

    // Ensure there's always an active layer
    // this.ensureActiveLayer();
    console.log(this.point);

  }


  createSystemLayer(): void {
    if (!this.project || !this.view) {
      throw new Error('Project or view not initialized');
    }

    grid.init(this.project, this.view);
  }

  initHelpers(): void {
    const helperLayer = this.project?.layers.find(layer => layer.name === 'system-helper');
    if (!helperLayer) throw new Error("Helper layer not found");

    previewBox.init();
    boundingBox.init();
    helperLayer.addChild(previewBox.getPreviewBox());
  }

  initEventHandlers(): void {
    this.onMouseMoveCallbacks.push((event: paper.ToolEvent) => {
      this.point = { x: event.point.x, y: event.point.y };
      this.handleHover(event.point);
      logger.updateCoordinates(event.point.x, event.point.y);
    })
  }

  updateEventHandlers(): void {
    if (!this.view) throw new Error("view not found");
    this.view.onMouseDown = (event: paper.ToolEvent) => {
      this.onMouseDownCallbacks.forEach((callback) => callback(event))
    }
    this.view.onMouseDrag = (event: paper.ToolEvent) => {
      this.onMouseDragCallbacks.forEach((callback) => callback(event))
    }
    this.view.onMouseUp = (event: paper.ToolEvent) => {
      this.onMouseUpCallbacks.forEach((callback) => callback(event))
    }
    this.view.onMouseMove = (event: paper.ToolEvent) => {
      this.onMouseMoveCallbacks.forEach((callback) => callback(event))
    }
    this.view.onDoubleClick = (event: paper.ToolEvent) => {
      this.onDoubleClickCallbacks.forEach((callback) => callback(event))
    }
    document.addEventListener('keydown', (event: KeyboardEvent) => {
      this.onKeyDownCallbacks.forEach((callback) => callback(event))
    })
  }

  addEventHandlers({ onMouseDown, onMouseDrag, onMouseUp, onMouseMove, onDoubleClick, onKeyDown }: {
    onMouseDown?: (event: paper.ToolEvent) => void
    onMouseDrag?: (event: paper.ToolEvent) => void
    onMouseUp?: (event: paper.ToolEvent) => void
    onMouseMove?: (event: paper.ToolEvent) => void
    onDoubleClick?: (event: paper.ToolEvent) => void
    onKeyDown?: (event: KeyboardEvent) => void
  }): void {

    if (onMouseDown) this.onMouseDownCallbacks.push(onMouseDown);
    if (onMouseDrag) this.onMouseDragCallbacks.push(onMouseDrag);
    if (onMouseUp) this.onMouseUpCallbacks.push(onMouseUp);
    if (onMouseMove) this.onMouseMoveCallbacks.push(onMouseMove);
    if (onDoubleClick) this.onDoubleClickCallbacks.push(onDoubleClick);
    if (onKeyDown) this.onKeyDownCallbacks.push(onKeyDown);

    this.updateEventHandlers();
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


  importFont(_file: File): void {
    const reader = new FileReader();
    reader.onload = (e) => {
      const font = e.target?.result as string;
      console.log("Importing font", font);
    }
  }


  importSVG(file: File): void {
    if (!this.project || !paper.project.activeLayer) throw new Error("Project or layer not found");

    const reader = new FileReader();
    console.log("Reading SVG file", file.name);

    reader.onload = (e) => {
      const svgContent = e.target?.result as string;

      try {
        const activeLayer = paper.project.activeLayer;
        // Import SVG to active layer
        console.log("Importing SVG to active layer", activeLayer.name);
        const svg = activeLayer.importSVG(svgContent);

        if (svg instanceof paper.Group) {
          svg.clipped = false;
        }
        // Give the imported SVG a unique name to avoid conflicts
        if (svg) {
          svg.name = `${file.name}_${Date.now()}`;
        }

        ungroupSVG(svg);
        uiService.renderPathItems();

        console.log("SVG imported successfully:", svg?.name);
      } catch (error) {
        console.error("Error importing SVG:", error);
        alert("Failed to import SVG file. Please check the file format.");
      }
    }

    reader.onerror = () => {
      console.error("Error reading file");
      alert("Failed to read the file. Please try again.");
    }

    reader.readAsText(file);
  }

  /**
   * Trigger file input for SVG import
   */
  triggerSVGImport(): void {
    const fileInput = document.getElementById('file-input') as HTMLInputElement;
    if (fileInput) {
      fileInput.click();
    }
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

  zoomAtPoint(event: MouseEvent, zoomIn: boolean): void {
    if (!this.view) throw new Error("View not found");

    const oldZoom = this.view.zoom;
    const zoomFactor = zoomIn ? 1.1 : 0.9;
    const newZoom = oldZoom * zoomFactor;

    // Get mouse position in screen (view) coordinates
    const mousePoint = new paper.Point(event.offsetX, event.offsetY);

    // Convert mouse position to project (world) coordinates before zoom
    const viewPositionBefore = this.view.viewToProject(mousePoint);

    zoom.setZoom(newZoom);

    // Convert mouse position again after zoom
    const viewPositionAfter = this.view.viewToProject(mousePoint);

    // Calculate how much the world point moved due to zoom change
    const offset = viewPositionBefore.subtract(viewPositionAfter);

    // Adjust view center so the point under the cursor stays fixed
    this.view.center = this.view.center.add(offset);
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
  setAlertSelectionChangeCallback(callback: (({ id, layer }: { id: string | null, layer?: boolean }) => void)): void {
    this.alertSelectionChange = callback;
  }


  getAllItems(): paper.Item[] {
    if (!this.project) throw new Error("Project not found");
    return this.project.getItems({
      class: paper.Path || paper.CompoundPath || paper.Shape
    });
  }

  /**
   * Select an item (replaces previous selection)
   */
  selectItem(item: paper.Item): void {
    this.deselectAll();

    if (item instanceof paper.Layer) {
      // Layer selected - clear item selection, set active layer
      let layer = item;
      if (layer.data.type === 'syllable') { // only jamo layer can be selected
        layer = layer.children[0] as paper.Layer;
      }

      layer.activate();

      // Notify UI: layer selected, no item selected
      if (layer.id && this.alertSelectionChange) {
        this.alertSelectionChange({ id: layer.id.toString(), layer: true });
      }
    } else {
      // Item selected - add to selection array
      this.drawingState.selectedItems = [item];
      item.selected = true;

      const parentLayer = findParentLayer(item);
      if (parentLayer) {
        parentLayer.activate();

        // Notify UI: item selected, parent layer active
        if (item.id && this.alertSelectionChange) {
          this.alertSelectionChange({ id: item.id.toString() });
        }
      } else {
        // No parent layer found
        // if (item.id && this.alertSelectionChange) {
        //   this.alertSelectionChange(item.id.toString(), true);
        // }
      }
    }
  }

  /**
   * Item selection methods
   */

  // When Item selected by UI
  updateItemSelection(id: string): void {
    const item = this.getItemById(id);
    if (item) {
      this.selectItem(item);
    }

  }

  deselectItem(item: paper.Item): void {
    item.selected = false;

  }

  selectPoint(point: paper.PathItem): void {
    this.deselectAll()
    this.drawingState.selectedPoint = point
    point.fillColor = new paper.Color(colors.error)
  }

  deselectPoint(point: paper.PathItem): void {
    point.fillColor = new paper.Color(colors.black)
  }

  /**
   * Deselect all items (but keep active layer)
   */
  deselectAll(): void {
    // Deselect all selected items
    this.drawingState.selectedItems.forEach(item => {
      this.deselectItem(item);
      item.selected = false;
    });
    this.drawingState.selectedItems = [];

    if (this.drawingState.selectedPoint) {
      this.deselectPoint(this.drawingState.selectedPoint)
      this.drawingState.selectedPoint.selected = false;
      this.drawingState.selectedPoint = null
    }

    // Ensure there's always an active layer
    this.ensureActiveLayer();

    // Clear item selection in UI (but keep active layer)
    if (this.alertSelectionChange) {
      const activeLayer = paper.project.activeLayer;
      console.log('Canvas deselectAll - notifying UI with layerId:', activeLayer.id.toString());
      this.alertSelectionChange({ id: null }); // Empty string indicates clear item selection
    }
  }

  /**
   * Clear all selections including active layer
   */
  clearAllSelections(): void {
    this.deselectAll();

    // Clear all selections in UI
    if (this.alertSelectionChange) {
      this.alertSelectionChange({ id: null }); // Clear everything
    }
  }

  /**
   * Ensure there's always an active layer
   */
  ensureActiveLayer(): void {
    if (paper.project.activeLayer.name.includes('system')) {
      // change active layer to the first layer
      paper.project.layers.filter((layer) => !layer.name.includes('system'))[0].activate();

    }
  }


  /**
   * Set the simplification tolerance for pencil tool
   * @param tolerance - Higher values create simpler paths (default: 10)
   */
  setSimplificationTolerance(tolerance: number): void {
    this.simplificationTolerance = Math.max(1, tolerance);
    console.log(`Simplification tolerance set to: ${this.simplificationTolerance}`);
  }

  /**
   * Get the current simplification tolerance
   */
  getSimplificationTolerance(): number {
    return this.simplificationTolerance;
  }

  /**
   * Handle hover effects for path items
   */
  handleHover(point: paper.Point): void {
    if (!this.project) return;

    // Find items at the hover point
    const hitResult = this.hitTest(point);

    const newHoveredItem = hitResult ? hitResult.item : null;

    // Skip hover effect for selected items
    const shouldHover = newHoveredItem && !newHoveredItem.selected;

    // Determine the actual item to hover (null if it's selected)
    const targetHoveredItem = shouldHover ? newHoveredItem : null;

    // If hovering over a different item, update hover state
    if (targetHoveredItem !== this.hoveredItem) {
      // Restore previous hovered item
      if (this.hoveredItem) {
        this.restoreHoverEffect(this.hoveredItem);
        console.log("restore hover effect", this.hoveredItem);
      }

      // Set new hovered item (only if not selected)
      this.hoveredItem = targetHoveredItem;

      // Apply hover effect to new item
      if (this.hoveredItem) {
        this.applyHoverEffect(this.hoveredItem);
        console.log("apply hover effect", this.hoveredItem);
      }
    }
  }

  /**
   * Apply hover effect (stroke color) to an item
   */
  private applyHoverEffect(item: paper.Item): void {
    if (!(item instanceof paper.Path || item instanceof paper.CompoundPath || item instanceof paper.Shape)) {
      return;
    }

    // Store original stroke color and width if not already stored
    if (!(item as any).originalStrokeColor) {
      (item as any).originalStrokeColor = item.strokeColor ? item.strokeColor.clone() : null;
    }

    if (!(item as any).originalStrokeWidth) {
      (item as any).originalStrokeWidth = item.strokeWidth;
    }

    const isClosed =
      item instanceof paper.Path && item.closed ||
      item instanceof paper.CompoundPath && Array.from(item.children).every(child => child instanceof paper.Path ? child.closed : true) ||
      item instanceof paper.Shape;

    // For both closed and open items, change stroke color
    item.strokeColor = new paper.Color(colors.secondary);

    // For closed items without stroke, add a visible stroke width
    if (isClosed && (item.strokeWidth === 0 || !item.strokeWidth)) {
      item.strokeWidth = 2;
    }
  }

  /**
   * Restore hover effect for an item
   */
  private restoreHoverEffect(item: paper.Item): void {
    if (!(item instanceof paper.Path || item instanceof paper.CompoundPath || item instanceof paper.Shape)) {
      return;
    }

    // Restore original stroke color
    if ((item as any).originalStrokeColor !== undefined) {
      item.strokeColor = (item as any).originalStrokeColor;
      (item as any).originalStrokeColor = undefined;
    }

    // Restore original stroke width
    if ((item as any).originalStrokeWidth !== undefined) {
      item.strokeWidth = (item as any).originalStrokeWidth;
      (item as any).originalStrokeWidth = undefined;
    }
  }

  /**
   * Clear all hover effects
   */
  clearHoverEffects(): void {
    if (this.hoveredItem) {
      this.restoreHoverEffect(this.hoveredItem);
      this.hoveredItem = null;
    }
  }

  // /**
  //  * Start dragging a selected item (calculate offset)
  //  */
  // startDraggingItem(grabPoint: paper.Point): void {
  //   if (this.drawingState.selectedItems.length > 0) {
  //     // Store initial positions of all selected items
  //     this.drawingState.initialDragPositions = this.drawingState.selectedItems.map(item => ({
  //       item: item,
  //       position: item.position.clone()
  //     }));

  //     // Calculate offset between grab point and first item center
  //     const firstItem = this.drawingState.selectedItems[0];
  //     this.drawingState.dragOffset = grabPoint.subtract(firstItem.position);
  //   }
  // }



  /**
   * Start drag selection (marquee selection)
   */
  startDragSelection(point: paper.Point): void {
    this.drawingState.isDragSelecting = true;
    this.drawingState.dragSelectionStart = point.clone();

    // Use PreviewBox singleton to show the selection box
    previewBox.show(point);

  }


  /**
   * Cancel drag selection
   */
  cancelDragSelection(): void {
    if (this.drawingState.isDragSelecting) {
      // Use PreviewBox singleton to hide the selection box
      previewBox.hide();
      this.drawingState.dragSelectionStart = null;
      this.drawingState.isDragSelecting = false;
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

  public getLayerData = (jamo: string, syllable: string): string[] => {
    //TODO: handle same jamo in the same syllable
    // find layer
    const layer = paper.project.layers.find((layer: any) => layer.name === jamo && layer.data.syllableString === syllable);
    if (!layer) throw new Error("Layer not found");

    // get layer data
    return layer.children.filter((item: any) => item instanceof paper.PathItem)
      .map((item: any) => item.pathData) || [];

  }

  public importLayerData = (jamo: string, syllable: string, pathData: string) => {
    const layer = paper.project.layers.find((layer: any) => layer.name === jamo && layer.data.syllableString === syllable);
    if (!layer) throw new Error("Layer not found");

    // Clear layer first - collect items to remove first, then remove them
    const itemsToRemove = layer.children.filter((item: any) =>
      item instanceof paper.PathItem || item instanceof paper.CompoundPath
    );

    // Remove items in reverse order to avoid index shifting issues
    for (let i = itemsToRemove.length - 1; i >= 0; i--) {
      itemsToRemove[i].remove();
    }

    // Split path data by "M" command to handle multiple closed paths
    const splitPaths = pathData
      .split(/(?=M)/) // Split before "M" but keep "M" in the result
      .filter(path => path.trim() !== "") // Remove empty strings
      .map(path => path.trim()); // Clean up whitespace

    console.log(`[CanvasService] Importing ${splitPaths.length} path(s) to layer ${jamo}`);

    // Create separate path objects for each segment and close them
    const paths: paper.Path[] = [];
    splitPaths.forEach((pathSegment) => {
      const path = new paper.Path(pathSegment);
      closePath(path);
      paths.push(path);
    });

    // Create a compound path from the individual paths
    const compoundPath = new paper.CompoundPath({ children: paths });
    compoundPath.fillColor = new paper.Color(colors.black);
    compoundPath.fillRule = "evenodd";
    compoundPath.parent = layer;

    console.log(`[CanvasService] Successfully imported to layer ${jamo}`);
    console.log(compoundPath)
  }
} export default CanvasService;
