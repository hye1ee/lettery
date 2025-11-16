import { tags } from '../utils/tags';
import { logger, exporter } from '.';
import { translate } from '../i18n';
import QRCode from 'qrcode';

/**
 * Singleton class for managing export modal
 */
class ExportModal {
  private static instance: ExportModal;
  private modalElement: HTMLElement | null = null;
  private previewImageUrl: string | null = null;

  private constructor() {
    // Private constructor for singleton pattern
  }

  public static getInstance(): ExportModal {
    if (!ExportModal.instance) {
      ExportModal.instance = new ExportModal();
    }
    return ExportModal.instance;
  }

  public async show(): Promise<void> {
    // Create modal overlay
    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'modal-overlay';
    modalOverlay.id = 'export-modal';

    // Create modal content
    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content export-modal-content';
    modalContent.innerHTML = tags.exportModal();

    modalOverlay.appendChild(modalContent);
    document.body.appendChild(modalOverlay);

    this.modalElement = modalOverlay;

    // Load preview image
    await this.loadPreview();

    // Set up event listeners
    this.setupEventListeners();
  }

  private async loadPreview(): Promise<void> {
    try {
      const previewContainer = document.getElementById('export-preview-container');
      const previewImage = document.getElementById('export-preview-image') as HTMLImageElement;

      if (!previewContainer || !previewImage) return;

      // Show loading state
      previewContainer.classList.add('loading');

      // Generate preview
      this.previewImageUrl = await exporter.getImagePreview();
      previewImage.src = this.previewImageUrl;

      // Remove loading state when image loads
      previewImage.onload = () => {
        previewContainer.classList.remove('loading');
      };
    } catch (error) {
      console.error('Failed to load preview:', error);
      logger.updateStatus(translate('export.preview.error'));
    }
  }

  private setupEventListeners(): void {
    const modal = document.getElementById('export-modal');
    const closeBtn = document.getElementById('export-modal-close-btn');
    const downloadSvgBtn = document.getElementById('export-download-svg-btn');
    const downloadImageBtn = document.getElementById('export-download-image-btn');
    const qrCodeBtn = document.getElementById('export-qr-code-btn') as HTMLButtonElement;

    // Close modal function
    const closeModal = () => {
      if (modal) {
        modal.remove();
        this.modalElement = null;
        this.previewImageUrl = null;
      }
    };

    // Event listeners
    closeBtn?.addEventListener('click', closeModal);
    modal?.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });

    // Download SVG
    downloadSvgBtn?.addEventListener('click', async () => {
      try {
        exporter.exportSVG();
        logger.updateStatus(translate('export.success.svg'));
      } catch (error) {
        console.error('Failed to export SVG:', error);
        logger.updateStatus(translate('export.error.svg'));
      }
    });

    // Download Image
    downloadImageBtn?.addEventListener('click', async () => {
      try {
        await exporter.exportImage();
        logger.updateStatus(translate('export.success.image'));
      } catch (error) {
        console.error('Failed to export image:', error);
        logger.updateStatus(translate('export.error.image'));
      }
    });

    // QR Code
    qrCodeBtn?.addEventListener('click', async () => {
      // Disable button during processing
      if (qrCodeBtn.disabled) return;

      if (exporter.isExportDevMode()) {
        // Show dev message
        this.showDevMessage();
      } else if (!exporter.isFirebaseConfigured()) {
        // Firebase not configured
        this.showFirebaseNotConfigured();
      } else {
        // Disable button and generate QR code with Firebase
        qrCodeBtn.disabled = true;
        try {
          await this.generateQRCode();
        } finally {
          qrCodeBtn.disabled = false;
        }
      }
    });

    // Handle Escape key
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeModal();
        document.removeEventListener('keydown', handleEscape);
      }
    };
    document.addEventListener('keydown', handleEscape);
  }

  private showDevMessage(): void {
    const qrContainer = document.getElementById('export-qr-container');
    if (!qrContainer) return;

    qrContainer.innerHTML = `
      <div class="export-dev-message">
        <p class="text-body">${translate('export.qr.dev')}</p>
      </div>
    `;
  }

  private showFirebaseNotConfigured(): void {
    const qrContainer = document.getElementById('export-qr-container');
    if (!qrContainer) return;

    qrContainer.innerHTML = `
      <div class="export-dev-message">
        <p class="text-body">${translate('export.qr.notConfigured')}</p>
      </div>
    `;
  }

  private async generateQRCode(): Promise<void> {
    const qrContainer = document.getElementById('export-qr-container');
    if (!qrContainer) return;

    try {
      // Show initializing state
      qrContainer.innerHTML = `
        <div class="export-qr-loading">
          <div class="export-qr-spinner"></div>
          <p class="text-body">${translate('export.qr.initializing')}</p>
        </div>
      `;

      // Small delay to show initialization message
      await new Promise(resolve => setTimeout(resolve, 300));

      // Update to uploading state
      qrContainer.innerHTML = `
        <div class="export-qr-loading">
          <div class="export-qr-spinner"></div>
          <p class="text-body">${translate('export.qr.uploading')}</p>
        </div>
      `;

      // Upload to Firebase and get download URL
      const { downloadPageURL, directURL } = await exporter.uploadToFirebase();

      // Generate QR code with download page URL
      const qrCodeDataUrl = await QRCode.toDataURL(downloadPageURL, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      });

      // Display QR code and download link
      qrContainer.innerHTML = `
        <div class="export-qr-success">
          <p class="text-body" style="margin-bottom: 12px;">${translate('export.qr.success')}</p>
          <img src="${qrCodeDataUrl}" alt="QR Code" class="export-qr-image" />
          <div class="export-qr-links">
            <a href="${downloadPageURL}" target="_blank" class="export-qr-link text-body">
              ${translate('export.qr.viewDownloadPage')}
            </a>
            <a href="${directURL}" target="_blank" class="export-qr-link text-body">
              ${translate('export.qr.viewLink')}
            </a>
          </div>
          <p class="text-body export-qr-instruction">${translate('export.qr.instruction')}</p>
        </div>
      `;

      logger.updateStatus(translate('export.qr.complete'));
    } catch (error) {
      console.error('Failed to generate QR code:', error);
      qrContainer.innerHTML = `
        <div class="export-dev-message">
          <p class="text-body">${translate('export.qr.error')}</p>
        </div>
      `;
      logger.updateStatus(translate('export.qr.error'));
    }
  }

  public hide(): void {
    if (this.modalElement) {
      this.modalElement.remove();
      this.modalElement = null;
      this.previewImageUrl = null;
    }
  }

  public isOpen(): boolean {
    return this.modalElement !== null;
  }
}

export default ExportModal;

