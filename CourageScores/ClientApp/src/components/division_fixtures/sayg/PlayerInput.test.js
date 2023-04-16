// noinspection JSUnresolvedFunction

import {cleanUp, renderApp, doChange} from "../../../tests/helpers";
import React from "react";
import {PlayerInput} from "./PlayerInput";

describe('PlayerInput', () => {
    let context;
    let oneEighties;
    let hiChecks;
    let changedLegs;
    let completedLegs;
    const home = 'home-player';
    const away = 'away-player';

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

    async function onLegComplete(accumulatorName) {
        completedLegs.push(accumulatorName);
    }

    async function renderComponent(props) {
        oneEighties = [];
        hiChecks = [];
        changedLegs = [];
        completedLegs = [];
        context = await renderApp(
            { },
            { },
            <PlayerInput
                {...props}
                on180={on180}
                onHiCheck={onHiCheck}
                onChange={onChange}
                onLegComplete={onLegComplete}/>);
    }

    function setScoreInput(score) {
        doChange(context.container, 'input[data-score-input="true"]', score);
    }

    async function runScoreTest(homeScore, inputScore) {
        const leg = {
            currentThrow: 'home',
            startingScore: 501,
            winner: null,
            home: {
                score: homeScore,
                noOfDarts: 0
            },
        }
        await renderComponent({
            home: home,
            homeScore: homeScore,
            leg: leg,
            singlePlayer: true
        });

        setScoreInput(inputScore);

        const buttons = context.container.querySelectorAll('div button');
        return Array.from(buttons).map(button => button.textContent);
    }

    it('Renders initial heading correctly - multi-player', async () => {
        const leg = {
            currentThrow: 'home',
            startingScore: 501,
            winner: null,
            home: {
                score: 0,
                noOfDarts: 0
            },
            away: {
                score: 0,
                noOfDarts: 0
            },
        }
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
        expect(heading.textContent).toBe('home-player  requires 501');
        const score = context.container.querySelector('div h5');
        expect(score).toBeTruthy();
        expect(score.textContent).toBe('0 - 0');
    });

    it('Renders initial heading correctly - single-player', async () => {
        const leg = {
            currentThrow: 'home',
            startingScore: 501,
            winner: null,
            home: {
                score: 0,
                noOfDarts: 0
            }
        }
        await renderComponent({
            home: home,
            homeScore: 0,
            leg: leg,
            singlePlayer: true
        });

        const heading = context.container.querySelector('div h2');
        expect(heading).toBeTruthy();
        expect(heading.textContent).toBe('home-player  requires 501');
        const score = context.container.querySelector('div h5');
        expect(score).toBeTruthy();
        expect(score.textContent).toBe('Leg 1');
    });

    it('Renders correct options for initial score', async () => {
        const buttons = await runScoreTest(0, '100');

        expect(buttons).toEqual([ '📌📌📌' ]);
    });

    it('Renders correct options for mid-range score', async () => {
        const buttons = await runScoreTest(100, '100');

        expect(buttons).toEqual([ '📌📌📌' ]);
    });

    it('Renders correct options for checkout score', async () => {
        const buttons = await runScoreTest(401, '100');

        expect(buttons).toEqual([ '📌📌', '📌📌📌', '💥💥', '💥💥💥' ]);
    });

    it('Renders correct options for bust score', async () => {
        const buttons = await runScoreTest(451, '60');

        expect(buttons).toEqual([ '💥', '💥💥', '💥💥💥' ]);
    });

    it('Renders correct options for double-1 score', async () => {
        const buttons = await runScoreTest(499, '2');

        expect(buttons).toEqual([ '📌', '📌📌', '📌📌📌', '💥', '💥💥', '💥💥💥' ]);
    });

    it('Renders correct options for double-1 bust score', async () => {
        const buttons = await runScoreTest(499, '5');

        expect(buttons).toEqual([ '💥', '💥💥', '💥💥💥' ]);
    });

    it('Renders correct options for double-1 bust score', async () => {
        const buttons = await runScoreTest(480, '21');

        expect(buttons).toEqual([ '📌📌', '📌📌📌', '💥', '💥💥', '💥💥💥' ]);
    });

    it('Renders correct options for 0 score', async () => {
        const buttons = await runScoreTest(499, '0');

        expect(buttons).toEqual([ '📌📌📌' ]);
    });

    it('Renders correct options for 1 bust score', async () => {
        const buttons = await runScoreTest(499, '1');

        expect(buttons).toEqual([ '💥', '💥💥', '💥💥💥' ]);
    });
});