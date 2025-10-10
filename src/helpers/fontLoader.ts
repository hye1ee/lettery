import opentype from 'opentype.js';
import paper from 'paper';
import { logger } from '.';
import { ungroupSVG } from '../utils/paperUtils';

/**
 * Helper for loading fonts and creating text paths using opentype.js
 */
class FontLoader {
  private static instance: FontLoader;
  private fonts: Map<string, opentype.Font> = new Map();
  private fontPaths: Map<string, string> = new Map([
    ['Noto Sans KR', '/fonts/NotoSansKR.ttf'],
    ['Noto Serif KR', '/fonts/NotoSerifKR.ttf'],
  ]);

  private constructor() { }

  public static getInstance(): FontLoader {
    if (!FontLoader.instance) {
      FontLoader.instance = new FontLoader();
    }
    return FontLoader.instance;
  }

  /**
   * Load a font by name
   */
  public async loadFont(fontName: string): Promise<opentype.Font> {
    // Check if already loaded
    if (this.fonts.has(fontName)) {
      return this.fonts.get(fontName)!;
    }

    const fontPath = this.fontPaths.get(fontName);
    if (!fontPath) {
      throw new Error(`Font not found: ${fontName}`);
    }

    try {
      logger.updateStatus(`Loading font: ${fontName}...`);
      const font = await opentype.load(fontPath);
      this.fonts.set(fontName, font);
      logger.updateStatus(`Font loaded: ${fontName}`);
      return font;
    } catch (error) {
      logger.error(`Failed to load font: ${fontName}`, error);
      throw error;
    }
  }

  /**
   * Create text path using opentype.js and convert to SVG
   */
  public async createTextPath(
    text: string,
    fontName: string,
    fontSize: number = 100
  ): Promise<string> {
    const font = await this.loadFont(fontName);

    // Create path using opentype.js
    const path = font.getPath(text, 0, fontSize, fontSize);

    // Convert opentype path to SVG path string
    const svgPath = path.toSVG(2); // 2 decimal places

    // Wrap in SVG element
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${fontSize * text.length} ${fontSize * 1.2}">
        ${svgPath}
      </svg>
    `;

    return svg;
  }

  /**
   * Create text path and import into Paper.js
   */
  public async importTextToPaper(
    text: string,
    fontName: string,
    fontSize: number = 100,
    targetLayer?: paper.Layer
  ): Promise<paper.Item> {
    const svg = await this.createTextPath(text, fontName, fontSize);

    // Create a temporary container to parse SVG
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = svg;
    const svgElement = tempDiv.querySelector('svg');

    if (!svgElement) {
      throw new Error('Failed to create SVG element');
    }

    // Import SVG into Paper.js
    const importedItem = paper.project.importSVG(svgElement);


    if (targetLayer) {
      targetLayer.addChild(importedItem);
    } else {
      paper.project.activeLayer.addChild(importedItem);
    }
    ungroupSVG(importedItem);
    // Center the item
    importedItem.position = paper.view.center;

    return importedItem;
  }

  /**
   * Get available fonts
   */
  public getAvailableFonts(): string[] {
    return Array.from(this.fontPaths.keys());
  }

  /**
   * Get font list for modal dropdown
   */
  public getFontList(): Array<{ name: string; value: string }> {
    return Array.from(this.fontPaths.keys()).map(fontName => ({
      name: fontName,
      value: fontName
    }));
  }

  /**
   * Preload commonly used fonts
   */
  public async preloadFonts(fontNames: string[]): Promise<void> {
    try {
      await Promise.all(fontNames.map(name => this.loadFont(name)));
      logger.updateStatus('Fonts preloaded successfully');
    } catch (error) {
      logger.error('Failed to preload fonts', error);
    }
  }
}

export default FontLoader;

