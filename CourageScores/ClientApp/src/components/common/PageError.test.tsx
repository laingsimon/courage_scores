import {
    appProps,
    brandingProps,
    cleanUp,
    doClick, ErrorState,
    findButton,
    iocProps,
    renderApp,
    TestContext
} from "../../helpers/tests";
import {PageError} from "./PageError";
import {IError} from "../../interfaces/IError";

describe('PageError', () => {
    let context: TestContext;
    let reportedError: ErrorState;
    let appError: IError;
    let reportedClientSideException: IError[];

    afterEach(() => {
        cleanUp(context);
    });

    function clearError() {
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
            appProps({
                error: appError,
                reportClientSideException,
                clearError,
            }, reportedError),
            (<PageError error={appError}/>));

        // don't allow onError to be called - would call infinite-loop/recursion
        reportedError.verifyNoError();
    }

    describe('with error details', () => {
        let error: IError;

        beforeEach(() => {
            error = {
                message: 'MESSAGE',
                stack: 'STACK'
            };
        });

        it('shows error details', async () => {
            await renderComponent(error);

            const message = context.container.querySelector('div.content-background > p > span:first-child');
            expect(message).toBeTruthy();
            expect(message.textContent).toEqual(error.message);
        });

        it('shows stack toggle', async () => {
            await renderComponent(error);

            const toggle = context.container.querySelector('div.content-background > p > span.form-switch');
            expect(toggle).toBeTruthy();
        });

        it('does not show stack toggle', async () => {
            error.stack = null;

            await renderComponent(error);

            const toggle = context.container.querySelector('div.content-background > p > span.form-switch');
            expect(toggle).toBeFalsy();
        });

        it('shows stack', async () => {
            await renderComponent(error);

            await doClick(context.container, 'div.content-background > p > span.form-switch > input');

            const stack = context.container.querySelector('div.content-background > pre');
            expect(stack).toBeTruthy();
            expect(stack.textContent).toEqual(error.stack);
        });

        it('hides stack', async () => {
            await renderComponent(error);
            await doClick(context.container, 'div.content-background > p > span.form-switch > input');
            // toggle on

            await doClick(context.container, 'div.content-background > p > span.form-switch > input');
            // toggle off

            const stack = context.container.querySelector('div.content-background > pre');
            expect(stack).toBeFalsy();
        });

        it('clears app error', async () => {
            await renderComponent(error);

            await doClick(findButton(context.container, 'Clear error'));

            expect(appError).toBeNull();
        });

        it('reports client-side exception', async () => {
            await renderComponent(error);

            expect(reportedClientSideException).toEqual([error]);
        });

        it('reports client-side exception once', async () => {
            await renderComponent(error);

            await doClick(findButton(context.container, 'Clear error'));

            expect(reportedClientSideException.length).toEqual(1);
        });
    });

    describe('error message', () => {
        const error: string = 'MESSAGE';

        it('shows error details', async () => {
            await renderComponent(error as IError);

            const message = context.container.querySelector('div.content-background > p > span:first-child');
            expect(message).toBeTruthy();
            expect(message.textContent).toEqual('MESSAGE');
        });

        it('does not show stack toggle', async () => {
            await renderComponent(error as IError);

            const toggle = context.container.querySelector('div.content-background > p > span.form-switch');
            expect(toggle).toBeFalsy();
        });

        it('clears app error', async () => {
            await renderComponent(error as IError);

            await doClick(findButton(context.container, 'Clear error'));

            expect(appError).toBeNull();
        });

        it('reports client-side exception', async () => {
            await renderComponent(error as IError);

            expect(reportedClientSideException).toEqual([error]);
        });
    });
});