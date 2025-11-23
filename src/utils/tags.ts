// HTML Template Tags - Centralized HTML string management
import Sortable from "sortablejs";
import type { AgentTool, ItemClassName } from "../types";
import { fontLoader } from "../helpers";
import { translate, translateToolName } from "../i18n";

export const tags = {
  // Modal Templates
  syllableModal: () => {
    const title = translate('modal.syllable.title');
    const close = translate('modal.close');
    const inputLabel = translate('modal.syllable.inputLabel');
    const placeholder = translate('modal.syllable.placeholder');
    const previewLabel = translate('modal.syllable.preview');
    const confirm = translate('modal.syllable.confirm');

    return `
    <div class="modal-header">
      <h2 class="text-title">${title}</h2>
      <button class="modal-close-btn" id="modal-close-btn" title="${close}">
        <img src="/x.svg" alt="${close}" width="16" height="16" />
      </button>
    </div>
    <div class="modal-body">
      <div class="modal-group">
        <label for="korean-input" class="text-body">${inputLabel}</label>
        <input 
          type="text" 
          id="korean-input" 
          class="modal-input" 
          placeholder="${placeholder}"
          maxlength="50"
        />
      </div>
      <div class="modal-group">
        <label class="text-body">${previewLabel}</label>
        <div id="letter-preview" class="letter-preview"></div>
      </div>
    </div>
    <div class="modal-footer">
      <button class="modal-btn text-body" id="modal-confirm-btn">${confirm}</button>
    </div>
  `;
  },

  jamoModal: (syllable: string) => {
    const fontList = fontLoader.getFontList();
    const fontOptions = fontList.map(font =>
      `<option value="${font.value}">${font.name}</option>`
    ).join('');

    const title = translate('modal.jamo.title');
    const close = translate('modal.close');
    const info = translate('modal.jamo.info', { syllable });
    const fontLabel = translate('modal.jamo.fontLabel');
    const loadAs = translate('modal.jamo.loadAs');
    const decomposed = translate('modal.jamo.option.decomposed');
    const composed = translate('modal.jamo.option.composed');
    const previewLabel = translate('modal.jamo.preview');
    const confirm = translate('modal.jamo.confirm');

    return `
      <div class="modal-header">
         <h2 class="text-title">${title}</h2>
         <button id="jamo-modal-close-btn" class="modal-close-btn" title="${close}">
           <img src="/x.svg" alt="${close}" width="16" height="16" />
         </button>
       </div>
       <div class="modal-body">
         <div class="modal-info">
           <p class="text-body">${info}</p>
         </div>
         <div class="modal-group">
           <label class="text-body" for="jamo-font-selector">${fontLabel}</label>
           <select id="jamo-font-selector" class="font-selector text-body">
             ${fontOptions}
           </select>
         </div>
         <div class="modal-group">
           <label class="text-body">${loadAs}</label>
           <div class="radio-group">
             <label class="radio-label">
               <input type="radio" name="load-option" value="decomposed" checked />
               <span class="text-body">${decomposed}</span>
             </label>
             <label class="radio-label">
               <input type="radio" name="load-option" value="composed" />
               <span class="text-body">${composed}</span>
             </label>
           </div>
         </div>
         <div class="modal-group">
           <label class="text-body">${previewLabel}</label>
           <div id="jamo-preview" class="jamo-preview"></div>
         </div>
       </div>
       <div class="modal-footer">
         <button id="jamo-modal-confirm-btn" class="modal-btn text-body">
           ${confirm}
         </button>
       </div>
    `;
  },

  exportModal: () => {
    const title = translate('modal.export.title');
    const close = translate('modal.close');
    const downloadSvg = translate('modal.export.downloadSvg');
    const downloadImage = translate('modal.export.downloadImage');
    // const qrCode = translate('modal.export.qrCode');

    return `
      <div class="modal-header">
        <h2 class="text-title">${title}</h2>
        <button id="export-modal-close-btn" class="modal-close-btn" title="${close}">
          <img src="/x.svg" alt="${close}" width="16" height="16" />
        </button>
      </div>
      <div class="modal-body export-modal-body">
          <div class="modal-info">
           <div id="export-info" class="text-body">hello</div>
         </div>
        <div class="export-section">
          <div class="export-preview-section">
            <div id="export-preview-container" class="export-preview-container">
              <img id="export-preview-image" class="export-preview-image" alt="Preview" />
            </div>
            <div id="export-qr-container" class="export-qr-container"></div>
          </div>
        </div>
        
      </div>
      <div class="modal-footer">
          <div class="export-actions-section">
            <button id="export-download-svg-btn" class="export-action-btn text-body">
              <img src="/save.svg" alt="SVG" width="20" height="20" />
              <span>${downloadSvg}</span>
            </button>
            <button id="export-download-image-btn" class="export-action-btn text-body">
              <img src="/save.svg" alt="Image" width="20" height="20" />
              <span>${downloadImage}</span>
            </button>
          </div>

      </div>
    `;
  },



  // Element Item Templates
  elementItem: (item: any) => {
    // For Layer items, no extra indicator needed - border will show active state
    if (item.className === 'Layer') {
      return `
      <div class="element-img"><img src="/${item.className.toLowerCase()}.svg" /></div>
      <div class="text-body">${item.name}</div>
      `;
    }

    // For other items, use the original layout with delete button
    return `
      <div class="element-img"><img src="/${item.className.toLowerCase()}.svg" /></div>
      <div class="text-body">${item.name}</div>
      <div class="element-actions">
        ${getElementActionButton(item)}
      </div>
    `;
  },

  syllableItem: (syllable: any) => {
    // For Syllable items, use card layout
    return `
      <div class="element-img"><img src="/text.svg" /></div>
      <div class="text-body">${syllable.string}</div>
      <div class="element-actions">
      </div>
    `;
  },

  // Element Action Buttons
  elementActionButtons: {
    Group: (_item: any) => `
      <button class="element-action-btn ungroup-btn" data-action="ungroup" title="Ungroup">
        <img src="/ungroup.svg" alt="Ungroup" width="12" height="12" />
      </button>
    `,
    Path: (_item: any) => `
      <button class="element-action-btn delete-btn" data-action="delete" title="Delete">
        <img src="/trash.svg" alt="Delete" width="12" height="12" />
      </button>
    `,
    Shape: (_item: any) => `
      <button class="element-action-btn delete-btn" data-action="delete" title="Delete">
        <img src="/trash.svg" alt="Delete" width="12" height="12" />
      </button>
    `,
    CompoundPath: (_item: any) => `
      <button class="element-action-btn delete-btn" data-action="delete" title="Delete">
        <img src="/trash.svg" alt="Delete" width="12" height="12" />
      </button>
    `,
    Layer: (_item: any) => `
      <button class="element-action-btn delete-btn" data-action="delete" title="Delete">
        <img src="/trash.svg" alt="Delete" width="12" height="12" />
      </button>
    `,
    default: (_item: any) => `
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

  agentToolItem: (tool: AgentTool) => {
    const closeLabel = translate('modal.close');
    const localizedName = translateToolName(tool.name);
    // const localizedDescription = translateToolDescription(tool.id, tool.description);

    return `
    <!-- Character Button (shown when collapsed) -->
    <div class="agent-character-button" id="agent-character-${tool.id}">
      <img class="agent-character-image" src="${tool.characterImage}" alt="${localizedName}" />
      <img class="agent-label-image" src="${tool.labelImage}" alt="${localizedName} Label" />
    </div>
    
    <!-- Expanded Panel (shown when activated) -->
    <div class="agent-panel" id="agent-panel-${tool.id}">
      <button class="agent-tool-close" id="agent-tool-close-${tool.id}" title="${closeLabel}">
        <img src="/x.svg" alt="${closeLabel}" width="20" height="20" />
      </button>
      <div class="agent-workflow-container" id="agent-workflow-${tool.id}">
          <div class="agent-workflow-content text-body" id="agent-workflow-content-${tool.id}">
            <!-- Steps will be added here dynamically -->
          </div>

      </div>
    </div>
  `;
  },

  agentWorkflowDisplay: (title: string, content: string, confirmText: string = translate('modal.continue'), isDisabled: boolean = false) => `
    <div class="agent-workflow-display">
      <div class="agent-workflow-step">
        <div class="text-subtitle">${title}</div>
      </div>
      <div class="agent-workflow-content">
        <div class="text-body">${content}</div>
      </div>
      <div class="agent-workflow-actions">
        <button class="modal-btn text-label" id="agent-confirm-btn" ${isDisabled ? 'disabled' : ''}>${confirmText}</button>
      </div>
    </div>
  `,

  svgPreview: (beforePaths: string[], closed: boolean = true) => {
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
        .map(d => `<path d="${d}" ${closed ? 'stroke="none" fill="black"' : 'stroke="black" fill="none"'}/>`)
        .join('')}
      </svg>
    `;
  },

  svgComparison: (afterPaths: string[], beforePaths: string[]) => `
    <div class="svg-preview" >
      <div>
        <p class="svg-preview-label">${translate('tags.before')}</p>
        <div class="svg-preview-item">
          ${tags.svgPreview(beforePaths, true)}
        </div>
      </div>
      <div>
        <p class="svg-preview-label">${translate('tags.after')}</p>
        <div class="svg-preview-item">
          ${tags.svgPreview(afterPaths, true)}
        </div>
      </div>
    </div>
  `,

  svgMixedPreview: (closedPaths: string[], openedPaths: string[], color: "blue" | "orange") => {
    // Create a temporary SVG to calculate bounding box
    const allPaths = [...closedPaths, ...openedPaths];
    if (allPaths.length === 0) {
      return `<svg width="100" height="100"><text>${translate('tags.noPaths')}</text></svg>`;
    }

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    allPaths.forEach(d => {
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

    const closedPathsSvg = closedPaths
      .map(d => `<path d="${d}" stroke="none" fill="black"/>`)
      .join('');

    const openedPathsSvg = openedPaths
      .map(d => color === "blue" ? `<path d="${d}" fill="#6FC9F0" stroke="none" stroke-width="15"/>` : `<path d="${d}" stroke="#FFA500" fill="none" stroke-width="15"/>`)
      .join('');

    return `
      <svg width="100" height="100"
           viewBox="${viewBox}"
           xmlns="http://www.w3.org/2000/svg"
           preserveAspectRatio="xMidYMid meet">
        ${closedPathsSvg}
        ${openedPathsSvg}
      </svg>
    `;
  },

  markdown: (markdownText: string) => {
    if (!markdownText || typeof markdownText !== 'string') {
      return '<div class="markdown-content"><p>No content available.</p></div>';
    }

    // Simple markdown to HTML converter
    let html = markdownText.trim()
      // Code blocks (handle first to avoid conflicts)
      .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
      // Inline code
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      // Headers
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      // Bold (make sure it doesn't interfere with headers)
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      // Italic (but not if it's already bold)
      .replace(/\*([^*]+)\*/g, '<em>$1</em>')
      // Lists
      .replace(/^\* (.+)$/gim, '<li>$1</li>')
      // Wrap consecutive list items in ul
      .replace(/(<li>.*<\/li>)(?:\s*<li>.*<\/li>)*/gs, (match) => `<ul>${match}</ul>`)
      // Line breaks - convert double newlines to paragraph breaks
      .replace(/\n\s*\n/g, '</p><p>')
      .replace(/\n/g, '<br>');

    // If the content doesn't start with a tag, wrap it in a paragraph
    if (!html.match(/^<[h1-6]/) && !html.match(/^<ul/) && !html.match(/^<pre/)) {
      html = `<p>${html}</p>`;
    }

    // Wrap in div for proper spacing and styling
    return `<div class="markdown-content">${html}</div>`;
  },

  planMessages: (planMessages: Array<{ jamo: string, syllable: string, plan_summary: string, plan: string, reason: string }>) => {
    return `
      <div class="plan-messages">
        ${planMessages.map((plan) => `
          <div class="plan-block">
            <div class="plan-jamo-display">
              <div class="plan-jamo-char">${plan.jamo}</div>
              <div class="plan-syllable-label">${plan.syllable}</div>
            </div>
            <div class="plan-details">
              <div class="plan-detail-item">
                <div class="plan-detail-label">Plan</div>
                <div class="plan-detail-text">${plan.plan_summary}</div>
              </div>
              <div class="plan-detail-item">
                <div class="plan-detail-label">Why?</div>
                <div class="plan-detail-text">${plan.reason}</div>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  },

  executionResults: (results: Array<{ jamo: string, path: string | string[], summary: string, syllable?: string }>) => {
    return `
      <div class="execution-results-wrapper">
        <div class="execution-selection-description"></div>
        <div class="execution-results">
          ${results.map((result, index) => {
      return `
              <div class="execution-result-item" data-result-index="${index}">
                <div class="execution-preview-container ${result.path ? 'selected has-cursor' : 'loading'}" data-index="${index}">
                  ${result.path ? `
                    <div class="execution-jamo-label">${result.jamo}</div>
                    ${tags.svgPreview(Array.isArray(result.path) ? result.path : [result.path])}
                    <button class="execution-refresh-btn" data-jamo="${result.jamo}" data-syllable="${result.syllable || ''}" data-index="${index}" title="다시 생성하기">
                      <img src="/refresh.svg" alt="Refresh" width="16" height="16" />
                    </button>
                  ` : ''}
                </div>
              </div>
            `;
    }).join('')}
        </div>
      </div>
    `;
  },

  guidedEditResults: (results: Array<{ path: string | string[] }>) => {
    return `
      <div class="execution-results-wrapper">
        <div class="execution-selection-description"></div>
        <div class="execution-results">
          ${results.map((result, index) => {
      return `
              <div class="execution-result-item" data-result-index="${index}">
                <div class="execution-preview-container ${result.path ? 'has-cursor' : 'loading'}" data-index="${index}">
                  ${result.path ? `
                    ${tags.svgPreview(Array.isArray(result.path) ? result.path : [result.path])}
                  ` : ''}
                </div>
              </div>
            `;
    }).join('')}
        </div>
      </div>
    `;
  },
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

  // Update layer cards in syllables section
  const layerItems = document.querySelectorAll('.layer-card');
  layerItems.forEach((element) => {
    element.classList.remove('active');
  });

  const element = document.querySelector(`.layer-card[data-layer-id="${layerId}"]`);
  if (element) {
    element.classList.add('active');
  }

  // Update layer items in paths section (element-item)
  const pathLayerItems = document.querySelectorAll('.element-item[data-item-class="Layer"]');
  pathLayerItems.forEach((pathItem) => {
    pathItem.classList.remove('active');
  });

  const pathElement = document.querySelector(`.element-item[data-item-class="Layer"][data-item-id="${layerId}"]`);
  if (pathElement) {
    pathElement.classList.add('active');
  }

  console.log('Layer selection updated', element, pathElement);
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
      put: (_to, _from, dragEl) => {
        return dragEl.dataset.elementClassName === 'Path' || dragEl.dataset.elementClassName === 'Shape';
      },
    },
    sort: false,
    animation: 150,
    draggable: '.draggable',
  });
}