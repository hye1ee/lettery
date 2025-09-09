import type { ToolType } from '../types'

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
    this.renderItems();
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

      parentItem.innerHTML = `
        <div class="element-img"><img src="/${item.className.toLowerCase()}.svg" /></div>
        <div class="text-body">${item.name}</div>
      `;
      parentItem.style.paddingLeft = `${(index + 1) * 15}px`;

      const items = [parentItem];
      item.children.forEach((child) => {
        items.push(...this.createElementItem(child, index + 1));
      });
      return items;

    } else {
      const childItem = document.createElement('div');
      childItem.className = `element-item ${item.selected ? 'selected' : ''} ${item.visible ? 'visible' : 'hidden'}`;
      childItem.dataset.elementId = item.id.toString();

      childItem.innerHTML = `
        <div class="element-img"><img src="/${item.className.toLowerCase()}.svg"/></div>
        <div class="text-body">${item.name}</div>
      `;
      childItem.style.paddingLeft = `${(index + 1) * 15}px`;
      return [childItem];
    }
  }

}

export default UIService;



