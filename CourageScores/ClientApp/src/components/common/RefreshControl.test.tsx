import {
    appProps,
    brandingProps,
    cleanUp,
    iocProps,
    MockSocketFactory,
    noop,
    renderApp,
    TestContext,
    user,
} from '../../helpers/tests.tsx';
import { IRefreshControlProps, RefreshControl } from './RefreshControl.tsx';
import { LiveContainer, useLive } from '../../live/LiveContainer.tsx';
import { createTemporaryId } from '../../helpers/projection.ts';
import { UserDto } from '../../interfaces/models/dtos/Identity/UserDto.ts';
import { ILive } from '../../live/ILive.ts';
import { act } from '@testing-library/react';
import { LiveDataType } from '../../interfaces/models/dtos/Live/LiveDataType.ts';
import { ILiveOptions } from '../../live/ILiveOptions.ts';
import { AccessOption } from '../../interfaces/models/dtos/Identity/AccessOption.ts';

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
        const account = user([AccessOption.useWebSockets]);

        it('nothing when logged out', async () => {
            const id = createTemporaryId();

            await renderComponent({ id, type: LiveDataType.sayg });

            expect(context.optional('.dropdown-menu')).toBeFalsy();
        });

        it('nothing when not permitted', async () => {
            const id = createTemporaryId();

            await renderComponent({ id, type: LiveDataType.sayg }, user());

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
        const account = user([AccessOption.useWebSockets]);

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
