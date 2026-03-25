import {
    appProps,
    brandingProps,
    cleanUp,
    iocProps,
    MockSocketFactory,
    noop,
    renderApp,
    TestContext,
} from '../../helpers/tests';
import { IRefreshControlProps, RefreshControl } from './RefreshControl';
import { LiveContainer, useLive } from '../../live/LiveContainer';
import { createTemporaryId } from '../../helpers/projection';
import { UserDto } from '../../interfaces/models/dtos/Identity/UserDto';
import { ILive } from '../../live/ILive';
import { act } from '@testing-library/react';
import { LiveDataType } from '../../interfaces/models/dtos/Live/LiveDataType';
import { ILiveOptions } from '../../live/ILiveOptions';

describe('RefreshControl', () => {
    let context: TestContext;
    let socketFactory: MockSocketFactory;
    let liveContainer: ILive | null;

    beforeEach(() => {
        liveContainer = null;
        socketFactory = new MockSocketFactory();
    });

    afterEach(async () => {
        await cleanUp(context);
    });

    async function renderComponent(
        props: IRefreshControlProps,
        account?: UserDto,
    ) {
        const liveOptions: ILiveOptions = {};

        context = await renderApp(
            iocProps({ socketFactory: socketFactory.createSocket }),
            brandingProps(),
            appProps({
                account,
            }),
            <LiveContainer liveOptions={liveOptions} onDataUpdate={noop}>
                <GetLiveContainer
                    onLoad={(live: ILive) => (liveContainer = live)}>
                    <RefreshControl {...props} />
                </GetLiveContainer>
            </LiveContainer>,
        );
    }

    describe('renders', () => {
        const account: UserDto = {
            emailAddress: '',
            name: '',
            givenName: '',
            access: {
                useWebSockets: true,
            },
        };

        it('nothing when logged out', async () => {
            const id = createTemporaryId();

            await renderComponent({ id, type: LiveDataType.sayg });

            expect(context.optional('.dropdown-menu')).toBeFalsy();
        });

        it('nothing when not permitted', async () => {
            const id = createTemporaryId();

            await renderComponent(
                { id, type: LiveDataType.sayg },
                { givenName: '', name: '', emailAddress: '', access: {} },
            );

            expect(context.optional('.dropdown-menu')).toBeFalsy();
        });

        it('options', async () => {
            const id = createTemporaryId();

            await renderComponent({ id, type: LiveDataType.sayg }, account);

            const items = context.all('.dropdown-menu .dropdown-item');
            expect(items.map((li) => li.text())).toEqual([
                '⏸️ Paused',
                '▶️ Live',
            ]);
        });

        it('selected option', async () => {
            const id = createTemporaryId();

            await renderComponent({ id, type: LiveDataType.sayg }, account);
            await act(async () => {
                await liveContainer!.enableLiveUpdates(true, {
                    id,
                    type: LiveDataType.sayg,
                });
            });
            expect(socketFactory.socketWasCreated()).toEqual(true);

            const selectedItem = context.required(
                '.dropdown-menu .dropdown-item.active',
            );
            expect(selectedItem.text()).toEqual('▶️ Live');
        });

        it('paused when disconnected', async () => {
            const id = createTemporaryId();

            await renderComponent({ id, type: LiveDataType.sayg }, account);

            const selectedItem = context.required(
                '.dropdown-menu .dropdown-item.active',
            );
            expect(selectedItem.text()).toEqual('⏸️ Paused');
        });
    });

    describe('interactivity', () => {
        const account: UserDto = {
            emailAddress: '',
            name: '',
            givenName: '',
            access: {
                useWebSockets: true,
            },
        };

        it('enables live', async () => {
            const id = createTemporaryId();

            await renderComponent({ id, type: LiveDataType.sayg }, account);

            await context.required('.dropdown-menu').select('▶️ Live');

            expect(Object.keys(socketFactory.subscriptions)).toEqual([id]);
        });

        it('disables live', async () => {
            const id = createTemporaryId();

            await renderComponent({ id, type: LiveDataType.sayg }, account);
            await act(async () => {
                await liveContainer!.enableLiveUpdates(true, {
                    id,
                    type: LiveDataType.sayg,
                });
            });

            await context.required('.dropdown-menu').select('⏸️ Paused');

            expect(socketFactory.subscriptions).toEqual({});
        });
    });

    function GetLiveContainer({ children, onLoad }) {
        const live: ILive = useLive();

        onLoad(live);

        return <>{children}</>;
    }
});
