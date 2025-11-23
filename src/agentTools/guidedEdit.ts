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

    // Generate 3 variations with separate API calls
    const generationPromises = Array(3).fill(null).map(async () => {
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
      return {
        path: result.path || ''
      };
    });

    this.generatedResults = await Promise.all(generationPromises);

    // Show results
    this.updateStepContent(
      2,
      `
        ${tags.guidedEditResults(this.generatedResults)}
      `,
      '완료'
    );

    // Set up single-selection listeners
    this.setupSingleSelectionListeners();

    await this.waitForConfirmation();

    // Import selected result
    await this.importSelectedResult(workingJamo, workingSyllable);

    // Workflow complete
    this.deactivate();
  }

  private setupSingleSelectionListeners(): void {
    setTimeout(() => {
      const previewContainers = document.querySelectorAll('.execution-preview-container');
      previewContainers.forEach((container) => {
        const htmlContainer = container as HTMLElement;
        if (htmlContainer.classList.contains('has-cursor')) {
          htmlContainer.addEventListener('click', (e) => {
            e.stopPropagation();

            const wasSelected = htmlContainer.classList.contains('selected');

            // Remove selected class from all containers
            previewContainers.forEach(c => c.classList.remove('selected'));

            // Toggle: if it wasn't selected before, select it now
            if (!wasSelected) {
              htmlContainer.classList.add('selected');
            }

            this.updateSingleSelectionDescription();
          });
        }
      });

      // Initial description update
      this.updateSingleSelectionDescription();
    }, 50);
  }

  private updateSingleSelectionDescription(): void {
    const previewContainers = document.querySelectorAll('.execution-preview-container') as NodeListOf<HTMLElement>;

    let selectedIndex = -1;
    previewContainers.forEach((container, idx) => {
      if (container.classList.contains('selected') && !container.classList.contains('loading')) {
        selectedIndex = idx;
      }
    });

    const descriptionElement = document.querySelector('.execution-selection-description');
    if (descriptionElement) {
      if (selectedIndex === -1) {
        descriptionElement.textContent = '편집 결과를 선택하세요 (선택 안함: 적용 안함)';
      } else {
        descriptionElement.textContent = `옵션 ${selectedIndex + 1}이 선택되었어요`;
      }
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
