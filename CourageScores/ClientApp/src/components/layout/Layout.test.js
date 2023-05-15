// noinspection JSUnresolvedFunction

import {cleanUp, renderApp} from "../../tests/helpers";
import React from "react";
import {Layout} from "./Layout";

describe('Layout', () => {
    let context;
    let reportedError;

    afterEach(() => {
        cleanUp(context);
    });

    async function renderComponent(error, excludeSurround) {
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
                error,
                excludeSurround,
                divisions: [],
                reportClientSideException: () => {}
            },
            (<Layout />));
    }

    describe('surround present', () => {
        it('when an error present', async () => {
            await renderComponent({ message: 'some error', stack: 'stack' }, false);

            expect(context.container.querySelector('.heading')).toBeTruthy();
            expect(context.container.querySelector('header')).toBeTruthy();
            const content = context.container.querySelector('div.light-background');
            expect(content).toBeTruthy();
            expect(content.textContent).toContain('some error');
        });

        it('when no error present', async () => {
            await renderComponent(null, false);

            expect(context.container.querySelector('.heading')).toBeTruthy();
            expect(context.container.querySelector('header')).toBeTruthy();
            const content = context.container.querySelector('div.container');
            expect(content).toBeTruthy();
        });
    });

    describe('when no surround', () => {
        it('when an error present', async () => {
            await renderComponent({ message: 'some error', stack: 'stack' }, true);

            expect(context.container.querySelector('.heading')).toBeFalsy();
            expect(context.container.querySelector('header')).toBeFalsy();
            const content = context.container.querySelector('div.light-background');
            expect(content).toBeTruthy();
            expect(content.textContent).toContain('some error');
        });

        it('when no error present', async () => {
            await renderComponent(null, true);

            expect(context.container.querySelector('.heading')).toBeFalsy();
            expect(context.container.querySelector('header')).toBeFalsy();
            console.log(context.container.innerHTML);
            const content = context.container.querySelector('div.container');
            expect(content).toBeTruthy();
        });
    });
});