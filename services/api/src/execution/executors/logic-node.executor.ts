import { Injectable } from '@nestjs/common';
import {
  NodeExecutor,
  NodeExecutorContext,
  NodeExecutionResult,
} from '../interfaces/node.executor';

@Injectable()
export class LogicNodeExecutor implements NodeExecutor {
  async execute(context: NodeExecutorContext): Promise<NodeExecutionResult> {
    // For Phase 4, a simple pass-through or basic boolean evaluation
    return {
      status: 'COMPLETED',
      output: { evaluated: true, decision: 'default_path' },
    };
  }
}
