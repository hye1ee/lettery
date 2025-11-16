import { BaseAgentTool } from "./baseAgentTool";
import { canvasService, uiService } from "../services";
import paper from "paper";
import { ModelProvider } from "../models";
import { editTool } from "./functionTools";
import { tags } from "../utils/tags";
import { jamoEditExample, jamoGuideEditPrompt } from "../utils/prompt";

/**
 * Guided Edit Agent Tool
 */
class GuidedEdit extends BaseAgentTool {
  private static instance: GuidedEdit;

  public readonly id: string = 'guided-edit';
  public readonly name: string = 'Guided Edit';
  public readonly description: string = 'Edit the selected jamo based on your text description';
  public readonly icon: string = '/command.svg';
  public readonly isEnabled: boolean = true;

  private constructor() {
    super();
  }

  public static getInstance(): GuidedEdit {
    if (!GuidedEdit.instance) {
      GuidedEdit.instance = new GuidedEdit();
    }
    return GuidedEdit.instance;
  }

  public deactivate(): void {
    super.deactivate();
  }

  protected async runWorkflow(): Promise<void> {
    // [Step 0] Initialize model
    const model = ModelProvider.getModel();
    const { workingSyllable, workingJamo } = uiService.getWorkingLetters();

    const activeLayer = paper.project.activeLayer;
    if (!activeLayer) throw new Error('No active layer found');

    const pathData: string[] = activeLayer.children.filter(
      item => (item.name) && !item.name.includes('ShapeSketch'))
      .map(item => (item as paper.PathItem).pathData) || [];

    const guideData: string[] = activeLayer.children.filter(
      item => (item.name) && item.name.includes('ShapeSketch'))
      .map(item => (item as paper.PathItem).pathData) || [];

    if (guideData.length === 0) {
      this.updateDisplay(
        'Draw Guide Sketch First',
        `
          <p style="color: #666; margin: 8px 0;">
            Please draw a guide sketch on the active layer first.
          </p>
          <p style="font-size: 0.85em; color: #666; margin: 8px 0;">
            💡 Tip: Draw with a pencil tool and name it "GuidePath" to show where you want changes
          </p>
        `,
        'Done'
      );
      await this.waitForConfirmation();
      this.deactivate();
      return;
    }

    // [Step 1] Show original and guide sketch
    this.currentStep = 1;

    const svgString = tags.svgMixedPreview(pathData, guideData);
    this.updateDisplay(
      'Review Your Guide Sketch',
      `
        <p style="margin-bottom: 12px;">Review your guide sketch overlaid on the current jamo:</p>
        <div class="svg-preview-item" style="border: 1px solid #ddd; border-radius: 4px; padding: 8px; background: white;">
          ${svgString}
        </div>
        <p style="margin-top: 16px; padding: 12px; background: #e3f2fd; border-left: 3px solid #2196f3; border-radius: 4px; font-size: 0.9em;">
          <strong>Black paths:</strong> Current jamo<br/>
          <strong>Blue sketch:</strong> Your guide modifications
        </p>
      `,
      'Continue'
    );
    await this.waitForConfirmation();

    // [Step 2] Get optional description
    this.currentStep = 2;
    this.updateDisplay(
      'Add Instructions (Optional)',
      `
        <p style="font-size: 0.9em; color: #666; margin: 8px 0;">
          Optionally describe how to interpret your guide sketch:
        </p>
        <div style="margin: 12px 0;">
          <textarea 
            id="guided-edit-input" 
            placeholder="e.g., Keep it angular, make it softer, add more weight to the strokes..."
            style="width: 100%; min-height: 80px; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-family: inherit; resize: vertical;"
          ></textarea>
        </div>
        <p style="font-size: 0.85em; color: #666; margin: 8px 0;">
          💡 Your guide sketch is the primary guide. Text helps clarify intent.
        </p>
      `,
      'Generate'
    );

    // Wait for DOM to update and focus textarea
    await new Promise(resolve => setTimeout(resolve, 50));
    const inputElement = this.contentElement.querySelector('#guided-edit-input') as HTMLTextAreaElement;
    if (inputElement) {
      // Stop propagation for all events on textarea
      inputElement.addEventListener('click', (e) => {
        e.stopPropagation();
      });

      inputElement.addEventListener('keydown', (e) => {
        e.stopPropagation();
      });

      inputElement.addEventListener('keyup', (e) => {
        e.stopPropagation();
      });

      inputElement.focus();
    }

    await this.waitForConfirmation();

    // Capture user input
    const input = this.contentElement.querySelector('#guided-edit-input') as HTMLTextAreaElement;
    const userInstruction = input?.value || '';

    // capture the svg string as base64
    const svgBase64 = await this.formatSvgToBase64(svgString);

    // [Step 3] Execute
    this.currentStep = 3;
    this.showLoadingState('Generating New Jamo', 'Continue');

    const instructionText: string | null = userInstruction.length > 0 ? userInstruction : null;


    const response = await model.generateResponses({
      input: [
        jamoEditExample,
        {
          role: 'user',
          content: [
            { type: "text", data: `Current jamo path data: ${pathData.join(' ')}` },
            { type: "text", data: `Guide path data: ${guideData.join(' ')}` },
            { type: "image", data: svgBase64 },
          ],
        },
      ],
      instructions: jamoGuideEditPrompt(workingJamo, instructionText),
      tools: [editTool],
    });

    const result = JSON.parse(model.getToolMessage(response) ?? "{}");
    const generatedPath = result.path;

    // Parse generated path into array (may contain multiple paths or single path)
    const generatedPaths = generatedPath ? [generatedPath] : [];

    this.updateDisplay(
      'Jamo Generated',
      `
        <div style="background: #e8f5e9; padding: 12px; border-radius: 4px; border-left: 3px solid #4caf50; margin: 12px 0;">
          <p style="margin: 0;"><strong>✓ Modified jamo generated based on your guide sketch</strong></p>
        </div>
        ${generatedPaths.length > 0 ? `
          <div style="margin: 16px 0;">
            <p style="text-align: center; font-size: 0.85em; color: #666; margin-bottom: 8px; font-weight: 600;">Preview</p>
            <div class="svg-preview-item" style="border: 1px solid #ddd; border-radius: 4px; padding: 8px; background: white;">
              ${tags.svgPreview(generatedPaths, true)}
            </div>
          </div>
        ` : ''}
        <p style="color: #666; font-size: 0.9em; margin: 8px 0;">
          ${result.summary || 'The jamo has been modified according to your guide sketch and instructions.'}
        </p>
      `,
      'Import to Canvas'
    );
    await this.waitForConfirmation();

    // [Step 4] Import
    this.currentStep = 4;

    canvasService.importLayerData(workingJamo, workingSyllable, generatedPath);

    this.updateDisplay(
      'Import Complete',
      `
        <div style="background: #e3f2fd; padding: 12px; border-radius: 4px; border-left: 3px solid #2196f3; margin: 12px 0;">
          <p style="margin: 0;"><strong>✓ Modified jamo imported to canvas</strong></p>
        </div>
        <p style="margin-top: 12px; color: #666; font-size: 0.9em;">
          The new jamo has replaced the original on the active layer. You can undo if needed.
        </p>
      `,
      'Done'
    );
    await this.waitForConfirmation();

    // Workflow complete
    this.deactivate();
  }

  private async formatSvgToBase64(svgString: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const blob = new Blob([svgString], { type: "image/svg+xml" });
      const url = URL.createObjectURL(blob);
      const img = new Image();

      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          URL.revokeObjectURL(url);
          reject(new Error('Could not get 2d context'));
          return;
        }

        ctx.drawImage(img, 0, 0);
        const pngDataUrl = canvas.toDataURL("image/png");
        URL.revokeObjectURL(url);
        resolve(pngDataUrl);
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load SVG image'));
      };

      img.src = url;
    });
  }


}

export default GuidedEdit;
