import {AdminContainer} from "./AdminContainer";
import {
    api,
    appProps,
    brandingProps,
    cleanUp,
    doClick, ErrorState,
    findButton,
    iocProps,
    renderApp,
    TestContext
} from "../../helpers/tests";
import {SocketAdmin} from "./SocketAdmin";
import {createTemporaryId} from "../../helpers/projection";
import {WebSocketDto} from "../../interfaces/models/dtos/Live/WebSocketDto";
import {IClientActionResultDto} from "../common/IClientActionResultDto";
import {ILiveApi} from "../../interfaces/apis/ILiveApi";

describe('SocketAdmin', () => {
    let context: TestContext;
    let reportedError: ErrorState;
    let allSockets: WebSocketDto[];
    let closedSocket: string | null;
    let apiResult: IClientActionResultDto<WebSocketDto> | null;
    let getSocketsApiResult: IClientActionResultDto<WebSocketDto[]> | null;

    const liveApi = api<ILiveApi>({
        getAll: async () => {
            return getSocketsApiResult || {
                success: true,
                result: allSockets,
            };
        },
        close: async (id: string) => {
            closedSocket = id;
            return apiResult || { success: true };
        },
    });

    afterEach(async () => {
        await cleanUp(context);
    });

    beforeEach(() => {
        reportedError = new ErrorState();
        allSockets = [];
        closedSocket = null;
        apiResult = null;
        getSocketsApiResult = null;
    });

    async function renderComponent() {
        context = await renderApp(
            iocProps({liveApi}),
            brandingProps(),
            appProps({
                account: {},
                appLoading: false,
            }, reportedError),
            (<AdminContainer tables={[]} accounts={[]}>
                <SocketAdmin/>
            </AdminContainer>));
    }

    describe('renders', () => {
        it('when there are no open sockets', async () => {
            await renderComponent();

            expect(context.container.textContent).toContain('No open sockets');
        });

        it('when sockets cannot be retrieved', async () => {
            getSocketsApiResult = {
                success: false,
                errors: [
                    'ERROR 1',
                    'ERROR 2',
                ],
            };

            await renderComponent();

            reportedError.verifyErrorEquals('ERROR 1,ERROR 2')
        });

        it('open socket for logged out user', async () => {
            const socket = {
                id: createTemporaryId(),
                connected: '2023-11-08T10:06:21+00:00',
                lastReceipt: '2023-11-08T10:07:21+00:00',
                receivedMessages: 1,
                sentMessages: 2,
            };
            allSockets = [ socket ];

            await renderComponent();

            const socketItem = context.container.querySelector('li[title="' + socket.id + '"]')!;
            expect(socketItem.textContent).toContain('Logged out user');
            expect(socketItem.textContent).toContain('▶ 10:06:21');
            expect(socketItem.textContent).toContain('⬆ 1');
            expect(socketItem.textContent).toContain('⬇ 2');
        });

        it('when socket has no connected value', async () => {
            const socket = {
                id: createTemporaryId(),
                connected: '',
                lastReceipt: '2023-11-08T10:07:21+00:00',
                receivedMessages: 1,
                sentMessages: 2,
            };
            allSockets = [ socket ];

            await renderComponent();

            const socketItem = context.container.querySelector('li[title="' + socket.id + '"]')!;
            expect(socketItem.textContent).toContain('▶ -');
        });

        it('open socket for logged in user', async () => {
            const socket = {
                id: createTemporaryId(),
                userName: 'USER',
                connected: '2023-11-08T10:06:21+00:00',
                lastReceipt: '2023-11-08T10:07:21+00:00',
                receivedMessages: 1,
                sentMessages: 0,
            };
            allSockets = [ socket ];

            await renderComponent();

            const socketItem = context.container.querySelector('li[title="' + socket.id + '"]')!;
            expect(socketItem.textContent).toContain('USER');
        });

        it('open socket with sent data', async () => {
            const socket = {
                id: createTemporaryId(),
                connected: '2023-11-08T10:06:21+00:00',
                lastReceipt: '2023-11-08T10:07:21+00:00',
                lastSent: '2023-11-08T10:08:21+00:00',
                receivedMessages: 1,
                sentMessages: 2,
            };
            allSockets = [ socket ];

            await renderComponent();

            const socketItem = context.container.querySelector('li[title="' + socket.id + '"]')!;
            expect(socketItem.textContent).toContain('⬇ 2');
        });

        it('open sockets in connected descending order', async () => {
            const socket1 = {
                id: createTemporaryId(),
                connected: '2023-11-08T10:06:21+00:00',
                lastReceipt: '2023-11-08T10:07:21+00:00',
                receivedMessages: 1,
                sentMessages: 0,
            };
            const socket2 = {
                id: createTemporaryId(),
                connected: '2023-12-08T10:06:21+00:00',
                lastReceipt: '2023-12-08T10:07:21+00:00',
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
            expect(reportedError.error).toEqual('ERROR');
        });
    });
});