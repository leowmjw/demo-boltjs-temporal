import { proxyActivities, sleep } from '@temporalio/workflow'
// Only import the activity types
import type * as activities from './activities'

const { simple_activity } = proxyActivities<typeof activities>({
    taskQueue: "typescript.queue",
    scheduleToCloseTimeout: '5 seconds'
    // startToCloseTimeout: '10 seconds'
})

/** A workflow that simply calls an activity */
export async function simple_workflow_ts(name: string): Promise<string> {
    // An error happened unexpectedly :(
    // let errorBoo = "Boo!!"
    // throw errorBoo
    // Trigger timeout
    // console.log(Date.now())
    // await sleep('10s') // Need to block if want to wait ..
    // console.log(Date.now())
    // Normal happy path ..
    return await simple_activity(name)
}