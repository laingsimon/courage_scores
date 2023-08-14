// noinspection JSUnresolvedFunction

import {cleanUp, renderApp} from "../../helpers/tests";
import React from "react";
import {DivisionHealth} from "./DivisionHealth";
import {ViewHealthCheck} from "./ViewHealthCheck";

describe('DivisionHealth', () => {
    let context;
    let reportedError;

    afterEach(() => {
        cleanUp(context);
    });

    async function renderComponent(result) {
        reportedError = null;
        context = await renderApp(
            { },
            { },
            {
                onError: (err) => {
                    reportedError = {
                        message: err.message,
                        stack: err.stack
                    };
                },
            },
            (<ViewHealthCheck result={result} />));
    }

    it('should render successful check', async () => {
        await renderComponent({
            success: false,
            errors: [],
            warnings: [],
            messages: [],
            checks: {
                'some description': {
                    success: true,
                    errors: [],
                    warnings: [],
                    messages: [],
                }
            },
        });

        expect(reportedError).toBeNull();
        const checkItems = Array.from(context.container.querySelectorAll('ol li'));
        expect(checkItems.length).toEqual(1);
        expect(checkItems[0].textContent).toContain('✔ some description');
    });

    it('should render unsuccessful check', async () => {
        await renderComponent({
            success: false,
            errors: [],
            warnings: [],
            messages: [],
            checks: {
                'some description': {
                    success: false,
                    errors: [],
                    warnings: [],
                    messages: [],
                }
            },
        });

        expect(reportedError).toBeNull();
        const checkItems = Array.from(context.container.querySelectorAll('ol li'));
        expect(checkItems.length).toEqual(1);
        expect(checkItems[0].textContent).toContain('❌ some description');
    });

    it('should render check errors', async () => {
        await renderComponent({
            success: false,
            errors: [],
            warnings: [],
            messages: [],
            checks: {
                'some description': {
                    success: true,
                    errors: [ 'some error' ],
                    warnings: [],
                    messages: [],
                }
            },
        });

        expect(reportedError).toBeNull();
        const checkItems = Array.from(context.container.querySelectorAll('ol li'));
        expect(checkItems.length).toEqual(1);
        expect(checkItems[0].textContent).toContain('some error');
    });

    it('should render check warnings', async () => {
        await renderComponent({
            success: false,
            errors: [],
            warnings: [],
            messages: [],
            checks: {
                'some description': {
                    success: true,
                    errors: [],
                    warnings: [ 'some warning' ],
                    messages: [],
                }
            },
        });

        expect(reportedError).toBeNull();
        const checkItems = Array.from(context.container.querySelectorAll('ol li'));
        expect(checkItems.length).toEqual(1);
        expect(checkItems[0].textContent).toContain('some warning');
    });

    it('should render check warnings', async () => {
        await renderComponent({
            success: false,
            errors: [],
            warnings: [],
            messages: [],
            checks: {
                'some description': {
                    success: true,
                    errors: [],
                    warnings: [],
                    messages: [ 'some message' ],
                }
            },
        });

        expect(reportedError).toBeNull();
        const checkItems = Array.from(context.container.querySelectorAll('ol li'));
        expect(checkItems.length).toEqual(1);
        expect(checkItems[0].textContent).toContain('some message');
    });
});