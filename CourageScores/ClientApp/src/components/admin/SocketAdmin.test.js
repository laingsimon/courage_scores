// noinspection JSUnresolvedFunction

import {AdminContainer} from "./AdminContainer";
import React from "react";
import {cleanUp, doClick, findButton, renderApp} from "../../helpers/tests";
import {SocketAdmin} from "./SocketAdmin";
import {createTemporaryId} from "../../helpers/projection";

describe('SocketAdmin', () => {
    let context;
    let reportedError;
    let allSockets;
    let closedSocket;
    let apiResult;

    const liveApi = {
        getAll: async () => {
            return {
                success: true,
                result: allSockets,
            };
        },
        close: async (id) => {
            closedSocket = id;
            return apiResult || { success: true };
        },
    };

    afterEach(() => {
        cleanUp(context);
    });

    beforeEach(() => {
        reportedError = null;
        allSockets = [];
        closedSocket = null;
        apiResult = null;
    });

    async function renderComponent() {
        context = await renderApp(
            {liveApi},
            {name: 'Courage Scores'},
            {
                account: {},
                appLoading: false,
                onError: (err) => {
                    if (err.message) {
                        reportedError = {
                            message: err.message,
                            stack: err.stack
                        };
                    } else {
                        reportedError = err;
                    }
                }
            },
            (<AdminContainer>
                <SocketAdmin/>
            </AdminContainer>));
    }

    describe('renders', () => {
        it('when there are no open sockets', async () => {
            await renderComponent();

            expect(context.container.textContent).toContain('No open sockets');
        });

        it('open socket for logged out user', async () => {
            const socket = {
                id: createTemporaryId(),
                userName: null,
                connected: '2023-11-08T10:06:21+00:00',
                lastReceipt: '2023-11-08T10:07:21+00:00',
                receivedMessages: 1,
                sentMessages: 2,
                lastSent: null,
            };
            allSockets = [ socket ];

            await renderComponent();

            const socketItem = context.container.querySelector('li[title="' + socket.id + '"]');
            expect(socketItem.textContent).toContain('Logged out user');
            expect(socketItem.textContent).toContain('▶ 10:06:21');
            expect(socketItem.textContent).toContain('⬆ 1');
            expect(socketItem.textContent).toContain('⬇ 2');
        });

        it('open socket for logged in user', async () => {
            const socket = {
                id: createTemporaryId(),
                userName: 'USER',
                connected: '2023-11-08T10:06:21+00:00',
                lastReceipt: '2023-11-08T10:07:21+00:00',
                receivedMessages: 1,
                sentMessages: 0,
                lastSent: null,
            };
            allSockets = [ socket ];

            await renderComponent();

            const socketItem = context.container.querySelector('li[title="' + socket.id + '"]');
            expect(socketItem.textContent).toContain('USER');
        });

        it('open socket with sent data', async () => {
            const socket = {
                id: createTemporaryId(),
                userName: null,
                connected: '2023-11-08T10:06:21+00:00',
                lastReceipt: '2023-11-08T10:07:21+00:00',
                lastSent: '2023-11-08T10:08:21+00:00',
                receivedMessages: 1,
                sentMessages: 2,
            };
            allSockets = [ socket ];

            await renderComponent();

            const socketItem = context.container.querySelector('li[title="' + socket.id + '"]');
            expect(socketItem.textContent).toContain('⬇ 2');
        });

        it('open sockets in connected descending order', async () => {
            const socket1 = {
                id: createTemporaryId(),
                userName: null,
                connected: '2023-11-08T10:06:21+00:00',
                lastReceipt: '2023-11-08T10:07:21+00:00',
                lastSent: null,
                receivedMessages: 1,
                sentMessages: 0,
            };
            const socket2 = {
                id: createTemporaryId(),
                userName: null,
                connected: '2023-12-08T10:06:21+00:00',
                lastReceipt: '2023-12-08T10:07:21+00:00',
                lastSent: null,
                receivedMessages: 1,
                sentMessages: 0,
            };
            allSockets = [ socket1, socket2 ];

            await renderComponent();

            const socketItems = Array.from(context.container.querySelectorAll('li'));
            const ids = socketItems.map(li => li.getAttribute('title'));
            expect(ids).toEqual([ socket2.id, socket1.id ]);
        });
    });

    describe('interactivity', () => {
        it('can close a socket', async () => {
            const socket = {
                id: createTemporaryId(),
                userName: null,
                connected: '2023-11-08T10:06:21+00:00',
                lastReceipt: '2023-11-08T10:07:21+00:00',
                lastSent: '2023-11-08T10:08:21+00:00',
                receivedMessages: 1,
                sentMessages: 2,
            };
            allSockets = [ socket ];
            window.confirm = () => true;
            await renderComponent();

            await doClick(findButton(context.container, '🗑'));

            expect(closedSocket).toEqual(socket.id);
        });

        it('does not close a socket', async () => {
            const socket = {
                id: createTemporaryId(),
                userName: null,
                connected: '2023-11-08T10:06:21+00:00',
                lastReceipt: '2023-11-08T10:07:21+00:00',
                lastSent: '2023-11-08T10:08:21+00:00',
                receivedMessages: 1,
                sentMessages: 2,
            };
            allSockets = [ socket ];
            window.confirm = () => false;
            await renderComponent();

            await doClick(findButton(context.container, '🗑'));

            expect(closedSocket).toEqual(null);
        });

        it('reloads after closing a socket', async () => {
            const socketToDelete = {
                id: createTemporaryId(),
                userName: 'TO DELETE',
                connected: '2023-11-08T10:06:21+00:00',
                lastReceipt: '2023-11-08T10:07:21+00:00',
                lastSent: '2023-11-08T10:08:21+00:00',
                receivedMessages: 1,
                sentMessages: 2,
            };
            const newSocket = {
                id: createTemporaryId(),
                userName: 'NEW',
                connected: '2023-11-08T10:06:21+00:00',
                lastReceipt: '2023-11-08T10:07:21+00:00',
                lastSent: '2023-11-08T10:08:21+00:00',
                receivedMessages: 1,
                sentMessages: 2,
            };
            allSockets = [ socketToDelete ];
            window.confirm = () => true;
            await renderComponent();
            expect(context.container.textContent).toContain('TO DELETE');

            allSockets = [ newSocket ];
            await doClick(findButton(context.container, '🗑'));

            expect(context.container.textContent).toContain('NEW');
        });

        it('reports an error if socket cannot be closed', async () => {
            const socket = {
                id: createTemporaryId(),
                userName: null,
                connected: '2023-11-08T10:06:21+00:00',
                lastReceipt: '2023-11-08T10:07:21+00:00',
                lastSent: '2023-11-08T10:08:21+00:00',
                receivedMessages: 1,
                sentMessages: 2,
            };
            allSockets = [ socket ];
            window.confirm = () => true;
            apiResult = {
                success: false,
                errors: [ 'ERROR' ],
            };
            await renderComponent();

            await doClick(findButton(context.container, '🗑'));

            expect(closedSocket).toEqual(socket.id);
            expect(reportedError).toEqual('ERROR');
        });
    });
});