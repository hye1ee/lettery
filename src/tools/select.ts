import paper from 'paper'
import type { Tool } from '../types'
import { boundingBox, cursor, logger, previewBox } from '../helpers';
import { findParentLayer } from '../utils/paperUtils';
import { canvasService, historyService, uiService } from '../services';

export default class SelectTool implements Tool {
  private static instance: SelectTool | null = null;

  readonly id: string = 'select';
  readonly shortcut: string = 'v';
  readonly cursorStyle: string = 'default';

  private isDragSelecting: boolean = false;
  private isDragMoving: boolean = false;
  private isScaling: boolean = false;
  private isRotating: boolean = false;
  private dragStartPoint: paper.Point | null = null;
  private dragStartPositions: Map<number, paper.Point> = new Map();
  private scaleHandleIndex: number | null = null;
  private scaleOrigin: paper.Point | null = null;
  private initialBounds: paper.Rectangle | null = null;
  private initialItemBounds: Map<number, paper.Rectangle> = new Map();
  private rotationCenter: paper.Point | null = null;
  private initialRotations: Map<number, number> = new Map();
  private startAngle: number = 0;
  private onToolSwitch: ((toolId: string) => void) | null = null;

  activate(): void {
    cursor.updateCursor(this.cursorStyle);
    // TODO: Implement activate logic
  }

  deactivate(): void {
    // Default deactivate - clear selection
    this.deactivateWithNextTool('');
  }

  deactivateWithNextTool(nextTool: string): void {
    // Only preserve selection when switching to edit tool
    if (nextTool !== 'edit') {
      paper.project.deselectAll();
    }
    boundingBox.hide();
    this.dragStartPoint = null;
    this.dragStartPositions.clear();
    this.initialItemBounds.clear();
    this.initialRotations.clear();
    this.isDragSelecting = false;
    this.isDragMoving = false;
    this.isScaling = false;
    this.isRotating = false;
    this.scaleHandleIndex = null;
    this.scaleOrigin = null;
    this.initialBounds = null;
    this.rotationCenter = null;
    this.startAngle = 0;
    cursor.resetCursor();
  }

  private constructor() { }

  static getInstance(): SelectTool {
    if (!SelectTool.instance) {
      SelectTool.instance = new SelectTool()
    }
    return SelectTool.instance
  }

  /**
   * Set the callback for tool switching
   */
  setToolSwitchCallback(callback: (toolId: string) => void): void {
    this.onToolSwitch = callback;
  }

  onKeyDown = (event: KeyboardEvent): void => {
    // backspace or delete
    if (event.key === 'Backspace' || event.key === 'Delete') {
      event.preventDefault();
      this.getSelectedItems().forEach(item => item.remove());

      boundingBox.hide();
      uiService.renderPathItems();
      historyService.saveSnapshot('delete');
      logger.updateStatus(`Deleted ${this.getSelectedItems().length} item(s)`);
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowRight' || event.key === 'ArrowUp' || event.key === 'ArrowDown') { // arrow keys
      event.preventDefault();

      this.getSelectedItems().forEach(item => {
        item.position = item.position.add(
          new paper.Point(
            event.key === 'ArrowLeft' ? -10 : event.key === 'ArrowRight' ? 10 : 0,
            event.key === 'ArrowUp' ? -10 : event.key === 'ArrowDown' ? 10 : 0
          ).multiply(event.shiftKey ? 10 : 1)
        );
      });

      boundingBox.show(this.getSelectedItems());
      historyService.saveSnapshot('move');
      logger.updateStatus(`Moved ${this.getSelectedItems().length} item(s)`);
    }
  }

  onDoubleClick = (event: paper.ToolEvent): void => {
    event.preventDefault();

    const hitResult = paper.project.hitTest(event.point);

    if (hitResult && hitResult.item.name && !hitResult.item.name.includes('system')) {
      // Select the item if not already selected
      if (!hitResult.item.selected) {
        paper.project.deselectAll();
        this.selectItem(hitResult.item);
      }

      // Switch to edit tool
      if (this.onToolSwitch) {
        this.onToolSwitch('edit');
        logger.updateStatus('Switched to edit tool - Double click to edit');
      }
    }
  }

  onMouseDown = (event: paper.ToolEvent): void => {
    event.preventDefault();

    const hitResult = paper.project.hitTest(event.point);
    const isMultiSelect = event && (event.modifiers?.control || event.modifiers?.meta);

    // Check if we hit a rotation handle
    if (hitResult && hitResult.item.name && hitResult.item.name === 'system-rotation-handle') {
      this.startRotation(event.point);
      logger.updateStatus('Rotating...');
      return;
    }

    // Check if we hit a scale handle
    if (hitResult && hitResult.item.name && hitResult.item.name.includes('system-scale-handle')) {
      // Extract handle index from name (e.g., 'system-scale-handle-0' -> 0)
      const handleIndex = parseInt(hitResult.item.name.split('-').pop() || '0');
      this.startScaling(event.point, handleIndex);
      logger.updateStatus('Scaling...');
      return;
    }

    if (hitResult && hitResult.item.name && !hitResult.item.name.includes('system')) {
      // (1) Select Item
      if (!isMultiSelect && !this.getSelectedItems().some(item => item.id === hitResult.item.id)) {
        paper.project.deselectAll();
        uiService.renderPathItems();
      }

      this.selectItem(hitResult.item);
      this.grabPoint(event.point);
      logger.updateStatus('Item selected');
    } else if (!hitResult || (hitResult.item.name && hitResult.item.name.includes('system'))) {
      // (2) Drag Selection
      paper.project.deselectAll();
      uiService.renderPathItems();

      this.isDragSelecting = true;
      previewBox.show(event.point);

      logger.updateStatus('Drag selection started')
    }
  }

  selectItem(item: paper.Item): void {
    // Clear hover effects before selecting
    canvasService.clearHoverEffects();

    item.selected = true;

    boundingBox.show(this.getSelectedItems());

    const parentLayer = findParentLayer(item);
    if (parentLayer) {
      parentLayer.activate();
    }
    // change active layer
    uiService.renderPathItems();
  }

  grabPoint(grabPoint: paper.Point): void {
    const selectedItems = this.getSelectedItems();
    if (selectedItems.length > 0) {
      // Store initial positions of all selected items

      selectedItems.forEach((item) => {
        this.dragStartPositions.set(item.id, item.position.clone());
      });

      this.dragStartPoint = grabPoint;
    }
  }

  startScaling(startPoint: paper.Point, handleIndex: number): void {

    console.log("startScaling", startPoint, handleIndex);
    const selectedItems = this.getSelectedItems();
    if (selectedItems.length === 0) return;

    this.isScaling = true;
    this.scaleHandleIndex = handleIndex;
    this.dragStartPoint = startPoint;

    // Calculate combined bounds of all selected items
    let combinedBounds = selectedItems[0].bounds;
    selectedItems.forEach(item => {
      combinedBounds = combinedBounds.unite(item.bounds);
    });
    this.initialBounds = combinedBounds;

    // Store initial bounds of each item
    selectedItems.forEach(item => {
      this.initialItemBounds.set(item.id, item.bounds.clone());
    });

    // Determine the origin point (opposite corner/edge from the handle)
    // Handle indices go counter-clockwise from bottom-left:
    // 0: bottom-left, 1: left, 2: top-left, 3: top, 4: top-right, 5: right, 6: bottom-right, 7: bottom
    const oppositePoints = [
      combinedBounds.topRight,     // 0: bottom-left -> top-right
      combinedBounds.rightCenter,  // 1: left -> right
      combinedBounds.bottomRight,  // 2: top-left -> bottom-right
      combinedBounds.bottomCenter, // 3: top -> bottom
      combinedBounds.bottomLeft,   // 4: top-right -> bottom-left
      combinedBounds.leftCenter,   // 5: right -> left
      combinedBounds.topLeft,      // 6: bottom-right -> top-left
      combinedBounds.topCenter     // 7: bottom -> top
    ];

    this.scaleOrigin = oppositePoints[handleIndex];
  }

  startRotation(startPoint: paper.Point): void {
    console.log("startRotation", startPoint);
    const selectedItems = this.getSelectedItems();
    if (selectedItems.length === 0) return;

    this.isRotating = true;
    this.dragStartPoint = startPoint;

    // Calculate combined bounds center as rotation center
    let combinedBounds = selectedItems[0].bounds;
    selectedItems.forEach(item => {
      combinedBounds = combinedBounds.unite(item.bounds);
    });
    this.rotationCenter = combinedBounds.center;

    // Store initial rotation of each item
    selectedItems.forEach(item => {
      this.initialRotations.set(item.id, item.rotation || 0);
    });

    // Calculate initial angle from center to start point
    const vector = startPoint.subtract(this.rotationCenter);
    this.startAngle = Math.atan2(vector.y, vector.x);
  }

  getSelectedItems(): paper.Item[] {
    return paper.project.selectedItems.filter((item) => (item.name) && !item.name.includes("system"));
  }

  makeDragSelection(): void {
    console.log('makeDragSelection');
    paper.project.deselectAll();
    const selectionBounds = previewBox.getNormalizedBoundingBox();

    paper.project.getItems({
      class: paper.Path || paper.CompoundPath || paper.Shape
    }).filter(item => selectionBounds.intersects(item.bounds) && (item.name) && !item.name.includes('system'))
      .forEach(item => item.selected = true)
  }

  onMouseMove = (event: paper.ToolEvent): void => {
    const hitResult = paper.project.hitTest(event.point);

    // Check if hovering over rotation handle
    if (hitResult && hitResult.item.name && hitResult.item.name === 'system-rotation-handle') {
      cursor.updateCursor('grab');
      return;
    }

    // Check if hovering over a scale handle
    if (hitResult && hitResult.item.name && hitResult.item.name.includes('system-scale-handle')) {
      const handleIndex = parseInt(hitResult.item.name.split('-').pop() || '0');

      // Set cursor based on handle position
      // Counter-clockwise from bottom-left: 0: BL, 1: L, 2: TL, 3: T, 4: TR, 5: R, 6: BR, 7: B
      const cursorMap = [
        'nesw-resize', // 0: bottom-left corner (↗↙)
        'ew-resize',   // 1: left edge (↔)
        'nwse-resize', // 2: top-left corner (↖↘)
        'ns-resize',   // 3: top edge (↕)
        'nesw-resize', // 4: top-right corner (↗↙)
        'ew-resize',   // 5: right edge (↔)
        'nwse-resize', // 6: bottom-right corner (↖↘)
        'ns-resize'    // 7: bottom edge (↕)
      ];

      cursor.updateCursor(cursorMap[handleIndex] || 'default');
    } else if (hitResult && hitResult.item.name && !hitResult.item.name.includes('system')) {
      cursor.updateCursor('move');
    } else {
      cursor.updateCursor(this.cursorStyle);
    }
  }

  onMouseUp = (_event: paper.ToolEvent): void => {
    if (this.isDragSelecting) {
      // (1) Drag Selection
      this.makeDragSelection();
      console.log('makeDragSelection done');
      previewBox.hide();
      this.isDragSelecting = false;

      logger.updateStatus(`${this.getSelectedItems().length} items selected`);
      uiService.renderPathItems();
    } else if (this.isRotating) {
      // (2) Rotating
      this.dragStartPoint = null;
      this.rotationCenter = null;
      this.startAngle = 0;
      this.initialRotations.clear();
      this.initialItemBounds.clear();

      historyService.saveSnapshot("rotate");
      this.isRotating = false;

      logger.updateStatus('Rotation complete');
    } else if (this.isScaling) {
      // (3) Scaling
      this.dragStartPoint = null;
      this.scaleHandleIndex = null;
      this.scaleOrigin = null;
      this.initialBounds = null;
      this.initialItemBounds.clear();

      historyService.saveSnapshot("scale");
      this.isScaling = false;

      logger.updateStatus('Scaling complete');
    } else {
      // (4) Drag Moving
      this.dragStartPoint = null;
      this.dragStartPositions.clear();

      if (this.isDragMoving) {
        historyService.saveSnapshot("move");
      }
      this.isDragMoving = false;
    }
    boundingBox.show(this.getSelectedItems());
  }

  onMouseDrag = (event: paper.ToolEvent): void => {
    if (this.isDragSelecting) {
      // (1) Drag Selection
      previewBox.update(event.point);
    } else if (this.isRotating && this.rotationCenter && this.dragStartPoint) {
      // (2) Rotating
      boundingBox.hide();

      const selectedItems = this.getSelectedItems();
      if (selectedItems.length === 0) return;

      const currentPoint = event.point;
      const center = this.rotationCenter;

      // Calculate current angle from center to mouse
      const currentVector = currentPoint.subtract(center);
      const currentAngle = Math.atan2(currentVector.y, currentVector.x);

      // Calculate rotation delta in degrees
      let angleDelta = (currentAngle - this.startAngle) * (180 / Math.PI);

      // Shift-drag: snap to 15-degree increments
      if (event.modifiers?.shift) {
        angleDelta = Math.round(angleDelta / 15) * 15;
      }

      // Apply rotation to each item around the common center
      selectedItems.forEach((item) => {
        const initialRotation = this.initialRotations.get(item.id) || 0;

        // Get initial position relative to rotation center
        const initialBounds = this.initialItemBounds.get(item.id);
        if (!initialBounds) {
          this.initialItemBounds.set(item.id, item.bounds.clone());
        }

        // Reset to initial state
        item.rotation = initialRotation;

        // Rotate around the common center
        item.rotate(angleDelta, center);
      });

      paper.project.view.update();

      // Update status
      const displayAngle = Math.round(angleDelta) % 360;
      logger.updateStatus(`Rotating: ${displayAngle}°${event.modifiers?.shift ? ' (snapped)' : ''}`);
    } else if (this.isScaling && this.scaleOrigin && this.initialBounds && this.dragStartPoint) {
      // (3) Scaling
      boundingBox.hide();

      const selectedItems = this.getSelectedItems();
      if (selectedItems.length === 0) return;

      // Calculate scale factors based on handle position
      let scaleX = 1;
      let scaleY = 1;

      const currentPoint = event.point;
      const origin = this.scaleOrigin;

      // Calculate initial and current distances from origin
      const initialDist = this.dragStartPoint!.subtract(origin);
      const currentDist = currentPoint.subtract(origin);

      // Determine if this is a corner handle (even indices) or edge handle (odd indices)
      // Corners: 0, 2, 4, 6 | Edges: 1, 3, 5, 7
      const isCornerHandle = this.scaleHandleIndex! % 2 === 0;

      if (isCornerHandle) {
        // Corner handles: 0=bottom-left, 2=top-left, 4=top-right, 6=bottom-right
        // Scale both dimensions
        if (event.modifiers?.shift) {
          // Shift-drag: uniform scaling
          const scale = currentDist.length / initialDist.length;
          scaleX = scale;
          scaleY = scale;
        } else {
          // Non-uniform scaling
          scaleX = Math.abs(initialDist.x) > 0.001 ? currentDist.x / initialDist.x : 1;
          scaleY = Math.abs(initialDist.y) > 0.001 ? currentDist.y / initialDist.y : 1;
        }
      } else {
        // Edge handles: scale only in one dimension
        // Handles: 1=left, 3=top, 5=right, 7=bottom
        const handleIndex = this.scaleHandleIndex!;
        if (handleIndex === 1 || handleIndex === 5) {
          // Left or right edge: dragging horizontally changes width (X scale)
          scaleX = Math.abs(initialDist.x) > 0.001 ? currentDist.x / initialDist.x : 1;
        } else {
          // Top or bottom edge: dragging vertically changes height (Y scale)
          scaleY = Math.abs(initialDist.y) > 0.001 ? currentDist.y / initialDist.y : 1;
        }
      }

      // Prevent negative scaling (flipping)
      scaleX = Math.abs(scaleX) < 0.01 ? 0.01 : scaleX;
      scaleY = Math.abs(scaleY) < 0.01 ? 0.01 : scaleY;

      // Apply scaling to each item
      selectedItems.forEach((item) => {
        const initialBounds = this.initialItemBounds.get(item.id);
        if (!initialBounds) return;

        // Calculate the item's position relative to the origin
        const relativeCenter = initialBounds.center.subtract(origin);

        // Scale the relative position
        const newRelativeCenter = new paper.Point(
          relativeCenter.x * scaleX,
          relativeCenter.y * scaleY
        );

        // Calculate new center position
        const newCenter = origin.add(newRelativeCenter);

        // Calculate new size
        const newSize = new paper.Size(
          initialBounds.width * Math.abs(scaleX),
          initialBounds.height * Math.abs(scaleY)
        );

        // Apply the transformation
        item.bounds = new paper.Rectangle(
          newCenter.subtract(new paper.Point(newSize.width / 2, newSize.height / 2)),
          newSize
        );
      });

      paper.project.view.update();

      // Update status
      logger.updateStatus(`Scaling: ${(scaleX * 100).toFixed(0)}% × ${(scaleY * 100).toFixed(0)}%`);
    } else if (this.dragStartPoint && this.dragStartPositions.size > 0 && !this.isScaling && !this.isRotating) {
      // (4) Drag Moving
      boundingBox.hide();
      let delta = event.point.subtract(this.dragStartPoint);

      // Shift-drag: constrain to horizontal or vertical movement
      if (event.modifiers?.shift) {
        const absDeltaX = Math.abs(delta.x);
        const absDeltaY = Math.abs(delta.y);

        // Lock to the axis with greater movement
        if (absDeltaX > absDeltaY) {
          // Horizontal movement only
          delta = new paper.Point(delta.x, 0);
        } else {
          // Vertical movement only
          delta = new paper.Point(0, delta.y);
        }
      }

      // Apply delta to all items based on their initial positions
      this.getSelectedItems().forEach((item) => {
        item.position = this.dragStartPositions.get(item.id)?.add(delta) ?? item.position;
      });
      paper.project.view.update();

      this.isDragMoving = true;

      // Update status message to show constraint
      if (event.modifiers?.shift) {
        const isHorizontal = Math.abs(delta.x) > Math.abs(delta.y);
        logger.updateStatus(`Items moved ${isHorizontal ? 'horizontally' : 'vertically'} (shift-constrained)`);
      } else {
        logger.updateStatus('Items moved');
      }
    }
  }
}