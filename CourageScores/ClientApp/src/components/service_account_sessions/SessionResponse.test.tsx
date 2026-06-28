import { act } from '@testing-library/react';
import {
    api,
    appProps,
    brandingProps,
    cleanUp,
    ErrorState,
    iocProps,
    renderApp,
    TestContext,
    user,
} from '../../helpers/tests.tsx';
import { createTemporaryId } from '../../helpers/projection.ts';
import { SessionResponse } from './SessionResponse.tsx';
import { IServiceAccountSessionApi } from '../../interfaces/apis/IServiceAccountSessionApi.ts';
import { IClientActionResultDto } from '../common/IClientActionResultDto.ts';
import { ServiceAccountSessionDto } from '../../interfaces/models/dtos/Identity/ServiceAccountSessionDto.ts';
import { ApproveServiceAccountSessionDto } from '../../interfaces/models/dtos/Identity/ApproveServiceAccountSessionDto.ts';
import { RejectServiceAccountSessionDto } from '../../interfaces/models/dtos/Identity/RejectServiceAccountSessionDto.ts';
import { UserDto } from '../../interfaces/models/dtos/Identity/UserDto';
import { AccessOption } from '../../interfaces/models/dtos/Identity/AccessOption.ts';

describe('SessionResponse', () => {
    const permitted = user([AccessOption.loginServiceAccounts]);
    let context: TestContext;
    let reportedError: ErrorState;
    let sessionId: string;
    let currentSession: ServiceAccountSessionDto | null;
    let getSessionId: string | null;
    let approveSessionId: string | null;
    let approveRequest: ApproveServiceAccountSessionDto | null;
    let approveResponse: IClientActionResultDto<ServiceAccountSessionDto> | null;
    let rejectSessionId: string | null;
    let rejectRequest: RejectServiceAccountSessionDto | null;
    let rejectResponse: IClientActionResultDto<ServiceAccountSessionDto> | null;

    const serviceAccountSessionApi = api<IServiceAccountSessionApi>({
        async get(id: string) {
            getSessionId = id;
            return currentSession;
        },
        async approve(id: string, request: ApproveServiceAccountSessionDto) {
            approveSessionId = id;
            approveRequest = request;
            const response = approveResponse ?? {
                success: false,
                errors: ['No approve response configured'],
            };
            if (response.result) {
                currentSession = response.result;
            }
            return response;
        },
        async reject(id: string, request: RejectServiceAccountSessionDto) {
            rejectSessionId = id;
            rejectRequest = request;
            const response = rejectResponse ?? {
                success: false,
                errors: ['No reject response configured'],
            };
            if (response.result) {
                currentSession = response.result;
            }
            return response;
        },
    });

    afterEach(async () => {
        await cleanUp(context);
    });

    beforeEach(() => {
        reportedError = new ErrorState();
        sessionId = createTemporaryId();
        currentSession = null;
        getSessionId = null;
        approveSessionId = null;
        approveRequest = null;
        approveResponse = null;
        rejectSessionId = null;
        rejectRequest = null;
        rejectResponse = null;
    });

    async function renderComponent(user?: UserDto) {
        context = await renderApp(
            iocProps({ serviceAccountSessionApi }),
            brandingProps(),
            appProps({ account: user }, reportedError),
            <SessionResponse />,
            '/accept_session/:id',
            `/accept_session/${sessionId}`,
        );
        await act(async () => {
            await Promise.resolve();
        });
    }

    function session(
        overrides?: Partial<ServiceAccountSessionDto>,
    ): ServiceAccountSessionDto {
        return {
            id: sessionId,
            friendlyName: 'Board 1',
            serviceIpAddress: '127.0.0.1',
            serviceUserAgent: 'a tablet',
            verificationValue: 'verification',
            myIpAddress: '127.0.0.1',
            ...overrides,
        };
    }

    describe('load session', () => {
        it('renders session details', async () => {
            currentSession = session({ friendlyName: 'TV 1' });
            await renderComponent();

            expect(context.required('h3').text()).toEqual(
                'Service account session',
            );
            expect(context.text()).toContain('Login');
        });

        it('renders session details', async () => {
            currentSession = session({ friendlyName: 'TV 1' });
            await renderComponent(permitted);

            reportedError.verifyNoError();
            expect(getSessionId).toEqual(sessionId);
            expect(context.required('h3').text()).toEqual(
                'Service account session',
            );
            expect(context.text()).toContain('Friendly name: TV 1');
            expect(context.text()).toContain('Ip address: 127.0.0.1');
            expect(context.button('Approve...').enabled()).toEqual(true);
            expect(context.button('Reject...').enabled()).toEqual(true);
        });
    });

    describe('ip address', () => {
        it('shows matching ip address', async () => {
            currentSession = session();
            await renderComponent(permitted);

            reportedError.verifyNoError();
            expect(context.text()).toContain('Ip address: 127.0.0.1✅');
            expect(context.button('Approve...').enabled()).toEqual(true);
        });

        it('disables approve when ip address differs', async () => {
            currentSession = session({ myIpAddress: '192.168.0.10' });
            await renderComponent(permitted);

            reportedError.verifyNoError();
            expect(context.text()).toContain('❌ - your ip = 192.168.0.10');
            expect(context.all('.btn-primary')[0].enabled()).toEqual(false);
            expect(context.text()).toContain('🚫 Your ip address is different');
        });
    });

    describe('already responded', () => {
        it('shows approved by', async () => {
            currentSession = session({ approvedBy: 'admin@example.com' });
            await renderComponent(permitted);

            reportedError.verifyNoError();
            expect(context.text()).toContain('Approved by admin@example.com');
            expect(context.optional('button')).toBeUndefined();
        });

        it('shows rejected by', async () => {
            currentSession = session({ rejectedBy: 'admin@example.com' });
            await renderComponent(permitted);

            reportedError.verifyNoError();
            expect(context.text()).toContain('Rejected by admin@example.com');
            expect(context.optional('button')).toBeUndefined();
        });
    });

    describe('approve', () => {
        beforeEach(() => {
            currentSession = session();
        });

        it('shows approve form', async () => {
            await renderComponent(permitted);

            await context.button('Approve...').click();

            reportedError.verifyNoError();
            expect(context.required('h4').text()).toEqual('Approve');
            expect(context.required('#pin').value()).toEqual('');
            expect(context.button('Approve').enabled()).toEqual(true);
        });

        it('returns to selection from approve form', async () => {
            await renderComponent(permitted);

            await context.button('Approve...').click();
            await context.button('← Back').click();

            reportedError.verifyNoError();
            expect(context.button('Approve...').enabled()).toEqual(true);
            expect(context.button('Reject...').enabled()).toEqual(true);
        });

        it('alerts when access template not selected', async () => {
            await renderComponent(permitted);

            await context.button('Approve...').click();
            await context.required('#pin').change('1234');
            await context.button('Approve').click();

            reportedError.verifyNoError();
            context.prompts.alertWasShown('Select the level of access first');
            expect(approveRequest).toBeNull();
        });

        it('approves session with pin and access template', async () => {
            const approvedSession = session({
                approvedBy: 'admin@example.com',
            });
            approveResponse = {
                success: true,
                result: approvedSession,
            };
            await renderComponent(permitted);

            await context.button('Approve...').click();
            await context.required('#pin').change('1234');
            await context
                .required('.dropdown-menu')
                .select('Superleague Tablet, for entering scores');
            await context.button('Approve').click();

            reportedError.verifyNoError();
            expect(approveSessionId).toEqual(sessionId);
            expect(approveRequest).toEqual({
                pin: '1234',
                access: {
                    useWebSockets: true,
                    showDebugOptions: true,
                    enterTournamentResults: true,
                    recordScoresAsYouGo: true,
                    kioskMode: true,
                },
            });
            expect(context.text()).toContain('Approved by admin@example.com');
        });

        it('shows errors when approve fails', async () => {
            approveResponse = {
                success: false,
                errors: ['Approve failed'],
                warnings: ['Approve warning'],
                messages: ['Approve message'],
            };
            await renderComponent(permitted);

            await context.button('Approve...').click();
            await context.required('#pin').change('1234');
            await context
                .required('.dropdown-menu')
                .select('Superleague TV for displaying live results');
            await context.button('Approve').click();

            reportedError.verifyNoError();
            expect(approveRequest?.access).not.toBeNull();
            expect(context.text()).toContain('Approve failed');
            expect(context.text()).toContain('Approve warning');
        });
    });

    describe('reject', () => {
        beforeEach(() => {
            currentSession = session();
        });

        it('shows reject form', async () => {
            await renderComponent(permitted);

            await context.button('Reject...').click();

            reportedError.verifyNoError();
            expect(context.required('h4').text()).toEqual('Reject');
            expect(context.input('message').value()).toEqual('');
            expect(context.button('Reject').enabled()).toEqual(true);
        });

        it('returns to selection from reject form', async () => {
            await renderComponent(permitted);

            await context.button('Reject...').click();
            await context.button('← Back').click();

            reportedError.verifyNoError();
            expect(context.button('Approve...').enabled()).toEqual(true);
            expect(context.button('Reject...').enabled()).toEqual(true);
        });

        it('alerts when rejection reason not entered', async () => {
            await renderComponent(permitted);

            await context.button('Reject...').click();
            await context.button('Reject').click();

            reportedError.verifyNoError();
            context.prompts.alertWasShown('Enter a rejection reason first');
            expect(rejectRequest).toBeNull();
        });

        it('rejects session with reason', async () => {
            const rejectedSession = session({
                rejectedBy: 'admin@example.com',
            });
            rejectResponse = {
                success: true,
                result: rejectedSession,
            };
            await renderComponent(permitted);

            await context.button('Reject...').click();
            await context.input('message').change('Not recognised');
            await context.button('Reject').click();

            reportedError.verifyNoError();
            expect(rejectSessionId).toEqual(sessionId);
            expect(rejectRequest).toEqual({ reason: 'Not recognised' });
            expect(context.text()).toContain('Rejected by admin@example.com');
        });

        it('shows errors when reject fails', async () => {
            rejectResponse = {
                success: false,
                errors: ['Reject failed'],
                warnings: ['Reject warning'],
                messages: ['Reject message'],
            };
            await renderComponent(permitted);

            await context.button('Reject...').click();
            await context.input('message').change('Not recognised');
            await context.button('Reject').click();

            reportedError.verifyNoError();
            expect(context.text()).toContain('Reject failed');
            expect(context.text()).toContain('Reject warning');
        });
    });
});
