import {appProps, cleanUp, doClick, iocProps, renderApp, TestContext} from "../../helpers/tests";
import React from "react";
import {Heading} from "./Heading";
import {IBranding} from "../../interfaces/IBranding";
import {IBuild} from "../../interfaces/IBuild";
import {IBrandingContainerProps} from "../../BrandingContainer";

describe('Heading', () => {
    let context: TestContext;

    afterEach(() => {
        cleanUp(context);
    });

    async function renderComponent(build: IBuild, branding: IBrandingContainerProps) {
        context = await renderApp(
            iocProps(),
            branding,
            appProps({build}),
            (<Heading/>));
    }

    describe('renders', () => {
        const emptyBuild: IBuild = {
            branch: '',
            date: '',
            version: '',
        };

        it('branded email', async () => {
            await renderComponent(emptyBuild, {
                email: 'someone@somewhere.com',
                name: 'name',
            });

            const emailLink = context.container.querySelector('a[href^=mailto]') as HTMLAnchorElement;
            expect(emailLink.href).toEqual('mailto:someone@somewhere.com');
            expect(emailLink.textContent).toContain('someone@somewhere.com');
        });

        it('branded facebook', async () => {
            await renderComponent(emptyBuild, {
                facebook: 'CourageScores',
                name: 'name',
            });

            const facebookLink = context.container.querySelector('a[href^="https://www.facebook.com"]') as HTMLAnchorElement;
            expect(facebookLink.href).toEqual('https://www.facebook.com/CourageScores');
        });

        it('branded twitter', async () => {
            await renderComponent(emptyBuild, {
                twitter: 'CourageScores',
                name: 'name',
            });

            const twitterLink = context.container.querySelector('a[href^="https://twitter.com"]') as HTMLAnchorElement;
            expect(twitterLink.href).toEqual('https://twitter.com/CourageScores');
        });

        it('branded name', async () => {
            await renderComponent(emptyBuild, {
                name: 'Courage Scores',
            });

            const heading = context.container.querySelector('h1.heading') as HTMLHeadingElement;
            expect(heading.textContent).toEqual('Courage Scores');
        });

        it('when on release branch', async () => {
            await renderComponent({
                branch: 'release',
                version: '0123456789abcdef',
                date: '2023-04-05T06:07:08',
            }, { name: '' });

            const version = context.container.querySelector('span.bg-warning') as HTMLElement;
            expect(version).toBeFalsy();
        });

        it('when on other branch', async () => {
            await renderComponent({
                branch: 'main',
                version: '0123456789abcdef',
                date: '2023-04-05T06:07:08',
            }, { name: '' });

            const version = context.container.querySelector('span.bg-warning') as HTMLElement;
            expect(version).toBeTruthy();
            expect(version.textContent).toEqual('01234567');
        });

        it('when clicked', async () => {
            await renderComponent({
                branch: 'main',
                version: '0123456789abcdef',
                date: '2023-04-05T06:07:08',
            }, { name: '' });
            let alert: string;
            window.alert = (message) => {
                alert = message
            };

            await doClick(context.container.querySelector('span.bg-warning'));

            expect(alert).toEqual('Branch: main\nSHA: 01234567');
        });

        it('when undefined', async () => {
            await renderComponent(undefined!, undefined!);

            const version = context.container.querySelector('span.bg-warning') as HTMLElement;
            expect(version).toBeFalsy();
        });

        it('when no version', async () => {
            await renderComponent({
                branch: 'main',
                version: null,
                date: '2023-04-05T06:07:08',
            }, { name: '' });

            const version = context.container.querySelector('span.bg-warning') as HTMLElement;
            expect(version).toBeFalsy();
        });

        it('when no branch', async () => {
            await renderComponent({
                branch: null,
                version: '0123456789abcdef',
                date: '2023-04-05T06:07:08',
            }, { name: '' });

            const version = context.container.querySelector('span.bg-warning') as HTMLElement;
            expect(version).toBeFalsy();
        });
    });
});