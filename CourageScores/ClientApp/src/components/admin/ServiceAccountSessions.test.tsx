import { AdminContainer } from './AdminContainer.tsx';
import {
    api,
    appProps,
    brandingProps,
    cleanUp,
    ErrorState,
    iocProps,
    renderApp,
    TestContext,
} from '../../helpers/tests.tsx';
import { ServiceAccountSessions } from './ServiceAccountSessions.tsx';
import { createTemporaryId } from '../../helpers/projection.ts';
import { IServiceAccountSessionApi } from '../../interfaces/apis/IServiceAccountSessionApi.ts';
import { IClientActionResultDto } from '../common/IClientActionResultDto.ts';
import { ServiceAccountSessionDto } from '../../interfaces/models/dtos/Identity/ServiceAccountSessionDto.ts';
import { RejectServiceAccountSessionDto } from '../../interfaces/models/dtos/Identity/RejectServiceAccountSessionDto.ts';

describe('ServiceAccountSessions', () => {
    let context: TestContext;
    let reportedError: ErrorState;
    let allSessions: ServiceAccountSessionDto[];
    let rejectSessionId: string | null;
    let rejectRequest: RejectServiceAccountSessionDto | null;
    let rejectResponse: IClientActionResultDto<ServiceAccountSessionDto> | null;

    const serviceAccountSessionApi = api<IServiceAccountSessionApi>({
        async getAll() {
            return allSessions;
        },
        async reject(id: string, request: RejectServiceAccountSessionDto) {
            rejectSessionId = id;
            rejectRequest = request;
            return rejectResponse ?? { success: true };
        },
    });

    afterEach(async () => {
        await cleanUp(context);
    });

    beforeEach(() => {
        reportedError = new ErrorState();
        allSessions = [];
        rejectSessionId = null;
        rejectRequest = null;
        rejectResponse = null;
    });

    async function renderComponent() {
        context = await renderApp(
            iocProps({ serviceAccountSessionApi }),
            brandingProps(),
            appProps(
                {
                    account: {
                        name: '',
                        emailAddress: '',
                        givenName: '',
                    },
                    appLoading: false,
                },
                reportedError,
            ),
            <AdminContainer tables={[]} accounts={[]}>
                <ServiceAccountSessions />
            </AdminContainer>,
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
            myIpAddress: '127.0.0.1',
            ...overrides,
        };
    }

    function sessionItem(sessionId: string) {
        return context
            .required(`span[title="${sessionId}"]`)
            .closest('.list-group-item')!;
    }

    describe('renders', () => {
        it('when there are no sessions', async () => {
            await renderComponent();

            reportedError.verifyNoError();
            expect(context.text()).toContain('Service account sessions (0)');
        });

        it('pending session', async () => {
            const pendingSession = session({ friendlyName: 'TV 1' });
            allSessions = [pendingSession];

            await renderComponent();

            reportedError.verifyNoError();
            const item = sessionItem(pendingSession.id);
            expect(item.text()).toContain('🕛');
            expect(item.text()).toContain('Friendly name: TV 1');
            expect(item.text()).toContain('IP: 127.0.0.1');
            expect(item.button('Reject').enabled()).toEqual(true);
            expect(
                item
                    .required('a.btn-primary')
                    .element<HTMLAnchorElement>()
                    .getAttribute('href'),
            ).toEqual(`/accept_session/${pendingSession.id}`);
        });

        it('approved session', async () => {
            const approvedSession = session({
                approvedBy: 'admin@example.com',
                pinFromApprover: '1234',
            });
            allSessions = [approvedSession];

            await renderComponent();

            reportedError.verifyNoError();
            const item = sessionItem(approvedSession.id);
            expect(item.text()).toContain('✅ admin@example.com');
            expect(item.button('Reject').enabled()).toEqual(true);
            expect(item.optional('a')).toBeUndefined();
        });

        it('rejected session', async () => {
            const rejectedSession = session({
                rejectedBy: 'admin@example.com',
                message: 'Not recognised',
            });
            allSessions = [rejectedSession];

            await renderComponent();

            reportedError.verifyNoError();
            const item = sessionItem(rejectedSession.id);
            expect(item.text()).toContain('❌ admin@example.com');
            expect(item.text()).toContain('Not recognised');
            expect(item.optional('button')).toBeUndefined();
            expect(item.optional('a')).toBeUndefined();
        });

        it('session with transient username', async () => {
            const activeSession = session({
                transientUsername: 'tablet-user',
                approvedBy: 'admin@example.com',
            });
            allSessions = [activeSession];

            await renderComponent();

            reportedError.verifyNoError();
            expect(sessionItem(activeSession.id).text()).toContain(
                'User?: tablet-user',
            );
        });

        it('truncated session id', async () => {
            const pendingSession = session({
                id: 'abcd1234-5678-4abc-def0-123456789abc',
            });
            allSessions = [pendingSession];

            await renderComponent();

            reportedError.verifyNoError();
            expect(sessionItem(pendingSession.id).text()).toContain(
                'abcd...9abc',
            );
        });
    });

    describe('interactivity', () => {
        it('can refresh sessions', async () => {
            const initialSession = session({ friendlyName: 'Initial' });
            allSessions = [initialSession];
            await renderComponent();
            expect(context.text()).toContain('Initial');

            const refreshedSession = session({ friendlyName: 'Refreshed' });
            allSessions = [refreshedSession];
            await context.button('Refresh').click();

            reportedError.verifyNoError();
            expect(context.text()).toContain('Refreshed');
            expect(context.text()).not.toContain('Initial');
        });

        it('can reject a session', async () => {
            const pendingSession = session();
            allSessions = [pendingSession];
            await renderComponent();

            await sessionItem(pendingSession.id).button('Reject').click();

            reportedError.verifyNoError();
            expect(rejectSessionId).toEqual(pendingSession.id);
            expect(rejectRequest).toEqual({ reason: 'Rejected by admin' });
        });

        it('reloads after rejecting a session', async () => {
            const pendingSession = session({ friendlyName: 'Pending' });
            allSessions = [pendingSession];
            await renderComponent();
            expect(context.text()).toContain('Pending');

            const rejectedSession = session({
                id: pendingSession.id,
                friendlyName: 'Pending',
                rejectedBy: 'admin@example.com',
                message: 'Rejected by admin',
            });
            allSessions = [rejectedSession];
            await sessionItem(pendingSession.id).button('Reject').click();

            reportedError.verifyNoError();
            expect(context.text()).toContain('❌ admin@example.com');
            expect(context.text()).toContain('Rejected by admin');
            expect(
                sessionItem(pendingSession.id).optional('button'),
            ).toBeUndefined();
        });

        it('alerts when session cannot be rejected', async () => {
            const pendingSession = session();
            allSessions = [pendingSession];
            rejectResponse = {
                success: false,
                errors: ['Reject failed'],
                warnings: ['Reject warning'],
            };
            await renderComponent();

            await sessionItem(pendingSession.id).button('Reject').click();

            reportedError.verifyNoError();
            expect(rejectSessionId).toEqual(pendingSession.id);
            context.prompts.alertWasShown(
                'Session was not rejected\n\nReject failed\nReject warning',
            );
        });
    });
});
