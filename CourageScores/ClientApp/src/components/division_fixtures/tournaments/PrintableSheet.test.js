// noinspection JSUnresolvedFunction

import {cleanUp, renderApp} from "../../../helpers/tests";
import React from "react";
import {TournamentContainer} from "./TournamentContainer";
import {PrintableSheet} from "./PrintableSheet";
import {createTemporaryId} from "../../../helpers/projection";
import {renderDate} from "../../../helpers/rendering";
import {toMap} from "../../../helpers/collections";

describe('PrintableSheet', () => {
    let context;
    let reportedError;

    afterEach(() => {
        cleanUp(context);
    });

    async function renderComponent(containerProps, props, teams, divisions) {
        reportedError = null;
        context = await renderApp(
            {},
            {name: 'Courage Scores'},
            {
                onError: (err) => {
                    if (err.message) {
                        reportedError = {
                            message: err.message,
                            stack: err.stack
                        };
                    } else {
                        reportedError = err;
                    }
                },
                teams,
                divisions,
            },
            (<TournamentContainer {...containerProps}>
                <PrintableSheet {...props} />
            </TournamentContainer>));
    }

    function createSide(name, players) {
        return {
            id: createTemporaryId(),
            name: name,
            players: (players || [])
        }
    }

    function getRounds() {
        return Array.from(context.container.querySelectorAll('div[datatype^="round-"]'))
            .map(round => {
                return {
                    //element: round,
                    oneEighties: round.querySelector('div[data-accolades="180s"]') ? {
                        //element: round.querySelector('div[data-accolades="180s"]'),
                        players: Array.from(round.querySelectorAll('div[data-accolades="180s"] div')).map(e => e.textContent),
                    } : null,
                    hiChecks: round.querySelector('div[data-accolades="hi-checks"]') ? {
                        //element: round.querySelector('div[data-accolades="hi-checks"]'),
                        players: Array.from(round.querySelectorAll('div[data-accolades="180s"] div')).map(e => e.textContent),
                    } : null,
                    heading: round.querySelector('h5[datatype="round-name"]').textContent,
                    matches: Array.from(round.querySelectorAll('div[datatype="match"]'))
                        .map(match => {
                            return {
                                //element: match,
                                sideAwinner: match.querySelector('div[datatype="sideA"]')
                                    ? match.querySelector('div[datatype="sideA"]').className.indexOf('bg-winner') !== -1
                                    : null,
                                sideBwinner: match.querySelector('div[datatype="sideB"]')
                                    ? match.querySelector('div[datatype="sideB"]').className.indexOf('bg-winner') !== -1
                                    : null,
                                sideAname: match.querySelector('div[datatype="sideAname"]')
                                    ? match.querySelector('div[datatype="sideAname"]').textContent.trim()
                                    : null,
                                sideBname: match.querySelector('div[datatype="sideBname"]')
                                    ? match.querySelector('div[datatype="sideBname"]').textContent.trim()
                                    : null,
                                scoreA: match.querySelector('div[datatype="scoreA"]')
                                    ? match.querySelector('div[datatype="scoreA"]').textContent.trim()
                                    : null,
                                scoreB: match.querySelector('div[datatype="scoreB"]')
                                    ? match.querySelector('div[datatype="scoreB"]').textContent.trim()
                                    : null,
                                bye: match.textContent.indexOf('Bye') !== -1,
                            };
                        }),
                }
            });
    }

    function getWhoIsPlaying(selector) {
        return Array.from(context.container.querySelectorAll('div[datatype="playing"] li'))
            .map(selector);
    }

    function whoIsPlayingText(li) {
        return li.className.indexOf('text-decoration-line-through') !== -1
            ? '-' + li.textContent + '-'
            : li.textContent;
    }

    function linkHref(container) {
        const link = container.querySelector('a');
        return link ? link.href : null;
    }

    function getAccolades(name, selector) {
        return Array.from(context.container.querySelectorAll('div[data-accolades="' + name + '"] div'))
            .map(selector);
    }

    function getWinner() {
        const winnerElement = context.container.querySelector('div[datatype="winner"]');

        return {
            name: winnerElement.querySelector('span').textContent,
            link: winnerElement.querySelector('a')
                ? winnerElement.querySelector('a').href
                : null,
        };
    }

    describe('played tournament', () => {
        const sideA = createSide('A');
        const sideB = createSide('B');
        const sideC = createSide('C');
        const sideD = createSide('D');
        const sideE = createSide('E');
        const sideF = createSide('F');
        const sideG = createSide('G');
        const sideH = createSide('H');
        const sideI = createSide('I');
        const sideJ = createSide('J');
        const sideK = createSide('K');
        const sideL = createSide('L');
        const division = {
            id: createTemporaryId(),
            name: 'DIVISION',
        };
        const season = {
            id: createTemporaryId(),
            name: 'SEASON',
        };

        it('renders tournament with one round', async () => {
            const tournamentData = {
                round: {
                    matches: [
                        { sideA: sideA, sideB: sideB, scoreA: 1, scoreB: 2 },
                    ],
                },
                sides: [ sideA, sideB ],
                oneEighties: [],
                over100Checkouts: [],
            };

            await renderComponent({ tournamentData, season, division }, { printOnly: false });

            expect(reportedError).toBeNull();
            const rounds = getRounds();
            expect(rounds.length).toEqual(1);
            expect(rounds[0]).toEqual({
                heading: 'Final',
                hiChecks: { players: [] },
                oneEighties: { players: [] },
                matches: [
                    { sideAname: 'A', sideBname: 'B', sideAwinner: false, sideBwinner: true, scoreA: '1', scoreB: '2', bye: false },
                ],
            });
        });

        it('renders tournament with 2 rounds', async () => {
            const tournamentData = {
                round: {
                    matches: [
                        { sideA: sideA, sideB: sideB, scoreA: 1, scoreB: 2 },
                        { sideA: sideC, sideB: sideD, scoreA: 2, scoreB: 1 },
                    ],
                    nextRound: {
                        matches: [
                            { sideA: sideB, sideB: sideC, scoreA: 2, scoreB: 1 },
                        ],
                        nextRound: null,
                    }
                },
                sides: [ sideA, sideB, sideC, sideD ],
                oneEighties: [],
                over100Checkouts: [],
            };

            await renderComponent({ tournamentData, season, division }, { printOnly: false });

            expect(reportedError).toBeNull();
            const rounds = getRounds();
            expect(rounds.length).toEqual(2);
            expect(rounds[0]).toEqual({
                heading: 'Semi-Final',
                hiChecks: null,
                oneEighties: null,
                matches: [
                    { sideAname: 'A', sideBname: 'B', sideAwinner: false, sideBwinner: true, scoreA: '1', scoreB: '2', bye: false },
                    { sideAname: 'C', sideBname: 'D', sideAwinner: true, sideBwinner: false, scoreA: '2', scoreB: '1', bye: false },
                ],
            });
            expect(rounds[1]).toEqual({
                heading: 'Final',
                hiChecks: { players: [] },
                oneEighties: { players: [] },
                matches: [
                    { sideAname: 'B', sideBname: 'C', sideAwinner: true, sideBwinner: false, scoreA: '2', scoreB: '1', bye: false },
                ],
            });
        });

        it('renders tournament with 3 rounds', async () => {
            const tournamentData = {
                round: {
                    matches: [
                        { sideA: sideA, sideB: sideB, scoreA: 1, scoreB: 2 },
                        { sideA: sideC, sideB: sideD, scoreA: 2, scoreB: 1 },
                    ],
                    nextRound: {
                        matches: [
                            { sideA: sideE, sideB: sideB, scoreA: 2, scoreB: 1 },
                        ],
                        nextRound: {
                            matches: [
                                { sideA: sideC, sideB: sideE, scoreA: 2, scoreB: 1 },
                            ],
                            nextRound: null,
                        },
                    }
                },
                sides: [ sideA, sideB, sideC, sideD, sideE ],
                oneEighties: [],
                over100Checkouts: [],
            };

            await renderComponent({ tournamentData, season, division }, { printOnly: false });

            expect(reportedError).toBeNull();
            const rounds = getRounds();
            expect(rounds.length).toEqual(3);
            expect(rounds[0]).toEqual({
                heading: 'Quarter-Final',
                hiChecks: null,
                oneEighties: null,
                matches: [
                    { sideAname: 'A', sideBname: 'B', sideAwinner: false, sideBwinner: true, scoreA: '1', scoreB: '2', bye: false },
                    { sideAname: 'C', sideBname: 'D', sideAwinner: true, sideBwinner: false, scoreA: '2', scoreB: '1', bye: false },
                    { sideAname: 'E', sideBname: null, sideAwinner: false, sideBwinner: null, scoreA: '', scoreB: null, bye: true },
                ],
            });
            expect(rounds[1]).toEqual({
                heading: 'Semi-Final',
                hiChecks: null,
                oneEighties: null,
                matches: [
                    { sideAname: 'E', sideBname: 'B', sideAwinner: true, sideBwinner: false, scoreA: '2', scoreB: '1', bye: false },
                    { sideAname: 'C', sideBname: null, sideAwinner: false, sideBwinner: null, scoreA: '', scoreB: null, bye: true },
                ],
            });
            expect(rounds[2]).toEqual({
                heading: 'Final',
                hiChecks: { players: [] },
                oneEighties: { players: [] },
                matches: [
                    { sideAname: 'C', sideBname: 'E', sideAwinner: true, sideBwinner: false, scoreA: '2', scoreB: '1', bye: false },
                ],
            });
        });

        it('renders tournament with 4 rounds', async () => {
            const tournamentData = {
                round: {
                    matches: [
                        { sideA: sideA, sideB: sideB, scoreA: 1, scoreB: 2 },
                        { sideA: sideC, sideB: sideD, scoreA: 2, scoreB: 1 },
                        { sideA: sideE, sideB: sideF, scoreA: 2, scoreB: 1 },
                        { sideA: sideG, sideB: sideH, scoreA: 1, scoreB: 2 },
                        { sideA: sideI, sideB: sideJ, scoreA: 1, scoreB: 2 },
                        { sideA: sideK, sideB: sideL, scoreA: 1, scoreB: 2 },
                    ],
                    nextRound: {
                        matches: [
                            { sideA: sideB, sideB: sideC, scoreA: 2, scoreB: 1 },
                            { sideA: sideE, sideB: sideH, scoreA: 2, scoreB: 1 },
                        ],
                        nextRound: {
                            matches: [
                                { sideA: sideB, sideB: sideE, scoreA: 2, scoreB: 1 },
                                { sideA: sideJ, sideB: sideL, scoreA: 2, scoreB: 1 },
                            ],
                            nextRound: {
                                matches: [
                                    { sideA: sideB, sideB: sideJ, scoreA: 2, scoreB: 1 },
                                ]
                            },
                        },
                    }
                },
                sides: [ sideA, sideB, sideC, sideD, sideE, sideF, sideG, sideH, sideI, sideJ, sideK, sideL ],
                oneEighties: [],
                over100Checkouts: [],
            };

            await renderComponent({ tournamentData, season, division }, { printOnly: false });

            expect(reportedError).toBeNull();
            const rounds = getRounds();
            expect(rounds.length).toEqual(4);
            expect(rounds[0]).toEqual({
                heading: 'Round 1',
                hiChecks: null,
                oneEighties: null,
                matches: [
                    { sideAname: 'A', sideBname: 'B', sideAwinner: false, sideBwinner: true, scoreA: '1', scoreB: '2', bye: false },
                    { sideAname: 'C', sideBname: 'D', sideAwinner: true, sideBwinner: false, scoreA: '2', scoreB: '1', bye: false },
                    { sideAname: 'E', sideBname: 'F', sideAwinner: true, sideBwinner: false, scoreA: '2', scoreB: '1', bye: false },
                    { sideAname: 'G', sideBname: 'H', sideAwinner: false, sideBwinner: true, scoreA: '1', scoreB: '2', bye: false },
                    { sideAname: 'I', sideBname: 'J', sideAwinner: false, sideBwinner: true, scoreA: '1', scoreB: '2', bye: false },
                    { sideAname: 'K', sideBname: 'L', sideAwinner: false, sideBwinner: true, scoreA: '1', scoreB: '2', bye: false },
                ],
            });
            expect(rounds[1]).toEqual({
                heading: 'Quarter-Final',
                hiChecks: null,
                oneEighties: null,
                matches: [
                    { sideAname: 'B', sideBname: 'C', sideAwinner: true, sideBwinner: false, scoreA: '2', scoreB: '1', bye: false },
                    { sideAname: 'E', sideBname: 'H', sideAwinner: true, sideBwinner: false, scoreA: '2', scoreB: '1', bye: false },
                    { sideAname: 'J', sideBname: null, sideAwinner: false, sideBwinner: null, scoreA: '', scoreB: null, bye: true },
                    { sideAname: 'L', sideBname: null, sideAwinner: false, sideBwinner: null, scoreA: '', scoreB: null, bye: true },
                ],
            });
            expect(rounds[2]).toEqual({
                heading: 'Semi-Final',
                hiChecks: null,
                oneEighties: null,
                matches: [
                    { sideAname: 'B', sideBname: 'E', sideAwinner: true, sideBwinner: false, scoreA: '2', scoreB: '1', bye: false },
                    { sideAname: 'J', sideBname: 'L', sideAwinner: true, sideBwinner: false, scoreA: '2', scoreB: '1', bye: false },
                ],
            });
            expect(rounds[3]).toEqual({
                heading: 'Final',
                hiChecks: { players: [] },
                oneEighties: { players: [] },
                matches: [
                    { sideAname: 'B', sideBname: 'J', sideAwinner: true, sideBwinner: false, scoreA: '2', scoreB: '1', bye: false },
                ],
            });
        });

        it('renders winner', async () => {
            const player1 = { id: createTemporaryId(), name: 'PLAYER 1' };
            const player2 = { id: createTemporaryId(), name: 'PLAYER 2' };
            const sideASinglePlayer = createSide('A', [ player1 ]);
            const sideBSinglePlayer = createSide('B', [ player2 ]);
            const tournamentData = {
                round: {
                    matches: [
                        { sideA: sideASinglePlayer, sideB: sideBSinglePlayer, scoreA: 1, scoreB: 2 },
                    ],
                },
                sides: [ sideASinglePlayer, sideBSinglePlayer ],
                oneEighties: [],
                over100Checkouts: [],
            };
            const teams = toMap([ {
                name: 'TEAM',
                seasons: [{
                    seasonId: season.id,
                    divisionId: division.id,
                    players: [ player2 ],
                }],
            } ]);
            const divisions = [ division ];

            await renderComponent({ tournamentData, season, division }, { printOnly: false }, teams, divisions);

            expect(reportedError).toBeNull();
            const winner = getWinner();
            expect(winner.name).toEqual('B');
            expect(winner.link).toEqual(`http://localhost/division/${division.name}/player:${encodeURI(sideBSinglePlayer.name)}@TEAM/${season.name}`);
        });

        it('renders winner when cross-divisional', async () => {
            const player1 = { id: createTemporaryId(), name: 'PLAYER 1' };
            const player2 = { id: createTemporaryId(), name: 'PLAYER 2' };
            const sideASinglePlayer = createSide('A', [ player1 ]);
            const sideBSinglePlayer = createSide('B', [ player2 ]);
            const tournamentData = {
                round: {
                    matches: [
                        { sideA: sideASinglePlayer, sideB: sideBSinglePlayer, scoreA: 1, scoreB: 2 },
                    ],
                },
                sides: [ sideASinglePlayer, sideBSinglePlayer ],
                oneEighties: [],
                over100Checkouts: [],
            };
            const teams = toMap([ {
                name: 'TEAM',
                seasons: [{
                    seasonId: season.id,
                    divisionId: division.id,
                    players: [ player2 ],
                }],
            } ]);
            const divisions = [ division ];

            await renderComponent({ tournamentData, season, division: null }, { printOnly: false }, teams, divisions);

            expect(reportedError).toBeNull();
            const winner = getWinner();
            expect(winner.name).toEqual('B');
            expect(winner.link).toEqual(`http://localhost/division/${division.name}/player:${encodeURI(sideBSinglePlayer.name)}@TEAM/${season.name}`);
        });

        it('renders who is playing (singles)', async () => {
            const player1 = { id: createTemporaryId(), name: 'PLAYER 1' };
            const player2 = { id: createTemporaryId(), name: 'PLAYER 2' };
            const tournamentData = {
                round: null,
                sides: [ createSide('A', [ player1 ]), createSide('B', [ player2 ]) ],
                oneEighties: [],
                over100Checkouts: [],
            };
            const teams = toMap([ {
                name: 'TEAM',
                seasons: [{
                    seasonId: season.id,
                    divisionId: division.id,
                    players: [ player1 ],
                }],
            } ]);
            const divisions = [ division ];

            await renderComponent({ tournamentData, season, division }, { printOnly: false }, teams, divisions);

            expect(reportedError).toBeNull();
            expect(getWhoIsPlaying(whoIsPlayingText)).toEqual([ '1 - A', '2 - B' ]);
            expect(getWhoIsPlaying(linkHref)).toEqual([ `http://localhost/division/${division.name}/player:A@TEAM/${season.name}`, null ]);
        });

        it('renders who is playing (teams)', async () => {
            const team = {
                id: createTemporaryId(),
                name: 'TEAM',
                seasons: [{
                    seasonId: season.id,
                    divisionId: division.id,
                    players: [ ],
                }],
            };
            const sideA = createSide('A');
            sideA.teamId = team.id;
            const sideB = createSide('B');
            sideB.teamId = createTemporaryId();
            const tournamentData = {
                round: null,
                sides: [ sideA, sideB ],
                oneEighties: [],
                over100Checkouts: [],
            };
            const teams = toMap([ team ]);
            const divisions = [ division ];

            await renderComponent({ tournamentData, season, division }, { printOnly: false }, teams, divisions);

            expect(reportedError).toBeNull();
            expect(getWhoIsPlaying(whoIsPlayingText)).toEqual([ '1 - A', '2 - B' ]);
            expect(getWhoIsPlaying(linkHref)).toEqual([
                `http://localhost/division/${division.name}/team:TEAM/${season.name}`,
                `http://localhost/division/${division.name}/team:${sideB.teamId}/${season.name}` ]);
        });

        it('renders who is playing when cross-divisional', async () => {
            const tournamentData = {
                round: null,
                sides: [ sideA, sideB ],
                oneEighties: [],
                over100Checkouts: [],
            };
            const teams = toMap([ {
                name: 'TEAM',
                seasons: [{
                    seasonId: createTemporaryId(),
                    divisionId: division.id,
                    players: [ ],
                }],
            } ]);
            const divisions = [ division ];

            await renderComponent({ tournamentData, season, division: null }, { printOnly: false }, teams, divisions);

            expect(reportedError).toBeNull();
            expect(getWhoIsPlaying(whoIsPlayingText)).toEqual([ '1 - A', '2 - B' ]);
            expect(getWhoIsPlaying(linkHref)).toEqual([ null, null ]);
        });

        it('renders who is playing when team not found', async () => {
            const player1 = { id: createTemporaryId(), name: 'PLAYER 1' };
            const player2 = { id: createTemporaryId(), name: 'PLAYER 2' };
            const sideASinglePlayer = createSide('A', [ player1 ]);
            const sideBSinglePlayer = createSide('B', [ player2 ]);
            const tournamentData = {
                round: null,
                sides: [ sideASinglePlayer, sideBSinglePlayer ],
                oneEighties: [],
                over100Checkouts: [],
            };
            const teams = toMap([ {
                name: 'TEAM',
                seasons: [{
                    seasonId: createTemporaryId(),
                    divisionId: division.id,
                    players: [ player1, player2 ],
                }],
            } ]);
            const divisions = [ division ];

            await renderComponent({ tournamentData, season, division: null }, { printOnly: false }, teams, divisions);

            expect(reportedError).toBeNull();
            expect(getWhoIsPlaying(whoIsPlayingText)).toEqual([ '1 - A', '2 - B' ]);
            expect(getWhoIsPlaying(linkHref)).toEqual([ null, null ]);
        });

        it('renders who is playing with no shows', async () => {
            const tournamentData = {
                round: null,
                sides: [ sideA, sideB, Object.assign({}, sideC, { noShow: true }) ],
                oneEighties: [],
                over100Checkouts: [],
            };
            const teams = toMap([]);
            const divisions = [ division ];

            await renderComponent({ tournamentData, season, division }, { printOnly: false }, teams, divisions);

            expect(reportedError).toBeNull();
            expect(getWhoIsPlaying(whoIsPlayingText)).toEqual([ '1 - A', '2 - B', '-3 - C-' ]);
            expect(getWhoIsPlaying(linkHref)).toEqual([ null, null, null ]);
        });

        it('renders heading', async () => {
            const tournamentData = {
                id: createTemporaryId(),
                type: 'TYPE',
                notes: 'NOTES',
                address: 'ADDRESS',
                date: '2023-06-01',
                round: null,
                sides: [ ],
                oneEighties: [],
                over100Checkouts: [],
            };

            await renderComponent({ tournamentData, season, division }, { printOnly: false });

            expect(reportedError).toBeNull();
            const heading = context.container.querySelector('div[datatype="heading"]');
            expect(heading.textContent).toEqual(`TYPE at ADDRESS on ${renderDate('2023-06-01')} - NOTES`);
        });

        it('renders 180s', async () => {
            const player1 = { id: createTemporaryId(), name: 'PLAYER 1' };
            const player2 = { id: createTemporaryId(), name: 'PLAYER 2' };
            const tournamentData = {
                round: null,
                sides: [ createSide('A', [ player1 ]), createSide('B', [ player2 ]) ],
                oneEighties: [ player1, player2, player1, player1 ],
                over100Checkouts: [ ],
            };
            const teams = toMap([ {
                name: 'TEAM',
                seasons: [{
                    seasonId: season.id,
                    divisionId: division.id,
                    players: [ player1 ],
                }],
            } ]);
            const divisions = [ division ];

            await renderComponent({ tournamentData, season, division }, { printOnly: false }, teams, divisions);

            expect(reportedError).toBeNull();
            expect(getAccolades('180s', d => d.textContent)).toEqual([ 'PLAYER 1 x 3', 'PLAYER 2 x 1' ]);
            expect(getAccolades('180s', linkHref))
                .toEqual([ `http://localhost/division/${division.name}/player:${encodeURI(player1.name)}@TEAM/${season.name}`, null ]);
        });

        it('renders 180s when cross-divisional', async () => {
            const player1 = { id: createTemporaryId(), name: 'PLAYER 1' };
            const player2 = { id: createTemporaryId(), name: 'PLAYER 2' };
            const tournamentData = {
                round: null,
                sides: [ createSide('A', [ player1 ]), createSide('B', [ player2 ]) ],
                oneEighties: [ player1, player2, player1, player1 ],
                over100Checkouts: [ ],
            };
            const teams = toMap([ {
                name: 'TEAM',
                seasons: [{
                    seasonId: season.id,
                    divisionId: division.id,
                    players: [ player1 ],
                }],
            } ]);
            const divisions = [ division ];

            await renderComponent({ tournamentData, season, division: null }, { printOnly: false }, teams, divisions);

            expect(reportedError).toBeNull();
            expect(getAccolades('180s', d => d.textContent)).toEqual([ 'PLAYER 1 x 3', 'PLAYER 2 x 1' ]);
            expect(getAccolades('180s', linkHref)).toEqual([ `http://localhost/division/${division.name}/player:${encodeURI(player1.name)}@TEAM/${season.name}`, null ]);
        });

        it('renders hi checks', async () => {
            const player1 = { id: createTemporaryId(), name: 'PLAYER 1', notes: '100' };
            const player2 = { id: createTemporaryId(), name: 'PLAYER 2', notes: '120' };
            const tournamentData = {
                round: null,
                sides: [ createSide('A', [ player1 ]), createSide('B', [ player2 ]) ],
                oneEighties: [],
                over100Checkouts: [ player1, player2 ],
            };
            const teams = toMap([ {
                name: 'TEAM',
                seasons: [{
                    seasonId: season.id,
                    divisionId: division.id,
                    players: [ player1 ],
                }],
            } ]);
            const divisions = [ division ];

            await renderComponent({ tournamentData, season, division }, { printOnly: false }, teams, divisions);

            expect(reportedError).toBeNull();
            expect(getAccolades('hi-checks', d => d.textContent)).toEqual([ 'PLAYER 1 (100)', 'PLAYER 2 (120)' ]);
            expect(getAccolades('hi-checks', linkHref))
                .toEqual([ `http://localhost/division/${division.name}/player:${encodeURI(player1.name)}@TEAM/${season.name}`, null ]);
        });

        it('renders hi checks when cross-divisional', async () => {
            const player1 = { id: createTemporaryId(), name: 'PLAYER 1', notes: '100' };
            const player2 = { id: createTemporaryId(), name: 'PLAYER 2', notes: '120' };
            const tournamentData = {
                round: null,
                sides: [ createSide('A', [ player1 ]), createSide('B', [ player2 ]) ],
                oneEighties: [],
                over100Checkouts: [ player1, player2 ],
            };
            const teams = toMap([ {
                name: 'TEAM',
                seasons: [{
                    seasonId: season.id,
                    divisionId: division.id,
                    players: [ player1 ],
                }],
            } ]);
            const divisions = [ division ];

            await renderComponent({ tournamentData, season, division: null }, { printOnly: false }, teams, divisions);

            expect(reportedError).toBeNull();
            expect(getAccolades('hi-checks', d => d.textContent)).toEqual([ 'PLAYER 1 (100)', 'PLAYER 2 (120)' ]);
            expect(getAccolades('hi-checks', linkHref)).toEqual([ `http://localhost/division/${division.name}/player:${encodeURI(player1.name)}@TEAM/${season.name}`, null ]);
        });
    });

    describe('unplayed tournament', () => {
        const sideA = createSide('A');
        const sideB = createSide('B');
        const sideC = createSide('C');
        const sideD = createSide('D');
        const sideE = createSide('E');
        const sideF = createSide('F');
        const sideG = createSide('G');
        const sideH = createSide('H');
        const division = {
            id: createTemporaryId(),
            name: 'DIVISION',
        };
        const season = {
            id: createTemporaryId(),
            name: 'SEASON',
        };

        it('renders tournament with 2 sides', async () => {
            const tournamentData = {
                round: null,
                sides: [ sideA, sideB ],
                oneEighties: [],
                over100Checkouts: [],
            };

            await renderComponent({ tournamentData, season, division }, { printOnly: false });

            expect(reportedError).toBeNull();
            const rounds = getRounds();
            expect(rounds.length).toEqual(1);
            expect(rounds[0]).toEqual({
                heading: 'Final',
                hiChecks: { players: [] },
                oneEighties: { players: [] },
                matches: [
                    {  sideAname: '', sideBname: '', sideAwinner: false, sideBwinner: false, scoreA: '', scoreB: '', bye: false },
                ],
            });
        });

        it('renders tournament with 3 sides', async () => {
            const tournamentData = {
                round: null,
                sides: [ sideA, sideB, sideC ],
                oneEighties: [],
                over100Checkouts: [],
            };

            await renderComponent({ tournamentData, season, division }, { printOnly: false });

            expect(reportedError).toBeNull();
            const rounds = getRounds();
            expect(rounds.length).toEqual(2);
            expect(rounds[0]).toEqual({
                heading: 'Semi-Final',
                hiChecks: null,
                oneEighties: null,
                matches: [
                    { sideAname: '', sideBname: '', sideAwinner: false, sideBwinner: false, scoreA: '', scoreB: '', bye: false },
                    { sideAname: '', sideBname: null, sideAwinner: false, sideBwinner: null, scoreA: '', scoreB: null, bye: true },
                ],
            });
            expect(rounds[1]).toEqual({
                heading: 'Final',
                hiChecks: { players: [] },
                oneEighties: { players: [] },
                matches: [
                    { sideAname: '', sideBname: '', sideAwinner: false, sideBwinner: false, scoreA: '', scoreB: '', bye: false },
                ],
            });
        });

        it('renders tournament with 4 sides', async () => {
            const tournamentData = {
                round: null,
                sides: [ sideA, sideB, sideC, sideD ],
                oneEighties: [],
                over100Checkouts: [],
            };

            await renderComponent({ tournamentData, season, division }, { printOnly: false });

            expect(reportedError).toBeNull();
            const rounds = getRounds();
            expect(rounds.length).toEqual(2);
            expect(rounds[0]).toEqual({
                heading: 'Semi-Final',
                hiChecks: null,
                oneEighties: null,
                matches: [
                    { sideAname: '',  sideBname: '', sideAwinner: false, sideBwinner: false, scoreA: '', scoreB: '', bye: false },
                    { sideAname: '', sideBname: '', sideAwinner: false, sideBwinner: false, scoreA: '', scoreB: '', bye: false },
                ],
            });
            expect(rounds[1]).toEqual({
                heading: 'Final',
                hiChecks: { players: [] },
                oneEighties: { players: [] },
                matches: [
                    { sideAname: '', sideBname: '', sideAwinner: false, sideBwinner: false, scoreA: '', scoreB: '', bye: false },
                ],
            });
        });

        it('renders tournament with 5 sides', async () => {
            const tournamentData = {
                round: null,
                sides: [ sideA, sideB, sideC, sideD, sideE ],
                oneEighties: [],
                over100Checkouts: [],
            };

            await renderComponent({ tournamentData, season, division }, { printOnly: false });

            expect(reportedError).toBeNull();
            const rounds = getRounds();
            expect(rounds.length).toEqual(3);
            expect(rounds[0]).toEqual({
                heading: 'Quarter-Final',
                hiChecks: null,
                oneEighties: null,
                matches: [
                    { sideAname: '',  sideBname: '', sideAwinner: false, sideBwinner: false, scoreA: '', scoreB: '', bye: false },
                    { sideAname: '', sideBname: '', sideAwinner: false, sideBwinner: false, scoreA: '', scoreB: '', bye: false },
                    { sideAname: '', sideBname: null, sideAwinner: false, sideBwinner: null, scoreA: '', scoreB: null, bye: true },
                ],
            });
            expect(rounds[1]).toEqual({
                heading: 'Semi-Final',
                hiChecks: null,
                oneEighties: null,
                matches: [
                    { sideAname: '', sideBname: '', sideAwinner: false, sideBwinner: false, scoreA: '', scoreB: '', bye: false },
                    { sideAname: '', sideBname: null, sideAwinner: false, sideBwinner: null, scoreA: '', scoreB: null, bye: true },
                ],
            });
            expect(rounds[2]).toEqual({
                heading: 'Final',
                hiChecks: { players: [] },
                oneEighties: { players: [] },
                matches: [
                    { sideAname: '', sideBname: '', sideAwinner: false, sideBwinner: false, scoreA: '', scoreB: '', bye: false },
                ],
            });
        });

        it('renders tournament with 6 sides', async () => {
            const tournamentData = {
                round: null,
                sides: [ sideA, sideB, sideC, sideD, sideE, sideF ],
                oneEighties: [],
                over100Checkouts: [],
            };

            await renderComponent({ tournamentData, season, division }, { printOnly: false });

            expect(reportedError).toBeNull();
            const rounds = getRounds();
            expect(rounds.length).toEqual(3);
            expect(rounds[0]).toEqual({
                heading: 'Quarter-Final',
                hiChecks: null,
                oneEighties: null,
                matches: [
                    { sideAname: '',  sideBname: '', sideAwinner: false, sideBwinner: false, scoreA: '', scoreB: '', bye: false },
                    { sideAname: '', sideBname: '', sideAwinner: false, sideBwinner: false, scoreA: '', scoreB: '', bye: false },
                    { sideAname: '', sideBname: '', sideAwinner: false, sideBwinner: false, scoreA: '', scoreB: '', bye: false },
                ],
            });
            expect(rounds[1]).toEqual({
                heading: 'Semi-Final',
                hiChecks: null,
                oneEighties: null,
                matches: [
                    { sideAname: '', sideBname: '', sideAwinner: false, sideBwinner: false, scoreA: '', scoreB: '', bye: false },
                    { sideAname: '', sideBname: null, sideAwinner: false, sideBwinner: null, scoreA: '', scoreB: null, bye: true },
                ],
            });
            expect(rounds[2]).toEqual({
                heading: 'Final',
                hiChecks: { players: [] },
                oneEighties: { players: [] },
                matches: [
                    { sideAname: '', sideBname: '', sideAwinner: false, sideBwinner: false, scoreA: '', scoreB: '', bye: false },
                ],
            });
        });

        it('renders tournament with 7 sides', async () => {
            const tournamentData = {
                round: null,
                sides: [ sideA, sideB, sideC, sideD, sideE, sideF, sideG ],
                oneEighties: [],
                over100Checkouts: [],
            };

            await renderComponent({ tournamentData, season, division }, { printOnly: false });

            expect(reportedError).toBeNull();
            const rounds = getRounds();
            expect(rounds.length).toEqual(3);
            expect(rounds[0]).toEqual({
                heading: 'Quarter-Final',
                hiChecks: null,
                oneEighties: null,
                matches: [
                    { sideAname: '',  sideBname: '', sideAwinner: false, sideBwinner: false, scoreA: '', scoreB: '', bye: false },
                    { sideAname: '', sideBname: '', sideAwinner: false, sideBwinner: false, scoreA: '', scoreB: '', bye: false },
                    { sideAname: '', sideBname: '', sideAwinner: false, sideBwinner: false, scoreA: '', scoreB: '', bye: false },
                    { sideAname: '', sideBname: null, sideAwinner: false, sideBwinner: null, scoreA: '', scoreB: null, bye: true },
                ],
            });
            expect(rounds[1]).toEqual({
                heading: 'Semi-Final',
                hiChecks: null,
                oneEighties: null,
                matches: [
                    { sideAname: '', sideBname: '', sideAwinner: false, sideBwinner: false, scoreA: '', scoreB: '', bye: false },
                    { sideAname: '', sideBname: '', sideAwinner: false, sideBwinner: false, scoreA: '', scoreB: '', bye: false },
                ],
            });
            expect(rounds[2]).toEqual({
                heading: 'Final',
                hiChecks: { players: [] },
                oneEighties: { players: [] },
                matches: [
                    { sideAname: '', sideBname: '', sideAwinner: false, sideBwinner: false, scoreA: '', scoreB: '', bye: false },
                ],
            });
        });

        it('renders tournament with 8 sides', async () => {
            const tournamentData = {
                round: null,
                sides: [ sideA, sideB, sideC, sideD, sideE, sideF, sideG, sideH ],
                oneEighties: [],
                over100Checkouts: [],
            };

            await renderComponent({ tournamentData, season, division }, { printOnly: false });

            expect(reportedError).toBeNull();
            const rounds = getRounds();
            expect(rounds.length).toEqual(3);
            expect(rounds[0]).toEqual({
                heading: 'Quarter-Final',
                hiChecks: null,
                oneEighties: null,
                matches: [
                    { sideAname: '',  sideBname: '', sideAwinner: false, sideBwinner: false, scoreA: '', scoreB: '', bye: false },
                    { sideAname: '', sideBname: '', sideAwinner: false, sideBwinner: false, scoreA: '', scoreB: '', bye: false },
                    { sideAname: '', sideBname: '', sideAwinner: false, sideBwinner: false, scoreA: '', scoreB: '', bye: false },
                    { sideAname: '', sideBname: '', sideAwinner: false, sideBwinner: false, scoreA: '', scoreB: '', bye: false },
                ],
            });
            expect(rounds[1]).toEqual({
                heading: 'Semi-Final',
                hiChecks: null,
                oneEighties: null,
                matches: [
                    { sideAname: '', sideBname: '', sideAwinner: false, sideBwinner: false, scoreA: '', scoreB: '', bye: false },
                    { sideAname: '', sideBname: '', sideAwinner: false, sideBwinner: false, scoreA: '', scoreB: '', bye: false },
                ],
            });
            expect(rounds[2]).toEqual({
                heading: 'Final',
                hiChecks: { players: [] },
                oneEighties: { players: [] },
                matches: [
                    { sideAname: '', sideBname: '', sideAwinner: false, sideBwinner: false, scoreA: '', scoreB: '', bye: false },
                ],
            });
        });

        it('renders who is playing', async () => {
            const tournamentData = {
                round: null,
                sides: [ sideA, sideB ],
                oneEighties: [],
                over100Checkouts: [],
            };

            await renderComponent({ tournamentData, season, division }, { printOnly: false });

            expect(reportedError).toBeNull();
            expect(getWhoIsPlaying(whoIsPlayingText)).toEqual([ '1 - A', '2 - B' ]);
        });

        it('renders who is playing when cross-divisional', async () => {
            const tournamentData = {
                round: null,
                sides: [ sideA, sideB ],
                oneEighties: [],
                over100Checkouts: [],
            };

            await renderComponent({ tournamentData, season, division: null }, { printOnly: false });

            expect(reportedError).toBeNull();
            expect(getWhoIsPlaying(whoIsPlayingText)).toEqual([ '1 - A', '2 - B' ]);
        });

        it('renders heading', async () => {
            const tournamentData = {
                id: createTemporaryId(),
                type: 'TYPE',
                notes: 'NOTES',
                address: 'ADDRESS',
                date: '2023-06-01',
                round: null,
                sides: [ ],
                oneEighties: [],
                over100Checkouts: [],
            };

            await renderComponent({ tournamentData, season, division }, { printOnly: false });

            expect(reportedError).toBeNull();
            const heading = context.container.querySelector('div[datatype="heading"]');
            expect(heading.textContent).toEqual(`TYPE at ADDRESS on ${renderDate('2023-06-01')} - NOTES`);
        });
    });
});