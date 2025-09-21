import paper from 'paper'
import type { Tool } from './index'
import { cursor, logger, previewBox } from '../helpers';
import { findParentLayer } from '../utils/paperUtils';

export class SelectTool implements Tool {
  private static instance: SelectTool | null = null;

  readonly id: string = 'select';
  readonly shortcut: string = 'v';
  readonly cursorStyle: string = 'default';

  private isDragSelecting: boolean = false;
  private dragStartPoint: paper.Point | null = null;
  private dragStartPositions: Map<number, paper.Point> = new Map();

  activate(): void {
    cursor.updateCursor(this.cursorStyle);
    // TODO: Implement activate logic
  }

  deactivate(): void {
    cursor.resetCursor();
    // TODO: Implement deactivate logic
  }

  private constructor() { }

  static getInstance(): SelectTool {
    if (!SelectTool.instance) {
      SelectTool.instance = new SelectTool()
    }
    return SelectTool.instance
  }

  onMouseDown = (event: paper.ToolEvent): void => {
    event.preventDefault();
    event.stopPropagation();

    const hitResult = paper.project.hitTest(event.point);
    const isMultiSelect = event && (event.modifiers?.control || event.modifiers?.meta);

    if (hitResult) { // (1) Select Item
      if (!isMultiSelect && !this.getSelectedItems().some(item => item.id === hitResult.item.id)) {
        this.deselectAll();
      }

      this.selectItem(hitResult.item);
      this.grabPoint(event.point);
      logger.updateStatus('Item selected');
    } else {
      // (2) Drag Selection
      this.deselectAll();

      this.isDragSelecting = true;
      previewBox.show(event.point);
      // this.grabPoint(event.point);

      logger.updateStatus('Drag selection started')
    }
  }

  deselectAll(): void {
    paper.project.selectedItems.forEach((item) => {
      item.selected = false;
    })
  };

  selectItem(item: paper.Item): void {
    if (item instanceof paper.Layer) {
      // Layer selected - clear item selection, set active layer
      let layer = item;
      if (layer.data.type === 'syllable') { // only jamo layer can be selected
        layer = layer.children[0] as paper.Layer;
      }
      layer.activate();

      // TODO) Notify UI: layer selected, no item selected
      // if (layer.id && this.alertSelectionChange) {
      //   this.alertSelectionChange(layer.id.toString(), true, layer.id.toString());
      // }
    } else {
      // Item selected - add to selection array
      item.selected = true;

      const parentLayer = findParentLayer(item);
      if (parentLayer) {
        parentLayer.activate();

        // Notify UI: item selected, parent layer active
        // if (item.id && this.alertSelectionChange) {
        //   this.alertSelectionChange(item.id.toString(), true, parentLayer.id.toString());
        // }
      } else {
        // No parent layer found
        // if (item.id && this.alertSelectionChange) {
        //   this.alertSelectionChange(item.id.toString(), true);
        // }
      }
    }
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
    return paper.project.selectedItems.filter((item) => !item.name.includes("system"));
  }

  makeDragSelection(): void {
    this.deselectAll();
    const selectionBounds = previewBox.getNormalizedBoundingBox();

    paper.project.getItems({
      class: paper.Path || paper.CompoundPath || paper.Shape
    }).filter(item => selectionBounds.intersects(item.bounds) && !item.name.includes('system'))
      .forEach(item => item.selected = true)
  }

  onMouseMove = (event: paper.ToolEvent): void => {
    // TODO: Implement mouse move logic
  }

  onMouseUp = (event: paper.ToolEvent): void => {
    if (this.isDragSelecting) { // (1) Drag Selection
      this.makeDragSelection();
      previewBox.hide();
      this.isDragSelecting = false;
      logger.updateStatus(`${this.getSelectedItems().length} items selected`)
    } else { // (2) Drag Moving
      this.dragStartPoint = null;
      this.dragStartPositions.clear();
    }

  }

  onMouseDrag = (event: paper.ToolEvent): void => {
    if (this.isDragSelecting) { // (1) Drag Selection
      previewBox.update(event.point);
    } else if (this.dragStartPoint && this.dragStartPositions.size > 0) {
      // (2) Drag Moving
      const delta = event.point.subtract(this.dragStartPoint);

      // Apply delta to all items based on their initial positions
      this.getSelectedItems().forEach((item) => {
        item.position = this.dragStartPositions.get(item.id)?.add(delta) ?? item.position;
      });
      paper.project.view.update();

      logger.updateStatus('Items moved')
    }
  }
}