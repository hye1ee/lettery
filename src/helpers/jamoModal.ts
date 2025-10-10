import paper from 'paper';
import * as hangul from 'hangul-js';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '.';

/**
 * Singleton class for managing jamo modal
 */
class JamoModal {
  private static instance: JamoModal;
  private modalElement: HTMLElement | null = null;
  private onConfirmCallback: ((jamoLayer: paper.Layer) => void) | null = null;

  private constructor() {
    // Private constructor for singleton pattern
  }

  public static getInstance(): JamoModal {
    if (!JamoModal.instance) {
      JamoModal.instance = new JamoModal();
    }
    return JamoModal.instance;
  }

  public show(onConfirm: (jamoLayer: paper.Layer) => void): void {
    this.onConfirmCallback = onConfirm;

    // Get active layer syllable
    const activeLayer = paper.project.activeLayer;
    const syllable = activeLayer?.data?.syllableString || activeLayer?.name || '';

    if (!syllable) {
      logger.updateStatus('No active layer syllable found');
      return;
    }

    // Create modal overlay
    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'modal-overlay';
    modalOverlay.id = 'add-jamo-modal';

    // Create modal content
    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';
    modalContent.innerHTML = this.getModalTemplate(syllable);

    modalOverlay.appendChild(modalContent);
    document.body.appendChild(modalOverlay);

    this.modalElement = modalOverlay;

    // Set up event listeners with syllable
    this.setupEventListeners(syllable);
  }

  private getModalTemplate(syllable: string): string {
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
          <select id="jamo-font-selector" class="font-selector">
            <option value="">베이스 폰트 선택 없음</option>
            <option value="Noto Sans Korean">Noto Sans Korean</option>
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
        <button id="jamo-modal-confirm-btn" class="modal-btn modal-btn-primary">
          Import
        </button>
      </div>
    `;
  }

  private setupEventListeners(syllable: string): void {
    const modal = document.getElementById('add-jamo-modal');
    const closeBtn = document.getElementById('jamo-modal-close-btn');
    const confirmBtn = document.getElementById('jamo-modal-confirm-btn');
    const fontSelector = document.getElementById('jamo-font-selector') as HTMLSelectElement;
    const preview = document.getElementById('jamo-preview');
    const loadOptionRadios = document.querySelectorAll('input[name="load-option"]');

    // Close modal functions
    const closeModal = () => {
      if (modal) {
        modal.remove();
        this.modalElement = null;
      }
    };

    // Event listeners
    closeBtn?.addEventListener('click', closeModal);
    modal?.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });

    // Real-time preview
    const updatePreview = () => {
      const loadOption = (document.querySelector('input[name="load-option"]:checked') as HTMLInputElement)?.value;
      this.updatePreview(syllable, loadOption, preview);
    };

    // Initial preview
    updatePreview();

    loadOptionRadios.forEach(radio => {
      radio.addEventListener('change', updatePreview);
    });

    // Confirm button
    confirmBtn?.addEventListener('click', () => {
      const selectedFont = fontSelector?.value || '';
      const loadOption = (document.querySelector('input[name="load-option"]:checked') as HTMLInputElement)?.value;

      this.createJamoLayers(syllable, selectedFont, loadOption);
      closeModal();
    });
  }

  private updatePreview(text: string, loadOption: string, previewElement: HTMLElement | null): void {
    if (!previewElement) return;

    if (!text.trim()) {
      previewElement.innerHTML = '';
      return;
    }

    let previewItems: string[] = [];

    if (loadOption === 'decomposed') {
      // Decompose each syllable into jamos
      const syllables = text.split('').filter(char => char.trim() !== '');
      syllables.forEach(syllable => {
        const jamos = hangul.disassemble(syllable);
        previewItems.push(...jamos);
      });
    } else {
      // Composed syllables
      previewItems = text.split('').filter(char => char.trim() !== '');
    }

    // Display preview
    previewElement.innerHTML = previewItems
      .map((item, index) => `
        <div class="preview-item" key="${index}">
          <div class="preview-char">${item}</div>
        </div>
      `)
      .join('');
  }

  private createJamoLayers(inputText: string, selectedFont: string, loadOption: string): void {
    const layers: paper.Layer[] = [];

    if (loadOption === 'decomposed') {
      // Decompose into jamos
      const syllables = inputText.split('').filter(char => char.trim() !== '');
      syllables.forEach(syllable => {
        const jamos = hangul.disassemble(syllable);
        jamos.forEach(jamo => {
          const jamoLayer = new paper.Layer();
          jamoLayer.name = jamo;
          jamoLayer.data.id = uuidv4();
          paper.project.addLayer(jamoLayer);
          layers.push(jamoLayer);
        });
      });
    } else {
      // Composed syllables
      const syllables = inputText.split('').filter(char => char.trim() !== '');
      syllables.forEach(syllable => {
        const syllableLayer = new paper.Layer();
        syllableLayer.name = syllable;
        syllableLayer.data.id = uuidv4();
        paper.project.addLayer(syllableLayer);
        layers.push(syllableLayer);
      });
    }

    // Activate the last created layer
    if (layers.length > 0) {
      layers[layers.length - 1].activate();
    }

    // Call callback if exists
    if (this.onConfirmCallback && layers.length > 0) {
      this.onConfirmCallback(layers[layers.length - 1]);
    }

    const fontInfo = selectedFont ? ` with font: ${selectedFont}` : ' with default font';
    const typeInfo = loadOption === 'decomposed' ? 'decomposed jamos' : 'composed syllables';
    logger.updateStatus(`Created ${layers.length} layers as ${typeInfo} for: ${inputText}${fontInfo}`);
  }

  public hide(): void {
    if (this.modalElement) {
      this.modalElement.remove();
      this.modalElement = null;
    }
  }

  public isOpen(): boolean {
    return this.modalElement !== null;
  }
}

export default JamoModal;

