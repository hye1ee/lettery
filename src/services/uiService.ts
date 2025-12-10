import paper from 'paper'
import { tags, updateLayerSelection, updateItemSelection, clearItemSelection, setSortable } from '../utils/tags'

import { logger, syllableModal, jamoModal, agentAnimation } from '../helpers';
import type { ItemClassName, Syllable } from '../types';
import { toolService, agentService } from '.';
import { translate, translateToolName } from '../i18n';

/**
 * Manages UI rendering, user interactions, and canvas-UI synchronization
 */
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
    'StrokeSketch': 0,
    'ShapeSketch': 0,
    'CompoundPath': 0,
    'Shape': 0,
    'Raster': 0,
    'SymbolItem': 0,
    'PointText': 0
  };
  private itemListContainer: HTMLElement | null = null;

  // private selectedItemIds: string[] = [];
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

    this.renderAll();
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
    this.renderAgentTools();
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

    // Get children of the active layer
    syllable?.jamoIds.forEach((jamoId) => {
      const jamoLayer = paper.project.getItem({ data: { id: jamoId } }) as paper.Layer;
      if (!jamoLayer) throw new Error('Jamo layer not found');
      pathsListContainer.append(this.createPathItem(jamoLayer, 0));
    });

    this.renderAgentStatus();
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
    } else if (item.name === 'strokesketch') {
      this.itemIndex['StrokeSketch']++;
      item.name = `StrokeSketch ${this.itemIndex['StrokeSketch']}`;
    } else if (item.name === 'shapesketch') {
      this.itemIndex['ShapeSketch']++;
      item.name = `ShapeSketch ${this.itemIndex['ShapeSketch']}`;
    }
    // create path item div

    let selected = item.selected;
    if (item instanceof paper.Layer && !item.children.every(child => child.selected)) {
      selected = false;
    }

    const pathItem = document.createElement('div');
    pathItem.className = `element-item ${selected ? 'selected' : ''}`;
    pathItem.dataset.elementId = item.id.toString();
    pathItem.dataset.elementClassName = item.className;
    pathItem.innerHTML = tags.elementItem(item);
    pathItem.style.paddingLeft = `${(index + 1) * 15}px`;

    // Add click handler for selection
    pathItem.addEventListener('click', (e) => {
      e.stopPropagation();
      this.handleItemClick(e, item);
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

  private handleItemClick(_e: MouseEvent, item: paper.Item): void {
    console.log('Layer panel item clicked:', item.name, 'ID:', item.id, 'Type:', item.className);

    if (item instanceof paper.CompoundPath) console.log(item.pathData);
    paper.project.deselectAll();
    toolService.selectItem(item);
  }

  private handleSyllableClick(syllable: Syllable): void {
    if (syllable.jamoIds.includes(paper.project.activeLayer?.data.id)) return;

    const jamoLayer = paper.project.getItem({ data: { id: syllable.jamoIds[0] } }) as paper.Layer;
    if (!jamoLayer) throw new Error('Jamo layer not found');
    jamoLayer.activate();

    // Set this layer as the active layer and refresh paths section
    updateLayerSelection(syllable.id);
    this.renderPathItems();
    this.renderAgentStatus();

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
   * Add Syllable Modal Handler
   */
  public addSyllable(): void {
    syllableModal.show((syllables: Syllable[]) => {
      // Add syllables to the list
      this.syllables.push(...syllables);

      // Update UI
      this.renderAll();
    });
  }

  public getSyllableById(id: string): Syllable | undefined {
    return this.syllables.find((syllable) => syllable.id === id);
  }

  public getWorkingLetters(): { workingWord: string, workingSyllable: string, workingJamo: string } {
    const workingWord = this.syllables.map((syllable) => syllable.string).join('');
    const workingSyllable = this.syllables.find((syllable) => syllable.id === paper.project.activeLayer?.data.syllableId)?.string || '';
    const workingJamo = paper.project.activeLayer?.name || '';
    return { workingWord, workingSyllable, workingJamo };
  }

  /**
   * Add Jamo Modal Handler
   */
  public addJamo(): void {
    jamoModal.show(() => {

      // Update UI
      this.renderPathItems();
      this.renderAgentStatus();
    });
  }

  /**
   * Render agent tools dynamically
   */
  public renderAgentTools = () => {
    const actionListElement = document.getElementById('agent-actions-list');
    if (!actionListElement) throw new Error('Agent actions list element not found');

    if (actionListElement.innerHTML == '') {
      // init tools
      const tools = agentService.getTools();

      tools.forEach(tool => {
        // create item element
        const toolItem = document.createElement('div');
        toolItem.id = tool.id;
        toolItem.className = "agent-action-card disabled";

        // Mark non-functional tools with a special attribute
        if (!tool.isEnabled) {
          toolItem.setAttribute('data-non-interactive', 'true');
        }

        toolItem.innerHTML = tags.agentToolItem(tool);

        // Add click handler for the character button
        const characterBtn = toolItem.querySelector(`#agent-character-${tool.id}`) as HTMLElement;
        if (characterBtn) {
          characterBtn.addEventListener('click', (e) => {
            e.preventDefault();

            // Prevent clicks on disabled or non-interactive tools
            if (toolItem.classList.contains('disabled') ||
              toolItem.classList.contains('non-interactive') ||
              toolItem.getAttribute('data-non-interactive') === 'true') {
              return;
            }
            agentService.activateTool(tool);
            this.renderAgentTools();
          });
        }

        // Add close button handler
        const closeBtn = toolItem.querySelector(`#agent-tool-close-${tool.id}`) as HTMLButtonElement;
        if (closeBtn) {
          closeBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent card click
            e.preventDefault();
            agentService.deactivateTool();
            this.renderAgentTools();
          });
        }

        actionListElement.appendChild(toolItem);

        // Register all agents for walking animation (both interactive and non-interactive)
        agentAnimation.registerAgent(tool.id);
      });

    } else {
      // update tools 
      const activeLayer = paper.project.activeLayer;
      if (activeLayer && activeLayer.data.type === 'jamo') {
        // update tools
        const activeToolId = agentService.getActiveToolId();
        if (activeToolId) {
          // hide other tools 
          Array.from(actionListElement.children).forEach(child => {
            if (child.id !== activeToolId) {
              child.classList.add('deactivated');
            } else {
              child.classList.add('activated');
            }
          });
          // Pause animations when modal is open
          agentAnimation.pauseAnimations();
        } else {
          // normal tool rendering - enable tools
          Array.from(actionListElement.children).forEach(child => {
            const htmlChild = child as HTMLElement;

            // Remove disabled class from all tools
            child.classList.remove('disabled');

            // Add non-interactive class to tools that have no functionality
            if (htmlChild.getAttribute('data-non-interactive') === 'true') {
              child.classList.add('non-interactive');
            } else {
              child.classList.remove('non-interactive');
            }

            child.classList.remove('activated');
            child.classList.remove('deactivated');
          });
          // Resume animations when modal is closed
          agentAnimation.resumeAnimations();
        }
      } else {
        // disable all tools when no jamo layer is selected
        Array.from(actionListElement.children).forEach(child => {
          child.classList.add('disabled');
          child.classList.remove('non-interactive');
        });
        // Resume animations
        agentAnimation.resumeAnimations();
      }
    }
    this.renderAgentStatus();
  }

  /**
   * Update the agent status label with current active layer
   */
  public renderAgentStatus(): void {
    const statusElement = document.getElementById('agent-status');
    const actionListElement = document.getElementById('agent-actions-list');

    if (!actionListElement || !statusElement) return;

    const activeLayer = paper.project.activeLayer;
    if (activeLayer && activeLayer.data.type === 'jamo') {
      // update tools
      const activeTool = agentService.getActiveToolName();
      if (activeTool) {
        const layerName = activeLayer.name || translate('agent.status.layer.untitled');
        const toolName = translateToolName(activeTool);
        statusElement.textContent = translate('agent.status.tool', {
          tool: toolName,
          layer: layerName,
        });
      } else {
        const layerName = activeLayer.name || translate('agent.status.layer.untitled');
        statusElement.textContent = translate('agent.status.active', { layer: layerName });
      }
    } else {
      statusElement.textContent = translate('agent.status.empty');
    }
  }

}

export default UIService;



