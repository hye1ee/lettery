import paper from 'paper'
import { tags } from '../utils/tags'

// It is allowed to directly call canvasService from uiService
import { canvasService } from '.';
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

  private items: paper.Item[] = [];
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


  private activeLayerId: string = '';
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


  public updateItems(items: paper.Item[]) {
    this.items = items;
    this.renderItems();

    // Ensure there's always an active layer
    this.ensureActiveLayer();
  }

  private ensureActiveLayer() {
    // If no active layer, set the first layer as active
    if (!this.activeLayerId && this.items.length > 0) {
      const firstLayer = this.items.find(item => item instanceof paper.Layer);
      if (firstLayer) {
        this.activeLayerId = firstLayer.id.toString();
        this.setActiveLayer(this.activeLayerId);
      }
    }
  }

  // Update UI selection state based on canvas selection
  public updateItemSelection(itemId: string, selected: boolean, layerId?: string) {
    if (selected && itemId) {
      if (layerId && itemId === layerId) {
        // Layer selected - clear item selection, set active layer
        this.selectedItemIds = [];
        this.activeLayerId = layerId;
        this.setActiveLayer(layerId);
      } else {
        // Item selected - add to selection
        if (!this.selectedItemIds.includes(itemId)) {
          this.selectedItemIds.push(itemId);
        }
        this.activeLayerId = layerId || '';
        this.setSelectedItem(itemId);
        if (layerId) {
          this.setActiveLayer(layerId);
        }
      }
    } else if (!selected && layerId && itemId === '') {
      // Deselected with active layer info - clear item selection, keep active layer
      console.log("Canvas deselection - clearing items, keeping active layer:", layerId);
      this.selectedItemIds = [];
      this.activeLayerId = layerId;
      this.setActiveLayer(layerId);
      this.clearSelectedItems();
    } else if (!selected && layerId && itemId !== '') {
      // Remove specific item from selection
      this.selectedItemIds = this.selectedItemIds.filter(id => id !== itemId);
      this.activeLayerId = layerId;
      this.setActiveLayer(layerId);
      this.clearSelectedItems(); // Clear all and reapply
      this.selectedItemIds.forEach(id => this.setSelectedItem(id));
    } else {
      console.log("UI triggered deselection");
      // Deselected - clear item selection, keep active layer
      this.selectedItemIds = [];
      this.clearSelectedItems();
    }
  }

  private setActiveLayer(layerId: string) {
    // Clear previous active layer
    const prevActiveLayer = document.querySelector('.element-item.active');
    if (prevActiveLayer) {
      prevActiveLayer.classList.remove('active');
    }

    // Set new active layer
    const newActiveLayer = document.querySelector(`[data-element-id="${layerId}"]`);
    if (newActiveLayer) {
      newActiveLayer.classList.add('active');
    }
  }

  private setSelectedItem(itemId: string) {
    const selectedItem = document.querySelector(`[data-element-id="${itemId}"]`);
    if (selectedItem) {
      selectedItem.classList.add('selected');
    }
  }

  public clearSelectedItems() {
    // Clear selected items only
    const selectedElements = document.querySelectorAll('.element-item.selected');
    selectedElements.forEach(element => {
      element.classList.remove('selected');
    });

    // Clear all selected item IDs
    this.selectedItemIds.forEach(itemId => {
      const element = document.querySelector(`[data-element-id="${itemId}"]`);
      if (element) {
        element.classList.remove('selected');
      }
    });
    this.selectedItemIds = [];
  }

  public clearAllSelections() {
    // Clear selected items
    const selectedElements = document.querySelectorAll('.element-item.selected');
    selectedElements.forEach(element => {
      element.classList.remove('selected');
    });

    // Clear active layers
    const activeElements = document.querySelectorAll('.element-item.active');
    activeElements.forEach(element => {
      element.classList.remove('active');
    });

    this.selectedItemIds = [];
    this.activeLayerId = '';
  }

  public getSelectedItemsCount(): number {
    return this.selectedItemIds.length;
  }

  public clearSelectedItem() {
    // Clear all selected items
    this.clearSelectedItems();
  }

  public clearActiveLayer() {
    const element = document.querySelector(`[data-layer-id="${this.activeLayerId}"]`);
    if (element) {
      element.classList.toggle('active', false);
    }
    this.activeLayerId = '';
  }


  public renderItems() {
    if (!this.itemListContainer) return;

    this.itemListContainer.innerHTML = '';

    // Filter out system items (items with names starting with 'system-')
    const filteredItems = this.items.filter(item => !item.name?.startsWith('system-'));

    filteredItems.forEach((item) => {
      const itemElements = this.createElementItem(item, 0);
      this.itemListContainer?.append(...itemElements);
    });
  }

  private createElementItem(item: paper.Item, index: number): HTMLDivElement[] {
    //'Group', 'Layer', 'Path', 'CompoundPath', 'Shape', 'Raster', 'SymbolItem', 'PointText'
    if (!item.name) {
      this.itemIndex[item.className]++;
      item.name = `${item.className} ${this.itemIndex[item.className]}`;
    }

    // Skip system items (they should already be filtered out, but just in case)
    if (item.name.startsWith('system-')) {
      return [];
    }

    if (item.children) {
      const parentItem = document.createElement('div');
      parentItem.className = `element-item ${item.selected ? 'selected' : ''} ${item.visible ? 'visible' : 'hidden'}`;
      parentItem.dataset.elementId = item.id.toString();

      parentItem.innerHTML = tags.elementItem(item);
      parentItem.style.paddingLeft = `${(index + 1) * 15}px`;

      // Add click handler for selection
      parentItem.addEventListener('click', (e) => {
        e.stopPropagation();
        this.handleItemClick(item);
      });

      // Add action button event listeners
      this.setupActionButtonListeners(parentItem, item);

      const items = [parentItem];
      item.children.forEach((child) => {
        items.push(...this.createElementItem(child, index + 1));
      });
      return items;

    } else {
      const childItem = document.createElement('div');
      childItem.className = `element-item ${item.selected ? 'selected' : ''} ${item.visible ? 'visible' : 'hidden'}`;
      childItem.dataset.elementId = item.id.toString();

      childItem.innerHTML = tags.elementItem(item);
      childItem.style.paddingLeft = `${(index + 1) * 15}px`;

      // Add click handler for selection
      childItem.addEventListener('click', (e) => {
        e.stopPropagation();
        this.handleItemClick(item);
      });

      // Add action button event listeners
      this.setupActionButtonListeners(childItem, item);

      return [childItem];
    }
  }

  private handleItemClick(item: paper.Item): void {
    console.log('Layer panel item clicked:', item.name, 'ID:', item.id, 'Type:', item.className);

    if (item instanceof paper.Layer) {
      // Layer clicked - clear item selection, set active layer
      this.handleLayerClick(item);
    } else {
      // Item clicked - select item and set parent layer as active
      const isDrawableItem = item instanceof paper.Path ||
        item instanceof paper.CompoundPath ||
        item instanceof paper.Shape;

      if (isDrawableItem) {
        canvasService.updateItemSelection(item.id.toString());
        logger.updateStatus(`${item.name || item.className} selected`);
        console.log('Selection callback triggered for item:', item.id);
      } else {
        console.log('Item is not drawable:', item.className);
      }
    }
  }

  private handleLayerClick(layer: paper.Layer): void {
    canvasService.updateItemSelection(layer.id.toString());
    logger.updateStatus(`${layer.name} selected`);
    console.log('Selection callback triggered for layer:', layer.id);
  }

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

  private removeItem(target: paper.Item): void {
    this.items = this.items.filter(item => item.id !== target.id);
    target.remove();
    this.renderItems();
    this.updateItemSelection(this.activeLayerId, true, this.activeLayerId);
  }

  private handleDeleteItem(item: paper.Item): void {
    // Remove from canvas
    this.removeItem(item);
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
      this.removeItem(target);
    } else {
      logger.updateStatus('Item is not a group');
    }
  }

  public addLayer(): void {
    console.log('Adding layer');

    // Create popup modal
    this.showAddLayerModal();
  }

  private showAddLayerModal(): void {
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
      canvasService.addLayer(letter, index, selectedFont);
    });

    // Update the layer panel
    const fontInfo = selectedFont ? ` with font: ${selectedFont}` : ' with default font';
    logger.updateStatus(`Created ${letters.length} layers for: ${inputText}${fontInfo}`);
  }

}

export default UIService;



