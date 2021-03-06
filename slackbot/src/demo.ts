/* eslint-disable no-console */
/* eslint-disable import/no-internal-modules */
import './utils/env';
// Client for use; singleton
import {Connection, WorkflowClient, WorkflowStartOptions} from '@temporalio/client';

import { App, LogLevel } from '@slack/bolt';
import { isGenericMessageEvent } from './utils/helpers';
import { ts_worker_run } from './temporal/worker'

const app = new App({
    token: process.env.SLACK_BOT_TOKEN,
    signingSecret: process.env.SLACK_SIGNING_SECRET,
    socketMode: true, // add this
    appToken: process.env.SLACK_APP_TOKEN, // add this
    logLevel: LogLevel.DEBUG,
});

// Heavyweight client
const conn = new Connection()
// How to handle errors??
const client = new WorkflowClient(conn.service, {
    namespace: "default",
});


// app.use(async ({ next }) => {
//   // TODO: This can be improved in future versions
//   // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
//   await next!();
// });

// Listens to incoming messages that contain "hello"
app.message('demo', async ({ message, say }) => {
    // Filter out message events with subtypes (see https://api.slack.com/events/message)
    // Is there a way to do this in listener middleware with current type system?
    if (!isGenericMessageEvent(message)) return;

    // say() sends a message to the channel where the event was triggered
    await say({
        blocks: [
            {
                type: 'section',
                text: {
                    type: 'mrkdwn',
                    text: `Hey there <@${message.user}>!`,
                },
                accessory: {
                    type: 'button',
                    text: {
                        type: 'plain_text',
                        text: 'Click Me',
                    },
                    action_id: 'button_click',
                },
            },
            {
                type: 'section',
                text: {
                    type: 'mrkdwn',
                    text: `Press for TypeScript demo!!`,
                },
                accessory: {
                    type: 'button',
                    text: {
                        type: 'plain_text',
                        text: 'Click TS',
                    },
                    action_id: 'button_click_ts',
                },
            }
        ],
        text: `ALT text!!`,
    });
});

app.action('button_click_ts', async ({ body, ack, say }) => {
    // Acknowledge the action
    await ack();
    await say(`<@${body.user.id}> clicked the TypeScript!!!`);
    // Run the flow ..
    let wid = body.user.id + "-simple"
    console.log("Start WF: " + wid)
    const f = await client.start("simple_workflow_ts", {
        taskQueue: "typescript.queue",
        workflowId: wid,
        args: [body.user.id],
    })
    const g = await f.result()
    // DEBUG
    // console.log("RES: " + g.toString())
    await say("RES: " +  `<@${body.user.id}>` + " - " + g.toString())
    // await say("RES: " +  `<@${body.user.id}>` + " - " + JSON.stringify(g, null, 2))
})

app.action('button_click', async ({ body, ack, say }) => {
    // Acknowledge the action
    await ack();
    await say(`<@${body.user.id}> clicked the button`);
    // Run the flow ..
    let wid;
    wid = body.user.id + "-42"
    console.log("Start WF: " + wid)
    const f = await client.start("ComplexWorkflow", {
        taskQueue: "catchnoactwf.queue",
        workflowId: wid,
        args: [{
            "Name": "bob"
        }],
    })
    const g = await f.result()
    // DEBUG
    // console.log("RES: " + g.toString())
    await say("RES: " +  `<@${body.user.id}>` + " - " + JSON.stringify(g, null, 2))
});

(async () => {
    // Start your app
    await app.start(Number(process.env.PORT) || 3000);

    console.log('?????? Bolt app is running!');
})();

(async () => {
    // await ts_worker_run() // need await
    ts_worker_run().catch((err) => {
        console.error(err);
        process.exit(1);
    });
    console.log("TS Workers are running!!")
})()
