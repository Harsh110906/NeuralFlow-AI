export interface NodeExecutionResult {
  status: 'COMPLETED' | 'FAILED' | 'PAUSED';
  output?: Record<string, any>;
  error?: string;
  metrics?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
    model?: string;
    estimatedCost?: number;
  };
  nextNodeIds?: string[]; // Determines branching logic
}

export interface NodeExecutorContext {
  executionId: string;
  workflowId: string;
  nodeId: string;
  nodeData: any;
  inputs: Record<string, any>; // Previous nodes' outputs
}

export interface NodeExecutor {
  execute(context: NodeExecutorContext): Promise<NodeExecutionResult>;
}
