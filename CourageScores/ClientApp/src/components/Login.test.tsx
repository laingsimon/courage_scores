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
import { IAppContainerProps } from './common/AppContainer.tsx';
import { Login } from './Login.tsx';
import { FeatureApi } from '../interfaces/apis/IFeatureApi.ts';
import { ConfiguredFeatureDto } from '../interfaces/models/dtos/ConfiguredFeatureDto';

describe('Login', () => {
    let context: TestContext;
    let features: ConfiguredFeatureDto[] = [];

    const featureApi = api<FeatureApi>({
        async getFeatures() {
            return features;
        },
    });

    afterEach(async () => {
        await cleanUp(context);
    });

    beforeEach(() => {
        features = [];
    });

    async function renderComponent(
        appProps: IAppContainerProps,
        path?: string,
    ) {
        context = await renderApp(
            iocProps({ featureApi }),
            brandingProps(),
            appProps,
            <Login />,
            '/login',
            path ?? '/login',
        );
    }

    describe('when logged out', () => {
        it('when no service-account feature found - only shows google login button', async () => {
            await renderComponent(appProps());

            expect(context.text()).not.toContain('You are logged in');
            const google = context.required(
                'a[data-testid="login-with-google"]',
            );
            expect(google.text()).toContain('Google');
            expect(google.element<HTMLAnchorElement>().href).toContain(
                '/api/Account/Login/?redirectUrl=%2F',
            );
            expect(context.text()).not.toContain(
                '📺 New service account session',
            );
        });

        it('when service-account feature disabled - only shows google login button', async () => {
            features = [
                {
                    id: '1f866fa2-8b9a-4345-a191-d7aaeccd8d72',
                    configuredValue: 'false',
                    description: 'service-accounts',
                    name: 'service-accounts',
                },
            ];

            await renderComponent(appProps());

            expect(context.text()).not.toContain('You are logged in');
            const google = context.required(
                'a[data-testid="login-with-google"]',
            );
            expect(google.text()).toContain('Google');
            expect(google.element<HTMLAnchorElement>().href).toContain(
                '/api/Account/Login/?redirectUrl=%2F',
            );
            expect(context.text()).not.toContain(
                '📺 New service account session',
            );
        });

        it('when no service-account feature enabled - shows google & service-account login buttons', async () => {
            features = [
                {
                    id: '1f866fa2-8b9a-4345-a191-d7aaeccd8d72',
                    configuredValue: 'true',
                    description: 'service-accounts',
                    name: 'service-accounts',
                },
            ];

            await renderComponent(appProps());

            expect(context.text()).not.toContain('You are logged in');
            const google = context.required(
                'a[data-testid="login-with-google"]',
            );
            expect(google.text()).toContain('Google');
            expect(google.element<HTMLAnchorElement>().href).toContain(
                '/api/Account/Login/?redirectUrl=%2F',
            );

            const serviceAccount = context.required('a:nth-child(2)');
            expect(serviceAccount.text()).toContain(
                '📺 New service account session',
            );
            expect(serviceAccount.element<HTMLAnchorElement>().href).toEqual(
                'http://localhost/new_session/?redirectUrl=%2F',
            );
        });

        it('when no service-account feature enabled - redirects google and service-account after login', async () => {
            features = [
                {
                    id: '1f866fa2-8b9a-4345-a191-d7aaeccd8d72',
                    configuredValue: 'true',
                    description: 'service-accounts',
                    name: 'service-accounts',
                },
            ];

            await renderComponent(appProps(), '/Login/?redirectUrl=somewhere');

            expect(context.text()).not.toContain('You are logged in');
            const google = context.required(
                'a[data-testid="login-with-google"]',
            );
            expect(google.text()).toContain('Google');
            expect(google.element<HTMLAnchorElement>().href).toContain(
                '/api/Account/Login/?redirectUrl=somewhere',
            );

            const serviceAccount = context.required('a:nth-child(2)');
            expect(serviceAccount.text()).toContain(
                '📺 New service account session',
            );
            expect(serviceAccount.element<HTMLAnchorElement>().href).toEqual(
                'http://localhost/new_session/?redirectUrl=somewhere',
            );
        });
    });

    describe('when logged in', () => {
        it('shows google auth account details', async () => {
            const account = user({});
            account.transient = false;

            await renderComponent(appProps({ account }));

            expect(context.text()).toContain('You are logged in');
            expect(context.text()).toContain('Using Google');
            expect(context.optional('.btn')?.text()).toEqual('Logout');
        });

        it('shows service account details', async () => {
            const account = user({});
            account.transient = true;

            await renderComponent(appProps({ account }));

            expect(context.text()).toContain('You are logged in');
            expect(context.text()).toContain('Using a service-account');
            expect(context.optional('.btn')?.text()).toEqual('Logout');
        });
    });
});
