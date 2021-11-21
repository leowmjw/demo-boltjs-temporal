/* eslint-disable no-console */
/* eslint-disable import/no-internal-modules */
import './utils/env';
// Client for use; singleton
import {Connection, WorkflowClient, WorkflowStartOptions} from '@temporalio/client';

import { App, LogLevel } from '@slack/bolt';
import { isGenericMessageEvent } from './utils/helpers';

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  socketMode: true, // add this
  appToken: process.env.SLACK_APP_TOKEN, // add this
  // logLevel: LogLevel.DEBUG,
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
app.message('hello', async ({ message, say }) => {
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
    ],
    text: `Hey there <@${message.user}>!`,
  });
});

app.action('button_click', async ({ body, ack, say }) => {
  // Acknowledge the action
  await ack();
  await say(`<@${body.user.id}> clicked the button`);
  // Run the flow ..
  let wid;
  wid = body.user.id + "-42"
  console.log("Start WF: " + wid)
  const f = await client.start("SimpleWorkflow", {
    taskQueue: "catchnoactwf.queue",
    workflowId: wid
  })
  const g = await f.result()
  // DEBUG
  // console.log("RES: " + g.toString())
  await say("RES: for" +  `<@${body.user.id}>` + " is " + g)
});

(async () => {
  // Start your app
  await app.start(Number(process.env.PORT) || 3000);

  console.log('⚡️ Bolt app is running!');
})();
