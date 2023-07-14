// noinspection JSUnresolvedFunction

import {cleanUp, renderApp} from "../../../../helpers/tests";
import React from "react";
import {MatchReport} from "./MatchReport";
import {createTemporaryId} from "../../../../helpers/projection";

describe('MatchReport', () => {
    let context;
    let reportedError;

    afterEach(() => {
        cleanUp(context);
    });

    async function renderComponent(props) {
        reportedError = null;
        context = await renderApp(
            {},
            null,
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
            (<MatchReport {...props} />));
    }

    function getRowContent(row, tagName) {
        return Array.from(row.querySelectorAll(tagName)).map(th => th.textContent);
    }

    function createLeg(homeWinner, awayWinner) {
        const winningThrows = [
            { score: 90, bust: false, noOfDarts: 3 },
            { score: 100, bust: false, noOfDarts: 3 },
            { score: 110, bust: false, noOfDarts: 3 },
            { score: 120, bust: false, noOfDarts: 3 },
            { score: 81, bust: false, noOfDarts: 3 },
        ];
        const notWinningThrows = [
            { score: 90, bust: false, noOfDarts: 3 },
            { score: 90, bust: false, noOfDarts: 3 },
            { score: 90, bust: false, noOfDarts: 3 },
            { score: 90, bust: false, noOfDarts: 3 },
            { score: 90, bust: false, noOfDarts: 3 },
        ];

        return {
            home: {
                throws: homeWinner ? winningThrows : notWinningThrows
            },
            away: {
                throws: awayWinner ? winningThrows : notWinningThrows
            },
            startingScore: 501,
        };
    }

    describe('renders', () => {
        it('correct headings', async () => {
            await renderComponent({
                division: {
                    id: createTemporaryId(),
                    name: 'DIVISION',
                },
                showWinner: false,
                noOfThrows: 3,
                noOfLegs: 3,
                gender: 'GENDER',
                host: 'HOST',
                opponent: 'OPPONENT',
                saygMatches: []
            });

            expect(reportedError).toBeNull();
            expect(context.container.querySelector('h2').textContent).toEqual('SOMERSET DARTS ORGANISATION');
            expect(context.container.querySelector('h3').textContent).toEqual('DIVISION (GENDER)');
        });

        it('correct heading rows', async () => {
            await renderComponent({
                division: {
                    id: createTemporaryId(),
                    name: 'DIVISION',
                },
                showWinner: false,
                noOfThrows: 3,
                noOfLegs: 3,
                gender: 'GENDER',
                host: 'HOST',
                opponent: 'OPPONENT',
                saygMatches: []
            });

            expect(reportedError).toBeNull();
            const rows = Array.from(context.container.querySelectorAll('thead tr'));
            expect(rows.length).toEqual(3);
            expect(getRowContent(rows[0], 'th')).toEqual([ 'HOSTvOPPONENT']);
            expect(rows[0].querySelector('th').colSpan).toEqual(23);
            expect(getRowContent(rows[1], 'th')).toEqual([ '', 'Scores', '', '', 'Scores', '' ]);
            expect(rows[1].querySelectorAll('th')[1].colSpan).toEqual(4);
            expect(rows[1].querySelectorAll('th')[4].colSpan).toEqual(4);
            expect(getRowContent(rows[2], 'th')).toEqual([
                'Set',
                'Ave', 'Players Name', 'Leg', '1', '2', '3', '4', 'AD', 'GS', 'SL', 'Tons',
                'Ave', 'Players Name', '1', '2', '3', '4', 'AD', 'GS', 'SL', 'Tons'
            ]);
        });

        it('sayg matches', async () => {
            const saygMatch = {
                match: {
                    sideA: { name: 'A' },
                    sideB: { name: 'B' },
                },
                saygData: {
                    legs: {
                        '0': createLeg(true, false),
                        '1': createLeg(true, false),
                    }
                }
            }

            await renderComponent({
                division: {
                    id: createTemporaryId(),
                    name: 'DIVISION',
                },
                showWinner: false,
                noOfThrows: 3,
                noOfLegs: 3,
                gender: 'GENDER',
                host: 'HOST',
                opponent: 'OPPONENT',
                saygMatches: [ saygMatch ],
            });

            expect(reportedError).toBeNull();
            const rows = Array.from(context.container.querySelectorAll('tbody tr'));
            expect(rows.length).toEqual(3);
            expect(getRowContent(rows[0], 'td')).toEqual([
                'M1', '33.4', 'A', '1', '90', '100', '110', '120', '15', '81', '', '3', '30',
                'B', '90', '90', '90', '90', '15', '', '51', '0'
            ]);
        });

        it('legs won', async () => {
            const saygMatch = {
                match: {
                    sideA: { name: 'A' },
                    sideB: { name: 'B' },
                },
                saygData: {
                    legs: {
                        '0': createLeg(true, false),
                        '1': createLeg(true, false),
                    }
                }
            }

            await renderComponent({
                division: {
                    id: createTemporaryId(),
                    name: 'DIVISION',
                },
                showWinner: false,
                noOfThrows: 3,
                noOfLegs: 3,
                gender: 'GENDER',
                host: 'HOST',
                opponent: 'OPPONENT',
                saygMatches: [ saygMatch ],
            });

            expect(reportedError).toBeNull();
            const legsWonContainer = context.container.querySelector('table.table + div');
            expect(legsWonContainer).toBeTruthy();
            const legsWon = Array.from(legsWonContainer.querySelectorAll('div'));
            expect(legsWon[0].textContent).toEqual('Legs won: 2');
            expect(legsWon[1].textContent).toEqual('Legs won: 0');
        });
    });
});