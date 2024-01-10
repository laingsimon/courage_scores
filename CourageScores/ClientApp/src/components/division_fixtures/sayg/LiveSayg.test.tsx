// noinspection JSUnresolvedFunction

import {cleanUp, noop, renderApp} from "../../../helpers/tests";
import React from "react";
import {LiveSayg} from "./LiveSayg";
import {saygBuilder} from "../../../helpers/builders";

describe('LiveSayg', () => {
    let context;
    let requestedSaygId;
    let saygData;
    let reportedError;
    const saygApi = {
        get: (id) => {
            requestedSaygId = id;
            return saygData;
        }
    };
    const webSocket = {
        sent: [],
        subscriptions: {},
        socket: null,
        socketFactory: () => {
            const socket = {
                close: () => {},
                readyState: 1,
                send: (data) => {
                    const message = JSON.parse(data);
                    if (message.type === 'subscribed') {
                        webSocket.subscriptions[message.id] = true;
                    } else if (message.type === 'unsubscribed') {
                        delete webSocket.subscriptions[message.id];
                    }
                    webSocket.sent.push(message);
                }
            };
            webSocket.socket = socket;
            return socket;
        }
    };

    afterEach(() => {
        cleanUp(context);
    });

    async function renderComponent(route, currentPath) {
        requestedSaygId = null;
        reportedError = null;
        webSocket.socket = null;
        webSocket.subscriptions = {};
        webSocket.sent = [];
        context = await renderApp(
            {saygApi, socketFactory: webSocket.socketFactory},
            {name: 'Courage Scores'},
            {
                onError: (err) => {
                    reportedError = {
                        message: err.message,
                        stack: err.stack
                    };
                },
            },
            <LiveSayg />,
            route,
            currentPath);
    }

    it('requests given id', async () => {
        saygData = saygBuilder()
            .build();
        console.log = noop;

        await renderComponent('/live/match/:id', '/live/match/' + saygData.id);

        expect(reportedError).toBeNull();
        expect(requestedSaygId).toEqual(saygData.id);
    })
});