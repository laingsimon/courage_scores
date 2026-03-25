import {
    api,
    appProps,
    brandingProps,
    cleanUp,
    iocProps,
    renderApp,
    TestContext,
    user,
} from '../helpers/tests';
import { defaultPinGenerator, RemoteControl } from './RemoteControl';
import { UserDto } from '../interfaces/models/dtos/Identity/UserDto';
import { RemoteControlApi } from '../interfaces/apis/IRemoteControlApi';
import { IClientActionResultDto } from './common/IClientActionResultDto';
import { RemoteControlDto } from '../interfaces/models/dtos/RemoteControl/RemoteControlDto';
import { act, fireEvent } from '@testing-library/react';
import { RemoteControlUpdateDto } from '../interfaces/models/dtos/RemoteControl/RemoteControlUpdateDto';

jest.useFakeTimers();
const mockedUsedNavigate = jest.fn();

jest.mock('react-router', () => ({
    ...jest.requireActual('react-router'),
    useNavigate: () => mockedUsedNavigate,
}));

describe('RemoteControl', () => {
    let context: TestContext;
    let created: string[] = [];
    let retrieved: { id: string; pin: string }[] = [];
    let deleted: { id: string; pin: string }[] = [];
    let updates: { id: string; update: RemoteControlUpdateDto }[] = [];
    let createdResponses: IClientActionResultDto<RemoteControlDto>[] = [];
    let retrievalResponses: IClientActionResultDto<RemoteControlDto>[] = [];
    let updateResponses: IClientActionResultDto<RemoteControlDto>[] = [];
    let generatedPins: string[];
    const remoteControlApi = api<RemoteControlApi>({
        async create(
            pin: string,
        ): Promise<IClientActionResultDto<RemoteControlDto> | null> {
            created.push(pin);
            return createdResponses.shift() || { success: true };
        },
        async get(
            id: string,
            pin: string,
        ): Promise<IClientActionResultDto<RemoteControlDto> | null> {
            retrieved.push({ id, pin });
            return retrievalResponses.shift() || { success: false };
        },
        async delete(
            id: string,
            pin: string,
        ): Promise<IClientActionResultDto<RemoteControlDto> | null> {
            deleted.push({ id, pin });
            return { success: true };
        },
        async update(
            id: string,
            update: RemoteControlUpdateDto,
        ): Promise<IClientActionResultDto<RemoteControlDto> | null> {
            updates.push({ id, update });
            return updateResponses.shift() ?? { success: true };
        },
    });

    function pinGenerator() {
        const pin = defaultPinGenerator();
        generatedPins.push(pin);
        return pin;
    }

    beforeEach(() => {
        created = [];
        createdResponses = [];
        retrieved = [];
        retrievalResponses = [];
        generatedPins = [];
        deleted = [];
        updates = [];
        updateResponses = [];
        jest.resetAllMocks();
    });

    afterEach(async () => {
        await cleanUp(context);
    });

    async function renderComponent(account?: UserDto, path?: string) {
        context = await renderApp(
            iocProps({ remoteControlApi }),
            brandingProps(),
            appProps({ account }),
            <RemoteControl pinGenerator={pinGenerator} />,
            '/rc/:id?/:pin?',
            path || '/rc',
        );

        await act(async () => {
            jest.runOnlyPendingTimers();
        });
    }

    describe('renders', () => {
        describe('logged out / headless', () => {
            it('creates id and pin automatically', async () => {
                createdResponses.push({
                    success: true,
                    result: {
                        id: 'the-id',
                        created: new Date().toISOString(),
                    },
                });

                await renderComponent();

                expect(created.length).toEqual(1);
                expect(generatedPins.length).toEqual(1);
                expect(mockedUsedNavigate).toHaveBeenCalledWith(
                    '/rc/the-id/' + generatedPins[0],
                );
            });

            it('renders provided in and pin', async () => {
                retrievalResponses.push({
                    success: true,
                    result: {
                        id: 'id',
                        created: new Date().toISOString(),
                    },
                });

                await renderComponent(undefined, '/rc/id/pin');

                expect(created).toEqual([]);
                expect(retrieved).toEqual([{ id: 'id', pin: 'pin' }]);
                expect(context.optional('.alert')).toBeFalsy();
                expect(context.optional('svg')).toBeTruthy();
            });

            it('renders login prompt', async () => {
                retrievalResponses.push({
                    success: true,
                    result: {
                        id: 'id',
                        created: new Date().toISOString(),
                    },
                });

                await renderComponent(undefined, '/rc/id/pin?login=prompt');

                expect(created).toEqual([]);
                expect(retrieved).toEqual([{ id: 'id', pin: 'pin' }]);
                expect(context.optional('.alert')).toBeFalsy();
                expect(context.optional('svg')).toBeFalsy();
                const loginPrompt = context.optional('a.btn');
                expect(loginPrompt).toBeTruthy();
                expect(loginPrompt!.text()).toEqual('Login to control device');
            });

            it('creates a new id if existing id cannot be retrieved', async () => {
                createdResponses.push({
                    success: true,
                    result: {
                        id: 'the-id',
                        created: new Date().toISOString(),
                    },
                });

                await renderComponent(undefined, '/rc/id/pin');

                expect(retrieved).toEqual([{ id: 'id', pin: 'pin' }]);
                expect(created).toEqual([]);
                expect(mockedUsedNavigate).toHaveBeenCalledWith('/rc');
            });

            it('renders error if unable to create an id', async () => {
                createdResponses.push({
                    success: false,
                    errors: ['some error'],
                    warnings: ['some warning'],
                });

                await renderComponent();

                expect(created.length).toEqual(1);
                expect(context.optional('svg')).toBeFalsy();
                const alert = context.required('.alert');
                expect(alert.text()).toContain('some error');
                expect(alert.text()).toContain('some warning');
            });
        });

        describe('logged in / mobile', () => {
            const account = user({});

            it('renders id and pin automatically when showQrCode query provided', async () => {
                retrievalResponses.push({
                    success: true,
                    result: {
                        id: 'id',
                        created: new Date().toISOString(),
                    },
                });

                await renderComponent(account, '/rc/id/pin?showQrCode=true');

                expect(created).toEqual([]);
                expect(retrieved).toEqual([{ id: 'id', pin: 'pin' }]);
                expect(context.optional('.alert')).toBeFalsy();
                expect(context.optional('svg')).toBeTruthy();
            });

            it('shows option to enter url', async () => {
                retrievalResponses.push({
                    success: true,
                    result: {
                        id: 'id',
                        created: new Date().toISOString(),
                    },
                });

                await renderComponent(account, '/rc/id/pin');

                expect(context.optional('input[name="url"]')).toBeTruthy();
            });

            it('shows expected curated urls', async () => {
                retrievalResponses.push({
                    success: true,
                    result: {
                        id: 'id',
                        created: new Date().toISOString(),
                    },
                });

                await renderComponent(account, '/rc/id/pin');

                const curatedUrls = context.all('.list-group .list-group-item');
                const today = new Date().toISOString().substring(0, 10);
                expect(curatedUrls.map((url) => url.text())).toEqual([
                    'Live tournaments',
                    "Today's Superleague boards",
                    "Today's fixtures",
                ]);
                expect(
                    curatedUrls.map((url) =>
                        url.element().getAttribute('title'),
                    ),
                ).toEqual([
                    '/live',
                    '/live/superleague/?date=' + today,
                    '/fixtures/?date=' + today,
                ]);
            });
        });
    });

    describe('interactivity', () => {
        describe('logged out / headless', () => {
            it('redirects when url provided', async () => {
                const rc: RemoteControlDto = {
                    id: 'id',
                    created: new Date().toISOString(),
                };
                retrievalResponses.push({
                    success: true,
                    result: { ...rc },
                });
                await renderComponent(undefined, '/rc/id/pin');

                retrievalResponses.push({
                    success: true,
                    result: {
                        ...rc,
                        url: '/redirect/to/url',
                    },
                });
                await act(async () => {
                    jest.runOnlyPendingTimers();
                });

                expect(deleted).toEqual([{ id: 'id', pin: 'pin' }]);
                expect(mockedUsedNavigate).toHaveBeenCalledWith(
                    '/redirect/to/url',
                );
            });
        });

        describe('logged in / mobile', () => {
            const account = user({});

            it('sends entered url to api and prevents subsequent send', async () => {
                retrievalResponses.push({
                    success: true,
                    result: {
                        id: 'id',
                        created: new Date().toISOString(),
                    },
                });
                await renderComponent(account, '/rc/id/pin');

                // NOTE: Using `fireEvent` here because `doChange` (moreover userEvent) doesn't play nicely with fake timers
                const urlInput = context
                    .input('url')
                    .element<HTMLInputElement>();
                fireEvent.change(urlInput, {
                    target: { value: '/redirect/to/url' },
                });
                await context.button('Go').click();

                expect(updates).toEqual([
                    {
                        id: 'id',
                        update: {
                            pin: 'pin',
                            url: '/redirect/to/url',
                        },
                    },
                ]);
                expect(urlInput.disabled).toBeTruthy();
                expect(context.button('Go').enabled()).toBeFalsy();
            });

            it('sends api of curated link to api and prevents subsequent sent', async () => {
                retrievalResponses.push({
                    success: true,
                    result: {
                        id: 'id',
                        created: new Date().toISOString(),
                    },
                });
                await renderComponent(account, '/rc/id/pin');
                const firstCuratedLink = context.all(
                    '.list-group .list-group-item',
                )[0];

                await firstCuratedLink.click();

                expect(updates).toEqual([
                    {
                        id: 'id',
                        update: {
                            pin: 'pin',
                            url: firstCuratedLink
                                .element()
                                .getAttribute('title'),
                        },
                    },
                ]);
                expect(context.input('url').enabled()).toBeFalsy();
                expect(context.button('Go').enabled()).toBeFalsy();
            });

            it('shows error if unable to update entry', async () => {
                retrievalResponses.push({
                    success: true,
                    result: {
                        id: 'id',
                        created: new Date().toISOString(),
                    },
                });
                updateResponses.push({
                    success: false,
                    errors: ['some error'],
                    warnings: ['some warning'],
                });
                await renderComponent(account, '/rc/id/pin');
                const firstCuratedLink = context.all(
                    '.list-group .list-group-item',
                )[0];

                await firstCuratedLink.click();

                expect(updates.length).toEqual(1);
                expect(context.input('url').enabled()).toBeTruthy();
                expect(context.button('Go').enabled()).toBeTruthy();
                const alert = context.required('.alert');
                expect(alert.text()).toContain('some error');
                expect(alert.text()).toContain('some warning');
            });
        });
    });
});
