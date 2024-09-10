import {
    appProps,
    brandingProps,
    cleanUp,
    doClick,
    findButton,
    iocProps,
    renderApp,
    TestContext
} from "../../helpers/tests";
import {IPlayLegProps, PlayLeg} from "./PlayLeg";
import {LegDto} from "../../interfaces/models/dtos/Game/Sayg/LegDto";

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

    async function on180(_: string) {
    }

    async function onHiCheck(_: string, __: number) {
    }

    async function renderComponent(props: IPlayLegProps) {
        context = await renderApp(
            iocProps(),
            brandingProps(),
            appProps(),
            <PlayLeg {...props} />);
    }

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
            on180,
            onHiCheck,
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
            on180,
            onHiCheck,
        });

        expect(context.container.textContent).toContain('Who won the bull?');
        const buttons = Array.from(context.container.querySelectorAll('button'));
        expect(buttons.length).toEqual(2);
        expect(buttons[0].textContent).toEqual('🎯HOME');
        expect(buttons[1].textContent).toEqual('🎯AWAY');
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
            on180,
            onHiCheck,
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
            on180,
            onHiCheck,
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