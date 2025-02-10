import {
    api,
    appProps,
    brandingProps,
    cleanUp,
    doChange,
    doClick, ErrorState,
    findButton,
    iocProps,
    renderApp,
    TestContext
} from "../../helpers/tests";
import {createTemporaryId} from "../../helpers/projection";
import {DivisionDataContainer, IDivisionDataContainerProps} from "../league/DivisionDataContainer";
import {DivisionTeams} from "./DivisionTeams";
import {seasonBuilder} from "../../helpers/builders/seasons";
import {UserDto} from "../../interfaces/models/dtos/Identity/UserDto";
import {EditTeamDto} from "../../interfaces/models/dtos/Team/EditTeamDto";
import {DivisionDto} from "../../interfaces/models/dtos/DivisionDto";
import {TeamDto} from "../../interfaces/models/dtos/Team/TeamDto";
import {IClientActionResultDto} from "../common/IClientActionResultDto";
import {DivisionDataDto} from "../../interfaces/models/dtos/Division/DivisionDataDto";
import {ITeamApi} from "../../interfaces/apis/ITeamApi";

describe('DivisionTeams', () => {
    let context: TestContext;
    let reportedError: ErrorState;
    let divisionReloaded: boolean = false;
    let account: UserDto | null;
    const teamApi = api<ITeamApi>({
        update: async (team: EditTeamDto): Promise<IClientActionResultDto<TeamDto>> => {
            return {
                success: true,
                result: team as TeamDto,
            };
        }
    });

    afterEach(async () => {
        await cleanUp(context);
    });

    beforeEach(() => {
        reportedError = new ErrorState();
        divisionReloaded = false;
    });

    async function renderComponent(divisionData: IDivisionDataContainerProps, divisions?: DivisionDto[]) {
        context = await renderApp(
            iocProps({teamApi}),
            brandingProps(),
            appProps({
                account: account,
                divisions: divisions || [],
            }, reportedError),
            (<DivisionDataContainer {...divisionData}>
                <DivisionTeams/>
            </DivisionDataContainer>));
    }

    function createDivisionData(divisionId: string): DivisionDataDto {
        const season = seasonBuilder('A season')
            .starting('2022-02-03T00:00:00')
            .ending('2022-08-25T00:00:00')
            .build();
        return {
            id: divisionId,
            name: '',
            teams: [{
                id: createTemporaryId(),
                address: '',
                name: 'A team 2',
                played: 1,
                points: 2,
                fixturesWon: 3,
                fixturesLost: 4,
                fixturesDrawn: 5,
                difference: 6,
                rank: 2
            }, {
                id: createTemporaryId(),
                address: '',
                name: 'A team 1',
                played: 1,
                points: 2,
                fixturesWon: 3,
                fixturesLost: 4,
                fixturesDrawn: 5,
                difference: 6,
                rank: 1
            }],
            players: [],
            season: season
        };
    }

    async function onReloadDivision() {
        divisionReloaded = true;
        return null;
    }

    async function setDivisionData() {
    }

    function assertTeam(tr: HTMLTableRowElement, values: string[]) {
        const tds = Array.from(tr.querySelectorAll('td')) as HTMLTableCellElement[];
        expect(tds.map(td => td.textContent)).toEqual(values);
    }

    describe('when logged out', () => {
        beforeEach(() => {
            account = null;
        });

        it('renders teams', async () => {
            const divisionId = createTemporaryId();
            const divisionData = createDivisionData(divisionId);

            await renderComponent(
                {...divisionData, onReloadDivision, setDivisionData });

            reportedError.verifyNoError();
            const teamsRows = Array.from(context.container.querySelectorAll('.content-background table.table tbody tr')) as HTMLTableRowElement[];
            expect(teamsRows.length).toEqual(2);
            assertTeam(teamsRows[0], ['A team 1', '1', '2', '3', '4', '5', '6']);
            assertTeam(teamsRows[1], ['A team 2', '1', '2', '3', '4', '5', '6']);
        });

        it('does not render add team button', async () => {
            const divisionId = createTemporaryId();
            const divisionData = createDivisionData(divisionId);

            await renderComponent(
                {...divisionData, onReloadDivision, setDivisionData});

            reportedError.verifyNoError();
            const addTeamButton = context.container.querySelector('.content-background > div > div .btn-primary');
            expect(addTeamButton).toBeFalsy();
        });
    });

    describe('when logged in', () => {
        beforeEach(() => {
            account = {
                name: '',
                emailAddress: '',
                givenName: '',
                access: {
                    manageTeams: true
                },
            };
        });

        it('renders teams', async () => {
            const divisionId = createTemporaryId();
            const divisionData = createDivisionData(divisionId);

            await renderComponent(
                {...divisionData, onReloadDivision, setDivisionData});

            reportedError.verifyNoError();
            const teamsRows = Array.from(context.container.querySelectorAll('.content-background table.table tbody tr')) as HTMLTableRowElement[];
            expect(teamsRows.length).toEqual(2);
            assertTeam(teamsRows[0], ['✏️➕A team 1', '1', '2', '3', '4', '5', '6']);
            assertTeam(teamsRows[1], ['✏️➕A team 2', '1', '2', '3', '4', '5', '6']);
        });

        it('renders add team button', async () => {
            const divisionId = createTemporaryId();
            const divisionData = createDivisionData(divisionId);

            await renderComponent(
                {...divisionData, onReloadDivision, setDivisionData});

            reportedError.verifyNoError();
            const addTeamButton = context.container.querySelector('.content-background > div > div .btn-primary');
            expect(addTeamButton).toBeTruthy();
        });

        it('renders add team dialog', async () => {
            const divisionId = createTemporaryId();
            const divisionData = createDivisionData(divisionId);
            await renderComponent(
                {...divisionData, onReloadDivision, setDivisionData});

            await doClick(findButton(context.container, 'Add team'));

            reportedError.verifyNoError();
            const dialog = context.container.querySelector('.modal-dialog')!;
            expect(dialog).toBeTruthy();
            expect(dialog.textContent).toContain('Create a new team...');
        });

        it('can close add team dialog', async () => {
            const divisionId = createTemporaryId();
            const divisionData = createDivisionData(divisionId);
            await renderComponent(
                {...divisionData, onReloadDivision, setDivisionData});
            await doClick(findButton(context.container, 'Add team'));
            expect(context.container.querySelector('.modal-dialog')).toBeTruthy();

            await doClick(findButton(context.container.querySelector('.modal-dialog'), 'Cancel'));

            expect(context.container.querySelector('.modal-dialog')).toBeFalsy();
        });

        it('can create new team', async () => {
            const divisionId = createTemporaryId();
            const divisionData = createDivisionData(divisionId);
            await renderComponent(
                {...divisionData, onReloadDivision, setDivisionData});
            await doClick(findButton(context.container, 'Add team'));
            const dialog = context.container.querySelector('.modal-dialog')!;
            expect(dialog.textContent).toContain('Create a new team...');

            await doChange(dialog, 'input[name="name"]', 'NEW TEAM', context.user);
            await doClick(findButton(dialog, 'Add team'));

            reportedError.verifyNoError();
            expect(divisionReloaded).toEqual(true);
            expect(context.container.querySelector('.modal-dialog')).toBeFalsy(); // dialog closed
        });
    });
});