import { canvasService, historyService, uiService } from "../services";
import { BaseAgentTool } from "./baseAgentTool";
import { tags } from "../utils/tags";
import { generateWorkingLetters, jamoAnalysisPrompt, jamoPlanPrompt, jamoEditPrompt } from "../utils/prompt";
import { ModelProvider } from "../models";
import { propagationAnalysisTool, planTool, executionTool } from "./functionTools";
import { calculateDistanceWithScore, decomposeWord } from "../utils/hangul";

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

  private selectedHistoryIndex: number = 1; // Which previous state to compare (1, 2, or 3)
  private availableHistoryStates: number = 1; // How many previous states are available
  private selectedPropagationRange: number = 0; // Selected propagation range index
  private distanceElements: Array<{ element: string; score: number }> = []; // Similarity-scored elements

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

    // Determine how many previous states are available (minimum 1, maximum 3)
    this.availableHistoryStates = Math.min(3, layerStates.length - 1);
    this.selectedHistoryIndex = 1; // Start with the most recent previous state

    // Render initial comparison
    this.renderHistoryComparison(layerStates);

    // Set up navigation button listeners
    this.setupHistoryNavigation(layerStates);

    await this.waitForConfirmation();

    // [Step 2] Analyzing (with API call)
    this.currentStep = 2;
    this.activateStep(2);
    this.showStepLoading(2);

    // get decomposed jamo in order : ["ㅇ", "ㅏ", "ㅣ"]
    const decomposedElements = decomposeWord(workingWord);
    const distanceResults = calculateDistanceWithScore(workingJamo, decomposedElements).slice(1);

    // Transform to match our type: { element: string; score: number }
    this.distanceElements = distanceResults.map(item => ({
      element: item.char,
      score: item.score
    }));

    console.log(this.distanceElements);
    let responses = await model.generateResponses({
      input: [
        {
          role: 'user',
          content: [
            { type: "text", data: `path data and png image of jamo '${workingJamo}' before changes` },
            { type: "text", data: layerStates[this.selectedHistoryIndex].join(' ') },
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
      tools: [propagationAnalysisTool],
    });

    const summaryMessage = model.getToolMessage(responses) ?? "{}";

    const parsedMessage = JSON.parse(summaryMessage);
    const recommendedIndex = parsedMessage?.recommendedIndex ?? Math.floor(this.distanceElements.length / 2);
    this.selectedPropagationRange = recommendedIndex;

    this.renderAnalysisWithSlider(parsedMessage?.reasoning, recommendedIndex);
    this.setupPropagationRangeSlider();

    await this.waitForConfirmation();

    // [Step 3] Propagation Plan (with API call)
    this.currentStep = 3;
    this.activateStep(3);
    this.showStepLoading(3);

    // Get selected propagation targets based on slider value
    const selectedTargets = this.distanceElements
      .slice(0, this.selectedPropagationRange + 1)
      .map(e => e.element)
      .join(', ');

    responses = await model.generateResponses({
      input: [
        {
          role: 'user',
          content: [
            { type: "text", data: `path data and png image of jamo '${workingJamo}' before changes` },
            { type: "text", data: layerStates[this.selectedHistoryIndex].join(' ') },
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
      instructions: jamoPlanPrompt(workingJamo, workingLetters, summaryMessage, selectedTargets),
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

  private renderHistoryComparison(layerStates: string[][]): void {
    const currentState = layerStates[0];
    const previousState = layerStates[this.selectedHistoryIndex];

    const canGoPrev = this.selectedHistoryIndex < this.availableHistoryStates;
    const canGoNext = this.selectedHistoryIndex > 1;

    this.updateStepContent(
      1,
      `
        <div style="display: flex; flex-direction: column; gap: 12px;">
          <div style="display: flex; align-items: center; justify-content: center; gap: 4px;">
            <button 
              id="history-prev-btn" 
              class="history-nav-btn" 
              ${!canGoPrev ? 'disabled' : ''}
              style="cursor: ${canGoPrev ? 'pointer' : 'not-allowed'}; opacity: ${canGoPrev ? '1' : '0.4'};"
            >
              <img src="/undo.svg" alt="Previous" width="20" height="20" />
            </button>
            ${tags.svgComparison(currentState, previousState)}
            <button 
              id="history-next-btn" 
              class="history-nav-btn"
              ${!canGoNext ? 'disabled' : ''}
              style="cursor: ${canGoNext ? 'pointer' : 'not-allowed'}; opacity: ${canGoNext ? '1' : '0.4'};"
            >
              <img src="/redo.svg" alt="Next" width="20" height="20" />
            </button>
          </div>
          
        </div>
      `
    );
  }

  private setupHistoryNavigation(layerStates: string[][]): void {
    // Wait for DOM to update
    setTimeout(() => {
      const prevBtn = document.getElementById('history-prev-btn');
      const nextBtn = document.getElementById('history-next-btn');

      if (prevBtn) {
        prevBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          if (this.selectedHistoryIndex < this.availableHistoryStates) {
            this.selectedHistoryIndex++;
            this.renderHistoryComparison(layerStates);
            this.setupHistoryNavigation(layerStates); // Re-setup listeners
          }
        });
      }

      if (nextBtn) {
        nextBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          if (this.selectedHistoryIndex > 1) {
            this.selectedHistoryIndex--;
            this.renderHistoryComparison(layerStates);
            this.setupHistoryNavigation(layerStates); // Re-setup listeners
          }
        });
      }
    }, 50);
  }

  private renderAnalysisWithSlider(reasoning: string, recommendedIndex: number): void {
    const maxIndex = this.distanceElements.length - 1;

    this.updateStepContent(
      2,
      `
        ${tags.markdown(reasoning ? reasoning + " 아래는 제가 제안하는 전파 순서와 범위예요. 필요하면 슬라이더로 조정하세요." : "분석을 완료하지 못했습니다. 다시 시도해주세요.")}
        
        <div style="margin-top: 8px; padding: 8px;">          
          <!-- Elements display -->
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; gap: 4px;">
            ${this.distanceElements.map((item, idx) => `
              <div 
                id="element-${idx}" 
                class="propagation-element"
                style="
                  flex: 1;
                  text-align: center;
                  padding: 8px 4px;
                  border-radius: 4px;
                  background: ${idx <= recommendedIndex ? '#e3f5ff' : '#f5f5f5'};
                  border: 2px solid ${idx === recommendedIndex ? '#5eb8e5' : 'transparent'};
                  transition: all 0.3s ease;
                  font-weight: ${idx === recommendedIndex ? '700' : '400'};
                  font-size: 16px;
                "
              >
                ${item.element}
              </div>
            `).join('')}
          </div>

          <!-- Slider with recommended position marker -->
          <div style="position: relative; width: 100%; margin: 8px 0;">
            <input 
              type="range" 
              id="propagation-slider" 
              min="0" 
              max="${maxIndex}"
              value="${recommendedIndex}"
              style="width: 100%; cursor: pointer; margin-top: 4px;"
            />
            ${maxIndex > 0 ? `
              <div 
                id="recommended-marker"
                style="
                  position: absolute;
                  top: -24px;
                  left: ${(recommendedIndex / maxIndex) * 100}%;
                  transform: translateX(-50%);
                  background: #5eb8e5;
                  color: white;
                  padding: 2px 8px;
                  border-radius: 12px;
                  font-size: 0.75em;
                  font-weight: 600;
                  white-space: nowrap;
                  pointer-events: none;
                "
              >
                추천범위
              </div>
            ` : ''}
          </div>

          <!-- Labels -->
          <div style="display: flex; justify-content: space-between; margin-top: 2px; font-size: 0.85em; color: #666;">
            <span>추천도 높음</span>
            <span>추천도 낮음</span>
          </div>
        </div>
      `,
      '다음 단계'
    );
  }

  private setupPropagationRangeSlider(): void {
    setTimeout(() => {
      const slider = document.getElementById('propagation-slider') as HTMLInputElement;

      if (slider) {
        slider.addEventListener('input', (e) => {
          e.stopPropagation();
          const value = parseInt((e.target as HTMLInputElement).value);
          this.selectedPropagationRange = value;

          // Update visual feedback
          this.distanceElements.forEach((_, idx) => {
            const elemDiv = document.getElementById(`element-${idx}`);
            if (elemDiv) {
              elemDiv.style.background = idx <= value ? '#e3f5ff' : '#f5f5f5';
              elemDiv.style.border = idx === value ? '2px solid #5eb8e5' : '2px solid transparent';
              elemDiv.style.fontWeight = idx === value ? '700' : '400';
            }
          });

          // // Update score info
          // if (scoreInfo) {
          //   const selectedElements = this.distanceElements.slice(0, value + 1).map(e => e.element).join(', ');
          //   scoreInfo.innerHTML = `<strong>선택된 범위:</strong> ${selectedElements}`;
          // }
        });
      }
    }, 50);
  }
}

export default SmartPropagationTool;

