import { OpenAI } from "openai";
import { BaseModel, type ResponseParams } from "./baseModel";
import type { ModelConfig } from ".";
import type { ModelBaseTool, ModelBaseInput } from "../types";

// OpenAI-specific input/output types
export type OpenAIInputType = OpenAI.Responses.ResponseInputItem;
export type OpenAIOutputType = OpenAI.Responses.ResponseOutputItem;
export type OpenAIToolType = OpenAI.Responses.Tool;


export class OpenAIModel extends BaseModel<OpenAI> {
  private static instance: OpenAIModel | null = null;
  protected model: OpenAI;

  private constructor(modelConfig: ModelConfig) {
    super(modelConfig);
    this.model = new OpenAI({ apiKey: this.modelConfig.apiKey, dangerouslyAllowBrowser: true });
  }

  public static getInstance(modelConfig: ModelConfig): OpenAIModel {
    if (!OpenAIModel.instance) {
      OpenAIModel.instance = new OpenAIModel(modelConfig);
    }
    return OpenAIModel.instance;
  }

  public async generateResponses(params: ResponseParams): Promise<OpenAIOutputType[]> {
    const { input, instructions, tools } = params;
    try {
      console.log("[OpenAIModel] Getting responses");

      if (tools) {
        // With tools
        const response = await this.model.responses.create({
          model: this.modelConfig.modelName,
          input: this.formatInput(input),
          tool_choice: "required",
          tools: this.formatTools(tools),
          instructions,
          // reasoning: { effort: "low" },
        });
        return response.output;
      } else {
        // Without tools
        const response = await this.model.responses.create({
          model: this.modelConfig.modelName,
          input: this.formatInput(input),
          instructions,
          // reasoning: { effort: "low" },
        });
        return response.output;
      }
    } catch (err) {
      throw err;
    }
  }

  public formatTools(tools: ModelBaseTool[]): OpenAIToolType[] {
    return tools.map(tool => {
      return {
        type: "function",
        name: tool.name,
        description: tool.description,
        parameters: this.formatToolProperties(tool.properties, false),
        strict: true,
      } as OpenAI.Responses.FunctionTool;
    });
  }

  private formatToolProperties(properties: any, optional: boolean): any {
    if (properties.type === "object") {
      const required = properties.required;
      const keys = Object.keys(properties.properties);

      keys.forEach(key => {
        if (required.includes(key)) properties.properties[key] = this.formatToolProperties(properties.properties[key], false);
        else properties.properties[key] = this.formatToolProperties(properties.properties[key], true);
      });

      return {
        type: "object",
        properties: properties.properties,
        required: keys,
        additionalProperties: false,
      } as any;
    } else if (properties.type === "array") {
      properties.items = this.formatToolProperties(properties.items, false);
      return properties;
    }

    // other types
    if (optional && !Array.isArray(properties.type)) {
      properties.type = [properties.type, "null"];
    }
    return properties;
  }

  public formatInput(input: ModelBaseInput[]): OpenAIInputType[] {
    return input.map(item => {

      if (typeof item.content === "string") {
        return {
          role: item.role,
          content: item.content,
          type: "message"
        };
      } else if (Array.isArray(item.content)) {
        return {
          role: item.role,
          content: item.content.map(content => {
            if (content.type === "text") {
              return { type: "input_text", text: content.data };
            } else if (content.type === "image") {
              return { type: "input_image", detail: "auto", image_url: content.data.includes("base64") ? content.data : "data:image/png;base64," + content.data, };
            }
          }),
          type: "message"
        }
      }

    }) as OpenAIInputType[];
  }

  /*----------------------------------------
   * Response conversion methods
   * ----------------------------------------*/
  public getTextMessage(responses: OpenAIOutputType[]): string | null {
    for (const response of responses) {
      if (response.type === "message" && response.content[0].type === "output_text") {
        return response.content[0].text;
      }
    }
    return null;
  }

  public getTextResponses(responses: OpenAIOutputType[]): OpenAIOutputType[] {
    const textResponses: OpenAIOutputType[] = [];
    for (const response of responses) {
      if (response.type === "message") {
        textResponses.push(response);
      }
    }
    return textResponses;
  }

  public getToolMessage(responses: OpenAIOutputType[]): string | null {
    for (const response of responses) {
      if (response.type === "function_call" && response.arguments) {
        return response.arguments;
      }
    }
    return null;
  }

  public getToolMessages(responses: OpenAIOutputType[]): string[] {
    const toolMessages: string[] = [];
    for (const response of responses) {
      if (response.type === "function_call" && response.arguments) {
        toolMessages.push(response.arguments);
      }
    }
    return toolMessages;
  }

  public getToolResponses(responses: OpenAIOutputType[]): OpenAIOutputType[] {
    const toolResponses: OpenAIOutputType[] = [];
    for (const response of responses) {
      if (response.type === "function_call") {
        toolResponses.push(response);
      }
    }
    return toolResponses;
  }
}