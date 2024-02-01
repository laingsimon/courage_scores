import {
    api,
    appProps,
    brandingProps,
    cleanUp,
    doClick, ErrorState,
    findButton,
    iocProps,
    renderApp,
    TestContext
} from "../../helpers/tests";
import React from "react";
import {DivisionDataContainer} from "../DivisionDataContainer";
import {AssignTeamToSeasons} from "./AssignTeamToSeasons";
import {ITeamDto} from "../../interfaces/models/dtos/Team/ITeamDto";
import {IDivisionTeamDto} from "../../interfaces/models/dtos/Division/IDivisionTeamDto";
import {ISeasonDto} from "../../interfaces/models/dtos/Season/ISeasonDto";
import {IDivisionDataDto} from "../../interfaces/models/dtos/Division/IDivisionDataDto";
import {IDivisionDto} from "../../interfaces/models/dtos/IDivisionDto";
import {IClientActionResultDto} from "../../interfaces/IClientActionResultDto";
import {teamBuilder} from "../../helpers/builders/teams";
import {seasonBuilder} from "../../helpers/builders/seasons";
import {divisionBuilder} from "../../helpers/builders/divisions";
import {createTemporaryId} from "../../helpers/projection";
import {ITeamApi} from "../../interfaces/apis/ITeamApi";
import {IModifyTeamSeasonDto} from "../../interfaces/models/dtos/Team/IModifyTeamSeasonDto";

describe('AssignTeamToSeasons', () => {
    let context: TestContext;
    let reportedError: ErrorState;
    let apiAdded: IModifyTeamSeasonDto[];
    let apiDeleted: {teamId: string, seasonId: string}[];
    let apiResponse: IClientActionResultDto<ITeamDto>;
    let closed: boolean;

    const teamApi = api<ITeamApi>({
        add: async (request: IModifyTeamSeasonDto) => {
            apiAdded.push(request);
            return apiResponse || {success: true};
        },
        delete: async (teamId: string, seasonId: string) => {
            apiDeleted.push({teamId, seasonId});
            return apiResponse || {success: true};
        }
    });

    async function onReloadDivision(): Promise<IDivisionDataDto | null> {
        return null;
    }

    async function onClose() {
        closed = true;
    }

    afterEach(() => {
        cleanUp(context);
    });

    beforeEach(() => {
        reportedError = new ErrorState();
        closed = false;
        apiAdded = [];
        apiDeleted = [];
    });

    async function renderComponent(teamOverview: IDivisionTeamDto, teams: ITeamDto[], seasons: ISeasonDto[], currentSeason: ISeasonDto) {
        context = await renderApp(
            iocProps({teamApi}),
            brandingProps(),
            appProps({
                reloadAll: async () => {},
                teams,
                seasons,
            }, reportedError),
            (<DivisionDataContainer season={currentSeason} onReloadDivision={onReloadDivision} name="" setDivisionData={null} id={createTemporaryId()}>
                <AssignTeamToSeasons teamOverview={teamOverview} onClose={onClose}/>
            </DivisionDataContainer>));
    }

    describe('renders', () => {
        const season: ISeasonDto = seasonBuilder('SEASON')
            .starting('2023-05-01T00:00:00')
            .build();
        const division: IDivisionDto = divisionBuilder('DIVISION').build();

        it('when team not found', async () => {
            const team = teamBuilder('TEAM').build();
            await renderComponent(team, [], [season], season);

            expect(reportedError.hasError()).toEqual(false);
            expect(context.container.textContent).toContain('Team not found: TEAM');
        });

        it('selected seasons', async () => {
            const team: ITeamDto = teamBuilder('TEAM').forSeason(season, division).build();
            const otherSeason: ISeasonDto = seasonBuilder('PREVIOUS SEASON')
                .starting('2023-02-01T00:00:00')
                .build();
            await renderComponent(team, [team], [season, otherSeason], season);

            expect(reportedError.hasError()).toEqual(false);
            expect(context.container.textContent).toContain('Associate TEAM with the following seasons');
            const seasons = Array.from(context.container.querySelectorAll('.list-group .list-group-item'));
            expect(seasons.length).toEqual(2);
            expect(seasons.map(s => s.textContent)).toEqual(['PREVIOUS SEASON', 'SEASON']);
            expect(seasons[0].className).not.toContain('active');
            expect(seasons[1].className).toContain('active');
        });
    });

    describe('interactivity', () => {
        const season: ISeasonDto = seasonBuilder('SEASON')
            .starting('2023-05-01T00:00:00')
            .build();
        const division: IDivisionDto = divisionBuilder('DIVISION').build();

        it('can change copy team from current season', async () => {
            const team: ITeamDto = teamBuilder('TEAM').build();
            await renderComponent(team, [team], [season], season);

            await doClick(context.container, '.list-group .list-group-item'); // select the season
            await doClick(findButton(context.container, 'Apply changes'));
            expect(reportedError.hasError()).toEqual(false);
            expect(apiDeleted).toEqual([]);
            expect(apiAdded.length).toEqual(1);
            expect(apiAdded[0].copyPlayersFromSeasonId).toEqual(season.id);

            await doClick(context.container, 'input[id="copyTeamFromCurrentSeason"]');
            await doClick(findButton(context.container, 'Apply changes'));
            expect(reportedError.hasError()).toEqual(false);
            expect(apiDeleted).toEqual([]);
            expect(apiAdded.length).toEqual(2);
            expect(apiAdded[1].copyPlayersFromSeasonId).toEqual(null);
        });

        it('can unassign a selected season', async () => {
            const team: ITeamDto = teamBuilder('TEAM').forSeason(season, division).build();
            const otherSeason: ISeasonDto = seasonBuilder('PREVIOUS SEASON')
                .starting('2023-02-01T00:00:00')
                .build();
            await renderComponent(team, [team], [season, otherSeason], season);

            await doClick(context.container, '.list-group .list-group-item.active');

            const items = Array.from(context.container.querySelectorAll('.list-group .list-group-item'));
            expect(items.map(i => i.className)).toEqual(['list-group-item', 'list-group-item bg-danger']);
            await doClick(findButton(context.container, 'Apply changes'));
            expect(reportedError.hasError()).toEqual(false);
            expect(apiAdded).toEqual([]);
            expect(apiDeleted).toEqual([{teamId: team.id, seasonId: season.id}]);
        });

        it('can assign an unselected season', async () => {
            const team: ITeamDto = teamBuilder('TEAM').forSeason(season, division).build();
            const otherSeason: ISeasonDto = seasonBuilder('PREVIOUS SEASON')
                .starting('2023-02-01T00:00:00')
                .build();
            await renderComponent(team, [team], [season, otherSeason], season);

            await doClick(context.container, '.list-group .list-group-item:not(.active)');

            const items = Array.from(context.container.querySelectorAll('.list-group .list-group-item'));
            expect(items.map(i => i.className)).toEqual(['list-group-item bg-success', 'list-group-item active']);
            await doClick(findButton(context.container, 'Apply changes'));
            expect(reportedError.hasError()).toEqual(false);
            expect(apiAdded).toEqual([{
                id: team.id,
                seasonId: otherSeason.id,
                copyPlayersFromSeasonId: season.id
            }]);
            expect(apiDeleted).toEqual([]);
        });

        it('reports any errors during save', async () => {
            const team: ITeamDto = teamBuilder('TEAM').forSeason(season, division).build();
            const otherSeason: ISeasonDto = seasonBuilder('PREVIOUS SEASON')
                .starting('2023-02-01T00:00:00')
                .build();
            await renderComponent(team, [team], [season, otherSeason], season);
            let alert: string;
            window.alert = (msg) => alert = msg;
            console.error = () => {};
            await doClick(context.container, '.list-group .list-group-item:not(.active)');
            apiResponse = {
                success: false,
            };

            await doClick(findButton(context.container, 'Apply changes'));

            expect(alert).toEqual('There were 1 error/s when applying these changes; some changes may not have been saved');
        });

        it('can close', async () => {
            const team: ITeamDto = teamBuilder('TEAM').forSeason(season, division).build();
            const otherSeason: ISeasonDto = seasonBuilder('PREVIOUS SEASON')
                .starting('2023-02-01T00:00:00')
                .build();
            await renderComponent(team, [team], [season, otherSeason], season);

            await doClick(findButton(context.container, 'Close'));

            expect(reportedError.hasError()).toEqual(false);
            expect(closed).toEqual(true);
        });
    });
});