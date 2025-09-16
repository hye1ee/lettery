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
  elementItem: (item: any) => `
    <div class="element-img"><img src="/${item.className.toLowerCase()}.svg" /></div>
    <div class="text-body" style="flex:1">${item.name}</div>
    <div class="element-actions">
      ${getElementActionButton(item)}
    </div>
  `,

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
