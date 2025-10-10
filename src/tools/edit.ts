import paper from 'paper'
import type { Tool } from './index'
import { cursor, logger, previewBox } from '../helpers';
import { snapDeltaToAngle, isColinear } from '../utils/math';

export default class EditTool implements Tool {
  private static instance: EditTool | null = null;

  readonly id: string = 'edit';
  readonly shortcut: string = 'e';
  readonly cursorStyle: string = 'default';

  // Tool state
  private editItem: paper.Item | null = null;
  private onToolSwitch: ((toolId: string) => void) | null = null;
  private renderCallback: (() => void) | null = null;

  private isDragSelecting: boolean = false;
  private dragStartPoint: paper.Point | null = null;
  private dragStartPositions: Map<number, paper.Point> = new Map();
  private hitType: string | null = null;
  private lastEvent: paper.ToolEvent | null = null;
  private selectionDragged: boolean = false;

  // Hit test options
  private hitOptions = {
    segments: true,
    stroke: true,
    curves: true,
    handles: true,
    fill: true,
    guide: false,
  };

  activate(): void {
    cursor.updateCursor(this.cursorStyle);
    this.setupKeyHandlers();
    logger.updateStatus('Edit tool activated - Click to select and edit items');

    const editItemId = localStorage.getItem('edit-item') as string | null;
    if (editItemId) {
      this.editItem = paper.project.getItems({ id: parseInt(editItemId) })[0] as paper.Item;
      if (this.editItem) {
        (this.editItem as any).selected = true;
      }
      localStorage.removeItem("edit-item");
    }
  }

  deactivate(): void {
    if (this.editItem) {
      this.editItem.selected = false;
    }
    this.editItem = null;

    this.deselectAll();
    this.dragStartPoint = null;
    this.dragStartPositions.clear();
    this.isDragSelecting = false;

    this.resetKeyHandlers();
    this.clearHoveredItem();
    this.resetState();
    cursor.resetCursor();
  }

  private constructor() { }

  static getInstance(): EditTool {
    if (!EditTool.instance) {
      EditTool.instance = new EditTool()
    }
    return EditTool.instance
  }

  /**
   * Set the callback for tool switching
   */
  setToolSwitchCallback(callback: (toolId: string) => void): void {
    this.onToolSwitch = callback;
  }

  setRenderCallback(callback: () => void): void {
    this.renderCallback = callback;
  }

  private setupKeyHandlers(): void {
    document.addEventListener('keydown', this.onKeyDown);
  }

  private resetKeyHandlers(): void {
    document.removeEventListener('keydown', this.onKeyDown);
  }

  onKeyDown = (event: KeyboardEvent): void => {
    console.log('onKeyDown', event.key);

    switch (event.key) {
      case "a":
        if (this.editItem) (this.editItem as any).fullySelected = true;
        break;
      case "i":
        this.invertSegmentSelection();
        break;
      case "Alt":
        this.cloneSelection();
        break;
      case "Backspace":
        this.removeSelections();
        break;
      case "Escape":
        this.deselectAll();
        break;
    }
  };

  onDoubleClick = (event: paper.ToolEvent): void => {
    event.preventDefault();
    event.stopPropagation();

    // Double-click on empty space switches back to select tool
    const hitResult = paper.project.hitTest(event.point, this.hitOptions);
    if (!hitResult && this.onToolSwitch) {
      this.onToolSwitch('select');
      logger.updateStatus('Switched to select tool - Double click on empty space');
    }
  };

  onMouseDown = (event: paper.ToolEvent): void => {
    if ((event as any).event && (event as any).event.button > 0) return; // only first mouse button

    // const isMultiSelect = event && (event.modifiers?.control || event.modifiers?.meta);


    this.selectionDragged = false;
    const doubleClicked = this.checkDoubleClick(event);
    this.lastEvent = event;

    this.hitType = null;
    this.clearHoveredItem();

    const hitResult = paper.project.hitTest(event.point, this.hitOptions);
    const isMultiSelect = event && (event.modifiers?.shift);

    if (hitResult) {
      // ignore all other selection
      if (hitResult.item.id !== this.editItem?.id) {
        return;
      }

      if (!isMultiSelect && !this.getSelectedItems().some(item => item.id === hitResult.item.id)) {
        this.deselectAll();
      }

      this.handleHitResult(hitResult, event, doubleClicked);
      this.grabPoint(event.point);
      logger.updateStatus('Item selected for editing');

    } else {
      // (2) Drag Selection
      this.deselectAll();
      this.isDragSelecting = true;
      previewBox.show(event.point);
      logger.updateStatus('Drag selection started');
    }

  };

  onMouseMove = (event: paper.ToolEvent): void => {
    this.handleHoveredItem(event);
  };

  onMouseDrag = (event: paper.ToolEvent): void => {
    if ((event as any).event && (event as any).event.button > 0) return; // only first mouse button

    if (this.isDragSelecting) { // (1) Drag Selection
      previewBox.update(event.point);
    } else if (this.dragStartPoint && this.dragStartPositions.size > 0) {
      // (2) Drag Moving/Editing
      this.selectionDragged = true;
      this.dragSelection(event);
    }
  };

  onMouseUp = (event: paper.ToolEvent): void => {
    if ((event as any).event && (event as any).event.button > 0) return; // only first mouse button

    if (this.isDragSelecting) { // (1) Drag Selection
      this.makeDragSelection();
      previewBox.hide();
      this.isDragSelecting = false;
      logger.updateStatus(`${this.getSelectedItems().length} items selected`);
    } else { // (2) Drag Moving/Editing
      if (this.selectionDragged) {
        // TODO: Add undo snapshot
        this.selectionDragged = false;
      }
      this.resetDragPositions();
      this.dragStartPoint = null;
      this.dragStartPositions.clear();
    }
  };

  private checkDoubleClick(event: paper.ToolEvent): boolean {
    if (this.lastEvent) {
      return ((event as any).event.timeStamp - (this.lastEvent as any).event.timeStamp) < 250;
    }
    return false;
  };

  private handleHitResult(hitResult: paper.HitResult, event: paper.ToolEvent, doubleClicked: boolean): void {
    if (hitResult.type === 'fill' || doubleClicked) {
      this.handleFillHit(hitResult, event, doubleClicked);
      console.log("fill hit");
    } else if (hitResult.type === 'segment') {
      this.handleSegmentHit(hitResult, event);
      console.log("segment hit");
    } else if (hitResult.type === 'stroke' || hitResult.type === 'curve') {
      this.handleCurveHit(hitResult, event);
      console.log("curve hit");
    } else if (hitResult.type === 'handle-in' || hitResult.type === 'handle-out') {
      this.handleHandleHit(hitResult, event);
      console.log("handle hit");
    }
  };

  private handleFillHit(hitResult: paper.HitResult, event: paper.ToolEvent, _doubleClicked: boolean): void {
    this.hitType = 'fill';
    const item = hitResult.item;

    if (item.selected) {
      if (event.modifiers.shift) {
        this.deselectAll();
      } else {
        (item as any).fullySelected = true;
      }

      if (event.modifiers.option) this.cloneSelection();
    }
  };

  private handleSegmentHit(hitResult: paper.HitResult, event: paper.ToolEvent): void {
    this.hitType = 'point';
    const segment = hitResult.segment;

    if (segment.selected) {
      segment.selected = true;
      if (event.modifiers.shift) {
        segment.selected = false;
      }
    } else {
      if (event.modifiers.shift) {
        segment.selected = true;
      } else {
        paper.project.deselectAll();
        segment.selected = true;
      }
    }

    if (event.modifiers.option) this.cloneSelection();
  };

  private handleCurveHit(hitResult: paper.HitResult, event: paper.ToolEvent): void {
    this.hitType = 'curve';
    const curve = hitResult.location.curve;

    if (event.modifiers.shift) {
      curve.selected = !curve.selected;
    } else if (!curve.selected) {
      paper.project.deselectAll();
      curve.selected = true;
    }

    if (event.modifiers.option) this.cloneSelection();
  };

  private handleHandleHit(hitResult: paper.HitResult, event: paper.ToolEvent): void {
    this.hitType = hitResult.type;
    const segment = hitResult.segment;

    if (!event.modifiers.shift) {
      paper.project.deselectAll();
    }

    segment.handleIn.selected = true;
    segment.handleOut.selected = true;
  };

  private dragSelection(event: paper.ToolEvent): void {
    const selectedItems = this.getSelectedItems();
    const dragVector = event.point.subtract(event.downPoint);

    selectedItems.forEach(item => {
      if (this.hitType === 'fill' || !(item as any).segments) {
        this.dragItem(item, dragVector, event);
      } else {
        this.dragSegments(item, dragVector, event);
      }
    });
  };

  private dragItem(item: paper.Item, dragVector: paper.Point, event: paper.ToolEvent): void {
    // Skip if item has compound path parent to avoid double movement
    if (item.parent && this.isCompoundPath(item.parent)) {
      return;
    }

    // Store original position for snap calculation
    if (!(item as any).origPos) {
      (item as any).origPos = item.position;
    }

    if (event.modifiers.shift) {
      item.position = (item as any).origPos.add(snapDeltaToAngle(dragVector, Math.PI * 2 / 8));
    } else {
      item.position = item.position.add(event.delta);
    }
  };

  private dragSegments(item: paper.Item, dragVector: paper.Point, event: paper.ToolEvent): void {
    if (!(item as any).segments) return;

    (item as any).segments.forEach((segment: any) => {
      // Store original point for snap calculation
      if (!segment.origPoint) {
        segment.origPoint = segment.point.clone();
      }

      if (segment.selected && (this.hitType === 'point' || this.hitType === 'stroke' || this.hitType === 'curve')) {
        if (event.modifiers.shift) {
          segment.point = segment.origPoint.add(snapDeltaToAngle(dragVector, Math.PI * 2 / 8));
        } else {
          segment.point = segment.point.add(event.delta);
        }
      } else if (segment.handleOut.selected && this.hitType === 'handle-out') {
        this.dragHandle(segment, event, 'out');
      } else if (segment.handleIn.selected && this.hitType === 'handle-in') {
        this.dragHandle(segment, event, 'in');
      }
    });
  };

  private dragHandle(segment: any, event: paper.ToolEvent, handleType: 'in' | 'out'): void {
    const isSplit = event.modifiers.option || !isColinear(segment.handleOut, segment.handleIn);

    if (isSplit) {
      if (handleType === 'out') {
        segment.handleOut = segment.handleOut.add(event.delta);
      } else {
        segment.handleIn = segment.handleIn.add(event.delta);
      }
    } else {
      // Move handles symmetrically
      if (handleType === 'out') {
        segment.handleIn = segment.handleIn.subtract(event.delta);
        segment.handleOut = segment.handleOut.add(event.delta);
      } else {
        segment.handleIn = segment.handleIn.add(event.delta);
        segment.handleOut = segment.handleOut.subtract(event.delta);
      }
    }
  };


  private getSelectedItems(): paper.Item[] {
    return paper.project.selectedItems.filter(item => !this.isTextItem(item));
  };

  private deselectAll(): void {
    paper.project.deselectAll();
    if (this.editItem) this.editItem.selected = true;
  };

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

  makeDragSelection(): void {
    if (!this.editItem) return;
    this.deselectAll();
    const selectionBounds = previewBox.getNormalizedBoundingBox();

    // should check segment
    (this.editItem as any).segments.forEach((segment: any) => {
      if (selectionBounds.intersects(segment.point)) {
        segment.selected = true;
      }
    });
  }

  private clearHoveredItem(): void {
    // TODO: Implement hover clearing if needed
  };

  private handleHoveredItem(_event: paper.ToolEvent): void {
    // TODO: Implement hover handling if needed
  };

  private isTextItem(_item: paper.Item): boolean {
    // Check if item is a text item (implement based on your text item detection)
    return false; // Placeholder
  };

  private isCompoundPath(item: paper.Item): boolean {
    return item instanceof paper.CompoundPath;
  };

  private cloneSelection(): void {
    // TODO: Implement selection cloning
    console.log('Clone selection not implemented yet');
  };

  private removeSelections(): void {
    if ((this.editItem as any).fullySelected) {
      this.editItem?.remove();
      this.onToolSwitch?.('select');
    }

    const selections = paper.project.selectedItems;
    console.log(selections);

    selections.forEach(selection => {
      if (selection.id !== this.editItem?.id) {
        selection.remove();
      }
    });
  };

  private invertSegmentSelection(): void {
    const items = paper.project.getItems({
      class: paper.Path || paper.CompoundPath
    });

    items.forEach(item => {
      if ((item as any).segments) {
        (item as any).segments.forEach((segment: any) => {
          segment.selected = !segment.selected;
        });
      }
    });
  };

  private resetDragPositions(): void {
    const selectedItems = this.getSelectedItems();

    selectedItems.forEach(item => {
      (item as any).origPos = null;
      if ((item as any).segments) {
        (item as any).segments.forEach((segment: any) => {
          segment.origPoint = null;
        });
      }
    });
  };

  private resetState(): void {
    this.hitType = null;
    this.lastEvent = null;
    this.selectionDragged = false;
  };
}
