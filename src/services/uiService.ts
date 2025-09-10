import type { ToolType } from '../types'
import paper from 'paper'
import { tags } from '../utils/tags'
import { canvasService } from '.';

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
  private statusElement: HTMLSpanElement | null = null;
  private coordinatesElement: HTMLSpanElement | null = null;
  private toolButtons: Map<ToolType, HTMLButtonElement> = new Map();

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
  private onSelectionChange: ((itemId: string, selected: boolean) => void) | null = null;

  private constructor() { }

  static getInstance(): UIService {
    if (!UIService.instance) {
      UIService.instance = new UIService();
    }
    return UIService.instance;
  }

  public init(
    statusElement: HTMLSpanElement,
    coordinatesElement: HTMLSpanElement,
    toolButtons: Map<ToolType, HTMLButtonElement>
  ): void {
    this.statusElement = statusElement;
    this.coordinatesElement = coordinatesElement;
    this.toolButtons = toolButtons;
    this.itemListContainer = document.getElementById('layer-list');
  }

  updateStatus(message: string): void {
    if (this.statusElement) {
      this.statusElement.textContent = message;
    }
    console.log('Status:', message);
  }

  updateCoordinates(x: number, y: number): void {
    if (this.coordinatesElement) {
      this.coordinatesElement.textContent = `X: ${Math.round(x)}, Y: ${Math.round(y)}`;
    }
  }

  updateToolButtonStates(activeTool: ToolType): void {
    this.toolButtons.forEach((button, tool) => {
      button.classList.toggle('active', tool === activeTool);
    });
  }

  updateCursor(tool: ToolType | "grabbing"): void {
    const canvas = document.getElementById('vector-canvas') as HTMLCanvasElement;
    if (canvas) {
      switch (tool) {
        case 'select':
          canvas.style.cursor = 'default';
          break;
        case 'pen':
          canvas.style.cursor = 'crosshair';
          break;
        case 'addPoint':
          canvas.style.cursor = 'pointer';
          break;
        case 'hand':
          canvas.style.cursor = 'grab';
          break;
        case 'grabbing':
          canvas.style.cursor = 'grabbing';
          break;
        default:
          canvas.style.cursor = 'default';
      }
    }
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

  showLoading(message: string = 'Initializing'): void {
    this.updateStatus(message);
    // You could add a loading spinner here
  }

  hideLoading(message: string = 'Ready'): void {
    this.updateStatus(message);
    // Remove loading spinner here
  }

  showError(message: string): void {
    this.updateStatus(`Error: ${message}`);
    // You could add error styling here
  }

  showSuccess(message: string): void {
    this.updateStatus(message);
    // You could add success styling here
  }

  getToolButton(tool: ToolType): HTMLButtonElement | undefined {
    return this.toolButtons.get(tool);
  }


  public updateItems(items: paper.Item[]) {
    this.items = items;
    console.log("items", this.items);
    this.renderItems();
  }

  public updateItemSelection(itemId: string, selected: boolean) {
    if (itemId === '') {
      // Clear all selections
      this.clearAllSelections();
      return;
    }

    const element = document.querySelector(`[data-element-id="${itemId}"]`);
    if (element) {
      element.classList.toggle('selected', selected);
    }

  }

  public clearAllSelections() {
    const selectedElements = document.querySelectorAll('.element-item.selected');
    selectedElements.forEach(element => {
      element.classList.remove('selected');
    });
  }

  public setSelectionChangeCallback(callback: (itemId: string, selected: boolean) => void): void {
    this.onSelectionChange = callback;
  }

  public renderItems() {
    if (!this.itemListContainer) return;

    this.itemListContainer.innerHTML = '';

    this.items.forEach((item) => {
      const itemElements = this.createElementItem(item, 0);
      this.itemListContainer?.append(...itemElements);
    });
  }

  private createElementItem(item: paper.Item, index: number): HTMLDivElement[] {
    //'Group', 'Layer', 'Path', 'CompoundPath', 'Shape', 'Raster', 'SymbolItem', 'PointText'
    console.log(item);

    if (!item.name) {
      this.itemIndex[item.className]++;
      item.name = `${item.className} ${this.itemIndex[item.className]}`;
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

    // Check if it's a drawable item (Path, CompoundPath, etc.)
    const isDrawableItem = item instanceof paper.Path ||
      item instanceof paper.CompoundPath ||
      item instanceof paper.Shape;

    if (isDrawableItem && this.onSelectionChange) {
      // Notify the callback about the selection
      this.onSelectionChange(item.id.toString(), true);
      this.updateStatus(`${item.name || item.className} selected`);
      console.log('Selection callback triggered for item:', item.id);
    } else {
      console.log('Item is not drawable or callback not set:', item.className, !!this.onSelectionChange);
    }
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
  }

  private handleDeleteItem(item: paper.Item): void {
    // Remove from canvas
    this.removeItem(item);
    this.updateStatus(`Deleted ${item.name || item.className}`);

    // Notify about deletion
    if (this.onSelectionChange) {
      this.onSelectionChange(item.id.toString(), false);
    }
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
      this.updateStatus('Item is not a group');
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
      const koreanText = koreanInput?.value.trim();
      if (koreanText) {
        this.createLayersFromKoreanText(koreanText);
        closeModal();
      } else {
        this.updateStatus('Please enter Korean text');
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

  private createLayersFromKoreanText(koreanText: string): void {
    const letters = koreanText.split('').filter(char => char.trim() !== '');


    letters.forEach((letter, index) => {
      canvasService.addLayer(`letter_${index + 1}_${letter}`);
    });

    // Update the layer panel
    this.updateStatus(`Created ${letters.length} layers for: ${koreanText}`);
  }

}

export default UIService;



