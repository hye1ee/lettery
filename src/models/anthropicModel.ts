import Anthropic from "@anthropic-ai/sdk";
import { BaseModel, type ResponseParams } from "./baseModel";
import type { ModelConfig } from ".";
import type { ModelBaseInput, ModelBaseTool } from "../types";

// OpenAI-specific input/output types
export type AnthropicInputType = Anthropic.Messages.MessageParam;
export type AnthropicOutputType = Anthropic.Messages.ContentBlock;
export type AnthropicToolType = Anthropic.Messages.Tool;


export class AnthropicModel extends BaseModel<Anthropic> {
  private static instance: AnthropicModel | null = null;
  protected model: Anthropic;
  private maxTokens: number = 16000;

  private constructor(modelConfig: ModelConfig) {
    super(modelConfig);
    this.model = new Anthropic({ apiKey: this.modelConfig.apiKey, dangerouslyAllowBrowser: true });
  }

  public static getInstance(modelConfig: ModelConfig): AnthropicModel {
    if (!AnthropicModel.instance) {
      AnthropicModel.instance = new AnthropicModel(modelConfig);
    }
    return AnthropicModel.instance;
  }

  public async generateResponses(params: ResponseParams): Promise<AnthropicOutputType[]> {
    const { input, instructions, tools, modelName } = params;
    const selectedModel = this.getModelName(modelName);

    try {
      console.log(`[AnthropicModel] Getting responses with model: ${selectedModel}`);

      if (tools) {
        // With tools
        const response = await this.model.beta.messages.create({
          model: selectedModel,
          messages: this.formatInput(input),
          tools: this.formatTools(tools),
          system: instructions,
          max_tokens: this.maxTokens,
          betas: ["structured-outputs-2025-11-13"]
        });
        return response.content as AnthropicOutputType[];
      } else {
        // Without tools
        const response = await this.model.messages.create({
          model: selectedModel,
          messages: this.formatInput(input),
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

  public formatTools(tools: ModelBaseTool[]): AnthropicToolType[] {
    return tools.map(tool => {

      const inputSchema = tool.properties as Anthropic.Messages.Tool.InputSchema;
      inputSchema.additionalProperties = false;

      return {
        name: tool.name,
        description: tool.description,
        input_schema: inputSchema,
        strict: true,
      } as AnthropicToolType;
    });
  }

  public formatInput(input: ModelBaseInput[]): AnthropicInputType[] {
    return input.map(item => {

      if (typeof item.content === "string") {
        return item;
      } else if (Array.isArray(item.content)) {
        return {
          role: item.role,
          content: item.content.map(content => {
            if (content.type === "text") {
              return { type: "text", text: content.data };
            } else if (content.type === "image") {
              return { type: "image", source: { type: "base64", data: content.data.includes("base64") ? content.data.split(",")[1] : content.data, media_type: 'image/png' } };
            }
          }),
        }
      }

    }) as AnthropicInputType[];
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

  public getToolMessages(responses: AnthropicOutputType[]): string[] {
    const toolMessages: string[] = [];
    for (const response of responses) {
      if (response.type === "tool_use") {
        toolMessages.push(JSON.stringify(response.input));
      }
    }
    return toolMessages;
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