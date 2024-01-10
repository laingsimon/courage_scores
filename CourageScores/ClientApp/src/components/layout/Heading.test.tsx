// noinspection JSUnresolvedFunction

import {cleanUp, doClick, renderApp} from "../../helpers/tests";
import React from "react";
import {Heading} from "./Heading";

describe('Heading', () => {
    let context;
    let reportedError;

    afterEach(() => {
        cleanUp(context);
    });

    async function renderComponent(build, branding) {
        reportedError = null;
        context = await renderApp(
            {},
            branding,
            {
                onError: (err) => {
                    reportedError = {
                        message: err.message,
                        stack: err.stack
                    };
                },
                build
            },
            (<Heading/>));
    }

    describe('renders', () => {
        it('branded email', async () => {
            await renderComponent({}, {
                email: 'someone@somewhere.com',
            });

            const emailLink = context.container.querySelector('a[href^=mailto]');
            expect(emailLink.href).toEqual('mailto:someone@somewhere.com');
            expect(emailLink.textContent).toContain('someone@somewhere.com');
        });

        it('branded facebook', async () => {
            await renderComponent({}, {
                facebook: 'CourageScores',
            });

            const facebookLink = context.container.querySelector('a[href^="https://www.facebook.com"]');
            expect(facebookLink.href).toEqual('https://www.facebook.com/CourageScores');
        });

        it('branded twitter', async () => {
            await renderComponent({}, {
                twitter: 'CourageScores',
            });

            const twitterLink = context.container.querySelector('a[href^="https://twitter.com"]');
            expect(twitterLink.href).toEqual('https://twitter.com/CourageScores');
        });

        it('branded name', async () => {
            await renderComponent({}, {
                name: 'Courage Scores',
            });

            const heading = context.container.querySelector('h1.heading');
            expect(heading.textContent).toEqual('Courage Scores');
        });

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
            let alert;
            window.alert = (message) => {
                alert = message
            };

            await doClick(context.container.querySelector('span.bg-warning'));

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