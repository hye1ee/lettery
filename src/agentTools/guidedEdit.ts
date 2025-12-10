import { BaseAgentTool } from "./baseAgentTool";
import { canvasService, uiService } from "../services";
import paper from "paper";
import { ModelProvider } from "../models";
import { editTool } from "./functionTools";
import { tags } from "../utils/tags";
import { outlineEditExample, strokeEditExample, jamoGuideEditPrompt } from "../utils/prompt";

/**
 * Guided Edit Agent Tool
 */
class GuidedEdit extends BaseAgentTool {
  private static instance: GuidedEdit;

  public readonly id: string = 'guided-edit';
  public readonly name: string = 'Guided Edit';
  public readonly description: string = 'Edit the selected jamo based on your text description';
  public readonly icon: string = '/command.svg';
  public readonly characterImage: string = '/hangulo_agent2.png';
  public readonly labelImage: string = '/label2.png';
  public readonly isEnabled: boolean = true;

  private generatedResults: Array<{ path: string | string[] }> = [];

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
    this.generatedResults = [];
  }

  protected async runWorkflow(): Promise<void> {
    // [Step 0] Initialize model and get data
    const model = ModelProvider.getModel("anthropic");
    const { workingSyllable, workingJamo } = uiService.getWorkingLetters();

    const activeLayer = paper.project.activeLayer;
    if (!activeLayer) throw new Error('No active layer found');

    const pathData: string[] = activeLayer.children.filter(
      item => (item.name) && !item.name.includes('ShapeSketch') && !item.name.includes('StrokeSketch'))
      .map(item => (item as paper.PathItem).pathData) || [];

    const guideData: string[] = activeLayer.children.filter(
      item => (item.name) && (item.name.includes('ShapeSketch') || item.name.includes('StrokeSketch')))
      .map(item => (item as paper.PathItem).pathData) || [];

    if (guideData.length === 0) {
      // Initialize only step 0 for error case
      this.initializeSteps([
        {
          title: '가이드 스케치가 없습니다',
          description: '뼈대 스케치 또는 윤곽선 스케치를 추가해주세요',
          buttonText: '확인'
        }
      ]);

      // [Step 1] No guide sketch found
      this.currentStep = 1;
      this.activateStep(1);

      this.updateStepContent(
        1,
        `
          <p style="margin: 12px 0; text-align: center;">
            ✏️ 연필 도구로 표현하고 싶은 윤곽선을,<br />🖌️ 마커 도구로 변형하고 싶은 뼈대를 그려주세요.
          </p>
        `,
        '확인'
      );

      await this.waitForConfirmation();
      this.deactivate();
      return;
    }

    // Initialize steps 1 and 2 for normal workflow
    this.initializeSteps([
      {
        title: '가이드 스케치 확인하기',
        description: '적용할 가이드 스케치를 확인하세요',
        buttonText: '다음 단계'
      },
      {
        title: '편집 결과 적용하기',
        description: '불러올 편집 결과를 선택하세요',
        buttonText: '완료'
      }
    ]);

    // [Step 1] Show guide sketch
    this.currentStep = 1;
    this.activateStep(1);

    const strokeData: string[] = activeLayer.children.filter(
      item => (item.name) && item.name.includes('StrokeSketch'))
      .map(item => (item as paper.PathItem).pathData) || [];

    const isStrokeSketch = strokeData.length > 0;

    const svgString = tags.svgMixedPreview(pathData, isStrokeSketch ? strokeData : guideData, isStrokeSketch ? "orange" : "blue");
    this.updateStepContent(
      1,
      `
        <div style="display: flex; flex-direction: column; align-items: center; gap: 12px;">
          ${svgString}
          <p class="svg-preview-label">
            <strong>검은색:</strong> 현재 자모<br/>
            <strong>${isStrokeSketch ? '주황색' : '하늘색'}:</strong> ${isStrokeSketch ? '뼈대 스케치 가이드' : '윤곽선 스케치 가이드'}<br/>
            ${isStrokeSketch && (guideData.length - strokeData.length > 0) ? "⭐ 뼈대 스케치가 우선적용 됩니다." : ""}
          </p>
        </div>
      `,
      '다음 단계'
    );

    await this.waitForConfirmation();

    // [Step 2] Generate results
    this.currentStep = 2;
    this.activateStep(2);
    this.showStepLoading(2);

    // Capture the svg string as base64
    const svgBase64 = await this.formatSvgToBase64(svgString);

    // Initialize results array with placeholders (for loading state)
    // Use Array.from to create separate objects, not shared references
    this.generatedResults = Array.from({ length: 3 }, () => ({ path: '' }));

    // Show initial loading state and setup listeners once
    this.updateStepContent(
      2,
      `
        ${tags.guidedEditResults(this.generatedResults)}
      `,
      '완료'
    );

    // Setup listeners once at the beginning (they'll work for all updates)
    this.setupSingleSelectionListeners();

    // Track completion
    let completedCount = 0;
    const totalCalls = 3;

    // Helper function to update the display with current results
    const updateResultsDisplay = (setupListeners: boolean = false) => {
      this.updateStepContent(
        2,
        `
          ${tags.guidedEditResults(this.generatedResults)}
        `,
        '완료'
      );

      // Only setup listeners when explicitly requested (to avoid duplicate listeners)
      if (setupListeners) {
        this.setupSingleSelectionListeners();
      }
    };

    // Generate 3 variations - each updates UI independently as it completes
    const generationPromises = Array(3).fill(null).map(async (_, index) => {
      try {
        const response = await model.generateResponses({
          input: [
            isStrokeSketch ? strokeEditExample : outlineEditExample,
            {
              role: 'user',
              content: [
                { type: "text", data: `Current jamo path data: ${pathData.join(' ')}` },
                { type: "text", data: `Guide path data: ${guideData.join(' ')}` },
                { type: "image", data: svgBase64 },
              ],
            },
          ],
          instructions: jamoGuideEditPrompt(workingJamo, isStrokeSketch),
          tools: [editTool],
        });

        const result = JSON.parse(model.getToolMessage(response) ?? "{}");
        const resultData = {
          path: result.path || ''
        };

        console.log(`Result ${index + 1} received:`, { hasPath: !!resultData.path, pathType: typeof resultData.path, pathLength: Array.isArray(resultData.path) ? resultData.path.length : resultData.path.length });

        // Update the specific result
        this.generatedResults[index] = resultData;
        completedCount++;

        console.log(`Result ${index + 1} completed (${completedCount}/${totalCalls})`);
        console.log('Current generatedResults:', this.generatedResults);

        // Update UI immediately when this result arrives
        updateResultsDisplay();

        return resultData;
      } catch (error) {
        console.error(`Error generating result ${index + 1}:`, error);

        // Mark as failed but still update UI
        this.generatedResults[index] = { path: '' };
        completedCount++;

        updateResultsDisplay();

        return { path: '' };
      }
    });

    // Wait for all to complete (but UI already updated progressively)
    await Promise.all(generationPromises);

    console.log('All generations complete');

    // Final update (listeners already set up)
    updateResultsDisplay(false);

    await this.waitForConfirmation();

    // Import selected result
    await this.importSelectedResult(workingJamo, workingSyllable);

    // Workflow complete
    this.deactivate();
  }

  private setupSingleSelectionListeners(): void {
    setTimeout(() => {
      // Use event delegation on the step content element (which doesn't get replaced)
      const stepContent = document.getElementById(`agent-workflow-step-content-${this.id}-2`);

      if (!stepContent) {
        console.warn('Step content not found');
        return;
      }

      console.log('Setting up selection listeners on step content:', stepContent);

      // Remove any existing delegated listener
      const oldListener = (stepContent as any)._selectionListener;
      if (oldListener) {
        console.log('Removing old listener');
        stepContent.removeEventListener('click', oldListener);
      }

      // Create new delegated listener
      const newListener = (e: Event) => {
        const target = e.target as HTMLElement;
        const previewContainer = target.closest('.execution-preview-container') as HTMLElement;

        console.log('Click detected:', { target, previewContainer });

        if (!previewContainer) {
          console.log('No preview container found');
          return;
        }

        if (!previewContainer.classList.contains('has-cursor')) {
          console.log('Container does not have has-cursor class:', previewContainer.className);
          return;
        }

        e.stopPropagation();
        console.log('Selection toggling');

        const wasSelected = previewContainer.classList.contains('selected');

        // Remove selected class from all containers
        const allContainers = document.querySelectorAll('.execution-preview-container');
        allContainers.forEach(c => c.classList.remove('selected'));

        // Toggle: if it wasn't selected before, select it now
        if (!wasSelected) {
          previewContainer.classList.add('selected');
          console.log('Selected container:', previewContainer.dataset.index);
        } else {
          console.log('Deselected all');
        }

        this.updateSingleSelectionDescription();
      };

      // Attach the listener to step content (persists across innerHTML updates)
      stepContent.addEventListener('click', newListener);
      (stepContent as any)._selectionListener = newListener;

      // Initial description update
      this.updateSingleSelectionDescription();
    }, 100);
  }

  private updateSingleSelectionDescription(): void {
    const previewContainers = document.querySelectorAll('.execution-preview-container') as NodeListOf<HTMLElement>;

    let selectedIndex = -1;
    previewContainers.forEach((container, idx) => {
      if (container.classList.contains('selected') && !container.classList.contains('loading')) {
        selectedIndex = idx;
      }
    });

    console.log('Updating selection description, selectedIndex:', selectedIndex);

    const descriptionElement = document.querySelector('.execution-selection-description');
    if (descriptionElement) {
      if (selectedIndex === -1) {
        descriptionElement.textContent = '편집 결과를 선택하세요 (선택 안함: 적용 안함)';
      } else {
        descriptionElement.textContent = `옵션 ${selectedIndex + 1}이 선택되었어요`;
      }
      console.log('Description updated to:', descriptionElement.textContent);
    } else {
      console.warn('Description element not found');
    }
  }

  private async importSelectedResult(workingJamo: string, workingSyllable: string): Promise<void> {
    const previewContainers = document.querySelectorAll('.execution-preview-container') as NodeListOf<HTMLElement>;

    let selectedIndex = -1;
    previewContainers.forEach((container, idx) => {
      if (container.classList.contains('selected') && !container.classList.contains('loading')) {
        selectedIndex = idx;
      }
    });

    // If nothing selected, just finish
    if (selectedIndex === -1) {
      console.log('No result selected, skipping import');
      return;
    }

    // Import the selected result
    const selectedResult = this.generatedResults[selectedIndex];
    if (selectedResult && selectedResult.path) {
      const pathToImport = Array.isArray(selectedResult.path) ? selectedResult.path[0] : selectedResult.path;
      canvasService.importLayerData(workingJamo, workingSyllable, pathToImport);
      console.log(`Imported guided edit result ${selectedIndex + 1}`);
    }
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
