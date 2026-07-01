import { Injectable } from '@nestjs/common';
import {
  NodeExecutor,
  NodeExecutorContext,
  NodeExecutionResult,
} from '../interfaces/node.executor';

@Injectable()
export class TriggerNodeExecutor implements NodeExecutor {
  async execute(context: NodeExecutorContext): Promise<NodeExecutionResult> {
    return {
      status: 'COMPLETED',
      output: { triggered: true, timestamp: new Date().toISOString() },
    };
  }
}
