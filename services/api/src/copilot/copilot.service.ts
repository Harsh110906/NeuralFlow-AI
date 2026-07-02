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

  async generateWorkflowSpec(prompt: string, currentDagJson?: any) {
    const hasExistingGraph = currentDagJson && currentDagJson.nodes && currentDagJson.nodes.length > 0;
    
    let systemPrompt = `You are a Workflow Architect. Given a user's prompt, generate a JSON specification for an AI automation workflow.
The workflow supports these node types: 'trigger', 'agent', 'tool', 'logic'.
Subtypes for tools: 'email', 'webhook', 'wait'.
Config settings: 'draftMode' (boolean, default true for emails), 'emailProvider', 'systemPrompt', 'filterRules'.

You must return a structured patch/update model. Do NOT return the full graph if one exists, only operations.
The JSON MUST have the following structure:
{
  "name": "string (Short title)",
  "goal": "string (Summary of what it does)",
  "operations": [
    { 
      "type": "add_node", 
      "node": { 
        "id": "string", 
        "type": "trigger|agent|tool|logic", 
        "data": { "label": "string", "subType": "string", "config": {} } 
      } 
    },
    { "type": "update_node", "nodeId": "string", "data": { "config": {} } },
    { "type": "add_edge", "edge": { "id": "string", "source": "string", "target": "string" } },
    { "type": "remove_edge", "edgeId": "string" }
  ]
}
Respond ONLY with valid JSON.`;

    let finalPrompt = prompt;
    if (hasExistingGraph) {
      finalPrompt = `Current Graph:\n${JSON.stringify(currentDagJson)}\n\nUser Request: ${prompt}\n\nGenerate operations to patch this graph (e.g. insert a node, add edges).`;
    } else {
      finalPrompt = `User Request: ${prompt}\n\nGenerate operations to build this graph from scratch.`;
    }

    const result = await this.llmProvider.generate(finalPrompt, systemPrompt);
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

  async compileWorkflowDAG(workspaceId: string, spec: any, currentDagJson?: any) {
    const nodes: any[] = currentDagJson?.nodes ? [...currentDagJson.nodes] : [];
    const edges: any[] = currentDagJson?.edges ? [...currentDagJson.edges] : [];

    // Find the rightmost node to append horizontally
    let maxX = 50;
    for (const n of nodes) {
      if (n.position && n.position.x > maxX) {
        maxX = n.position.x;
      }
    }

    let xPos = maxX + 350;

    for (const op of spec.operations || []) {
      if (op.type === 'add_node') {
        nodes.push({
          id: op.node.id,
          type: op.node.type,
          position: { x: xPos, y: 150 }, // Horizontal layout
          data: op.node.data || {},
        });
        xPos += 350;
      } else if (op.type === 'update_node') {
        const node = nodes.find(n => n.id === op.nodeId);
        if (node) {
          node.data = { ...node.data, ...op.data };
        }
      } else if (op.type === 'add_edge') {
        edges.push({
          id: op.edge.id,
          source: op.edge.source,
          target: op.edge.target,
          type: 'smoothstep',
        });
      } else if (op.type === 'remove_edge') {
        const idx = edges.findIndex(e => e.id === op.edgeId);
        if (idx !== -1) edges.splice(idx, 1);
      }
    }

    return {
      name: spec.name || 'Generated Workflow',
      description: spec.goal || '',
      dagJson: { nodes, edges },
      agents: [], 
    };
  }
}
