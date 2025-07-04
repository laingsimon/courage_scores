import {
    appProps,
    brandingProps,
    cleanUp,
    doClick,
    ErrorState,
    findButton,
    iocProps,
    renderApp,
    TestContext,
} from '../../helpers/tests';
import {
    IMergeHiCheckAnd180sProps,
    MergeHiCheckAnd180s,
} from './MergeHiCheckAnd180s';
import { GameDto } from '../../interfaces/models/dtos/Game/GameDto';
import { fixtureBuilder } from '../../helpers/builders/games';
import { playerBuilder } from '../../helpers/builders/players';

describe('MergeHiCheckAnd180s', () => {
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

    async function setFixtureData(newData: GameDto) {
        updatedData = newData;
    }

    async function renderComponent(props: IMergeHiCheckAnd180sProps) {
        context = await renderApp(
            iocProps(),
            brandingProps(),
            appProps({}, reportedError),
            <MergeHiCheckAnd180s {...props} />,
            undefined,
            undefined,
            'tbody',
        );
    }

    describe('one eighties', () => {
        describe('renders', () => {
            it('when home submissions not merged', async () => {
                const data = fixtureBuilder('2023-05-06')
                    .homeSubmission((s) =>
                        s.editor('HOME').with180(playerBuilder('NAME').build()),
                    )
                    .awaySubmission()
                    .build();
                const fixtureData = fixtureBuilder('2023-05-06').build();

                await renderComponent({ data, fixtureData, setFixtureData });

                reportedError.verifyNoError();
                const homeSubmission = context.container.querySelector(
                    'div[datatype="home-180s"]',
                )!;
                expect(homeSubmission).not.toBeNull();
                const oneEighties = Array.from(
                    homeSubmission.querySelectorAll('ol > li'),
                ).map((li) => li.textContent);
                expect(oneEighties).toEqual(['NAME']);
            });

            it('when away submissions not merged', async () => {
                const data = fixtureBuilder('2023-05-06')
                    .homeSubmission()
                    .awaySubmission((s) =>
                        s.editor('AWAY').with180(playerBuilder('NAME').build()),
                    )
                    .build();
                const fixtureData = fixtureBuilder('2023-05-06').build();

                await renderComponent({ data, fixtureData, setFixtureData });

                reportedError.verifyNoError();
                const awaySubmission = context.container.querySelector(
                    'div[datatype="away-180s"]',
                )!;
                expect(awaySubmission).not.toBeNull();
                const oneEighties = Array.from(
                    awaySubmission.querySelectorAll('ol > li'),
                ).map((li) => li.textContent);
                expect(oneEighties).toEqual(['NAME']);
            });

            it('when home and away submissions not present', async () => {
                const data = fixtureBuilder('2023-05-06')
                    .homeSubmission((s) => s.editor('HOME'))
                    .awaySubmission()
                    .build();
                const fixtureData = fixtureBuilder('2023-05-06').build();

                await renderComponent({ data, fixtureData, setFixtureData });

                reportedError.verifyNoError();
                const homeSubmission = context.container.querySelector(
                    'div[datatype="home-180s"]',
                );
                const awaySubmission = context.container.querySelector(
                    'div[datatype="away-180s"]',
                );
                expect(homeSubmission).toBeNull();
                expect(awaySubmission).toBeNull();
            });

            it('when submissions merged', async () => {
                const data = fixtureBuilder('2023-05-06')
                    .homeSubmission((s) =>
                        s
                            .editor('HOME')
                            .with180(playerBuilder('HOME NAME').build()),
                    )
                    .awaySubmission((s) =>
                        s
                            .editor('AWAY')
                            .with180(playerBuilder('AWAY NAME').build()),
                    )
                    .build();
                const fixtureData = fixtureBuilder('2023-05-06')
                    .with180(playerBuilder('MERGED').build())
                    .build();

                await renderComponent({ data, fixtureData, setFixtureData });

                reportedError.verifyNoError();
                const homeSubmission = context.container.querySelector(
                    'div[datatype="home-180s"]',
                );
                const awaySubmission = context.container.querySelector(
                    'div[datatype="away-180s"]',
                );
                expect(homeSubmission).toBeNull();
                expect(awaySubmission).toBeNull();
            });

            it('when no home submission', async () => {
                const data = fixtureBuilder('2023-05-06')
                    .awaySubmission((s) =>
                        s.editor('AWAY').with180(playerBuilder('NAME').build()),
                    )
                    .build();
                const fixtureData = fixtureBuilder('2023-05-06').build();

                await renderComponent({ data, fixtureData, setFixtureData });

                const homeSubmission = context.container.querySelector(
                    'div[datatype="home-180s"]',
                );
                const awaySubmission = context.container.querySelector(
                    'div[datatype="away-180s"]',
                );
                expect(homeSubmission).toBeNull();
                expect(awaySubmission).not.toBeNull();
            });

            it('when no away submission', async () => {
                const data = fixtureBuilder('2023-05-06')
                    .homeSubmission((s) =>
                        s.editor('HOME').with180(playerBuilder('NAME').build()),
                    )
                    .build();
                const fixtureData = fixtureBuilder('2023-05-06').build();

                await renderComponent({ data, fixtureData, setFixtureData });

                const homeSubmission = context.container.querySelector(
                    'div[datatype="home-180s"]',
                );
                const awaySubmission = context.container.querySelector(
                    'div[datatype="away-180s"]',
                );
                expect(homeSubmission).not.toBeNull();
                expect(awaySubmission).toBeNull();
            });

            it('when no submissions', async () => {
                const data = fixtureBuilder('2023-05-06').build();
                const fixtureData = fixtureBuilder('2023-05-06').build();

                await renderComponent({ data, fixtureData, setFixtureData });

                const homeSubmission = context.container.querySelector(
                    'div[datatype="home-180s"]',
                );
                const awaySubmission = context.container.querySelector(
                    'div[datatype="away-180s"]',
                );
                expect(homeSubmission).toBeNull();
                expect(awaySubmission).toBeNull();
            });
        });

        describe('interactivity', () => {
            it('can merge home submission', async () => {
                const player = playerBuilder('NAME').build();
                const data = fixtureBuilder('2023-05-06')
                    .homeSubmission((s) => s.editor('HOME').with180(player))
                    .awaySubmission((s) => s.editor('AWAY'))
                    .build();
                const fixtureData = fixtureBuilder('2023-05-06').build();
                await renderComponent({ data, fixtureData, setFixtureData });
                const homeSubmission = context.container.querySelector(
                    'div[datatype="home-180s"]',
                );

                await doClick(findButton(homeSubmission, 'Merge'));

                reportedError.verifyNoError();
                expect(updatedData).not.toBeNull();
                expect(updatedData!.oneEighties).toEqual([player]);
            });

            it('can merge away submission', async () => {
                const player = playerBuilder('NAME').build();
                const data = fixtureBuilder('2023-05-06')
                    .homeSubmission((s) => s.editor('HOME'))
                    .awaySubmission((s) => s.editor('AWAY').with180(player))
                    .build();
                const fixtureData = fixtureBuilder('2023-05-06').build();
                await renderComponent({ data, fixtureData, setFixtureData });
                const awaySubmission = context.container.querySelector(
                    'div[datatype="away-180s"]',
                );

                await doClick(findButton(awaySubmission, 'Merge'));

                reportedError.verifyNoError();
                expect(updatedData).not.toBeNull();
                expect(updatedData!.oneEighties).toEqual([player]);
            });
        });
    });

    describe('hi-checks', () => {
        describe('renders', () => {
            it('when home submissions not merged', async () => {
                const data = fixtureBuilder('2023-05-06')
                    .homeSubmission((s) =>
                        s
                            .editor('HOME')
                            .withHiCheck(playerBuilder('NAME').build(), 120),
                    )
                    .awaySubmission((s) => s.editor('AWAY'))
                    .build();
                const fixtureData = fixtureBuilder('2023-05-06').build();

                await renderComponent({ data, fixtureData, setFixtureData });

                reportedError.verifyNoError();
                const homeSubmission = context.container.querySelector(
                    'div[datatype="home-hichecks"]',
                )!;
                expect(homeSubmission).not.toBeNull();
                const hiChecks = Array.from(
                    homeSubmission.querySelectorAll('ol > li'),
                ).map((li) => li.textContent);
                expect(hiChecks).toEqual(['NAME (120)']);
            });

            it('when away submissions not merged', async () => {
                const data = fixtureBuilder('2023-05-06')
                    .homeSubmission((s) => s.editor('HOME'))
                    .awaySubmission((s) =>
                        s
                            .editor('AWAY')
                            .withHiCheck(playerBuilder('NAME').build(), 120),
                    )
                    .build();
                const fixtureData = fixtureBuilder('2023-05-06').build();

                await renderComponent({ data, fixtureData, setFixtureData });

                reportedError.verifyNoError();
                const awaySubmission = context.container.querySelector(
                    'div[datatype="away-hichecks"]',
                )!;
                expect(awaySubmission).not.toBeNull();
                const hiChecks = Array.from(
                    awaySubmission.querySelectorAll('ol > li'),
                ).map((li) => li.textContent);
                expect(hiChecks).toEqual(['NAME (120)']);
            });

            it('when home and away submissions not present', async () => {
                const data = fixtureBuilder('2023-05-06')
                    .homeSubmission((s) => s.editor('HOME'))
                    .awaySubmission((s) => s.editor('AWAY'))
                    .build();
                const fixtureData = fixtureBuilder('2023-05-06').build();

                await renderComponent({ data, fixtureData, setFixtureData });

                reportedError.verifyNoError();
                const homeSubmission = context.container.querySelector(
                    'div[datatype="home-hichecks"]',
                );
                const awaySubmission = context.container.querySelector(
                    'div[datatype="away-hichecks"]',
                );
                expect(homeSubmission).toBeNull();
                expect(awaySubmission).toBeNull();
            });

            it('when submissions merged', async () => {
                const data = fixtureBuilder('2023-05-06')
                    .homeSubmission((s) =>
                        s
                            .editor('HOME')
                            .withHiCheck(
                                playerBuilder('HOME NAME').build(),
                                120,
                            ),
                    )
                    .awaySubmission((s) =>
                        s
                            .editor('AWAY')
                            .withHiCheck(
                                playerBuilder('AWAY NAME').build(),
                                120,
                            ),
                    )
                    .build();
                const fixtureData = fixtureBuilder('2023-05-06')
                    .withHiCheck(playerBuilder('MERGED').build(), 120)
                    .build();

                await renderComponent({ data, fixtureData, setFixtureData });

                reportedError.verifyNoError();
                const homeSubmission = context.container.querySelector(
                    'div[datatype="home-hichecks"]',
                );
                const awaySubmission = context.container.querySelector(
                    'div[datatype="away-hichecks"]',
                );
                expect(homeSubmission).toBeNull();
                expect(awaySubmission).toBeNull();
            });

            it('when no home submission', async () => {
                const data = fixtureBuilder('2023-05-06')
                    .awaySubmission((s) =>
                        s
                            .editor('AWAY')
                            .withHiCheck(playerBuilder('NAME').build(), 100),
                    )
                    .build();
                const fixtureData = fixtureBuilder('2023-05-06').build();

                await renderComponent({ data, fixtureData, setFixtureData });

                const homeSubmission = context.container.querySelector(
                    'div[datatype="home-hichecks"]',
                );
                const awaySubmission = context.container.querySelector(
                    'div[datatype="away-hichecks"]',
                );
                expect(homeSubmission).toBeNull();
                expect(awaySubmission).not.toBeNull();
            });

            it('when no away submission', async () => {
                const data = fixtureBuilder('2023-05-06')
                    .homeSubmission((s) =>
                        s
                            .editor('HOME')
                            .withHiCheck(playerBuilder('NAME').build(), 100),
                    )
                    .build();
                const fixtureData = fixtureBuilder('2023-05-06').build();

                await renderComponent({ data, fixtureData, setFixtureData });

                const homeSubmission = context.container.querySelector(
                    'div[datatype="home-hichecks"]',
                );
                const awaySubmission = context.container.querySelector(
                    'div[datatype="away-hichecks"]',
                );
                expect(homeSubmission).not.toBeNull();
                expect(awaySubmission).toBeNull();
            });

            it('when no submissions', async () => {
                const data = fixtureBuilder('2023-05-06').build();
                const fixtureData = fixtureBuilder('2023-05-06').build();

                await renderComponent({ data, fixtureData, setFixtureData });

                const homeSubmission = context.container.querySelector(
                    'div[datatype="home-hichecks"]',
                );
                const awaySubmission = context.container.querySelector(
                    'div[datatype="away-hichecks"]',
                );
                expect(homeSubmission).toBeNull();
                expect(awaySubmission).toBeNull();
            });
        });

        describe('interactivity', () => {
            it('can merge home submission', async () => {
                const player = playerBuilder('NAME').score(120).build();
                const data = fixtureBuilder('2023-05-06')
                    .homeSubmission((s) =>
                        s.editor('HOME').withHiCheck(player, 120),
                    )
                    .awaySubmission((s) => s.editor('AWAY'))
                    .build();
                const fixtureData = fixtureBuilder('2023-05-06').build();
                await renderComponent({ data, fixtureData, setFixtureData });
                const homeSubmission = context.container.querySelector(
                    'div[datatype="home-hichecks"]',
                );

                await doClick(findButton(homeSubmission, 'Merge'));

                reportedError.verifyNoError();
                expect(updatedData).not.toBeNull();
                expect(updatedData!.over100Checkouts).toEqual([player]);
            });

            it('can merge away submission', async () => {
                const player = playerBuilder('NAME').score(120).build();
                const data = fixtureBuilder('2023-05-06')
                    .homeSubmission((s) => s.editor('HOME'))
                    .awaySubmission((s) =>
                        s.editor('AWAY').withHiCheck(player, 120),
                    )
                    .build();
                const fixtureData = fixtureBuilder('2023-05-06').build();
                await renderComponent({ data, fixtureData, setFixtureData });
                const awaySubmission = context.container.querySelector(
                    'div[datatype="away-hichecks"]',
                )!;

                await doClick(findButton(awaySubmission, 'Merge'));

                reportedError.verifyNoError();
                expect(updatedData).not.toBeNull();
                expect(updatedData!.over100Checkouts).toEqual([player]);
            });
        });
    });
});
