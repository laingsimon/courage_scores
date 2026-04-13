import {
    appProps,
    brandingProps,
    cleanUp,
    ErrorState,
    iocProps,
    renderApp,
    TestContext,
} from '../../helpers/tests';
import { IMergeMatchProps, MergeMatch } from './MergeMatch';
import { GameDto } from '../../interfaces/models/dtos/Game/GameDto';
import { fixtureBuilder, matchBuilder } from '../../helpers/builders/games';
import { playerBuilder } from '../../helpers/builders/players';
import { GameMatchDto } from '../../interfaces/models/dtos/Game/GameMatchDto';

describe('MergeMatch', () => {
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

    async function setFixtureData(data: GameDto) {
        updatedData = data;
    }

    async function renderComponent(props: IMergeMatchProps) {
        context = await renderApp(
            iocProps(),
            brandingProps(),
            appProps({}, reportedError),
            <MergeMatch {...props} />,
            undefined,
            undefined,
            'tbody',
        );
    }

    describe('renders', () => {
        it('when published', async () => {
            const match = matchBuilder()
                .withHome(playerBuilder('HOME PLAYER').build())
                .withAway(playerBuilder('AWAY PLAYER').build())
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
            expect(context.html()).toEqual('');
        });

        it('when home and away submissions match', async () => {
            const match: GameMatchDto = matchBuilder().build();
            const fixture = fixtureBuilder('2023-05-06T00:00:00')
                .homeSubmission((s) =>
                    s
                        .playing('HOME', 'AWAY')
                        .withMatch((m) => m.withHome().withAway().scores(1, 2)),
                )
                .awaySubmission((s) =>
                    s
                        .playing('HOME', 'AWAY')
                        .withMatch((m) => m.withHome().withAway().scores(1, 2)),
                )
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
            const td = context.required('td');
            expect(td.element<HTMLTableCellElement>().colSpan).toEqual(5);
            expect(td.optional('button')).toBeTruthy();
            expect(td.required('span > div').text()).toEqual(
                'HOME: 1 - AWAY: 2',
            );
        });

        it('when home and away submissions match and readonly', async () => {
            const match: GameMatchDto = matchBuilder().build();
            const fixture = fixtureBuilder('2023-05-06T00:00:00')
                .homeSubmission((s) =>
                    s
                        .playing('HOME', 'AWAY')
                        .withMatch((m) => m.withHome().withAway().scores(1, 2)),
                )
                .awaySubmission((s) =>
                    s
                        .playing('HOME', 'AWAY')
                        .withMatch((m) => m.withHome().withAway().scores(1, 2)),
                )
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
            const td = context.required('td');
            expect(td.element<HTMLTableCellElement>().colSpan).toEqual(5);
            expect(td.optional('button')).toBeTruthy();
            expect(td.required('span > div').text()).toEqual(
                'HOME: 1 - AWAY: 2',
            );
            expect(
                td.required('button').element<HTMLButtonElement>().disabled,
            ).toEqual(true);
        });

        it('when home but no away submission match', async () => {
            const match: GameMatchDto = matchBuilder().build();
            const fixture = fixtureBuilder('2023-05-06T00:00:00')
                .homeSubmission((s) =>
                    s
                        .playing('HOME', 'AWAY')
                        .withMatch((m) => m.withHome().withAway().scores(1, 2)),
                )
                .awaySubmission((s) => s.playing('HOME', 'AWAY'))
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
            const td = context.required('td:nth-child(3)');
            expect(td.element<HTMLTableCellElement>().colSpan).toEqual(2);
            expect(td.required('span').text()).toEqual('No match');
        });

        it('when nothing to merge for either home or away', async () => {
            const fixture = fixtureBuilder('2023-05-06T00:00:00')
                .homeSubmission((s) =>
                    s.author('HOME CAPTAIN').playing('HOME', 'AWAY'),
                )
                .awaySubmission((s) =>
                    s.author('AWAY CAPTAIN').playing('HOME', 'AWAY'),
                )
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
            expect(context.html()).toEqual('');
        });

        it('when home unmerged', async () => {
            const homePlayer = playerBuilder('HOME PLAYER').build();
            const awayPlayer = playerBuilder('AWAY PLAYER').build();
            const fixture = fixtureBuilder('2023-05-06T00:00:00')
                .homeSubmission((s) =>
                    s
                        .playing('HOME', 'AWAY')
                        .author('HOME CAPTAIN')
                        .withMatch((m) =>
                            m
                                .withHome(homePlayer)
                                .withAway(awayPlayer)
                                .scores(1, 2),
                        ),
                )
                .awaySubmission((s) =>
                    s
                        .playing('HOME', 'AWAY')
                        .author('AWAY CAPTAIN')
                        .withMatch((m) => m.withHome().withAway()),
                )
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
            const homeSubmission = context.required('td:nth-child(1)');
            expect(
                homeSubmission.element<HTMLTableCellElement>().colSpan,
            ).toEqual(2);
            expect(homeSubmission.text()).toContain('from HOME CAPTAIN');
            expect(homeSubmission.text()).toContain('HOME: 1 - AWAY: 2');
            expect(homeSubmission.text()).toContain(
                'HOME PLAYER vs AWAY PLAYER',
            );
        });

        it('when home unmerged and readonly', async () => {
            const homePlayer = playerBuilder('HOME PLAYER').build();
            const awayPlayer = playerBuilder('AWAY PLAYER').build();
            const fixture = fixtureBuilder('2023-05-06T00:00:00')
                .homeSubmission((s) =>
                    s
                        .playing('HOME', 'AWAY')
                        .author('HOME CAPTAIN')
                        .withMatch((m) =>
                            m
                                .withHome(homePlayer)
                                .withAway(awayPlayer)
                                .scores(1, 2),
                        ),
                )
                .awaySubmission((s) =>
                    s
                        .playing('HOME', 'AWAY')
                        .author('AWAY CAPTAIN')
                        .withMatch((m) => m.withHome().withAway()),
                )
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
            const homeSubmission = context.required('td:nth-child(1)');
            expect(
                homeSubmission.element<HTMLTableCellElement>().colSpan,
            ).toEqual(2);
            expect(
                homeSubmission.required('button').element<HTMLButtonElement>()
                    .disabled,
            ).toEqual(true);
        });

        it('when away unmerged', async () => {
            const homePlayer = playerBuilder('HOME PLAYER').build();
            const awayPlayer = playerBuilder('AWAY PLAYER').build();
            const fixture = fixtureBuilder('2023-05-06T00:00:00')
                .homeSubmission((s) =>
                    s
                        .playing('HOME', 'AWAY')
                        .author('HOME CAPTAIN')
                        .withMatch((m) => m.withHome().withAway()),
                )
                .awaySubmission((s) =>
                    s
                        .playing('HOME', 'AWAY')
                        .author('AWAY CAPTAIN')
                        .withMatch((m) =>
                            m
                                .withHome(homePlayer)
                                .withAway(awayPlayer)
                                .scores(1, 2),
                        ),
                )
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
            const awaySubmission = context.required('td:nth-child(3)');
            expect(
                awaySubmission.element<HTMLTableCellElement>().colSpan,
            ).toEqual(2);
            expect(awaySubmission.text()).toContain('from AWAY CAPTAIN');
            expect(awaySubmission.text()).toContain('HOME: 1 - AWAY: 2');
            expect(awaySubmission.text()).toContain(
                'HOME PLAYER vs AWAY PLAYER',
            );
        });

        it('when away unmerged and readonly', async () => {
            const homePlayer = playerBuilder('HOME PLAYER').build();
            const awayPlayer = playerBuilder('AWAY PLAYER').build();
            const fixture = fixtureBuilder('2023-05-06T00:00:00')
                .homeSubmission((s) =>
                    s
                        .playing('HOME', 'AWAY')
                        .author('HOME CAPTAIN')
                        .withMatch((m) => m.withHome().withAway()),
                )
                .awaySubmission((s) =>
                    s
                        .playing('HOME', 'AWAY')
                        .author('AWAY CAPTAIN')
                        .withMatch((m) =>
                            m
                                .withHome(homePlayer)
                                .withAway(awayPlayer)
                                .scores(1, 2),
                        ),
                )
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
            const awaySubmission = context.required('td:nth-child(3)');
            expect(
                awaySubmission.element<HTMLTableCellElement>().colSpan,
            ).toEqual(2);
            expect(
                awaySubmission.required('button').element<HTMLButtonElement>()
                    .disabled,
            ).toEqual(true);
        });
    });

    describe('interactivity', () => {
        it('can merge home submission', async () => {
            const homePlayer = playerBuilder('HOME PLAYER').build();
            const awayPlayer = playerBuilder('AWAY PLAYER').build();
            const fixture = fixtureBuilder('2023-05-06T00:00:00')
                .homeSubmission((s) =>
                    s
                        .playing('HOME', 'AWAY')
                        .author('HOME CAPTAIN')
                        .withMatch((m) =>
                            m
                                .withHome(homePlayer)
                                .withAway(awayPlayer)
                                .scores(1, 2),
                        ),
                )
                .awaySubmission((s) =>
                    s
                        .playing('HOME', 'AWAY')
                        .author('AWAY CAPTAIN')
                        .withMatch((m) => m.withHome().withAway()),
                )
                .withMatch((m) => m)
                .build();
            await renderComponent({
                readOnly: false,
                matches: [matchBuilder().build()],
                matchIndex: 0,
                homeSubmission: fixture.homeSubmission,
                awaySubmission: fixture.awaySubmission,
                fixtureData: fixtureBuilder()
                    .withMatch((m) => m)
                    .playing('HOME', 'AWAY')
                    .build(),
                setFixtureData,
            });

            await context.required('td:nth-child(1)').button('Accept').click();

            reportedError.verifyNoError();
            expect(updatedData!.matches![0]).toEqual({
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
                .homeSubmission((s) =>
                    s
                        .playing('HOME', 'AWAY')
                        .author('HOME CAPTAIN')
                        .withMatch((m) => m.withHome().withAway()),
                )
                .awaySubmission((s) =>
                    s
                        .playing('HOME', 'AWAY')
                        .author('AWAY CAPTAIN')
                        .withMatch((m) =>
                            m
                                .withHome(homePlayer)
                                .withAway(awayPlayer)
                                .scores(1, 2),
                        ),
                )
                .withMatch((m) => m)
                .build();
            await renderComponent({
                readOnly: false,
                matches: [matchBuilder().build()],
                matchIndex: 0,
                homeSubmission: fixture.homeSubmission,
                awaySubmission: fixture.awaySubmission,
                fixtureData: fixtureBuilder()
                    .withMatch((m) => m)
                    .playing('HOME', 'AWAY')
                    .build(),
                setFixtureData,
            });

            await context.required('td:nth-child(3)').button('Accept').click();

            reportedError.verifyNoError();
            expect(updatedData!.matches![0]).toEqual({
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
                .homeSubmission((s) =>
                    s
                        .playing('HOME', 'AWAY')
                        .author('HOME CAPTAIN')
                        .withMatch((m) =>
                            m
                                .withHome(homePlayer)
                                .withAway(awayPlayer)
                                .scores(1, 2),
                        ),
                )
                .awaySubmission((s) =>
                    s
                        .playing('HOME', 'AWAY')
                        .author('AWAY CAPTAIN')
                        .withMatch((m) =>
                            m
                                .withHome(homePlayer)
                                .withAway(awayPlayer)
                                .scores(1, 2),
                        ),
                )
                .withMatch((m) => m)
                .build();
            await renderComponent({
                readOnly: false,
                matches: [matchBuilder().build()],
                matchIndex: 0,
                homeSubmission: fixture.homeSubmission,
                awaySubmission: fixture.awaySubmission,
                fixtureData: fixtureBuilder()
                    .withMatch((m) => m)
                    .playing('HOME', 'AWAY')
                    .build(),
                setFixtureData,
            });

            await context.required('td:nth-child(1)').button('Accept').click();

            reportedError.verifyNoError();
            expect(updatedData!.matches![0]).toEqual({
                awayPlayers: [awayPlayer],
                homePlayers: [homePlayer],
                awayScore: 2,
                homeScore: 1,
            });
        });
    });
});
