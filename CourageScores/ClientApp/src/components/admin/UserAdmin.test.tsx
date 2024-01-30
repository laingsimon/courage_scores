import {
    api,
    appProps,
    brandingProps,
    cleanUp,
    doClick,
    doSelectOption, ErrorState,
    findButton,
    iocProps,
    renderApp, TestContext
} from "../../helpers/tests";
import React from "react";
import {UserAdmin} from "./UserAdmin";
import {AdminContainer} from "./AdminContainer";
import {IUpdateAccessDto} from "../../interfaces/models/dtos/Identity/IUpdateAccessDto";
import {IClientActionResultDto} from "../../interfaces/IClientActionResultDto";
import {IUserDto} from "../../interfaces/models/dtos/Identity/IUserDto";
import {IAccountApi} from "../../interfaces/apis/AccountApi";

describe('UserAdmin', () => {
    let context: TestContext;
    let reportedError: ErrorState;
    let accountReloaded: boolean;
    let updatedAccess: IUpdateAccessDto;
    let apiResponse: IClientActionResultDto<IUserDto>;

    const accountApi = api<IAccountApi>({
        update: (update: IUpdateAccessDto) => {
            updatedAccess = update;
            return apiResponse || {success: true};
        }
    });

    afterEach(() => {
        cleanUp(context);
    });

    beforeEach(() => {
        reportedError = new ErrorState();
        accountReloaded = false;
        updatedAccess = null;
        apiResponse = null;
    });

    async function renderComponent(accounts: IUserDto[], account: IUserDto) {
        context = await renderApp(
            iocProps({accountApi}),
            brandingProps(),
            appProps({
                account,
                reloadAccount: () => {
                    accountReloaded = true;
                },
            }, reportedError),
            (<AdminContainer accounts={accounts} tables={[]}>
                <UserAdmin/>
            </AdminContainer>));
    }

    function getAccess(name: string): HTMLInputElement {
        const item = context.container.querySelector(`input[id="${name}"]`) as HTMLInputElement;
        expect(item).toBeTruthy();
        return item;
    }

    it('renders when no user selected', async () => {
        const account: IUserDto = {
            givenName: '',
            emailAddress: 'a@b.com',
            name: 'Test 1',
        };

        await renderComponent([account], account);

        expect(reportedError.hasError()).toEqual(false);
        expect(context.container.textContent).toContain('Manage access');
        expect(getAccess('manageAccess').checked).toEqual(false);
    });

    it('renders user email addresses', async () => {
        const account: IUserDto = {
            givenName: '',
            emailAddress: 'a@b.com',
            name: 'Test 1',
        };
        await renderComponent([account], account);

        await doClick(context.container, 'input[id="showEmailAddress"]');

        expect(reportedError.hasError()).toEqual(false);
        expect(context.container.textContent).toContain('You a@b.com');
    });

    it('renders user with no access', async () => {
        const account: IUserDto = {
            givenName: '',
            emailAddress: 'a@b.com',
            name: 'Admin',
            access: {
                manageAccess: true,
            }
        };
        const otherAccount: IUserDto = {
            givenName: '',
            emailAddress: 'c@d.com',
            name: 'Test 1',
        };
        await renderComponent([account, otherAccount], account);

        await doSelectOption(context.container.querySelector('.dropdown-menu'), 'Test 1');

        expect(reportedError.hasError()).toEqual(false);
        expect(context.container.textContent).toContain('Manage access');
        expect(getAccess('manageAccess').checked).toEqual(false);
    });

    it('renders user with access', async () => {
        const account: IUserDto = {
            givenName: '',
            emailAddress: 'a@b.com',
            name: 'Admin',
            access: {
                manageAccess: true,
            }
        };
        const otherAccount: IUserDto = {
            givenName: '',
            emailAddress: 'c@d.com',
            name: 'Other user',
            access: {
                manageAccess: true,
            }
        };
        await renderComponent([account, otherAccount], account);

        await doSelectOption(context.container.querySelector('.dropdown-menu'), 'Other user');

        expect(reportedError.hasError()).toEqual(false);
        expect(context.container.textContent).toContain('Manage access');
        expect(getAccess('manageAccess').checked).toEqual(true);
    });

    it('can save change to access', async () => {
        const account: IUserDto = {
            givenName: '',
            emailAddress: 'a@b.com',
            name: 'Admin',
            access: {
                manageAccess: true,
            }
        };
        const otherAccount: IUserDto = {
            givenName: '',
            emailAddress: 'c@d.com',
            name: 'Other user',
            access: {
                manageAccess: true,
            }
        };
        await renderComponent([account, otherAccount], account);
        await doSelectOption(context.container.querySelector('.dropdown-menu'), 'Other user');
        await doClick(getAccess('manageGames'));

        await doClick(findButton(context.container, 'Set access'));

        expect(reportedError.hasError()).toEqual(false);
        expect(updatedAccess).toEqual({
            access: {
                manageAccess: true,
                manageGames: true,
            },
            emailAddress: 'c@d.com',
        });
    });

    it('handles error during save', async () => {
        const account: IUserDto = {
            givenName: '',
            emailAddress: 'a@b.com',
            name: 'Admin',
            access: {
                manageAccess: true,
            }
        };
        const otherAccount: IUserDto = {
            givenName: '',
            emailAddress: 'c@d.com',
            name: 'Other user',
            access: {
                manageAccess: true,
            }
        };
        await renderComponent([account, otherAccount], account);
        await doSelectOption(context.container.querySelector('.dropdown-menu'), 'Other user');
        await doClick(getAccess('manageGames'));
        apiResponse = {success: false, errors: ['SOME ERROR']};

        await doClick(findButton(context.container, 'Set access'));

        expect(reportedError.hasError()).toEqual(false);
        expect(context.container.textContent).toContain('SOME ERROR');
        expect(context.container.textContent).toContain('Could not save access');
    });

    it('can close error dialog after save failure', async () => {
        const account: IUserDto = {
            givenName: '',
            emailAddress: 'a@b.com',
            name: 'Admin',
            access: {
                manageAccess: true,
            }
        };
        const otherAccount: IUserDto = {
            givenName: '',
            emailAddress: 'c@d.com',
            name: 'Other user',
            access: {
                manageAccess: true,
            }
        };
        await renderComponent([account, otherAccount], account);
        await doSelectOption(context.container.querySelector('.dropdown-menu'), 'Other user');
        await doClick(getAccess('manageGames'));
        apiResponse = {success: false, errors: ['SOME ERROR']};
        await doClick(findButton(context.container, 'Set access'));
        expect(context.container.textContent).toContain('Could not save access');

        await doClick(findButton(context.container, 'Close'));

        expect(context.container.textContent).not.toContain('Could not save access');
    });

    it('can change access for self', async () => {
        const account: IUserDto = {
            givenName: '',
            emailAddress: 'a@b.com',
            name: 'Admin',
            access: {
                manageAccess: true,
            }
        };
        const otherAccount: IUserDto = {
            givenName: '',
            emailAddress: 'c@d.com',
            name: 'Other user',
            access: {
                manageAccess: true,
            }
        };
        await renderComponent([account, otherAccount], account);
        await doClick(getAccess('manageGames'));

        await doClick(findButton(context.container, 'Set access'));

        expect(reportedError.hasError()).toEqual(false);
        expect(updatedAccess).not.toBeNull();
        expect(accountReloaded).toEqual(true);
    });
});