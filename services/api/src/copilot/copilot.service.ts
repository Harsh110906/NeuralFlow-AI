import { Injectable, Inject } from '@nestjs/common';
import type { LLMProvider } from '../execution/interfaces/llm.provider';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CopilotService {
  constructor(
    @Inject('LLMProvider') private readonly llmProvider: LLMProvider,
    private readonly prisma: PrismaService,
  ) {}

  async chatStream(
    message: string,
    history: any[] = [],
  ): Promise<AsyncIterableIterator<string>> {
    // Basic system prompt for the Neural Copilot
    const systemPrompt = `You are Neural Copilot, an AI assistant for the NeuralFlow platform.
Your goal is to help users build workflows, understand agents, and reduce costs.
Keep your answers helpful and concise.`;

    // Flatten history for simplicity if needed, or just append the user message
    const prompt = message;

    // We assume stream() is implemented in the provider
    if (!this.llmProvider.stream) {
      throw new Error('LLM Provider does not support streaming');
    }

    return this.llmProvider.stream(prompt, systemPrompt);
  }

  async generateWorkflowSpec(prompt: string) {
    const systemPrompt = `You are a Workflow Architect. Given a user's prompt, generate a JSON specification for an AI workflow.
The JSON must have the following structure:
{
  "name": "string (Short title)",
  "goal": "string (Summary of what it does)",
  "agents": [{ "name": "string", "role": "string", "systemPrompt": "string" }],
  "tools": [{ "name": "string", "description": "string" }],
  "steps": [{ "id": "string", "type": "trigger|agent|tool|logic", "label": "string", "agentName": "string (optional)", "dependsOn": ["string"] }]
}
Respond ONLY with valid JSON.`;

    const result = await this.llmProvider.generate(prompt, systemPrompt);
    try {
      const spec = JSON.parse(
        result.content
          .replace(/```json/g, '')
          .replace(/```/g, '')
          .trim(),
      );
      return spec;
    } catch (err) {
      throw new Error('Failed to parse Workflow Spec JSON');
    }
  }

  async compileWorkflowDAG(workspaceId: string, spec: any) {
    // 2. Build DAG
    const nodes: any[] = [];
    const edges: any[] = [];

    let yPos = 50;
    for (const step of spec.steps || []) {
      const nodeId = step.id;
      const data: any = { label: step.label };

      if (step.type === 'agent') {
        const matchingAgent = (spec.agents || []).find(
          (a: any) => a.name === step.agentName,
        );
        if (matchingAgent) {
          data.overrideConfig = { systemPrompt: matchingAgent.systemPrompt };
        }
      }

      nodes.push({
        id: nodeId,
        type: step.type,
        position: { x: 250, y: yPos },
        data,
      });
      yPos += 150;

      for (const depId of step.dependsOn || []) {
        edges.push({
          id: `e-${depId}-${nodeId}`,
          source: depId,
          target: nodeId,
          type: 'smoothstep',
        });
      }
    }

    return {
      name: spec.name,
      description: spec.goal,
      dagJson: { nodes, edges },
      agents: [], // Agents are now local overrides, no DB records created
    };
  }
}
