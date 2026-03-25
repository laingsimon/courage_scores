import {
    appProps,
    brandingProps,
    cleanUp,
    ErrorState,
    iocProps,
    renderApp,
    TestContext,
} from '../../helpers/tests';
import { PageError } from './PageError';
import { IError } from './IError';

describe('PageError', () => {
    let context: TestContext;
    let reportedError: ErrorState;
    let appError: IError | null;
    let reportedClientSideException: IError[];

    afterEach(async () => {
        await cleanUp(context);
    });

    async function clearError() {
        appError = null;
    }

    async function reportClientSideException(error: IError) {
        reportedClientSideException.push(error);
    }

    async function renderComponent(error: IError) {
        reportedError = new ErrorState();
        reportedClientSideException = [];
        appError = error;
        context = await renderApp(
            iocProps(),
            brandingProps(),
            appProps(
                {
                    error: appError,
                    reportClientSideException,
                    clearError,
                },
                reportedError,
            ),
            <PageError error={appError} />,
        );

        // don't allow onError to be called - would call infinite-loop/recursion
        reportedError.verifyNoError();
    }

    describe('with error details', () => {
        let error: IError;

        beforeEach(() => {
            error = {
                message: 'MESSAGE',
                stack: 'STACK',
            };
        });

        it('shows error details', async () => {
            await renderComponent(error);

            const message = context.required(
                'div.content-background > p > span:first-child',
            );
            expect(message.text()).toEqual(error.message);
        });

        it('shows stack toggle', async () => {
            await renderComponent(error);

            expect(
                context.optional(
                    'div.content-background > p > span.form-switch',
                ),
            ).toBeTruthy();
        });

        it('does not show stack toggle', async () => {
            error.stack = undefined;

            await renderComponent(error);

            expect(
                context.optional(
                    'div.content-background > p > span.form-switch',
                ),
            ).toBeFalsy();
        });

        it('shows stack', async () => {
            await renderComponent(error);

            await context
                .required(
                    'div.content-background > p > span.form-switch > input',
                )
                .click();

            const stack = context.required('div.content-background > pre');
            expect(stack.text()).toEqual(error.stack);
        });

        it('hides stack', async () => {
            await renderComponent(error);
            await context
                .required(
                    'div.content-background > p > span.form-switch > input',
                )
                .click();
            // toggle on

            await context
                .required(
                    'div.content-background > p > span.form-switch > input',
                )
                .click();
            // toggle off

            expect(
                context.optional('div.content-background > pre'),
            ).toBeFalsy();
        });

        it('clears app error', async () => {
            await renderComponent(error);

            await context.button('Clear error').click();

            expect(appError).toBeNull();
        });

        it('reports client-side exception', async () => {
            await renderComponent(error);

            expect(reportedClientSideException).toEqual([error]);
        });

        it('reports client-side exception once', async () => {
            await renderComponent(error);

            await context.button('Clear error').click();

            expect(reportedClientSideException.length).toEqual(1);
        });
    });

    describe('error message', () => {
        const error: string = 'MESSAGE';

        it('shows error details', async () => {
            await renderComponent(error as IError);

            const message = context.required(
                'div.content-background > p > span:first-child',
            );
            expect(message.text()).toEqual('MESSAGE');
        });

        it('does not show stack toggle', async () => {
            await renderComponent(error as IError);

            expect(
                context.optional(
                    'div.content-background > p > span.form-switch',
                ),
            ).toBeFalsy();
        });

        it('clears app error', async () => {
            await renderComponent(error as IError);

            await context.button('Clear error').click();

            expect(appError).toBeNull();
        });

        it('reports client-side exception', async () => {
            await renderComponent(error as IError);

            expect(reportedClientSideException).toEqual([error]);
        });
    });
});
