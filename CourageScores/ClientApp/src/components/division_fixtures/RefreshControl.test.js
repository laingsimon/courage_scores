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
        socket: {},
    };

    beforeEach(() => {
        reportedError = null;
        webSocket.subscriptions = {};
    });

    afterEach(() => {
        cleanUp(context);
    });

    async function renderComponent(id, account) {
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
                account,
            },
            (<LiveContainer>
                <RefreshControl id={id} />
            </LiveContainer>));
    }

    describe('renders', () => {
        const account = {
            access: {
                useWebSockets: true,
            },
        };

        it('nothing when logged out', async () => {
            const id = createTemporaryId();
            webSocket.socket = {};

            await renderComponent(id);

            const menu = context.container.querySelector('.dropdown-menu');
            expect(menu).toBeFalsy();
        });

        it('nothing when not permitted', async () => {
            const id = createTemporaryId();
            webSocket.socket = {};

            await renderComponent(id, { access: {} });

            const menu = context.container.querySelector('.dropdown-menu');
            expect(menu).toBeFalsy();
        });

        it('options', async () => {
            const id = createTemporaryId();
            webSocket.socket = {};

            await renderComponent(id, account);

            const items = Array.from(context.container.querySelectorAll('.dropdown-menu .dropdown-item'));
            expect(items.map(li => li.textContent)).toEqual([ '⏸️ Paused', '▶️ Live' ]);
        });

        it('selected option', async () => {
            const id = createTemporaryId();
            webSocket.subscriptions[id] = true;
            webSocket.socket = {};

            await renderComponent(id, account);

            const selectedItem = context.container.querySelector('.dropdown-menu .dropdown-item.active')
            expect(selectedItem.textContent).toEqual('▶️ Live');
        });

        it('paused when disconnected', async () => {
            const id = createTemporaryId();
            webSocket.subscriptions[id] = true;
            webSocket.socket = null;

            await renderComponent(id, account);

            const selectedItem = context.container.querySelector('.dropdown-menu .dropdown-item.active')
            expect(selectedItem.textContent).toEqual('⏸️ Paused');
        });
    });

    describe('interactivity', () => {
        const account = {
            access: {
                useWebSockets: true,
            },
        };

        it('enables live', async () => {
            const id = createTemporaryId();

            await renderComponent(id, account);

            await doSelectOption(context.container.querySelector('.dropdown-menu'), '▶️ Live');

            expect(Object.keys(webSocket.subscriptions)).toEqual([id]);
        });

        it('disables live', async () => {
            const id = createTemporaryId();
            webSocket.subscriptions[id] = {};

            await renderComponent(id, account);

            await doSelectOption(context.container.querySelector('.dropdown-menu'), '⏸️ Paused');

            expect(webSocket.subscriptions).toEqual({});
        });
    })
});