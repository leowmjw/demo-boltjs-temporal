/* eslint-disable no-console */
/* eslint-disable import/no-internal-modules */
import './utils/env';
// Client for use; singleton
import {Connection, WorkflowClient, WorkflowStartOptions} from '@temporalio/client';

import {App, AppHomeOpenedEvent, BlockElementAction, InteractiveAction, KnownBlock, LogLevel, View} from '@slack/bolt';
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

    // DEBUG
    // console.error("testo ..")
    // console.log("USER: "  + body.user.id)
    // console.error("PAYLOAD ==> " + JSON.stringify(payload))
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
    const duration = mybod.view.state.values["input-duration"]["static-select-duration"].selected_option
    console.error("DURATION: " + duration?.value)
    // app.view('')

});

// Dynnamically render the view ..
function render_app_home_view(event :AppHomeOpenedEvent) :View {
    return {
        type: "home",
        blocks: HomeBlocks(
            [
                DividerBlock("div2"),
                MdSection(`*Welcome home, ${User(event.user)} :house:*`, {
                    accessory: Button('Search', 'changeSearch'),
                }),
                Divider("div1"),
                Context([
                    Markdown(
                        `120 members\nLast post: ${DateString(1575643433, '{date_pretty}', '1575643433')}`,
                    ),
                ]),
                InputBlock("Groups?",
                    StaticSelect("static-select-group-action", "placeholder ...",
                        [
                            OptionObject("GroupA", "GroupA"),
                            OptionObject("GroupB", "GroupB"),
                            OptionObject("GroupC", "GroupC"),
                        ],
                        OptionObject("GroupB", "GroupB"),
                    ), "input-group", PlainTextElement(":smile:", true), false,
                ),
                InputBlock("Duration?",
                    StaticSelect("static-select-duration", "placeholder ...",
                        [
                            OptionObject("10 min", "600"),
                            OptionObject("4 hours", "14400"),
                            OptionObject("8 hours", "28800"),
                        ],
                        OptionObject("10 min", "600"),
                    ), "input-duration", PlainTextElement(":cry:", true), false,
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
        private_metadata: "secrettzz",
    }
}
// Listen for users opening your App Home
app.event('app_home_opened', async ({ event, client, logger }) => {
    try {
        const v = render_app_home_view(event)
        // DEBUG
        // console.error("META:" + v.private_metadata + " EXTID: " + v.external_id + " CALLID: " + v.callback_id)
        // console.error(v.blocks)
        // Call views.publish with the built-in client
        const result = await client.views.publish({
            // Use the user ID associated with the event
            user_id: event.user,
            view: v,
        });
        // Catch unexpected publish errors?
        if (!result.ok) {
            console.error("PUB_ERR: " + result.error + " METADATA: " + result.response_metadata)
        }
    } catch (e) {
        console.error("UNKNOWN: " + e)
    }

});

(async () => {
    // Start your app
    await app.start(Number(process.env.PORT) || 3000);

    console.log('⚡️ Bolt app is running!');
})();
