// noinspection JSUnresolvedFunction

import {cleanUp, doClick, renderApp, findButton} from "../../../helpers/tests";
import React from "react";
import {PreviousPlayerScore} from "./PreviousPlayerScore";
import {legBuilder} from "../../../helpers/builders";

describe('PreviousPlayerScore', () => {
    let context;
    let lastThrowUndone;

    afterEach(() => {
        cleanUp(context);
    });

    async function renderComponent(props) {
        lastThrowUndone = false;
        context = await renderApp(
            {},
            {name: 'Courage Scores'},
            {},
            <PreviousPlayerScore
                {...props}
                undoLastThrow={() => lastThrowUndone = true}/>);
    }

    it('renders nothing when no opponent score', async () => {
        await renderComponent({
            home: 'HOME',
            away: 'AWAY',
            leg: legBuilder()
                .currentThrow('home')
                .startingScore(501)
                .home(c => c.withThrow(123, false, 3).score(123).noOfDarts(3))
                .away(c => c.withThrow(100, false, 3).noOfDarts(6))
                .build(),
        });

        expect(context.container.innerHTML).toEqual('');
    });

    it('renders last opponent score', async () => {
        await renderComponent({
            home: 'HOME',
            away: 'AWAY',
            leg: legBuilder()
                .currentThrow('home')
                .startingScore(501)
                .home(c => c.withThrow(123, false, 3).score(123).noOfDarts(3))
                .away(c => c.withThrow(100, false, 3).withThrow(150, false, 3).score(250).noOfDarts(6))
                .build(),
        });

        const opponentScore = context.container.querySelector('p:nth-child(2)');
        expect(opponentScore.textContent).toEqual('AWAY  requires 251');
    });

    it('renders last opponent statistics', async () => {
        await renderComponent({
            home: 'HOME',
            away: 'AWAY',
            leg: legBuilder()
                .currentThrow('home')
                .startingScore(501)
                .home(c => c.withThrow(123, false, 3).score(123).noOfDarts(3))
                .away(c => c.withThrow(100, false, 3).withThrow(150, false, 3).score(250).noOfDarts(6))
                .build(),
        });

        const opponentStatistics = context.container.querySelector('p:nth-child(3)');
        expect(opponentStatistics.textContent).toEqual('thrown 6 darts, average: 125');
    });

    it('renders last opponent statistics without noOfDarts', async () => {
        await renderComponent({
            home: 'HOME',
            away: 'AWAY',
            leg: legBuilder()
                .currentThrow('home')
                .startingScore(501)
                .home(c => c.withThrow(123, false, 3).score(123).noOfDarts(3))
                .away(c => c.withThrow(100, false, 3).withThrow(150, false, 3).score(250).noOfDarts(0))
                .build(),
        });

        const opponentStatistics = context.container.querySelector('p:nth-child(3)');
        expect(opponentStatistics.textContent).toEqual('thrown 0 darts');
    });

    it('can undo last score from opponent statistics', async () => {
        await renderComponent({
            home: 'HOME',
            away: 'AWAY',
            leg: legBuilder()
                .currentThrow('home')
                .startingScore(501)
                .home(c => c.withThrow(123, false, 3).score(123).noOfDarts(3))
                .away(c => c.withThrow(100, false, 3).withThrow(150, false, 3).score(250).noOfDarts(0))
                .build(),
        });
        let confirm;
        window.confirm = (message) => {
            confirm = message;
            return true;
        };

        await doClick(findButton(context.container, 'Undo'));

        expect(confirm).toEqual('Are you sure you want to change this score?');
        expect(lastThrowUndone).toEqual(true);
    });

    it('does not undo last score from opponent statistics', async () => {
        await renderComponent({
            home: 'HOME',
            away: 'AWAY',
            leg: legBuilder()
                .currentThrow('home')
                .startingScore(501)
                .home(c => c.withThrow(123, false, 3).score(123).noOfDarts(3))
                .away(c => c.withThrow(100, false, 3).withThrow(150, false, 3).score(250).noOfDarts(0))
                .build(),
        });
        window.confirm = () => false;

        await doClick(context.container.querySelector('p:nth-child(2)'));

        expect(lastThrowUndone).toEqual(false);
    });

    it('renders last opponent last throw', async () => {
        await renderComponent({
            home: 'HOME',
            away: 'AWAY',
            leg: legBuilder()
                .currentThrow('home')
                .startingScore(501)
                .home(c => c.withThrow(123, false, 3).score(123).noOfDarts(3))
                .away(c => c.withThrow(100, false, 3).withThrow(150, false, 3).score(250).noOfDarts(6))
                .build(),
        });

        const opponentLastThrow = context.container.querySelector('p:nth-child(4)');
        expect(opponentLastThrow.textContent).toEqual('Last score: 150');
    });

    it('renders last opponent last throw when bust', async () => {
        await renderComponent({
            home: 'HOME',
            away: 'AWAY',
            leg: legBuilder()
                .currentThrow('home')
                .startingScore(501)
                .home(c => c.withThrow(123, false, 3).score(123).noOfDarts(3))
                .away(c => c.withThrow(100, false, 3).withThrow(150, false, 3).score(250).noOfDarts(6).bust())
                .build(),
        });

        const opponentLastThrow = context.container.querySelector('p:nth-child(4)');
        expect(opponentLastThrow.textContent).toEqual('Last score: 150 💥 ');
    });

    it('can undo last score from opponent last throw', async () => {
        await renderComponent({
            home: 'HOME',
            away: 'AWAY',
            leg: legBuilder()
                .currentThrow('home')
                .startingScore(501)
                .home(c => c.withThrow(123, false, 3).score(123).noOfDarts(3))
                .away(c => c.withThrow(100, false, 3).withThrow(150, false, 3).score(250).noOfDarts(6))
                .build(),
        });
        let confirm;
        window.confirm = (message) => {
            confirm = message;
            return true;
        };

        await doClick(findButton(context.container, 'Undo'));

        expect(confirm).toEqual('Are you sure you want to change this score?');
        expect(lastThrowUndone).toEqual(true);
    });
});