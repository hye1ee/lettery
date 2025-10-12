import { BaseAgentTool } from "./baseAgentTool";

/**
 * Guided Edit Agent Tool
 */
class GuidedEdit extends BaseAgentTool {
  private static instance: GuidedEdit;

  public readonly id: string = 'guided-edit';
  public readonly name: string = 'Guided Edit';
  public readonly description: string = 'Edit the selected jamo based on your description';
  public readonly icon: string = '/command.svg';
  public readonly isEnabled: boolean = true;

  private userInput: string = '';

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
    this.userInput = '';
    super.deactivate();
  }

  protected async runWorkflow(): Promise<void> {
    // Step 1: Get user input
    this.currentStep = 1;
    this.updateDisplay(
      'Describe Your Edit',
      `
        <p>Tell me how you'd like to modify the selected jamo:</p>
        <div style="margin: 12px 0;">
          <textarea 
            id="guided-edit-input" 
            placeholder="e.g., Make the stroke thicker, round the corners, adjust the angle..."
            style="width: 100%; min-height: 80px; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-family: inherit; resize: vertical;"
          ></textarea>
        </div>
        <p style="font-size: 0.85em; color: #666; margin: 8px 0;">
          💡 Tip: Be specific about what you want to change
        </p>
      `,
      'Analyze Request'
    );

    // Focus on the input
    setTimeout(() => {
      const input = this.contentElement.querySelector('#guided-edit-input') as HTMLTextAreaElement;
      input?.focus();
    }, 100);

    await this.waitForConfirmation();

    // Capture user input
    const input = this.contentElement.querySelector('#guided-edit-input') as HTMLTextAreaElement;
    this.userInput = input?.value || 'Make the stroke thicker and round the corners';

    // Step 2: Understanding request (with API call)
    this.currentStep = 2;
    this.showLoadingState('Understanding Your Request', 'Looks Good');
    await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate execution time
    this.updateDisplay(
      'Understanding Your Request',
      `
        <p><strong>Your request:</strong></p>
        <div style="background: #f5f5f5; padding: 8px; border-radius: 4px; margin: 8px 0; font-style: italic;">
          "${this.userInput}"
        </div>
        <p style="margin-top: 12px;"><strong>Interpretation:</strong></p>
        <ul style="margin: 8px 0; padding-left: 20px;">
          <li>Increase stroke width by 20%</li>
          <li>Apply corner rounding (radius: 2px)</li>
          <li>Preserve overall shape structure</li>
        </ul>
        <p style="margin-top: 12px; font-size: 0.9em; color: #666;">
          These changes will be applied to the selected jamo paths.
        </p>
      `,
      'Looks Good'
    );
    await this.waitForConfirmation();

    // Step 3: Applying changes
    this.currentStep = 3;
    this.updateDisplay(
      'Applying Changes',
      `
        <p><strong>Progress:</strong></p>
        <div style="margin: 12px 0;">
          <div style="background: #e0e0e0; height: 8px; border-radius: 4px; overflow: hidden;">
            <div style="background: #2196f3; height: 100%; width: 75%; transition: width 0.5s;"></div>
          </div>
          <p style="margin: 8px 0; font-size: 0.9em; color: #666;">Applying transformations...</p>
        </div>
        <div style="background: #f5f5f5; padding: 8px; border-radius: 4px; font-family: monospace; font-size: 0.85em;">
          <p style="margin: 2px 0;">✓ Analyzing path structure</p>
          <p style="margin: 2px 0;">✓ Adjusting stroke width</p>
          <p style="margin: 2px 0;">⟳ Applying corner rounding...</p>
        </div>
      `,
      'Continue'
    );
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate execution time
    await this.waitForConfirmation();

    // Step 4: Complete
    this.currentStep = 4;
    this.updateDisplay(
      'Edit Complete',
      `
        <p><strong>Success!</strong></p>
        <div style="background: #e3f2fd; padding: 12px; border-radius: 4px; border-left: 3px solid #2196f3; margin: 12px 0;">
          <p style="margin: 0;">Your jamo has been edited according to your description.</p>
        </div>
        <p><strong>Changes Applied:</strong></p>
        <ul style="margin: 8px 0; padding-left: 20px;">
          <li>Stroke width increased to 1.8px</li>
          <li>Corners rounded with 2px radius</li>
          <li>3 paths modified</li>
        </ul>
        <p style="margin-top: 12px; font-size: 0.9em; color: #666;">
          Changes saved to history. Use Cmd+Z to undo if needed.
        </p>
      `,
      'Done'
    );
    await this.waitForConfirmation();

    // Workflow complete
    this.deactivate();
  }
}

export default GuidedEdit;
