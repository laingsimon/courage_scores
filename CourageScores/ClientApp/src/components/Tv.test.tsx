import {
    api,
    appProps,
    brandingProps,
    cleanUp,
    doClick,
    findButton,
    iocProps,
    renderApp,
    TestContext
} from "../helpers/tests";
import {Tv} from "./Tv";
import {ILiveApi} from "../interfaces/apis/ILiveApi";
import {WatchableDataDto} from "../interfaces/models/dtos/Live/WatchableDataDto";
import {createTemporaryId} from "../helpers/projection";
import {LiveDataType} from "../interfaces/models/dtos/Live/LiveDataType";
import {PublicationMode} from "../interfaces/models/dtos/Live/PublicationMode";
import {IAppContainerProps} from "./common/AppContainer";
import {UserDto} from "../interfaces/models/dtos/Identity/UserDto";

describe('Tv', () => {
    let context: TestContext;
    let request: {
        type: string,
    };
    let connections: WatchableDataDto[] = [];

    const liveApi = api<ILiveApi>({
        async watch(type: string): Promise<WatchableDataDto[]> {
            request = {
                type: type
            };
            return connections;
        }
    });

    afterEach(() => {
        cleanUp(context);
    });

    beforeEach(() => {
        connections = [];
        request = null;
    })

    async function renderComponent(appProps: IAppContainerProps) {
        context = await renderApp(
            iocProps({liveApi}),
            brandingProps(),
            appProps,
            (<Tv/>));
    }

    describe('when logged out', () => {
        it('renders login link', async () => {
            await renderComponent(appProps());

            expect(context.container.textContent).toContain('Login');
        });

        it('does not render refresh', async () => {
            await renderComponent(appProps());

            expect(context.container.textContent).not.toContain('Refresh');
        });

        it('does not request links', async () => {
            await renderComponent(appProps());

            expect(request).toBeNull();
        });
    });

    describe('when not permitted', () => {
        const account: UserDto = {
            emailAddress: '',
            name: '',
            givenName: '',
            access: {
                useWebSockets: false,
            },
        };

        it('does not render login link', async () => {
            await renderComponent(appProps({account}));

            expect(context.container.textContent).not.toContain('Login');
        });

        it('does not render refresh', async () => {
            await renderComponent(appProps({account}));

            expect(context.container.textContent).not.toContain('Refresh');
        });

        it('renders no access', async () => {
            await renderComponent(appProps({account}));

            expect(context.container.textContent).toContain('No access');
        });

        it('does not request links', async () => {
            await renderComponent(appProps({account}));

            expect(request).toBeNull();
        });
    });

    describe('when permitted', () => {
        const account: UserDto = {
            emailAddress: '',
            name: '',
            givenName: '',
            access: {
                useWebSockets: true,
            },
        };

        it('requests links', async () => {
            await renderComponent(appProps({account}));

            expect(request).toEqual({
                type: ''
            });
        });

        it('renders connections with absolute urls', async () => {
            connections = [{
                id: createTemporaryId(),
                dataType: LiveDataType.sayg,
                absoluteUrl: 'http://somewhere/match/ID',
                relativeUrl: '/match/ID',
            }];

            await renderComponent(appProps({account}));

            const items = Array.from(context.container.querySelectorAll('.list-group-item')) as HTMLAnchorElement[];
            expect(items.map(i => i.href)).toEqual(['http://somewhere/match/ID']);
        });

        it('renders connections with only relative urls', async () => {
            connections = [{
                id: createTemporaryId(),
                dataType: LiveDataType.sayg,
                absoluteUrl: null,
                relativeUrl: '/match/ID',
            }];

            await renderComponent(appProps({account}));

            const items = Array.from(context.container.querySelectorAll('.list-group-item')) as HTMLAnchorElement[];
            expect(items.map(i => i.href)).toEqual(['http://localhost/match/ID']);
        });

        it('renders websocket connections', async () => {
            connections = [{
                id: createTemporaryId(),
                dataType: LiveDataType.sayg,
                relativeUrl: '/match/ID',
                publicationMode: PublicationMode.webSocket,
                lastUpdate: '2024-02-26T11:27:07+00:00',
            }];

            await renderComponent(appProps({account}));

            const item = context.container.querySelector('.list-group-item') as HTMLAnchorElement;
            expect(item.querySelector('.badge').className).toEqual('badge rounded-pill bg-primary');
            expect(item.querySelector('.badge').textContent).toEqual(' @ ' + new Date('2024-02-26T11:27:07+00:00').toLocaleTimeString());
        });

        it('renders polling connections', async () => {
            connections = [{
                id: createTemporaryId(),
                dataType: LiveDataType.sayg,
                relativeUrl: '/match/ID',
                publicationMode: PublicationMode.polling,
                lastUpdate: '2024-02-26T11:27:07+00:00',
            }];

            await renderComponent(appProps({account}));

            const item = context.container.querySelector('.list-group-item') as HTMLAnchorElement;
            expect(item.querySelector('.badge').className).toEqual('badge rounded-pill bg-secondary');
            expect(item.querySelector('.badge').textContent).toEqual(' @ ' + new Date('2024-02-26T11:27:07+00:00').toLocaleTimeString());
        });

        it('renders sayg connections', async () => {
            connections = [{
                id: createTemporaryId(),
                dataType: LiveDataType.sayg,
                relativeUrl: '/match/ID',
            }];

            await renderComponent(appProps({account}));

            const item = context.container.querySelector('.list-group-item') as HTMLAnchorElement;
            expect(item.textContent).toContain('Live match');
        });

        it('renders tournament connections', async () => {
            connections = [{
                id: createTemporaryId(),
                dataType: LiveDataType.tournament,
                relativeUrl: '/match/ID',
            }];

            await renderComponent(appProps({account}));

            const item = context.container.querySelector('.list-group-item') as HTMLAnchorElement;
            expect(item.textContent).toContain('Tournament');
        });

        it('renders connections without last update', async () => {
            connections = [{
                id: createTemporaryId(),
                dataType: LiveDataType.sayg,
                relativeUrl: '/match/ID',
            }];

            await renderComponent(appProps({account}));

            const item = context.container.querySelector('.list-group-item') as HTMLAnchorElement;
            expect(item.textContent).toContain('Live match');
        });

        it('renders connections with unknown data type', async () => {
            connections = [{
                id: createTemporaryId(),
                dataType: 'foo',
                relativeUrl: '/match/ID',
            }];

            await renderComponent(appProps({account}));

            const item = context.container.querySelector('.list-group-item') as HTMLAnchorElement;
            expect(item.textContent).toContain('foo');
        });

        it('can reload connections', async () => {
            await renderComponent(appProps({account}));
            request = null;

            connections = [{
                id: createTemporaryId(),
                dataType: 'foo',
                relativeUrl: '/match/ID',
            }];
            await doClick(findButton(context.container, 'Refresh'));

            expect(request).toEqual({
                type: ''
            });
            const items = Array.from(context.container.querySelectorAll('.list-group-item')) as HTMLAnchorElement[];
            expect(items.map(i => i.href)).toEqual(['http://localhost/match/ID']);
        });
    });
});