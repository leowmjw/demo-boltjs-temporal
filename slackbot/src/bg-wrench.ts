/* eslint-disable no-console */
/* eslint-disable import/no-internal-modules */
import './utils/env';
// Client for use; singleton
import {Connection, WorkflowClient, WorkflowStartOptions} from '@temporalio/client';

import {App, BlockElementAction, InteractiveAction, LogLevel, View} from '@slack/bolt';
import {
    Actions,
    Blocks,
    Button,
    Context,
    DateString,
    Divider, DividerBlock, HomeBlocks, InputBlock,
    Markdown,
    MdSection, OptionGroup, OptionObject, PlainTextElement, Section, SectionBlock,
    StaticSelect,
    User
} from '@slack-wrench/blocks';

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

// On button submit: regexp matches OK or CANCEL
app.action(/button-breakglass-action-/, async ({ack, payload, body}) => {

    // Do NOT ack if pre-req not met;
    await ack()

    console.error("testo ..")

    console.log("USER: "  + body.user.id)
    console.error("PAYLOAD ==> " + JSON.stringify(payload))
    const act = JSON.parse(JSON.stringify(payload))
    // console.error("SELECTED: " + act.selected_option?.value)

    // if cancel; just redirect to home app again ..
    if (act.value == "CANCEL") {

        console.error("You got CANCELED!!! ****")
    }

    // body has the block_actions ... state
    const mybod = JSON.parse(JSON.stringify(body))
    const opt = mybod.view.state.values["input-group"]["static-select-group-action"].selected_option
    console.error(opt?.value)
    // DEBUG
    // console.error(mybod.view.state.values)
    // console.error(mybod.view.blocks)

    // app.view('')

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
                "blocks": HomeBlocks(
             [
                        DividerBlock("div2"),
                        MdSection(Markdown("*Welcome home, " + User(event.user) + " :house:*").text),
                        Divider("div1"),
                        InputBlock("Groups?",
                            StaticSelect("static-select-group-action", "placeholder ...",
                            [
                                OptionObject("GroupA","GroupA"),
                                OptionObject("GroupB","GroupB"),
                                OptionObject("GroupC","GroupC"),
                            ],
                            OptionObject("GroupB","GroupB"),
                            ), "input-group", PlainTextElement(":smile:", true), true,
                        ),
                        Actions([
                            Button(':thumbsup:', 'button-breakglass-action-1', {
                                value: 'OK',
                            }),
                            Button(':thumbsdown:', 'button-breakglass-action-2', {
                                value: 'CANCEL',
                            }),
                        ]),
                    ],
                ),
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
