import {
    appProps,
    brandingProps,
    cleanUp,
    doClick,
    findButton,
    iocProps,
    renderApp,
    TestContext
} from "../../../helpers/tests";
import {IPlayLegProps, PlayLeg} from "./PlayLeg";
import {ILegCompetitorScoreBuilder, legBuilder} from "../../../helpers/builders/sayg";
import {LegDto} from "../../../interfaces/models/dtos/Game/Sayg/LegDto";

describe('PlayLeg', () => {
    let context: TestContext;
    let changedLeg: LegDto;

    afterEach(() => {
        cleanUp(context);
    });

    beforeEach(() => {
        changedLeg = null;
    });

    async function onChange(newLeg: LegDto) {
        changedLeg = newLeg;
    }

    async function onLegComplete(_: string) {
    }

    async function renderComponent(props: IPlayLegProps) {
        context = await renderApp(
            iocProps(),
            brandingProps(),
            appProps(),
            <PlayLeg {...props} />);
    }

    it('renders no-leg if no leg provided', async () => {
        await renderComponent({
            leg: null,
            home: 'HOME',
            away: 'AWAY',
            homeScore: 0,
            awayScore: 0,
            singlePlayer: false,
            onChange,
            onLegComplete,
        });

        expect(context.container.textContent).toEqual('No leg!');
    });

    it('renders player selection when no player sequence', async () => {
        await renderComponent({
            leg: {
                playerSequence: null,
                currentThrow: null,
                isLastLeg: false,
                away: null,
                home: null,
            },
            home: 'HOME',
            away: 'AWAY',
            homeScore: 0,
            awayScore: 0,
            singlePlayer: false,
            onChange,
            onLegComplete,
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
                away: null,
                home: null,
            },
            home: 'HOME',
            away: 'AWAY',
            homeScore: 2,
            awayScore: 2,
            singlePlayer: false,
            onChange,
            onLegComplete,
        });

        expect(context.container.textContent).toContain('Who won the bull?');
        const buttons = Array.from(context.container.querySelectorAll('button'));
        expect(buttons.length).toEqual(2);
        expect(buttons[0].textContent).toEqual('🎯HOME');
        expect(buttons[1].textContent).toEqual('🎯AWAY');
    });

    it('renders previous player score', async () => {
        await renderComponent({
            leg: legBuilder()
                .playerSequence('home', 'away')
                .currentThrow('home')
                .home((c: ILegCompetitorScoreBuilder) => c.withThrow(50).score(50))
                .away((c: ILegCompetitorScoreBuilder) => c.withThrow(100).score(100))
                .startingScore(501)
                .build(),
            home: 'HOME',
            away: 'AWAY',
            homeScore: 0,
            awayScore: 0,
            singlePlayer: false,
            onChange,
            onLegComplete,
        });

        const previousPlayerScore = context.container.querySelector('div > div:nth-child(1)');
        expect(previousPlayerScore.textContent).toContain('AWAY  requires 401');
    });

    it('renders player input', async () => {
        await renderComponent({
            leg: legBuilder()
                .playerSequence('home', 'away')
                .currentThrow('home')
                .home((c: ILegCompetitorScoreBuilder) => c.withThrow(50).score(50))
                .away((c: ILegCompetitorScoreBuilder) => c.withThrow(100).score(100))
                .startingScore(501)
                .build(),
            home: 'HOME',
            away: 'AWAY',
            homeScore: 0,
            awayScore: 0,
            singlePlayer: false,
            onChange,
            onLegComplete,
        });

        const playerInput = context.container.querySelector('div > div:nth-child(2)');
        expect(playerInput.textContent).toContain('HOME  requires 451');
    });

    it('can undo last throw', async () => {
        await renderComponent({
            leg: legBuilder()
                .playerSequence('home', 'away')
                .currentThrow('home')
                .home((c: ILegCompetitorScoreBuilder) => c.withThrow(50, false, 3).score(50).noOfDarts(3))
                .away((c: ILegCompetitorScoreBuilder) => c.withThrow(100, false, 3).score(100).noOfDarts(3))
                .startingScore(501)
                .build(),
            home: 'HOME',
            away: 'AWAY',
            homeScore: 0,
            awayScore: 0,
            singlePlayer: false,
            onChange,
            onLegComplete,
        });
        const previousPlayerScore = context.container.querySelector('div > div:nth-child(1)');
        window.confirm = () => true;

        await doClick(findButton(previousPlayerScore, 'Undo'));

        expect(changedLeg).toEqual({
            currentThrow: 'away',
            home: {
                throws: [{score: 50, noOfDarts: 3, bust: false}],
                score: 50,
                noOfDarts: 3,
                bust: false,
            },
            away: {
                throws: [],
                score: 0,
                noOfDarts: 0,
                bust: false,
            },
            isLastLeg: false,
            playerSequence: [
                { text: 'HOME', value: 'home' },
                { text: 'AWAY', value: 'away' }
            ],
            startingScore: 501,
        });
    });

    it('can define first player for match', async () => {
        await renderComponent({
            leg: {
                playerSequence: null,
                currentThrow: null,
                isLastLeg: false,
                away: null,
                home: null,
            },
            home: 'HOME',
            away: 'AWAY',
            homeScore: 0,
            awayScore: 0,
            singlePlayer: false,
            onChange,
            onLegComplete,
        });

        await doClick(findButton(context.container, '🎯HOME'));

        expect(changedLeg).toEqual({
            away: null,
            home: null,
            playerSequence: [{text: 'HOME', value: 'home'}, {text: 'AWAY', value: 'away'}],
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
                away: null,
                home: null,
            },
            home: 'HOME',
            away: 'AWAY',
            homeScore: 2,
            awayScore: 2,
            singlePlayer: false,
            onChange,
            onLegComplete,
        });

        await doClick(findButton(context.container, '🎯AWAY'));

        expect(changedLeg).toEqual({
            away: null,
            home: null,
            playerSequence: [{text: 'AWAY', value: 'away'}, {text: 'HOME', value: 'home'}],
            currentThrow: 'away',
            isLastLeg: true,
        });
    });
});