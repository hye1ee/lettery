import { OpenAIModel } from "./openaiModel";
import { BaseModel } from "./baseModel";
import { AnthropicModel } from "./anthropicModel";

export interface ModelConfig {
  modelType: "openai" | "anthropic" | "google";
  modelName: string;
  apiKey: string;
}

export class ModelProvider {
  private static openaiModel: OpenAIModel | null = null;
  private static anthropicModel: AnthropicModel | null = null;
  private static defaultModelType: "openai" | "anthropic" = "openai";

  public static initOpenAI(config: ModelConfig): void {
    if (!config) throw new Error("ModelConfig must be provided");
    if (config.modelType !== "openai") throw new Error("Invalid model type for OpenAI");
    ModelProvider.openaiModel = OpenAIModel.getInstance(config);
  }

  public static initAnthropic(config: ModelConfig): void {
    if (!config) throw new Error("ModelConfig must be provided");
    if (config.modelType !== "anthropic") throw new Error("Invalid model type for Anthropic");
    ModelProvider.anthropicModel = AnthropicModel.getInstance(config);
  }

  public static setDefaultModelType(modelType: "openai" | "anthropic"): void {
    ModelProvider.defaultModelType = modelType;
  }

  public static getModel(modelType?: "openai" | "anthropic"): BaseModel<any> {
    const type = modelType || ModelProvider.defaultModelType;

    switch (type) {
      case "openai":
        if (!ModelProvider.openaiModel) {
          throw new Error("OpenAI model not initialized. Call initOpenAI() first.");
        }
        return ModelProvider.openaiModel;
      case "anthropic":
        if (!ModelProvider.anthropicModel) {
          throw new Error("Anthropic model not initialized. Call initAnthropic() first.");
        }
        return ModelProvider.anthropicModel;
      default:
        throw new Error(`Unsupported model type: ${type}`);
    }
  }
}
