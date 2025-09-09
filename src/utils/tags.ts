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
    <div class="text-body">${item.name}</div>
  `,

  // Letter Preview Template
  letterItem: (letter: string, index: number) =>
    `<span class="letter-item" data-letter="${letter}">${letter}</span>`,

};
