/* eslint-disable no-console */
/* eslint-disable import/no-internal-modules */
import './utils/env';
// Client for use; singleton
import {Connection, WorkflowClient, WorkflowStartOptions} from '@temporalio/client';

import {App, BlockElementAction, InteractiveAction, LogLevel, View} from '@slack/bolt';
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

// AppHome to show options;


// Listen for users opening your App Home
app.event('app_home_opened', async ({ event, client, logger }) => {
    try {
        // Call views.publish with the built-in client
        const result = await client.views.publish({
            // Use the user ID associated with the event
            user_id: event.user,
            view: {
                // Home tabs must be enabled in your app configuration page under "App Home"
                "type": "home",
                "blocks": [
                    {
                        "type": "section",
                        "text": {
                            "type": "mrkdwn",
                            "text": "*Welcome home, <@" + event.user + "> :house:*"
                        }
                    },
                    {
                        "type": "section",
                        "text": {
                            "type": "mrkdwn",
                            "text": "Pick an item from the dropdown list"
                        },
                        "accessory": {
                            "type": "static_select",
                            "placeholder": {
                                "type": "plain_text",
                                "text": "Select an item",
                                "emoji": true
                            },
                            "options": [
                                {
                                    "text": {
                                        "type": "plain_text",
                                        "text": "Breakglass Feature",
                                        "emoji": true
                                    },
                                    "value": "BREAKGLASS"
                                },
                                {
                                    "text": {
                                        "type": "plain_text",
                                        "text": "*this is plain_text text*",
                                        "emoji": true
                                    },
                                    "value": "value-1"
                                },
                                {
                                    "text": {
                                        "type": "plain_text",
                                        "text": "*this is plain_text text*",
                                        "emoji": true
                                    },
                                    "value": "value-2"
                                }
                            ],
                            "action_id": "homeapp-feature-action"
                        }
                    }
                ]
            }
        });

        // DEBUG
        // logger.info(result);
    }
    catch (error) {
        logger.error(error);
    }
});

// On button submit: regexp matches OK or CANCEL
app.action(/button-breakglass-action-/, async ({ack, payload, body}) => {

    // Do NOT ack if pre-req not met;
    await ack()

    console.log("USER: "  + body.user.id)
    console.error("PAYLOAD ==> " + JSON.stringify(payload))
    const act = JSON.parse(JSON.stringify(payload))
    // console.error("SELECTED: " + act.selected_option?.value)

    // if cancel; just redirect to home app again ..
    if (act.value == "CANCEL") {

    }

    // body has the block_actions ... state
    const mybod = JSON.parse(JSON.stringify(body))
    const opt = mybod.view.state.values.DOA.BEA.selected_option
    console.error(opt?.value)
    // console.error(mybod.view.blocks)

    // app.view('')

});


// On action: homeapp-feature-action
// Your listener function will be called every time an interactive component with the action_id "approve_button" is triggered
app.action('homeapp-feature-action', async ({ action, ack , logger, client , say, payload, respond, body, context}) => {
    await ack();
    // Replace the whole view ..

    console.log("USER: "  + body.user.id)
    const act = JSON.parse(JSON.stringify(payload))
    console.error("SELECTED: " + act.selected_option?.value)
    let view_content: View = {
        // Home tabs must be enabled in your app configuration page under "App Home"
        "type": "home",
        "blocks": [
            {
                "block_id": "invalid-block",
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": "*INVALID!!!*"
                }
            },
        ]
    }

    if (act.selected_option?.value == "BREAKGLASS") {
        view_content = {
        // Home tabs must be enabled in your app configuration page under "App Home"
        "type": "home",
        "blocks": [
            {
                "block_id": "pending-breakglass",
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": "*Pending BreakGlass Requests*"
                }
            },
            {
                "type": "divider"
            },
            {
                "type": "input",
                // "dispatch_action": true,
                "block_id": "DOA",
                "element": {
                    "action_id": "BEA",
                    "type": "static_select",
                    "placeholder": {
                        "type": "plain_text",
                        "text": "Select a group",
                        "emoji": true
                    },
                    "options": [
                        {
                            "text": {
                                "type": "plain_text",
                                "text": "GroupA",
                                "emoji": true
                            },
                            "value": "GroupA"
                        },
                        {
                            "text": {
                                "type": "plain_text",
                                "text": "GroupB",
                                "emoji": true
                            },
                            "value": "GroupB"
                        },
                        {
                            "text": {
                                "type": "plain_text",
                                "text": "GroupC",
                                "emoji": true
                            },
                            "value": "GroupC"
                        }
                    ],
                },
                "label": {
                    "type": "plain_text",
                    "text": "Group?",
                    "emoji": true
                }
            },
                    {
                        "block_id": "button-breakglass-action",
                        "type": "actions",
                        "elements": [
                            {
                                "type": "button",
                                "text": {
                                    "type": "plain_text",
                                    "emoji": true,
                                    "text": "Approve"
                                },
                                "style": "primary",
                                "value": "OK",
                                "action_id": "button-breakglass-action-1"
                            },
                            {
                                "type": "button",
                                "text": {
                                    "type": "plain_text",
                                    "emoji": true,
                                    "text": "Deny"
                                },
                                "style": "danger",
                                "value": "CANCEL",
                                "action_id": "button-breakglass-action-2"
                            }
                        ],
                    },
                ]
            }
    }

    try {

        // Call views.publish with the built-in client
        const result = await client.views.publish({
            // Use the user ID associated with the event
            user_id: body.user.id,
            view: view_content,
        });
        // DEBUG
        // logger.info(result);
    }
    catch (error) {
        logger.error(error);
    }


});

// On all the details filled in; time to start the process
app.action('', async ({ack, say, logger, client}) => {

    await ack()

    try {
        // See what is the payload ..
        // DEBUG
        // console.error(JSON.stringify(payload))

        // await client.channels.join({
        //     "name": "c-nops-approvers",
        // })

        // console.error(await client.channels.list())

        // STart the flow
        // let msgres = await client.chat.postMessage({
        //     "channel": 'c-nops-approvers',
        //     "text": "no tex",
        //     "blocks": [
        //         {
        //             "type": "section",
        //             "text": {
        //                 "type": "mrkdwn",
        //                 "text": "You have a new request:\n*<fakeLink.toEmployeeProfile.com|Fred Enriquez - New device request>*"
        //             }
        //         },
        //         {
        //             "type": "section",
        //             "fields": [
        //                 {
        //                     "type": "mrkdwn",
        //                     "text": "*Type:*\nComputer (laptop)"
        //                 },
        //                 {
        //                     "type": "mrkdwn",
        //                     "text": "*When:*\nSubmitted Aut 10"
        //                 },
        //                 {
        //                     "type": "mrkdwn",
        //                     "text": "*Last Update:*\nMar 10, 2015 (3 years, 5 months)"
        //                 },
        //                 {
        //                     "type": "mrkdwn",
        //                     "text": "*Reason:*\nAll vowel keys aren't working."
        //                 },
        //                 {
        //                     "type": "mrkdwn",
        //                     "text": "*Specs:*\n\"Cheetah Pro 15\" - Fast, really fast\""
        //                 }
        //             ]
        //         },
        //         {
        //             "type": "actions",
        //             "elements": [
        //                 {
        //                     "type": "button",
        //                     "text": {
        //                         "type": "plain_text",
        //                         "emoji": true,
        //                         "text": "Approve"
        //                     },
        //                     "style": "primary",
        //                     "value": "click_me_123"
        //                 },
        //                 {
        //                     "type": "button",
        //                     "text": {
        //                         "type": "plain_text",
        //                         "emoji": true,
        //                         "text": "Deny"
        //                     },
        //                     "style": "danger",
        //                     "value": "click_me_123"
        //                 }
        //             ]
        //         }
        //     ]
        // })
        // if (msgres.error) {
        //     console.error("***** ERR: **************")
        //     console.error(JSON.stringify(msgres.errors))
        // }

    } catch (error) {
        logger.error(error)
    }

});

//  and start BreakGlassInit Workflow; need sigfnal?
//  and home shows your pending requests ..
//  once result returned; render modal for BreakGlass Feature with template + props

// BreakGlass Modal click of button
//  and start BreakGlassCheck Workflow
//  once result returned; render output with details of timing in user friendly etc.
// app.view('',)

(async () => {
    // Start your app
    await app.start(Number(process.env.PORT) || 3000);

    console.log('?????? Bolt app is running!');
})();
