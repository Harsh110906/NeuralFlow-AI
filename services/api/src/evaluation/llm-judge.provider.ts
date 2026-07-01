import { Injectable, Inject } from '@nestjs/common';
import Ajv from 'ajv';

export interface JudgeOutput {
  score: number;
  confidence: number;
  reasoning: string;
}

@Injectable()
export class LLMJudgeProvider {
  private ajv = new Ajv();
  private schema = {
    type: 'object',
    properties: {
      score: { type: 'number', minimum: 0, maximum: 1 },
      confidence: { type: 'number', minimum: 0, maximum: 1 },
      reasoning: { type: 'string' },
    },
    required: ['score', 'confidence', 'reasoning'],
  };

  constructor(@Inject('LLMProvider') private llmProvider: any) {}

  async evaluate(
    input: any,
    output: string,
    rubric: string,
    model: string = 'gpt-4o',
    retries = 2,
  ): Promise<JudgeOutput> {
    const validate = this.ajv.compile(this.schema);

    const prompt = `
      You are an expert AI evaluator. Apply the following rubric to grade the output based on the input context.
      Rubric: ${rubric}
      Input: ${JSON.stringify(input)}
      Output to evaluate: ${output}
      
      You MUST return your response as a valid JSON object exactly matching this schema:
      {
        "score": number (0.0 to 1.0),
        "confidence": number (0.0 to 1.0),
        "reasoning": "string"
      }
      Do NOT wrap in markdown code blocks.
    `;

    for (let i = 0; i <= retries; i++) {
      try {
        const response = await this.llmProvider.chat(
          [{ role: 'system', content: prompt }],
          model,
          0.0,
        ); // Temperature 0 for deterministic evaluation

        const parsed = JSON.parse(
          response.content
            .replace(/```json/gi, '')
            .replace(/```/g, '')
            .trim(),
        ) as unknown as JudgeOutput;

        if (validate(parsed)) {
          return parsed;
        }
      } catch (e) {
        if (i === retries) {
          console.error('[LLMJudge] Failed to parse output after retries', e);
          throw new Error('LLM Judge failed to return valid structured output');
        }
      }
    }
    throw new Error('LLM Judge failed to return valid structured output');
  }
}
