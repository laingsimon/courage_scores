import {
    appProps,
    brandingProps,
    cleanUp,
    doChange,
    doClick, ErrorState,
    findButton,
    iocProps,
    renderApp, TestContext
} from "../../helpers/tests";
import {IPlayerInputProps, PlayerInput} from "./PlayerInput";
import {ILegCompetitorScoreBuilder, legBuilder} from "../../helpers/builders/sayg";
import {LegDto} from "../../interfaces/models/dtos/Game/Sayg/LegDto";

describe('PlayerInput', () => {
    let context: TestContext;
    let changedLegs: LegDto[];
    let reportedError: ErrorState;
    const home = 'home-player';
    const away = 'away-player';

    afterEach(() => {
        cleanUp(context);
    });

    beforeEach(() => {
        reportedError = new ErrorState();
        changedLegs = [];
    });

    async function on180(_: string) {
    }

    async function onHiCheck(_: string, __: number) {
    }

    async function onChange(leg: LegDto) {
        changedLegs.push(leg);
    }

    async function onLegComplete(_: string) {
    }

    async function renderComponent(props: IPlayerInputProps) {
        context = await renderApp(
            iocProps(),
            brandingProps(),
            appProps({}, reportedError),
            <PlayerInput {...props} />);
    }

    async function setScoreInput(score: string) {
        await doChange(context.container, 'input[data-score-input="true"]', score, context.user);
    }

    async function runScoreTest(homeScore: number, inputScore: string) {
        const leg = legBuilder()
            .currentThrow('home')
            .startingScore(501)
            .home((c: ILegCompetitorScoreBuilder) => c.score(homeScore).noOfDarts(0))
            .build();
        await renderComponent({
            home,
            homeScore,
            leg,
            singlePlayer: true,
            on180,
            onHiCheck,
            onChange,
            onLegComplete,
        });

        await setScoreInput(inputScore);

        const scoreButtons = Array.from(context.container.querySelectorAll('div[datatype="gameshot-buttons-score"] button'));
        const bustButtons = Array.from(context.container.querySelectorAll('div[datatype="gameshot-buttons-bust"] button'));
        return scoreButtons.concat(bustButtons).map(button => button.textContent);
    }

    it('Renders initial heading correctly - multi-player', async () => {
        const leg = legBuilder()
            .currentThrow('home')
            .startingScore(501)
            .home((c: ILegCompetitorScoreBuilder) => c.score(0).noOfDarts(0))
            .away((c: ILegCompetitorScoreBuilder) => c.score(0).noOfDarts(0))
            .build();
        await renderComponent({
            home: home,
            away: away,
            homeScore: 0,
            awayScore: 0,
            leg: leg,
            singlePlayer: false,
            on180,
            onLegComplete,
            onChange,
            onHiCheck,
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
            .home((c: ILegCompetitorScoreBuilder) => c.score(0).noOfDarts(0))
            .build();
        await renderComponent({
            home: home,
            homeScore: 0,
            leg: leg,
            singlePlayer: true,
            on180,
            onLegComplete,
            onChange,
            onHiCheck,
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
            .home((c: ILegCompetitorScoreBuilder) => c.score(100).noOfDarts(0))
            .build();
        await renderComponent({
            home: home,
            homeScore: 0,
            leg: leg,
            singlePlayer: true,
            on180,
            onLegComplete,
            onChange,
            onHiCheck,
        });

        await setScoreInput("50");
        await doClick(findButton(context.container, '📌📌📌'));

        reportedError.verifyNoError();
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
            .home((c: ILegCompetitorScoreBuilder) => c.score(401).noOfDarts(0))
            .build();
        await renderComponent({
            home: home,
            homeScore: 0,
            leg: leg,
            singlePlayer: true,
            on180,
            onLegComplete,
            onChange,
            onHiCheck,
        });

        await setScoreInput("100");
        await doClick(findButton(context.container, '📌📌'));

        reportedError.verifyNoError();
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
            .home((c: ILegCompetitorScoreBuilder) => c.score(451).noOfDarts(0))
            .build();
        await renderComponent({
            home: home,
            homeScore: 0,
            leg: leg,
            singlePlayer: true,
            on180,
            onLegComplete,
            onChange,
            onHiCheck,
        });

        await setScoreInput("50");
        await doClick(findButton(context.container, '📌'));

        reportedError.verifyNoError();
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
            .home((c: ILegCompetitorScoreBuilder) => c.score(331).noOfDarts(0))
            .build();
        await renderComponent({
            home: home,
            homeScore: 0,
            leg: leg,
            singlePlayer: true,
            on180,
            onLegComplete,
            onChange,
            onHiCheck,
        });

        await setScoreInput("180");
        await doClick(findButton(context.container, '💥💥💥'));

        reportedError.verifyNoError();
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
            .home((c: ILegCompetitorScoreBuilder) => c.score(391).noOfDarts(0))
            .build();
        await renderComponent({
            home: home,
            homeScore: 0,
            leg: leg,
            singlePlayer: true,
            on180,
            onLegComplete,
            onChange,
            onHiCheck,
        });

        await setScoreInput("120");
        await doClick(findButton(context.container, '💥💥'));

        reportedError.verifyNoError();
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
            .home((c: ILegCompetitorScoreBuilder) => c.score(461).noOfDarts(0))
            .build();
        await renderComponent({
            home: home,
            homeScore: 0,
            leg: leg,
            singlePlayer: true,
            on180,
            onLegComplete,
            onChange,
            onHiCheck,
        });

        await setScoreInput("60");
        await doClick(findButton(context.container, '💥'));

        reportedError.verifyNoError();
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
            .home((c: ILegCompetitorScoreBuilder) => c.score(461).noOfDarts(0))
            .build();
        await renderComponent({
            home: home,
            homeScore: 0,
            leg: leg,
            singlePlayer: true,
            on180,
            onLegComplete,
            onChange,
            onHiCheck,
        });

        await setScoreInput('');
        await context.user.type(context.container.querySelector('input[data-score-input="true"]'), '{Enter}');

        reportedError.verifyNoError();
        expect(changedLegs).toEqual([]);
    });

    it('prevents invalid score via enter key press', async () => {
        const leg = legBuilder()
            .currentThrow('home')
            .startingScore(501)
            .home((c: ILegCompetitorScoreBuilder) => c.score(461).noOfDarts(0))
            .build();
        await renderComponent({
            home: home,
            homeScore: 0,
            leg: leg,
            singlePlayer: true,
            on180,
            onLegComplete,
            onChange,
            onHiCheck,
        });

        await setScoreInput('.');
        await context.user.type(context.container.querySelector('input[data-score-input="true"]'), '{Enter}');

        reportedError.verifyNoError();
        expect(changedLegs).toEqual([]);
    });

    it('accepts valid score via enter key press', async () => {
        const leg = legBuilder()
            .currentThrow('home')
            .startingScore(501)
            .home((c: ILegCompetitorScoreBuilder) => c.score(380).noOfDarts(0))
            .build();
        await renderComponent({
            home: home,
            homeScore: 0,
            leg: leg,
            singlePlayer: true,
            on180,
            onLegComplete,
            onChange,
            onHiCheck,
        });

        await setScoreInput('121');
        await context.user.type(context.container.querySelector('input[data-score-input="true"]'), '{Enter}');

        reportedError.verifyNoError();
        expect(changedLegs.length).toEqual(1);
    });

    it('does not accept ambiguous dart-number score via enter key press', async () => {
        const leg = legBuilder()
            .currentThrow('home')
            .startingScore(501)
            .home((c: ILegCompetitorScoreBuilder) => c.score(451).noOfDarts(0))
            .build();
        await renderComponent({
            home: home,
            homeScore: 0,
            leg: leg,
            singlePlayer: true,
            on180,
            onLegComplete,
            onChange,
            onHiCheck,
        });

        await setScoreInput('50'); // could be bull (1 dart), 10, D20 (2 darts) or a range of 3-dart options
        await context.user.type(context.container.querySelector('input[data-score-input="true"]'), '{Enter}');

        reportedError.verifyNoError();
        expect(changedLegs.length).toEqual(0);
    });

    it('does not accept invalid score via enter key press', async () => {
        const leg = legBuilder()
            .currentThrow('home')
            .startingScore(501)
            .home((c: ILegCompetitorScoreBuilder) => c.score(261).noOfDarts(0))
            .build();
        await renderComponent({
            home: home,
            homeScore: 0,
            leg: leg,
            singlePlayer: true,
            on180,
            onLegComplete,
            onChange,
            onHiCheck,
        });

        await setScoreInput('200');
        await context.user.type(context.container.querySelector('input[data-score-input="true"]'), '{Enter}');

        reportedError.verifyNoError();
        expect(changedLegs.length).toEqual(0);
    });
});