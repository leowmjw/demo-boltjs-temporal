/* eslint-disable no-console */
/* eslint-disable import/no-internal-modules */
import './utils/env';
// Client for use; singleton
import {Connection, WorkflowClient, WorkflowStartOptions} from '@temporalio/client';

import {App, BlockElementAction, InteractiveAction, LogLevel, View} from '@slack/bolt';
import { Actions, Blocks, Button, Context, DateString, Divider, Markdown, MdSection, User } from '@slack-wrench/blocks';

import { isGenericMessageEvent } from './utils/helpers';

const app = new App({
    token: process.env.SLACK_BOT_TOKEN,
    signingSecret: process.env.SLACK_SIGNING_SECRET,
    socketMode: true, // add this
    appToken: process.env.SLACK_APP_TOKEN, // add this
    // logLevel: LogLevel.DEBUG,
    customRoutes: [
        {
            path: '/health-check',
            method: ['GET'],
            handler: (req, res) => {
                res.writeHead(200);
                res.end('Health check information displayed here!');
            },
        },
    ],
});

// Heavyweight client
const conn = new Connection()
// How to handle errors??
const client = new WorkflowClient(conn.service, {
    namespace: "default",
});

// Listen for users opening your App Home
app.event('app_home_opened', async ({ event, client, logger }) => {
    try {
        // Call views.publish with the built-in client
        const result = await client.views.publish({
            // Use the user ID associated with the event
            user_id: event.user,
            "view": {
                "type": "home",
                "blocks": [],
            }
        });

    } catch (e) {
        console.error("UNKNOWN: " + e)
    }

});

(async () => {
    // Start your app
    await app.start(Number(process.env.PORT) || 3000);

    console.log('⚡️ Bolt app is running!');
})();