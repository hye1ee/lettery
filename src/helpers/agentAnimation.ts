/**
 * Agent Character Walking Animation
 * Makes agent characters walk randomly left and right
 */

interface WalkingAgent {
  element: HTMLElement;
  imageElement: HTMLElement;
  isWalking: boolean;
  direction: 'left' | 'right';
  position: number; // Current X position
  targetPosition: number;
  minX: number;
  maxX: number;
  walkSpeed: number;
  nextActionTime: number;
}

class AgentAnimationController {
  private static instance: AgentAnimationController;
  private agents: Map<string, WalkingAgent> = new Map();
  private animationFrame: number | null = null;
  private isEnabled: boolean = true;

  private constructor() {
    this.startAnimation();

    // Update boundaries on window resize
    window.addEventListener('resize', () => {
      this.updateBoundaries();
    });
  }

  public static getInstance(): AgentAnimationController {
    if (!AgentAnimationController.instance) {
      AgentAnimationController.instance = new AgentAnimationController();
    }
    return AgentAnimationController.instance;
  }

  /**
   * Register an agent character for animation
   */
  public registerAgent(toolId: string): void {
    const buttonElement = document.getElementById(`agent-character-${toolId}`);
    const imageElement = buttonElement?.querySelector('.agent-character-image') as HTMLElement;

    if (!buttonElement || !imageElement) {
      console.warn(`Agent character not found for tool: ${toolId}`);
      return;
    }

    // Get the parent card element for position transform
    const cardElement = buttonElement.closest('.agent-action-card') as HTMLElement;
    if (!cardElement) {
      console.warn(`Agent action card not found for tool: ${toolId}`);
      return;
    }

    // Calculate boundaries based on full window width
    const windowWidth = window.innerWidth;
    const elementWidth = buttonElement.offsetWidth || 80;

    // Get the initial center position of the element
    const rect = buttonElement.getBoundingClientRect();
    const centerOffset = rect.left + (elementWidth / 2);

    // Calculate how far the agent can move left and right from its center
    const maxLeft = -(centerOffset - elementWidth / 2);
    const maxRight = windowWidth - centerOffset - elementWidth / 2;

    const agent: WalkingAgent = {
      element: cardElement, // Use card element for position transform
      imageElement,
      isWalking: false,
      direction: 'right',
      position: 0,
      targetPosition: 0,
      minX: maxLeft,
      maxX: maxRight,
      walkSpeed: 0.3, // Random speed between 0.3 and 0.8
      nextActionTime: Date.now() + this.getRandomDelay()
    };

    this.agents.set(toolId, agent);
  }

  /**
   * Unregister an agent
   */
  public unregisterAgent(toolId: string): void {
    this.agents.delete(toolId);
  }

  /**
   * Update boundaries for all agents (called on window resize)
   */
  private updateBoundaries(): void {
    const windowWidth = window.innerWidth;

    this.agents.forEach((agent, toolId) => {
      // Get button element for width calculation
      const buttonElement = document.getElementById(`agent-character-${toolId}`);
      if (!buttonElement) return;

      const elementWidth = buttonElement.offsetWidth || 80;
      const rect = buttonElement.getBoundingClientRect();
      const centerOffset = rect.left + (elementWidth / 2) - agent.position;

      agent.minX = -(centerOffset - elementWidth / 2);
      agent.maxX = windowWidth - centerOffset - elementWidth / 2;

      // Clamp current position to new boundaries
      agent.position = Math.max(agent.minX, Math.min(agent.maxX, agent.position));
      agent.targetPosition = Math.max(agent.minX, Math.min(agent.maxX, agent.targetPosition));
    });
  }

  /**
   * Get random delay between actions (5-15 seconds)
   */
  private getRandomDelay(): number {
    return 5000 + Math.random() * 10000;
  }

  /**
   * Decide next action for agent
   */
  private decideNextAction(agent: WalkingAgent): void {
    const now = Date.now();

    if (now < agent.nextActionTime) {
      return; // Not time for next action yet
    }

    // 30% chance to walk, 70% chance to stand still
    const shouldWalk = Math.random() > 0.7;

    if (shouldWalk) {
      // Start walking
      agent.isWalking = true;

      // Calculate distance from edges
      const range = agent.maxX - agent.minX;
      const distanceFromLeftEdge = agent.position - agent.minX;
      const distanceFromRightEdge = agent.maxX - agent.position;
      const edgeThreshold = range * 0.1; // 10% from edge

      // If near left edge, prefer moving right
      // If near right edge, prefer moving left
      let newTargetPosition: number;

      if (distanceFromLeftEdge < edgeThreshold) {
        // Near left edge - move right (10-40% of remaining distance)
        const availableDistance = agent.maxX - agent.position;
        newTargetPosition = agent.position + (availableDistance * (0.1 + Math.random() * 0.3));
      } else if (distanceFromRightEdge < edgeThreshold) {
        // Near right edge - move left (10-40% of available distance)
        const availableDistance = agent.position - agent.minX;
        newTargetPosition = agent.position - (availableDistance * (0.1 + Math.random() * 0.3));
      } else {
        // Not near edge - move a shorter distance (10-30% of total range)
        const currentPos = agent.position;
        const moveDistance = range * (0.1 + Math.random() * 0.2);
        const moveDirection = Math.random() > 0.5 ? 1 : -1;
        newTargetPosition = currentPos + (moveDistance * moveDirection);
      }

      // Ensure target is within bounds (safety check)
      agent.targetPosition = Math.max(agent.minX, Math.min(agent.maxX, newTargetPosition));

      // Update direction based on target
      agent.direction = agent.targetPosition > agent.position ? 'right' : 'left';

    } else {
      // Stand still
      agent.isWalking = false;
    }

    // Schedule next action
    agent.nextActionTime = now + this.getRandomDelay();
  }

  /**
   * Update agent position
   */
  private updateAgent(agent: WalkingAgent): void {
    if (!agent.isWalking) {
      this.decideNextAction(agent);
      return;
    }

    // Move towards target
    const diff = agent.targetPosition - agent.position;
    const distance = Math.abs(diff);

    if (distance < 1) {
      // Reached target, stop walking
      agent.isWalking = false;
      agent.position = agent.targetPosition;
      this.decideNextAction(agent);
    } else {
      // Continue walking
      const step = Math.min(agent.walkSpeed, distance);
      agent.position += diff > 0 ? step : -step;

      // Safety check: ensure position stays within bounds
      agent.position = Math.max(agent.minX, Math.min(agent.maxX, agent.position));

      // If we hit a boundary, stop and turn around immediately
      if (agent.position <= agent.minX || agent.position >= agent.maxX) {
        agent.isWalking = false;
        this.decideNextAction(agent);
        return;
      }

      // Update direction based on movement
      agent.direction = diff > 0 ? 'right' : 'left';
    }

    // Apply transform
    const scaleX = agent.direction === 'left' ? -1 : 1;
    agent.element.style.transform = `translateX(${agent.position}px)`;
    agent.imageElement.style.transform = `scaleX(${scaleX})`;
  }

  /**
   * Animation loop
   */
  private animate = (): void => {
    if (!this.isEnabled) return;

    this.agents.forEach(agent => {
      this.updateAgent(agent);
    });

    this.animationFrame = requestAnimationFrame(this.animate);
  }

  /**
   * Start animation
   */
  public startAnimation(): void {
    if (this.animationFrame) return;
    this.isEnabled = true;
    this.animate();
  }

  /**
   * Stop animation
   */
  public stopAnimation(): void {
    this.isEnabled = false;
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
  }

  /**
   * Pause all animations (for when modal is open)
   */
  public pauseAnimations(): void {
    this.isEnabled = false;
  }

  /**
   * Resume all animations and restart the loop
   */
  public resumeAnimations(): void {
    // Reset all agents to start fresh
    this.agents.forEach(agent => {
      agent.isWalking = false;
      agent.nextActionTime = Date.now() + this.getRandomDelay();
    });

    this.isEnabled = true;
    if (!this.animationFrame) {
      this.animate();
    }
  }

  /**
   * Reset all agents to default position
   */
  public resetAgents(): void {
    this.agents.forEach(agent => {
      agent.position = 0;
      agent.targetPosition = 0;
      agent.isWalking = false;
      agent.element.style.transform = 'translateX(0)';
      agent.imageElement.style.transform = 'scaleX(1)';
    });
  }
}

export const agentAnimation = AgentAnimationController.getInstance();

