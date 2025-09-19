
import paper from 'paper';
import * as hangul from 'hangul-js';

import { lerpPoint } from '../utils/helper';
import { colors } from '../utils/styles';
import type { DrawingState } from '../types';
import { findParentLayer } from '../utils/paperUtils';
import { previewBox } from '../helpers';


class CanvasService {
  private static instance: CanvasService | null = null
  private project: paper.Project | null = null
  private view: paper.View | null = null
  private point: { x: number, y: number } = { x: 0, y: 0 };
  private activeLayer: paper.Layer | null = null;
  private updateItemsCallback: ((element: any) => void) | null = null;

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
  private alertSelectionChange: ((itemId: string, selected: boolean, layerId?: string) => void) | null = null;

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
    this.createHelperLayer();

    this.setupHelpers();
    // this.createBackgroundLayer();

    // Ensure there's always an active layer
    // this.ensureActiveLayer();

    // Periodic sync check (fallback)
    this.setupPeriodicSync();
  }

  setUpdateItemsCallback(callback: (element: any) => void): void {
    this.updateItemsCallback = callback;
  }

  updateItems() {
    if (this.updateItemsCallback && this.project) {
      const layers = this.project.layers.filter(layer => !layer.name.includes('system'));
      this.updateItemsCallback(layers || []);
    }
  }

  createHelperLayer(): void {
    const helperLayer = new paper.Layer();
    helperLayer.visible = true;
    helperLayer.name = 'system-helper';
    this.project?.addLayer(helperLayer);
  }

  setupHelpers(): void {
    const helperLayer = this.project?.layers.find(layer => layer.name === 'system-helper');
    if (!helperLayer) throw new Error("Helper layer not found");

    previewBox.init();
    helperLayer.addChild(previewBox.getPreviewBox());
  }

  createBackgroundLayer(): void {
    const backgroundLayer = new paper.Layer();
    backgroundLayer.visible = false;
    backgroundLayer.name = 'system-backgrond';
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

  addLayer(name: string, index: number, font?: string): void {
    // asume that the name is single Hangul letter
    if (!this.project) throw new Error("Project not found");

    const disassembled = hangul.disassemble(name);

    // add syllable layer
    const layer = new paper.Layer();
    layer.data.type = 'syllable';
    layer.data.string = name;
    layer.data.font = font || '';
    layer.name = name + " " + (index + 1);
    this.project.addLayer(layer);

    // add jamo layers
    disassembled.forEach((jamo, jamoIndex) => {
      const jamoLayer = new paper.Layer();
      jamoLayer.data.type = 'jamo';
      jamoLayer.data.string = jamo;
      jamoLayer.data.font = font || '';
      jamoLayer.name = jamo + " " + (jamoIndex + 1);
      layer.addChild(jamoLayer);
    });

    // Select the letter layer
    this.selectItem(layer);
    this.updateItems();
  }

  importFont(file: File): void {
    const reader = new FileReader();
    reader.onload = (e) => {
      const font = e.target?.result as string;
      console.log("Importing font", font);
    }
  }


  importSVG(file: File): void {
    if (!this.project || !this.activeLayer) throw new Error("Project or layer not found");

    const reader = new FileReader();
    console.log("Reading SVG file", file.name);

    reader.onload = (e) => {
      if (!this.activeLayer) throw new Error("Active layer not found");
      const svgContent = e.target?.result as string;

      try {
        // Import SVG to active layer
        console.log("Importing SVG to active layer", this.activeLayer.name);
        const svg = this.activeLayer.importSVG(svgContent);

        if (svg instanceof paper.Group) {
          svg.clipped = false;
        }

        // Give the imported SVG a unique name to avoid conflicts
        if (svg) {
          svg.name = `${file.name}_${Date.now()}`;
        }

        this.updateItems();
        if (this.alertSelectionChange) { // select current active layer
          this.alertSelectionChange(this.activeLayer.id.toString(), true, this.activeLayer.id.toString());
        }

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
  setAlertSelectionChangeCallback(callback: (itemId: string, selected: boolean, layerId?: string) => void): void {
    this.alertSelectionChange = callback;
  }

  //---------------------------------
  // Pencil Tool methods
  //---------------------------------

  startDrawing(point: paper.Point): paper.Path | null {
    if (!this.project) throw new Error('Paper.js project not initialized');

    this.drawingState.currentDrawing = new paper.Path();
    // this.drawingState.currentDrawing.fullySelected = true;
    this.selectItem(this.drawingState.currentDrawing);
    this.drawingState.currentDrawing.strokeColor = new paper.Color(colors.black);
    this.drawingState.currentDrawing.strokeWidth = 1;
    this.drawingState.currentDrawing.add(point);

    return this.drawingState.currentDrawing;
  }

  continueDrawing(point: paper.Point): void {
    if (this.drawingState.currentDrawing) {
      this.drawingState.currentDrawing.add(point);
    }
  }

  finishDrawing(point: paper.Point): { success: boolean; simplificationInfo?: { original: number; simplified: number; saved: number; percentage: number } } {
    if (this.drawingState.currentDrawing) {
      this.drawingState.currentDrawing.add(point);

      // Apply path simplification for pencil tool
      const simplificationInfo = this.simplifyPath(this.drawingState.currentDrawing);
      this.closeVector(this.drawingState.currentDrawing);

      this.drawingState.currentDrawing = null;
      return { success: true, simplificationInfo: simplificationInfo ?? undefined }
    }
    return { success: false }
  }

  simplifyPath(path: paper.Path): { original: number; simplified: number; saved: number; percentage: number } | null {
    if (path && path.segments.length > 2) {
      const originalCount = path.segments.length;

      // Simplify the path with configurable tolerance
      path.simplify(this.simplificationTolerance);

      const simplifiedCount = path.segments.length;
      const saved = originalCount - simplifiedCount;
      const percentage = Math.round(saved / originalCount * 100);

      console.log(`Path simplified: ${saved} of ${originalCount} segments removed. Saving ${percentage}%`);

      return {
        original: originalCount,
        simplified: simplifiedCount,
        saved: saved,
        percentage: percentage
      };
    }
    return null;
  }

  // ---------------------------------
  // Pen Tool methods
  // ---------------------------------

  startPathing(point: paper.Point) {
    // mouse down trigger - start a new path or add a point
    if (!this.drawingState.currentPath) {
      // Start a new path
      this.drawingState.currentPath = new paper.Path();
      this.drawingState.currentPath.strokeColor = new paper.Color(colors.black);
      this.drawingState.currentPath.strokeWidth = 1;
      this.drawingState.currentPath.add(point);
      this.selectItem(this.drawingState.currentPath);
    } else {
      // Add a new point to existing path
      this.drawingState.currentPath.add(point);
      console.log("handle", this.drawingState.currentPath.segments[this.drawingState.currentPath.segments.length - 1]?.handleIn, this.drawingState.currentPath.segments[this.drawingState.currentPath.segments.length - 1]?.handleOut);
    }
  }

  continuePathing(point: paper.Point) {
    // mouse drag trigger - preview the curve by adjusting the last segment's handle
    if (!this.drawingState.currentPath) return;

    const segments = this.drawingState.currentPath.segments;
    if (segments.length > 0) {
      const currentSegment = segments[segments.length - 1];
      // Create a smooth curve by setting the handle out point
      const handleVector = point.subtract(currentSegment.point);
      currentSegment.handleOut = handleVector;
      if (segments.length > 1) {
        // if current point is not the first point, set inner handle
        currentSegment.handleIn = currentSegment.handleOut.clone().multiply(-1);

        // if prev point hasn't dragged, set it's outer handle to the tangent of the line between current and prev point
        const lastSegment = segments[segments.length - 2];
        const direction = point.subtract(lastSegment.point);
        lastSegment.handleOut = direction.normalize();
      }
    }
  }

  finishPathing(point: paper.Point) {
    // mouse up - finalize the current segment with proper handles
    if (!this.drawingState.currentPath) return;

    const segments = this.drawingState.currentPath.segments;

    if (segments.length > 1) { // prev point is existing
      const lastSegment = segments[segments.length - 2];
      const currentSegment = segments[segments.length - 1];

      // if prev has dragged, and current hasn't dragged
      if (lastSegment.handleOut.x !== 0 && lastSegment.handleOut.y !== 0 && currentSegment.handleOut.x === 0 && currentSegment.handleOut.y === 0) {
        // set current inner handle to the tangent of the line between current and prev point
        const direction = point.subtract(lastSegment.point);
        currentSegment.handleIn = direction.normalize();
      }
    }
  }

  terminatePathing() {
    // Terminate the current path and add it to the layer
    if (this.drawingState.currentPath) {
      this.closeVector(this.drawingState.currentPath);
      this.updateItems();
      this.drawingState.currentPath = null;
    }
  }

  closeVector(path: paper.Path) {
    path.closed = true;
    path.fillColor = new paper.Color(colors.black);

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

      this.activeLayer = layer;
      layer.activate();

      // Notify UI: layer selected, no item selected
      if (layer.id && this.alertSelectionChange) {
        this.alertSelectionChange(layer.id.toString(), true, layer.id.toString());
      }
    } else {
      // Item selected - add to selection array
      this.drawingState.selectedItems = [item];
      item.selected = true;

      const parentLayer = findParentLayer(item);
      if (parentLayer) {
        parentLayer.activate();
        this.activeLayer = parentLayer;

        // Notify UI: item selected, parent layer active
        if (item.id && this.alertSelectionChange) {
          this.alertSelectionChange(item.id.toString(), true, parentLayer.id.toString());
        }
      } else {
        // No parent layer found
        if (item.id && this.alertSelectionChange) {
          this.alertSelectionChange(item.id.toString(), true);
        }
      }
    }
  }

  /**
   * Add item to selection (for multi-selection)
   */
  addToSelection(item: paper.Item): void {
    if (item instanceof paper.Layer) {
      // Layers can't be multi-selected, just select the layer
      this.selectItem(item);
      return;
    }

    // Check if item is already selected
    const isAlreadySelected = this.drawingState.selectedItems.some(selectedItem => selectedItem.id === item.id);

    if (!isAlreadySelected) {
      // Add to selection
      this.drawingState.selectedItems.push(item);
      item.selected = true;

      // Set active layer if this is the first item
      if (this.drawingState.selectedItems.length === 1) {
        const parentLayer = findParentLayer(item);
        if (parentLayer) {
          parentLayer.activate();
          this.activeLayer = parentLayer;
        }
      }

      // Notify UI about the selection
      if (item.id && this.alertSelectionChange) {
        this.alertSelectionChange(item.id.toString(), true, this.activeLayer?.id.toString());
      }
    }
  }

  /**
   * Remove item from selection
   */
  removeFromSelection(item: paper.Item): void {
    const index = this.drawingState.selectedItems.findIndex(selectedItem => selectedItem.id === item.id);

    if (index !== -1) {
      // Remove from selection
      this.drawingState.selectedItems.splice(index, 1);
      item.selected = false;

      // Notify UI about the deselection
      if (item.id && this.alertSelectionChange) {
        this.alertSelectionChange(item.id.toString(), false, this.activeLayer?.id.toString());
      }
    }
  }

  /**
   * Toggle item selection (for Ctrl/Cmd+click)
   */
  toggleItemSelection(item: paper.Item): void {
    if (item instanceof paper.Layer) {
      // Layers can't be multi-selected, just select the layer
      this.selectItem(item);
      return;
    }

    const isSelected = this.drawingState.selectedItems.some(selectedItem => selectedItem.id === item.id);

    if (isSelected) {
      this.removeFromSelection(item);
    } else {
      this.addToSelection(item);
    }
  }

  /**
   * Item selection methods
   */

  getSelectedItems(): any[] {
    return this.drawingState.selectedItems;
  }
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
      console.log('Canvas deselectAll - notifying UI with layerId:', this.activeLayer?.id.toString());
      this.alertSelectionChange('', false, this.activeLayer?.id.toString() ?? ''); // Empty string indicates clear item selection
    }
  }

  /**
   * Clear all selections including active layer
   */
  clearAllSelections(): void {
    this.deselectAll();
    this.activeLayer = null;

    // Clear all selections in UI
    if (this.alertSelectionChange) {
      this.alertSelectionChange('', false, ''); // Clear everything
    }
  }

  /**
   * Ensure there's always an active layer
   */
  ensureActiveLayer(): void {
    if (!this.activeLayer && this.project) {
      // Find the first layer or create one
      const layers = this.project.layers;
      if (layers.length > 0) {
        this.activeLayer = layers[0];
        this.activeLayer.activate();
      } else {
        // Create a default layer
        window.alert('Please add a layer first');
      }
    }
  }


  /**
   * Handle when the active layer changes (e.g., when a layer is deleted)
   */
  private handleActiveLayerChange(): void {
    if (!this.project) return;

    // Get the current active layer from Paper.js
    const newActiveLayer = this.project.activeLayer;

    // Update our internal state
    this.activeLayer = newActiveLayer;

    // Notify UI about the active layer change
    if (this.alertSelectionChange && newActiveLayer) {
      this.alertSelectionChange('', false, newActiveLayer.id.toString());
    }

    console.log('Active layer updated to:', newActiveLayer.name);
  }

  /**
   * Manually sync active layer from Paper.js (useful for debugging)
   */
  public syncActiveLayerFromPaper(): void {
    if (!this.project) return;

    const paperActiveLayer = this.project.activeLayer;
    if (paperActiveLayer && paperActiveLayer !== this.activeLayer) {
      console.log('Syncing active layer from Paper.js:', paperActiveLayer.name);
      this.handleActiveLayerChange();
    }
  }

  /**
   * Setup periodic sync as fallback (in case events don't catch everything)
   */
  private setupPeriodicSync(): void {
    // Check every 1 second if we're still in sync
    setInterval(() => {
      this.syncActiveLayerFromPaper();
    }, 1000);
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

    // If hovering over a different item, update hover state
    if (newHoveredItem !== this.hoveredItem) {
      // Restore previous hovered item
      if (this.hoveredItem) {
        this.restoreHoverEffect(this.hoveredItem);
        console.log("restore hover effect", this.hoveredItem);
      }

      // Set new hovered item
      this.hoveredItem = newHoveredItem;

      // Apply hover effect to new item
      if (this.hoveredItem) {
        this.applyHoverEffect(this.hoveredItem);
        console.log("apply hover effect", this.hoveredItem);
      }
    }
  }

  /**
   * Apply hover effect (orange color) to an item
   */
  private applyHoverEffect(item: paper.Item): void {
    if (!(item instanceof paper.Path || item instanceof paper.CompoundPath || item instanceof paper.Shape)) {
      return;
    }

    // Apply orange color
    item.strokeColor = new paper.Color(colors.orange);
    item.strokeWidth = 1;
  }

  /**
   * Restore hover effect for an item
   */
  private restoreHoverEffect(item: paper.Item): void {
    if (!(item instanceof paper.Path || item instanceof paper.CompoundPath || item instanceof paper.Shape)) {
      return;
    }

    item.strokeColor = new paper.Color(colors.black);

    if (item.fillColor !== null) {
      item.strokeWidth = 0;
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

  /**
   * Start dragging a selected item (calculate offset)
   */
  startDraggingItem(grabPoint: paper.Point): void {
    if (this.drawingState.selectedItems.length > 0) {
      // Store initial positions of all selected items
      this.drawingState.initialDragPositions = this.drawingState.selectedItems.map(item => ({
        item: item,
        position: item.position.clone()
      }));

      // Calculate offset between grab point and first item center
      const firstItem = this.drawingState.selectedItems[0];
      this.drawingState.dragOffset = grabPoint.subtract(firstItem.position);
    }
  }

  /**
   * Move a selected point
   */
  moveSelectedPoint(point: paper.Point): void {
    if (this.drawingState.selectedPoint) {
      this.drawingState.selectedPoint.position = point;
    }

    // Move all selected items
    if (this.drawingState.selectedItems.length > 0 && this.drawingState.initialDragPositions.length > 0) {
      if (this.drawingState.dragOffset) {
        // Calculate the target position for the first item based on drag offset
        const firstInitialPosition = this.drawingState.initialDragPositions[0].position;
        const targetPosition = point.subtract(this.drawingState.dragOffset);

        // Calculate the delta from initial position to target position
        const delta = targetPosition.subtract(firstInitialPosition);

        // Apply delta to all items based on their initial positions
        this.drawingState.initialDragPositions.forEach((initialPos, index) => {
          const item = this.drawingState.selectedItems[index];
          if (item) {
            item.position = initialPos.position.add(delta);
          }
        });
      } else {
        // Fallback: move all items to the same position (shouldn't happen normally)
        this.drawingState.selectedItems.forEach(item => {
          item.position = point;
        });
      }
    }
  }

  /**
   * Stop dragging (clear offset)
   */
  stopDraggingItem(): void {
    this.drawingState.dragOffset = null;
    this.drawingState.initialDragPositions = [];
  }

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
   * Update drag selection box
   */
  updateDragSelection(point: paper.Point): void {
    if (this.drawingState.isDragSelecting) {
      // Use PreviewBox singleton to update the selection box
      previewBox.update(point);
    }
  }

  /**
   * Finish drag selection and select intersecting items
   */
  finishDragSelection(): void {
    if (this.drawingState.isDragSelecting) {
      console.log("finishDragSelection");
      // Get the normalized preview box bounds for intersection testing
      const selectionBounds = previewBox.getNormalizedBoundingBox();

      // Find all items that intersect with the selection box
      const intersectingItems: paper.Item[] = this.getAllItems().filter(item => selectionBounds.intersects(item.bounds) && !item.name.includes('system'));

      // Select all intersecting items
      if (intersectingItems.length > 0) {
        this.drawingState.selectedItems = intersectingItems;
        intersectingItems.forEach(item => {
          item.selected = true;
        });

        // Notify UI about the selection
        if (this.alertSelectionChange) {
          this.alertSelectionChange(intersectingItems[0].id.toString(), true, this.activeLayer?.id.toString());
        }
      }

      // Clean up drag selection using PreviewBox
      previewBox.hide();
      this.drawingState.dragSelectionStart = null;
      this.drawingState.isDragSelecting = false;

      console.log('Drag selection finished, selected items:', intersectingItems?.length || 0);
    }
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

} export default CanvasService;




