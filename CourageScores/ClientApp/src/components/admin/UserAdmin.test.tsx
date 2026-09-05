import {
    api,
    appProps,
    brandingProps,
    cleanUp,
    ErrorState,
    iocProps,
    renderApp,
    TestContext,
    user,
} from '../../helpers/tests.tsx';
import { UserAdmin } from './UserAdmin.tsx';
import { AdminContainer } from './AdminContainer.tsx';
import { UpdateAccessDto } from '../../interfaces/models/dtos/Identity/UpdateAccessDto.ts';
import { IClientActionResultDto } from '../common/IClientActionResultDto.ts';
import { UserDto } from '../../interfaces/models/dtos/Identity/UserDto.ts';
import { IAccountApi } from '../../interfaces/apis/IAccountApi.ts';
import { AccessOption } from '../../interfaces/models/dtos/Identity/AccessOption.ts';
import { TeamApi } from '../../interfaces/apis/ITeamApi.ts';
import { divisionBuilder } from '../../helpers/builders/divisions.ts';
import { IApp } from '../common/IApp.ts';
import { seasonBuilder } from '../../helpers/builders/seasons.ts';
import { teamBuilder } from '../../helpers/builders/teams.ts';
import { TeamDto } from '../../interfaces/models/dtos/Team/TeamDto';

describe('UserAdmin', () => {
    let context: TestContext;
    let reportedError: ErrorState;
    let accountReloaded: boolean;
    let updatedAccess: UpdateAccessDto | null;
    let apiResponse: IClientActionResultDto<UserDto> | null;
    let teams: TeamDto[] | null;

    const accountApi = api<IAccountApi>({
        update: async (update: UpdateAccessDto) => {
            updatedAccess = update;
            return apiResponse || { success: true };
        },
    });
    const teamApi = api<TeamApi>({
        async getAllWithSeasonsAndPlayers() {
            return teams ?? [];
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
        teams = null;
    });

    async function renderComponent(
        accounts: UserDto[],
        account: UserDto,
        app?: Partial<IApp>,
    ) {
        context = await renderApp(
            iocProps({ accountApi, teamApi }),
            brandingProps(),
            appProps(
                {
                    ...app,
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
        return context
            .required(`[datatype="${name}"] .dropdown-menu`)
            .required('.active');
    }

    it('renders when no user selected', async () => {
        const account: UserDto = {
            ...user(),
            emailAddress: 'a@b.com',
            name: 'Test 1',
        };

        await renderComponent([account], account);

        reportedError.verifyNoError();
        expect(context.text()).toContain('Manage access');
        expect(getAccess(AccessOption.manageAccess).text()).toEqual('🚫 None');
    });

    it('renders user email addresses', async () => {
        const account: UserDto = {
            ...user([AccessOption.manageAccess]),
            emailAddress: 'a@b.com',
            name: 'Test 1',
        };
        await renderComponent([account], account);

        await context.input('showEmailAddress').click();

        reportedError.verifyNoError();
        expect(context.text()).toContain('You a@b.com');
    });

    it('renders user with no access', async () => {
        const account = user([AccessOption.manageAccess]);
        const otherAccount: UserDto = {
            ...user(),
            emailAddress: 'c@d.com',
            name: 'Test 1',
        };
        await renderComponent([account, otherAccount], account);

        await context.required('.dropdown-menu').select('Test 1');

        reportedError.verifyNoError();
        expect(context.text()).toContain('Manage access');
        expect(getAccess(AccessOption.manageAccess).text()).toEqual('🚫 None');
    });

    it('renders user with access', async () => {
        const account: UserDto = {
            ...user([AccessOption.manageAccess]),
            emailAddress: 'a@b.com',
            name: 'Admin',
        };
        const otherAccount: UserDto = {
            ...user([AccessOption.manageAccess]),
            emailAddress: 'c@d.com',
            name: 'Other user',
        };
        await renderComponent([account, otherAccount], account);

        await context.required('.dropdown-menu').select('Other user');

        reportedError.verifyNoError();
        expect(context.text()).toContain('Manage access');
        expect(getAccess(AccessOption.manageAccess).text()).toEqual('✅ Full');
    });

    it('can save change to access', async () => {
        const account: UserDto = {
            ...user([AccessOption.manageAccess]),
            emailAddress: 'a@b.com',
            name: 'Admin',
        };
        const otherAccount: UserDto = {
            ...user([AccessOption.manageAccess]),
            emailAddress: 'c@d.com',
            name: 'Other user',
        };
        await renderComponent([account, otherAccount], account);
        await context.required('.dropdown-menu').select('Other user');
        await getAccess(AccessOption.manageGames).parent()!.select('✅ Full');

        await context.button('Set access').click();

        reportedError.verifyNoError();
        expect(updatedAccess).toEqual({
            accessLevels: {
                [AccessOption.manageGames]: {},
                [AccessOption.manageAccess]: {},
            },
            emailAddress: 'c@d.com',
        });
    });

    it('can edit custom access', async () => {
        const account: UserDto = {
            ...user([AccessOption.manageAccess]),
            emailAddress: 'a@b.com',
            name: 'Admin',
        };
        const division = divisionBuilder('DIVISION 1').build();
        const season = seasonBuilder('SEASON 1').withDivision(division).build();
        const team1 = teamBuilder('TEAM 1').forSeason(season, division).build();
        const team2 = teamBuilder('TEAM 2').forSeason(season, division).build();
        const team3 = teamBuilder('TEAM 3').build();
        teams = [team1, team2, team3];
        const appProps: Partial<IApp> = {
            divisions: [division, divisionBuilder('DIVISION 2').build()],
            seasons: [season, seasonBuilder('SEASON 2').build()],
        };
        await renderComponent([account], account, appProps);

        await getAccess(AccessOption.manageGames).parent()!.select('🎚️️ Custom');
        await context.button('✏️').click();
        const dialog = context.required('.modal-dialog');
        await dialog
            .required('div[data-type="Seasons"]')
            .required('ol.list-group li:first-child')
            .click();
        await dialog
            .required('div[data-type="Divisions"]')
            .required('ol.list-group li:first-child')
            .click();
        await dialog
            .required('div[data-type="Teams"]')
            .required('ol.list-group li:first-child')
            .click();
        await dialog.button('Close').click();
        await context.button('Set access').click();

        reportedError.verifyNoError();
        expect(updatedAccess).toEqual({
            accessLevels: {
                [AccessOption.manageAccess]: {},
                [AccessOption.manageGames]: {
                    divisionIds: [division.id],
                    seasonIds: [season.id],
                    teamIds: [team1.id],
                },
            },
            emailAddress: 'a@b.com',
        });
    });

    it('sets id array to undefined when empty', async () => {
        const division = divisionBuilder('DIVISION 1').build();
        const season = seasonBuilder('SEASON 1').withDivision(division).build();
        const team1 = teamBuilder('TEAM 1').forSeason(season, division).build();
        const account: UserDto = {
            ...user([]),
            accessLevels: {
                [AccessOption.manageGames]: {
                    divisionIds: [division.id],
                    seasonIds: [season.id],
                    teamIds: [team1.id],
                },
            },
            emailAddress: 'a@b.com',
            name: 'Admin',
        };
        teams = [team1];
        const appProps: Partial<IApp> = {
            divisions: [division],
            seasons: [season],
        };
        await renderComponent([account], account, appProps);

        await context.button('✏️').click();
        const dialog = context.required('.modal-dialog');
        await dialog
            .required('div[data-type="Seasons"]')
            .required('ol.list-group li:first-child')
            .click();
        await dialog
            .required('div[data-type="Divisions"]')
            .required('ol.list-group li:first-child')
            .click();
        await dialog
            .required('div[data-type="Teams"]')
            .required('ol.list-group li:first-child')
            .click();
        await dialog.button('Close').click();
        await context.button('Set access').click();

        reportedError.verifyNoError();
        expect(updatedAccess).toEqual({
            accessLevels: {
                [AccessOption.manageGames]: {
                    divisionIds: undefined,
                    seasonIds: undefined,
                    teamIds: undefined,
                },
            },
            emailAddress: 'a@b.com',
        });
    });

    it('handles error during save', async () => {
        const account: UserDto = {
            ...user([AccessOption.manageAccess]),
            emailAddress: 'a@b.com',
            name: 'Admin',
        };
        const otherAccount: UserDto = {
            ...user([AccessOption.manageAccess]),
            emailAddress: 'c@d.com',
            name: 'Other user',
        };
        await renderComponent([account, otherAccount], account);
        await context.required('.dropdown-menu').select('Other user');
        await getAccess(AccessOption.manageGames).click();
        apiResponse = { success: false, errors: ['SOME ERROR'] };

        await context.button('Set access').click();

        reportedError.verifyNoError();
        expect(context.text()).toContain('SOME ERROR');
        expect(context.text()).toContain('Could not save access');
    });

    it('can close error dialog after save failure', async () => {
        const account: UserDto = {
            ...user([AccessOption.manageAccess]),
            emailAddress: 'a@b.com',
            name: 'Admin',
        };
        const otherAccount: UserDto = {
            ...user([AccessOption.manageAccess]),
            emailAddress: 'c@d.com',
            name: 'Other user',
        };
        await renderComponent([account, otherAccount], account);
        await context.required('.dropdown-menu').select('Other user');
        await getAccess(AccessOption.manageGames).click();
        apiResponse = { success: false, errors: ['SOME ERROR'] };
        await context.button('Set access').click();
        expect(context.text()).toContain('Could not save access');

        await context.button('Close').click();

        expect(context.text()).not.toContain('Could not save access');
    });

    it('can change access for self', async () => {
        const account: UserDto = {
            ...user([AccessOption.manageAccess]),
            emailAddress: 'a@b.com',
            name: 'Admin',
        };
        const otherAccount: UserDto = {
            ...user([AccessOption.manageAccess]),
            emailAddress: 'c@d.com',
            name: 'Other user',
        };
        await renderComponent([account, otherAccount], account);
        await getAccess(AccessOption.manageGames).click();

        await context.button('Set access').click();

        reportedError.verifyNoError();
        expect(updatedAccess).not.toBeNull();
        expect(accountReloaded).toEqual(true);
    });
});
