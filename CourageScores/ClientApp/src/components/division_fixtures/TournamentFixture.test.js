// noinspection JSUnresolvedFunction

import {cleanUp, doClick, findButton, noop, renderApp} from "../../helpers/tests";
import {createTemporaryId} from "../../helpers/projection";
import {toMap} from "../../helpers/collections";
import React from "react";
import {DivisionDataContainer} from "../DivisionDataContainer";
import {TournamentFixture} from "./TournamentFixture";

describe('TournamentFixture', () => {
    let context;
    let reportedError;
    let tournamentChanged;
    let savedTournament;
    let deletedId;
    let apiResponse;

    const tournamentApi = {
        update: async (data, lastUpdated) => {
            savedTournament = {data, lastUpdated};
            return apiResponse || {success: true};
        },
        delete: async (id) => {
            deletedId = id;
            return apiResponse || {success: true};
        }
    }

    function onTournamentChanged() {
        tournamentChanged = true;
    }

    afterEach(() => {
        cleanUp(context);
    });

    async function renderComponent(props, divisionData, account, teams) {
        reportedError = null;
        tournamentChanged = null;
        savedTournament = null;
        deletedId = null;
        apiResponse = null;
        context = await renderApp(
            {tournamentApi},
            {name: 'Courage Scores'},
            {
                onError: (err) => {
                    reportedError = {
                        message: err.message,
                        stack: err.stack
                    };
                },
                account,
                teams: toMap(teams || []),
                reportClientSideException: noop,
            },
            (<DivisionDataContainer {...divisionData}>
                <TournamentFixture
                    {...props}
                    onTournamentChanged={onTournamentChanged}/>
            </DivisionDataContainer>),
            null,
            null,
            'tbody');
    }

    describe('when logged out', () => {
        const season = {
            id: createTemporaryId(),
            name: 'SEASON',
        };
        const division = {
            id: createTemporaryId(),
            name: 'DIVISION',
        };
        const player = {
            id: createTemporaryId(),
            name: 'PLAYER',
        };
        const account = null;

        function assertPlayerDisplayWithPlayerLinks(playersCell, ordinal, players) {
            const side = playersCell.querySelector(`div.px-3 > div:nth-child(${ordinal})`);
            expect(side).toBeTruthy();

            assertPlayersAndLinks(side, players);
        }

        function assertPlayerDisplayWithSideNameAndTeamLink(playersCell, ordinal, sideName, teamId, players) {
            const side = playersCell.querySelector(`div.px-3 > div:nth-child(${ordinal})`);
            expect(side).toBeTruthy();

            assertSideNameAndLink(side, sideName, `http://localhost/division/${division.name}/team:${encodeURI(teamId)}/${season.name}`);
            assertPlayersAndLinks(side, players);
        }

        function assertSinglePlayerDisplay(playersCell, ordinal, sideName, player) {
            const side = playersCell.querySelector(`div.px-3 > div:nth-child(${ordinal})`);
            expect(side).toBeTruthy();

            assertPlayersAndLinks(side, [player]);
        }

        function assertSideNameAndLink(side, sideName, href) {
            const link = side.querySelector('a');
            expect(link).toBeTruthy();
            expect(link.textContent).toEqual(sideName);
            expect(link.href).toEqual(href);
        }

        function assertPlayersAndLinks(side, players) {
            const links = Array.from(side.querySelectorAll('label a'));
            expect(links.length).toEqual(players.length);
            players.forEach((player, index) => {
                const link = links[index];
                expect(link.textContent).toEqual(player.name);
                expect(link.href).toEqual(`http://localhost/division/${division.name}/player:${encodeURI(player.name)}/${season.name}`);
            });
        }

        it('renders unplayed tournament', async () => {
            const tournament = {
                id: createTemporaryId(),
                proposed: false,
                address: 'ADDRESS',
                sides: [],
                winningSide: null,
                type: 'TYPE',
            };
            await renderComponent(
                {tournament, date: '2023-05-06T00:00:00', expanded: false},
                {id: division.id, season, players: [player]},
                account);

            expect(reportedError).toBeNull();
            const cells = Array.from(context.container.querySelectorAll('td'));
            const cellText = cells.map(td => td.textContent);
            expect(cellText).toEqual(['TYPE at ADDRESS']);
        });

        it('renders tournament won', async () => {
            const side = {
                id: createTemporaryId(),
                name: 'WINNER',
            };
            const tournament = {
                id: createTemporaryId(),
                proposed: false,
                address: 'ADDRESS',
                sides: [side],
                winningSide: side,
                type: 'TYPE',
            };
            await renderComponent(
                {tournament, date: '2023-05-06T00:00:00', expanded: false},
                {id: division.id, season, players: [player]},
                account);

            expect(reportedError).toBeNull();
            const cells = Array.from(context.container.querySelectorAll('td'));
            const cellText = cells.map(td => td.textContent);
            expect(cellText).toEqual(['TYPE at ADDRESS', 'Winner: WINNER']);
        });

        it('renders tournament won by team', async () => {
            const team = {
                id: createTemporaryId(),
                name: 'TEAM',
            };
            const side = {
                id: createTemporaryId(),
                name: 'WINNER',
                teamId: team.id,
            };
            const tournament = {
                id: createTemporaryId(),
                proposed: false,
                address: 'ADDRESS',
                sides: [side],
                winningSide: side,
                type: 'TYPE',
            };
            await renderComponent(
                {tournament, date: '2023-05-06T00:00:00', expanded: false},
                {id: division.id, name: division.name, season, players: [player]},
                account,
                [team]);

            expect(reportedError).toBeNull();
            const cells = Array.from(context.container.querySelectorAll('td'));
            const cellText = cells.map(td => td.textContent);
            expect(cellText).toEqual(['TYPE at ADDRESS', 'Winner: WINNER']);
            const linkToTeam = cells[1].querySelector('a');
            expect(linkToTeam).toBeTruthy();
            expect(linkToTeam.textContent).toEqual(side.name);
            expect(linkToTeam.href).toEqual(`http://localhost/division/${division.name}/team:${encodeURI(team.name)}/${season.name}`);
        });

        it('renders tournament won by team (when team not found)', async () => {
            const team = {
                id: createTemporaryId(),
                name: 'TEAM',
            };
            const side = {
                id: createTemporaryId(),
                name: 'WINNER',
                teamId: team.id,
            };
            const tournament = {
                id: createTemporaryId(),
                proposed: false,
                address: 'ADDRESS',
                sides: [side],
                winningSide: side,
                type: 'TYPE',
            };
            await renderComponent(
                {tournament, date: '2023-05-06T00:00:00', expanded: false},
                {id: division.id, name: division.name, season, players: [player]},
                account,
                []);

            expect(reportedError).toBeNull();
            const cells = Array.from(context.container.querySelectorAll('td'));
            const cellText = cells.map(td => td.textContent);
            expect(cellText).toEqual(['TYPE at ADDRESS', 'Winner: WINNER']);
            const linkToTeam = cells[1].querySelector('a');
            expect(linkToTeam).toBeFalsy();
        });

        it('does not render proposed tournaments', async () => {
            const tournament = {
                id: createTemporaryId(),
                proposed: true,
                address: 'ADDRESS',
                sides: [],
                winningSide: null,
                type: 'TYPE',
            };
            await renderComponent(
                {tournament, date: '2023-05-06T00:00:00', expanded: false},
                {id: division.id, season, players: [player]},
                account);

            expect(reportedError).toBeNull();
            expect(context.container.innerHTML).toEqual('');
        });

        it('renders who is playing', async () => {
            const player1 = {id: createTemporaryId(), name: 'PLAYER 1'};
            const player2 = {id: createTemporaryId(), name: 'PLAYER 2'};
            const player3 = {id: createTemporaryId(), name: 'PLAYER 3'};
            const player4 = {id: createTemporaryId(), name: 'PLAYER 4'};
            const player5 = {id: createTemporaryId(), name: 'PLAYER 5'};
            const player6 = {id: createTemporaryId(), name: 'PLAYER 6'};
            const player7 = {id: createTemporaryId(), name: 'PLAYER 7'};
            const side1 = {
                id: createTemporaryId(),
                name: 'SIDE 1',
                players: [player1],
            };
            const side2 = {
                id: createTemporaryId(),
                name: 'SIDE 2',
                players: [player2, player3],
                teamId: createTemporaryId(),
            };
            const side3 = {
                id: createTemporaryId(),
                name: 'PLAYER 4, PLAYER 5',
                players: [player4, player5],
            };
            const side4 = {
                id: createTemporaryId(),
                name: 'WITH DIFFERENT NAME TO PLAYER NAMES',
                players: [player6, player7],
            };
            const tournament = {
                id: createTemporaryId(),
                proposed: false,
                address: 'ADDRESS',
                sides: [side1, side2, side3, side4],
                winningSide: null,
                type: 'TYPE',
            };
            await renderComponent(
                {tournament, date: '2023-05-06T00:00:00', expanded: true},
                {
                    id: division.id,
                    name: division.name,
                    season,
                    players: [player1, player2, player3, player4, player5, player6, player7]
                },
                account);

            expect(reportedError).toBeNull();
            const playersCell = context.container.querySelector('td:first-child');
            assertPlayerDisplayWithPlayerLinks(playersCell, 1, [player4, player5]);
            assertSinglePlayerDisplay(playersCell, 2, side1.name, player1);
            assertPlayerDisplayWithSideNameAndTeamLink(playersCell, 3, side2.name, side2.teamId, []);
            assertPlayerDisplayWithPlayerLinks(playersCell, 4, [player6, player7]);
        });
    });

    describe('when logged in', () => {
        const season = {
            id: createTemporaryId(),
            name: 'SEASON',
        };
        const division = {
            id: createTemporaryId(),
            name: 'DIVISION',
        };
        const player = {
            id: createTemporaryId(),
            name: 'PLAYER',
        };
        const account = {
            access: {
                manageTournaments: true,
            }
        };

        it('renders proposed tournament', async () => {
            const tournament = {
                id: createTemporaryId(),
                proposed: true,
                address: 'ADDRESS',
                sides: [],
                winningSide: null,
                type: 'TYPE',
            };
            await renderComponent(
                {tournament, date: '2023-05-06T00:00:00', expanded: false},
                {id: division.id, season, players: [player]},
                account);

            expect(reportedError).toBeNull();
            const cells = Array.from(context.container.querySelectorAll('td'));
            const cellText = cells.map(td => td.textContent);
            expect(cellText).toEqual(['Tournament at ADDRESS', '➕']);
        });

        it('can add tournament', async () => {
            const tournament = {
                id: createTemporaryId(),
                proposed: true,
                address: 'ADDRESS',
                sides: [],
                winningSide: null,
                type: 'TYPE',
                updated: '2023-07-01T00:00:00',
            };
            await renderComponent(
                {tournament, date: '2023-05-06T00:00:00', expanded: false},
                {id: division.id, season, players: [player]},
                account);
            const adminCell = context.container.querySelector('td:nth-child(2)');

            await doClick(findButton(adminCell, '➕'));

            expect(reportedError).toBeNull();
            expect(savedTournament.data).toEqual({
                date: '2023-05-06T00:00:00',
                address: 'ADDRESS',
                divisionId: division.id,
                seasonId: season.id,
            });
            expect(tournamentChanged).toEqual(true);
        });

        it('handles error during add tournament', async () => {
            const tournament = {
                id: createTemporaryId(),
                proposed: true,
                address: 'ADDRESS',
                sides: [],
                winningSide: null,
                type: 'TYPE',
                updated: '2023-07-01T00:00:00',
            };
            await renderComponent(
                {tournament, date: '2023-05-06T00:00:00', expanded: false},
                {id: division.id, season, players: [player]},
                account);
            const adminCell = context.container.querySelector('td:nth-child(2)');
            apiResponse = {success: false, errors: ['SOME ERROR']};

            await doClick(findButton(adminCell, '➕'));

            expect(reportedError).toBeNull();
            expect(savedTournament).not.toBeNull();
            expect(tournamentChanged).toBeNull();
            expect(context.container.textContent).toContain('SOME ERROR');
            expect(context.container.textContent).toContain('Could not create tournament');
        });

        it('can close error dialog after creation failure', async () => {
            const tournament = {
                id: createTemporaryId(),
                proposed: true,
                address: 'ADDRESS',
                sides: [],
                winningSide: null,
                type: 'TYPE',
                updated: '2023-07-01T00:00:00',
            };
            await renderComponent(
                {tournament, date: '2023-05-06T00:00:00', expanded: false},
                {id: division.id, season, players: [player]},
                account);
            const adminCell = context.container.querySelector('td:nth-child(2)');
            apiResponse = {success: false, errors: ['SOME ERROR']};
            await doClick(findButton(adminCell, '➕'));
            expect(context.container.textContent).toContain('Could not create tournament');

            await doClick(findButton(adminCell, 'Close'));

            expect(context.container.textContent).not.toContain('Could not create tournament');
        });

        it('can delete tournament', async () => {
            const tournament = {
                id: createTemporaryId(),
                proposed: false,
                address: 'ADDRESS',
                sides: [],
                winningSide: null,
                type: 'TYPE',
            };
            await renderComponent(
                {tournament, date: '2023-05-06T00:00:00', expanded: false},
                {id: division.id, season, players: [player]},
                account);
            const adminCell = context.container.querySelector('td:nth-child(2)');
            let confirm;
            window.confirm = (message) => {
                confirm = message;
                return true;
            };

            await doClick(findButton(adminCell, '🗑'));

            expect(confirm).toEqual('Are you sure you want to delete this tournament fixture?');
            expect(reportedError).toBeNull();
            expect(deletedId).toEqual(tournament.id);
            expect(tournamentChanged).toEqual(true);
        });

        it('does not delete tournament is confirmation rejected', async () => {
            const tournament = {
                id: createTemporaryId(),
                proposed: false,
                address: 'ADDRESS',
                sides: [],
                winningSide: null,
                type: 'TYPE',
            };
            await renderComponent(
                {tournament, date: '2023-05-06T00:00:00', expanded: false},
                {id: division.id, season, players: [player]},
                account);
            const adminCell = context.container.querySelector('td:nth-child(2)');
            let confirm;
            window.confirm = (message) => {
                confirm = message;
                return false;
            };

            await doClick(findButton(adminCell, '🗑'));

            expect(confirm).toEqual('Are you sure you want to delete this tournament fixture?');
            expect(reportedError).toBeNull();
            expect(deletedId).toBeNull();
            expect(tournamentChanged).toEqual(null);
        });

        it('handles error during delete', async () => {
            const tournament = {
                id: createTemporaryId(),
                proposed: false,
                address: 'ADDRESS',
                sides: [],
                winningSide: null,
                type: 'TYPE',
            };
            await renderComponent(
                {tournament, date: '2023-05-06T00:00:00', expanded: false},
                {id: division.id, season, players: [player]},
                account);
            const adminCell = context.container.querySelector('td:nth-child(2)');
            window.confirm = () => {
                return true;
            };
            apiResponse = {success: false, errors: ['SOME ERROR']};

            await doClick(findButton(adminCell, '🗑'));

            expect(reportedError).toBeNull();
            expect(tournamentChanged).toBeNull();
            expect(context.container.textContent).toContain('SOME ERROR');
            expect(context.container.textContent).toContain('Could not delete tournament');
        });

        it('can close error dialog after delete failure', async () => {
            const tournament = {
                id: createTemporaryId(),
                proposed: false,
                address: 'ADDRESS',
                sides: [],
                winningSide: null,
                type: 'TYPE',
            };
            await renderComponent(
                {tournament, date: '2023-05-06T00:00:00', expanded: false},
                {id: division.id, season, players: [player]},
                account);
            const adminCell = context.container.querySelector('td:nth-child(2)');
            window.confirm = () => {
                return true;
            };
            apiResponse = {success: false, errors: ['SOME ERROR']};
            await doClick(findButton(adminCell, '🗑'));
            expect(context.container.textContent).toContain('Could not delete tournament');

            await doClick(findButton(adminCell, 'Close'));

            expect(context.container.textContent).not.toContain('Could not delete tournament');
        });
    });
});