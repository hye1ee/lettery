import type { ModelConfig } from ".";
import type { OpenAIInputType, OpenAIOutputType, OpenAIToolType } from "./openaiModel";
import type { AnthropicInputType, AnthropicOutputType, AnthropicToolType } from "./anthropicModel";
import type { ModelBaseTool, ModelBaseInput } from "../types";

// Abstract input/output types that each model will define
export type ModelInputType = OpenAIInputType | AnthropicInputType; // Will be overridden by each model
export type ModelOutputType = OpenAIOutputType | AnthropicOutputType;
export type ModelToolType = OpenAIToolType | AnthropicToolType;

// Legacy interface for backward compatibility
export interface ResponseParams {
  input: ModelBaseInput[]; // Will be typed differently for each model
  instructions: string;
  tools?: ModelBaseTool[]; // Will be typed differently for each model
  modelName?: string; // Optional model name override
}

export abstract class BaseModel<Model> {
  protected abstract model: Model;  // 각 subclass가 구체 타입으로 정의
  protected modelConfig: ModelConfig;
  protected defaultModelName: string;


  constructor(modelConfig: ModelConfig) {
    this.modelConfig = modelConfig;
    this.defaultModelName = modelConfig.modelName;
  }

  // Abstract methods that each model must implement
  public abstract generateResponses(params: ResponseParams): Promise<ModelOutputType[]>;

  // Helper method to get model name (use override or default)
  protected getModelName(modelName?: string): string {
    return modelName || this.defaultModelName;
  }

  // Response conversion methods
  public abstract getTextMessage(responses: ModelOutputType[]): string | null;
  public abstract getTextResponses(responses: ModelOutputType[]): ModelOutputType[];

  public abstract getToolMessage(responses: ModelOutputType[]): string | null;
  public abstract getToolMessages(responses: ModelOutputType[]): string[];
  public abstract getToolResponses(responses: ModelOutputType[]): ModelOutputType[];

  // Format input data  
  public abstract formatInput(input: ModelBaseInput[]): ModelInputType[];
  public abstract formatTools(tools: ModelBaseTool[]): ModelToolType[];
}