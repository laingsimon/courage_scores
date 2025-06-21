import {
    api,
    appProps,
    brandingProps,
    cleanUp,
    doClick,
    doSelectOption,
    ErrorState,
    findButton,
    iocProps,
    noop,
    renderApp,
    TestContext,
} from '../../helpers/tests';
import { DivisionDataContainer } from '../league/DivisionDataContainer';
import { AssignTeamToSeasons } from './AssignTeamToSeasons';
import { TeamDto } from '../../interfaces/models/dtos/Team/TeamDto';
import { DivisionTeamDto } from '../../interfaces/models/dtos/Division/DivisionTeamDto';
import { SeasonDto } from '../../interfaces/models/dtos/Season/SeasonDto';
import { DivisionDto } from '../../interfaces/models/dtos/DivisionDto';
import { IClientActionResultDto } from '../common/IClientActionResultDto';
import { teamBuilder } from '../../helpers/builders/teams';
import { seasonBuilder } from '../../helpers/builders/seasons';
import { divisionBuilder } from '../../helpers/builders/divisions';
import { ITeamApi } from '../../interfaces/apis/ITeamApi';
import { ModifyTeamSeasonDto } from '../../interfaces/models/dtos/Team/ModifyTeamSeasonDto';

describe('AssignTeamToSeasons', () => {
    let context: TestContext;
    let reportedError: ErrorState;
    let apiAdded: ModifyTeamSeasonDto[];
    let apiDeleted: { teamId: string; seasonId: string }[];
    let apiResponse: IClientActionResultDto<TeamDto>;
    let closed: boolean;

    const teamApi = api<ITeamApi>({
        add: async (request: ModifyTeamSeasonDto) => {
            apiAdded.push(request);
            return apiResponse || { success: true };
        },
        delete: async (teamId: string, seasonId: string) => {
            apiDeleted.push({ teamId, seasonId });
            return apiResponse || { success: true };
        },
    });

    async function onClose() {
        closed = true;
    }

    afterEach(async () => {
        await cleanUp(context);
    });

    beforeEach(() => {
        reportedError = new ErrorState();
        closed = false;
        apiAdded = [];
        apiDeleted = [];
    });

    async function renderComponent(
        teamOverview: DivisionTeamDto,
        teams: TeamDto[],
        seasons: SeasonDto[],
        currentSeason: SeasonDto,
        division: DivisionDto,
        divisions: DivisionDto[],
    ) {
        context = await renderApp(
            iocProps({ teamApi }),
            brandingProps(),
            appProps(
                {
                    reloadAll: noop,
                    teams,
                    seasons,
                    divisions: divisions,
                },
                reportedError,
            ),
            <DivisionDataContainer
                season={currentSeason}
                onReloadDivision={noop}
                name={division.name}
                id={division.id}>
                <AssignTeamToSeasons
                    teamOverview={teamOverview}
                    onClose={onClose}
                />
            </DivisionDataContainer>,
        );
    }

    describe('renders', () => {
        const season: SeasonDto = seasonBuilder('SEASON')
            .starting('2023-05-01T00:00:00')
            .build();
        const division: DivisionDto = divisionBuilder('DIVISION').build();

        it('when team not found', async () => {
            const team = teamBuilder('TEAM').build();
            await renderComponent(team, [], [season], season, division, [
                division,
            ]);

            reportedError.verifyNoError();
            expect(context.container.textContent).toContain(
                'Team not found: TEAM',
            );
        });

        it('selected seasons', async () => {
            const team: TeamDto = teamBuilder('TEAM')
                .forSeason(season, division)
                .build();
            const otherSeason: SeasonDto = seasonBuilder('PREVIOUS SEASON')
                .starting('2023-02-01T00:00:00')
                .build();
            await renderComponent(
                team,
                [team],
                [season, otherSeason],
                season,
                division,
                [division],
            );

            reportedError.verifyNoError();
            expect(context.container.textContent).toContain(
                'Associate TEAM with the following seasons',
            );
            const seasons = Array.from(
                context.container.querySelectorAll(
                    'ul li[data-type="existing-season"]',
                ),
            );
            const boundSeason = seasons[0];
            expect(boundSeason.textContent).toContain('SEASON & DIVISION');
        });
    });

    describe('interactivity', () => {
        const season = seasonBuilder('SEASON')
            .starting('2023-05-01T00:00:00')
            .build();
        const division = divisionBuilder('DIVISION').build();
        const anotherDivision = divisionBuilder('ANOTHER DIVISION').build();
        const team = teamBuilder('TEAM').forSeason(season, division).build();
        const otherSeason = seasonBuilder('PREVIOUS SEASON')
            .starting('2023-02-01T00:00:00')
            .build();
        const addPrompt = 'Are you sure you want to associate this season?';

        async function selectSeasonToAdd(name: string) {
            const newSeasonItem = context.container.querySelector(
                'ul li[data-type="new-season"]',
            )!;
            await doSelectOption(
                newSeasonItem.querySelectorAll('.dropdown-menu')[0],
                name,
            );
        }

        async function selectDivisionForNewSeason(name: string) {
            const newSeasonItem = context.container.querySelector(
                'ul li[data-type="new-season"]',
            )!;
            await doSelectOption(
                newSeasonItem.querySelectorAll('.dropdown-menu')[1],
                name,
            );
        }

        async function removeFirstAssignedSeason() {
            await doClick(
                context.container,
                'ul li[data-type="existing-season"] button',
            );
        }

        async function selectCopyFromSeason(name: string) {
            const newSeasonItem = context.container.querySelector(
                'ul li[data-type="new-season"]',
            )!;
            await doSelectOption(
                newSeasonItem.querySelectorAll('.dropdown-menu')[2],
                name,
            );
        }

        async function render() {
            await renderComponent(
                team,
                [team],
                [season, otherSeason],
                season,
                division,
                [division, anotherDivision],
            );
        }

        it('can change copy team from current season', async () => {
            await render();
            context.prompts.respondToConfirm(addPrompt, true);

            await selectSeasonToAdd('PREVIOUS SEASON');
            await selectCopyFromSeason('SEASON');
            await doClick(findButton(context.container, '➕'));
            reportedError.verifyNoError();
            expect(apiDeleted).toEqual([]);
            expect(apiAdded.length).toEqual(1);
            expect(apiAdded[0].copyPlayersFromSeasonId).toEqual(season.id);
            expect(apiAdded[0].divisionId).toEqual(division.id);
        });

        it('can unassign a selected season', async () => {
            await render();
            context.prompts.respondToConfirm(
                'Are you sure you want to remove TEAM from SEASON and DIVISION?',
                true,
            );

            await removeFirstAssignedSeason();

            reportedError.verifyNoError();
            expect(apiAdded).toEqual([]);
            expect(apiDeleted).toEqual([
                { teamId: team.id, seasonId: season.id },
            ]);
        });

        it('does not unassign a selected season', async () => {
            await render();
            context.prompts.respondToConfirm(
                'Are you sure you want to remove TEAM from SEASON and DIVISION?',
                false,
            );

            await removeFirstAssignedSeason();

            reportedError.verifyNoError();
            expect(apiAdded).toEqual([]);
            expect(apiDeleted).toEqual([]);
        });

        it('does not assign an unselected season for any division', async () => {
            await render();
            context.prompts.respondToConfirm(addPrompt, false);

            await selectSeasonToAdd('PREVIOUS SEASON');
            await selectDivisionForNewSeason('Any');
            await doClick(findButton(context.container, '➕'));

            reportedError.verifyNoError();
            expect(apiAdded).toEqual([]);
            expect(apiDeleted).toEqual([]);
        });

        it('can assign an unselected season for any division', async () => {
            await render();

            await doClick(findButton(context.container, '➕'));

            reportedError.verifyNoError();
            expect(apiAdded).toEqual([]);
            expect(apiDeleted).toEqual([]);
            context.prompts.alertWasShown('Select a season first');
        });

        it('can assign an unselected season for any division', async () => {
            await render();
            context.prompts.respondToConfirm(addPrompt, true);

            await selectSeasonToAdd('PREVIOUS SEASON');
            await selectDivisionForNewSeason('Any');
            await doClick(findButton(context.container, '➕'));

            reportedError.verifyNoError();
            expect(apiAdded).toEqual([
                {
                    id: team.id,
                    seasonId: otherSeason.id,
                    copyPlayersFromSeasonId: season.id,
                    divisionId: undefined,
                },
            ]);
            expect(apiDeleted).toEqual([]);
        });

        it('can assign an unselected season without copying from a previous season', async () => {
            await render();
            context.prompts.respondToConfirm(addPrompt, true);

            await selectSeasonToAdd('PREVIOUS SEASON');
            await selectCopyFromSeason('Nowhere');
            await doClick(findButton(context.container, '➕'));

            reportedError.verifyNoError();
            expect(apiAdded).toEqual([
                {
                    id: team.id,
                    seasonId: otherSeason.id,
                    copyPlayersFromSeasonId: undefined,
                    divisionId: division.id,
                },
            ]);
            expect(apiDeleted).toEqual([]);
        });

        it('can assign an unselected season', async () => {
            await render();
            context.prompts.respondToConfirm(addPrompt, true);

            await selectSeasonToAdd('PREVIOUS SEASON');
            await selectDivisionForNewSeason('ANOTHER DIVISION');
            await doClick(findButton(context.container, '➕'));

            reportedError.verifyNoError();
            expect(apiAdded).toEqual([
                {
                    id: team.id,
                    seasonId: otherSeason.id,
                    copyPlayersFromSeasonId: season.id,
                    divisionId: anotherDivision.id,
                },
            ]);
            expect(apiDeleted).toEqual([]);
        });

        it('reports any errors during add', async () => {
            await render();
            apiResponse = {
                success: false,
            };
            context.prompts.respondToConfirm(addPrompt, true);

            await selectSeasonToAdd('PREVIOUS SEASON');
            await doClick(findButton(context.container, '➕'));

            reportedError.verifyNoError();
            expect(context.container.textContent).toContain(
                'Could not modify team',
            );
        });

        it('reports any errors during remove', async () => {
            await render();
            console.error = () => {};
            apiResponse = {
                success: false,
            };
            context.prompts.respondToConfirm(
                'Are you sure you want to remove TEAM from SEASON and DIVISION?',
                true,
            );

            await removeFirstAssignedSeason();

            expect(context.container.textContent).toContain(
                'Could not modify team',
            );
        });

        it('can close', async () => {
            await render();

            await doClick(findButton(context.container, 'Close'));

            reportedError.verifyNoError();
            expect(closed).toEqual(true);
        });
    });
});
