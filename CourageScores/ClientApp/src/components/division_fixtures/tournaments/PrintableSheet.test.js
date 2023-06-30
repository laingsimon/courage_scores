// noinspection JSUnresolvedFunction

import {cleanUp, renderApp} from "../../../helpers/tests";
import React from "react";
import {TournamentContainer} from "./TournamentContainer";
import {PrintableSheet} from "./PrintableSheet";
import {createTemporaryId} from "../../../helpers/projection";
import {renderDate} from "../../../helpers/rendering";

describe('PrintableSheet', () => {
    let context;
    let reportedError;

    afterEach(() => {
        cleanUp(context);
    });

    async function renderComponent(containerProps, props) {
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
            },
            (<TournamentContainer {...containerProps}>
                <PrintableSheet {...props} />
            </TournamentContainer>));
    }

    function createSide(name) {
        return {
            id: createTemporaryId(),
            name: name,
            players: []
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

    function getWhoIsPlaying() {
        return Array.from(context.container.querySelectorAll('div[datatype="playing"] li'))
            .map(li => {
                return li.className.indexOf('text-decoration-line-through') !== -1
                    ? '-' + li.textContent + '-'
                    : li.textContent;
            });
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

            await renderComponent({  tournamentData }, { printOnly: false });

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

            await renderComponent({  tournamentData }, { printOnly: false });

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
                            { sideA: sideB, sideB: sideC, scoreA: 2, scoreB: 1 },
                            { sideA: sideE, sideB: sideF, scoreA: 2, scoreB: 1 },
                        ],
                        nextRound: {
                            matches: [
                                { sideA: sideC, sideB: sideE, scoreA: 2, scoreB: 1 },
                            ],
                            nextRound: null,
                        },
                    }
                },
                sides: [ sideA, sideB, sideC, sideD ],
                oneEighties: [],
                over100Checkouts: [],
            };

            await renderComponent({  tournamentData }, { printOnly: false });

            const rounds = getRounds();
            expect(rounds.length).toEqual(3);
            expect(rounds[0]).toEqual({
                heading: 'Quarter-Final',
                hiChecks: null,
                oneEighties: null,
                matches: [
                    { sideAname: 'A', sideBname: 'B', sideAwinner: false, sideBwinner: true, scoreA: '1', scoreB: '2', bye: false },
                    { sideAname: 'C', sideBname: 'D', sideAwinner: true, sideBwinner: false, scoreA: '2', scoreB: '1', bye: false },
                ],
            });
            expect(rounds[1]).toEqual({
                heading: 'Semi-Final',
                hiChecks: null,
                oneEighties: null,
                matches: [
                    { sideAname: 'B', sideBname: 'C', sideAwinner: true, sideBwinner: false, scoreA: '2', scoreB: '1', bye: false },
                    { sideAname: 'E', sideBname: 'F', sideAwinner: true, sideBwinner: false, scoreA: '2', scoreB: '1', bye: false },
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

            await renderComponent({  tournamentData }, { printOnly: false });

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

        it('renders who is playing', async () => {
            const tournamentData = {
                round: null,
                sides: [ sideA, sideB ],
                oneEighties: [],
                over100Checkouts: [],
            };

            await renderComponent({  tournamentData }, { printOnly: false });

            expect(getWhoIsPlaying()).toEqual([ '1 - A', '2 - B' ]);
        });

        it('renders who is playing with no shows', async () => {
            const tournamentData = {
                round: null,
                sides: [ sideA, sideB, Object.assign({}, sideC, { noShow: true }) ],
                oneEighties: [],
                over100Checkouts: [],
            };

            await renderComponent({  tournamentData }, { printOnly: false });

            expect(getWhoIsPlaying()).toEqual([ '1 - A', '2 - B', '-3 - C-' ]);
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

            await renderComponent({  tournamentData }, { printOnly: false });

            const heading = context.container.querySelector('div[datatype="heading"]');
            expect(heading.textContent).toEqual(`TYPE at ADDRESS on ${renderDate('2023-06-01')} - NOTES`);
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

        it('renders tournament with 2 sides', async () => {
            const tournamentData = {
                round: null,
                sides: [ sideA, sideB ],
                oneEighties: [],
                over100Checkouts: [],
            };

            await renderComponent({  tournamentData }, { printOnly: false });

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

            await renderComponent({  tournamentData }, { printOnly: false });

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

            await renderComponent({  tournamentData }, { printOnly: false });

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

            await renderComponent({  tournamentData }, { printOnly: false });

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

            await renderComponent({  tournamentData }, { printOnly: false });

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

            await renderComponent({  tournamentData }, { printOnly: false });

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

            await renderComponent({  tournamentData }, { printOnly: false });

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

            await renderComponent({  tournamentData }, { printOnly: false });

            expect(getWhoIsPlaying()).toEqual([ '1 - A', '2 - B' ]);
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

            await renderComponent({  tournamentData }, { printOnly: false });

            const heading = context.container.querySelector('div[datatype="heading"]');
            expect(heading.textContent).toEqual(`TYPE at ADDRESS on ${renderDate('2023-06-01')} - NOTES`);
        });
    });
});