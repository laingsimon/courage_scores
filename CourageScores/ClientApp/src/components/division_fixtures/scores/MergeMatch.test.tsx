import {
    appProps,
    brandingProps,
    cleanUp,
    doClick,
    ErrorState,
    findButton,
    iocProps,
    renderApp, TestContext
} from "../../../helpers/tests";
import {IMergeMatchProps, MergeMatch} from "./MergeMatch";
import {GameDto} from "../../../interfaces/models/dtos/Game/GameDto";
import {fixtureBuilder, IFixtureBuilder, IMatchBuilder, matchBuilder} from "../../../helpers/builders/games";
import {playerBuilder} from "../../../helpers/builders/players";
import {GameMatchDto} from "../../../interfaces/models/dtos/Game/GameMatchDto";

describe('MergeMatch', () => {
    let context: TestContext;
    let reportedError: ErrorState;
    let updatedData: GameDto;

    afterEach(() => {
        cleanUp(context);
    });

    beforeEach(() => {
        reportedError = new ErrorState();
        updatedData = null;
    });

    async function setFixtureData(data: GameDto) {
        updatedData = data;
    }

    async function renderComponent(props: IMergeMatchProps) {
        context = await renderApp(
            iocProps(),
            brandingProps(),
            appProps({}, reportedError),
            (<MergeMatch {...props} />),
            null,
            null,
            'tbody');
    }

    describe('renders', () => {
        it('when published', async () => {
            const match = matchBuilder()
                .withHome('HOME PLAYER')
                .withAway('AWAY PLAYER')
                .scores(1, 2)
                .build();

            await renderComponent({
                readOnly: false,
                matches: [match],
                matchIndex: 0,
                homeSubmission: fixtureBuilder().build(),
                awaySubmission: fixtureBuilder().build(),
                fixtureData: fixtureBuilder().build(),
                setFixtureData,
            });

            reportedError.verifyNoError();
            expect(context.container.innerHTML).toEqual('');
        });

        it('when home and away submissions match', async () => {
            const match: GameMatchDto = matchBuilder().build();
            const fixture = fixtureBuilder('2023-05-06T00:00:00')
                .homeSubmission((s: IFixtureBuilder) => s
                    .playing('HOME', 'AWAY')
                    .withMatch((m: IMatchBuilder) => m.withHome().withAway().scores(1, 2)))
                .awaySubmission((s: IFixtureBuilder) => s
                    .playing('HOME', 'AWAY')
                    .withMatch((m: IMatchBuilder) => m.withHome().withAway().scores(1, 2)))
                .build();
            await renderComponent({
                readOnly: false,
                matches: [match],
                matchIndex: 0,
                homeSubmission: fixture.homeSubmission,
                awaySubmission: fixture.awaySubmission,
                fixtureData: fixtureBuilder().build(),
                setFixtureData,
            });

            reportedError.verifyNoError();
            const td = context.container.querySelector('td');
            expect(td.colSpan).toEqual(5);
            expect(td.querySelector('button')).toBeTruthy();
            expect(td.querySelector('span > div').textContent).toEqual('HOME: 1 - AWAY: 2');
        });

        it('when home and away submissions match and readonly', async () => {
            const match: GameMatchDto = matchBuilder().build();
            const fixture = fixtureBuilder('2023-05-06T00:00:00')
                .homeSubmission((s: IFixtureBuilder) => s
                    .playing('HOME', 'AWAY')
                    .withMatch((m: IMatchBuilder) => m.withHome().withAway().scores(1, 2)))
                .awaySubmission((s: IFixtureBuilder) => s
                    .playing('HOME', 'AWAY')
                    .withMatch((m: IMatchBuilder) => m.withHome().withAway().scores(1, 2)))
                .build();
            await renderComponent({
                readOnly: true,
                matches: [match],
                matchIndex: 0,
                homeSubmission: fixture.homeSubmission,
                awaySubmission: fixture.awaySubmission,
                fixtureData: fixtureBuilder().build(),
                setFixtureData,
            });

            reportedError.verifyNoError();
            const td = context.container.querySelector('td');
            expect(td.colSpan).toEqual(5);
            expect(td.querySelector('button')).toBeTruthy();
            expect(td.querySelector('span > div').textContent).toEqual('HOME: 1 - AWAY: 2');
            expect(td.querySelector('button').disabled).toEqual(true);
        });

        it('when home but no away submission match', async () => {
            const match: GameMatchDto = matchBuilder().build();
            const fixture = fixtureBuilder('2023-05-06T00:00:00')
                .homeSubmission((s: IFixtureBuilder) => s
                    .playing('HOME', 'AWAY')
                    .withMatch((m: IMatchBuilder) => m.withHome().withAway().scores(1, 2)))
                .awaySubmission((s: IFixtureBuilder) => s
                    .playing('HOME', 'AWAY'))
                .build();
            await renderComponent({
                readOnly: true,
                matches: [match],
                matchIndex: 0,
                homeSubmission: fixture.homeSubmission,
                awaySubmission: fixture.awaySubmission,
                fixtureData: fixtureBuilder().build(),
                setFixtureData,
            });

            reportedError.verifyNoError();
            const td = context.container.querySelector('td:nth-child(3)') as HTMLTableCellElement;
            expect(td.colSpan).toEqual(2);
            expect(td.querySelector('span').textContent).toEqual('No match');
        });

        it('when nothing to merge for either home or away', async () => {
            const fixture = fixtureBuilder('2023-05-06T00:00:00')
                .homeSubmission((s: IFixtureBuilder) => s.author('HOME CAPTAIN').playing('HOME', 'AWAY'))
                .awaySubmission((s: IFixtureBuilder) => s.author('AWAY CAPTAIN').playing('HOME', 'AWAY'))
                .build();
            await renderComponent({
                readOnly: false,
                matches: [matchBuilder().build()],
                matchIndex: 0,
                homeSubmission: fixture.homeSubmission,
                awaySubmission: fixture.awaySubmission,
                fixtureData: fixtureBuilder().build(),
                setFixtureData,
            });

            reportedError.verifyNoError();
            expect(context.container.innerHTML).toEqual('');
        });

        it('when home unmerged', async () => {
            const homePlayer = playerBuilder('HOME PLAYER').build();
            const awayPlayer = playerBuilder('AWAY PLAYER').build();
            const fixture = fixtureBuilder('2023-05-06T00:00:00')
                .homeSubmission((s: IFixtureBuilder) => s
                    .playing('HOME', 'AWAY')
                    .author('HOME CAPTAIN')
                    .withMatch((m: IMatchBuilder) => m.withHome(homePlayer).withAway(awayPlayer).scores(1, 2)))
                .awaySubmission((s: IFixtureBuilder) => s
                    .playing('HOME', 'AWAY')
                    .author('AWAY CAPTAIN')
                    .withMatch((m: IMatchBuilder) => m.withHome().withAway()))
                .build();
            await renderComponent({
                readOnly: false,
                matches: [matchBuilder().build()],
                matchIndex: 0,
                homeSubmission: fixture.homeSubmission,
                awaySubmission: fixture.awaySubmission,
                fixtureData: fixtureBuilder().build(),
                setFixtureData,
            });

            reportedError.verifyNoError();
            const homeSubmission = context.container.querySelector('td:nth-child(1)') as HTMLTableCellElement;
            expect(homeSubmission.colSpan).toEqual(2);
            expect(homeSubmission.textContent).toContain('from HOME CAPTAIN');
            expect(homeSubmission.textContent).toContain('HOME: 1 - AWAY: 2');
            expect(homeSubmission.textContent).toContain('HOME PLAYER vs AWAY PLAYER');
        });

        it('when home unmerged and readonly', async () => {
            const homePlayer = playerBuilder('HOME PLAYER').build();
            const awayPlayer = playerBuilder('AWAY PLAYER').build();
            const fixture = fixtureBuilder('2023-05-06T00:00:00')
                .homeSubmission((s: IFixtureBuilder) => s
                    .playing('HOME', 'AWAY')
                    .author('HOME CAPTAIN')
                    .withMatch((m: IMatchBuilder) => m.withHome(homePlayer).withAway(awayPlayer).scores(1, 2)))
                .awaySubmission((s: IFixtureBuilder) => s
                    .playing('HOME', 'AWAY')
                    .author('AWAY CAPTAIN')
                    .withMatch((m: IMatchBuilder) => m.withHome().withAway()))
                .build();
            await renderComponent({
                readOnly: true,
                matches: [matchBuilder().build()],
                matchIndex: 0,
                homeSubmission: fixture.homeSubmission,
                awaySubmission: fixture.awaySubmission,
                fixtureData: fixtureBuilder().build(),
                setFixtureData,
            });

            reportedError.verifyNoError();
            const homeSubmission = context.container.querySelector('td:nth-child(1)') as HTMLTableCellElement
            expect(homeSubmission.colSpan).toEqual(2);
            expect(homeSubmission.querySelector('button').disabled).toEqual(true);
        });

        it('when away unmerged', async () => {
            const homePlayer = playerBuilder('HOME PLAYER').build();
            const awayPlayer = playerBuilder('AWAY PLAYER').build();
            const fixture = fixtureBuilder('2023-05-06T00:00:00')
                .homeSubmission((s: IFixtureBuilder) => s
                    .playing('HOME', 'AWAY')
                    .author('HOME CAPTAIN')
                    .withMatch((m: IMatchBuilder) => m.withHome().withAway()))
                .awaySubmission((s: IFixtureBuilder) => s
                    .playing('HOME', 'AWAY')
                    .author('AWAY CAPTAIN')
                    .withMatch((m: IMatchBuilder) => m.withHome(homePlayer).withAway(awayPlayer).scores(1, 2)))
                .build();
            await renderComponent({
                readOnly: false,
                matches: [matchBuilder().build()],
                matchIndex: 0,
                homeSubmission: fixture.homeSubmission,
                awaySubmission: fixture.awaySubmission,
                fixtureData: fixtureBuilder().build(),
                setFixtureData,
            });

            reportedError.verifyNoError();
            const awaySubmission = context.container.querySelector('td:nth-child(3)') as HTMLTableCellElement
            expect(awaySubmission.colSpan).toEqual(2);
            expect(awaySubmission.textContent).toContain('from AWAY CAPTAIN');
            expect(awaySubmission.textContent).toContain('HOME: 1 - AWAY: 2');
            expect(awaySubmission.textContent).toContain('HOME PLAYER vs AWAY PLAYER');
        });

        it('when away unmerged and readonly', async () => {
            const homePlayer = playerBuilder('HOME PLAYER').build();
            const awayPlayer = playerBuilder('AWAY PLAYER').build();
            const fixture = fixtureBuilder('2023-05-06T00:00:00')
                .homeSubmission((s: IFixtureBuilder) => s
                    .playing('HOME', 'AWAY')
                    .author('HOME CAPTAIN')
                    .withMatch((m: IMatchBuilder) => m.withHome().withAway()))
                .awaySubmission((s: IFixtureBuilder) => s
                    .playing('HOME', 'AWAY')
                    .author('AWAY CAPTAIN')
                    .withMatch((m: IMatchBuilder) => m.withHome(homePlayer).withAway(awayPlayer).scores(1, 2)))
                .build();
            await renderComponent({
                readOnly: true,
                matches: [matchBuilder().build()],
                matchIndex: 0,
                homeSubmission: fixture.homeSubmission,
                awaySubmission: fixture.awaySubmission,
                fixtureData: fixtureBuilder().build(),
                setFixtureData,
            });

            reportedError.verifyNoError();
            const awaySubmission = context.container.querySelector('td:nth-child(3)') as HTMLTableCellElement;
            expect(awaySubmission.colSpan).toEqual(2);
            expect(awaySubmission.querySelector('button').disabled).toEqual(true);
        });
    });

    describe('interactivity', () => {
        it('can merge home submission', async () => {
            const homePlayer = playerBuilder('HOME PLAYER').build();
            const awayPlayer = playerBuilder('AWAY PLAYER').build();
            const fixture = fixtureBuilder('2023-05-06T00:00:00')
                .homeSubmission((s: IFixtureBuilder) => s
                    .playing('HOME', 'AWAY')
                    .author('HOME CAPTAIN')
                    .withMatch((m: IMatchBuilder) => m.withHome(homePlayer).withAway(awayPlayer).scores(1, 2)))
                .awaySubmission((s: IFixtureBuilder) => s
                    .playing('HOME', 'AWAY')
                    .author('AWAY CAPTAIN')
                    .withMatch((m: IMatchBuilder) => m.withHome().withAway()))
                .withMatch((m: IMatchBuilder) => m)
                .build();
            await renderComponent({
                readOnly: false,
                matches: [matchBuilder().build()],
                matchIndex: 0,
                homeSubmission: fixture.homeSubmission,
                awaySubmission: fixture.awaySubmission,
                fixtureData: fixtureBuilder()
                    .withMatch((m: IMatchBuilder) => m)
                    .playing('HOME', 'AWAY')
                    .build(),
                setFixtureData,
            });
            const homeSubmission = context.container.querySelector('td:nth-child(1)');

            await doClick(findButton(homeSubmission, 'Accept'));

            reportedError.verifyNoError();
            expect(updatedData.matches[0]).toEqual({
                awayPlayers: [awayPlayer],
                homePlayers: [homePlayer],
                awayScore: 2,
                homeScore: 1,
            });
        });

        it('can merge away submission', async () => {
            const homePlayer = playerBuilder('HOME PLAYER').build();
            const awayPlayer = playerBuilder('AWAY PLAYER').build();
            const fixture = fixtureBuilder('2023-05-06T00:00:00')
                .homeSubmission((s: IFixtureBuilder) => s
                    .playing('HOME', 'AWAY')
                    .author('HOME CAPTAIN')
                    .withMatch((m: IMatchBuilder) => m.withHome().withAway()))
                .awaySubmission((s: IFixtureBuilder) => s
                    .playing('HOME', 'AWAY')
                    .author('AWAY CAPTAIN')
                    .withMatch((m: IMatchBuilder) => m.withHome(homePlayer).withAway(awayPlayer).scores(1, 2)))
                .withMatch((m: IMatchBuilder) => m)
                .build();
            await renderComponent({
                readOnly: false,
                matches: [matchBuilder().build()],
                matchIndex: 0,
                homeSubmission: fixture.homeSubmission,
                awaySubmission: fixture.awaySubmission,
                fixtureData: fixtureBuilder()
                    .withMatch((m: IMatchBuilder) => m)
                    .playing('HOME', 'AWAY')
                    .build(),
                setFixtureData,
            });
            const awaySubmission = context.container.querySelector('td:nth-child(3)');

            await doClick(findButton(awaySubmission, 'Accept'));

            reportedError.verifyNoError();
            expect(updatedData.matches[0]).toEqual({
                awayPlayers: [awayPlayer],
                homePlayers: [homePlayer],
                awayScore: 2,
                homeScore: 1,
            });
        });

        it('can merge matching submissions', async () => {
            const homePlayer = playerBuilder('HOME PLAYER').build();
            const awayPlayer = playerBuilder('AWAY PLAYER').build();
            const fixture = fixtureBuilder('2023-05-06T00:00:00')
                .homeSubmission((s: IFixtureBuilder) => s
                    .playing('HOME', 'AWAY')
                    .author('HOME CAPTAIN')
                    .withMatch((m: IMatchBuilder) => m.withHome(homePlayer).withAway(awayPlayer).scores(1, 2)))
                .awaySubmission((s: IFixtureBuilder) => s
                    .playing('HOME', 'AWAY')
                    .author('AWAY CAPTAIN')
                    .withMatch((m: IMatchBuilder) => m.withHome(homePlayer).withAway(awayPlayer).scores(1, 2)))
                .withMatch((m: IMatchBuilder) => m)
                .build();
            await renderComponent({
                readOnly: false,
                matches: [matchBuilder().build()],
                matchIndex: 0,
                homeSubmission: fixture.homeSubmission,
                awaySubmission: fixture.awaySubmission,
                fixtureData: fixtureBuilder()
                    .withMatch((m: IMatchBuilder) => m)
                    .playing('HOME', 'AWAY')
                    .build(),
                setFixtureData,
            });
            const homeSubmission = context.container.querySelector('td:nth-child(1)');

            await doClick(findButton(homeSubmission, 'Accept'));

            reportedError.verifyNoError();
            expect(updatedData.matches[0]).toEqual({
                awayPlayers: [awayPlayer],
                homePlayers: [homePlayer],
                awayScore: 2,
                homeScore: 1,
            });
        });
    })
});