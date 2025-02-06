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
import {DivisionTeam} from "./DivisionTeam";
import {DivisionDataContainer, IDivisionDataContainerProps} from "../league/DivisionDataContainer";
import {TeamDto} from "../../interfaces/models/dtos/Team/TeamDto";
import {EditTeamDto} from "../../interfaces/models/dtos/Team/EditTeamDto";
import {UserDto} from "../../interfaces/models/dtos/Identity/UserDto";
import {DivisionTeamDto} from "../../interfaces/models/dtos/Division/DivisionTeamDto";
import {DivisionDataDto} from "../../interfaces/models/dtos/Division/DivisionDataDto";
import {IClientActionResultDto} from "../common/IClientActionResultDto";
import {seasonBuilder} from "../../helpers/builders/seasons";
import {divisionBuilder} from "../../helpers/builders/divisions";
import {ITeamApi} from "../../interfaces/apis/ITeamApi";
import {IPreferenceData} from "../common/PreferencesContainer";

describe('DivisionTeam', () => {
    let context: TestContext;
    let reportedError: ErrorState;
    let updatedTeam: EditTeamDto |  null;
    let apiResponse: IClientActionResultDto<TeamDto> | undefined;

    const teamApi = api<ITeamApi>({
        update: async (team: EditTeamDto): Promise<IClientActionResultDto<TeamDto>> => {
            updatedTeam = team;
            return apiResponse || {success: true, result: team as TeamDto};
        }
    });

    async function onReloadDivision(): Promise<DivisionDataDto | null> {
        return null;
    }

    afterEach(async () => {
        await cleanUp(context);
    });

    beforeEach(() => {
        reportedError = new ErrorState();
        apiResponse = undefined;
        updatedTeam = null;
    });

    async function renderComponent(team: DivisionTeamDto, account: UserDto | null, divisionData: IDivisionDataContainerProps, teams?: TeamDto[], preferenceData?: IPreferenceData) {
        context = await renderApp(
            iocProps({teamApi}),
            brandingProps(),
            appProps({
                account,
                divisions: [],
                teams: teams || [],
                seasons: []
            }, reportedError),
            (<DivisionDataContainer {...divisionData} >
                <DivisionTeam team={team}/>
            </DivisionDataContainer>),
            undefined,
            undefined,
            'tbody',
            preferenceData);
    }

    describe('when logged out', () => {
        const account: UserDto | null = null;
        const division = divisionBuilder('DIVISION').build();
        const season = seasonBuilder('SEASON')
            .build();

        it('renders team details', async () => {
            const team: DivisionTeamDto = {
                id: createTemporaryId(),
                name: 'TEAM',
                played: 1,
                points: 2,
                fixturesWon: 3,
                fixturesLost: 4,
                fixturesDrawn: 5,
                difference: 6,
                address: '',
            };

            await renderComponent(team, account, {id: division.id, season, onReloadDivision, name: ''});
            reportedError.verifyNoError();

            const cells = Array.from(context.container.querySelectorAll('td'));
            const cellText = cells.map(c => c.textContent);
            expect(cellText).toEqual([
                'TEAM',
                '1',
                '2',
                '3',
                '4',
                '5',
                '6'
            ]);
        });

        it('does not render editing controls', async () => {
            const team: DivisionTeamDto = {
                id: createTemporaryId(),
                name: 'TEAM',
                played: 1,
                points: 2,
                fixturesWon: 3,
                fixturesLost: 4,
                fixturesDrawn: 5,
                difference: 6,
                address: '',
            };

            await renderComponent(team, account, {id: division.id, season, onReloadDivision, name: ''});
            reportedError.verifyNoError();

            const firstCell = context.container.querySelector('td:first-child')!;
            expect(firstCell.textContent).toEqual('TEAM');
            expect(firstCell.querySelector('button')).toBeFalsy();
        });

        it('renders when team is a favourite', async () => {
            const team: DivisionTeamDto = {
                id: createTemporaryId(),
                name: 'TEAM',
                played: 1,
                points: 2,
                fixturesWon: 3,
                fixturesLost: 4,
                fixturesDrawn: 5,
                difference: 6,
                address: '',
            };

            await renderComponent(
                team,
                account,
                {
                    id: division.id,
                    season,
                    onReloadDivision,
                    name: '',
                    favouritesEnabled: true
                },
                undefined,
                {
                    favouriteTeamIds: [ team.id ],
                });
            reportedError.verifyNoError();

            const row = context.container.querySelector('tr')!;
            expect(row.className).not.toContain('opacity-25');
        });

        it('renders when team is not a favourite', async () => {
            const team: DivisionTeamDto = {
                id: createTemporaryId(),
                name: 'TEAM',
                played: 1,
                points: 2,
                fixturesWon: 3,
                fixturesLost: 4,
                fixturesDrawn: 5,
                difference: 6,
                address: '',
            };

            await renderComponent(
                team,
                account,
                {
                    id: division.id,
                    season,
                    onReloadDivision,
                    name: '',
                    favouritesEnabled: true
                },
                undefined,
                {
                    favouriteTeamIds: [ '1234' ],
                });
            reportedError.verifyNoError();

            const row = context.container.querySelector('tr')!;
            expect(row.className).toContain('opacity-25');
        });

        it('renders when no team is a favourite', async () => {
            const team: DivisionTeamDto = {
                id: createTemporaryId(),
                name: 'TEAM',
                played: 1,
                points: 2,
                fixturesWon: 3,
                fixturesLost: 4,
                fixturesDrawn: 5,
                difference: 6,
                address: '',
            };

            await renderComponent(
                team,
                account,
                {
                    id: division.id,
                    season,
                    onReloadDivision,
                    name: '',
                    favouritesEnabled: true
                },
                undefined,
                {
                    favouriteTeamIds: [],
                });
            reportedError.verifyNoError();

            const row = context.container.querySelector('tr')!;
            expect(row.className).not.toContain('opacity-25');
        });
    });

    describe('when logged in', () => {
        const account: UserDto = {
            emailAddress: '',
            name: '',
            givenName: '',
            access: {
                manageTeams: true,
            }
        };
        const division = divisionBuilder('DIVISION').build();
        const season = seasonBuilder('SEASON')
            .withDivision(division)
            .build();

        it('can edit team', async () => {
            const team: DivisionTeamDto = {
                id: createTemporaryId(),
                name: 'TEAM',
                played: 1,
                points: 2,
                fixturesWon: 3,
                fixturesLost: 4,
                fixturesDrawn: 5,
                difference: 6,
                address: '',
            };
            await renderComponent(team, account, {id: division.id, season, onReloadDivision, name: ''});
            reportedError.verifyNoError();
            const firstCell = context.container.querySelector('td:first-child');

            await doClick(findButton(firstCell, '✏️'));

            reportedError.verifyNoError();
            const dialog = context.container.querySelector('.modal-dialog')!;
            expect(dialog).toBeTruthy();
            expect(dialog.textContent).toContain('Edit team: TEAM');
        });

        it('can change team details', async () => {
            const team: DivisionTeamDto = {
                id: createTemporaryId(),
                name: 'TEAM',
                played: 1,
                points: 2,
                fixturesWon: 3,
                fixturesLost: 4,
                fixturesDrawn: 5,
                difference: 6,
                updated: '2023-07-01T00:00:00',
                address: '',
            };
            await renderComponent(team, account, {id: division.id, season, onReloadDivision, name: ''});
            reportedError.verifyNoError();
            const firstCell = context.container.querySelector('td:first-child')!;
            await doClick(findButton(firstCell, '✏️'));
            const dialog = context.container.querySelector('.modal-dialog')!;

            await doChange(dialog, 'input[name="name"]', 'NEW TEAM', context.user);
            await doClick(findButton(dialog, 'Save team'));

            reportedError.verifyNoError();
            expect(updatedTeam).not.toBeNull();
            expect(updatedTeam!.lastUpdated).toEqual('2023-07-01T00:00:00');
            expect(updatedTeam!.name).toEqual('NEW TEAM');
        });

        it('can close edit dialog', async () => {
            const team: DivisionTeamDto = {
                id: createTemporaryId(),
                name: 'TEAM',
                played: 1,
                points: 2,
                fixturesWon: 3,
                fixturesLost: 4,
                fixturesDrawn: 5,
                difference: 6,
                address: '',
            };
            await renderComponent(team, account, {id: division.id, season, onReloadDivision, name: ''});
            reportedError.verifyNoError();
            const firstCell = context.container.querySelector('td:first-child');
            await doClick(findButton(firstCell, '✏️'));

            await doClick(findButton(context.container.querySelector('.modal-dialog'), 'Cancel'));

            reportedError.verifyNoError();
            expect(context.container.querySelector('.modal-dialog')).toBeFalsy();
        });

        it('can show add to season dialog', async () => {
            const team: DivisionTeamDto & TeamDto = {
                id: createTemporaryId(),
                name: 'TEAM',
                played: 1,
                points: 2,
                fixturesWon: 3,
                fixturesLost: 4,
                fixturesDrawn: 5,
                difference: 6,
                address: '',
                seasons: [],
            };
            await renderComponent(team, account, {id: division.id, season, onReloadDivision, name: ''}, [team]);
            reportedError.verifyNoError();
            const firstCell = context.container.querySelector('td:first-child')!;

            await doClick(findButton(firstCell, '➕'));

            reportedError.verifyNoError();
            const dialog = context.container.querySelector('.modal-dialog')!;
            expect(dialog).toBeTruthy();
            expect(dialog.textContent).toContain('Assign seasons');
        });

        it('can close add to season dialog', async () => {
            const team: DivisionTeamDto & TeamDto = {
                id: createTemporaryId(),
                name: 'TEAM',
                played: 1,
                points: 2,
                fixturesWon: 3,
                fixturesLost: 4,
                fixturesDrawn: 5,
                difference: 6,
                address: '',
                seasons: [],
            };
            await renderComponent(team, account, {id: division.id, season, onReloadDivision, name: ''}, [team]);
            reportedError.verifyNoError();
            const firstCell = context.container.querySelector('td:first-child');
            await doClick(findButton(firstCell, '➕'));
            const dialog = context.container.querySelector('.modal-dialog');

            await doClick(findButton(dialog, 'Close'));

            expect(context.container.querySelector('.modal-dialog')).toBeFalsy();
        });

        it('renders when team is not a favourite and an admin', async () => {
            const team: DivisionTeamDto = {
                id: createTemporaryId(),
                name: 'TEAM',
                played: 1,
                points: 2,
                fixturesWon: 3,
                fixturesLost: 4,
                fixturesDrawn: 5,
                difference: 6,
                address: '',
            };

            await renderComponent(
                team,
                account,
                {
                    id: division.id,
                    season,
                    onReloadDivision,
                    name: '',
                    favouritesEnabled: true
                },
                undefined,
                {
                    favouriteTeamIds: [ '1234' ],
                });
            reportedError.verifyNoError();

            const row = context.container.querySelector('tr')!;
            expect(row.className).not.toContain('opacity-25');
        });
    });
});