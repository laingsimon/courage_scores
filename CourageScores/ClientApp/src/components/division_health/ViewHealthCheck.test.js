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

    function assertHeading(text, className) {
        const heading = context.container.querySelector('h3');
        expect(heading.textContent).toEqual(text);
        expect(heading.className).toContain(className);
    }

    it('when success and no errors or warnings should show healthy', async () => {
        await renderComponent({
            success: true,
            errors: [],
            warnings: [],
            messages: [],
            checks: {},
        });

        expect(reportedError).toBeNull();
        assertHeading('Status: Healthy', 'text-success');
    });

    it('when success and some errors should show unhealthy', async () => {
        await renderComponent({
            success: true,
            errors: [ 'some error' ],
            warnings: [],
            messages: [],
            checks: {},
        });

        expect(reportedError).toBeNull();
        assertHeading('Status: Unhealthy', 'text-warning');
    });

    it('when success and some warnings should show unhealthy', async () => {
        await renderComponent({
            success: true,
            errors: [],
            warnings: [ 'warning' ],
            messages: [],
            checks: {},
        });

        expect(reportedError).toBeNull();
        assertHeading('Status: Unhealthy', 'text-warning');
    });

    it('when success and some messages should show healthy', async () => {
        await renderComponent({
            success: true,
            errors: [],
            warnings: [],
            messages: [ 'message' ],
            checks: {},
        });

        expect(reportedError).toBeNull();
        assertHeading('Status: Healthy', 'text-success');
    });

    it('when unsuccess and no errors, warnings or messages should show unhealthy', async () => {
        await renderComponent({
            success: false,
            errors: [],
            warnings: [],
            messages: [],
            checks: {},
        });

        expect(reportedError).toBeNull();
        assertHeading('Status: Unhealthy', 'text-warning');
    });

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