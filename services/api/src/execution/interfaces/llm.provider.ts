export interface LLMUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  model: string;
  estimatedCost: number;
}

export interface LLMGenerationResult {
  content: string;
  usage?: LLMUsage;
}

export interface LLMProvider {
  generate(prompt: string, systemPrompt?: string): Promise<LLMGenerationResult>;
  stream?(prompt: string, systemPrompt?: string): AsyncIterableIterator<string>;
  embed(text: string): Promise<number[]>;
}
