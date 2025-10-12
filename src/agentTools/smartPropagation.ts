import { historyService } from "../services";
import { BaseAgentTool } from "./baseAgentTool";
import { tags } from "../utils/tags";

/**
 * Smart Propagation Agent Tool
 */
class SmartPropagationTool extends BaseAgentTool {
  private static instance: SmartPropagationTool;

  public readonly id: string = 'smart-propagation';
  public readonly name: string = 'Smart Propagation';
  public readonly description: string = 'Automatically apply your edits across related jamos';
  public readonly icon: string = '/propagate.svg';
  public readonly isEnabled: boolean = true;

  private constructor() {
    super();
  }

  public static getInstance(): SmartPropagationTool {
    if (!SmartPropagationTool.instance) {
      SmartPropagationTool.instance = new SmartPropagationTool();
    }
    return SmartPropagationTool.instance;
  }

  protected async runWorkflow(): Promise<void> {
    // Step 1: Show before/after changes
    this.currentStep = 1;
    const layerStates = historyService.getHistoryData();

    this.updateDisplay(
      'Review Your Changes',
      `
        <p style="margin-bottom: 12px;">You've made changes to this jamo. Review the before and after:</p>
        ${tags.svgComparison(layerStates[0], layerStates[1])}
        <p style="margin-top: 16px; padding: 12px; background: #fff3cd; border-left: 3px solid #ffc107; border-radius: 4px; font-size: 0.9em;">
          <strong>Do you want to propagate these changes to similar jamos in your font?</strong>
        </p>
      `,
      'Yes, Proceed'
    );
    await this.waitForConfirmation();

    // Step 2: Analyzing (with API call)
    this.currentStep = 2;
    this.showLoadingState('Analyzing Changes', 'Proceed with Plan');
    await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate execution time

    this.updateDisplay(
      'Analyzing Changes',
      `
        <p><strong>Change Analysis Complete:</strong></p>
        <div style="background: #f0f0f0; padding: 8px; border-radius: 4px; margin: 8px 0;">
          <p style="margin: 4px 0;"><strong>Type:</strong> Geometric transformation</p>
          <p style="margin: 4px 0;"><strong>Affected Areas:</strong> Top stroke</p>
          <p style="margin: 4px 0;"><strong>Complexity:</strong> Medium</p>
        </div>
        <p><strong>Similar Jamos Found:</strong></p>
        <ul style="margin: 8px 0; padding-left: 20px;">
          <li>ㄴ (70% similarity)</li>
          <li>ㄷ (65% similarity)</li>
          <li>ㄹ (60% similarity)</li>
        </ul>
      `,
      'Proceed with Plan'
    );
    await this.waitForConfirmation();

    // Step 3: Propagation Plan (with API call)
    this.currentStep = 3;
    this.showLoadingState('Propagation Plan', 'Execute Plan');
    await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate execution time

    this.updateDisplay(
      'Propagation Plan',
      `
        <p><strong>Proposed Actions:</strong></p>
        <div style="display: flex; flex-direction: column; gap: 8px; margin: 12px 0;">
          <div style="background: #e8f5e9; padding: 8px; border-radius: 4px; border-left: 3px solid #4caf50;">
            <p style="margin: 0;"><strong>ㄴ:</strong> Apply full transformation (70% match)</p>
          </div>
          <div style="background: #fff3e0; padding: 8px; border-radius: 4px; border-left: 3px solid #ff9800;">
            <p style="margin: 0;"><strong>ㄷ:</strong> Apply with adjustments (65% match)</p>
          </div>
          <div style="background: #fff3e0; padding: 8px; border-radius: 4px; border-left: 3px solid #ff9800;">
            <p style="margin: 0;"><strong>ㄹ:</strong> Apply with adjustments (60% match)</p>
          </div>
        </div>
        <p style="color: #666; font-size: 0.9em;">You can review and adjust after execution.</p>
      `,
      'Execute Plan'
    );
    await this.waitForConfirmation();

    // Step 4: Executing
    this.currentStep = 4;
    this.updateDisplay(
      'Executing Changes',
      `
        <p><strong>Progress:</strong></p>
        <div style="margin: 12px 0;">
          <div style="background: #e0e0e0; height: 8px; border-radius: 4px; overflow: hidden;">
            <div style="background: #4caf50; height: 100%; width: 66%; transition: width 0.3s;"></div>
          </div>
          <p style="margin: 8px 0; font-size: 0.9em; color: #666;">Processing jamo 2 of 3...</p>
        </div>
        <div style="background: #f5f5f5; padding: 8px; border-radius: 4px; margin: 8px 0; font-family: monospace; font-size: 0.85em;">
          <p style="margin: 2px 0;">✓ ㄴ: Transformation applied</p>
          <p style="margin: 2px 0;">⟳ ㄷ: Applying changes...</p>
          <p style="margin: 2px 0; color: #999;">○ ㄹ: Pending</p>
        </div>
      `,
      'Continue'
    );
    await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate execution time
    await this.waitForConfirmation();

    // Step 5: Complete
    this.currentStep = 5;
    this.updateDisplay(
      'Execution Complete',
      `
        <p><strong>Results:</strong></p>
        <div style="margin: 12px 0;">
          <div style="background: #e8f5e9; padding: 12px; border-radius: 4px; border-left: 3px solid #4caf50; margin-bottom: 8px;">
            <p style="margin: 0;"><strong>✓ Successfully propagated to 3 jamos</strong></p>
          </div>
        </div>
        <div style="background: #f5f5f5; padding: 8px; border-radius: 4px; margin: 8px 0; font-family: monospace; font-size: 0.85em;">
          <p style="margin: 2px 0;">✓ ㄴ: Complete</p>
          <p style="margin: 2px 0;">✓ ㄷ: Complete</p>
          <p style="margin: 2px 0;">✓ ㄹ: Complete</p>
        </div>
        <p style="margin-top: 12px; color: #666; font-size: 0.9em;">All changes have been saved to history. You can undo if needed.</p>
      `,
      'Done'
    );
    await this.waitForConfirmation();

    // Workflow complete
    this.deactivate();
  }
}

export default SmartPropagationTool;
