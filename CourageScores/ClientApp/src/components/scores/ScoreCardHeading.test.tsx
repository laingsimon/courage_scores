import {
    appProps,
    brandingProps,
    cleanUp,
    IComponent,
    iocProps,
    renderApp,
    TestContext,
    user,
} from '../../helpers/tests';
import { IScoreCardHeadingProps, ScoreCardHeading } from './ScoreCardHeading';
import {
    ILeagueFixtureContainerProps,
    LeagueFixtureContainer,
} from './LeagueFixtureContainer';
import { renderDate } from '../../helpers/rendering';
import { GameDto } from '../../interfaces/models/dtos/Game/GameDto';
import { TeamDto } from '../../interfaces/models/dtos/Team/TeamDto';
import { UserDto } from '../../interfaces/models/dtos/Identity/UserDto';
import { DivisionDto } from '../../interfaces/models/dtos/DivisionDto';
import { SeasonDto } from '../../interfaces/models/dtos/Season/SeasonDto';
import { GameTeamDto } from '../../interfaces/models/dtos/Game/GameTeamDto';
import { fixtureBuilder } from '../../helpers/builders/games';
import { divisionBuilder } from '../../helpers/builders/divisions';
import { seasonBuilder } from '../../helpers/builders/seasons';
import { teamBuilder } from '../../helpers/builders/teams';
import { playerBuilder } from '../../helpers/builders/players';

describe('ScoreCardHeading', () => {
    let context: TestContext;
    let updatedFixtureData: GameDto | null;
    let updatedSubmission: string | null;
    async function setFixtureData(newFixtureData: GameDto) {
        updatedFixtureData = newFixtureData;
    }
    async function setSubmission(newSubmission: string) {
        updatedSubmission = newSubmission;
    }

    afterEach(async () => {
        await cleanUp(context);
    });

    beforeEach(() => {
        updatedFixtureData = null;
        updatedSubmission = null;
    });

    async function renderComponent(
        containerProps: ILeagueFixtureContainerProps,
        props: IScoreCardHeadingProps,
        account?: UserDto,
        teams?: TeamDto[],
    ) {
        context = await renderApp(
            iocProps(),
            brandingProps(),
            appProps({
                account,
                teams: teams || [],
            }),
            <LeagueFixtureContainer {...containerProps}>
                <ScoreCardHeading {...props} />
            </LeagueFixtureContainer>,
            undefined,
            undefined,
            'table',
        );
    }

    function headingCell(home?: boolean): IComponent {
        return context.required(`thead > tr > td:nth-child(${home ? 1 : 3})`);
    }

    function assertToggleNotShown(home?: boolean) {
        const heading = headingCell(home);
        const headingLink = heading.required('a');
        expect(headingLink.text()).toContain(home ? 'HOME' : 'AWAY');
        expect(heading.all('span').length).toEqual(0);
    }

    function assertToggleShown(home: boolean, text: string) {
        const heading = headingCell(home);
        const toggleButton = heading.required('.btn');
        expect(toggleButton.text()).toContain(home ? 'HOME' : 'AWAY');
        expect(toggleButton.text()).toContain('📬');
        expect(toggleButton.text()).toContain(text);
    }

    async function assertRevertToFixtureData(home: boolean, data: GameDto) {
        const heading = headingCell(home);

        await heading.required('span').click();

        expect(updatedSubmission).toBeUndefined();
        expect(updatedFixtureData).toEqual(data);
    }

    async function assertDisplayOfSubmissionData(home: boolean, data: GameDto) {
        const heading = headingCell(home);

        await heading.required('span').click();

        expect(updatedSubmission).toEqual(home ? 'home' : 'away');
        expect(updatedFixtureData).toEqual(
            home ? data.homeSubmission : data.awaySubmission,
        );
    }

    function assertWinner(winner: 'home' | 'away' | '') {
        const homeHeading = context.required('thead > tr > td:nth-child(1)');
        const awayHeading = context.required('thead > tr > td:nth-child(3)');

        if (winner === 'home') {
            expect(homeHeading.className()).toContain('bg-winner');
        } else {
            expect(homeHeading.className()).not.toContain('bg-winner');
        }

        if (winner === 'away') {
            expect(awayHeading.className()).toContain('bg-winner');
        } else {
            expect(awayHeading.className()).not.toContain('bg-winner');
        }
    }

    function assertLinkAddress(
        home: boolean,
        data: GameDto,
        fixtureData: ILeagueFixtureContainerProps,
    ) {
        const team: GameTeamDto = home ? data.home : data.away;
        const heading = headingCell(home);
        const linkToTeam = heading.required('a').element<HTMLAnchorElement>();
        expect(linkToTeam.href).toContain(
            `/division/${fixtureData.division.name}/team:${team.name}/${fixtureData.season.name}`,
        );
    }

    function assertLinkText(home: boolean, text: string) {
        const heading = headingCell(home);
        expect(heading.required('a').text()).toEqual(text);
    }

    function props(a: string, sd: GameDto, s?: string): IScoreCardHeadingProps {
        return {
            access: a,
            submission: s,
            setSubmission,
            setFixtureData,
            data: sd,
        };
    }

    function leagueFixtureContainerProps(
        sd: GameDto,
        c?: Partial<ILeagueFixtureContainerProps>,
    ) {
        return {
            division: divisionBuilder('DIVISION', sd.divisionId).build(),
            season: seasonBuilder('SEASON', sd.seasonId).build(),
            home: null!,
            away: null!,
            disabled: false,
            readOnly: false,
            awayPlayers: [],
            homePlayers: [],
            ...c,
        };
    }

    describe('when logged out', () => {
        const division: DivisionDto = divisionBuilder('DIVISION').build();
        const season: SeasonDto = seasonBuilder('SEASON').build();
        const homePlayer = playerBuilder('HOME PLAYER').build();
        const awayPlayer = playerBuilder('AWAY PLAYER').build();

        describe('when no winner', () => {
            const submissionData = fixtureBuilder()
                .forSeason(season)
                .forDivision(division)
                .playing('HOME', 'AWAY')
                .homeSubmission()
                .awaySubmission()
                .build();
            const fixtureData = leagueFixtureContainerProps(submissionData);

            it('renders home team details', async () => {
                await renderComponent(fixtureData, props('', submissionData));

                assertLinkAddress(true, submissionData, fixtureData);
                assertLinkText(true, 'HOME - 0');
                assertWinner('');
                assertToggleNotShown(true);
            });

            it('renders away team details', async () => {
                await renderComponent(fixtureData, props('', submissionData));

                assertLinkAddress(false, submissionData, fixtureData);
                assertLinkText(false, '0 - AWAY');
                assertWinner('');
                assertToggleNotShown(false);
            });
        });

        describe('when home winner', () => {
            const submissionData = fixtureBuilder()
                .forSeason(season)
                .forDivision(division)
                .playing('HOME', 'AWAY')
                .homeSubmission()
                .awaySubmission()
                .withMatch((m) =>
                    m.withHome(homePlayer).withAway(awayPlayer).scores(2, 1),
                )
                .withMatch((m) =>
                    m.withHome(homePlayer).withAway(awayPlayer).scores(3, 1),
                )
                .withMatch((m) =>
                    m.withHome(homePlayer).withAway(awayPlayer).scores(4, 1),
                )
                .withMatchOption((o) => o.numberOfLegs(3))
                .withMatchOption((o) => o.numberOfLegs(5))
                .withMatchOption((o) => o.numberOfLegs(7))
                .build();
            const fixtureData = leagueFixtureContainerProps(submissionData);

            it('renders home team details', async () => {
                await renderComponent(fixtureData, props('', submissionData));

                assertLinkAddress(true, submissionData, fixtureData);
                assertLinkText(true, 'HOME - 3');
                assertWinner('home');
                assertToggleNotShown(true);
            });

            it('renders away team details', async () => {
                await renderComponent(fixtureData, props('', submissionData));

                assertLinkAddress(false, submissionData, fixtureData);
                assertLinkText(false, '0 - AWAY');
                assertWinner('home');
                assertToggleNotShown(false);
            });
        });

        describe('when away winner', () => {
            const submissionData = fixtureBuilder()
                .forSeason(season)
                .forDivision(division)
                .playing('HOME', 'AWAY')
                .homeSubmission()
                .awaySubmission()
                .withMatch((m) =>
                    m.withHome(homePlayer).withAway(awayPlayer).scores(1, 2),
                )
                .withMatch((m) =>
                    m.withHome(homePlayer).withAway(awayPlayer).scores(1, 3),
                )
                .withMatch((m) =>
                    m.withHome(homePlayer).withAway(awayPlayer).scores(1, 4),
                )
                .withMatchOption((o) => o.numberOfLegs(3))
                .withMatchOption((o) => o.numberOfLegs(5))
                .withMatchOption((o) => o.numberOfLegs(7))
                .build();
            const fixtureData = leagueFixtureContainerProps(submissionData);

            it('renders home team details', async () => {
                await renderComponent(fixtureData, props('', submissionData));

                assertLinkAddress(true, submissionData, fixtureData);
                assertLinkText(true, 'HOME - 0');
                assertWinner('away');
                assertToggleNotShown(true);
            });

            it('renders away team details', async () => {
                await renderComponent(fixtureData, props('', submissionData));

                assertLinkAddress(false, submissionData, fixtureData);
                assertLinkText(false, '3 - AWAY');
                assertWinner('away');
                assertToggleNotShown(false);
            });
        });
    });

    describe('when an admin', () => {
        const team: TeamDto = teamBuilder('TEAM').build();
        const account: UserDto = user({}, team.id);
        const division: DivisionDto = divisionBuilder('DIVISION').build();
        const season: SeasonDto = seasonBuilder('SEASON').build();
        const homePlayer = playerBuilder('HOME PLAYER').build();
        const awayPlayer = playerBuilder('AWAY PLAYER').build();

        describe('when no home or away submission', () => {
            const submissionData = fixtureBuilder()
                .forSeason(season)
                .forDivision(division)
                .playing('HOME', 'AWAY')
                .build();
            const fixtureData = leagueFixtureContainerProps(submissionData);

            it('does not show home submission toggle', async () => {
                await renderComponent(
                    fixtureData,
                    props('admin', submissionData),
                    account,
                );

                assertToggleNotShown(true);
            });

            it('does not show away submission toggle', async () => {
                await renderComponent(
                    fixtureData,
                    props('admin', submissionData),
                    account,
                );

                assertToggleNotShown(false);
            });
        });

        describe('when a home submission', () => {
            const submissionData = fixtureBuilder()
                .forSeason(season)
                .forDivision(division)
                .playing('HOME', 'AWAY')
                .homeSubmission((f) =>
                    f
                        .withMatch((m) =>
                            m
                                .withHome(homePlayer)
                                .withAway(awayPlayer)
                                .scores(3, 1),
                        )
                        .withMatch((m) =>
                            m
                                .withHome(homePlayer)
                                .withAway(awayPlayer)
                                .scores(3, 1),
                        )
                        .withMatch((m) =>
                            m
                                .withHome(homePlayer)
                                .withAway(awayPlayer)
                                .scores(3, 1),
                        )
                        .withMatch((m) =>
                            m
                                .withHome(homePlayer)
                                .withAway(awayPlayer)
                                .scores(1, 3),
                        )
                        .withMatch((m) =>
                            m
                                .withHome(homePlayer)
                                .withAway(awayPlayer)
                                .scores(1, 3),
                        ),
                )
                .withMatch((m) =>
                    m.withHome(homePlayer).withAway(awayPlayer).scores(2, 1),
                )
                .withMatch((m) =>
                    m.withHome(homePlayer).withAway(awayPlayer).scores(2, 1),
                )
                .withMatch((m) =>
                    m.withHome(homePlayer).withAway(awayPlayer).scores(2, 1),
                )
                .withMatch((m) =>
                    m.withHome(homePlayer).withAway(awayPlayer).scores(1, 2),
                )
                .build();
            const fixtureData = leagueFixtureContainerProps(submissionData);

            it('shows unpublished alert when submission team identified', async () => {
                const updated = '2023-04-05';
                submissionData['homeSubmission']!.editor = 'EDITOR';
                submissionData['homeSubmission']!.updated = updated;

                await renderComponent(
                    fixtureData,
                    props('admin', submissionData, 'home'),
                    account,
                    [team],
                );

                const alert = context.required('.alert');
                expect(alert.text()).toContain(
                    'You are viewing the submission from HOME, created by EDITOR as of ' +
                        renderDate(updated),
                );
            });

            it('shows home submission toggle', async () => {
                await renderComponent(
                    fixtureData,
                    props('admin', submissionData),
                    account,
                );

                assertToggleShown(true, 'HOME (3-2)');
            });

            it('clicking toggle switches to submission and data', async () => {
                await renderComponent(
                    fixtureData,
                    props('admin', submissionData),
                    account,
                );

                await assertDisplayOfSubmissionData(true, submissionData);
            });

            it('clicking toggle reverts fixture data', async () => {
                await renderComponent(
                    fixtureData,
                    props('admin', submissionData, 'home'),
                    account,
                );

                await assertRevertToFixtureData(true, submissionData);
            });
        });

        describe('when an away submission', () => {
            const submissionData = fixtureBuilder()
                .forSeason(season)
                .forDivision(division)
                .playing('HOME', 'AWAY')
                .homeSubmission()
                .awaySubmission((f) =>
                    f
                        .withMatch((m) =>
                            m
                                .withHome(homePlayer)
                                .withAway(awayPlayer)
                                .scores(3, 1),
                        )
                        .withMatch((m) =>
                            m
                                .withHome(homePlayer)
                                .withAway(awayPlayer)
                                .scores(3, 1),
                        )
                        .withMatch((m) =>
                            m
                                .withHome(homePlayer)
                                .withAway(awayPlayer)
                                .scores(3, 1),
                        )
                        .withMatch((m) =>
                            m
                                .withHome(homePlayer)
                                .withAway(awayPlayer)
                                .scores(1, 3),
                        )
                        .withMatch((m) =>
                            m
                                .withHome(homePlayer)
                                .withAway(awayPlayer)
                                .scores(1, 3),
                        ),
                )
                .withMatch((m) =>
                    m.withHome(homePlayer).withAway(awayPlayer).scores(2, 1),
                )
                .withMatch((m) =>
                    m.withHome(homePlayer).withAway(awayPlayer).scores(2, 1),
                )
                .withMatch((m) =>
                    m.withHome(homePlayer).withAway(awayPlayer).scores(2, 1),
                )
                .withMatch((m) =>
                    m.withHome(homePlayer).withAway(awayPlayer).scores(1, 2),
                )
                .build();
            const fixtureData = leagueFixtureContainerProps(submissionData);

            it('shows away submission toggle', async () => {
                await renderComponent(
                    fixtureData,
                    props('admin', submissionData),
                    account,
                );

                assertToggleShown(false, 'AWAY (3-2)');
            });

            it('clicking toggle switches to submission and data', async () => {
                await renderComponent(
                    fixtureData,
                    props('admin', submissionData),
                    account,
                );

                await assertDisplayOfSubmissionData(false, submissionData);
            });

            it('clicking toggle reverts fixture data', async () => {
                await renderComponent(
                    fixtureData,
                    props('admin', submissionData, 'away'),
                    account,
                );

                await assertRevertToFixtureData(false, submissionData);
            });
        });
    });

    describe('when a clerk', () => {
        const team: TeamDto = teamBuilder('TEAM').build();
        const account: UserDto = user({}, team.id);
        const division: DivisionDto = divisionBuilder('DIVISION').build();
        const season: SeasonDto = seasonBuilder('SEASON').build();
        const homePlayer = playerBuilder('HOME PLAYER').build();
        const awayPlayer = playerBuilder('AWAY PLAYER').build();

        describe('for a different team', () => {
            describe('when no home or away submission', () => {
                const submissionData = fixtureBuilder()
                    .forSeason(season)
                    .forDivision(division)
                    .playing('HOME', 'AWAY')
                    .homeSubmission()
                    .build();
                const fixtureData = leagueFixtureContainerProps(submissionData);

                it('does not show home submission toggle', async () => {
                    await renderComponent(
                        fixtureData,
                        props('clerk', submissionData),
                        account,
                    );

                    assertToggleNotShown(true);
                });

                it('does not show away submission toggle', async () => {
                    await renderComponent(
                        fixtureData,
                        props('clerk', submissionData),
                        account,
                    );

                    assertToggleNotShown(false);
                });
            });

            describe('when a home submission', () => {
                const submissionData = fixtureBuilder()
                    .forSeason(season)
                    .forDivision(division)
                    .playing('HOME', 'AWAY')
                    .homeSubmission()
                    .build();
                const fixtureData = leagueFixtureContainerProps(submissionData);

                it('shows unpublished alert when submission team identified', async () => {
                    const teams = [team];
                    await renderComponent(
                        fixtureData,
                        props('clerk', submissionData),
                        account,
                        teams,
                    );

                    const alert = context.required('.alert');
                    expect(alert.text()).toContain(
                        '⚠ You are editing the submission from TEAM, they are not visible on the website.',
                    );
                    expect(alert.text()).toContain(
                        'The results will be published by an administrator, or automatically if someone from HOME submits matching results.',
                    );
                });

                it('shows unpublished alert when no submission team', async () => {
                    await renderComponent(
                        fixtureData,
                        props('clerk', submissionData),
                        account,
                    );

                    const alert = context.required('.alert');
                    expect(alert.text()).toContain(
                        '⚠ You are editing your submission, they are not visible on the website.',
                    );
                    expect(alert.text()).toContain(
                        'The results will be published by an administrator, or automatically if someone from HOME submits matching results.',
                    );
                });

                it('does not show home submission toggle', async () => {
                    await renderComponent(
                        fixtureData,
                        props('clerk', submissionData),
                        account,
                    );

                    assertToggleNotShown(true);
                });

                it('does not show away submission toggle', async () => {
                    await renderComponent(
                        fixtureData,
                        props('clerk', submissionData),
                        account,
                    );

                    assertToggleNotShown(false);
                });
            });

            describe('when an away submission', () => {
                const submissionData = fixtureBuilder()
                    .forSeason(season)
                    .forDivision(division)
                    .playing('HOME', 'AWAY')
                    .homeSubmission()
                    .awaySubmission()
                    .build();
                const fixtureData = leagueFixtureContainerProps(submissionData);

                it('does not show home submission toggle', async () => {
                    await renderComponent(
                        fixtureData,
                        props('clerk', submissionData),
                        account,
                    );

                    assertToggleNotShown(true);
                });

                it('does not show away submission toggle', async () => {
                    await renderComponent(
                        fixtureData,
                        props('clerk', submissionData),
                        account,
                    );

                    assertToggleNotShown(false);
                });
            });
        });

        describe('for the home team', () => {
            describe('when no home or away submission', () => {
                const submissionData = fixtureBuilder()
                    .forSeason(season)
                    .forDivision(division)
                    .playing('HOME', 'AWAY')
                    .homeSubmission()
                    .awaySubmission()
                    .build();
                const fixtureData = leagueFixtureContainerProps(submissionData);

                it('does not show home submission toggle', async () => {
                    await renderComponent(
                        fixtureData,
                        props('clerk', submissionData),
                        account,
                    );

                    assertToggleNotShown(true);
                });

                it('does not show away submission toggle', async () => {
                    await renderComponent(
                        fixtureData,
                        props('clerk', submissionData),
                        account,
                    );

                    assertToggleNotShown(false);
                });
            });

            describe('when a home submission', () => {
                const submissionData = fixtureBuilder()
                    .forSeason(season)
                    .forDivision(division)
                    .playing('HOME', 'AWAY')
                    .homeSubmission(
                        (f) =>
                            f
                                .withMatch((m) =>
                                    m
                                        .withHome(homePlayer)
                                        .withAway(awayPlayer)
                                        .scores(3, 1),
                                )
                                .withMatch((m) =>
                                    m
                                        .withHome(homePlayer)
                                        .withAway(awayPlayer)
                                        .scores(3, 1),
                                )
                                .withMatch((m) =>
                                    m
                                        .withHome(homePlayer)
                                        .withAway(awayPlayer)
                                        .scores(3, 1),
                                )
                                .withMatch((m) =>
                                    m
                                        .withHome(homePlayer)
                                        .withAway(awayPlayer)
                                        .scores(1, 3),
                                )
                                .withMatch((m) =>
                                    m
                                        .withHome(homePlayer)
                                        .withAway(awayPlayer)
                                        .scores(1, 3),
                                ),
                        account.teamId,
                    )
                    .withMatch((m) =>
                        m
                            .withHome(homePlayer)
                            .withAway(awayPlayer)
                            .scores(2, 1),
                    )
                    .withMatch((m) =>
                        m
                            .withHome(homePlayer)
                            .withAway(awayPlayer)
                            .scores(2, 1),
                    )
                    .withMatch((m) =>
                        m
                            .withHome(homePlayer)
                            .withAway(awayPlayer)
                            .scores(2, 1),
                    )
                    .withMatch((m) =>
                        m
                            .withHome(homePlayer)
                            .withAway(awayPlayer)
                            .scores(1, 2),
                    )
                    .build();
                const fixtureData = leagueFixtureContainerProps(submissionData);

                it('shows home submission toggle', async () => {
                    await renderComponent(
                        fixtureData,
                        props('clerk', submissionData),
                        account,
                    );

                    assertToggleShown(true, 'HOME (3-2)');
                });

                it('clicking toggle switches to submission and data', async () => {
                    await renderComponent(
                        fixtureData,
                        props('clerk', submissionData),
                        account,
                    );

                    await assertDisplayOfSubmissionData(true, submissionData);
                });

                it('clicking toggle reverts fixture data', async () => {
                    await renderComponent(
                        fixtureData,
                        props('clerk', submissionData, 'home'),
                        account,
                    );

                    await assertRevertToFixtureData(true, submissionData);
                });

                it('does not show away submission toggle', async () => {
                    await renderComponent(
                        fixtureData,
                        props('clerk', submissionData),
                        account,
                    );

                    assertToggleNotShown(false);
                });
            });

            describe('when an away submission', () => {
                const submissionData = fixtureBuilder()
                    .forSeason(season)
                    .forDivision(division)
                    .playing('HOME', 'AWAY')
                    .homeSubmission()
                    .awaySubmission()
                    .build();
                const fixtureData = leagueFixtureContainerProps(submissionData);

                it('does not show home submission toggle', async () => {
                    await renderComponent(
                        fixtureData,
                        props('clerk', submissionData),
                        account,
                    );

                    assertToggleNotShown(true);
                });

                it('does not show away submission toggle', async () => {
                    await renderComponent(
                        fixtureData,
                        props('clerk', submissionData),
                        account,
                    );

                    assertToggleNotShown(false);
                });
            });
        });

        describe('for the away team', () => {
            describe('when no home or away submission', () => {
                const submissionData = fixtureBuilder()
                    .forSeason(season)
                    .forDivision(division)
                    .playing('HOME', 'AWAY')
                    .homeSubmission()
                    .awaySubmission()
                    .build();
                const fixtureData = leagueFixtureContainerProps(submissionData);

                it('does not show home submission toggle', async () => {
                    await renderComponent(
                        fixtureData,
                        props('clerk', submissionData),
                        account,
                    );

                    assertToggleNotShown(true);
                });

                it('does not show away submission toggle', async () => {
                    await renderComponent(
                        fixtureData,
                        props('clerk', submissionData),
                        account,
                    );

                    assertToggleNotShown(false);
                });
            });

            describe('when a home submission', () => {
                const submissionData = fixtureBuilder()
                    .forSeason(season)
                    .forDivision(division)
                    .playing('HOME', 'AWAY')
                    .homeSubmission()
                    .awaySubmission()
                    .build();
                const fixtureData = leagueFixtureContainerProps(submissionData);

                it('does not show home submission toggle', async () => {
                    await renderComponent(
                        fixtureData,
                        props('clerk', submissionData),
                        account,
                    );

                    assertToggleNotShown(true);
                });

                it('does not show away submission toggle', async () => {
                    await renderComponent(
                        fixtureData,
                        props('clerk', submissionData),
                        account,
                    );

                    assertToggleNotShown(false);
                });
            });

            describe('when an away submission', () => {
                const submissionData = fixtureBuilder()
                    .forSeason(season)
                    .forDivision(division)
                    .playing('HOME', 'AWAY')
                    .homeSubmission()
                    .awaySubmission(
                        (f) =>
                            f
                                .withMatch((m) =>
                                    m
                                        .withHome(homePlayer)
                                        .withAway(awayPlayer)
                                        .scores(3, 1),
                                )
                                .withMatch((m) =>
                                    m
                                        .withHome(homePlayer)
                                        .withAway(awayPlayer)
                                        .scores(3, 1),
                                )
                                .withMatch((m) =>
                                    m
                                        .withHome(homePlayer)
                                        .withAway(awayPlayer)
                                        .scores(3, 1),
                                )
                                .withMatch((m) =>
                                    m
                                        .withHome(homePlayer)
                                        .withAway(awayPlayer)
                                        .scores(1, 3),
                                )
                                .withMatch((m) =>
                                    m
                                        .withHome(homePlayer)
                                        .withAway(awayPlayer)
                                        .scores(1, 3),
                                ),
                        account.teamId,
                    )
                    .withMatch((m) =>
                        m
                            .withHome(homePlayer)
                            .withAway(awayPlayer)
                            .scores(2, 1),
                    )
                    .withMatch((m) =>
                        m
                            .withHome(homePlayer)
                            .withAway(awayPlayer)
                            .scores(2, 1),
                    )
                    .withMatch((m) =>
                        m
                            .withHome(homePlayer)
                            .withAway(awayPlayer)
                            .scores(2, 1),
                    )
                    .withMatch((m) =>
                        m
                            .withHome(homePlayer)
                            .withAway(awayPlayer)
                            .scores(1, 2),
                    )
                    .build();
                const fixtureData = leagueFixtureContainerProps(submissionData);

                it('shows away submission toggle', async () => {
                    await renderComponent(
                        fixtureData,
                        props('clerk', submissionData),
                        account,
                    );

                    assertToggleShown(false, 'AWAY (3-2)');
                });

                it('clicking toggle switches to submission and data', async () => {
                    await renderComponent(
                        fixtureData,
                        props('clerk', submissionData),
                        account,
                    );

                    await assertDisplayOfSubmissionData(false, submissionData);
                });

                it('clicking toggle reverts fixture data', async () => {
                    await renderComponent(
                        fixtureData,
                        props('clerk', submissionData, 'away'),
                        account,
                    );

                    await assertRevertToFixtureData(false, submissionData);
                });

                it('does not show home submission toggle', async () => {
                    await renderComponent(
                        fixtureData,
                        props('clerk', submissionData),
                        account,
                    );

                    assertToggleNotShown(true);
                });
            });
        });
    });
});
