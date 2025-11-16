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
  private dragStartPoint: paper.Point | null = null;
  private dragStartPositions: Map<number, paper.Point> = new Map();
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
    this.isDragSelecting = false;
    this.isDragMoving = false;
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

    if (hitResult) { // (1) Select Item
      if (!isMultiSelect && !this.getSelectedItems().some(item => item.id === hitResult.item.id)) {
        paper.project.deselectAll();
        uiService.renderPathItems();
      }

      this.selectItem(hitResult.item);
      this.grabPoint(event.point);
      logger.updateStatus('Item selected');
    } else {
      // (2) Drag Selection
      paper.project.deselectAll();
      uiService.renderPathItems();

      this.isDragSelecting = true;
      previewBox.show(event.point);
      // this.grabPoint(event.point);

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

  onMouseMove = (_event: paper.ToolEvent): void => {
    // TODO: Implement mouse move logic
  }

  onMouseUp = (_event: paper.ToolEvent): void => {
    if (this.isDragSelecting) { // (1) Drag Selection
      this.makeDragSelection();
      console.log('makeDragSelection done');
      previewBox.hide();
      this.isDragSelecting = false;

      logger.updateStatus(`${this.getSelectedItems().length} items selected`);
      uiService.renderPathItems();
    } else { // (2) Drag Moving
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
    if (this.isDragSelecting) { // (1) Drag Selection
      previewBox.update(event.point);
    } else if (this.dragStartPoint && this.dragStartPositions.size > 0) {
      // (2) Drag Moving
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