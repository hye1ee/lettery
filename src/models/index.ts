import { OpenAIModel } from "./openaiModel";
import { BaseModel } from "./baseModel";
import { AnthropicModel } from "./anthropicModel";

export interface ModelConfig {
  modelType: "openai" | "anthropic" | "google";
  modelName: string;
  apiKey: string;
}

export class ModelProvider {
  private static modelConfig: ModelConfig | null = null;

  public static init(config: ModelConfig): void {
    if (!config) throw new Error("ModelConfig must be provided");
    ModelProvider.modelConfig = config;
  }

  public static getModel(): BaseModel<any> {
    if (!ModelProvider.modelConfig) {
      throw new Error("ModelProvider not initialized. Call init() first.");
    }

    const config = ModelProvider.modelConfig;

    switch (config.modelType) {
      case "openai":
        return OpenAIModel.getInstance(config);
      case "anthropic":
        return AnthropicModel.getInstance(config);
      default:
        throw new Error(`Unsupported model type: ${config.modelType}`);
    }
  }
}
