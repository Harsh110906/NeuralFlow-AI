import { Injectable } from '@nestjs/common';
import { LLMProvider } from '../interfaces/llm.provider';

@Injectable()
export class MockLLMProvider implements LLMProvider {
  async generate(
    prompt: string,
    systemPrompt?: string,
  ): Promise<import('../interfaces/llm.provider').LLMGenerationResult> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          content: `MOCK RESPONSE: I am an AI Agent. You said: "${prompt}". System rules: "${systemPrompt || 'None'}"`,
          usage: {
            promptTokens: 10,
            completionTokens: 20,
            totalTokens: 30,
            model: 'mock-model',
            estimatedCost: 0,
          },
        });
      }, 1000); // simulate network delay
    });
  }

  async embed(text: string): Promise<number[]> {
    return [0.1, 0.2, 0.3];
  }
}
