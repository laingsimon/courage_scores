// noinspection JSUnresolvedFunction

import {cleanUp, renderApp, doClick} from "../../../helpers/tests";
import React from "react";
import {PreviousPlayerScore} from "./PreviousPlayerScore";

describe('PreviousPlayerScore', () => {
    let context;
    let lastThrowUndone;

    afterEach(() => {
        cleanUp(context);
    });

    async function renderComponent(props) {
        lastThrowUndone = false;
        context = await renderApp(
            { },
            { name: 'Courage Scores' },
            { },
            <PreviousPlayerScore
                {...props}
                undoLastThrow={() => lastThrowUndone = true} />);
    }

    it('renders nothing when no opponent score', async () => {
        await renderComponent({
            home: 'HOME',
            away: 'AWAY',
            leg: {
                currentThrow: 'home',
                startingScore: 501,
                home: {
                    throws: [{
                        score: 123,
                        noOfDarts: 3,
                    }],
                    score: 123,
                    noOfDarts: 3,
                    bust: false,
                },
                away: {
                    throws: [ {
                        score: 100,
                        noOfDarts: 3,
                    } ],
                    score: null,
                    noOfDarts: 6,
                    bust: false,
                },
            },
        });

        expect(context.container.innerHTML).toEqual('');
    });

    it('renders last opponent score', async () => {
        await renderComponent({
            home: 'HOME',
            away: 'AWAY',
            leg: {
                currentThrow: 'home',
                startingScore: 501,
                home: {
                    throws: [{
                        score: 123,
                        noOfDarts: 3,
                    }],
                    score: 123,
                    noOfDarts: 3,
                    bust: false,
                },
                away: {
                    throws: [ {
                        score: 100,
                        noOfDarts: 3,
                    }, {
                        score: 150,
                        noOfDarts: 3,
                    }],
                    score: 250,
                    noOfDarts: 6,
                    bust: false,
                },
            },
        });

        const opponentScore = context.container.querySelector('p:nth-child(1)');
        expect(opponentScore.textContent).toEqual('AWAY  requires 251');
    });

    it('renders last opponent statistics', async () => {
        await renderComponent({
            home: 'HOME',
            away: 'AWAY',
            leg: {
                currentThrow: 'home',
                startingScore: 501,
                home: {
                    throws: [{
                        score: 123,
                        noOfDarts: 3,
                    }],
                    score: 123,
                    noOfDarts: 3,
                    bust: false,
                },
                away: {
                    throws: [ {
                        score: 100,
                        noOfDarts: 3,
                    }, {
                        score: 150,
                        noOfDarts: 3,
                    }],
                    score: 250,
                    noOfDarts: 6,
                    bust: false,
                },
            },
        });

        const opponentStatistics = context.container.querySelector('p:nth-child(2)');
        expect(opponentStatistics.textContent).toEqual('thrown 6 darts, average: 125');
    });

    it('renders last opponent statistics without noOfDarts', async () => {
        await renderComponent({
            home: 'HOME',
            away: 'AWAY',
            leg: {
                currentThrow: 'home',
                startingScore: 501,
                home: {
                    throws: [{
                        score: 123,
                        noOfDarts: 3,
                    }],
                    score: 123,
                    noOfDarts: 3,
                    bust: false,
                },
                away: {
                    throws: [ {
                        score: 100,
                        noOfDarts: 3,
                    }, {
                        score: 150,
                        noOfDarts: 3,
                    }],
                    score: 250,
                    noOfDarts: 0,
                    bust: false,
                },
            },
        });

        const opponentStatistics = context.container.querySelector('p:nth-child(2)');
        expect(opponentStatistics.textContent).toEqual('thrown 0 darts');
    });

    it ('can undo last score from opponent statistics', async () => {
        await renderComponent({
            home: 'HOME',
            away: 'AWAY',
            leg: {
                currentThrow: 'home',
                startingScore: 501,
                home: {
                    throws: [{
                        score: 123,
                        noOfDarts: 3,
                    }],
                    score: 123,
                    noOfDarts: 3,
                    bust: false,
                },
                away: {
                    throws: [ {
                        score: 100,
                        noOfDarts: 3,
                    }, {
                        score: 150,
                        noOfDarts: 3,
                    }],
                    score: 250,
                    noOfDarts: 0,
                    bust: false,
                },
            },
        });
        let confirm;
        window.confirm = (message) => { confirm = message; return true; };

        await doClick(context.container.querySelector('p:nth-child(2)'));

        expect(confirm).toEqual('Are you sure you want to change this score?');
        expect(lastThrowUndone).toEqual(true);
    });

    it ('does not undo last score from opponent statistics', async () => {
        await renderComponent({
            home: 'HOME',
            away: 'AWAY',
            leg: {
                currentThrow: 'home',
                startingScore: 501,
                home: {
                    throws: [{
                        score: 123,
                        noOfDarts: 3,
                    }],
                    score: 123,
                    noOfDarts: 3,
                    bust: false,
                },
                away: {
                    throws: [ {
                        score: 100,
                        noOfDarts: 3,
                    }, {
                        score: 150,
                        noOfDarts: 3,
                    }],
                    score: 250,
                    noOfDarts: 0,
                    bust: false,
                },
            },
        });
        window.confirm = () => false;

        await doClick(context.container.querySelector('p:nth-child(2)'));

        expect(lastThrowUndone).toEqual(false);
    });

    it('renders last opponent last throw', async () => {
        await renderComponent({
            home: 'HOME',
            away: 'AWAY',
            leg: {
                currentThrow: 'home',
                startingScore: 501,
                home: {
                    throws: [{
                        score: 123,
                        noOfDarts: 3,
                    }],
                    score: 123,
                    noOfDarts: 3,
                    bust: false,
                },
                away: {
                    throws: [ {
                        score: 100,
                        noOfDarts: 3,
                    }, {
                        score: 150,
                        noOfDarts: 3,
                    }],
                    score: 250,
                    noOfDarts: 6,
                    bust: false,
                },
            },
        });

        const opponentLastThrow = context.container.querySelector('p:nth-child(3)');
        expect(opponentLastThrow.textContent).toEqual('Last score: 150');
    });

    it('renders last opponent last throw when bust', async () => {
        await renderComponent({
            home: 'HOME',
            away: 'AWAY',
            leg: {
                currentThrow: 'home',
                startingScore: 501,
                home: {
                    throws: [{
                        score: 123,
                        noOfDarts: 3,
                    }],
                    score: 123,
                    noOfDarts: 3,
                    bust: false,
                },
                away: {
                    throws: [ {
                        score: 100,
                        noOfDarts: 3,
                    }, {
                        score: 150,
                        noOfDarts: 3,
                    }],
                    score: 250,
                    noOfDarts: 6,
                    bust: true,
                },
            },
        });

        const opponentLastThrow = context.container.querySelector('p:nth-child(3)');
        expect(opponentLastThrow.textContent).toEqual('Last score: 150 💥 ');
    });

    it ('can undo last score from opponent last throw', async () => {
        await renderComponent({
            home: 'HOME',
            away: 'AWAY',
            leg: {
                currentThrow: 'home',
                startingScore: 501,
                home: {
                    throws: [{
                        score: 123,
                        noOfDarts: 3,
                    }],
                    score: 123,
                    noOfDarts: 3,
                    bust: false,
                },
                away: {
                    throws: [ {
                        score: 100,
                        noOfDarts: 3,
                    }, {
                        score: 150,
                        noOfDarts: 3,
                    }],
                    score: 250,
                    noOfDarts: 6,
                    bust: false,
                },
            },
        });
        let confirm;
        window.confirm = (message) => { confirm = message; return true; };

        await doClick(context.container.querySelector('p:nth-child(3)'));

        expect(confirm).toEqual('Are you sure you want to change this score?');
        expect(lastThrowUndone).toEqual(true);
    });
});