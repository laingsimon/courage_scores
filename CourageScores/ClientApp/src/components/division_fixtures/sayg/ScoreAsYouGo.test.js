// noinspection JSUnresolvedFunction

import {cleanUp, renderApp, doClick, findButton, doChange} from "../../../tests/helpers";
import React from "react";
import {ScoreAsYouGo} from "./ScoreAsYouGo";

describe('ScoreAsYouGo', () => {
    let context;
    let oneEighties;
    let hiChecks;
    let changedLegs;
    let completedLegs;
    let reportedError;

    afterEach(() => {
        cleanUp(context);
    });

    function on180(accumulatorName) {
        oneEighties.push(accumulatorName);
    }

    async function onHiCheck(accumulatorName, score) {
        hiChecks.push({ accumulatorName, score });
    }

    async function onChange(leg) {
        changedLegs.push(leg);
    }

    async function onLegComplete(homeScore, awayScore) {
        completedLegs.push({ homeScore, awayScore });
    }

    async function renderComponent(props) {
        oneEighties = [];
        hiChecks = [];
        changedLegs = [];
        completedLegs = [];
        reportedError = null;
        context = await renderApp(
            { },
            {
                onError: (err) => {
                    reportedError = {
                        message: err.message,
                        stack: err.stack
                    };
                },
            },
            <ScoreAsYouGo
                {...props}
                onChange={onChange}
                onLegComplete={onLegComplete}
                on180={on180}
                onHiCheck={onHiCheck} />);
    }

    it('renders match statistics for single player games', async () => {
        await renderComponent({
            data: { legs: {} },
            home: 'HOME',
            away: 'AWAY',
            startingScore: 501,
            numberOfLegs: 3,
            awayScore: 0,
            homeScore: 3,
            singlePlayer: true,
        });

        expect(context.container.textContent).toContain('Match statistics');
    });

    it('renders match statistics for 2 player games when all legs played', async () => {
        await renderComponent({
            data: { legs: {} },
            home: 'HOME',
            away: 'AWAY',
            startingScore: 501,
            numberOfLegs: 5,
            awayScore: 2,
            homeScore: 3,
            singlePlayer: false,
        });

        expect(context.container.textContent).toContain('Match statistics');
    });

    it('renders match statistics for 2 player games when home player unbeatable', async () => {
        await renderComponent({
            data: { legs: {} },
            home: 'HOME',
            away: 'AWAY',
            startingScore: 501,
            numberOfLegs: 5,
            awayScore: 0,
            homeScore: 3,
            singlePlayer: false,
        });

        expect(context.container.textContent).toContain('Match statistics');
    });

    it('renders match statistics for 2 player games when away player unbeatable', async () => {
        await renderComponent({
            data: { legs: {} },
            home: 'HOME',
            away: 'AWAY',
            startingScore: 501,
            numberOfLegs: 5,
            awayScore: 3,
            homeScore: 0,
            singlePlayer: false,
        });

        expect(context.container.textContent).toContain('Match statistics');
    });

    it('renders play leg otherwise', async () => {
        await renderComponent({
            data: { legs: { } },
            home: 'HOME',
            away: 'AWAY',
            startingScore: 501,
            numberOfLegs: 5,
            awayScore: 0,
            homeScore: 0,
            singlePlayer: false,
        });

        expect(context.container.textContent).toContain('Who plays first?');
    });

    it('can update leg', async () => {
        const leg = {};
        await renderComponent({
            data: { legs: { '0': leg } },
            home: 'HOME',
            away: 'AWAY',
            startingScore: 501,
            numberOfLegs: 1,
            awayScore: 0,
            homeScore: 0,
            singlePlayer: false,
        });
        const homePlaysFirst = findButton(context.container, '🎯HOME');

        await doClick(homePlaysFirst);

        expect(changedLegs).toEqual([{ legs: { '0':
            {
                currentThrow: 'home',
                playerSequence: [
                    { text: 'HOME', value: 'home' },
                    { text: 'AWAY', value: 'away' }
                ]
            } } } ]);
    });

    it('can record home winner for 2 player match', async () => {
        const leg = {
            currentThrow: 'home',
            playerSequence: [
                { text: 'HOME', value: 'home' },
                { text: 'AWAY', value: 'away' }
            ],
            home: {
                noOfDarts: 3,
                throws: [ { noOfDarts: 3, score: 400 } ],
                score: 400,
            },
            away: {
                noOfDarts: 3,
                throws: [ { noOfDarts: 3, score: 50 } ],
                score: 100,
            },
            startingScore: 501,
            isLastLeg: true,
        };
        await renderComponent({
            data: { legs: { '0': leg } },
            home: 'HOME',
            away: 'AWAY',
            startingScore: 501,
            numberOfLegs: 1,
            awayScore: 0,
            homeScore: 0,
            singlePlayer: false,
        });

        doChange(context.container, 'input[data-score-input="true"]', '101');
        const threeDartCheckout = findButton(context.container, '📌📌📌');
        await doClick(threeDartCheckout);

        expect(completedLegs).toEqual([{ homeScore: 1, awayScore: 0 }]);
        expect(changedLegs).toEqual([{
            legs: { '0': {
                    currentThrow: 'away',
                    playerSequence: [
                        { text: 'HOME', value: 'home' },
                        { text: 'AWAY', value: 'away' }
                    ],
                    home: {
                        bust: false,
                        noOfDarts: 6,
                        throws: [
                            { noOfDarts: 3, score: 400 },
                            { noOfDarts: 3, score: 101, bust: false }
                        ],
                        score: 501,
                    },
                    away: {
                        noOfDarts: 3,
                        throws: [ { noOfDarts: 3, score: 50 } ],
                        score: 100,
                    },
                    startingScore: 501,
                    winner: 'home',
                    isLastLeg: true,
                }
            }
        }]);
    });

    it('can record home winner for 2 player match, not last leg', async () => {
        const leg = {
            currentThrow: 'home',
            playerSequence: [
                { text: 'HOME', value: 'home' },
                { text: 'AWAY', value: 'away' }
            ],
            home: {
                noOfDarts: 3,
                throws: [ { noOfDarts: 3, score: 400 } ],
                score: 400,
            },
            away: {
                noOfDarts: 3,
                throws: [ { noOfDarts: 3, score: 50 } ],
                score: 100,
            },
            startingScore: 501,
            isLastLeg: false,
        };
        await renderComponent({
            data: { legs: { '0': leg } },
            home: 'HOME',
            away: 'AWAY',
            startingScore: 501,
            numberOfLegs: 3,
            awayScore: 0,
            homeScore: 0,
            singlePlayer: false,
        });

        doChange(context.container, 'input[data-score-input="true"]', '101');
        const threeDartCheckout = findButton(context.container, '📌📌📌');
        await doClick(threeDartCheckout);

        expect(completedLegs).toEqual([{ homeScore: 1, awayScore: 0 }]);
        expect(changedLegs[1]).toEqual({
            legs: { '0': {
                    currentThrow: 'away',
                    playerSequence: [
                        { text: 'HOME', value: 'home' },
                        { text: 'AWAY', value: 'away' },
                    ],
                    home: {
                        bust: false,
                        noOfDarts: 6,
                        throws: [
                            { noOfDarts: 3, score: 400 },
                            { noOfDarts: 3, score: 101, bust: false }
                        ],
                        score: 501,
                    },
                    away: {
                        noOfDarts: 3,
                        throws: [ { noOfDarts: 3, score: 50 } ],
                        score: 100,
                    },
                    startingScore: 501,
                    winner: 'home',
                    isLastLeg: false,
                },
                '1': {
                    currentThrow: 'away',
                    playerSequence: [
                        { text: 'AWAY', value: 'away' },
                        { text: 'HOME', value: 'home' },
                    ],
                    home: {
                        noOfDarts: 0,
                        throws: [ ],
                        score: 0,
                    },
                    away: {
                        noOfDarts: 0,
                        throws: [ ],
                        score: 0,
                    },
                    startingScore: 501,
                    isLastLeg: false,
                }
            }
        });
    });

    it('can record winner for single player match', async () => {
        const leg = {
            currentThrow: 'home',
            playerSequence: [
                { text: 'HOME', value: 'home' },
                { text: 'AWAY', value: 'away' }
            ],
            home: {
                noOfDarts: 3,
                throws: [ { noOfDarts: 3, score: 400 } ],
                score: 400,
            },
            away: { throws: [] },
            startingScore: 501,
            isLastLeg: true,
        };
        await renderComponent({
            data: { legs: { '0': leg } },
            home: 'HOME',
            startingScore: 501,
            numberOfLegs: 1,
            awayScore: 0,
            homeScore: 0,
            singlePlayer: true,
        });

        doChange(context.container, 'input[data-score-input="true"]', '101');
        const threeDartCheckout = findButton(context.container, '📌📌📌');
        await doClick(threeDartCheckout);

        expect(completedLegs).toEqual([{ homeScore: 1, awayScore: 0 }]);
        expect(changedLegs).toEqual([{
            legs: { '0': {
                    currentThrow: 'home',
                    playerSequence: [
                        { text: 'HOME', value: 'home' },
                        { text: 'AWAY', value: 'away' }
                    ],
                    home: {
                        bust: false,
                        noOfDarts: 6,
                        throws: [
                            { noOfDarts: 3, score: 400 },
                            { noOfDarts: 3, score: 101, bust: false }
                        ],
                        score: 501,
                    },
                    away: { throws: [] },
                    startingScore: 501,
                    winner: 'home',
                    isLastLeg: true,
                }
            }
        }]);
    });
});