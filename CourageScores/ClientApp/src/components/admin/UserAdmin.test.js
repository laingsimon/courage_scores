// noinspection JSUnresolvedFunction

import {cleanUp, renderApp, doClick, findButton, doSelectOption} from "../../helpers/tests";
import React from "react";
import {UserAdmin} from "./UserAdmin";
import {AdminContainer} from "./AdminContainer";

describe('UserAdmin', () => {
    let context;
    let reportedError;
    let accountReloaded;
    let updatedAccess;
    let apiResponse;

    const accountApi = {
        update: (update) => {
            updatedAccess = update;
            return apiResponse || { success: true };
        }
    };

    afterEach(() => {
        cleanUp(context);
    });

    async function renderComponent(accounts, account) {
        reportedError = null;
        accountReloaded = false;
        updatedAccess = null;
        apiResponse = null;
        context = await renderApp(
            { accountApi },
            { name: 'Courage Scores' },
            {
                onError: (err) => {
                    reportedError = {
                        message: err.message,
                        stack: err.stack
                    };
                },
                account,
                reloadAccount: () => { accountReloaded = true; },
                reportClientSideException: () => {},
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

    it('renders user email addresses', async () => {
        const account = {
            emailAddress: 'a@b.com',
            name: 'Test 1',
        };
        await renderComponent( [ account ], account);

        await doClick(context.container, 'input[id="showEmailAddress"]');

        expect(reportedError).toBeNull();
        expect(context.container.textContent).toContain('You a@b.com');
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

        await doSelectOption(context.container.querySelector('.dropdown-menu'), 'Test 1');

        expect(reportedError).toBeNull();
        expect(context.container.textContent).toContain('Manage access');
        expect(getAccess('manageAccess').checked).toEqual(false);
    });

    it('renders user with access', async () => {
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

        await doSelectOption(context.container.querySelector('.dropdown-menu'), 'Other user');

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
        await doSelectOption(context.container.querySelector('.dropdown-menu'), 'Other user');
        await doClick(getAccess('manageGames'));

        await doClick(findButton(context.container, 'Set access'));

        expect(reportedError).toBeNull();
        expect(updatedAccess).toEqual({
            access: {
                manageAccess: true,
                manageGames: true,
            },
            emailAddress: 'c@d.com',
        });
    });

    it('handles error during save', async () => {
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
        await doSelectOption(context.container.querySelector('.dropdown-menu'), 'Other user');
        await doClick(getAccess('manageGames'));
        apiResponse = { success: false, errors: [ 'SOME ERROR' ] };

        await doClick(findButton(context.container, 'Set access'));

        expect(reportedError).toBeNull();
        expect(context.container.textContent).toContain('SOME ERROR');
        expect(context.container.textContent).toContain('Could not save access');
    });

    it('can close error dialog after save failure', async () => {
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
        await doSelectOption(context.container.querySelector('.dropdown-menu'), 'Other user');
        await doClick(getAccess('manageGames'));
        apiResponse = { success: false, errors: [ 'SOME ERROR' ] };
        await doClick(findButton(context.container, 'Set access'));
        expect(context.container.textContent).toContain('Could not save access');

        await doClick(findButton(context.container, 'Close'));

        expect(context.container.textContent).not.toContain('Could not save access');
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

        await doClick(findButton(context.container, 'Set access'));

        expect(reportedError).toBeNull();
        expect(updatedAccess).not.toBeNull();
        expect(accountReloaded).toEqual(true);
    });
});