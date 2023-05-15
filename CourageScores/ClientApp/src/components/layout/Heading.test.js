// noinspection JSUnresolvedFunction

import {cleanUp, renderApp, doClick} from "../../tests/helpers";
import React from "react";
import {Heading} from "./Heading";

describe('Heading', () => {
    let context;
    let reportedError;

    afterEach(() => {
        cleanUp(context);
    });

    async function renderComponent(build) {
        reportedError = null;
        context = await renderApp(
            { },
            {
                onError: (err) => {
                    reportedError = {
                        message: err.message,
                        stack: err.stack
                    };
                },
                build
            },
            (<Heading />));
    }

    describe('renders', () => {
        it('when on release branch', async () => {
            await renderComponent({
                branch: 'release',
                version: '0123456789abcdef',
                date: '2023-04-05T06:07:08',
            });

            const version = context.container.querySelector('span.bg-warning');
            expect(version).toBeFalsy();
        });

        it('when on other branch', async () => {
            await renderComponent({
                branch: 'main',
                version: '0123456789abcdef',
                date: '2023-04-05T06:07:08',
            });

            const version = context.container.querySelector('span.bg-warning');
            expect(version).toBeTruthy();
            expect(version.textContent).toEqual('01234567');
        });

        it('when clicked', async () => {
            await renderComponent({
                branch: 'main',
                version: '0123456789abcdef',
                date: '2023-04-05T06:07:08',
            });
            const version = context.container.querySelector('span.bg-warning');
            expect(version).toBeTruthy();
            let alert;
            window.alert = (message) => { alert = message };

            await doClick(version);

            expect(alert).toEqual('Branch: main\nSHA: 01234567');
        });

        it('when undefined', async () => {
            await renderComponent();

            const version = context.container.querySelector('span.bg-warning');
            expect(version).toBeFalsy();
        });

        it('when no version', async () => {
            await renderComponent({
                branch: 'main',
                version: null,
                date: '2023-04-05T06:07:08',
            });

            const version = context.container.querySelector('span.bg-warning');
            expect(version).toBeFalsy();
        });

        it('when no branch', async () => {
            await renderComponent({
                branch: null,
                version: '0123456789abcdef',
                date: '2023-04-05T06:07:08',
            });

            const version = context.container.querySelector('span.bg-warning');
            expect(version).toBeFalsy();
        });
    });
});