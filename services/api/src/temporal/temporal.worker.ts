import { Worker } from '@temporalio/worker';
import * as activities from './activities';

async function runWorker() {
  const worker = await Worker.create({
    workflowsPath: require.resolve('./workflows'),
    activities,
    taskQueue: 'neuralflow-execution-queue',
  });

  console.log('Starting Temporal Worker...');
  await worker.run();
}

runWorker().catch((err) => {
  console.error(err);
  process.exit(1);
});
