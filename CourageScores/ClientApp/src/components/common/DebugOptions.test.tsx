// noinspection JSUnresolvedFunction

import React from "react";
import {cleanUp, doClick, renderApp} from "../../helpers/tests";
import {DebugOptions} from "./DebugOptions";

describe('DebugOptions', () => {
    let context;

    afterEach(() => {
        cleanUp(context);
    });

    async function renderComponent(account, children) {
        context = await renderApp(
            {},
            {name: 'Courage Scores'},
            {account},
            (<DebugOptions>{children}</DebugOptions>));
    }

    it('does not render when logged out', async () => {
        const account = null;

        await renderComponent(account, (<span>item</span>));

        const button = context.container.querySelector('.dropdown-menu');
        expect(button).toBeFalsy();
    });

    it('does not render when no access', async () => {
        const account = { };

        await renderComponent(account, (<span>item</span>));

        const button = context.container.querySelector('.dropdown-menu');
        expect(button).toBeFalsy();
    });

    it('does not render when not permitted', async () => {
        const account = {
            access: {
                showDebugOptions: false,
            }
        };

        await renderComponent(account, (<span>item</span>));

        const button = context.container.querySelector('.dropdown-menu');
        expect(button).toBeFalsy();
    });

    it('does not render when permitted', async () => {
        const account = {
            access: {
                showDebugOptions: true,
            }
        };

        await renderComponent(account, (<span>item</span>));

        const button = context.container.querySelector('.dropdown-menu');
        expect(button).toBeTruthy();
    });

    it('can expand dropdown', async () => {
        const account = {
            access: {
                showDebugOptions: true,
            }
        };
        await renderComponent(account, (<span>item</span>));

        await doClick(context.container, '.dropdown-toggle');

        expect(context.container.querySelector('.dropdown-menu.show')).toBeTruthy();
    });

    it('can collapse dropdown', async () => {
        const account = {
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