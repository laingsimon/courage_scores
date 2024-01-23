import {appProps, brandingProps, cleanUp, iocProps, renderApp, TestContext} from "../../helpers/tests";
import React from "react";
import {EmbedAwareLink} from "./EmbedAwareLink";

describe('EmbedAwareLink', () => {
    let context: TestContext;

    afterEach(() => {
        cleanUp(context);
    });

    async function renderComponent(embed: boolean, to: string, children: React.ReactNode) {
        context = await renderApp(
            iocProps(),
            brandingProps(),
            appProps({embed}),
            (<EmbedAwareLink to={to}>{children}</EmbedAwareLink>));
    }

    describe('when embedded', () => {
        const embed: boolean = true;

        it('adds target and rel attributes', async () => {
            await renderComponent(embed, '/somewhere', (<span>Hello</span>));

            expect(context.container.querySelector('a').target).toEqual('_blank');
            expect(context.container.querySelector('a').rel).toEqual('noopener noreferrer');
        });

        it('renders children', async () => {
            await renderComponent(embed, '/somewhere', (<span>Hello</span>));

            expect(context.container.querySelector('a').innerHTML).toEqual('<span>Hello</span>');
        });

        it('links to correct address', async () => {
            await renderComponent(embed, '/somewhere', (<span>Hello</span>));

            expect(context.container.querySelector('a').href).toEqual('http://localhost/somewhere');
        });
    });

    describe('when not embedded', () => {
        const embed: boolean = false;

        it('does not add target or rel attributes', async () => {
            await renderComponent(embed, '/somewhere', (<span>Hello</span>));

            expect(context.container.querySelector('a').target).toBeFalsy();
            expect(context.container.querySelector('a').rel).toBeFalsy();
        });

        it('renders children', async () => {
            await renderComponent(embed, '/somewhere', (<span>Hello</span>));

            expect(context.container.querySelector('a').innerHTML).toEqual('<span>Hello</span>');
        });

        it('links to correct address', async () => {
            await renderComponent(embed, '/somewhere', (<span>Hello</span>));

            expect(context.container.querySelector('a').href).toEqual('http://localhost/somewhere');
        });
    });
});