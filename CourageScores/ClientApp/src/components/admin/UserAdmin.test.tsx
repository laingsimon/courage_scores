import {
    api,
    appProps,
    brandingProps,
    cleanUp,
    ErrorState,
    iocProps,
    renderApp,
    TestContext,
} from '../../helpers/tests';
import { UserAdmin } from './UserAdmin';
import { AdminContainer } from './AdminContainer';
import { UpdateAccessDto } from '../../interfaces/models/dtos/Identity/UpdateAccessDto';
import { IClientActionResultDto } from '../common/IClientActionResultDto';
import { UserDto } from '../../interfaces/models/dtos/Identity/UserDto';
import { IAccountApi } from '../../interfaces/apis/IAccountApi';

describe('UserAdmin', () => {
    let context: TestContext;
    let reportedError: ErrorState;
    let accountReloaded: boolean;
    let updatedAccess: UpdateAccessDto | null;
    let apiResponse: IClientActionResultDto<UserDto> | null;

    const accountApi = api<IAccountApi>({
        update: async (update: UpdateAccessDto) => {
            updatedAccess = update;
            return apiResponse || { success: true };
        },
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
            iocProps({ accountApi }),
            brandingProps(),
            appProps(
                {
                    account,
                    reloadAccount: async () => {
                        accountReloaded = true;
                    },
                },
                reportedError,
            ),
            <AdminContainer accounts={accounts} tables={[]}>
                <UserAdmin />
            </AdminContainer>,
        );
    }

    function getAccess(name: string) {
        return context.required(`input[id="${name}"]`);
    }

    it('renders when no user selected', async () => {
        const account: UserDto = {
            givenName: '',
            emailAddress: 'a@b.com',
            name: 'Test 1',
        };

        await renderComponent([account], account);

        reportedError.verifyNoError();
        expect(context.text()).toContain('Manage access');
        expect(
            getAccess('manageAccess').element<HTMLInputElement>().checked,
        ).toEqual(false);
    });

    it('renders user email addresses', async () => {
        const account: UserDto = {
            givenName: '',
            emailAddress: 'a@b.com',
            name: 'Test 1',
        };
        await renderComponent([account], account);

        await context.input('showEmailAddress').click();

        reportedError.verifyNoError();
        expect(context.text()).toContain('You a@b.com');
    });

    it('renders user with no access', async () => {
        const account: UserDto = {
            givenName: '',
            emailAddress: 'a@b.com',
            name: 'Admin',
            access: {
                manageAccess: true,
            },
        };
        const otherAccount: UserDto = {
            givenName: '',
            emailAddress: 'c@d.com',
            name: 'Test 1',
        };
        await renderComponent([account, otherAccount], account);

        await context.required('.dropdown-menu').select('Test 1');

        reportedError.verifyNoError();
        expect(context.text()).toContain('Manage access');
        expect(
            getAccess('manageAccess').element<HTMLInputElement>().checked,
        ).toEqual(false);
    });

    it('renders user with access', async () => {
        const account: UserDto = {
            givenName: '',
            emailAddress: 'a@b.com',
            name: 'Admin',
            access: {
                manageAccess: true,
            },
        };
        const otherAccount: UserDto = {
            givenName: '',
            emailAddress: 'c@d.com',
            name: 'Other user',
            access: {
                manageAccess: true,
            },
        };
        await renderComponent([account, otherAccount], account);

        await context.required('.dropdown-menu').select('Other user');

        reportedError.verifyNoError();
        expect(context.text()).toContain('Manage access');
        expect(
            getAccess('manageAccess').element<HTMLInputElement>().checked,
        ).toEqual(true);
    });

    it('can save change to access', async () => {
        const account: UserDto = {
            givenName: '',
            emailAddress: 'a@b.com',
            name: 'Admin',
            access: {
                manageAccess: true,
            },
        };
        const otherAccount: UserDto = {
            givenName: '',
            emailAddress: 'c@d.com',
            name: 'Other user',
            access: {
                manageAccess: true,
            },
        };
        await renderComponent([account, otherAccount], account);
        await context.required('.dropdown-menu').select('Other user');
        await getAccess('manageGames').click();

        await context.button('Set access').click();

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
            },
        };
        const otherAccount: UserDto = {
            givenName: '',
            emailAddress: 'c@d.com',
            name: 'Other user',
            access: {
                manageAccess: true,
            },
        };
        await renderComponent([account, otherAccount], account);
        await context.required('.dropdown-menu').select('Other user');
        await getAccess('manageGames').click();
        apiResponse = { success: false, errors: ['SOME ERROR'] };

        await context.button('Set access').click();

        reportedError.verifyNoError();
        expect(context.text()).toContain('SOME ERROR');
        expect(context.text()).toContain('Could not save access');
    });

    it('can close error dialog after save failure', async () => {
        const account: UserDto = {
            givenName: '',
            emailAddress: 'a@b.com',
            name: 'Admin',
            access: {
                manageAccess: true,
            },
        };
        const otherAccount: UserDto = {
            givenName: '',
            emailAddress: 'c@d.com',
            name: 'Other user',
            access: {
                manageAccess: true,
            },
        };
        await renderComponent([account, otherAccount], account);
        await context.required('.dropdown-menu').select('Other user');
        await getAccess('manageGames').click();
        apiResponse = { success: false, errors: ['SOME ERROR'] };
        await context.button('Set access').click();
        expect(context.text()).toContain('Could not save access');

        await context.button('Close').click();

        expect(context.text()).not.toContain('Could not save access');
    });

    it('can change access for self', async () => {
        const account: UserDto = {
            givenName: '',
            emailAddress: 'a@b.com',
            name: 'Admin',
            access: {
                manageAccess: true,
            },
        };
        const otherAccount: UserDto = {
            givenName: '',
            emailAddress: 'c@d.com',
            name: 'Other user',
            access: {
                manageAccess: true,
            },
        };
        await renderComponent([account, otherAccount], account);
        await getAccess('manageGames').click();

        await context.button('Set access').click();

        reportedError.verifyNoError();
        expect(updatedAccess).not.toBeNull();
        expect(accountReloaded).toEqual(true);
    });
});
