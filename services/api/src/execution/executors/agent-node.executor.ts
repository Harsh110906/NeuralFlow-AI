import { Injectable } from '@nestjs/common';
import {
  NodeExecutor,
  NodeExecutorContext,
  NodeExecutionResult,
} from '../interfaces/node.executor';
import { AgentService } from '../../agent/agent.service';

@Injectable()
export class AgentNodeExecutor implements NodeExecutor {
  constructor(private readonly agentService: AgentService) {}

  async execute(context: NodeExecutorContext): Promise<NodeExecutionResult> {
    try {
      const agentId = context.nodeData.agentId; // Assuming node configuration specifies which agent to run
      if (!agentId) {
        throw new Error('No agentId specified in Agent Node data');
      }

      const inputStr = JSON.stringify(context.inputs);
      const output = await this.agentService.runInference(agentId, inputStr);

      return {
        status: 'COMPLETED',
        output: { result: output.content },
        metrics: output.usage,
      };
    } catch (err: any) {
      return {
        status: 'FAILED',
        error: err.message || 'Unknown error during Agent execution',
      };
    }
  }
}
