import { logger } from '../helpers';

/**
 * Service for handling OpenAI API calls
 */
class ModelService {
  private static instance: ModelService;
  private apiKey: string | null = null;
  private apiUrl = 'https://api.openai.com/v1/chat/completions';

  private constructor() {
    // Load API key from environment variable
    this.apiKey = import.meta.env.VITE_OPENAI_API_KEY || null;

    if (!this.apiKey) {
      console.warn('OpenAI API key not found. Set VITE_OPENAI_API_KEY in .env file');
    }
  }

  public static getInstance(): ModelService {
    if (!ModelService.instance) {
      ModelService.instance = new ModelService();
    }
    return ModelService.instance;
  }

  /**
   * Set or update the API key
   */
  public setApiKey(apiKey: string): void {
    this.apiKey = apiKey;
  }

  /**
   * Run OpenAI API call with streaming support
   */
  public async run(
    prompt: string,
    options?: {
      model?: string;
      temperature?: number;
      maxTokens?: number;
      systemPrompt?: string;
      onStream?: (chunk: string) => void;
    }
  ): Promise<string> {
    if (!this.apiKey) {
      throw new Error('OpenAI API key not set. Use setApiKey() or set VITE_OPENAI_API_KEY in .env');
    }

    const {
      model = 'gpt-4',
      temperature = 0.7,
      maxTokens = 1000,
      systemPrompt = 'You are a helpful assistant.',
      onStream
    } = options || {};

    try {
      logger.updateStatus('Sending request to OpenAI...');

      const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ];

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model,
          messages,
          temperature,
          max_tokens: maxTokens,
          stream: !!onStream
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`OpenAI API error: ${error.error?.message || response.statusText}`);
      }

      // Handle streaming response
      if (onStream && response.body) {
        return await this.handleStreamResponse(response, onStream);
      }

      // Handle non-streaming response
      const data = await response.json();
      const content = data.choices[0]?.message?.content || '';

      logger.updateStatus('OpenAI response received');
      return content;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('OpenAI API call failed', errorMessage);
      throw error;
    }
  }

  /**
   * Handle streaming response from OpenAI
   */
  private async handleStreamResponse(
    response: Response,
    onStream: (chunk: string) => void
  ): Promise<string> {
    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let fullContent = '';

    try {
      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(line => line.trim() !== '');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);

            if (data === '[DONE]') {
              logger.updateStatus('Stream completed');
              return fullContent;
            }

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices[0]?.delta?.content || '';

              if (content) {
                fullContent += content;
                onStream(content);
              }
            } catch (e) {
              // Skip invalid JSON
              continue;
            }
          }
        }
      }

      return fullContent;
    } catch (error) {
      logger.error('Stream reading failed', error);
      throw error;
    }
  }

  /**
   * Simple non-streaming call
   */
  public async chat(prompt: string, systemPrompt?: string): Promise<string> {
    return this.run(prompt, { systemPrompt });
  }

  /**
   * Check if API key is set
   */
  public hasApiKey(): boolean {
    return this.apiKey !== null && this.apiKey.length > 0;
  }
}

export default ModelService;