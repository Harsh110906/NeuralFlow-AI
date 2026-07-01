export async function executeNodeActivity(
  executionId: string,
  nodeId: string,
  nodeData: any,
): Promise<any> {
  // We'll wire this up to the NestJS ExecutionRunner or execute it directly here.
  console.log(
    `[Temporal Activity] Executing node ${nodeId} for execution ${executionId}`,
  );

  // Simulate work
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ status: 'success', output: `Output from ${nodeId}` });
    }, 1000);
  });
}
