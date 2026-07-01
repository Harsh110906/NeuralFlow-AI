import { Injectable, Logger } from '@nestjs/common';
import type { LLMProvider } from '../interfaces/llm.provider';
import { ConfigService } from '@nestjs/config';
import {
  ModelRouterService,
  TaskComplexity,
} from '../llm/model-router.service';
import { SecretService } from '../../workspace/secret.service';
import { CircuitBreakerService } from '../../reliability/circuit-breaker.service';
import OpenAI from 'openai';

@Injectable()
export class LiteLLMProvider implements LLMProvider {
  private readonly logger = new Logger(LiteLLMProvider.name);
  private openai: OpenAI;

  constructor(
    private configService: ConfigService,
    private modelRouter: ModelRouterService,
    private secretService: SecretService,
    private circuitBreaker: CircuitBreakerService,
  ) {
    const isLiteLLM = this.configService.get('LLM_PROVIDER') === 'litellm';

    this.openai = new OpenAI({
      baseURL: isLiteLLM
        ? this.configService.get('LITELLM_BASE_URL')
        : undefined,
      apiKey: isLiteLLM
        ? this.configService.get('LITELLM_API_KEY') || 'dummy-key'
        : this.configService.get('OPENAI_API_KEY') || 'dummy-key',
    });
  }

  async generate(
    prompt: string,
    systemPrompt?: string,
  ): Promise<import('../interfaces/llm.provider').LLMGenerationResult> {
    return this.circuitBreaker.execute('LLM_OpenAI', async () => {
      const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];

      if (systemPrompt) {
        messages.push({ role: 'system', content: systemPrompt });
      }
      messages.push({ role: 'user', content: prompt });

      try {
        const model = 'gpt-4o-mini';
        const response = await this.openai.chat.completions.create({
          model,
          messages,
        });

        const usage = response.usage;
        let estimatedCost = 0;
        if (usage) {
          // gpt-4o-mini pricing: $0.150 / 1M input tokens, $0.600 / 1M output tokens
          estimatedCost =
            (usage.prompt_tokens / 1_000_000) * 0.15 +
            (usage.completion_tokens / 1_000_000) * 0.6;
        }

        return {
          content: response.choices[0].message.content || '',
          usage: usage
            ? {
                promptTokens: usage.prompt_tokens,
                completionTokens: usage.completion_tokens,
                totalTokens: usage.total_tokens,
                model,
                estimatedCost,
              }
            : undefined,
        };
      } catch (error) {
        console.error('LLM generation error:', error);
        throw error;
      }
    });
  }

  async *stream(
    prompt: string,
    systemPrompt?: string,
  ): AsyncIterableIterator<string> {
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];

    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }
    messages.push({ role: 'user', content: prompt });

    try {
      const model = 'gpt-4o-mini';

      // Heuristics for complexity:
      let complexity: TaskComplexity = 'COMPLEX';
      if (
        messages.length === 1 &&
        typeof messages[0].content === 'string' &&
        messages[0].content.length < 200
      ) {
        complexity = 'SIMPLE';
      }
      const routedModel = this.modelRouter.route(model, complexity);

      const stream = await this.openai.chat.completions.create({
        model: routedModel,
        messages,
        stream: true,
      });

      for await (const chunk of stream) {
        if (chunk.choices[0]?.delta?.content) {
          yield chunk.choices[0].delta.content;
        }
      }
    } catch (error) {
      console.error('LLM streaming error:', error);
      throw error;
    }
  }

  async embed(text: string): Promise<number[]> {
    try {
      const response = await this.openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: text,
      });
      return response.data[0].embedding;
    } catch (error) {
      console.error('LLM embedding error:', error);
      throw error;
    }
  }
}
