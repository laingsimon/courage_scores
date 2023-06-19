// noinspection JSUnresolvedFunction

import {cleanUp, renderApp} from "../../helpers/tests";
import React from "react";
import {DivisionDataContainer} from "../DivisionDataContainer";
import {createTemporaryId} from "../../helpers/projection";
import {renderDate} from "../../helpers/rendering";
import {PlayerOverview} from "./PlayerOverview";

describe('PlayerOverview', () => {
    let context;
    let reportedError;

    afterEach(() => {
        cleanUp(context);
    });

    async function renderComponent(playerId, divisionData) {
        reportedError = null;
        context = await renderApp(
            { },
            {
                onError: (err) => {
                    reportedError = {
                        message: err.message,
                        stack: err.stack
                    };
                }
            },
            (<DivisionDataContainer {...divisionData}>
                <PlayerOverview playerId={playerId} />
            </DivisionDataContainer>));
    }

    describe('renders', () => {
        const division = {
            id: createTemporaryId(),
            name: 'DIVISION',
        };
        const season = {
            id: createTemporaryId(),
            name: 'SEASON',
        };
        const team = {
            id: createTemporaryId(),
            name: 'TEAM',
        };

        const player = {
            id: createTemporaryId(),
            rank: 1,
            name: 'NAME',
            team: team.name,
            teamId: team.id,
            singles: {
                matchesPlayed: 2,
                matchesWon: 3,
                matchesLost: 4,
            },
            points: 5,
            winPercentage: 6,
            oneEighties: 7,
            over100Checkouts: 8,
            fixtures: { }
        };

        it('player and team details', async () => {
            await renderComponent(
                player.id,
                {
                    teams: [ team ],
                    players: [ player ],
                    fixtures: [],
                    id: division.id,
                    season
                });

            expect(reportedError).toBeNull();
            const heading = context.container.querySelector('h3');
            expect(heading).toBeTruthy();
            expect(heading.textContent).toContain(player.name);
            expect(heading.textContent).toContain(team.name);
            const linkToTeam = heading.querySelector('a');
            expect(linkToTeam).toBeTruthy();
            expect(linkToTeam.href).toEqual(`http://localhost/division/${division.id}/team:${team.id}/${season.id}`);
        });

        it('when player not found', async () => {
            await renderComponent(
                createTemporaryId(),
                {
                    teams: [ team ],
                    players: [ player ],
                    fixtures: [ ],
                    id: division.id,
                    season
                });

            expect(reportedError).toBeNull();
            expect(context.container.textContent).toContain('⚠ Player could not be found');
        });

        it('table headings', async () => {
            await renderComponent(
                player.id,
                {
                    teams: [ team ],
                    players: [ player ],
                    fixtures: [ ],
                    id: division.id,
                    season
                });

            expect(reportedError).toBeNull();
            const table = context.container.querySelector('table.table');
            expect(table).toBeTruthy();
            const headings = Array.from(table.querySelectorAll('thead tr th')).map(th => th.textContent);
            expect(headings).toEqual(['Date','Home','','vs','','Away']);
        });

        it('league fixture', async () => {
            const fixture = {
                id: createTemporaryId(),
                isKnockout: false,
                homeTeam: {
                    id: createTemporaryId(),
                    name: 'HOME',
                },
                awayTeam: team,
                homeScore: 3,
                awayScore: 1,
            };
            const fixtureDate = {
                date: '2023-05-06T00:00:00',
                fixtures: [ fixture ],
                tournamentFixtures: []
            };
            const playerWithLeagueFixture = Object.assign({ }, player);
            playerWithLeagueFixture.fixtures[fixtureDate.date] = fixture.id;
            await renderComponent(
                playerWithLeagueFixture.id,
                {
                    teams: [ team ],
                    players: [ playerWithLeagueFixture ],
                    fixtures: [ fixtureDate ],
                    id: division.id,
                    season
                });

            expect(reportedError).toBeNull();
            const table = context.container.querySelector('table.table');
            expect(table).toBeTruthy();
            const rows = Array.from(table.querySelectorAll('tbody tr'));
            expect(rows.length).toEqual(1);
            const cells = Array.from(rows[0].querySelectorAll('td'));
            expect(cells.map(td => td.textContent)).toEqual([
                renderDate(fixtureDate.date),
                'HOME',
                '3',
                'vs',
                '1',
                'TEAM',
            ]);
            const linkToFixture = cells[0].querySelector('a');
            expect(linkToFixture).toBeTruthy();
            expect(linkToFixture.href).toEqual(`http://localhost/score/${fixture.id}`);
            const linkToHomeTeam = cells[1].querySelector('a');
            expect(linkToHomeTeam).toBeTruthy();
            expect(linkToHomeTeam.href).toEqual(`http://localhost/division/${division.id}/team:${fixture.homeTeam.id}/${season.id}`);
            const linkToAwayTeam = cells[5].querySelector('a');
            expect(linkToAwayTeam).toBeFalsy();
        });

        it('league knockout fixture', async () => {
            const fixture = {
                id: createTemporaryId(),
                isKnockout: true,
                homeTeam: team,
                awayTeam: {
                    id: createTemporaryId(),
                    name: 'AWAY',
                },
                homeScore: 3,
                awayScore: 1,
            };
            const fixtureDate = {
                date: '2023-05-06T00:00:00',
                fixtures: [ fixture ],
                tournamentFixtures: []
            };
            const playerWithLeagueFixture = Object.assign({ }, player);
            playerWithLeagueFixture.fixtures[fixtureDate.date] = fixture.id;
            await renderComponent(
                playerWithLeagueFixture.id,
                {
                    teams: [ team ],
                    players: [ playerWithLeagueFixture ],
                    fixtures: [ fixtureDate ],
                    id: division.id,
                    season
                });

            expect(reportedError).toBeNull();
            const table = context.container.querySelector('table.table');
            expect(table).toBeTruthy();
            const rows = Array.from(table.querySelectorAll('tbody tr'));
            expect(rows.length).toEqual(1);
            const cells = Array.from(rows[0].querySelectorAll('td'));
            expect(cells.map(td => td.textContent)).toEqual([
                renderDate(fixtureDate.date) + '(Qualifier)',
                'TEAM',
                '3',
                'vs',
                '1',
                'AWAY',
            ]);
            const linkToFixture = cells[0].querySelector('a');
            expect(linkToFixture).toBeTruthy();
            expect(linkToFixture.href).toEqual(`http://localhost/score/${fixture.id}`);
            const linkToHomeTeam = cells[1].querySelector('a');
            expect(linkToHomeTeam).toBeFalsy();
            const linkToAwayTeam = cells[5].querySelector('a');
            expect(linkToAwayTeam).toBeTruthy();
            expect(linkToAwayTeam.href).toEqual(`http://localhost/division/${division.id}/team:${fixture.awayTeam.id}/${season.id}`);
        });

        it('postponed league fixture', async () => {
            const fixture = {
                id: createTemporaryId(),
                isKnockout: false,
                postponed: true,
                homeTeam: team,
                awayTeam: {
                    id: createTemporaryId(),
                    name: 'AWAY',
                },
                homeScore: 3,
                awayScore: 1,
            };
            const fixtureDate = {
                date: '2023-05-06T00:00:00',
                fixtures: [ fixture ],
                tournamentFixtures: []
            };
            const playerWithLeagueFixture = Object.assign({ }, player);
            playerWithLeagueFixture.fixtures[fixtureDate.date] = fixture.id;
            await renderComponent(
                playerWithLeagueFixture.id,
                {
                    teams: [ team ],
                    players: [ playerWithLeagueFixture ],
                    fixtures: [ fixtureDate ],
                    id: division.id,
                    season
                });

            expect(reportedError).toBeNull();
            const table = context.container.querySelector('table.table');
            expect(table).toBeTruthy();
            const rows = Array.from(table.querySelectorAll('tbody tr'));
            expect(rows.length).toEqual(1);
            const cells = Array.from(rows[0].querySelectorAll('td'));
            expect(cells.map(td => td.textContent)).toEqual([
                renderDate(fixtureDate.date),
                'TEAM',
                'P',
                'vs',
                'P',
                'AWAY',
            ]);
            const linkToFixture = cells[0].querySelector('a');
            expect(linkToFixture).toBeTruthy();
            expect(linkToFixture.href).toEqual(`http://localhost/score/${fixture.id}`);
            const linkToHomeTeam = cells[1].querySelector('a');
            expect(linkToHomeTeam).toBeFalsy();
            const linkToAwayTeam = cells[5].querySelector('a');
            expect(linkToAwayTeam).toBeTruthy();
            expect(linkToAwayTeam.href).toEqual(`http://localhost/division/${division.id}/team:${fixture.awayTeam.id}/${season.id}`);
        });

        it('unplayed tournament fixture', async () => {
            const tournamentFixture = {
                id: createTemporaryId(),
                proposed: false,
                players: [ player.id ],
                type: 'TYPE',
                address: 'ADDRESS',
                winningSide: null,
            };
            const fixtureDate = {
                date: '2023-05-06T00:00:00',
                fixtures: [],
                tournamentFixtures: [ tournamentFixture ]
            };
            await renderComponent(
                player.id,
                {
                    teams: [ team ],
                    players: [ player ],
                    fixtures: [ fixtureDate ],
                    id: division.id,
                    season
                });

            expect(reportedError).toBeNull();
            const table = context.container.querySelector('table.table');
            expect(table).toBeTruthy();
            const rows = Array.from(table.querySelectorAll('tbody tr'));
            expect(rows.length).toEqual(1);
            const cells = Array.from(rows[0].querySelectorAll('td'));
            expect(cells.map(td => td.textContent)).toEqual([
                renderDate(fixtureDate.date),
                'TYPE at ADDRESS',
                ''
            ]);
            const linkToFixture = cells[0].querySelector('a');
            expect(linkToFixture).toBeTruthy();
            expect(linkToFixture.href).toEqual(`http://localhost/tournament/${tournamentFixture.id}`);
        });

        it('tournament fixture with winner', async () => {
            const tournamentFixture = {
                id: createTemporaryId(),
                proposed: false,
                players: [ player.id ],
                type: 'TYPE',
                address: 'ADDRESS',
                winningSide: {
                    name: 'WINNER'
                },
            };
            const fixtureDate = {
                date: '2023-05-06T00:00:00',
                fixtures: [],
                tournamentFixtures: [ tournamentFixture ]
            };
            await renderComponent(
                player.id,
                {
                    teams: [ team ],
                    players: [ player ],
                    fixtures: [ fixtureDate ],
                    id: division.id,
                    season
                });

            expect(reportedError).toBeNull();
            const table = context.container.querySelector('table.table');
            expect(table).toBeTruthy();
            const rows = Array.from(table.querySelectorAll('tbody tr'));
            expect(rows.length).toEqual(1);
            const cells = Array.from(rows[0].querySelectorAll('td'));
            expect(cells.map(td => td.textContent)).toEqual([
                renderDate(fixtureDate.date),
                'TYPE at ADDRESS',
                'Winner: WINNER',
            ]);
            const linkToFixture = cells[0].querySelector('a');
            expect(linkToFixture).toBeTruthy();
            expect(linkToFixture.href).toEqual(`http://localhost/tournament/${tournamentFixture.id}`);
        });

        it('not proposed tournament fixtures', async () => {
            const tournamentFixture = {
                id: createTemporaryId(),
                proposed: true,
                players: [ player.id ],
                type: 'TYPE',
                address: 'ADDRESS',
                winningSide: {
                    name: 'WINNER'
                },
            };
            const fixtureDate = {
                date: '2023-05-06T00:00:00',
                fixtures: [],
                tournamentFixtures: [ tournamentFixture ]
            };
            await renderComponent(
                player.id,
                {
                    teams: [ team ],
                    players: [ player ],
                    fixtures: [ fixtureDate ],
                    id: division.id,
                    season
                });

            expect(reportedError).toBeNull();
            const table = context.container.querySelector('table.table');
            expect(table).toBeTruthy();
            const rows = Array.from(table.querySelectorAll('tbody tr'));
            expect(rows.length).toEqual(0);
        });
    });
});