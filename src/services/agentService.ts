import paper from 'paper';
import { openaiClient } from '../helpers';
import type { AgentTool } from '../types';
import { tags } from '../utils/tags';
/**
 * Service for agent-related workflows and business logic
 */
class AgentService {
  private static instance: AgentService;
  private isRunning: boolean = false;
  private tools: Map<string, AgentTool> = new Map();

  private constructor() { }

  public static getInstance(): AgentService {
    if (!AgentService.instance) {
      AgentService.instance = new AgentService();
    }
    return AgentService.instance;
  }

  /**
   * Check if agent is currently running
   */
  public getIsRunning(): boolean {
    return this.isRunning;
  }

  /**
   * Register an agent tool
   */
  public initTools(tools: AgentTool[]): void {

    tools.forEach(tool => {
      this.tools.set(tool.id, tool);
      console.log(`Agent tool registered: ${tool.name} (${tool.id})`);
    });
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

  /**
   * Get tools for rendering in the UI
   */
  public getToolsForRendering(): AgentTool[] {
    return this.getTools().filter(tool => tool.isEnabled !== false);
  }

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

    this.isRunning = true;

    try {
      const response = await openaiClient.complete(userPrompt, systemPrompt, options);
      return response;
    } finally {
      this.isRunning = false;
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

