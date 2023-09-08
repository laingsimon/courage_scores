// noinspection JSUnresolvedFunction

import {cleanUp, doChange, doClick, findButton, renderApp} from "../../../helpers/tests";
import React from "react";
import {PlayerInput} from "./PlayerInput";
import {legBuilder} from "../../../helpers/builders";

describe('PlayerInput', () => {
    let context;
    let oneEighties;
    let hiChecks;
    let changedLegs;
    let completedLegs;
    let reportedError;
    const home = 'home-player';
    const away = 'away-player';

    afterEach(() => {
        cleanUp(context);
    });

    function on180(accumulatorName) {
        oneEighties.push(accumulatorName);
    }

    async function onHiCheck(accumulatorName, score) {
        hiChecks.push({accumulatorName, score});
    }

    async function onChange(leg) {
        changedLegs.push(leg);
    }

    async function onLegComplete(accumulatorName) {
        completedLegs.push(accumulatorName);
    }

    async function renderComponent(props) {
        oneEighties = [];
        hiChecks = [];
        changedLegs = [];
        completedLegs = [];
        reportedError = null;
        context = await renderApp(
            {},
            {name: 'Courage Scores'},
            {
                onError: (err) => {
                    reportedError = {
                        message: err.message,
                        stack: err.stack
                    };
                },
            },
            <PlayerInput
                {...props}
                on180={on180}
                onHiCheck={onHiCheck}
                onChange={onChange}
                onLegComplete={onLegComplete}/>);
    }

    async function setScoreInput(score) {
        await doChange(context.container, 'input[data-score-input="true"]', score, context.user);
    }

    async function runScoreTest(homeScore, inputScore) {
        const leg = legBuilder()
            .currentThrow('home')
            .startingScore(501)
            .home(c => c.score(homeScore).noOfDarts(0))
            .build();
        await renderComponent({
            home: home,
            homeScore: homeScore,
            leg: leg,
            singlePlayer: true
        });

        await setScoreInput(inputScore);

        const buttons = context.container.querySelectorAll('div button');
        return Array.from(buttons).map(button => button.textContent);
    }

    it('Renders initial heading correctly - multi-player', async () => {
        const leg = legBuilder()
            .currentThrow('home')
            .startingScore(501)
            .home(c => c.score(0).noOfDarts(0))
            .away(c => c.score(0).noOfDarts(0))
            .build();
        await renderComponent({
            home: home,
            away: away,
            homeScore: 0,
            awayScore: 0,
            leg: leg,
            singlePlayer: false
        });

        const heading = context.container.querySelector('div h2');
        expect(heading).toBeTruthy();
        expect(heading.textContent).toEqual('home-player  requires 501');
        const score = context.container.querySelector('div h5');
        expect(score).toBeTruthy();
        expect(score.textContent).toEqual('0 - 0');
    });

    it('Renders initial heading correctly - single-player', async () => {
        const leg = legBuilder()
            .currentThrow('home')
            .startingScore(501)
            .home(c => c.score(0).noOfDarts(0))
            .build();
        await renderComponent({
            home: home,
            homeScore: 0,
            leg: leg,
            singlePlayer: true
        });

        const heading = context.container.querySelector('div h2');
        expect(heading).toBeTruthy();
        expect(heading.textContent).toEqual('home-player  requires 501');
        const score = context.container.querySelector('div h5');
        expect(score).toBeTruthy();
        expect(score.textContent).toEqual('Leg 1');
    });

    it('Renders correct options for initial score', async () => {
        const buttons = await runScoreTest(0, '100');

        expect(buttons).toEqual(['📌📌📌']);
    });

    it('Renders correct options for mid-range score', async () => {
        const buttons = await runScoreTest(100, '100');

        expect(buttons).toEqual(['📌📌📌']);
    });

    it('Renders correct options for checkout score', async () => {
        const buttons = await runScoreTest(401, '100');

        expect(buttons).toEqual(['📌📌', '📌📌📌', '💥💥', '💥💥💥']);
    });

    it('Renders correct options for bust score', async () => {
        const buttons = await runScoreTest(451, '60');

        expect(buttons).toEqual(['💥', '💥💥', '💥💥💥']);
    });

    it('Renders correct options for double-1 score', async () => {
        const buttons = await runScoreTest(499, '2');

        expect(buttons).toEqual(['📌', '📌📌', '📌📌📌', '💥', '💥💥', '💥💥💥']);
    });

    it('Renders correct options for double-1 bust score', async () => {
        const buttons = await runScoreTest(499, '5');

        expect(buttons).toEqual(['💥', '💥💥', '💥💥💥']);
    });

    it('Renders correct options for double-1 score', async () => {
        const buttons = await runScoreTest(480, '21');

        expect(buttons).toEqual(['📌📌', '📌📌📌', '💥', '💥💥', '💥💥💥']);
    });

    it('Renders no options for negative score', async () => {
        const buttons = await runScoreTest(480, '-1');

        expect(buttons).toEqual([]);
    });

    it('Renders no options for score over 180', async () => {
        const buttons = await runScoreTest(0, '181');

        expect(buttons).toEqual([]);
    });

    it('Renders no options for empty score', async () => {
        const buttons = await runScoreTest(0, '');

        expect(buttons).toEqual([]);
    });

    it('Renders no options for invalid score', async () => {
        const buttons = await runScoreTest(0, '*');

        expect(buttons).toEqual([]);
    });

    it('Renders correct options for 0 score', async () => {
        const buttons = await runScoreTest(499, '0');

        expect(buttons).toEqual(['📌📌📌']);
    });

    it('Renders correct options for 1 bust score', async () => {
        const buttons = await runScoreTest(499, '1');

        expect(buttons).toEqual(['💥', '💥💥', '💥💥💥']);
    });

    it('records 3 dart throw', async () => {
        const leg = legBuilder()
            .currentThrow('home')
            .startingScore(501)
            .home(c => c.score(100).noOfDarts(0))
            .build();
        await renderComponent({
            home: home,
            homeScore: 0,
            leg: leg,
            singlePlayer: true
        });

        await setScoreInput(50);
        await doClick(findButton(context.container, '📌📌📌'));

        expect(reportedError).toBeNull();
        expect(changedLegs).toEqual([{
            currentThrow: 'home',
            startingScore: 501,
            home: {
                score: 150,
                noOfDarts: 3,
                bust: false,
                throws: [{
                    bust: false,
                    noOfDarts: 3,
                    score: 50,
                }],
            },
            isLastLeg: false,
            away: null,
        }]);
    });

    it('records 2 dart throw', async () => {
        const leg = legBuilder()
            .currentThrow('home')
            .startingScore(501)
            .home(c => c.score(401).noOfDarts(0))
            .build();
        await renderComponent({
            home: home,
            homeScore: 0,
            leg: leg,
            singlePlayer: true
        });

        await setScoreInput(100);
        await doClick(findButton(context.container, '📌📌'));

        expect(reportedError).toBeNull();
        expect(changedLegs).toEqual([{
            currentThrow: 'home',
            startingScore: 501,
            winner: 'home',
            home: {
                score: 501,
                noOfDarts: 2,
                bust: false,
                throws: [{
                    bust: false,
                    noOfDarts: 2,
                    score: 100,
                }],
            },
            isLastLeg: false,
            away: null,
        }]);
    });

    it('records 1 dart throw', async () => {
        const leg = legBuilder()
            .currentThrow('home')
            .startingScore(501)
            .home(c => c.score(451).noOfDarts(0))
            .build();
        await renderComponent({
            home: home,
            homeScore: 0,
            leg: leg,
            singlePlayer: true
        });

        await setScoreInput(50);
        await doClick(findButton(context.container, '📌'));

        expect(reportedError).toBeNull();
        expect(changedLegs).toEqual([{
            currentThrow: 'home',
            startingScore: 501,
            winner: 'home',
            home: {
                score: 501,
                noOfDarts: 1,
                bust: false,
                throws: [{
                    bust: false,
                    noOfDarts: 1,
                    score: 50,
                }],
            },
            isLastLeg: false,
            away: null,
        }]);
    });

    it('records 3 dart bust', async () => {
        const leg = legBuilder()
            .currentThrow('home')
            .startingScore(501)
            .home(c => c.score(331).noOfDarts(0))
            .build();
        await renderComponent({
            home: home,
            homeScore: 0,
            leg: leg,
            singlePlayer: true
        });

        await setScoreInput(180);
        await doClick(findButton(context.container, '💥💥💥'));

        expect(reportedError).toBeNull();
        expect(changedLegs).toEqual([{
            currentThrow: 'home',
            startingScore: 501,
            home: {
                score: 331,
                noOfDarts: 3,
                bust: true,
                throws: [{
                    bust: true,
                    noOfDarts: 3,
                    score: 180,
                }],
            },
            isLastLeg: false,
            away: null,
        }]);
    });

    it('records 2 dart bust', async () => {
        const leg = legBuilder()
            .currentThrow('home')
            .startingScore(501)
            .home(c => c.score(391).noOfDarts(0))
            .build();
        await renderComponent({
            home: home,
            homeScore: 0,
            leg: leg,
            singlePlayer: true
        });

        await setScoreInput(120);
        await doClick(findButton(context.container, '💥💥'));

        expect(reportedError).toBeNull();
        expect(changedLegs).toEqual([{
            currentThrow: 'home',
            startingScore: 501,
            home: {
                score: 391,
                noOfDarts: 2,
                bust: true,
                throws: [{
                    bust: true,
                    noOfDarts: 2,
                    score: 120,
                }],
            },
            isLastLeg: false,
            away: null,
        }]);
    });

    it('records 1 dart bust', async () => {
        const leg = legBuilder()
            .currentThrow('home')
            .startingScore(501)
            .home(c => c.score(461).noOfDarts(0))
            .build();
        await renderComponent({
            home: home,
            homeScore: 0,
            leg: leg,
            singlePlayer: true
        });

        await setScoreInput(60);
        await doClick(findButton(context.container, '💥'));

        expect(reportedError).toBeNull();
        expect(changedLegs).toEqual([{
            currentThrow: 'home',
            startingScore: 501,
            home: {
                score: 461,
                noOfDarts: 1,
                bust: true,
                throws: [{
                    bust: true,
                    noOfDarts: 1,
                    score: 60,
                }],
            },
            isLastLeg: false,
            away: null,
        }]);
    });

    it('prevents empty score via enter key press', async () => {
        const leg = legBuilder()
            .currentThrow('home')
            .startingScore(501)
            .home(c => c.score(461).noOfDarts(0))
            .build();
        await renderComponent({
            home: home,
            homeScore: 0,
            leg: leg,
            singlePlayer: true
        });

        await setScoreInput('');
        await context.user.type(context.container.querySelector('input[data-score-input="true"]'), '{Enter}');

        expect(reportedError).toBeNull();
        expect(changedLegs).toEqual([]);
    });

    it('prevents invalid score via enter key press', async () => {
        const leg = legBuilder()
            .currentThrow('home')
            .startingScore(501)
            .home(c => c.score(461).noOfDarts(0))
            .build();
        await renderComponent({
            home: home,
            homeScore: 0,
            leg: leg,
            singlePlayer: true
        });

        await setScoreInput('.');
        await context.user.type(context.container.querySelector('input[data-score-input="true"]'), '{Enter}');

        expect(reportedError).toBeNull();
        expect(changedLegs).toEqual([]);
    });

    it('accepts valid score via enter key press', async () => {
        const leg = legBuilder()
            .currentThrow('home')
            .startingScore(501)
            .home(c => c.score(461).noOfDarts(0))
            .build();
        await renderComponent({
            home: home,
            homeScore: 0,
            leg: leg,
            singlePlayer: true
        });

        await setScoreInput('50');
        await context.user.type(context.container.querySelector('input[data-score-input="true"]'), '{Enter}');

        expect(reportedError).toBeNull();
        expect(changedLegs.length).toEqual(1);
    });
});