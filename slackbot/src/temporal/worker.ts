import { Worker } from '@temporalio/worker';
import * as activities from './activities';

export async function ts_worker_run() {
    // Step 1: Register Workflows and Activities with the Worker and connect to
    // the Temporal server.
    const worker = await Worker.create({
        workflowsPath: require.resolve('./workflows'),
        activities,
        taskQueue: 'tutorial',
    });
    // Worker connects to localhost by default and uses console.error for logging.
    // Customize the Worker by passing more options to create():
    // https://typescript.temporal.io/api/classes/worker.Worker

    // If you need to configure server connection parameters, see the mTLS example:
    // https://github.com/temporalio/samples-typescript/tree/main/hello-world-mtls

    // Step 2: Start accepting tasks on the `tutorial` queue
    // await worker.run();
    worker.run()

    const worker2 = await Worker.create({
        taskQueue: 'typescript.queue',
        activities,
        workflowsPath: require.resolve('./workflows'),
        shutdownGraceTime: 5000,
        maxConcurrentWorkflowTaskPolls: 20,
        maxConcurrentActivityTaskPolls: 20
    })
    // You may create multiple Workers in a single process in order to poll on multiple task queues.
    // await worker2.run()
    worker2.run()
}
