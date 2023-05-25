// noinspection JSUnresolvedFunction

import {cleanUp, renderApp, doClick} from "../../../tests/helpers";
import React from "react";
import {PlayLeg} from "./PlayLeg";

describe('PlayLeg', () => {
    let context;
    let changedLeg;
    let oneEighty;
    let hiCheck;
    let legComplete;

    afterEach(() => {
        cleanUp(context);
    });

    async function renderComponent(props) {
        changedLeg = null;
        oneEighty = null;
        hiCheck = null;
        legComplete = null;
        context = await renderApp(
            { },
            { },
            <PlayLeg
                {...props}
                onChange={(newLeg) => { changedLeg = newLeg; }}
                onLegComplete={(side) => { legComplete = side; }}
                on180={(side) => { oneEighty = side; }}
                onHiCheck={(side, score) => { hiCheck = { side, score }; }} />);
    }

    it('renders no-leg if no leg provided', async () => {
        await renderComponent({
            leg: null,
            home: 'HOME',
            away: 'AWAY',
            homeScore: 0,
            awayScore: 0,
            singlePlayer: false,
        });

        expect(context.container.textContent).toEqual('No leg!');
    });

    it('renders player selection when no player sequence', async () => {
        await renderComponent({
            leg: {
                playerSequence: null,
                currentThrow: null,
                isLastLeg: false,
            },
            home: 'HOME',
            away: 'AWAY',
            homeScore: 0,
            awayScore: 0,
            singlePlayer: false,
        });

        expect(context.container.textContent).toContain('Who plays first?');
        const buttons = Array.from(context.container.querySelectorAll('button'));
        expect(buttons.length).toEqual(2);
        expect(buttons[0].textContent).toEqual('🎯HOME');
        expect(buttons[1].textContent).toEqual('🎯AWAY');
    });

    it('renders up-for-the-bull if last leg and equal scores', async () => {
        await renderComponent({
            leg: {
                playerSequence: null,
                currentThrow: null,
                isLastLeg: true,
            },
            home: 'HOME',
            away: 'AWAY',
            homeScore: 2,
            awayScore: 2,
            singlePlayer: false,
        });

        expect(context.container.textContent).toContain('Who won the bull?');
        const buttons = Array.from(context.container.querySelectorAll('button'));
        expect(buttons.length).toEqual(2);
        expect(buttons[0].textContent).toEqual('🎯HOME');
        expect(buttons[1].textContent).toEqual('🎯AWAY');
    });

    it('renders previous player score', async () => {
        await renderComponent({
            leg: {
                playerSequence: ['home', 'away'],
                currentThrow: 'home',
                isLastLeg: false,
                home: {
                    throws: [{
                        score: 50,
                    }],
                    score: 50,
                },
                away: {
                    throws: [{
                        score: 100,
                    }],
                    score: 100,
                },
                startingScore: 501,
            },
            home: 'HOME',
            away: 'AWAY',
            homeScore: 0,
            awayScore: 0,
            singlePlayer: false,
        });

        const previousPlayerScore = context.container.querySelector('div > div:nth-child(1)');
        expect(previousPlayerScore.textContent).toContain('AWAY  requires 401');
    });

    it('renders player input', async () => {
        await renderComponent({
            leg: {
                playerSequence: ['home', 'away'],
                currentThrow: 'home',
                isLastLeg: false,
                home: {
                    throws: [{
                        score: 50,
                    }],
                    score: 50,
                },
                away: {
                    throws: [{
                        score: 100,
                    }],
                    score: 100,
                },
                startingScore: 501,
            },
            home: 'HOME',
            away: 'AWAY',
            homeScore: 0,
            awayScore: 0,
            singlePlayer: false,
        });

        const playerInput = context.container.querySelector('div > div:nth-child(2)');
        expect(playerInput.textContent).toContain('HOME  requires 451');
    });

    it('can undo last throw', async () => {
        await renderComponent({
            leg: {
                playerSequence: ['home', 'away'],
                currentThrow: 'home',
                isLastLeg: false,
                home: {
                    throws: [{ score: 50, noOfDarts: 3 }],
                    score: 50,
                    noOfDarts: 3,
                },
                away: {
                    throws: [{ score: 100, noOfDarts: 3 }],
                    score: 100,
                    noOfDarts: 3,
                },
                startingScore: 501,
            },
            home: 'HOME',
            away: 'AWAY',
            homeScore: 0,
            awayScore: 0,
            singlePlayer: false,
        });
        const previousPlayerScore = context.container.querySelector('div > div:nth-child(1)');
        const clickToChangeScore = previousPlayerScore.querySelector('p[title="Click to change score"]');
        window.confirm = () => true;

        await doClick(clickToChangeScore);

        expect(changedLeg).toEqual({
            currentThrow: 'away',
            home: {
                throws: [ { score: 50, noOfDarts: 3 } ],
                score: 50,
                noOfDarts: 3,
            },
            away: {
                throws: [],
                score: 0,
                noOfDarts: 0,
            },
            isLastLeg: false,
            playerSequence: [ 'home', 'away' ],
            startingScore: 501,
        });
    });

    it('can define first player for match', async () => {
        await renderComponent({
            leg: {
                playerSequence: null,
                currentThrow: null,
                isLastLeg: false,
            },
            home: 'HOME',
            away: 'AWAY',
            homeScore: 0,
            awayScore: 0,
            singlePlayer: false,
        });
        const buttons = Array.from(context.container.querySelectorAll('button'));
        const homeButton = buttons[0];

        await doClick(homeButton);

        expect(changedLeg).toEqual({
            playerSequence: [ { text: 'HOME', value: 'home' }, { text: 'AWAY', value: 'away' } ],
            currentThrow: 'home',
            isLastLeg: false,
        });
    });

    it('can define first player for final leg of match when drawing', async () => {
        await renderComponent({
            leg: {
                playerSequence: null,
                currentThrow: null,
                isLastLeg: true,
            },
            home: 'HOME',
            away: 'AWAY',
            homeScore: 2,
            awayScore: 2,
            singlePlayer: false,
        });
        const buttons = Array.from(context.container.querySelectorAll('button'));
        const awayButton = buttons[1];

        await doClick(awayButton);

        expect(changedLeg).toEqual({
            playerSequence: [ { text: 'AWAY', value: 'away' }, { text: 'HOME', value: 'home' } ],
            currentThrow: 'away',
            isLastLeg: true,
        });
    });
});