import { canvasService, historyService, uiService } from "../services";
import { BaseAgentTool } from "./baseAgentTool";
import { tags } from "../utils/tags";
import { generateWorkingLetters, jamoAnalysisPrompt, jamoPlanPrompt, jamoEditPrompt } from "../utils/prompt";
import { ModelProvider } from "../models";
import { analysisTool, planTool, executionTool } from "./functionTools";

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
    // [Step 0] Generate working letters description and model
    const { workingWord, workingSyllable, workingJamo } = uiService.getWorkingLetters();
    const workingLetters = generateWorkingLetters(workingWord, workingSyllable, workingJamo);

    const model = ModelProvider.getModel();

    // [Step 1] Show before/after changes
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

    // [Step 2] Analyzing (with API call)
    this.currentStep = 2;
    this.showLoadingState('Analyzing Changes', 'Proceed with Plan');

    let responses = await model.generateResponses({
      input: [
        {
          role: 'user',
          content: [
            { type: "text", data: `path data and png image of jamo '${workingJamo}' before changes` },
            { type: "text", data: layerStates[1].join(' ') },
            // { type: "image", data: '' }
          ],
        },
        {
          role: 'user',
          content: [
            { type: "text", data: `path data and png image of jamo '${workingJamo}' after changes` },
            { type: "text", data: layerStates[0].join(' ') },
            // { type: "image", data: '' }
          ],
        },
      ],
      instructions: jamoAnalysisPrompt(workingJamo, workingLetters),
      tools: [analysisTool],
    });

    const summaryMessage = model.getToolMessage(responses) ?? "{}";

    this.updateDisplay(
      'Analyzing Changes',
      `
        <p><strong>Change Analysis Complete:</strong></p>
        ${tags.markdown(JSON.parse(summaryMessage)?.summary ?? "Analysis incomplete. Please try again.")}
      `,
      'Confirm Analysis'
    );
    await this.waitForConfirmation();

    // [Step 3] Propagation Plan (with API call)
    this.currentStep = 3;
    this.showLoadingState('Propagation Plan', 'Execute Plan');

    responses = await model.generateResponses({
      input: [
        {
          role: 'user',
          content: [
            { type: "text", data: `path data and png image of jamo '${workingJamo}' before changes` },
            { type: "text", data: layerStates[1].join(' ') },
            // { type: "image", data: '' }
          ],
        },
        {
          role: 'user',
          content: [
            { type: "text", data: `path data and png image of jamo '${workingJamo}' after changes` },
            { type: "text", data: layerStates[0].join(' ') },
            // { type: "image", data: '' }
          ],
        },
      ],
      instructions: jamoPlanPrompt(workingJamo, workingLetters, summaryMessage, 'medium'),
      tools: [planTool],
    });

    let planMessages: Array<{ jamo: string, syllable: string, plan: string, reason: string }> =
      model.getToolMessages(responses).map((msg) => JSON.parse(msg));
    planMessages = planMessages.filter((item) => item.plan);

    this.updateDisplay(
      'Propagation Plan',
      `
        <p><strong>Proposed Actions:</strong></p>
        ${tags.planMessages(planMessages)}
        <p style="color: #666; font-size: 0.9em;">You can review and adjust after execution.</p>
      `,
      'Execute Plan'
    );
    await this.waitForConfirmation();

    // [Step 4] Executing
    this.currentStep = 4;
    this.showLoadingState('Executing Changes', 'Continue');

    // Create API calls for each plan message
    const executionPromises = planMessages.map(async (plan) => {
      const response = await model.generateResponses({
        input: [
          {
            role: 'user',
            content: [
              { type: "text", data: `path data of reference jamo '${workingJamo}' after changes` },
              { type: "text", data: layerStates[0].join(' ') },
              { type: "text", data: `path data of target jamo '${plan.jamo}' before changes` },
              { type: "text", data: canvasService.getLayerData(plan.jamo, plan.syllable).join(' ') },
            ],
          },
        ],
        instructions: jamoEditPrompt(workingJamo, workingLetters, plan.jamo, plan.plan),
        tools: [executionTool],
      });

      return JSON.parse(model.getToolMessage(response) ?? "{}");
    });

    // Wait for all executions to complete
    const executionResults = await Promise.all(executionPromises);
    this.updateDisplay(
      'Execution Complete',
      `
        <p><strong>Results:</strong></p>
        <div style="margin: 12px 0;">
          <div style="background: #e8f5e9; padding: 12px; border-radius: 4px; border-left: 3px solid #4caf50; margin-bottom: 8px;">
            <p style="margin: 0;"><strong>✓ Successfully propagated to ${executionResults.length} jamos</strong></p>
          </div>
        </div>
        ${tags.executionResults(executionResults)}
        <p style="margin-top: 12px; color: #666; font-size: 0.9em;">All changes have been saved to history. You can undo if needed.</p>
      `,
      'Import'
    );
    await this.waitForConfirmation();

    // [Step 5] Import 
    this.currentStep = 5;

    await new Promise((res) => {
      setTimeout(res, 5000);
      planMessages.forEach((plan, idx) => {
        canvasService.importLayerData(plan.jamo, plan.syllable, executionResults[idx].path);
      })
    });

    // import data path

    this.updateDisplay(
      'Executing Changes',
      `
        <p><strong>Progress:</strong></p>
        <div style="margin: 12px 0;">
          <div style="background: #e0e0e0; height: 8px; border-radius: 4px; overflow: hidden;">
            <div style="background: #4caf50; height: 100%; width: 100%; transition: width 0.3s;"></div>
          </div>
          <p style="margin: 8px 0; font-size: 0.9em; color: #666;">Processing complete...</p>
        </div>
        <div style="background: #f5f5f5; padding: 8px; border-radius: 4px; margin: 8px 0; font-family: monospace; font-size: 0.85em;">
          ${executionResults.map(result =>
        `<p style="margin: 2px 0;">✓ ${result.jamo}: Complete</p>`
      ).join('')}
        </div>
      `,
      'Done'
    );
    await this.waitForConfirmation();

    // Workflow complete
    this.deactivate();
  }
}

export default SmartPropagationTool;

