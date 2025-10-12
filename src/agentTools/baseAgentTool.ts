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
  abstract readonly isEnabled: boolean;

  protected renderCallback: (() => void) | null = null;
  protected currentStep: number = 0;
  private confirmResolve: (() => void) | null = null;

  // Cached DOM elements
  protected titleElement!: HTMLElement;
  protected contentElement!: HTMLElement;
  protected buttonElement!: HTMLButtonElement;

  /**
   * Child classes must implement this to run their workflow
   * Can use await this.waitForConfirmation() to pause for user input
   */
  protected abstract runWorkflow(): Promise<void>;

  public activate(): void {
    console.log(`[${this.id}] Tool activated`);
    this.currentStep = 0;

    // Cache DOM elements once
    const titleEl = document.getElementById(`agent-workflow-title-${this.id}`);
    const contentEl = document.getElementById(`agent-workflow-content-${this.id}`);
    const buttonEl = document.getElementById(`agent-workflow-btn-${this.id}`) as HTMLButtonElement;

    if (!titleEl || !contentEl || !buttonEl) {
      throw new Error('Workflow elements not found');
    }

    this.titleElement = titleEl;
    this.contentElement = contentEl;
    this.buttonElement = buttonEl;

    // Set up button listener once
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

    // Resolve any pending confirmation
    if (this.confirmResolve) {
      this.confirmResolve();
      this.confirmResolve = null;
    }

    // Clear the workflow content (structure remains)
    if (this.titleElement) this.titleElement.textContent = '';
    if (this.contentElement) {
      this.contentElement.innerHTML = '';
      this.contentElement.classList.remove('loading'); // Remove shimmer effect
    }
    if (this.buttonElement) {
      this.buttonElement.textContent = '';
      this.buttonElement.disabled = false;
    }

    this.renderCallback?.();
  }

  public setRenderCallback(callback: () => void): void {
    this.renderCallback = callback;
  }

  /**
   * Update the display with title, content, and button text
   */
  protected updateDisplay(title: string, content: string, confirmText: string): void {
    console.log(`[${this.id}] Updating display: ${title}`);

    // Remove loading state and enable button
    this.contentElement.classList.remove('loading');
    this.buttonElement.disabled = false;

    // Update content
    this.titleElement.textContent = title;
    this.contentElement.innerHTML = content;
    this.buttonElement.textContent = confirmText;
  }

  /**
   * Show loading state with shimmer effect
   */
  protected showLoadingState(title: string, confirmText: string): void {
    // Set title and button
    this.titleElement.textContent = title;
    this.buttonElement.textContent = confirmText;
    this.buttonElement.disabled = true;

    // Add shimmer effect to content box
    this.contentElement.classList.add('loading');
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
    // Set up listener once for the entire workflow
    this.buttonElement.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();

      // Resolve the waiting confirmation if any
      if (this.confirmResolve) {
        this.confirmResolve();
        this.confirmResolve = null;
      }
    });
  }
}
