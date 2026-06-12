import { act } from '@testing-library/react';
import {
    api,
    appProps as appPropsFunc,
    brandingProps,
    cleanUp,
    ErrorState,
    iocProps,
    renderApp,
    TestContext,
    user,
} from '../../helpers/tests.tsx';
import { createTemporaryId } from '../../helpers/projection.ts';
import { NewSession } from './NewSession.tsx';
import { IServiceAccountSessionApi } from '../../interfaces/apis/IServiceAccountSessionApi.ts';
import { IClientActionResultDto } from '../common/IClientActionResultDto.ts';
import { ServiceAccountSessionDto } from '../../interfaces/models/dtos/Identity/ServiceAccountSessionDto.ts';
import { CreateSessionRequestDto } from '../../interfaces/models/dtos/Identity/CreateSessionRequestDto.ts';
import { ActivateSessionRequestDto } from '../../interfaces/models/dtos/Identity/ActivateSessionRequestDto.ts';
import { IAppContainerProps } from '../common/AppContainer.tsx';
import { UserDto } from '../../interfaces/models/dtos/Identity/UserDto';

const mockedUsedNavigate = jest.fn();

jest.mock('react-router', () => ({
    ...jest.requireActual('react-router'),
    useNavigate: () => mockedUsedNavigate,
}));

describe('NewSession', () => {
    let context: TestContext;
    let reportedError: ErrorState;
    let createRequest: CreateSessionRequestDto | null;
    let createResponse: IClientActionResultDto<ServiceAccountSessionDto> | null;
    let createException: string | null;
    let getResponse: ServiceAccountSessionDto | null;
    let getException: string | null;
    let activateRequest: ActivateSessionRequestDto | null;
    let activateSessionId: string | null;
    let activateResponse: IClientActionResultDto<ServiceAccountSessionDto> | null;
    let allDataReloaded: boolean;

    const serviceAccountSessionApi = api<IServiceAccountSessionApi>({
        async create(request: CreateSessionRequestDto) {
            createRequest = request;
            if (createException) {
                throw createException;
            }
            return (
                createResponse ?? {
                    success: false,
                    errors: ['No response configured'],
                }
            );
        },
        async get() {
            if (getException) {
                throw getException;
            }
            return getResponse;
        },
        async activate(id: string, request: ActivateSessionRequestDto) {
            activateSessionId = id;
            activateRequest = request;
            return (
                activateResponse ?? {
                    success: false,
                    errors: ['No activate response configured'],
                }
            );
        },
    });

    afterEach(async () => {
        await cleanUp(context);
    });

    beforeEach(() => {
        jest.resetAllMocks();
        reportedError = new ErrorState();
        createRequest = null;
        createResponse = null;
        createException = null;
        getResponse = null;
        getException = null;
        activateRequest = null;
        activateSessionId = null;
        activateResponse = null;
        allDataReloaded = false;
    });

    async function reloadAll() {
        allDataReloaded = true;
    }

    function appProps(props?: Partial<IAppContainerProps>) {
        return appPropsFunc(
            {
                ...props,
                reloadAll,
            },
            reportedError,
        );
    }

    async function renderComponent(
        currentPath: string = '/new_session',
        account?: UserDto,
    ) {
        context = await renderApp(
            iocProps({ serviceAccountSessionApi }),
            brandingProps(),
            appProps({ account }),
            <NewSession />,
            '/new_session/:friendlyName?',
            currentPath,
        );
    }

    function session(
        overrides?: Partial<ServiceAccountSessionDto>,
    ): ServiceAccountSessionDto {
        return {
            id: createTemporaryId(),
            friendlyName: 'Board 1',
            serviceIpAddress: '127.0.0.1',
            serviceUserAgent: 'a tablet',
            verificationValue: 'verification',
            myIpAddress: '192.168.0.10',
            ...overrides,
        };
    }

    describe('create session', () => {
        it('redirects to login if logged in', async () => {
            const account = user({});

            await renderComponent('/new_session/Board%201', account);

            expect(mockedUsedNavigate).toHaveBeenCalledWith('/login');
        });

        it('renders create session form', async () => {
            await renderComponent('/new_session/Board%201');

            expect(context.required('h3').text()).toEqual(
                'Create a new session',
            );
            expect(context.input('friendlyName').value()).toEqual('Board 1');
            expect(context.button('Create session').enabled()).toEqual(true);
        });

        it('navigates when friendly name changes', async () => {
            await renderComponent();

            await context.input('friendlyName').change('Board 2');

            expect(mockedUsedNavigate).toHaveBeenCalledWith(
                '/new_session/Board 2/',
                {
                    replace: true,
                },
            );
        });

        it('creates session with friendly name from route', async () => {
            createResponse = {
                success: true,
                result: session({ friendlyName: 'Board 1' }),
            };
            await renderComponent('/new_session/Board%201');

            await context.button('Create session').click();

            reportedError.verifyNoError();
            expect(createRequest).toEqual({ friendlyName: 'Board 1' });
        });

        it('shows waiting for approval after successful create', async () => {
            const createdSession = session();
            createResponse = {
                success: true,
                result: createdSession,
            };
            await renderComponent('/new_session/Board%201');

            await context.button('Create session').click();

            reportedError.verifyNoError();
            expect(context.required('h3').text()).toEqual(
                'Waiting for approval...',
            );
            expect(context.required('h6').text()).toEqual('Board 1');
            expect(context.text()).toContain(
                `IP address: ${createdSession.myIpAddress}`,
            );
            expect(
                context.required('[data-testid="session-pin"]').text(),
            ).toMatch(/^PIN: [A-Z0-9]{4}$/);
        });

        it('shows errors when create fails', async () => {
            createResponse = {
                success: false,
                errors: ['Create failed'],
                warnings: ['Create warning'],
                messages: ['Create message'],
            };
            await renderComponent();

            await context.button('Create session').click();

            reportedError.verifyNoError();
            expect(context.required('h3').text()).toEqual(
                'Session was not created',
            );
            expect(context.text()).toContain('Create failed');
            expect(context.text()).toContain('Create warning');
            expect(context.text()).toContain('Create message');
        });

        it('reports error when create throws', async () => {
            createException = 'Create exploded';
            await renderComponent();

            await context.button('Create session').click();

            reportedError.verifyErrorEquals('Create exploded');
        });
    });

    describe('session approval', () => {
        let intervalHandler: (() => void) | undefined;

        beforeEach(() => {
            intervalHandler = undefined;
            window.setInterval = ((handler: TimerHandler) => {
                intervalHandler = handler as () => void;
                return 1;
            }) as typeof window.setInterval;
            window.clearInterval = jest.fn() as typeof window.clearInterval;
        });

        it('activates session when approved on create', async () => {
            const createdSession = session({
                approvedBy: 'admin@example.com',
            });
            createResponse = {
                success: true,
                result: createdSession,
            };
            activateResponse = {
                success: true,
            };
            await renderComponent('/new_session/Board%201');

            await context.button('Create session').click();

            reportedError.verifyNoError();
            expect(activateSessionId).toEqual(createdSession.id);
            expect(activateRequest?.pin).toMatch(/^[A-Z0-9]{4}$/);
            expect(allDataReloaded).toEqual(true);
            expect(context.required('h3').text()).toEqual('Session approved');
            expect(
                context.required('a.btn').element<HTMLAnchorElement>().href,
            ).toEqual('http://localhost/');
        });

        it('does not redirect after activation if redirect url is /', async () => {
            const createdSession = session({
                approvedBy: 'admin@example.com',
            });
            createResponse = {
                success: true,
                result: createdSession,
            };
            activateResponse = {
                success: true,
            };
            await renderComponent('/new_session/Board%201/?redirectUrl=/');

            await context.button('Create session').click();

            reportedError.verifyNoError();
            expect(activateSessionId).toEqual(createdSession.id);
            expect(activateRequest?.pin).toMatch(/^[A-Z0-9]{4}$/);
            expect(allDataReloaded).toEqual(true);
            expect(context.required('h3').text()).toEqual('Session approved');
            expect(
                context.required('a.btn').element<HTMLAnchorElement>().href,
            ).toEqual('http://localhost/');
        });

        it('redirects after activation when redirect url present', async () => {
            const createdSession = session({
                approvedBy: 'admin@example.com',
            });
            createResponse = {
                success: true,
                result: createdSession,
            };
            activateResponse = {
                success: true,
            };
            await renderComponent(
                '/new_session/Board%201/?redirectUrl=/somewhere',
            );

            await context.button('Create session').click();

            reportedError.verifyNoError();
            expect(activateSessionId).toEqual(createdSession.id);
            expect(activateRequest?.pin).toMatch(/^[A-Z0-9]{4}$/);
            expect(allDataReloaded).toEqual(true);
            expect(mockedUsedNavigate).toHaveBeenCalledWith('/somewhere');
        });

        it('shows errors when activation fails', async () => {
            const createdSession = session({
                approvedBy: 'admin@example.com',
            });
            createResponse = {
                success: true,
                result: createdSession,
            };
            activateResponse = {
                success: false,
                errors: ['Activation failed'],
            };
            await renderComponent();

            await context.button('Create session').click();

            reportedError.verifyNoError();
            expect(context.required('h3').text()).toEqual(
                'Session was not created',
            );
            expect(context.text()).toContain('Activation failed');
        });

        it('refreshes session until approved', async () => {
            const createdSession = session();
            const approvedSession = session({
                id: createdSession.id,
                approvedBy: 'admin@example.com',
            });
            createResponse = {
                success: true,
                result: createdSession,
            };
            getResponse = approvedSession;
            activateResponse = {
                success: true,
            };
            await renderComponent();

            await context.button('Create session').click();

            expect(context.required('h3').text()).toEqual(
                'Waiting for approval...',
            );
            expect(intervalHandler).toBeTruthy();
            const pin = context.required('[data-testid="session-pin"]').text();

            await act(async () => {
                intervalHandler!();
            });

            reportedError.verifyNoError();
            expect(activateSessionId).toEqual(createdSession.id);
            expect(activateRequest?.pin).toEqual(pin.replace('PIN: ', ''));
            expect(allDataReloaded).toEqual(true);
            expect(context.required('h3').text()).toEqual('Session approved');
        });

        it('shows errors when refresh fails', async () => {
            const createdSession = session();
            createResponse = {
                success: true,
                result: createdSession,
            };
            getException = 'Refresh exploded';
            await renderComponent();

            await context.button('Create session').click();

            await act(async () => {
                intervalHandler!();
            });

            reportedError.verifyNoError();
            expect(context.required('h3').text()).toEqual(
                'Session was not created',
            );
            expect(context.text()).toContain('Refresh exploded');
        });
    });

    describe('session rejection', () => {
        it('shows rejection', async () => {
            createResponse = {
                success: true,
                result: session({
                    rejectedBy: 'Someone',
                    message: 'Rejection reason',
                }),
            };
            await renderComponent('/new_session/Board%201');

            await context.button('Create session').click();

            reportedError.verifyNoError();
            expect(allDataReloaded).toEqual(false);
            expect(context.required('h3').text()).toEqual(
                'Request rejected by Someone',
            );
            expect(context.required('p').text()).toEqual(
                'Reason: Rejection reason',
            );
        });
    });
});
