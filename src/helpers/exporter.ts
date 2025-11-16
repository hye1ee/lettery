import paper from 'paper';
import FirebaseService from './firebaseService';

/**
 * Singleton class for handling export operations
 */
class Exporter {
  private static instance: Exporter;

  private constructor() {
    // Private constructor for singleton pattern
  }

  public static getInstance(): Exporter {
    if (!Exporter.instance) {
      Exporter.instance = new Exporter();
    }
    return Exporter.instance;
  }

  /**
   * Filter items before export - remove items without names or with "system" in name
   */
  private filterItemsForExport(item: paper.Item): boolean {
    // Keep items that have a name and don't include "system"
    if (!item.name || item.name.toLowerCase().includes('system')) {
      return false;
    }
    return true;
  }

  /**
   * Get filtered SVG content for export
   */
  private getFilteredSVGContent(): string {
    if (!paper.project) throw new Error("Project not found");

    // Temporarily hide items that should not be exported
    const hiddenItems: paper.Item[] = [];

    paper.project.getItems({}).forEach((item) => {
      if (!this.filterItemsForExport(item)) {
        hiddenItems.push(item);
        item.visible = false;
      }
    });

    // Export with filtered items
    const svgContent = paper.project.exportSVG({ asString: true }) as string;

    // Restore visibility
    hiddenItems.forEach((item) => {
      item.visible = true;
    });

    return svgContent;
  }

  /**
   * Export project as SVG file
   */
  public exportSVG(): void {
    if (!paper.project) throw new Error("Project not found");

    const svgContent = this.getFilteredSVGContent();
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'lettery-sample.svg';
    a.click();

    URL.revokeObjectURL(url);
  }

  /**
   * Export project as PNG image
   */
  public async exportImage(): Promise<void> {
    if (!paper.project) throw new Error("Project not found");

    const svgContent = this.getFilteredSVGContent();
    const pngDataUrl = await this.convertSvgToPng(svgContent);

    const a = document.createElement('a');
    a.href = pngDataUrl;
    a.download = 'lettery-sample.png';
    a.click();
  }

  /**
   * Get image data URL for preview
   */
  public async getImagePreview(): Promise<string> {
    if (!paper.project) throw new Error("Project not found");

    const svgContent = this.getFilteredSVGContent();
    return await this.convertSvgToPng(svgContent);
  }

  /**
   * Convert SVG string to PNG data URL with frame overlay
   */
  private convertSvgToPng(svgString: string): Promise<string> {
    return new Promise((resolve, reject) => {
      // Load the frame image first
      const frameImg = new Image();
      frameImg.crossOrigin = 'anonymous';

      frameImg.onload = () => {
        // Now load the SVG
        const blob = new Blob([svgString], { type: "image/svg+xml" });
        const url = URL.createObjectURL(blob);
        const svgImg = new Image();

        svgImg.onload = () => {
          const canvas = document.createElement("canvas");

          // Use frame dimensions as canvas size
          canvas.width = frameImg.width;
          canvas.height = frameImg.height;

          const ctx = canvas.getContext("2d");
          if (!ctx) {
            URL.revokeObjectURL(url);
            reject(new Error('Could not get 2d context'));
            return;
          }

          // First, draw the frame as background
          ctx.drawImage(frameImg, 0, 0, canvas.width, canvas.height);

          // Calculate the white content area in the frame
          // Based on the frame design: white area with some margins
          const contentAreaLeft = canvas.width * 0.20;   // 20% from left
          const contentAreaRight = canvas.width * 0.80;  // 80% to right
          const contentAreaTop = canvas.height * 0.15;   // 15% from top (below hangulo logo)
          const contentAreaBottom = canvas.height * 0.85; // 85% to bottom

          const contentWidth = contentAreaRight - contentAreaLeft;
          const contentHeight = contentAreaBottom - contentAreaTop;

          // Calculate SVG dimensions to fit within content area while maintaining aspect ratio
          const svgAspectRatio = svgImg.width / svgImg.height;
          const contentAspectRatio = contentWidth / contentHeight;

          let drawWidth: number;
          let drawHeight: number;

          if (svgAspectRatio > contentAspectRatio) {
            // SVG is wider, fit to width
            drawWidth = contentWidth * 0.8; // Use 80% of available width for padding
            drawHeight = drawWidth / svgAspectRatio;
          } else {
            // SVG is taller, fit to height
            drawHeight = contentHeight * 0.8; // Use 80% of available height for padding
            drawWidth = drawHeight * svgAspectRatio;
          }

          // Center the SVG within the content area
          const x = contentAreaLeft + (contentWidth - drawWidth) / 2;
          const y = contentAreaTop + (contentHeight - drawHeight) / 2;

          // Draw the SVG on top of the frame
          ctx.drawImage(svgImg, x, y, drawWidth, drawHeight);

          const pngDataUrl = canvas.toDataURL("image/png");
          URL.revokeObjectURL(url);
          resolve(pngDataUrl);
        };

        svgImg.onerror = () => {
          URL.revokeObjectURL(url);
          reject(new Error('Failed to load SVG image'));
        };

        svgImg.src = url;
      };

      frameImg.onerror = () => {
        reject(new Error('Failed to load frame image'));
      };

      // Load the frame image from public folder
      frameImg.src = '/hangulo-frame.png';
    });
  }

  /**
   * Upload image to Firebase Storage and get download page URL
   */
  public async uploadToFirebase(): Promise<{ fileId: string; downloadPageURL: string; directURL: string }> {
    if (!paper.project) throw new Error("Project not found");

    const firebaseService = FirebaseService.getInstance();

    // Initialize Firebase if not already done (async)
    await firebaseService.ensureInitialized();

    // Check if Firebase is configured
    if (!firebaseService.isConfigured()) {
      throw new Error('Firebase is not configured. Please set up your Firebase credentials in .env file.');
    }

    // Get filtered SVG and convert to PNG
    const svgContent = this.getFilteredSVGContent();
    const pngDataUrl = await this.convertSvgToPng(svgContent);

    // Upload to Firebase Storage (this will auto-cleanup old files)
    const { fileId, downloadURL } = await firebaseService.uploadImage(pngDataUrl);

    // Generate download page URL
    const baseURL = window.location.origin;
    const downloadPageURL = `${baseURL}/download?id=${fileId}`;

    return {
      fileId,
      downloadPageURL,
      directURL: downloadURL
    };
  }

  /**
   * Check if export dev mode is enabled
   */
  public isExportDevMode(): boolean {
    return import.meta.env.VITE_EXPORT_DEV === 'true';
  }

  /**
   * Check if Firebase is properly configured
   */
  public isFirebaseConfigured(): boolean {
    try {
      const firebaseService = FirebaseService.getInstance();
      return firebaseService.isConfigured();
    } catch (error) {
      return false;
    }
  }
}

export default Exporter;

