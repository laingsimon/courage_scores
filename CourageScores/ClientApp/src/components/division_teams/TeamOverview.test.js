// noinspection JSUnresolvedFunction

import {cleanUp, renderApp} from "../../tests/helpers";
import React from "react";
import {createTemporaryId} from "../../Utilities";
import {DivisionDataContainer} from "../DivisionDataContainer";
import {DivisionTeams} from "./DivisionTeams";
import {TeamOverview} from "./TeamOverview";

describe('TeamOverview', () => {
    let context;
    let reportedError;
    let divisionReloaded = false;
    let account;

    afterEach(() => {
        cleanUp(context);
    });

    async function renderComponent(divisionData, teams, teamId) {
        reportedError = null;
        divisionReloaded = false;
        context = await renderApp(
            {},
            {
                account: account,
                teams: teams,
                onError: (err) => {
                    reportedError = err;
                },
                error: null,
            },
            (<DivisionDataContainer {...divisionData}>
                <TeamOverview teamId={teamId} />
            </DivisionDataContainer>));
    }

    function createDivisionData(divisionId) {
        const season = {
            id: createTemporaryId(),
            name: 'A season',
            startDate: '2022-02-03T00:00:00',
            endDate: '2022-08-25T00:00:00',
            divisions: []
        };
        return {
            id: divisionId,
            teams: [],
            players: [],
            season: season,
            fixtures: []
        };
    }

    function createTeam(teamId, seasonId) {
        return {
            id: teamId,
            name: 'A team',
            address: 'An address',
            seasons: [ ]
        };
    }

    function createPlayer(team) {
        return {
            id: createTemporaryId(),
            teamId: team.id,
            name: 'A player',
            singles: {
                matchesPlayed: 1,
                matchesWon: 2,
                matchesLost: 3,
            },
            points: 4,
            winPercentage: 0.5,
            oneEighties: 6,
            over100Checkouts: 7
        }
    }

    function createHomeAndAwayFixtureDates(team) {
        const homeFixtureDate = {
            date: '2001-02-03T04:05:06.000Z',
            fixtures: [ {
                id: createTemporaryId(),
                homeTeam: {
                    id: team.id,
                    name: team.name
                },
                awayTeam: {
                    id: createTemporaryId(),
                    name: 'Another team'
                },
            } ]
        };
        const byeFixtureDate = {
            date: '2001-02-04T04:05:06.000Z',
            fixtures: [ {
                id: createTemporaryId(),
                homeTeam: {
                    id: team.id,
                    name: team.name
                },
                awayTeam: null,
            } ]
        };
        const awayFixtureDate = {
            date: '2001-02-05T04:05:06.000Z',
            fixtures: [ {
                id: createTemporaryId(),
                homeTeam: {
                    id: createTemporaryId(),
                    name: 'Another team'
                },
                awayTeam: {
                    id: team.id,
                    name: team.name
                },
            } ]
        };

        return [ homeFixtureDate, awayFixtureDate, byeFixtureDate ];
    }

    function assertFixtureRow(tr, date, homeTeamName, awayTeamName) {
        const cells = tr.querySelectorAll('td');
        expect(cells.length).toEqual(6);
        expect(cells[0].textContent).toEqual(date);
        expect(cells[1].textContent).toEqual(homeTeamName);
        expect(cells[5].textContent).toEqual(awayTeamName);
    }

    function assertPlayerRow(tr, name) {
        const cells = tr.querySelectorAll('td');
        expect(cells.length).toEqual(9);
        expect(cells[1].textContent).toEqual(name);
    }

    describe('when selected for season', () => {
        it('renders team details', async () => {
            const divisionId = createTemporaryId();
            const divisionData = createDivisionData(divisionId);
            const teamId = createTemporaryId();
            const teams = [ createTeam(teamId, divisionData.season.id) ];

            await renderComponent(divisionData, teams, teamId);

            expect(reportedError).toBeNull();
            const heading = context.container.querySelector('.light-background > h3');
            const address = context.container.querySelector('.light-background > p');
            expect(heading).toBeTruthy();
            expect(address).toBeTruthy();
            expect(heading.textContent).toBe('A team 🔗');
            expect(address.textContent).toBe('Address: An address');
        });

        it('renders fixtures', async () => {
            const divisionId = createTemporaryId();
            const divisionData = createDivisionData(divisionId);
            const team = createTeam(createTemporaryId(), divisionData.season.id);
            divisionData.fixtures.push(...createHomeAndAwayFixtureDates(team));

            await renderComponent(divisionData, [ team ], team.id);

            expect(reportedError).toBeNull();
            const tableSections = context.container.querySelectorAll('.light-background > div.overflow-x-auto');
            expect(tableSections.length).toEqual(2);
            const fixturesSection = tableSections[0];
            const fixtureRows = fixturesSection.querySelectorAll('table tbody tr');
            expect(fixtureRows.length).toEqual(2);
            assertFixtureRow(fixtureRows[0], 'Sat Feb 03 2001', team.name, 'Another team');
            assertFixtureRow(fixtureRows[1], 'Mon Feb 05 2001', 'Another team', team.name);
        });

        it('renders players', async () => {
            const divisionId = createTemporaryId();
            const divisionData = createDivisionData(divisionId);
            const team = createTeam(createTemporaryId(), divisionData.season.id);
            const player = createPlayer(team);
            divisionData.players.push(player);

            await renderComponent(divisionData, [ team ], team.id);

            expect(reportedError).toBeNull();
            const tableSections = context.container.querySelectorAll('.light-background > div.overflow-x-auto');
            expect(tableSections.length).toEqual(2);
            const playersSection = tableSections[1];
            const playerRows = playersSection.querySelectorAll('table tbody tr');
            expect(playerRows.length).toEqual(1);
            assertPlayerRow(playerRows[0], player.name);
        });
    });

    describe('when not selected for season', () => {
        it('renders team details', async () => {
            const divisionId = createTemporaryId();
            const divisionData = createDivisionData(divisionId);
            const teamId = createTemporaryId();
            const teams = [ createTeam(teamId, divisionData.season.id) ];

            await renderComponent(divisionData, teams, teamId);

            expect(reportedError).toBeNull();
            const heading = context.container.querySelector('.light-background > h3');
            const address = context.container.querySelector('.light-background > p');
            expect(heading).toBeTruthy();
            expect(address).toBeTruthy();
            expect(heading.textContent).toBe('A team 🔗');
            expect(address.textContent).toBe('Address: An address');
        });

        it('does not render fixtures', async () => {
            const divisionId = createTemporaryId();
            const divisionData = createDivisionData(divisionId);
            const team = createTeam(createTemporaryId(), divisionData.season.id);

            await renderComponent(divisionData, [ team ], team.id);

            expect(reportedError).toBeNull();
            const tableSections = context.container.querySelectorAll('.light-background > div.overflow-x-auto');
            expect(tableSections.length).toEqual(2);
            const fixturesSection = tableSections[0];
            const fixtureRows = fixturesSection.querySelectorAll('table tbody tr');
            expect(fixtureRows.length).toEqual(0);
        });

        it('does not render players', async () => {
            const divisionId = createTemporaryId();
            const divisionData = createDivisionData(divisionId);
            const team = createTeam(createTemporaryId(), divisionData.season.id);

            await renderComponent(divisionData, [ team ], team.id);

            expect(reportedError).toBeNull();
            const tableSections = context.container.querySelectorAll('.light-background > div.overflow-x-auto');
            expect(tableSections.length).toEqual(2);
            const playersSection = tableSections[1];
            const playerRows = playersSection.querySelectorAll('table tbody tr');
            expect(playerRows.length).toEqual(0);
        });
    });
});