import paper from 'paper';
import { tags } from '../utils/tags';
import { logger, fontLoader } from '.';
import { uiService } from '../services';
import { getTranslationVector } from '../utils/paperUtils';
import { decomposeSyllable, isVerticalVowel } from '../utils/hangul';

/**
 * Singleton class for managing jamo modal
 */
class JamoModal {
  private static instance: JamoModal;
  private modalElement: HTMLElement | null = null;
  private onConfirmCallback: (() => void) | null = null;

  private constructor() {
    // Private constructor for singleton pattern
  }

  public static getInstance(): JamoModal {
    if (!JamoModal.instance) {
      JamoModal.instance = new JamoModal();
    }
    return JamoModal.instance;
  }

  public show(onConfirm: () => void): void {
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
    modalContent.innerHTML = tags.jamoModal(syllable);

    modalOverlay.appendChild(modalContent);
    document.body.appendChild(modalOverlay);

    this.modalElement = modalOverlay;

    // Set up event listeners with syllable
    this.setupEventListeners(syllable);
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
    confirmBtn?.addEventListener('click', async () => {
      const selectedFont = fontSelector?.value || 'Noto Sans KR';
      const loadOption = (document.querySelector('input[name="load-option"]:checked') as HTMLInputElement)?.value;

      await this.createJamoText(syllable, selectedFont, loadOption);
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
        const jamos = decomposeSyllable(syllable);
        previewItems.push(...jamos);
      });
    } else {
      // Composed syllables
      previewItems = text.split('').filter(char => char.trim() !== '');
    }

    // Display preview using unified template
    previewElement.innerHTML = previewItems
      .map((item, index) => tags.letterItem(item, index))
      .join('');
  }

  private async createJamoText(inputText: string, selectedFont: string, loadOption: string): Promise<void> {
    const syllable = uiService.getSyllableById(paper.project.activeLayer.data.syllableId);
    if (!syllable) throw new Error('Syllable not found');

    try {
      if (loadOption === 'decomposed') {
        // Create text path for each jamo
        for (let index = 0; index < syllable.jamoIds.length; index++) {
          const jamoId = syllable.jamoIds[index];
          const jamoText = syllable.jamo[index];

          // Find the target layer
          const targetLayer = paper.project.getItem({ data: { id: jamoId } }) as paper.Layer;

          if (targetLayer) {
            // Create text path using fontLoader
            const textItems = await fontLoader.importTextToPaper(
              jamoText,
              selectedFont,
              300,
              targetLayer
            );
            if (index !== 0) {
              let translationVector = getTranslationVector(jamoText, textItems);

              if (index === 2 && !isVerticalVowel(syllable.jamo[1])) {
                translationVector = translationVector.multiply(3)
              }
              textItems.forEach(textItem => {
                textItem.position = textItem.position.add(translationVector);
              });
            }


          }
        }
      } else {
        // Create composed syllable
        const targetLayer = paper.project.getItem({ data: { id: syllable.jamoIds[0] } }) as paper.Layer;

        if (targetLayer) {
          // Create text path for the whole syllable
          await fontLoader.importTextToPaper(
            inputText,
            selectedFont,
            300,
            targetLayer
          );
        }
      }

      // Call callback if exists
      this.onConfirmCallback && this.onConfirmCallback();

      const typeInfo = loadOption === 'decomposed' ? 'decomposed jamos' : 'composed syllables';
      logger.updateStatus(`Imported ${typeInfo} for syllable '${inputText}' with font: ${selectedFont}`);
    } catch (error) {
      logger.error('Failed to create text paths', error);
    }
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

