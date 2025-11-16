import type { AgentTool } from "../types";

/**
 * Placeholder Agent Tool (Third Character)
 * This is a non-functional placeholder for future agent tool
 */
class PlaceholderAgent implements AgentTool {
  private static instance: PlaceholderAgent;

  public readonly id: string = 'placeholder-agent';
  public readonly name: string = 'Coming Soon';
  public readonly description: string = 'This feature is coming soon!';
  public readonly icon: string = '/flash.svg';
  public readonly characterImage: string = '/hangulo_agent3.png';
  public readonly labelImage: string = '/label3.png';
  public readonly isEnabled: boolean = false; // Always disabled

  private constructor() { }

  public static getInstance(): PlaceholderAgent {
    if (!PlaceholderAgent.instance) {
      PlaceholderAgent.instance = new PlaceholderAgent();
    }
    return PlaceholderAgent.instance;
  }

  public activate(): void {
    // Do nothing - placeholder
    console.log('[placeholder-agent] This agent is not yet implemented');
  }

  public deactivate(): void {
    // Do nothing - placeholder
  }

  public setRenderCallback(_callback: () => void): void {
    // Do nothing - placeholder
  }
}

export default PlaceholderAgent;
export const placeholderAgent = PlaceholderAgent.getInstance();

