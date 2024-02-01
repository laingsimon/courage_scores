import React from "react";
import {appProps, brandingProps, cleanUp, doClick, iocProps, renderApp, TestContext} from "../../helpers/tests";
import {DebugOptions} from "./DebugOptions";
import {UserDto} from "../../interfaces/models/dtos/Identity/UserDto";

describe('DebugOptions', () => {
    let context: TestContext;

    afterEach(() => {
        cleanUp(context);
    });

    async function renderComponent(account: UserDto | null, children: React.ReactNode) {
        context = await renderApp(
            iocProps(),
            brandingProps(),
            appProps({account}),
            (<DebugOptions>{children}</DebugOptions>));
    }

    it('does not render when logged out', async () => {
        const account = null;

        await renderComponent(account, (<span>item</span>));

        const button = context.container.querySelector('.dropdown-menu');
        expect(button).toBeFalsy();
    });

    it('does not render when no access', async () => {
        const account: UserDto = {
            emailAddress: '',
            name: '',
            givenName: '',
            access: {},
        };

        await renderComponent(account, (<span>item</span>));

        const button = context.container.querySelector('.dropdown-menu');
        expect(button).toBeFalsy();
    });

    it('does not render when not permitted', async () => {
        const account: UserDto = {
            emailAddress: '',
            name: '',
            givenName: '',
            access: {
                showDebugOptions: false,
            }
        };

        await renderComponent(account, (<span>item</span>));

        const button = context.container.querySelector('.dropdown-menu');
        expect(button).toBeFalsy();
    });

    it('does not render when permitted', async () => {
        const account: UserDto = {
            emailAddress: '',
            name: '',
            givenName: '',
            access: {
                showDebugOptions: true,
            }
        };

        await renderComponent(account, (<span>item</span>));

        const button = context.container.querySelector('.dropdown-menu');
        expect(button).toBeTruthy();
    });

    it('can expand dropdown', async () => {
        const account: UserDto = {
            emailAddress: '',
            name: '',
            givenName: '',
            access: {
                showDebugOptions: true,
            }
        };
        await renderComponent(account, (<span>item</span>));

        await doClick(context.container, '.dropdown-toggle');

        expect(context.container.querySelector('.dropdown-menu.show')).toBeTruthy();
    });

    it('can collapse dropdown', async () => {
        const account: UserDto = {
            emailAddress: '',
            name: '',
            givenName: '',
            access: {
                showDebugOptions: true,
            }
        };
        await renderComponent(account, (<span>item</span>));
        await doClick(context.container, '.dropdown-menu');

        await doClick(context.container, '.dropdown-menu');

        expect(context.container.querySelector('.dropdown-menu.show')).toBeFalsy();
    });
});