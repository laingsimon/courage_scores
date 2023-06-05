// noinspection JSUnresolvedFunction

import {cleanUp, renderApp} from "../../tests/helpers";
import React from "react";
import {createTemporaryId} from "../../helpers/projection";
import {DivisionDataContainer} from "../DivisionDataContainer";
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

    function createTeam(teamId) {
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
            const teams = [ createTeam(teamId) ];

            await renderComponent(divisionData, teams, teamId);

            expect(reportedError).toBeNull();
            const heading = context.container.querySelector('.light-background > h3');
            const address = context.container.querySelector('.light-background > p');
            expect(heading).toBeTruthy();
            expect(address).toBeTruthy();
            expect(heading.textContent).toEqual('A team 🔗');
            expect(address.textContent).toEqual('Address: An address');
        });

        it('renders team not found', async () => {
            const divisionId = createTemporaryId();
            const divisionData = createDivisionData(divisionId);
            const teamId = createTemporaryId();
            const teams = [ createTeam(teamId) ];

            await renderComponent(divisionData, teams, createTemporaryId());

            expect(reportedError).toBeNull();
            expect(context.container.textContent).toContain('Team could not be found');
        });

        it('renders fixtures', async () => {
            const divisionId = createTemporaryId();
            const divisionData = createDivisionData(divisionId);
            const team = createTeam(createTemporaryId());
            divisionData.fixtures.push(...createHomeAndAwayFixtureDates(team));

            await renderComponent(divisionData, [ team ], team.id);

            expect(reportedError).toBeNull();
            const tableSections = context.container.querySelectorAll('.light-background > div.overflow-x-auto');
            expect(tableSections.length).toEqual(2);
            const fixturesSection = tableSections[0];
            const fixtureRows = fixturesSection.querySelectorAll('table tbody tr');
            expect(fixtureRows.length).toEqual(2);
            assertFixtureRow(fixtureRows[0], '3 Feb', team.name, 'Another team');
            assertFixtureRow(fixtureRows[1], '5 Feb', 'Another team', team.name);
        });

        it('renders postponed fixtures', async () => {
            const divisionId = createTemporaryId();
            const divisionData = createDivisionData(divisionId);
            const team = createTeam(createTemporaryId());
            divisionData.fixtures.push(...createHomeAndAwayFixtureDates(team));
            divisionData.fixtures[0].fixtures[0].postponed = true;

            await renderComponent(divisionData, [ team ], team.id);

            expect(reportedError).toBeNull();
            const tableSections = context.container.querySelectorAll('.light-background > div.overflow-x-auto');
            expect(tableSections.length).toEqual(2);
            const fixturesSection = tableSections[0];
            const fixtureRows = fixturesSection.querySelectorAll('table tbody tr');
            expect(fixtureRows.length).toEqual(2);
            const cellText = Array.from(fixtureRows[0].querySelectorAll('td')).map(td => td.textContent);
            expect(cellText[2]).toEqual('P');
            expect(cellText[4]).toEqual('P');
        });

        it('renders fixtures without scores', async () => {
            const divisionId = createTemporaryId();
            const divisionData = createDivisionData(divisionId);
            const team = createTeam(createTemporaryId());
            divisionData.fixtures.push(...createHomeAndAwayFixtureDates(team));
            divisionData.fixtures[0].fixtures[0].homeScore = null;
            divisionData.fixtures[0].fixtures[0].awayScore = null;

            await renderComponent(divisionData, [ team ], team.id);

            expect(reportedError).toBeNull();
            const tableSections = context.container.querySelectorAll('.light-background > div.overflow-x-auto');
            expect(tableSections.length).toEqual(2);
            const fixturesSection = tableSections[0];
            const fixtureRows = fixturesSection.querySelectorAll('table tbody tr');
            expect(fixtureRows.length).toEqual(2);
            const cellText = Array.from(fixtureRows[0].querySelectorAll('td')).map(td => td.textContent);
            expect(cellText[2]).toEqual('-');
            expect(cellText[4]).toEqual('-');
        });

        it('renders players', async () => {
            const divisionId = createTemporaryId();
            const divisionData = createDivisionData(divisionId);
            const team = createTeam(createTemporaryId());
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
            const teams = [ createTeam(teamId) ];

            await renderComponent(divisionData, teams, teamId);

            expect(reportedError).toBeNull();
            const heading = context.container.querySelector('.light-background > h3');
            const address = context.container.querySelector('.light-background > p');
            expect(heading).toBeTruthy();
            expect(address).toBeTruthy();
            expect(heading.textContent).toEqual('A team 🔗');
            expect(address.textContent).toEqual('Address: An address');
        });

        it('does not render fixtures', async () => {
            const divisionId = createTemporaryId();
            const divisionData = createDivisionData(divisionId);
            const team = createTeam(createTemporaryId());

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
            const team = createTeam(createTemporaryId());

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