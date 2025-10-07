// HTML Template Tags - Centralized HTML string management

export const tags = {
  // Modal Templates
  addLayerModal: `
    <div class="modal-header">
      <h3 class="text-title">Add Korean Letters</h3>
      <button class="modal-close-btn" id="modal-close-btn">
        <img src="/x.svg" alt="Close" width="16" height="16" />
      </button>
    </div>
    <div class="modal-body">
      <div class="input-group">
        <label for="korean-input" class="text-body">Enter Korean words:</label>
        <input 
          type="text" 
          id="korean-input" 
          class="korean-input" 
          placeholder="안녕하세요"
          maxlength="50"
        />
      </div>
      <div class="font-selector-group">
        <label for="font-selector" class="text-body">Font:</label>
        <select id="font-selector" class="font-selector">
          <option value="">베이스 폰트 선택 없음</option>
          <option value="Noto Sans Korean">Noto Sans Korean</option>
        </select>
      </div>
      <div class="preview-section">
        <label class="text-body">Preview:</label>
        <div id="letter-preview" class="letter-preview"></div>
      </div>
    </div>
    <div class="modal-footer">
      <button class="modal-btn confirm-btn" id="modal-confirm-btn">Create Layers</button>
    </div>
  `,



  // Element Item Templates
  elementItem: (item: any) => {
    // For Layer items, show children count instead of delete button
    if (item.className === 'Layer') {
      const childrenCount = item.children ? item.children.length : 0;
      return `
      <div class="element-img"><img src="/${item.className.toLowerCase()}.svg" /></div>
      <div class="text-body" style="flex:1">${item.name}</div>
      <div class="element-children-count">${childrenCount} items</div>
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

  layerItem: (item: any) => {
    // For Layer items, use card layout
    const childrenCount = item.children ? item.children.length : 0;
    return `
      <div class="layer-card-content">
        <div class="layer-preview">
          <div class="layer-preview-placeholder">${item.data?.string || item.name}</div>
        </div>
        <div class="layer-info">
          <div class="layer-name">${item.name}</div>
          <div class="layer-type">${item.data?.type || 'Layer'}</div>
          <div class="layer-children-count">${childrenCount} items</div>
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

  // Letter Preview Template
  letterItem: (letter: string, index: number) =>
    `<span class="letter-item" data-letter="${letter}">${letter}</span>`,

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