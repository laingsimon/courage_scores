import {
    appProps,
    brandingProps,
    cleanUp,
    doClick,
    ErrorState,
    findButton,
    iocProps,
    renderApp, TestContext
} from "../../helpers/tests";
import {IMergeManOfTheMatchProps, MergeManOfTheMatch} from "./MergeManOfTheMatch";
import {playerBuilder} from "../../helpers/builders/players";
import {GameDto} from "../../interfaces/models/dtos/Game/GameDto";
import {TeamPlayerDto} from "../../interfaces/models/dtos/Team/TeamPlayerDto";
import {fixtureBuilder} from "../../helpers/builders/games";

describe('MergeManOfTheMatch', () => {
    let context: TestContext;
    let reportedError: ErrorState;
    let updatedData: GameDto | null;

    afterEach(async () => {
        await cleanUp(context);
    });

    beforeEach(() => {
        reportedError = new ErrorState();
        updatedData = null;
    });

    async function setData(data: GameDto) {
        updatedData = data;
    }

    async function renderComponent(props: IMergeManOfTheMatchProps) {
        context = await renderApp(
            iocProps(),
            brandingProps(),
            appProps({}, reportedError),
            (<MergeManOfTheMatch {...props} />),
            undefined,
            undefined,
            'tbody');
    }

    describe('renders', () => {
        const player: TeamPlayerDto = playerBuilder('MOM').build();
        const allPlayers: TeamPlayerDto[] = [player];

        it('when home merged', async () => {
            const data: GameDto = fixtureBuilder()
                .playing('HOME', 'AWAY')
                .manOfTheMatch(player)
                .homeSubmission(s => s.playing('HOME', 'AWAY'))
                .awaySubmission(s => s.playing('HOME', 'AWAY'))
                .build();

            await renderComponent({ data, allPlayers, setData });

            const homeMOM = context.container.querySelector('td:nth-child(1)')!;
            expect(homeMOM.textContent).toEqual('Merged');
        });

        it('when away merged', async () => {
            const data: GameDto = fixtureBuilder()
                .playing('HOME', 'AWAY')
                .manOfTheMatch(undefined, player)
                .homeSubmission(s => s.playing('HOME', 'AWAY'))
                .awaySubmission(s => s.playing('HOME', 'AWAY'))
                .build();

            await renderComponent({ data, allPlayers, setData });

            const awayMOM = context.container.querySelector('td:nth-child(3)')!;
            expect(awayMOM.textContent).toEqual('Merged');
        });

        it('when nothing to merge for home', async () => {
            const data: GameDto = fixtureBuilder()
                .playing('HOME', 'AWAY')
                .homeSubmission(s => s.playing('HOME', 'AWAY'))
                .awaySubmission(s => s.playing('HOME', 'AWAY'))
                .build();

            await renderComponent({ data, allPlayers, setData });

            const homeMOM = context.container.querySelector('td:nth-child(1)')!;
            expect(homeMOM.textContent).toEqual('Nothing to merge');
        });

        it('when nothing to merge for away', async () => {
            const data: GameDto = fixtureBuilder()
                .playing('HOME', 'AWAY')
                .homeSubmission(s => s.playing('HOME', 'AWAY'))
                .awaySubmission(s => s.playing('HOME', 'AWAY'))
                .build();

            await renderComponent({ data, allPlayers, setData });

            const awayMOM = context.container.querySelector('td:nth-child(3)')!;
            expect(awayMOM.textContent).toEqual('Nothing to merge');
        });

        it('when home unmerged', async () => {
            const data: GameDto = fixtureBuilder()
                .playing('HOME', 'AWAY')
                .homeSubmission(s => s.playing('HOME', 'AWAY').manOfTheMatch(player))
                .awaySubmission(s => s.playing('HOME', 'AWAY'))
                .build();

            await renderComponent({ data, allPlayers, setData });

            const homeMOM = context.container.querySelector('td:nth-child(1)')!;
            expect(homeMOM.textContent).toEqual('Use MOM');
        });

        it('when away unmerged', async () => {
            const data: GameDto = fixtureBuilder()
                .playing('HOME', 'AWAY')
                .homeSubmission(s => s.playing('HOME', 'AWAY'))
                .awaySubmission(s => s.playing('HOME', 'AWAY').manOfTheMatch(undefined, player))
                .build();

            await renderComponent({ data, allPlayers, setData });

            const awayMOM = context.container.querySelector('td:nth-child(3)')!;
            expect(awayMOM.textContent).toEqual('Use MOM');
        });
    });

    describe('interactivity', () => {
        const player = playerBuilder('MOM').build();
        const allPlayers = [player];

        it('can change home man of match', async () => {
            const data: GameDto = fixtureBuilder()
                .playing('HOME', 'AWAY')
                .homeSubmission(s => s.playing('HOME', 'AWAY').manOfTheMatch(player))
                .awaySubmission(s => s.playing('HOME', 'AWAY'))
                .build();
            await renderComponent({ data, allPlayers, setData });

            await doClick(findButton(context.container.querySelector('td:nth-child(1)'), 'Use MOM'));

            reportedError.verifyNoError();
            expect(updatedData).not.toBeNull();
            expect(updatedData!.home.manOfTheMatch).toEqual(player.id);
        });

        it('can change away man of match', async () => {
            const data: GameDto = fixtureBuilder()
                .playing('HOME', 'AWAY')
                .homeSubmission(s => s.playing('HOME', 'AWAY'))
                .awaySubmission(s => s.playing('HOME', 'AWAY').manOfTheMatch(undefined, player))
                .build();
            await renderComponent({ data, allPlayers, setData });

            await doClick(findButton(context.container.querySelector('td:nth-child(3)'), 'Use MOM'));

            reportedError.verifyNoError();
            expect(updatedData).not.toBeNull();
            expect(updatedData!.away.manOfTheMatch).toEqual(player.id);
        });
    })
});