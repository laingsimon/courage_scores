import {
    cleanUp,
    doClick,
    renderApp,
    findButton,
    iocProps,
    brandingProps,
    appProps,
    TestContext
} from "../../../helpers/tests";
import React from "react";
import {IPreviousPlayerScoreProps, PreviousPlayerScore} from "./PreviousPlayerScore";
import {ILegCompetitorScoreBuilder, legBuilder} from "../../../helpers/builders/sayg";

describe('PreviousPlayerScore', () => {
    let context: TestContext;
    let lastThrowUndone: boolean;

    afterEach(() => {
        cleanUp(context);
    });

    beforeEach(() => {
        lastThrowUndone = false;
    });

    async function undoLastThrow() {
        lastThrowUndone = true;
    }

    async function renderComponent(props: IPreviousPlayerScoreProps) {
        context = await renderApp(
            iocProps(),
            brandingProps(),
            appProps(),
            <PreviousPlayerScore {...props} />);
    }

    it('renders nothing when no opponent score', async () => {
        await renderComponent({
            home: 'HOME',
            away: 'AWAY',
            leg: legBuilder()
                .currentThrow('home')
                .startingScore(501)
                .home((c: ILegCompetitorScoreBuilder) => c.withThrow(123, false, 3).score(123).noOfDarts(3))
                .away((c: ILegCompetitorScoreBuilder) => c.withThrow(100, false, 3).noOfDarts(6))
                .build(),
            undoLastThrow,
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
                .home((c: ILegCompetitorScoreBuilder) => c.withThrow(123, false, 3).score(123).noOfDarts(3))
                .away((c: ILegCompetitorScoreBuilder) => c.withThrow(100, false, 3).withThrow(150, false, 3).score(250).noOfDarts(6))
                .build(),
            undoLastThrow,
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
                .home((c: ILegCompetitorScoreBuilder) => c.withThrow(123, false, 3).score(123).noOfDarts(3))
                .away((c: ILegCompetitorScoreBuilder) => c.withThrow(100, false, 3).withThrow(150, false, 3).score(250).noOfDarts(6))
                .build(),
            undoLastThrow,
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
                .home((c: ILegCompetitorScoreBuilder) => c.withThrow(123, false, 3).score(123).noOfDarts(3))
                .away((c: ILegCompetitorScoreBuilder) => c.withThrow(100, false, 3).withThrow(150, false, 3).score(250).noOfDarts(0))
                .build(),
            undoLastThrow,
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
                .home((c: ILegCompetitorScoreBuilder) => c.withThrow(123, false, 3).score(123).noOfDarts(3))
                .away((c: ILegCompetitorScoreBuilder) => c.withThrow(100, false, 3).withThrow(150, false, 3).score(250).noOfDarts(0))
                .build(),
            undoLastThrow,
        });
        let confirm: string;
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
                .home((c: ILegCompetitorScoreBuilder) => c.withThrow(123, false, 3).score(123).noOfDarts(3))
                .away((c: ILegCompetitorScoreBuilder) => c.withThrow(100, false, 3).withThrow(150, false, 3).score(250).noOfDarts(0))
                .build(),
            undoLastThrow,
        });
        window.confirm = () => false;

        await doClick(findButton(context.container, 'Undo'));

        expect(lastThrowUndone).toEqual(false);
    });

    it('renders last opponent last throw', async () => {
        await renderComponent({
            home: 'HOME',
            away: 'AWAY',
            leg: legBuilder()
                .currentThrow('home')
                .startingScore(501)
                .home((c: ILegCompetitorScoreBuilder) => c.withThrow(123, false, 3).score(123).noOfDarts(3))
                .away((c: ILegCompetitorScoreBuilder) => c.withThrow(100, false, 3).withThrow(150, false, 3).score(250).noOfDarts(6))
                .build(),
            undoLastThrow,
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
                .home((c: ILegCompetitorScoreBuilder) => c.withThrow(123, false, 3).score(123).noOfDarts(3))
                .away((c: ILegCompetitorScoreBuilder) => c.withThrow(100, false, 3).withThrow(150, false, 3).score(250).noOfDarts(6).bust())
                .build(),
            undoLastThrow,
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
                .home((c: ILegCompetitorScoreBuilder) => c.withThrow(123, false, 3).score(123).noOfDarts(3))
                .away((c: ILegCompetitorScoreBuilder) => c.withThrow(100, false, 3).withThrow(150, false, 3).score(250).noOfDarts(6))
                .build(),
            undoLastThrow,
        });
        let confirm: string;
        window.confirm = (message) => {
            confirm = message;
            return true;
        };

        await doClick(findButton(context.container, 'Undo'));

        expect(confirm).toEqual('Are you sure you want to change this score?');
        expect(lastThrowUndone).toEqual(true);
    });
});