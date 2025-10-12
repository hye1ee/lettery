import paper from 'paper';
import { openaiClient } from '../helpers';
import type { AgentTool } from '../types';
/**
 * Service for agent-related workflows and business logic
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


  //--------------------------------
  // Agent actions
  //--------------------------------

  /**
   * Run agent with custom user and system prompts
   */
  public async run(
    userPrompt: string,
    systemPrompt: string,
    options?: {
      model?: string;
      temperature?: number;
      maxTokens?: number;
    }
  ): Promise<string> {
    if (!openaiClient.isReady()) {
      throw new Error('OpenAI client not ready. Please set VITE_OPENAI_API_KEY in .env file');
    }

    try {
      const response = await openaiClient.complete(userPrompt, systemPrompt, options);
      return response;
    } finally {
    }
  }

  /**
   * Analyze the currently selected items
   */
  public async analyzeSelection(): Promise<string> {
    const selectedItems = paper.project.selectedItems.filter(
      item => !item.name.includes('system')
    );

    if (selectedItems.length === 0) {
      throw new Error('No items selected');
    }

    // Export selected items as JSON for analysis
    const itemsData = selectedItems.map(item => ({
      type: item.className,
      bounds: item.bounds,
      segments: (item as any).segments?.length || 0,
    }));

    const userPrompt = `Analyze these paths: ${JSON.stringify(itemsData, null, 2)}`;
    const systemPrompt = 'You are a vector graphics expert. Analyze the provided path data and give suggestions.';

    return this.run(userPrompt, systemPrompt);
  }

  /**
   * Get suggestions for improving selected paths
   */
  public async suggestImprovements(): Promise<string> {
    const selectedItems = paper.project.selectedItems.filter(
      item => !item.name.includes('system')
    );

    if (selectedItems.length === 0) {
      throw new Error('No items selected');
    }

    const userPrompt = `I have ${selectedItems.length} selected path(s). Suggest improvements for typography and design.`;
    const systemPrompt = 'You are a Hangul typography expert. Provide specific, actionable suggestions for improving Korean letter forms.';

    return this.run(userPrompt, systemPrompt);
  }

  /**
   * Ask a general question about the project
   */
  public async ask(question: string): Promise<string> {
    const systemPrompt = 'You are a helpful assistant for a Hangul typography editor called "Hangulo". Help users with vector graphics and Korean typography.';

    return this.run(question, systemPrompt);
  }
}

export default AgentService;

