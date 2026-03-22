import {
    appProps,
    brandingProps,
    cleanUp,
    iocProps,
    renderApp,
    TestContext,
    user,
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

            const loginLink = context.required('a.btn');
            expect(loginLink.text()).toEqual('Login');
            expect(loginLink.element<HTMLAnchorElement>().href).toEqual(
                'https://localhost:7247/api/Account/Login/?redirectUrl=http://localhost/admin/not_permitted',
            );
        });
    });

    describe('when logged in', () => {
        it('renders home button', async () => {
            await renderComponent(
                appProps({
                    account: user({}),
                }),
            );

            const loginLink = context.required('a.btn');
            expect(loginLink.text()).toEqual('Home');
            expect(loginLink.element<HTMLAnchorElement>().href).toEqual(
                'http://localhost/',
            );
        });
    });
});
