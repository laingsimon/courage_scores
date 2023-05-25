// noinspection JSUnresolvedFunction

import {cleanUp, renderApp, doClick, findButton} from "../../tests/helpers";
import React from "react";
import {UserAdmin} from "./UserAdmin";
import {AdminContainer} from "./AdminContainer";

describe('UserAdmin', () => {
    let context;
    let reportedError;
    let accountReloaded;
    let updatedAccess;

    const accountApi = {
        update: (update) => {
            updatedAccess = update;
            return { success: true };
        }
    };

    afterEach(() => {
        cleanUp(context);
    });

    async function renderComponent(accounts, account) {
        reportedError = null;
        accountReloaded = false;
        updatedAccess = null;
        context = await renderApp(
            { accountApi },
            {
                onError: (err) => {
                    reportedError = {
                        message: err.message,
                        stack: err.stack
                    };
                },
                account,
                reloadAccount: () => { accountReloaded = true; }
            },
            (<AdminContainer accounts={accounts}>
                <UserAdmin />
            </AdminContainer>));
    }

    function getAccess(name) {
        const item = context.container.querySelector(`input[id="${name}"]`);
        expect(item).toBeTruthy();
        return item;
    }

    it('renders when no user selected', async () => {
        const account = {
            emailAddress: 'a@b.com',
            name: 'Test 1',
        };

        await renderComponent( [ account ], account);

        expect(reportedError).toBeNull();
        expect(context.container.textContent).toContain('Manage access');
        expect(getAccess('manageAccess').checked).toEqual(false);
    });

    it('renders user with no access', async () => {
        const account = {
            emailAddress: 'a@b.com',
            name: 'Admin',
            access: {
                manageAccess: true,
            }
        };
        const otherAccount = {
            emailAddress: 'c@d.com',
            name: 'Test 1',
        };
        await renderComponent( [ account, otherAccount ], account);

        await doClick(context.container, '.dropdown-menu .dropdown-item:not(.active)');

        expect(reportedError).toBeNull();
        expect(context.container.textContent).toContain('Manage access');
        expect(getAccess('manageAccess').checked).toEqual(false);
    });

    it('renders user with no access', async () => {
        const account = {
            emailAddress: 'a@b.com',
            name: 'Admin',
            access: {
                manageAccess: true,
            }
        };
        const otherAccount = {
            emailAddress: 'c@d.com',
            name: 'Other user',
            access: {
                manageAccess: true,
            }
        };
        await renderComponent( [ account, otherAccount ], account);

        await doClick(context.container, '.dropdown-menu .dropdown-item:not(.active)');

        expect(reportedError).toBeNull();
        expect(context.container.textContent).toContain('Manage access');
        expect(getAccess('manageAccess').checked).toEqual(true);
    });

    it('can save change to access', async () => {
        const account = {
            emailAddress: 'a@b.com',
            name: 'Admin',
            access: {
                manageAccess: true,
            }
        };
        const otherAccount = {
            emailAddress: 'c@d.com',
            name: 'Other user',
            access: {
                manageAccess: true,
            }
        };
        await renderComponent( [ account, otherAccount ], account);

        await doClick(context.container, '.dropdown-menu .dropdown-item:not(.active)');
        await doClick(getAccess('manageGames'));
        await doClick(findButton(context.container,'Set access'));

        expect(reportedError).toBeNull();
        expect(updatedAccess).toEqual({
            access: {
                manageAccess: true,
                manageGames: true,
            },
            emailAddress: 'c@d.com',
        });
    });

    it('can change access for self', async () => {
        const account = {
            emailAddress: 'a@b.com',
            name: 'Admin',
            access: {
                manageAccess: true,
            }
        };
        const otherAccount = {
            emailAddress: 'c@d.com',
            name: 'Other user',
            access: {
                manageAccess: true,
            }
        };
        await renderComponent( [ account, otherAccount ], account);

        await doClick(getAccess('manageGames'));
        await doClick(findButton(context.container,'Set access'));

        expect(reportedError).toBeNull();
        expect(updatedAccess).not.toBeNull();
        expect(accountReloaded).toEqual(true);
    });
});