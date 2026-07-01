import { Injectable, Inject } from '@nestjs/common';
import {
  NodeExecutor,
  NodeExecutorContext,
  NodeExecutionResult,
} from '../interfaces/node.executor';
import type { ToolProvider } from '../interfaces/tool.provider';

@Injectable()
export class ToolNodeExecutor implements NodeExecutor {
  constructor(
    @Inject('ToolProvider') private readonly toolProvider: ToolProvider,
  ) {}

  async execute(context: NodeExecutorContext): Promise<NodeExecutionResult> {
    try {
      const toolId = context.nodeData.toolId;
      if (!toolId) {
        throw new Error('No toolId specified in Tool Node data');
      }

      const output = await this.toolProvider.execute(toolId, context.inputs);

      return {
        status: 'COMPLETED',
        output,
      };
    } catch (err: any) {
      return {
        status: 'FAILED',
        error: err.message || 'Unknown error during Tool execution',
      };
    }
  }
}
