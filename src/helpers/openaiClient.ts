import OpenAI from 'openai';
import { logger } from '.';

/**
 * Helper for OpenAI API calls - low-level wrapper
 */
class OpenAIClient {
  private static instance: OpenAIClient;
  private client: OpenAI | null = null;

  private constructor() {
    // Load API key from environment variable
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

    if (apiKey) {
      this.client = new OpenAI({
        apiKey: apiKey,
        dangerouslyAllowBrowser: true // Required for client-side usage
      });
    } else {
      console.warn('OpenAI API key not found. Set VITE_OPENAI_API_KEY in .env file');
    }
  }

  public static getInstance(): OpenAIClient {
    if (!OpenAIClient.instance) {
      OpenAIClient.instance = new OpenAIClient();
    }
    return OpenAIClient.instance;
  }

  /**
   * Simple chat completion
   */
  public async chat(
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
    options?: {
      model?: string;
      temperature?: number;
      maxTokens?: number;
    }
  ): Promise<string> {
    if (!this.client) {
      throw new Error('OpenAI client not initialized. Set VITE_OPENAI_API_KEY in .env file');
    }

    const {
      model = 'gpt-4o-mini',
      temperature = 0.7,
      maxTokens = 1000,
    } = options || {};

    try {
      logger.updateStatus('Sending request to OpenAI...');

      const response = await this.client.chat.completions.create({
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
      });

      const content = response.choices[0]?.message?.content || '';

      logger.updateStatus('OpenAI response received');
      return content;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('OpenAI API call failed', errorMessage);
      throw error;
    }
  }

  /**
   * Simple prompt completion (system + user message)
   */
  public async complete(
    userPrompt: string,
    systemPrompt: string = 'You are a helpful assistant.',
    options?: {
      model?: string;
      temperature?: number;
      maxTokens?: number;
    }
  ): Promise<string> {
    return this.chat([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ], options);
  }

  /**
   * Check if client is initialized
   */
  public isReady(): boolean {
    return this.client !== null;
  }
}

export default OpenAIClient;

