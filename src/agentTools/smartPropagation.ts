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
  public readonly characterImage: string = '/hangulo_agent1.png';
  public readonly labelImage: string = '/label1.png';
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

    // Initialize all steps at once
    this.initializeSteps([
      {
        title: '스타일 변화 확인하기',
        description: '다른 자모에 퍼트릴 스타일 변화 범위를 지정하세요',
        buttonText: '다음 단계'
      },
      {
        title: '퍼트릴 범위 지정하기',
        description: '어떤 자모에 스타일을 퍼트릴까요?',
        buttonText: '다음 단계'
      },
      {
        title: '퍼트리기 계획하기',
        description: '에이전트의 계획을 확인해주세요',
        buttonText: '다음 단계'
      },
      {
        title: '퍼트리기 적용하기',
        description: '새로운 자모를 적용하고 있습니다',
        buttonText: '완료'
      }
    ]);

    // [Step 1] Show before/after changes
    this.currentStep = 1;
    this.activateStep(1);
    const layerStates = historyService.getHistoryData();

    this.updateStepContent(
      1,
      `
        ${tags.svgComparison(layerStates[0], layerStates[1])}
      `
    );
    await this.waitForConfirmation();

    // [Step 2] Analyzing (with API call)
    this.currentStep = 2;
    this.activateStep(2);
    this.showStepLoading(2);

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

    this.updateStepContent(
      2,
      `
        ${tags.markdown(JSON.parse(summaryMessage)?.summary ?? "분석을 완료하지 못했습니다. 다시 시도해주세요.")}
      `,
      '다음 단계'
    );
    await this.waitForConfirmation();

    // [Step 3] Propagation Plan (with API call)
    this.currentStep = 3;
    this.activateStep(3);
    this.showStepLoading(3);

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

    this.updateStepContent(
      3,
      `
        ${tags.planMessages(planMessages)}
      `,
      '다음 단계'
    );
    await this.waitForConfirmation();

    // [Step 4] Executing
    this.currentStep = 4;
    this.activateStep(4);
    this.showStepLoading(4);

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

    // Import the results immediately
    await new Promise((res) => {
      setTimeout(res, 500);
      planMessages.forEach((plan, idx) => {
        canvasService.importLayerData(plan.jamo, plan.syllable, executionResults[idx].path);
      })
      res(undefined);
    });

    this.updateStepContent(
      4,
      `
        <div style="margin: 12px 0;">
          <div style="background: #e8f5e9; padding: 12px; border-radius: 4px; border-left: 3px solid #4caf50; margin-bottom: 8px;">
            <p style="margin: 0;"><strong>✓ ${executionResults.length}개의 자모에 성공적으로 적용되었습니다</strong></p>
          </div>
        </div>
        ${tags.executionResults(executionResults)}
        <div style="margin-top: 12px; padding: 8px; background: #f8f9fa; border-radius: 4px;">
          <p style="margin: 0; font-size: 0.85em; color: #666;">모든 변경사항이 캔버스에 적용되었습니다.</p>
        </div>
      `,
      '완료'
    );
    await this.waitForConfirmation();

    // Workflow complete
    this.deactivate();
  }
}

export default SmartPropagationTool;

