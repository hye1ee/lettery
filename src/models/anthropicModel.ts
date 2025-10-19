import Anthropic from "@anthropic-ai/sdk";
import { BaseModel, type ResponseParams } from "./baseModel";
import type { ModelConfig } from ".";
import type { FunctionTool } from "../types";

// OpenAI-specific input/output types
export type AnthropicInputType = Anthropic.Messages.MessageParam;
export type AnthropicOutputType = Anthropic.Messages.ContentBlock;
export type AnthropicToolType = Anthropic.Messages.Tool;


export class AnthropicModel extends BaseModel<Anthropic> {
  private static instance: AnthropicModel | null = null;
  protected model: Anthropic;
  private maxTokens: number = 1000;

  private constructor(modelConfig: ModelConfig) {
    super(modelConfig);
    this.model = new Anthropic({ apiKey: this.modelConfig.apiKey });
  }

  public static getInstance(modelConfig: ModelConfig): AnthropicModel {
    if (!AnthropicModel.instance) {
      AnthropicModel.instance = new AnthropicModel(modelConfig);
    }
    return AnthropicModel.instance;
  }

  public async generateResponses(params: ResponseParams): Promise<AnthropicOutputType[]> {
    const { input, instructions, tools } = params;
    try {
      if (tools) {
        // With tools
        const response = await this.model.messages.create({
          model: this.modelConfig.modelName,
          messages: input as AnthropicInputType[],
          tools: this.formatTools(tools),
          system: instructions,
          max_tokens: this.maxTokens,
        });
        return response.content;
      } else {
        // Without tools
        const response = await this.model.messages.create({
          model: this.modelConfig.modelName,
          messages: input as AnthropicInputType[],
          system: instructions,
          max_tokens: this.maxTokens,
          // reasoning: { effort: "low" },
        });
        return response.content;
      }
    } catch (err) {
      throw err;
    }
  }

  public formatTools(tools: FunctionTool[]): AnthropicToolType[] {
    return tools.map(tool => {

      const inputSchema = tool.properties as Anthropic.Messages.Tool.InputSchema;

      return {
        name: tool.name,
        description: tool.description,
        input_schema: inputSchema,
      } as AnthropicToolType;
    });
  }

  /*----------------------------------------
   * Response conversion methods
   * ----------------------------------------*/
  public getTextMessage(responses: AnthropicOutputType[]): string | null {
    for (const response of responses) {
      if (response.type === "text") {
        return response.text;
      }
    }
    return null;
  }

  public getTextResponses(responses: AnthropicOutputType[]): AnthropicOutputType[] {
    const textResponses: AnthropicOutputType[] = [];
    for (const response of responses) {
      if (response.type === "text") {
        textResponses.push(response);
      }
    }
    return textResponses;
  }

  public getToolMessage(responses: AnthropicOutputType[]): string | null {
    for (const response of responses) {
      if (response.type === "tool_use") {
        return JSON.stringify(response.input);
      }
    }
    return null;
  }

  public getToolResponses(responses: AnthropicOutputType[]): AnthropicOutputType[] {
    const toolResponses: AnthropicOutputType[] = [];
    for (const response of responses) {
      if (response.type === "tool_use") {
        toolResponses.push(response);
      }
    }
    return toolResponses;
  }
}