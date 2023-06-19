// noinspection JSUnresolvedFunction

import {cleanUp, renderApp, doClick, findButton} from "../helpers/tests";
import React from "react";
import {PageError} from "./PageError";

describe('PageError', () => {
    let context;
    let reportedError;
    let appError;
    let reportedClientSideException;

    afterEach(() => {
        cleanUp(context);
    });

    function clearError() {
        appError = null;
    }

    async function reportClientSideException(error) {
        reportedClientSideException.push(error);
    }

    async function renderComponent(error) {
        reportedError = null;
        reportedClientSideException = [];
        appError = error;
        context = await renderApp(
            { },
            {
                onError: (err) => {
                    reportedError = {
                        message: err.message,
                        stack: err.stack
                    };
                },
                error: appError,
                reportClientSideException,
                clearError
            },
            (<PageError error={appError} />));

        // don't allow onError to be called - would call infinite-loop/recursion
        expect(reportedError).toBeNull();
    }

    describe('with error details', () => {
        let error;

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
        const error = 'MESSAGE';

        it('shows error details', async () => {
            await renderComponent(error);

            const message = context.container.querySelector('div.content-background > p > span:first-child');
            expect(message).toBeTruthy();
            expect(message.textContent).toEqual('MESSAGE');
        });

        it('does not show stack toggle', async () => {
            await renderComponent(error);

            const toggle = context.container.querySelector('div.content-background > p > span.form-switch');
            expect(toggle).toBeFalsy();
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
    });
});