import {
    appProps,
    brandingProps,
    cleanUp,
    iocProps,
    renderApp,
    TestContext,
    user,
} from '../../helpers/tests.tsx';
import { DebugOptions } from './DebugOptions.tsx';
import { UserDto } from '../../interfaces/models/dtos/Identity/UserDto.ts';
import React from 'react';

describe('DebugOptions', () => {
    let context: TestContext;

    afterEach(async () => {
        await cleanUp(context);
    });

    async function renderComponent(
        account: UserDto | undefined,
        children: React.ReactNode,
    ) {
        context = await renderApp(
            iocProps(),
            brandingProps(),
            appProps({ account }),
            <DebugOptions>{children}</DebugOptions>,
        );
    }

    it('does not render when logged out', async () => {
        await renderComponent(undefined, <span>item</span>);

        expect(context.optional('.dropdown-menu')).toBeFalsy();
    });

    it('does not render when no access', async () => {
        const account = user({});

        await renderComponent(account, <span>item</span>);

        expect(context.optional('.dropdown-menu')).toBeFalsy();
    });

    it('does not render when not permitted', async () => {
        const account = user({
            showDebugOptions: false,
        });

        await renderComponent(account, <span>item</span>);

        expect(context.optional('.dropdown-menu')).toBeFalsy();
    });

    it('does not render when permitted', async () => {
        const account = user({
            showDebugOptions: true,
        });

        await renderComponent(account, <span>item</span>);

        expect(context.optional('.dropdown-menu')).toBeTruthy();
    });

    it('can expand dropdown', async () => {
        const account = user({
            showDebugOptions: true,
        });
        await renderComponent(account, <span>item</span>);

        await context.required('.dropdown-toggle').click();

        expect(context.optional('.dropdown-menu.show')).toBeTruthy();
    });

    it('can collapse dropdown', async () => {
        const account = user({
            showDebugOptions: true,
        });
        await renderComponent(account, <span>item</span>);
        await context.required('.dropdown-menu').click();

        await context.required('.dropdown-menu').click();

        expect(context.optional('.dropdown-menu.show')).toBeFalsy();
    });
});
