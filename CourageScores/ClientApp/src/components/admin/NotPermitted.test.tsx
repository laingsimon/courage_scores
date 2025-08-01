import {
    appProps,
    brandingProps,
    cleanUp,
    iocProps,
    renderApp,
    TestContext,
} from '../../helpers/tests';
import { NotPermitted } from './NotPermitted';
import { IAppContainerProps } from '../common/AppContainer';

describe('NotPermitted', () => {
    let context: TestContext;

    afterEach(async () => {
        await cleanUp(context);
    });

    async function renderComponent(props: IAppContainerProps) {
        context = await renderApp(
            iocProps(),
            brandingProps(),
            props,
            <NotPermitted />,
            '/admin/:mode',
            '/admin/not_permitted',
        );
    }

    describe('when logged out', () => {
        it('renders login button', async () => {
            await renderComponent(appProps({}));

            const loginLink = context.container.querySelector(
                'a.btn',
            ) as HTMLAnchorElement;
            expect(loginLink).toBeTruthy();
            expect(loginLink.textContent).toEqual('Login');
            expect(loginLink.href).toEqual(
                'https://localhost:7247/api/Account/Login/?redirectUrl=http://localhost/admin/not_permitted',
            );
        });
    });

    describe('when logged in', () => {
        it('renders home button', async () => {
            await renderComponent(
                appProps({
                    account: {
                        name: '',
                        emailAddress: '',
                        givenName: '',
                    },
                }),
            );

            const loginLink = context.container.querySelector(
                'a.btn',
            ) as HTMLAnchorElement;
            expect(loginLink).toBeTruthy();
            expect(loginLink.textContent).toEqual('Home');
            expect(loginLink.href).toEqual('http://localhost/');
        });
    });
});
