import paper from 'paper';
import * as hangul from 'hangul-js';
import { v4 as uuidv4 } from 'uuid';
import { tags } from '../utils/tags';
import { logger } from '.';
import type { Syllable } from '../types';

/**
 * Singleton class for managing syllable modal
 */
class SyllableModal {
  private static instance: SyllableModal;
  private modalElement: HTMLElement | null = null;
  private onConfirmCallback: ((syllables: Syllable[]) => void) | null = null;

  private constructor() {
    // Private constructor for singleton pattern
  }

  public static getInstance(): SyllableModal {
    if (!SyllableModal.instance) {
      SyllableModal.instance = new SyllableModal();
    }
    return SyllableModal.instance;
  }

  public show(onConfirm: (syllables: Syllable[]) => void): void {
    this.onConfirmCallback = onConfirm;

    // Create modal overlay
    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'modal-overlay';
    modalOverlay.id = 'add-layer-modal';

    // Create modal content
    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';
    modalContent.innerHTML = tags.addLayerModal;

    modalOverlay.appendChild(modalContent);
    document.body.appendChild(modalOverlay);

    this.modalElement = modalOverlay;

    // Set up event listeners
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    const modal = document.getElementById('add-layer-modal');
    const closeBtn = document.getElementById('modal-close-btn');
    const confirmBtn = document.getElementById('modal-confirm-btn');
    const koreanInput = document.getElementById('korean-input') as HTMLInputElement;
    const preview = document.getElementById('letter-preview');

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
    koreanInput?.addEventListener('input', (e) => {
      const input = e.target as HTMLInputElement;
      this.updateLetterPreview(input.value, preview);
    });

    // Confirm button
    confirmBtn?.addEventListener('click', () => {
      const inputText = koreanInput?.value.trim();

      if (inputText) {
        const syllables = this.createSyllablesFromInput(inputText);

        if (this.onConfirmCallback) {
          this.onConfirmCallback(syllables);
        }

        closeModal();
      } else {
        logger.updateStatus('Please enter Korean text');
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

  private createSyllablesFromInput(inputText: string): Syllable[] {
    const letters = inputText.split('').filter(char => char.trim() !== '');
    const syllables: Syllable[] = [];

    letters.forEach((letter) => {
      const disassembled = hangul.disassemble(letter);

      // Create syllable object
      const syllable: Syllable = {
        id: uuidv4(),
        string: letter,
        jamo: disassembled,
        jamoIds: disassembled.map(() => uuidv4()),
      };
      syllables.push(syllable);

      // Create jamo layers
      syllable.jamo.forEach((jamoString, jamoIndex) => {
        const jamoLayer = new paper.Layer();
        jamoLayer.name = jamoString;
        jamoLayer.data.id = syllable.jamoIds[jamoIndex];
        jamoLayer.data.syllableId = syllable.id;
        jamoLayer.data.syllableString = syllable.string;

        paper.project.addLayer(jamoLayer);
      });
    });

    // Log success
    logger.updateStatus(`Created ${letters.length} syllables for: ${inputText}`);

    return syllables;
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

export default SyllableModal;

