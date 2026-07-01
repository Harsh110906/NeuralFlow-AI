import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { ExecutionRunner } from './execution.runner';

@Processor('execution')
export class ExecutionWorker extends WorkerHost {
  constructor(private readonly executionRunner: ExecutionRunner) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    const { executionId, workflowId, dagJson } = job.data;
    console.log(`[ExecutionWorker] Processing execution ${executionId}`);

    try {
      await this.executionRunner.run(executionId, workflowId, dagJson);
    } catch (err) {
      console.error(`[ExecutionWorker] Execution ${executionId} failed`, err);
      throw err;
    }
  }
}
