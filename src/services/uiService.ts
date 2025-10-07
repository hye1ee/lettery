import paper from 'paper'
import { tags, updateLayerSelection, updateItemSelection, clearItemSelection } from '../utils/tags'

import * as hangul from 'hangul-js';
import { logger } from '../helpers';

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

  private itemIndex: { [key: string]: number } = {
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


  public renderAll() {
    this.renderLayers();
    this.renderPathItems();
  }

  private updateItemsCount(count: number) {
    const itemsCountElement = document.getElementById('items-count');
    if (itemsCountElement) {
      itemsCountElement.textContent = count.toString();
    }
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

  private renderLayers() {
    if (!this.itemListContainer) return;

    this.itemListContainer.innerHTML = '';

    // Filter to show only letter layers (syllable layers)
    const letterLayers = paper.project.layers.filter((layer: paper.Layer) =>
      !layer.name?.startsWith('system-') &&
      layer.data?.type === 'syllable'
    );

    letterLayers.forEach((layer) => {
      const layerItem = this.createLayerItem(layer);
      this.itemListContainer?.appendChild(layerItem);
    });

    // Update the active layer
    updateLayerSelection(paper.project.activeLayer?.id.toString() || '');
  }

  public renderPathItems() {
    const pathsListContainer = document.getElementById('paths-list');
    if (!pathsListContainer) return;

    pathsListContainer.innerHTML = '';

    // Find the currently selected/active layer
    const activeLayer = paper.project.activeLayer;
    // Get children of the active layer
    const children = activeLayer?.children || [];
    if (children.length === 0) {
      // Show empty state
      const emptyState = document.createElement('div');
      emptyState.className = 'paths-empty-state';
      emptyState.textContent = 'No components in this letter';
      emptyState.style.cssText = `
        padding: 20px;
        text-align: center;
        color: #666;
        font-size: 12px;
        font-style: italic;
      `;
      pathsListContainer.appendChild(emptyState);

      // Update the items count to 0
      this.updateItemsCount(0);
      return;
    }

    // Render each child as a path item
    children.forEach((child) => {
      const pathItem = this.createPathItem(child, 0);
      pathsListContainer.append(...pathItem);
    });

    // Update the items count
    this.updateItemsCount(children.length);
  }

  private createLayerItem(layer: paper.Layer): HTMLDivElement {
    if (!layer.name) {
      this.itemIndex[layer.className]++;
      layer.name = `${layer.className} ${this.itemIndex[layer.className]}`;
    }

    const layerItem = document.createElement('div');
    layerItem.className = 'layer-card';
    layerItem.dataset.layerId = layer.id.toString();
    layerItem.innerHTML = tags.layerItem(layer);

    // Add click handler for selection
    layerItem.addEventListener('click', (e) => {
      e.stopPropagation();
      this.handleLayerClick(layer);
    });

    // Add action button event listeners
    this.setupActionButtonListeners(layerItem, layer);

    return layerItem;
  }

  private createPathItem(item: paper.Item, index: number): HTMLDivElement[] {

    if (!item.name) {
      this.itemIndex[item.className]++;
      item.name = `${item.className} ${this.itemIndex[item.className]}`;
    }

    // Skip system items
    if (item.name.startsWith('system-')) {
      return [];
    }

    const pathItems: HTMLDivElement[] = [];

    // create path item div
    const pathItem = document.createElement('div');
    pathItem.className = `element-item ${item.selected ? 'selected' : ''} ${item.visible ? 'visible' : 'hidden'}`;
    pathItem.dataset.elementId = item.id.toString();
    pathItem.innerHTML = tags.elementItem(item);
    pathItem.style.paddingLeft = `${(index + 1) * 15}px`;

    // Add click handler for selection
    pathItem.addEventListener('click', (e) => {
      e.stopPropagation();
      this.handleItemClick(item);
    });

    // Add action button event listeners
    this.setupActionButtonListeners(pathItem, item);
    pathItems.push(pathItem);

    // check if item has a children
    if (item.children) {
      item.children.forEach((child) => {
        const childPathItem = this.createPathItem(child, index + 1);
        pathItems.push(...childPathItem);
      });
    }

    return pathItems;
  }

  private handleItemClick(item: paper.Item): void {
    console.log('Layer panel item clicked:', item.name, 'ID:', item.id, 'Type:', item.className);

    if (item instanceof paper.Layer) {
      // Layer clicked - clear item selection, set active layer
      // this.handleLayerClick(item);
    } else {
      // Item clicked - select item and set parent layer as active
      const isDrawableItem = item instanceof paper.Path ||
        item instanceof paper.CompoundPath ||
        item instanceof paper.Shape;

      if (isDrawableItem) {
        item.selected = true;
        logger.updateStatus(`${item.name || item.className} selected`);
        console.log('Selection callback triggered for item:', item.id);
      } else {
        console.log('Item is not drawable:', item.className);
      }
    }
  }

  private handleLayerClick(layer: paper.Layer): void {
    if (layer.id === paper.project.activeLayer?.id) return;

    layer.activate();
    if (layer.data.type === 'jamo') {
      (layer.parent as paper.Layer).activate();
    }
    // Set this layer as the active layer and refresh paths section
    updateLayerSelection(layer.id.toString());
    this.renderPathItems();

    logger.updateStatus(`${layer.name} selected`);
    console.log('Selection callback triggered for layer:', layer.id);
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

    letters.forEach((letter, index) => {
      const disassembled = hangul.disassemble(letter);

      // add syllable layer
      const layer = new paper.Layer();
      layer.data.type = 'syllable';
      layer.data.string = letter;
      layer.data.font = selectedFont || '';
      layer.name = letter + " " + (index + 1);
      paper.project.addLayer(layer);

      // add jamo layers
      disassembled.forEach((jamo, jamoIndex) => {
        const jamoLayer = new paper.Layer();
        jamoLayer.data.type = 'jamo';
        jamoLayer.data.string = jamo;
        jamoLayer.data.font = selectedFont || '';
        jamoLayer.name = jamo + " " + (jamoIndex + 1);
        layer.addChild(jamoLayer);
      });

      // update ui
      layer.activate();
      this.renderLayers();
      this.renderPathItems();
    });

    // Update the layer panel
    const fontInfo = selectedFont ? ` with font: ${selectedFont}` : ' with default font';
    logger.updateStatus(`Created ${letters.length} layers for: ${inputText}${fontInfo}`);
  }

}

export default UIService;



