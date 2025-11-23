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

  // Execution context for re-execution
  private executionContext: {
    planMessages: Array<{ jamo: string; syllable: string; plan: string; reason: string }>;
    layerStates: string[][];
    workingJamo: string;
    workingLetters: string;
    executionResults: Array<{ jamo: string; path: string | string[]; summary: string; syllable: string }>;
  } | null = null;

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
      .slice(0, this.selectedPropagationRange + 1);

    const selectedAnalysis = {
      geometric_analysis: parsedMessage?.geometric_analysis,
      semantic_analysis: parsedMessage?.semantic_analysis,
    }

    let planMessages: Array<{ jamo: string, syllable: string, plan: string, plan_summary: string, reason: string }> = [];
    for (const target of selectedTargets) {
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
        instructions: jamoPlanPrompt(workingJamo, workingLetters, JSON.stringify(selectedAnalysis), JSON.stringify(target)),
        tools: [planTool],
      });
      const messages = model.getToolMessages(responses);
      if (messages[0]) planMessages.push(JSON.parse(messages[0]));
    }

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

    // use anthropic model for execution
    const anthropicModel = ModelProvider.getModel("anthropic");

    // Create API calls for each plan message
    const executionPromises = planMessages.map(async (plan) => {
      const response = await anthropicModel.generateResponses({
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

      return JSON.parse(anthropicModel.getToolMessage(response) ?? "{}");
    });

    // Wait for all executions to complete
    const executionResults = await Promise.all(executionPromises);

    // Add syllable info to execution results
    const enrichedResults = executionResults.map((result, idx) => ({
      ...result,
      syllable: planMessages[idx].syllable,
    }));

    // Store execution context for refresh functionality
    this.executionContext = {
      planMessages,
      layerStates,
      workingJamo,
      workingLetters,
      executionResults: enrichedResults,
    };

    // Don't import automatically - wait for user confirmation
    this.updateStepContent(
      4,
      `
        ${tags.executionResults(enrichedResults)}
      `,
      '선택 항목 적용'
    );

    // Set up refresh button listeners
    this.setupRefreshListeners();

    await this.waitForConfirmation();

    // Import only selected results after confirmation
    await this.importSelectedResults();

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
        <div class="history-comparison-container">
          <div class="history-nav-container">
            <button 
              id="history-prev-btn" 
              class="history-nav-btn" 
              ${!canGoPrev ? 'disabled' : ''}
            >
              <img src="/undo.svg" alt="Previous" width="20" height="20" />
            </button>
            ${tags.svgComparison(currentState, previousState)}
            <button 
              id="history-next-btn" 
              class="history-nav-btn"
              ${!canGoNext ? 'disabled' : ''}
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
        ${tags.markdown(reasoning ?? "분석을 완료하지 못했습니다. 다시 시도해주세요.")}
        
        <div class="propagation-analysis-container">
          <!-- Elements display -->
          <div class="propagation-elements-grid">
            ${this.distanceElements.map((item, idx) => `
              <div 
                id="element-${idx}" 
                class="propagation-element ${idx <= recommendedIndex ? 'active' : ''} ${idx === recommendedIndex ? 'recommended' : ''}"
              >
                ${item.element}
              </div>
            `).join('')}
          </div>

          <!-- Slider with recommended position marker -->
          <div class="propagation-slider-container">
            <input 
              type="range" 
              id="propagation-slider" 
              class="propagation-slider"
              min="0" 
              max="${maxIndex}"
              value="${recommendedIndex}"
              style="width: ${((maxIndex - 0.5) / maxIndex) * 100}%;"
            />
          </div>

          <!-- Labels -->
          <div class="propagation-labels">
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
              elemDiv.style.background = idx <= value ? '#e6f7ff' : '#f5f5f5';
              elemDiv.style.borderRight = idx === value ? '2px solid #a5e0ff' : '2px solid transparent';
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

  private setupRefreshListeners(): void {
    setTimeout(() => {
      // Refresh button listeners
      const refreshButtons = document.querySelectorAll('.execution-refresh-btn');
      refreshButtons.forEach((button) => {
        button.addEventListener('click', async (e) => {
          e.stopPropagation();
          const target = e.currentTarget as HTMLButtonElement;
          const index = parseInt(target.dataset.index || '0');

          // Disable button and show loading state
          target.disabled = true;
          target.style.opacity = '0.5';

          try {
            await this.reExecuteJamo(index);
          } finally {
            // Re-enable button
            target.disabled = false;
            target.style.opacity = '1';
          }
        });
      });

      // Preview container click listeners (to toggle selection)
      const previewContainers = document.querySelectorAll('.execution-preview-container');
      previewContainers.forEach((container) => {
        const htmlContainer = container as HTMLElement;
        if (htmlContainer.classList.contains('has-cursor')) {
          htmlContainer.addEventListener('click', (e) => {
            // Don't toggle if clicking the refresh button
            if ((e.target as HTMLElement).closest('.execution-refresh-btn')) {
              return;
            }

            // Toggle selected class
            htmlContainer.classList.toggle('selected');
            this.updateSelectionDescription();
          });
        }
      });

      // Initial description update
      this.updateSelectionDescription();
    }, 50);
  }

  private updateSelectionDescription(): void {
    if (!this.executionContext) return;

    const { executionResults } = this.executionContext;
    const previewContainers = document.querySelectorAll('.execution-preview-container') as NodeListOf<HTMLElement>;

    const selectedJamos: string[] = [];
    previewContainers.forEach((container, idx) => {
      if (container.classList.contains('selected') && !container.classList.contains('loading')) {
        selectedJamos.push(executionResults[idx].jamo);
      }
    });

    const descriptionElement = document.querySelector('.execution-selection-description');
    if (descriptionElement) {
      if (selectedJamos.length === 0) {
        descriptionElement.textContent = '선택된 자모가 없어요';
      } else {
        descriptionElement.textContent = `${selectedJamos.join(', ')} ${selectedJamos.length}개의 자모가 선택되었어요`;
      }
    }
  }

  private async reExecuteJamo(index: number): Promise<void> {
    if (!this.executionContext) {
      console.error('No execution context available');
      return;
    }

    const { planMessages, layerStates, workingJamo, workingLetters, executionResults } = this.executionContext;
    const plan = planMessages[index];

    if (!plan) {
      console.error('Plan not found for index:', index);
      return;
    }

    console.log(`Re-executing jamo: ${plan.jamo}`);

    // Show spinner by setting path to empty (only affects preview canvas, not working canvas)
    executionResults[index] = {
      jamo: plan.jamo,
      path: '',
      summary: '',
      syllable: plan.syllable,
    };

    // Update display to show loading state
    this.updateStepContent(
      4,
      `
        ${tags.executionResults(executionResults)}
      `,
      '선택 항목 적용'
    );
    this.setupRefreshListeners();

    // Use anthropic model for execution
    const anthropicModel = ModelProvider.getModel("anthropic");

    // Execute API call for this specific jamo
    const response = await anthropicModel.generateResponses({
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

    const newResult = JSON.parse(anthropicModel.getToolMessage(response) ?? "{}");

    // Update the execution results array
    executionResults[index] = {
      ...newResult,
      syllable: plan.syllable,
    };

    // Update the display with new result
    this.updateStepContent(
      4,
      `
        ${tags.executionResults(executionResults)}
      `,
      '선택 항목 적용'
    );

    // Re-setup listeners since we updated the DOM
    this.setupRefreshListeners();

    console.log(`Successfully re-executed jamo: ${plan.jamo}`);
  }

  private async importSelectedResults(): Promise<void> {
    if (!this.executionContext) {
      console.error('No execution context available');
      return;
    }

    const { planMessages, executionResults } = this.executionContext;

    // Get all preview containers
    const previewContainers = document.querySelectorAll('.execution-preview-container') as NodeListOf<HTMLElement>;

    // Import only selected results
    await new Promise((res) => {
      setTimeout(res, 500);
      previewContainers.forEach((container, idx) => {
        if (container.classList.contains('selected') && executionResults[idx]?.path) {
          const plan = planMessages[idx];
          const pathData = executionResults[idx].path;
          const pathString = Array.isArray(pathData) ? pathData.join(' ') : pathData;
          canvasService.importLayerData(plan.jamo, plan.syllable, pathString);
          console.log(`Imported result for ${plan.jamo}`);
        }
      });
      res(undefined);
    });

    console.log('Selected results imported to canvas');
  }
}

export default SmartPropagationTool;

