// noinspection JSUnresolvedFunction

import {cleanUp, doSelectOption, renderApp} from "../../helpers/tests";
import React from "react";
import {RefreshControl} from "./RefreshControl";
import {LiveContainer} from "./LiveContainer";
import {createTemporaryId} from "../../helpers/projection";

describe('RefreshControl', () => {
    let context;
    let reportedError;
    const webSocket = {
        subscriptions: {},
        subscribe: async (id) => {
            webSocket.subscriptions[id] = true;
        },
        unsubscribe: async (id) => {
            delete webSocket.subscriptions[id];
        },
    };

    beforeEach(() => {
        reportedError = null;
        webSocket.subscriptions = {};
    });

    afterEach(() => {
        cleanUp(context);
    });

    async function renderComponent(id, liveProps) {
        context = await renderApp(
            {webSocket},
            {name: 'Courage Scores'},
            {
                onError: (err) => {
                    reportedError = {
                        message: err.message,
                        stack: err.stack
                    };
                },
            },
            (<LiveContainer {...liveProps}>
                <RefreshControl id={id} />
            </LiveContainer>));
    }

    describe('renders', () => {
        it('options', async () => {
            const id = createTemporaryId();

            await renderComponent(id, { id });

            const items = Array.from(context.container.querySelectorAll('.dropdown-menu .dropdown-item'));
            expect(items.map(li => li.textContent)).toEqual([ '⏸️ Paused', '▶️ Live' ]);
        });

        it('selected option', async () => {
            const id = createTemporaryId();
            webSocket.subscriptions[id] = true;

            await renderComponent(id, { id });

            const selectedItem = context.container.querySelector('.dropdown-menu .dropdown-item.active')
            expect(selectedItem.textContent).toEqual('▶️ Live');
        });
    });

    describe('interactivity', () => {
        it('enables live', async () => {
            const id = createTemporaryId();

            await renderComponent(id, { id });

            await doSelectOption(context.container.querySelector('.dropdown-menu'), '▶️ Live');

            expect(Object.keys(webSocket.subscriptions)).toEqual([id]);
        });

        it('disables live', async () => {
            const id = createTemporaryId();
            webSocket.subscriptions[id] = {};

            await renderComponent(id, { id });

            await doSelectOption(context.container.querySelector('.dropdown-menu'), '⏸️ Paused');

            expect(webSocket.subscriptions).toEqual({});
        });
    })
});