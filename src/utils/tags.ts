// HTML Template Tags - Centralized HTML string management
import paper from 'paper';

import Sortable from "sortablejs";
import type { AgentTool, ItemClassName } from "../types";
import { fontLoader } from "../helpers";

export const tags = {
  // Modal Templates
  syllableModal: () => `
    <div class="modal-header">
      <h2 class="text-title">Add Korean Letters</h2>
      <button class="modal-close-btn" id="modal-close-btn">
        <img src="/x.svg" alt="Close" width="16" height="16" />
      </button>
    </div>
    <div class="modal-body">
      <div class="modal-group">
        <label for="korean-input" class="text-body">Enter Korean words:</label>
        <input 
          type="text" 
          id="korean-input" 
          class="modal-input" 
          placeholder="안녕하세요"
          maxlength="50"
        />
      </div>
      <div class="modal-group">
        <label class="text-body">Preview:</label>
        <div id="letter-preview" class="letter-preview"></div>
      </div>
    </div>
    <div class="modal-footer">
      <button class="modal-btn text-body" id="modal-confirm-btn">Create Layers</button>
    </div>
  `,

  jamoModal: (syllable: string) => {
    const fontList = fontLoader.getFontList();
    const fontOptions = fontList.map(font =>
      `<option value="${font.value}">${font.name}</option>`
    ).join('');

    return `
      <div class="modal-header">
         <h2 class="text-title">Import Jamo</h2>
         <button id="jamo-modal-close-btn" class="modal-close-btn">
           <img src="/x.svg" alt="Close" width="16" height="16" />
         </button>
       </div>
       <div class="modal-body">
         <div class="modal-info">
           <p class="text-body">Import jamo text path for syllable '${syllable}'</p>
         </div>
         <div class="modal-group">
           <label class="text-body" for="jamo-font-selector">Font:</label>
           <select id="jamo-font-selector" class="font-selector text-body">
             ${fontOptions}
           </select>
         </div>
         <div class="modal-group">
           <label class="text-body">Load as:</label>
           <div class="radio-group">
             <label class="radio-label">
               <input type="radio" name="load-option" value="decomposed" checked />
               <span class="text-body">Decomposed Jamos</span>
             </label>
             <label class="radio-label">
               <input type="radio" name="load-option" value="composed" />
               <span class="text-body">Composed Syllables</span>
             </label>
           </div>
         </div>
         <div class="modal-group">
           <label class="text-body">Preview:</label>
           <div id="jamo-preview" class="jamo-preview"></div>
         </div>
       </div>
       <div class="modal-footer">
         <button id="jamo-modal-confirm-btn" class="modal-btn text-body">
           Import
         </button>
       </div>
    `;
  },



  // Element Item Templates
  elementItem: (item: any) => {
    // For Layer items, show active indicator instead of delete button
    if (item.className === 'Layer') {
      const isActive = item.id === paper.project.activeLayer?.id;
      return `
      <div class="element-img"><img src="/${item.className.toLowerCase()}.svg" /></div>
      <div class="text-body" style="flex:1">${item.name}</div>
      <div class="element-active-indicator">
        <div class="active-dot ${isActive ? 'active' : 'inactive'}"></div>
      </div>
      `;
    }

    // For other items, use the original layout with delete button
    return `
      <div class="element-img"><img src="/${item.className.toLowerCase()}.svg" /></div>
      <div class="text-body" style="flex:1">${item.name}</div>
      <div class="element-actions">
        ${getElementActionButton(item)}
      </div>
    `;
  },

  syllableItem: (syllable: any) => {
    // For Syllable items, use card layout
    return `
      <div class="layer-card-content">
        <div class="layer-preview">
          <div class="layer-preview-placeholder">${syllable.string}</div>
        </div>
        <div class="layer-info">
          <div class="layer-name">${syllable.string}</div>
          <div class="layer-type">${'Layer'}</div>
          <div class="layer-children-count">${syllable.id}</div>
        </div>
      </div>
    `;
  },

  // Element Action Buttons
  elementActionButtons: {
    Group: (item: any) => `
      <button class="element-action-btn ungroup-btn" data-action="ungroup" title="Ungroup">
        <img src="/ungroup.svg" alt="Ungroup" width="12" height="12" />
      </button>
    `,
    Path: (item: any) => `
      <button class="element-action-btn delete-btn" data-action="delete" title="Delete">
        <img src="/trash.svg" alt="Delete" width="12" height="12" />
      </button>
    `,
    Shape: (item: any) => `
      <button class="element-action-btn delete-btn" data-action="delete" title="Delete">
        <img src="/trash.svg" alt="Delete" width="12" height="12" />
      </button>
    `,
    CompoundPath: (item: any) => `
      <button class="element-action-btn delete-btn" data-action="delete" title="Delete">
        <img src="/trash.svg" alt="Delete" width="12" height="12" />
      </button>
    `,
    Layer: (item: any) => `
      <button class="element-action-btn delete-btn" data-action="delete" title="Delete">
        <img src="/trash.svg" alt="Delete" width="12" height="12" />
      </button>
    `,
    default: (item: any) => `
      <button class="element-action-btn delete-btn" data-action="delete" title="Delete">
        <img src="/trash.svg" alt="Delete" width="12" height="12" />
      </button>
    `
  },

  // Legacy alias for backward compatibility
  letterItem: (letter: string, index: number) =>
    `<div class="preview-item" key="${index}">
      <div class="preview-char">${letter}</div>
    </div>`,

  agentToolItem: (tool: AgentTool) => `
    <button class="agent-tool-close " id="agent-tool-close-${tool.id}" title="Cancel">
      <img src="/x.svg" alt="Close" width="16" height="16" />
    </button>
    <div class="agent-action-icon">
      <img src="${tool.icon}" alt="${tool.name}" width="16" height="16" />
    </div>
    <div class="agent-action-content" id="agent-tool-content-${tool.id}">
      <div class="text-subtitle">${tool.name}</div>
      <div class="text-body">${tool.description}</div>
    </div>
    <div class="agent-workflow-container" id="agent-workflow-${tool.id}">
      <div class="agent-workflow-display">
        <div class="agent-workflow-step">
          <div class="text-subtitle" id="agent-workflow-title-${tool.id}"></div>
        </div>
        <div class="agent-workflow-content text-body" id="agent-workflow-content-${tool.id}"></div>
        <div class="agent-workflow-actions">
          <button class="modal-btn text-body" id="agent-workflow-btn-${tool.id}"></button>
        </div>
      </div>
    </div>
  `,

  agentWorkflowDisplay: (title: string, content: string, confirmText: string = 'Continue', isDisabled: boolean = false) => `
    <div class="agent-workflow-display">
      <div class="agent-workflow-step">
        <div class="text-subtitle">${title}</div>
      </div>
      <div class="agent-workflow-content">
        <div class="text-body">${content}</div>
      </div>
      <div class="agent-workflow-actions">
        <button class="modal-btn text-body" id="agent-confirm-btn" ${isDisabled ? 'disabled' : ''}>${confirmText}</button>
      </div>
    </div>
  `,

  svgPreview: (beforePaths: string[]) => {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    beforePaths.forEach(d => {
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', d);
      path.setAttribute('fill', 'black');
      path.setAttribute('stroke', 'none');
      svg.appendChild(path);
    });
    document.body.appendChild(svg);

    // calculate the bounding box
    const paths = svg.querySelectorAll('path');
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    paths.forEach(p => {
      const b = p.getBBox();
      minX = Math.min(minX, b.x);
      minY = Math.min(minY, b.y);
      maxX = Math.max(maxX, b.x + b.width);
      maxY = Math.max(maxY, b.y + b.height);
    });

    // apply padding and set viewBox
    const padding = 5;
    const viewBox = `${minX - padding} ${minY - padding} ${maxX - minX + padding * 2} ${maxY - minY + padding * 2}`;

    document.body.removeChild(svg);

    return `
      <svg width="100" height="100"
           viewBox="${viewBox}"
           xmlns="http://www.w3.org/2000/svg"
           preserveAspectRatio="xMidYMid meet">
        ${beforePaths
        .map(d => `<path d="${d}" stroke="none" fill="black"/>`)
        .join('')}
      </svg>
    `;
  },

  svgComparison: (afterPaths: string[], beforePaths: string[]) => `
    <div class="svg-preview" style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 16px 0;">
      <div>
        <p style="text-align: center; font-size: 0.85em; color: #666; margin-bottom: 8px; font-weight: 600;">Before</p>
        <div class="svg-preview-item">
          ${tags.svgPreview(beforePaths)}
        </div>
      </div>
      <div>
        <p style="text-align: center; font-size: 0.85em; color: #666; margin-bottom: 8px; font-weight: 600;">After</p>
        <div class="svg-preview-item">
          ${tags.svgPreview(afterPaths)}
        </div>
      </div>
    </div>
  `,
};

// Helper function to get the appropriate action button for an element
export function getElementActionButton(item: any): string {
  const actionButtons = tags.elementActionButtons;
  const itemType = item.className;

  if (actionButtons[itemType as keyof typeof actionButtons]) {
    return actionButtons[itemType as keyof typeof actionButtons](item);
  }

  return actionButtons.default(item);
}

export const updateLayerSelection = (layerId: string) => {
  console.log('Updating layer selection', layerId);
  const layerItems = document.querySelectorAll('.layer-card');
  layerItems.forEach((element) => {
    element.classList.remove('active');
  });

  const element = document.querySelector(`.layer-card[data-layer-id="${layerId}"]`);
  if (element) {
    element.classList.add('active');
  }
  console.log('Layer selection updated', element);
}

export const updateItemSelection = (itemId: string) => {
  clearItemSelection();

  const element = document.querySelector(`.element-item[data-item-id="${itemId}"]`);
  if (element) {
    element.classList.add('active');
  }
}

export const clearItemSelection = () => {
  const itemItems = document.querySelectorAll('.element-item');
  itemItems.forEach((element) => {
    element.classList.remove('active');
  });
}

export const setSortable = (container: HTMLElement, className: ItemClassName): Sortable => {
  switch (className) {
    case 'Layer':
      return setSortableLayer(container);
      break;
    case 'CompoundPath':
      return setSortableCompoundPath(container);
      break;
    case 'Path':
      return setSortablePath(container);
      break;
    default:
      return setSortableItem(container);
      break;
  }
}

export const setSortableLayer = (container: HTMLElement): Sortable => {
  return new Sortable(container, {
    group: {
      name: 'layer',
      put: ['layer', 'path', 'item', 'compoundPath'],
    },
    draggable: '.draggable',
    animation: 150,
  });
}


export const setSortablePath = (container: HTMLElement): Sortable => {
  return new Sortable(container, {
    group: {
      name: 'path',
      put: false,
    },
    sort: false,
    animation: 150,
    draggable: '.draggable',

  });
}

export const setSortableItem = (container: HTMLElement): Sortable => {
  return new Sortable(container, {
    group: {
      name: 'item',
      put: false,
    },
    sort: false,
    animation: 150,
    draggable: '.draggable',
  });
}


export const setSortableCompoundPath = (container: HTMLElement): Sortable => {
  return new Sortable(container, {
    group: {
      name: 'compoundPath',
      put: (to, from, dragEl) => {
        return dragEl.dataset.elementClassName === 'Path' || dragEl.dataset.elementClassName === 'Shape';
      },
    },
    sort: false,
    animation: 150,
    draggable: '.draggable',
  });
}