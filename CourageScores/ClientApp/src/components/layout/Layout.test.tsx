import {
    appProps,
    brandingProps,
    cleanUp,
    iocProps,
    renderApp,
    TestContext,
} from '../../helpers/tests';
import { Layout } from './Layout';
import { IError } from '../common/IError';

describe('Layout', () => {
    let context: TestContext;

    afterEach(async () => {
        await cleanUp(context);
    });

    async function renderComponent(error?: IError, embed?: boolean) {
        context = await renderApp(
            iocProps(),
            brandingProps(),
            appProps({
                error,
                embed,
                divisions: [],
            }),
            <Layout />,
        );
    }

    describe('surround present', () => {
        it('when an error present', async () => {
            await renderComponent(
                { message: 'some error', stack: 'stack' },
                false,
            );

            expect(context.optional('.heading')).toBeTruthy();
            expect(context.optional('header')).toBeTruthy();
            const content = context.required('div.content-background');
            expect(content.text()).toContain('some error');
        });

        it('when no error present', async () => {
            await renderComponent(undefined, false);

            expect(context.optional('.heading')).toBeTruthy();
            expect(context.optional('header')).toBeTruthy();
            expect(context.optional('div.container')).toBeTruthy();
        });
    });

    describe('when embedded', () => {
        it('when an error present', async () => {
            await renderComponent(
                { message: 'some error', stack: 'stack' },
                true,
            );

            expect(context.optional('.heading')).toBeFalsy();
            expect(context.optional('header')).toBeFalsy();
            const content = context.required('div.content-background');
            expect(content.text()).toContain('some error');
        });

        it('when no error present', async () => {
            await renderComponent(undefined, true);

            expect(context.optional('.heading')).toBeFalsy();
            expect(context.optional('header')).toBeFalsy();
            expect(context.optional('div.container')).toBeTruthy();
        });
    });
});
