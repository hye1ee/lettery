import paper from 'paper'
import { tags, updateLayerSelection, updateItemSelection, clearItemSelection, setSortable } from '../utils/tags'

import * as hangul from 'hangul-js';
import { v4 as uuidv4 } from 'uuid';
import { boundingBox, logger } from '../helpers';
import type { ItemClassName, Syllable } from '../types';
import { selectTool } from '../tools';

export interface Layer {
  id: string;
  name: string;
  type: 'path' | 'group' | 'image' | 'text';
  visible: boolean;
  locked: boolean;
  selected: boolean;
  opacity: number;
  zIndex: number;
  createdAt: Date;
  updatedAt: Date;
  elements?: CanvasElement[];
}

export interface CanvasElement {
  id: string;
  name: string;
  type: 'path' | 'circle' | 'rectangle' | 'text' | 'group';
  visible: boolean;
  selected: boolean;
  paperItem?: any; // Paper.js item reference
  createdAt: Date;
}

export interface LayerAction {
  type: 'add' | 'remove' | 'update' | 'reorder' | 'toggle-visibility' | 'toggle-lock' | 'add-element' | 'remove-element';
  layerId?: string;
  data?: Partial<Layer> | Partial<CanvasElement>;
  oldIndex?: number;
  newIndex?: number;
  elementId?: string;
}

class UIService {
  private static instance: UIService | null = null;

  private itemIndex: { [key in ItemClassName]: number } = {
    'Group': 0,
    'Layer': 0,
    'Path': 0,
    'CompoundPath': 0,
    'Shape': 0,
    'Raster': 0,
    'SymbolItem': 0,
    'PointText': 0
  };
  private itemListContainer: HTMLElement | null = null;

  private selectedItemIds: string[] = [];
  private syllables: Syllable[] = [];

  private constructor() { }

  static getInstance(): UIService {
    if (!UIService.instance) {
      UIService.instance = new UIService();
    }
    return UIService.instance;
  }

  public init(): void {
    this.itemListContainer = document.getElementById('layer-list');
  }

  showTooltip(message: string, x: number, y: number): void {
    // Remove existing tooltip
    this.hideTooltip();

    const tooltip = document.createElement('div');
    tooltip.className = 'tooltip';
    tooltip.textContent = message;
    tooltip.style.left = `${x}px`;
    tooltip.style.top = `${y}px`;
    tooltip.style.position = 'absolute';
    tooltip.style.zIndex = '10000';

    document.body.appendChild(tooltip);

    // Auto-hide after 3 seconds
    setTimeout(() => this.hideTooltip(), 3000);
  }

  hideTooltip(): void {
    const existingTooltip = document.querySelector('.tooltip');
    if (existingTooltip) {
      existingTooltip.remove();
    }
  }


  public renderAll = () => {
    this.renderLayers();
    this.renderPathItems();
  }

  // Update UI selection state based on canvas selection
  public updateItemSelection({ id, layer }: { id: string | null, layer?: boolean }) {
    if (id === null) {
      // [1] deselect items
      clearItemSelection();
    } else if (layer === true) {
      // [2] select layer
      updateLayerSelection(id);
      this.renderPathItems();
    } else {
      // [3] select item within layer
      updateItemSelection(id);
    }
  }

  private renderLayers = () => {
    if (!this.itemListContainer) return;

    this.itemListContainer.innerHTML = '';

    // Filter to show only letter layers (syllable layers)
    this.syllables.forEach((syllable) => {
      const layerItem = this.createSyllableItem(syllable);
      this.itemListContainer?.appendChild(layerItem);
    });

    // Update the active layer
    updateLayerSelection(paper.project.activeLayer?.data.syllableId || '');
  }

  public renderPathItems = () => {
    // init path list container
    const pathsListContainer = document.getElementById('paths-list');
    if (!pathsListContainer) throw new Error('Paths list container not found');
    pathsListContainer.innerHTML = '';

    // Find the currently selected/active layer
    const syllable = this.syllables.find((syllable) => syllable.id === paper.project.activeLayer?.data.syllableId);
    if (!syllable) throw new Error('Syllable not found');

    // Get children of the active layer
    syllable.jamoIds.forEach((jamoId) => {
      const jamoLayer = paper.project.getItem({ data: { id: jamoId } }) as paper.Layer;
      if (!jamoLayer) throw new Error('Jamo layer not found');
      pathsListContainer.append(this.createPathItem(jamoLayer, 0));
    });
  }

  private createSyllableItem(syllable: Syllable): HTMLDivElement {

    const layerItem = document.createElement('div');
    layerItem.className = 'layer-card';
    layerItem.dataset.layerId = syllable.id;
    layerItem.innerHTML = tags.syllableItem(syllable);

    // Add click handler for selection
    layerItem.addEventListener('click', (e) => {
      e.stopPropagation();
      this.handleSyllableClick(syllable);
    });

    // Add action button event listeners
    return layerItem;
  }

  private createPathItem(item: paper.Item, index: number): HTMLDivElement {
    if (!item.name) {
      this.itemIndex[item.className as ItemClassName]++;
      item.name = `${item.className} ${this.itemIndex[item.className as ItemClassName]}`;
    }
    // create path item div
    const pathItem = document.createElement('div');
    pathItem.className = `element-item ${item.selected ? 'selected' : ''} ${item.visible ? 'visible' : 'hidden'}`;
    pathItem.dataset.elementId = item.id.toString();
    pathItem.dataset.elementClassName = item.className;
    pathItem.innerHTML = tags.elementItem(item);
    pathItem.style.paddingLeft = `${(index + 1) * 15}px`;

    // Add click handler for selection
    pathItem.addEventListener('click', (e) => {
      e.stopPropagation();
      this.handleItemClick(item);
    });

    // Add action button event listeners
    this.setupActionButtonListeners(pathItem, item);

    // For layer items, create nested sortable container
    if (item instanceof paper.Layer || item instanceof paper.CompoundPath) {
      const itemContainer = document.createElement('div');
      itemContainer.style = 'display: flex; flex-direction: column; width: 100%; height: fit-content;';
      itemContainer.dataset.elementId = item.id.toString();
      itemContainer.dataset.elementClassName = item.className;
      if (!(item instanceof paper.Layer)) itemContainer.classList.add('draggable');

      const childContainer = document.createElement('div');
      childContainer.className = 'sortable-list';
      childContainer.dataset.elementId = item.id.toString();
      childContainer.dataset.elementClassName = item.className;

      setSortable(childContainer, item.className as ItemClassName).options.onEnd = this.handleSortableEnd;
      // Add children to child container
      item.children.forEach((child) => {
        childContainer.appendChild(this.createPathItem(child, index));
      });

      itemContainer.append(pathItem, childContainer);
      return itemContainer;
    } else {
      pathItem.classList.add('draggable');
      // For non-layer items with children, create regular nested structure
      setSortable(pathItem, item.className as ItemClassName).options.onEnd = this.handleSortableEnd;

      return pathItem;
    }
  }

  private handleSortableEnd(event: any): void {
    const { item, from, to } = event;

    const targetItem = paper.project.getItem({ id: parseInt(item.dataset.elementId) });
    const oldParent = paper.project.getItem({ id: parseInt(from.dataset.elementId) });
    const newParent = paper.project.getItem({ id: parseInt(to.dataset.elementId) });
    if (!newParent || !targetItem || !oldParent) return;

    newParent.addChild(targetItem);

    logger.updateStatus(`Moved ${targetItem.name} from ${oldParent.name} to ${newParent.name}`);
    // if (!itemId) return;

    // // Find the paper item by ID
    // const paperItem = paper.project.getItem({ id: parseInt(itemId) });
    // if (!paperItem) return;

    // // Determine source and target layers
    // const sourceLayer = from.closest('.nested-items')?.dataset.layerId
    //   ? paper.project.getItem({ id: parseInt(from.closest('.nested-items').dataset.layerId) })
    //   : paper.project.activeLayer;

    // const targetLayer = to.closest('.nested-items')?.dataset.layerId
    //   ? paper.project.getItem({ id: parseInt(to.closest('.nested-items').dataset.layerId) })
    //   : paper.project.activeLayer;

    // if (!sourceLayer || !targetLayer) return;

    // // Move the item between layers
    // if (sourceLayer.id !== targetLayer.id) {
    //   paperItem.remove();
    //   targetLayer.addChild(paperItem);

    //   logger.updateStatus(`Moved ${paperItem.name} to ${targetLayer.name}`);

    //   // Update UI after move - only render what's necessary
    //   this.renderPathItems();
    //   this.renderLayers();
    // }
  }

  private handleItemClick(item: paper.Item): void {
    console.log('Layer panel item clicked:', item.name, 'ID:', item.id, 'Type:', item.className);

    selectTool.selectItem(item);
    boundingBox.show([item]);
    // if (item instanceof paper.Layer) {
    //   // Layer clicked - clear item selection, set active layer
    //   // this.handleLayerClick(item);
    // } else {
    //   // Item clicked - select item and set parent layer as active
    //   const isDrawableItem = item instanceof paper.Path ||
    //     item instanceof paper.CompoundPath ||
    //     item instanceof paper.Shape;

    //   if (isDrawableItem) {
    //     item.selected = true;
    //     boundingBox.show([item]);
    //     logger.updateStatus(`${item.name || item.className} selected`);
    //     console.log('Selection callback triggered for item:', item.id);
    //   } else {
    //     console.log('Item is not drawable:', item.className);
    //   }
    // }
  }

  private handleSyllableClick(syllable: Syllable): void {
    if (syllable.jamoIds.includes(paper.project.activeLayer?.data.id)) return;

    const jamoLayer = paper.project.getItem({ data: { id: syllable.jamoIds[0] } }) as paper.Layer;
    if (!jamoLayer) throw new Error('Jamo layer not found');
    jamoLayer.activate();

    // Set this layer as the active layer and refresh paths section
    updateLayerSelection(syllable.id);
    this.renderPathItems();

    logger.updateStatus(`${syllable.string} selected`);
    console.log('Selection callback triggered for layer:', syllable.id);
  }


  /**
   * Path Item action button listeners
   */

  private setupActionButtonListeners(element: HTMLElement, item: paper.Item): void {
    const actionButtons = element.querySelectorAll('.element-action-btn');

    actionButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent triggering item selection

        const action = button.getAttribute('data-action');
        const itemId = item.id.toString();

        console.log(`Action button clicked: ${action} for item ${itemId}`);

        switch (action) {
          case 'delete':
            this.handleDeleteItem(item);
            break;
          case 'ungroup':
            this.handleUngroupItem(item);
            break;
          default:
            console.log('Unknown action:', action);
        }
      });
    });
  }

  private handleDeleteItem(item: paper.Item): void {
    if (item instanceof paper.Layer) {
      // only triggered in layer panel
      if (paper.project.activeLayer?.id === item.id) {
        // remove active layer
        item.remove();
        this.renderLayers();
        this.renderPathItems();
      }
      else { // remove other layer
        item.remove();
        this.renderLayers();
      }
    } else {
      // Remove from canvas
      item.remove();
      this.renderPathItems();
    }

    logger.updateStatus(`Deleted ${item.name || item.className}`);
  }

  private handleUngroupItem(target: paper.Item): void {
    if (target instanceof paper.Group) {
      if (target.children.length > 0) {
        // Move children to parent layer
        const children = target.children.slice(); // Create a copy to avoid modification during iteration
        children.forEach(child => {
          target.parent?.addChild(child);
        });
      }
      this.handleDeleteItem(target);
    } else {
      logger.updateStatus('Item is not a group');
    }
  }

  /**
   * Add Layer Modal Handler
   */

  public addLayer(): void {
    console.log('Adding layer');

    // Create modal overlay using centralized template
    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'modal-overlay';
    modalOverlay.id = 'add-layer-modal';

    // Create modal content using centralized template
    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';
    modalContent.innerHTML = tags.addLayerModal;

    modalOverlay.appendChild(modalContent);
    document.body.appendChild(modalOverlay);

    // Set up event listeners
    this.setupModalEventListeners();
  }

  private setupModalEventListeners(): void {
    const modal = document.getElementById('add-layer-modal');
    const closeBtn = document.getElementById('modal-close-btn');
    const confirmBtn = document.getElementById('modal-confirm-btn');
    const koreanInput = document.getElementById('korean-input') as HTMLInputElement;
    const fontSelector = document.getElementById('font-selector') as HTMLSelectElement;
    const preview = document.getElementById('letter-preview');

    // Close modal functions
    const closeModal = () => {
      if (modal) {
        modal.remove();
      }
    };

    // Event listeners
    closeBtn?.addEventListener('click', closeModal);
    modal?.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });

    // Real-time preview
    koreanInput?.addEventListener('input', (e) => {
      const input = e.target as HTMLInputElement;
      this.updateLetterPreview(input.value, preview);
    });

    // Confirm button
    confirmBtn?.addEventListener('click', () => {
      const inputText = koreanInput?.value.trim();
      const selectedFont = fontSelector?.value || '';
      if (inputText) {
        this.createLayersFromInput(inputText, selectedFont);
        closeModal();
      } else {
        logger.updateStatus('Please enter Korean text');
      }
    });

    // Focus input
    koreanInput?.focus();
  }

  private updateLetterPreview(text: string, previewElement: HTMLElement | null): void {
    if (!previewElement) return;

    // Split Korean text into individual characters
    const letters = text.split('').filter(char => char.trim() !== '');

    // Use centralized helper function
    previewElement.innerHTML = letters.map((letter, index) => tags.letterItem(letter, index)).join('');
  }

  private createLayersFromInput(inputText: string, selectedFont: string): void {
    const letters = inputText.split('').filter(char => char.trim() !== '');

    letters.forEach((letter) => {
      const disassembled = hangul.disassemble(letter);

      // add syllable layer
      const syllable: Syllable = {
        id: uuidv4(),
        string: letter,
        jamo: disassembled,
        jamoIds: disassembled.map(() => uuidv4()),
      };
      this.syllables.push(syllable);

      // add jamo layers
      syllable.jamo.forEach((jamoString, jamoIndex) => {
        const jamoLayer = new paper.Layer();
        jamoLayer.name = jamoString;
        jamoLayer.data.id = syllable.jamoIds[jamoIndex];
        jamoLayer.data.syllableId = syllable.id;
        jamoLayer.data.syllableString = syllable.string;

        paper.project.addLayer(jamoLayer);
      });
    });
    // update ui
    this.renderLayers();
    this.renderPathItems();

    // Update the layer panel
    const fontInfo = selectedFont ? ` with font: ${selectedFont}` : ' with default font';
    logger.updateStatus(`Created ${letters.length} layers for: ${inputText}${fontInfo}`);
  }

}

export default UIService;



