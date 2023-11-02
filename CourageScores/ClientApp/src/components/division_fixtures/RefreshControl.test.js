// noinspection JSUnresolvedFunction

import {cleanUp, doSelectOption, renderApp} from "../../helpers/tests";
import React from "react";
import {RefreshControl} from "./RefreshControl";
import {LiveContainer} from "./LiveContainer";
import {createTemporaryId} from "../../helpers/projection";

describe('RefreshControl', () => {
    let context;
    let reportedError;
    let socketCreated;

    const liveApi = {
        createSocket: async () => {
            socketCreated = true;

            return {
                onmessage: () => {
                    // do nothing
                },
                send: () => {
                    // do nothing
                },
            };
        },
    };

    afterEach(() => {
        cleanUp(context);
    });

    async function renderComponent(liveProps) {
        reportedError = null;
        socketCreated = false;
        context = await renderApp(
            {liveApi},
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
                <RefreshControl />
            </LiveContainer>));
    }

    describe('renders', () => {
        it('options', async () => {
            await renderComponent({}, {});

            const items = Array.from(context.container.querySelectorAll('.dropdown-menu .dropdown-item'));
            expect(items.map(li => li.textContent)).toEqual([ '⏸️ Paused', '▶️ Live' ]);
        });

        it('selected option', async () => {
            await renderComponent({
                id: createTemporaryId(),
                enabledAtStartup: true,
                permitted: true,
                webSocket: {},
            });

            const selectedItem = context.container.querySelector('.dropdown-menu .dropdown-item.active')
            expect(selectedItem.textContent).toEqual('▶️ Live');
        });
    });

    describe('interactivity', () => {
        it('enables live', async () => {
            let socket;
            await renderComponent({
                id: createTemporaryId(),
                enabledAtStartup: true,
                permitted: true,
                setWebSocket: (s) => { socket = s; }
            });

            await doSelectOption(context.container.querySelector('.dropdown-menu'), '▶️ Live');

            expect(socketCreated).toEqual(true);
            expect(socket).not.toBeNull();
        });

        it('disables live', async () => {
            let socket;
            let socketClosed;
            await renderComponent({
                id: createTemporaryId(),
                enabledAtStartup: true,
                permitted: true,
                setWebSocket: (s) => { socket = s; },
                webSocket: {
                    close: () => {
                        socketClosed = true;
                    }
                },
            });

            await doSelectOption(context.container.querySelector('.dropdown-menu'), '⏸️ Paused');

            expect(socketClosed).toEqual(true);
            expect(socket).toBeNull();
        });
    })
});