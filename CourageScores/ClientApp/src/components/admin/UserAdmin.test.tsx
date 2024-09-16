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
import {UserAdmin} from "./UserAdmin";
import {AdminContainer} from "./AdminContainer";
import {UpdateAccessDto} from "../../interfaces/models/dtos/Identity/UpdateAccessDto";
import {IClientActionResultDto} from "../common/IClientActionResultDto";
import {UserDto} from "../../interfaces/models/dtos/Identity/UserDto";
import {IAccountApi} from "../../interfaces/apis/IAccountApi";

describe('UserAdmin', () => {
    let context: TestContext;
    let reportedError: ErrorState;
    let accountReloaded: boolean;
    let updatedAccess: UpdateAccessDto;
    let apiResponse: IClientActionResultDto<UserDto>;

    const accountApi = api<IAccountApi>({
        update: async (update: UpdateAccessDto) => {
            updatedAccess = update;
            return apiResponse || {success: true};
        }
    });

    afterEach(async () => {
        await cleanUp(context);
    });

    beforeEach(() => {
        reportedError = new ErrorState();
        accountReloaded = false;
        updatedAccess = null;
        apiResponse = null;
    });

    async function renderComponent(accounts: UserDto[], account: UserDto) {
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
        const account: UserDto = {
            givenName: '',
            emailAddress: 'a@b.com',
            name: 'Test 1',
        };

        await renderComponent([account], account);

        reportedError.verifyNoError();
        expect(context.container.textContent).toContain('Manage access');
        expect(getAccess('manageAccess').checked).toEqual(false);
    });

    it('renders user email addresses', async () => {
        const account: UserDto = {
            givenName: '',
            emailAddress: 'a@b.com',
            name: 'Test 1',
        };
        await renderComponent([account], account);

        await doClick(context.container, 'input[id="showEmailAddress"]');

        reportedError.verifyNoError();
        expect(context.container.textContent).toContain('You a@b.com');
    });

    it('renders user with no access', async () => {
        const account: UserDto = {
            givenName: '',
            emailAddress: 'a@b.com',
            name: 'Admin',
            access: {
                manageAccess: true,
            }
        };
        const otherAccount: UserDto = {
            givenName: '',
            emailAddress: 'c@d.com',
            name: 'Test 1',
        };
        await renderComponent([account, otherAccount], account);

        await doSelectOption(context.container.querySelector('.dropdown-menu'), 'Test 1');

        reportedError.verifyNoError();
        expect(context.container.textContent).toContain('Manage access');
        expect(getAccess('manageAccess').checked).toEqual(false);
    });

    it('renders user with access', async () => {
        const account: UserDto = {
            givenName: '',
            emailAddress: 'a@b.com',
            name: 'Admin',
            access: {
                manageAccess: true,
            }
        };
        const otherAccount: UserDto = {
            givenName: '',
            emailAddress: 'c@d.com',
            name: 'Other user',
            access: {
                manageAccess: true,
            }
        };
        await renderComponent([account, otherAccount], account);

        await doSelectOption(context.container.querySelector('.dropdown-menu'), 'Other user');

        reportedError.verifyNoError();
        expect(context.container.textContent).toContain('Manage access');
        expect(getAccess('manageAccess').checked).toEqual(true);
    });

    it('can save change to access', async () => {
        const account: UserDto = {
            givenName: '',
            emailAddress: 'a@b.com',
            name: 'Admin',
            access: {
                manageAccess: true,
            }
        };
        const otherAccount: UserDto = {
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

        reportedError.verifyNoError();
        expect(updatedAccess).toEqual({
            access: {
                manageAccess: true,
                manageGames: true,
            },
            emailAddress: 'c@d.com',
        });
    });

    it('handles error during save', async () => {
        const account: UserDto = {
            givenName: '',
            emailAddress: 'a@b.com',
            name: 'Admin',
            access: {
                manageAccess: true,
            }
        };
        const otherAccount: UserDto = {
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

        reportedError.verifyNoError();
        expect(context.container.textContent).toContain('SOME ERROR');
        expect(context.container.textContent).toContain('Could not save access');
    });

    it('can close error dialog after save failure', async () => {
        const account: UserDto = {
            givenName: '',
            emailAddress: 'a@b.com',
            name: 'Admin',
            access: {
                manageAccess: true,
            }
        };
        const otherAccount: UserDto = {
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
        const account: UserDto = {
            givenName: '',
            emailAddress: 'a@b.com',
            name: 'Admin',
            access: {
                manageAccess: true,
            }
        };
        const otherAccount: UserDto = {
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

        reportedError.verifyNoError();
        expect(updatedAccess).not.toBeNull();
        expect(accountReloaded).toEqual(true);
    });
});