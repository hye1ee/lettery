import type { AgentTool } from '../types';

/**
 * Manages AI agent tools (GuidedEdit, SmartPropagation) and their workflows
 */
class AgentService {
  private static instance: AgentService;
  private activeToolId: string | null = null;
  private tools: Map<string, AgentTool> = new Map();
  private renderCallback: (() => void) | null = null;

  private constructor() { }

  public static getInstance(): AgentService {
    if (!AgentService.instance) {
      AgentService.instance = new AgentService();
    }
    return AgentService.instance;
  }

  //--------------------------------
  // UI related methods
  //--------------------------------

  /**
   * Set the render callback for all agent tools
   */
  public setRenderCallback(callback: () => void): void {
    this.renderCallback = () => {
      this.activeToolId = null;

      callback();
    };
  }

  /**
   * Check if agent is currently running
   */
  public getActiveToolName(): string | null {

    if (!this.activeToolId) return null;

    const tool = this.tools.get(this.activeToolId);
    if (!tool) return null;

    return tool.name;
  }

  public getActiveToolId(): string | null {
    return this.activeToolId;
  }

  /**
   * Register agent tools and set their render callbacks
   */
  public initTools(tools: AgentTool[]): void {
    tools.forEach(tool => {
      this.tools.set(tool.id, tool);

      // Set render callback if available
      if (this.renderCallback) {
        tool.setRenderCallback(this.renderCallback);
      }

      console.log(`Agent tool registered: ${tool.name} (${tool.id})`);
    });
  }

  public activateTool(tool: AgentTool): void {
    this.activeToolId = tool.id;
    tool.activate();
  }

  public deactivateTool(): void {
    if (this.activeToolId) {
      const tool = this.tools.get(this.activeToolId);
      tool?.deactivate();
      this.activeToolId = null;
    }
  }


  /**
   * Get all registered tools
   */
  public getTools(): AgentTool[] {
    return Array.from(this.tools.values());
  }

  /**
   * Get a specific tool by ID
   */
  public getTool(toolId: string): AgentTool | undefined {
    return this.tools.get(toolId);
  }
}

export default AgentService;

