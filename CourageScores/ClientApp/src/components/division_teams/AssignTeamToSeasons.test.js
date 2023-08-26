// noinspection JSUnresolvedFunction

import {cleanUp, doClick, findButton, renderApp} from "../../helpers/tests";
import React from "react";
import {DivisionDataContainer} from "../DivisionDataContainer";
import {AssignTeamToSeasons} from "./AssignTeamToSeasons";
import {divisionBuilder, seasonBuilder, teamBuilder} from "../../helpers/builders";

describe('AssignTeamToSeasons', () => {
    let context;
    let reportedError;
    let divisionReloaded;
    let apiAdded;
    let apiDeleted;
    let apiResponse;
    let closed;
    let allDataReloaded;

    const teamApi = {
        add: async (teamId, seasonId, copyFromSeasonId) => {
            apiAdded.push({teamId, seasonId, copyFromSeasonId});
            return apiResponse || {success: true};
        },
        delete: async (teamId, seasonId) => {
            apiDeleted.push({teamId, seasonId});
            return apiResponse || {success: true};
        }
    };

    async function onReloadDivision() {
        divisionReloaded = true;
    }

    async function onClose() {
        closed = true;
    }

    afterEach(() => {
        cleanUp(context);
    });

    async function renderComponent(teamOverview, teams, seasons, currentSeason) {
        reportedError = null;
        divisionReloaded = false;
        closed = false;
        allDataReloaded = false;
        apiAdded = [];
        apiDeleted = [];
        context = await renderApp(
            {teamApi},
            {name: 'Courage Scores'},
            {
                onError: (err) => {
                    reportedError = err;
                },
                reloadAll: async () => {
                    allDataReloaded = true;
                },
                teams,
                seasons
            },
            (<DivisionDataContainer season={currentSeason} onReloadDivision={onReloadDivision}>
                <AssignTeamToSeasons teamOverview={teamOverview} onClose={onClose}/>
            </DivisionDataContainer>));
    }

    describe('component', () => {
        const season = seasonBuilder('SEASON')
            .starting('2023-05-01T00:00:00')
            .build();
        const division = divisionBuilder('DIVISION').build();

        it('renders when team not found', async () => {
            const team = teamBuilder('TEAM').build();
            await renderComponent(team, [], [season], season);

            expect(reportedError).toBeNull();
            expect(context.container.textContent).toContain('Team not found: TEAM');
        });

        it('renders selected seasons', async () => {
            const team = teamBuilder('TEAM').forSeason(season, division).build();
            const otherSeason = seasonBuilder('PREVIOUS SEASON')
                .starting('2023-02-01T00:00:00')
                .build();
            await renderComponent(team, [team], [season, otherSeason], season);

            expect(reportedError).toBeNull();
            expect(context.container.textContent).toContain('Associate TEAM with the following seasons');
            const seasons = Array.from(context.container.querySelectorAll('.list-group .list-group-item'));
            expect(seasons.length).toEqual(2);
            expect(seasons.map(s => s.textContent)).toEqual(['PREVIOUS SEASON', 'SEASON']);
            expect(seasons[0].className).not.toContain('active');
            expect(seasons[1].className).toContain('active');
        });

        it('can change copy team from current season', async () => {
            const team = teamBuilder('TEAM').build();
            await renderComponent(team, [team], [season], season);

            await doClick(context.container, '.list-group .list-group-item'); // select the season
            await doClick(findButton(context.container, 'Apply changes'));
            expect(reportedError).toBeNull();
            expect(apiDeleted).toEqual([]);
            expect(apiAdded.length).toEqual(1);
            expect(apiAdded[0].copyFromSeasonId).toEqual(season.id);

            await doClick(context.container, 'input[id="copyTeamFromCurrentSeason"]');
            await doClick(findButton(context.container, 'Apply changes'));
            expect(reportedError).toBeNull();
            expect(apiDeleted).toEqual([]);
            expect(apiAdded.length).toEqual(2);
            expect(apiAdded[1].copyFromSeasonId).toEqual(null);
        });

        it('can unassign a selected season', async () => {
            const team = teamBuilder('TEAM').forSeason(season, division).build();
            const otherSeason = seasonBuilder('PREVIOUS SEASON')
                .starting('2023-02-01T00:00:00')
                .build();
            await renderComponent(team, [team], [season, otherSeason], season);

            await doClick(context.container, '.list-group .list-group-item.active');

            const items = Array.from(context.container.querySelectorAll('.list-group .list-group-item'));
            expect(items.map(i => i.className)).toEqual(['list-group-item', 'list-group-item bg-danger']);
            await doClick(findButton(context.container, 'Apply changes'));
            expect(reportedError).toBeNull();
            expect(apiAdded).toEqual([]);
            expect(apiDeleted).toEqual([{teamId: team.id, seasonId: season.id}]);
        });

        it('can assign an unselected season', async () => {
            const team = teamBuilder('TEAM').forSeason(season, division).build();
            const otherSeason = seasonBuilder('PREVIOUS SEASON')
                .starting('2023-02-01T00:00:00')
                .build();
            await renderComponent(team, [team], [season, otherSeason], season);

            await doClick(context.container, '.list-group .list-group-item:not(.active)');

            const items = Array.from(context.container.querySelectorAll('.list-group .list-group-item'));
            expect(items.map(i => i.className)).toEqual(['list-group-item bg-success', 'list-group-item active']);
            await doClick(findButton(context.container, 'Apply changes'));
            expect(reportedError).toBeNull();
            expect(apiAdded).toEqual([{teamId: team.id, seasonId: otherSeason.id, copyFromSeasonId: season.id}]);
            expect(apiDeleted).toEqual([]);
        });

        it('can close', async () => {
            const team = teamBuilder('TEAM').forSeason(season, division).build();
            const otherSeason = seasonBuilder('PREVIOUS SEASON')
                .starting('2023-02-01T00:00:00')
                .build();
            await renderComponent(team, [team], [season, otherSeason], season);

            await doClick(findButton(context.container, 'Close'));

            expect(reportedError).toBeNull();
            expect(closed).toEqual(true);
        });
    });
});