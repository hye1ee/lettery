import type { AgentTool } from "../types";

/**
 * Base class for all agent tools
 * Handles common UI update logic and workflow management with async/await support
 */
export abstract class BaseAgentTool implements AgentTool {
  abstract readonly id: string;
  abstract readonly name: string;
  abstract readonly description: string;
  abstract readonly icon: string;
  abstract readonly characterImage: string;
  abstract readonly labelImage: string;
  abstract readonly isEnabled: boolean;

  protected renderCallback: (() => void) | null = null;
  protected currentStep: number = 0;
  private confirmResolve: (() => void) | null = null;

  // Cached DOM elements
  protected containerElement!: HTMLElement; // Container that holds all steps
  protected buttonElement!: HTMLButtonElement; // Legacy - kept for backward compatibility

  // For backward compatibility with old API
  protected contentElement!: HTMLElement; // Points to the current step's content

  // Step configuration
  protected totalSteps: number = 0;
  protected stepConfigs: Array<{ title: string; description: string; buttonText: string }> = [];

  /**
   * Child classes must implement this to run their workflow
   * Can use await this.waitForConfirmation() to pause for user input
   */
  protected abstract runWorkflow(): Promise<void>;

  public activate(): void {
    console.log(`[${this.id}] Tool activated`);
    this.currentStep = 0;

    // Cache DOM elements once
    const containerEl = document.getElementById(`agent-workflow-content-${this.id}`);
    if (!containerEl) {
      throw new Error('Workflow container not found');
    }

    this.containerElement = containerEl;

    // Clear any previous content
    this.containerElement.innerHTML = '';

    // Set up button listener once (uses event delegation)
    this.setupButtonListener();

    // Start the workflow
    this.runWorkflow().catch(error => {
      console.error(`[${this.id}] Workflow error:`, error);
      this.deactivate();
    });
  }

  public deactivate(): void {
    console.log(`[${this.id}] Tool deactivated`);
    this.currentStep = 0;
    this.totalSteps = 0;
    this.stepConfigs = [];

    // Resolve any pending confirmation
    if (this.confirmResolve) {
      this.confirmResolve();
      this.confirmResolve = null;
    }

    // Clear the workflow content (structure remains)
    if (this.containerElement) {
      this.containerElement.innerHTML = '';
    }

    this.renderCallback?.();
  }

  public setRenderCallback(callback: () => void): void {
    this.renderCallback = callback;
  }

  /**
   * Initialize all steps at once (new approach)
   * Call this at the beginning of your workflow with all step configurations
   */
  protected initializeSteps(steps: Array<{ title: string; description: string; buttonText: string }>): void {
    console.log(`[${this.id}] Initializing ${steps.length} steps`);

    this.totalSteps = steps.length;
    this.stepConfigs = steps;
    this.containerElement.innerHTML = '';

    steps.forEach((step, index) => {
      const stepNumber = index + 1;
      const stepElement = document.createElement('div');
      stepElement.className = 'agent-workflow-step-container';
      stepElement.id = `agent-workflow-step-${this.id}-${stepNumber}`;
      stepElement.innerHTML = `
        <div class="agent-workflow-step-header">
          <div class="agent-workflow-step-number">${stepNumber}</div>
          <div class="agent-workflow-step-info">
            <div class="agent-workflow-step-title text-subtitle">${step.title}</div>
            <div class="agent-workflow-step-description text-body">${step.description}</div>
          </div>
        </div>
        <div class="agent-workflow-step-content text-body" id="agent-workflow-step-content-${this.id}-${stepNumber}">
          <!-- Content will be filled when step becomes active -->
        </div>
        <div class="agent-workflow-step-actions">
          <button class="modal-btn text-label-large" id="agent-workflow-step-btn-${this.id}-${stepNumber}" disabled>
            ${step.buttonText}
          </button>
        </div>
      `;

      this.containerElement.appendChild(stepElement);
    });
  }

  /**
   * Activate a specific step (make it the current active step)
   */
  protected activateStep(stepNumber: number): void {
    console.log(`[${this.id}] Activating step ${stepNumber}`);

    // Remove active class from all steps
    for (let i = 1; i <= this.totalSteps; i++) {
      const stepEl = document.getElementById(`agent-workflow-step-${this.id}-${i}`);
      if (stepEl) {
        stepEl.classList.remove('active');
      }
    }

    // Add active class to current step
    const activeStepEl = document.getElementById(`agent-workflow-step-${this.id}-${stepNumber}`);
    if (activeStepEl) {
      activeStepEl.classList.add('active');
    }

    // Update contentElement reference for backward compatibility
    const stepContentEl = document.getElementById(`agent-workflow-step-content-${this.id}-${stepNumber}`);
    if (stepContentEl) {
      this.contentElement = stepContentEl;
    }

    // Update buttonElement reference for backward compatibility
    const stepButtonEl = document.getElementById(`agent-workflow-step-btn-${this.id}-${stepNumber}`) as HTMLButtonElement;
    if (stepButtonEl) {
      this.buttonElement = stepButtonEl;
    }
  }

  /**
   * Add a new step to the display (legacy - for old approach)
   */
  protected addStep(stepNumber: number, title: string, description: string, content: string, confirmText: string): void {
    console.log(`[${this.id}] Adding step ${stepNumber}: ${title}`);

    const stepElement = document.createElement('div');
    stepElement.className = 'agent-workflow-step-container';
    stepElement.id = `agent-workflow-step-${this.id}-${stepNumber}`;
    stepElement.innerHTML = `
      <div class="agent-workflow-step-header">
        <div class="agent-workflow-step-number">${stepNumber}</div>
        <div class="agent-workflow-step-info">
          <div class="agent-workflow-step-title text-subtitle">${title}</div>
          <div class="agent-workflow-step-description text-body">${description}</div>
        </div>
      </div>
      <div class="agent-workflow-step-content text-body" id="agent-workflow-step-content-${this.id}-${stepNumber}">
        ${content}
      </div>
      <div class="agent-workflow-step-actions">
        <button class="modal-btn text-body" id="agent-workflow-step-btn-${this.id}-${stepNumber}">
          ${confirmText}
        </button>
      </div>
    `;

    this.containerElement.appendChild(stepElement);

    // Update references
    this.activateStep(stepNumber);
  }

  /**
   * Update the content of the current step (without changing title/description)
   */
  protected updateStepContent(stepNumber: number, content: string, confirmText?: string): void {
    console.log(`[${this.id}] Updating step ${stepNumber} content`);

    const contentElement = document.getElementById(`agent-workflow-step-content-${this.id}-${stepNumber}`);
    if (contentElement) {
      contentElement.innerHTML = content;
      contentElement.classList.remove('loading');
    }

    const buttonElement = document.getElementById(`agent-workflow-step-btn-${this.id}-${stepNumber}`) as HTMLButtonElement;
    if (buttonElement) {
      if (confirmText) {
        buttonElement.textContent = confirmText;
      }
      buttonElement.disabled = false;
    }
  }

  /**
   * Show loading state for the current step
   */
  protected showStepLoading(stepNumber: number): void {
    console.log(`[${this.id}] Showing loading for step ${stepNumber}`);

    const contentElement = document.getElementById(`agent-workflow-step-content-${this.id}-${stepNumber}`);
    if (contentElement) {
      contentElement.classList.add('loading');
      contentElement.innerHTML = '<div class="loading-placeholder"></div>';
    }

    const buttonElement = document.getElementById(`agent-workflow-step-btn-${this.id}-${stepNumber}`) as HTMLButtonElement;
    if (buttonElement) {
      buttonElement.disabled = true;
    }
  }

  /**
   * Legacy method for backward compatibility - delegates to addStep
   */
  protected updateDisplay(title: string, content: string, confirmText: string): void {
    this.addStep(this.currentStep, title, '', content, confirmText);
  }

  /**
   * Legacy method for backward compatibility - shows loading on current step
   */
  protected showLoadingState(title: string, confirmText: string): void {
    this.addStep(this.currentStep, title, '', '<div class="loading-placeholder"></div>', confirmText);
    const stepButtonEl = document.getElementById(`agent-workflow-step-btn-${this.id}-${this.currentStep}`) as HTMLButtonElement;
    if (stepButtonEl) {
      stepButtonEl.disabled = true;
    }
  }

  /**
   * Wait for user to click the confirm button
   * Returns a Promise that resolves when button is clicked
   */
  protected waitForConfirmation(): Promise<void> {
    return new Promise((resolve) => {
      this.confirmResolve = resolve;
    });
  }

  private setupButtonListener(): void {
    // Set up listener on the container to handle all step buttons via event delegation
    this.containerElement.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;

      // Check if clicked element is a step button
      if (target.classList.contains('modal-btn') && target.id.includes('agent-workflow-step-btn')) {
        e.preventDefault();
        e.stopPropagation();

        // Resolve the waiting confirmation if any
        if (this.confirmResolve) {
          this.confirmResolve();
          this.confirmResolve = null;
        }
      }
    });
  }
}
