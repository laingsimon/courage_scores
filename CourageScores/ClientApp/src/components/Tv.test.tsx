import {
    api,
    appProps,
    brandingProps,
    cleanUp,
    iocProps,
    renderApp,
    TestContext,
    user,
} from '../helpers/tests.tsx';
import { Tv } from './Tv.tsx';
import { ILiveApi } from '../interfaces/apis/ILiveApi.ts';
import { WatchableDataDto } from '../interfaces/models/dtos/Live/WatchableDataDto.ts';
import { createTemporaryId } from '../helpers/projection.ts';
import { LiveDataType } from '../interfaces/models/dtos/Live/LiveDataType.ts';
import { PublicationMode } from '../interfaces/models/dtos/Live/PublicationMode.ts';
import { IAppContainerProps } from './common/AppContainer.tsx';
import { AccessOption } from '../interfaces/models/dtos/Identity/AccessOption.ts';

describe('Tv', () => {
    let context: TestContext;
    let request: {
        type: string;
    } | null;
    let connections: WatchableDataDto[] = [];

    const liveApi = api<ILiveApi>({
        async watch(type: string): Promise<WatchableDataDto[]> {
            request = {
                type: type,
            };
            return connections;
        },
    });

    afterEach(async () => {
        await cleanUp(context);
    });

    beforeEach(() => {
        connections = [];
        request = null;
    });

    async function renderComponent(appProps: IAppContainerProps) {
        context = await renderApp(
            iocProps({ liveApi }),
            brandingProps(),
            appProps,
            <Tv />,
        );
    }

    describe('when logged out', () => {
        it('renders login link', async () => {
            await renderComponent(appProps());

            expect(context.text()).toContain('Login');
        });

        it('does not request links', async () => {
            await renderComponent(appProps());

            expect(request).toBeNull();
        });
    });

    describe('when not permitted', () => {
        const account = user();

        it('does not render login link', async () => {
            await renderComponent(appProps({ account }));

            expect(context.text()).not.toContain('Login');
        });

        it('renders no access', async () => {
            await renderComponent(appProps({ account }));

            expect(context.text()).toContain('No access');
        });

        it('does not request links', async () => {
            await renderComponent(appProps({ account }));

            expect(request).toBeNull();
        });
    });

    describe('when permitted', () => {
        const account = user([AccessOption.useWebSockets]);

        it('requests links', async () => {
            await renderComponent(appProps({ account }));

            expect(request).toEqual({
                type: '',
            });
        });

        it('renders connections with tournament event details', async () => {
            connections = [
                {
                    id: createTemporaryId(),
                    dataType: LiveDataType.tournament,
                    absoluteUrl: 'http://somewhere/match/ID',
                    relativeUrl: '/match/ID',
                    eventDetails: {
                        type: 'TYPE',
                        venue: 'VENUE',
                    },
                    lastUpdate: '',
                },
            ];

            await renderComponent(appProps({ account }));

            const items = context.all('.list-group-item');
            expect(items.map((i) => i.text())).toEqual(['🏆 TYPE at VENUE']);
        });

        it('renders connections with sayg and tournament event details', async () => {
            connections = [
                {
                    id: createTemporaryId(),
                    dataType: LiveDataType.sayg,
                    absoluteUrl: 'http://somewhere/match/ID',
                    relativeUrl: '/match/ID',
                    eventDetails: {
                        type: 'TYPE',
                        venue: 'VENUE',
                        opponents: ['CHALLENGER', 'OPPONENT'],
                    },
                    lastUpdate: '',
                },
            ];

            await renderComponent(appProps({ account }));

            const items = context.all('.list-group-item');
            expect(items.map((i) => i.text())).toEqual([
                '🎯 CHALLENGER vs OPPONENT at VENUE',
            ]);
        });

        it('renders connections with sayg event details but no tournament event details', async () => {
            connections = [
                {
                    id: createTemporaryId(),
                    dataType: LiveDataType.sayg,
                    absoluteUrl: 'http://somewhere/match/ID',
                    relativeUrl: '/match/ID',
                    eventDetails: {
                        opponents: ['CHALLENGER', 'OPPONENT'],
                    },
                    lastUpdate: '',
                },
            ];

            await renderComponent(appProps({ account }));

            const items = context.all('.list-group-item');
            expect(items.map((i) => i.text())).toEqual([
                '🎯 CHALLENGER vs OPPONENT',
            ]);
        });

        it('renders connections with absolute urls', async () => {
            connections = [
                {
                    id: createTemporaryId(),
                    dataType: LiveDataType.sayg,
                    absoluteUrl: 'http://somewhere/match/ID',
                    relativeUrl: '/match/ID',
                    lastUpdate: '',
                },
            ];

            await renderComponent(appProps({ account }));

            const items = context.all('.list-group-item');
            expect(
                items.map((i) => i.element<HTMLAnchorElement>().href),
            ).toEqual(['http://somewhere/match/ID']);
        });

        it('renders connections with only relative urls', async () => {
            connections = [
                {
                    id: createTemporaryId(),
                    dataType: LiveDataType.sayg,
                    relativeUrl: '/match/ID',
                    lastUpdate: '',
                },
            ];

            await renderComponent(appProps({ account }));

            const items = context.all('.list-group-item');
            expect(
                items.map((i) => i.element<HTMLAnchorElement>().href),
            ).toEqual(['http://localhost/match/ID']);
        });

        it('renders websocket connections', async () => {
            connections = [
                {
                    id: createTemporaryId(),
                    dataType: LiveDataType.sayg,
                    relativeUrl: '/match/ID',
                    publicationMode: PublicationMode.webSocket,
                    lastUpdate: '2024-02-26T11:27:07+00:00',
                },
            ];

            await renderComponent(appProps({ account }));

            const item = context.required('.list-group-item');
            const badge = item.required('.badge');
            expect(badge.className()).toEqual('badge rounded-pill bg-primary');
            expect(badge.text()).toEqual(
                ' @ ' +
                    new Date('2024-02-26T11:27:07+00:00').toLocaleTimeString(),
            );
        });

        it('renders polling connections', async () => {
            connections = [
                {
                    id: createTemporaryId(),
                    dataType: LiveDataType.sayg,
                    relativeUrl: '/match/ID',
                    publicationMode: PublicationMode.polling,
                    lastUpdate: '2024-02-26T11:27:07+00:00',
                },
            ];

            await renderComponent(appProps({ account }));

            const item = context.required('.list-group-item');
            const badge = item.required('.badge');
            expect(badge.className()).toEqual(
                'badge rounded-pill bg-secondary',
            );
            expect(badge.text()).toEqual(
                ' @ ' +
                    new Date('2024-02-26T11:27:07+00:00').toLocaleTimeString(),
            );
        });

        it('renders sayg connections', async () => {
            connections = [
                {
                    id: createTemporaryId(),
                    dataType: LiveDataType.sayg,
                    relativeUrl: '/match/ID',
                    lastUpdate: '',
                },
            ];

            await renderComponent(appProps({ account }));

            const item = context.required('.list-group-item');
            expect(item.text()).toContain('Live match');
        });

        it('renders tournament connections', async () => {
            connections = [
                {
                    id: createTemporaryId(),
                    dataType: LiveDataType.tournament,
                    relativeUrl: '/match/ID',
                    lastUpdate: '',
                },
            ];

            await renderComponent(appProps({ account }));

            const item = context.required('.list-group-item');
            expect(item.text()).toContain('Tournament');
        });

        it('renders connections without last update', async () => {
            connections = [
                {
                    id: createTemporaryId(),
                    dataType: LiveDataType.sayg,
                    relativeUrl: '/match/ID',
                    lastUpdate: '',
                },
            ];

            await renderComponent(appProps({ account }));

            const item = context.required('.list-group-item');
            expect(item.text()).toContain('Live match');
        });

        it('renders connections with unknown data type', async () => {
            connections = [
                {
                    id: createTemporaryId(),
                    dataType: 'foo',
                    relativeUrl: '/match/ID',
                    lastUpdate: '',
                },
            ];

            await renderComponent(appProps({ account }));

            const item = context.required('.list-group-item');
            expect(item.text()).toContain('foo');
        });
    });
});
