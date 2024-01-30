import React from "react";
import {appProps, brandingProps, cleanUp, doClick, iocProps, renderApp, TestContext} from "../../../helpers/tests";
import {toMap} from "../../../helpers/collections";
import {IScoreCardHeadingProps, ScoreCardHeading} from "./ScoreCardHeading";
import {ILeagueFixtureContainerProps, LeagueFixtureContainer} from "./LeagueFixtureContainer";
import {renderDate} from "../../../helpers/rendering";
import {IGameDto} from "../../../interfaces/models/dtos/Game/IGameDto";
import {ITeamDto} from "../../../interfaces/models/dtos/Team/ITeamDto";
import {IUserDto} from "../../../interfaces/models/dtos/Identity/IUserDto";
import {IDivisionDto} from "../../../interfaces/models/dtos/IDivisionDto";
import {ISeasonDto} from "../../../interfaces/models/dtos/Season/ISeasonDto";
import {IGameTeamDto} from "../../../interfaces/models/dtos/Game/IGameTeamDto";
import {fixtureBuilder, IFixtureBuilder, IMatchBuilder, IMatchOptionsBuilder} from "../../../helpers/builders/games";
import {divisionBuilder} from "../../../helpers/builders/divisions";
import {seasonBuilder} from "../../../helpers/builders/seasons";
import {teamBuilder} from "../../../helpers/builders/teams";

describe('ScoreCardHeading', () => {
    let context: TestContext;
    let updatedFixtureData: IGameDto;
    let updatedSubmission: string;
    async function setFixtureData(newFixtureData: IGameDto){
        updatedFixtureData = newFixtureData;
    }
    async function setSubmission(newSubmission: string) {
        updatedSubmission = newSubmission;
    }

    afterEach(() => {
        cleanUp(context);
    });

    beforeEach(() => {
        updatedFixtureData = null;
        updatedSubmission = null;
    });

    async function renderComponent(containerProps: ILeagueFixtureContainerProps, props: IScoreCardHeadingProps, account: IUserDto, teams?: ITeamDto[]) {
        context = await renderApp(
            iocProps(),
            brandingProps(),
            appProps({
                account,
                teams: toMap(teams || []),
            }),
            (<LeagueFixtureContainer {...containerProps}>
                <ScoreCardHeading {...props} />
            </LeagueFixtureContainer>),
            null,
            null,
            'table');
    }

    function assertToggleNotShown(home?: boolean) {
        const heading = context.container.querySelector(`thead > tr > td:nth-child(${home ? 1 : 3})`);
        expect(heading).toBeTruthy();
        const headingLink = heading.querySelector('a');
        expect(headingLink.textContent).toContain(home ? 'HOME' : 'AWAY');
        expect(heading.querySelectorAll('span').length).toEqual(0);
    }

    function assertToggleShown(home: boolean, text: string) {
        const heading = context.container.querySelector(`thead > tr > td:nth-child(${home ? 1 : 3})`);
        expect(heading).toBeTruthy();
        const toggleButton = heading.querySelector('.btn');
        expect(toggleButton.textContent).toContain(home ? 'HOME' : 'AWAY');
        expect(toggleButton.textContent).toContain('📬');
        expect(toggleButton.textContent).toContain(text);
    }

    async function assertRevertToFixtureData(home: boolean, data: IGameDto) {
        const heading = context.container.querySelector(`thead > tr > td:nth-child(${home ? 1 : 3})`);
        expect(heading).toBeTruthy();

        await doClick(heading.querySelector('span'));

        expect(updatedSubmission).toEqual(null);
        expect(updatedFixtureData).toEqual(data);
    }

    async function assertDisplayOfSubmissionData(home: boolean, data: IGameDto) {
        const heading = context.container.querySelector(`thead > tr > td:nth-child(${home ? 1 : 3})`);
        expect(heading).toBeTruthy();

        await doClick(heading.querySelector('span'));

        expect(updatedSubmission).toEqual(home ? 'home' : 'away');
        expect(updatedFixtureData).toEqual(home ? data.homeSubmission : data.awaySubmission);
    }

    function assertWinner(winner: 'home' | 'away' | '') {
        const homeHeading = context.container.querySelector(`thead > tr > td:nth-child(1)`);
        const awayHeading = context.container.querySelector(`thead > tr > td:nth-child(3)`);

        if (winner === 'home') {
            expect(homeHeading.className).toContain('bg-winner');
        } else {
            expect(homeHeading.className).not.toContain('bg-winner');
        }

        if (winner === 'away') {
            expect(awayHeading.className).toContain('bg-winner');
        } else {
            expect(awayHeading.className).not.toContain('bg-winner');
        }
    }

    function assertLinkAddress(home: boolean, data: IGameDto, fixtureData: ILeagueFixtureContainerProps) {
        const team: IGameTeamDto = home ? data.home : data.away;
        const heading = context.container.querySelector(`thead > tr > td:nth-child(${home ? 1 : 3})`);
        expect(heading).toBeTruthy();
        const linkToTeam = heading.querySelector('a');
        expect(linkToTeam).toBeTruthy();
        expect(linkToTeam.href).toContain(`/division/${fixtureData.division.name}/team:${team.name}/${fixtureData.season.name}`);
    }

    function assertLinkText(home: boolean, text: string) {
        const heading = context.container.querySelector(`thead > tr > td:nth-child(${home ? 1 : 3})`);
        expect(heading).toBeTruthy();
        const linkToTeam = heading.querySelector('a');
        expect(linkToTeam).toBeTruthy();
        expect(linkToTeam.textContent).toEqual(text);
    }

    describe('when logged out', () => {
        const access = '';
        const account = null;
        const division: IDivisionDto = divisionBuilder('DIVISION').build();
        const season: ISeasonDto = seasonBuilder('SEASON').build();

        describe('when no winner', () => {
            const submissionData = fixtureBuilder()
                .forSeason(season)
                .forDivision(division)
                .playing('HOME', 'AWAY')
                .homeSubmission()
                .awaySubmission()
                .build();
            const winner = '';
            const fixtureData: ILeagueFixtureContainerProps = {
                division: divisionBuilder('DIVISION', submissionData.divisionId).build(),
                season: seasonBuilder('SEASON', submissionData.seasonId).build(),
                home: null,
                away: null,
                disabled: false,
                readOnly: false,
                awayPlayers: null,
                homePlayers: null,
            };

            it('renders home team details', async () => {
                await renderComponent(
                    fixtureData,
                    {
                        access,
                        submission: null,
                        setSubmission,
                        setFixtureData,
                        data: submissionData,
                    },
                    account);

                assertLinkAddress(true, submissionData, fixtureData);
                assertLinkText(true, 'HOME - 0');
                assertWinner(winner);
                assertToggleNotShown(true);
            });

            it('renders away team details', async () => {
                await renderComponent(
                    fixtureData,
                    {
                        access,
                        submission: null,
                        setSubmission,
                        setFixtureData,
                        data: submissionData,
                    },
                    account);

                assertLinkAddress(false, submissionData, fixtureData);
                assertLinkText(false, '0 - AWAY');
                assertWinner(winner);
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
                .withMatch((m: IMatchBuilder) => m.withHome('HOME PLAYER').withAway('AWAY PLAYER').scores(2, 1))
                .withMatch((m: IMatchBuilder) => m.withHome('HOME PLAYER').withAway('AWAY PLAYER').scores(3, 1))
                .withMatch((m: IMatchBuilder) => m.withHome('HOME PLAYER').withAway('AWAY PLAYER').scores(4, 1))
                .withMatchOption((o: IMatchOptionsBuilder) => o.numberOfLegs(3))
                .withMatchOption((o: IMatchOptionsBuilder) => o.numberOfLegs(5))
                .withMatchOption((o: IMatchOptionsBuilder) => o.numberOfLegs(7))
                .build();
            const winner = 'home';
            const fixtureData: ILeagueFixtureContainerProps = {
                division: divisionBuilder('DIVISION', submissionData.divisionId).build(),
                season: seasonBuilder('SEASON', submissionData.seasonId).build(),
                home: null,
                away: null,
                disabled: false,
                readOnly: false,
                awayPlayers: null,
                homePlayers: null,
            };

            it('renders home team details', async () => {
                await renderComponent(
                    fixtureData,
                    {
                        access,
                        submission: null,
                        setSubmission,
                        setFixtureData,
                        data: submissionData,
                    },
                    account);

                assertLinkAddress(true, submissionData, fixtureData);
                assertLinkText(true, 'HOME - 3');
                assertWinner(winner);
                assertToggleNotShown(true);
            });

            it('renders away team details', async () => {
                await renderComponent(
                    fixtureData,
                    {
                        access,
                        submission: null,
                        setSubmission,
                        setFixtureData,
                        data: submissionData,
                    },
                    account);

                assertLinkAddress(false, submissionData, fixtureData);
                assertLinkText(false, '0 - AWAY');
                assertWinner(winner);
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
                .withMatch((m: IMatchBuilder) => m.withHome('HOME PLAYER').withAway('AWAY PLAYER').scores(1, 2))
                .withMatch((m: IMatchBuilder) => m.withHome('HOME PLAYER').withAway('AWAY PLAYER').scores(1, 3))
                .withMatch((m: IMatchBuilder) => m.withHome('HOME PLAYER').withAway('AWAY PLAYER').scores(1, 4))
                .withMatchOption((o: IMatchOptionsBuilder) => o.numberOfLegs(3))
                .withMatchOption((o: IMatchOptionsBuilder) => o.numberOfLegs(5))
                .withMatchOption((o: IMatchOptionsBuilder) => o.numberOfLegs(7))
                .build();
            const winner = 'away';
            const fixtureData: ILeagueFixtureContainerProps = {
                division: divisionBuilder('DIVISION', submissionData.divisionId).build(),
                season: seasonBuilder('SEASON', submissionData.seasonId).build(),
                home: null,
                away: null,
                disabled: false,
                readOnly: false,
                awayPlayers: null,
                homePlayers: null,
            };

            it('renders home team details', async () => {
                await renderComponent(
                    fixtureData,
                    {
                        access,
                        submission: null,
                        setSubmission,
                        setFixtureData,
                        data: submissionData,
                    },
                    account);

                assertLinkAddress(true, submissionData, fixtureData);
                assertLinkText(true, 'HOME - 0');
                assertWinner(winner);
                assertToggleNotShown(true);
            });

            it('renders away team details', async () => {
                await renderComponent(
                    fixtureData,
                    {
                        access,
                        submission: null,
                        setSubmission,
                        setFixtureData,
                        data: submissionData,
                    },
                    account);

                assertLinkAddress(false, submissionData, fixtureData);
                assertLinkText(false, '3 - AWAY');
                assertWinner(winner);
                assertToggleNotShown(false);
            });
        });
    });

    describe('when an admin', () => {
        const access = 'admin';
        const team: ITeamDto = teamBuilder('TEAM').build();
        const account: IUserDto = {
            name: '',
            givenName: '',
            emailAddress: '',
            teamId: team.id,
        };
        const division: IDivisionDto = divisionBuilder('DIVISION').build();
        const season: ISeasonDto = seasonBuilder('SEASON').build();

        describe('when no home or away submission', () => {
            const submissionData = fixtureBuilder()
                .forSeason(season)
                .forDivision(division)
                .playing('HOME', 'AWAY')
                .homeSubmission()
                .awaySubmission()
                .build();
            const fixtureData: ILeagueFixtureContainerProps = {
                division: divisionBuilder('DIVISION', submissionData.divisionId).build(),
                season: seasonBuilder('SEASON', submissionData.seasonId).build(),
                home: null,
                away: null,
                disabled: false,
                readOnly: false,
                awayPlayers: null,
                homePlayers: null,
            };

            it('does not show home submission toggle', async () => {
                await renderComponent(
                    fixtureData,
                    {
                        access,
                        submission: null,
                        setSubmission,
                        setFixtureData,
                        data: submissionData,
                    },
                    account);

                assertToggleNotShown(true);
            });

            it('does not show away submission toggle', async () => {
                await renderComponent(
                    fixtureData,
                    {
                        access,
                        submission: null,
                        setSubmission,
                        setFixtureData,
                        data: submissionData,
                    },
                    account);

                assertToggleNotShown(false);
            });
        });

        describe('when a home submission', () => {
            const submissionData = fixtureBuilder()
                .forSeason(season)
                .forDivision(division)
                .playing('HOME', 'AWAY')
                .homeSubmission((f: IFixtureBuilder) => f
                    .withMatch((m: IMatchBuilder) => m.withHome('HOME PLAYER').withAway('AWAY PLAYER').scores(3, 1))
                    .withMatch((m: IMatchBuilder) => m.withHome('HOME PLAYER').withAway('AWAY PLAYER').scores(3, 1))
                    .withMatch((m: IMatchBuilder) => m.withHome('HOME PLAYER').withAway('AWAY PLAYER').scores(3, 1))
                    .withMatch((m: IMatchBuilder) => m.withHome('HOME PLAYER').withAway('AWAY PLAYER').scores(1, 3))
                    .withMatch((m: IMatchBuilder) => m.withHome('HOME PLAYER').withAway('AWAY PLAYER').scores(1, 3)))
                .awaySubmission()
                .withMatch((m: IMatchBuilder) => m.withHome('HOME PLAYER').withAway('AWAY PLAYER').scores(2, 1))
                .withMatch((m: IMatchBuilder) => m.withHome('HOME PLAYER').withAway('AWAY PLAYER').scores(2, 1))
                .withMatch((m: IMatchBuilder) => m.withHome('HOME PLAYER').withAway('AWAY PLAYER').scores(2, 1))
                .withMatch((m: IMatchBuilder) => m.withHome('HOME PLAYER').withAway('AWAY PLAYER').scores(1, 2))
                .build();
            const fixtureData: ILeagueFixtureContainerProps = {
                division: divisionBuilder('DIVISION', submissionData.divisionId).build(),
                season: seasonBuilder('SEASON', submissionData.seasonId).build(),
                home: null,
                away: null,
                disabled: false,
                readOnly: false,
                awayPlayers: null,
                homePlayers: null,
            };

            it('shows unpublished alert when submission team identified', async () => {
                const updated = '2023-04-05';
                submissionData['homeSubmission'].editor = 'EDITOR';
                submissionData['homeSubmission'].updated = updated;

                await renderComponent(
                    fixtureData,
                    {
                        access,
                        submission: 'home',
                        setSubmission,
                        setFixtureData,
                        data: submissionData,
                    },
                    account,
                    [team]);

                const alert = context.container.querySelector('.alert');
                expect(alert).toBeTruthy();
                expect(alert.textContent).toContain('You are viewing the submission from HOME, created by EDITOR as of ' + renderDate(updated));
            });

            it('shows home submission toggle', async () => {
                await renderComponent(
                    fixtureData,
                    {
                        access,
                        submission: null,
                        setSubmission,
                        setFixtureData,
                        data: submissionData,
                    },
                    account);

                assertToggleShown(true, 'HOME (3-2)');
            });

            it('clicking toggle switches to submission and data', async () => {
                await renderComponent(
                    fixtureData,
                    {
                        access,
                        submission: null,
                        setSubmission,
                        setFixtureData,
                        data: submissionData,
                    },
                    account);

                await assertDisplayOfSubmissionData(true, submissionData);
            });

            it('clicking toggle reverts fixture data', async () => {
                await renderComponent(
                    fixtureData,
                    {
                        access,
                        submission: 'home',
                        setSubmission,
                        setFixtureData,
                        data: submissionData,
                    },
                    account);

                await assertRevertToFixtureData(true, submissionData);
            });
        });

        describe('when an away submission', () => {
            const submissionData = fixtureBuilder()
                .forSeason(season)
                .forDivision(division)
                .playing('HOME', 'AWAY')
                .homeSubmission()
                .awaySubmission((f: IFixtureBuilder) => f
                    .withMatch((m: IMatchBuilder) => m.withHome('HOME PLAYER').withAway('AWAY PLAYER').scores(3, 1))
                    .withMatch((m: IMatchBuilder) => m.withHome('HOME PLAYER').withAway('AWAY PLAYER').scores(3, 1))
                    .withMatch((m: IMatchBuilder) => m.withHome('HOME PLAYER').withAway('AWAY PLAYER').scores(3, 1))
                    .withMatch((m: IMatchBuilder) => m.withHome('HOME PLAYER').withAway('AWAY PLAYER').scores(1, 3))
                    .withMatch((m: IMatchBuilder) => m.withHome('HOME PLAYER').withAway('AWAY PLAYER').scores(1, 3)))
                .withMatch((m: IMatchBuilder) => m.withHome('HOME PLAYER').withAway('AWAY PLAYER').scores(2, 1))
                .withMatch((m: IMatchBuilder) => m.withHome('HOME PLAYER').withAway('AWAY PLAYER').scores(2, 1))
                .withMatch((m: IMatchBuilder) => m.withHome('HOME PLAYER').withAway('AWAY PLAYER').scores(2, 1))
                .withMatch((m: IMatchBuilder) => m.withHome('HOME PLAYER').withAway('AWAY PLAYER').scores(1, 2))
                .build();
            const fixtureData: ILeagueFixtureContainerProps = {
                division: divisionBuilder('DIVISION', submissionData.divisionId).build(),
                season: seasonBuilder('SEASON', submissionData.seasonId).build(),
                home: null,
                away: null,
                disabled: false,
                readOnly: false,
                awayPlayers: null,
                homePlayers: null,
            };

            it('shows away submission toggle', async () => {
                await renderComponent(
                    fixtureData,
                    {
                        access,
                        submission: null,
                        setSubmission,
                        setFixtureData,
                        data: submissionData,
                    },
                    account);

                assertToggleShown(false, 'AWAY (3-2)');
            });

            it('clicking toggle switches to submission and data', async () => {
                await renderComponent(
                    fixtureData,
                    {
                        access,
                        submission: null,
                        setSubmission,
                        setFixtureData,
                        data: submissionData,
                    },
                    account);

                await assertDisplayOfSubmissionData(false, submissionData);
            });

            it('clicking toggle reverts fixture data', async () => {
                await renderComponent(
                    fixtureData,
                    {
                        access,
                        submission: 'away',
                        setSubmission,
                        setFixtureData,
                        data: submissionData,
                    },
                    account);

                await assertRevertToFixtureData(false, submissionData);
            });
        });
    });

    describe('when a clerk', () => {
        const access = 'clerk';
        const team: ITeamDto = teamBuilder('TEAM').build();
        const account: IUserDto = {
            name: '',
            givenName: '',
            emailAddress: '',
            teamId: team.id,
        };
        const division: IDivisionDto = divisionBuilder('DIVISION').build();
        const season: ISeasonDto = seasonBuilder('SEASON').build();

        describe('for a different team', () => {
            describe('when no home or away submission', () => {
                const submissionData = fixtureBuilder()
                    .forSeason(season)
                    .forDivision(division)
                    .playing('HOME', 'AWAY')
                    .homeSubmission()
                    .awaySubmission()
                    .build();
                const fixtureData: ILeagueFixtureContainerProps = {
                    division: divisionBuilder('DIVISION', submissionData.divisionId).build(),
                    season: seasonBuilder('SEASON', submissionData.seasonId).build(),
                    home: null,
                    away: null,
                    disabled: false,
                    readOnly: false,
                    awayPlayers: null,
                    homePlayers: null,
                };

                it('does not show home submission toggle', async () => {
                    await renderComponent(
                        fixtureData,
                        {
                            access,
                            submission: null,
                            setSubmission,
                            setFixtureData,
                            data: submissionData,
                        },
                        account);

                    assertToggleNotShown(true);
                });

                it('does not show away submission toggle', async () => {
                    await renderComponent(
                        fixtureData,
                        {
                            access,
                            submission: null,
                            setSubmission,
                            setFixtureData,
                            data: submissionData,
                        },
                        account);

                    assertToggleNotShown(false);
                });
            });

            describe('when a home submission', () => {
                const submissionData = fixtureBuilder()
                    .forSeason(season)
                    .forDivision(division)
                    .playing('HOME', 'AWAY')
                    .homeSubmission((f: IFixtureBuilder) => f)
                    .awaySubmission()
                    .build();
                const fixtureData: ILeagueFixtureContainerProps = {
                    division: divisionBuilder('DIVISION', submissionData.divisionId).build(),
                    season: seasonBuilder('SEASON', submissionData.seasonId).build(),
                    home: null,
                    away: null,
                    disabled: false,
                    readOnly: false,
                    awayPlayers: null,
                    homePlayers: null,
                };

                it('shows unpublished alert when submission team identified', async () => {
                    const teams = [team];
                    await renderComponent(
                        fixtureData,
                        {
                            access,
                            submission: null,
                            setSubmission,
                            setFixtureData,
                            data: submissionData,
                        },
                        account,
                        teams);

                    const alert = context.container.querySelector('.alert');
                    expect(alert.textContent).toContain('⚠ You are editing the submission from TEAM, they are not visible on the website.');
                    expect(alert.textContent).toContain('The results will be published by an administrator, or automatically if someone from HOME submits matching results.');
                });

                it('shows unpublished alert when no submission team', async () => {
                    await renderComponent(
                        fixtureData,
                        {
                            access,
                            submission: null,
                            setSubmission,
                            setFixtureData,
                            data: submissionData,
                        },
                        account);

                    const alert = context.container.querySelector('.alert');
                    expect(alert.textContent).toContain('⚠ You are editing your submission, they are not visible on the website.');
                    expect(alert.textContent).toContain('The results will be published by an administrator, or automatically if someone from HOME submits matching results.');
                });

                it('does not show home submission toggle', async () => {
                    await renderComponent(
                        fixtureData,
                        {
                            access,
                            submission: null,
                            setSubmission,
                            setFixtureData,
                            data: submissionData,
                        },
                        account);

                    assertToggleNotShown(true);
                });

                it('does not show away submission toggle', async () => {
                    await renderComponent(
                        fixtureData,
                        {
                            access,
                            submission: null,
                            setSubmission,
                            setFixtureData,
                            data: submissionData,
                        },
                        account);

                    assertToggleNotShown(false);
                });
            });

            describe('when an away submission', () => {
                const submissionData = fixtureBuilder()
                    .forSeason(season)
                    .forDivision(division)
                    .playing('HOME', 'AWAY')
                    .homeSubmission()
                    .awaySubmission((f: IFixtureBuilder) => f)
                    .build();
                const fixtureData: ILeagueFixtureContainerProps = {
                    division: divisionBuilder('DIVISION', submissionData.divisionId).build(),
                    season: seasonBuilder('SEASON', submissionData.seasonId).build(),
                    home: null,
                    away: null,
                    disabled: false,
                    readOnly: false,
                    awayPlayers: null,
                    homePlayers: null,
                };

                it('does not show home submission toggle', async () => {
                    await renderComponent(
                        fixtureData,
                        {
                            access,
                            submission: null,
                            setSubmission,
                            setFixtureData,
                            data: submissionData,
                        },
                        account);

                    assertToggleNotShown(true);
                });

                it('does not show away submission toggle', async () => {
                    await renderComponent(
                        fixtureData,
                        {
                            access,
                            submission: null,
                            setSubmission,
                            setFixtureData,
                            data: submissionData,
                        },
                        account);

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
                const fixtureData: ILeagueFixtureContainerProps = {
                    division: divisionBuilder('DIVISION', submissionData.divisionId).build(),
                    season: seasonBuilder('SEASON', submissionData.seasonId).build(),
                    home: null,
                    away: null,
                    disabled: false,
                    readOnly: false,
                    awayPlayers: null,
                    homePlayers: null,
                };

                it('does not show home submission toggle', async () => {
                    await renderComponent(
                        fixtureData,
                        {
                            access,
                            submission: null,
                            setSubmission,
                            setFixtureData,
                            data: submissionData,
                        },
                        account);

                    assertToggleNotShown(true);
                });

                it('does not show away submission toggle', async () => {
                    await renderComponent(
                        fixtureData,
                        {
                            access,
                            submission: null,
                            setSubmission,
                            setFixtureData,
                            data: submissionData,
                        },
                        account);

                    assertToggleNotShown(false);
                });
            });

            describe('when a home submission', () => {
                const submissionData = fixtureBuilder()
                    .forSeason(season)
                    .forDivision(division)
                    .playing('HOME', 'AWAY')
                    .homeSubmission((f: IFixtureBuilder) => f
                        .withMatch((m: IMatchBuilder) => m.withHome('HOME PLAYER').withAway('AWAY PLAYER').scores(3, 1))
                        .withMatch((m: IMatchBuilder) => m.withHome('HOME PLAYER').withAway('AWAY PLAYER').scores(3, 1))
                        .withMatch((m: IMatchBuilder) => m.withHome('HOME PLAYER').withAway('AWAY PLAYER').scores(3, 1))
                        .withMatch((m: IMatchBuilder) => m.withHome('HOME PLAYER').withAway('AWAY PLAYER').scores(1, 3))
                        .withMatch((m: IMatchBuilder) => m.withHome('HOME PLAYER').withAway('AWAY PLAYER').scores(1, 3)), account.teamId)
                    .withMatch((m: IMatchBuilder) => m.withHome('HOME PLAYER').withAway('AWAY PLAYER').scores(2, 1))
                    .withMatch((m: IMatchBuilder) => m.withHome('HOME PLAYER').withAway('AWAY PLAYER').scores(2, 1))
                    .withMatch((m: IMatchBuilder) => m.withHome('HOME PLAYER').withAway('AWAY PLAYER').scores(2, 1))
                    .withMatch((m: IMatchBuilder) => m.withHome('HOME PLAYER').withAway('AWAY PLAYER').scores(1, 2))
                    .awaySubmission()
                    .build();
                const fixtureData: ILeagueFixtureContainerProps = {
                    division: divisionBuilder('DIVISION', submissionData.divisionId).build(),
                    season: seasonBuilder('SEASON', submissionData.seasonId).build(),
                    home: null,
                    away: null,
                    disabled: false,
                    readOnly: false,
                    awayPlayers: null,
                    homePlayers: null,
                };

                it('shows home submission toggle', async () => {
                    await renderComponent(
                        fixtureData,
                        {
                            access,
                            submission: null,
                            setSubmission,
                            setFixtureData,
                            data: submissionData,
                        },
                        account);

                    assertToggleShown(true, 'HOME (3-2)');
                });

                it('clicking toggle switches to submission and data', async () => {
                    await renderComponent(
                        fixtureData,
                        {
                            access,
                            submission: null,
                            setSubmission,
                            setFixtureData,
                            data: submissionData,
                        },
                        account);

                    await assertDisplayOfSubmissionData(true, submissionData);
                });

                it('clicking toggle reverts fixture data', async () => {
                    await renderComponent(
                        fixtureData,
                        {
                            access,
                            submission: 'home',
                            setSubmission,
                            setFixtureData,
                            data: submissionData,
                        },
                        account);

                    await assertRevertToFixtureData(true, submissionData);
                });

                it('does not show away submission toggle', async () => {
                    await renderComponent(
                        fixtureData,
                        {
                            access,
                            submission: null,
                            setSubmission,
                            setFixtureData,
                            data: submissionData,
                        },
                        account);

                    assertToggleNotShown(false);
                });
            });

            describe('when an away submission', () => {
                const submissionData = fixtureBuilder()
                    .forSeason(season)
                    .forDivision(division)
                    .playing('HOME', 'AWAY')
                    .homeSubmission()
                    .awaySubmission((f: IFixtureBuilder) => f)
                    .build();
                const fixtureData: ILeagueFixtureContainerProps = {
                    division: divisionBuilder('DIVISION', submissionData.divisionId).build(),
                    season: seasonBuilder('SEASON', submissionData.seasonId).build(),
                    home: null,
                    away: null,
                    disabled: false,
                    readOnly: false,
                    awayPlayers: null,
                    homePlayers: null,
                };

                it('does not show home submission toggle', async () => {
                    await renderComponent(
                        fixtureData,
                        {
                            access,
                            submission: null,
                            setSubmission,
                            setFixtureData,
                            data: submissionData,
                        },
                        account);

                    assertToggleNotShown(true)
                });

                it('does not show away submission toggle', async () => {
                    await renderComponent(
                        fixtureData,
                        {
                            access,
                            submission: null,
                            setSubmission,
                            setFixtureData,
                            data: submissionData,
                        },
                        account);

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
                const fixtureData: ILeagueFixtureContainerProps = {
                    division: divisionBuilder('DIVISION', submissionData.divisionId).build(),
                    season: seasonBuilder('SEASON', submissionData.seasonId).build(),
                    home: null,
                    away: null,
                    disabled: false,
                    readOnly: false,
                    awayPlayers: null,
                    homePlayers: null,
                };

                it('does not show home submission toggle', async () => {
                    await renderComponent(
                        fixtureData,
                        {
                            access,
                            submission: null,
                            setSubmission,
                            setFixtureData,
                            data: submissionData,
                        },
                        account);

                    assertToggleNotShown(true);
                });

                it('does not show away submission toggle', async () => {
                    await renderComponent(
                        fixtureData,
                        {
                            access,
                            submission: null,
                            setSubmission,
                            setFixtureData,
                            data: submissionData,
                        },
                        account);

                    assertToggleNotShown(false);
                });
            });

            describe('when a home submission', () => {
                const submissionData = fixtureBuilder()
                    .forSeason(season)
                    .forDivision(division)
                    .playing('HOME', 'AWAY')
                    .homeSubmission((f: IFixtureBuilder) => f)
                    .awaySubmission()
                    .build();
                const fixtureData: ILeagueFixtureContainerProps = {
                    division: divisionBuilder('DIVISION', submissionData.divisionId).build(),
                    season: seasonBuilder('SEASON', submissionData.seasonId).build(),
                    home: null,
                    away: null,
                    disabled: false,
                    readOnly: false,
                    awayPlayers: null,
                    homePlayers: null,
                };

                it('does not show home submission toggle', async () => {
                    await renderComponent(
                        fixtureData,
                        {
                            access,
                            submission: null,
                            setSubmission,
                            setFixtureData,
                            data: submissionData,
                        },
                        account);

                    assertToggleNotShown(true);
                });

                it('does not show away submission toggle', async () => {
                    await renderComponent(
                        fixtureData,
                        {
                            access,
                            submission: null,
                            setSubmission,
                            setFixtureData,
                            data: submissionData,
                        },
                        account);

                    assertToggleNotShown(false);
                });
            });

            describe('when an away submission', () => {
                const submissionData = fixtureBuilder()
                    .forSeason(season)
                    .forDivision(division)
                    .playing('HOME', 'AWAY')
                    .homeSubmission()
                    .awaySubmission((f: IFixtureBuilder) => f
                        .withMatch((m: IMatchBuilder) => m.withHome('HOME PLAYER').withAway('AWAY PLAYER').scores(3, 1))
                        .withMatch((m: IMatchBuilder) => m.withHome('HOME PLAYER').withAway('AWAY PLAYER').scores(3, 1))
                        .withMatch((m: IMatchBuilder) => m.withHome('HOME PLAYER').withAway('AWAY PLAYER').scores(3, 1))
                        .withMatch((m: IMatchBuilder) => m.withHome('HOME PLAYER').withAway('AWAY PLAYER').scores(1, 3))
                        .withMatch((m: IMatchBuilder) => m.withHome('HOME PLAYER').withAway('AWAY PLAYER').scores(1, 3)), account.teamId)
                    .withMatch((m: IMatchBuilder) => m.withHome('HOME PLAYER').withAway('AWAY PLAYER').scores(2, 1))
                    .withMatch((m: IMatchBuilder) => m.withHome('HOME PLAYER').withAway('AWAY PLAYER').scores(2, 1))
                    .withMatch((m: IMatchBuilder) => m.withHome('HOME PLAYER').withAway('AWAY PLAYER').scores(2, 1))
                    .withMatch((m: IMatchBuilder) => m.withHome('HOME PLAYER').withAway('AWAY PLAYER').scores(1, 2))
                    .build();
                const fixtureData: ILeagueFixtureContainerProps = {
                    division: divisionBuilder('DIVISION', submissionData.divisionId).build(),
                    season: seasonBuilder('SEASON', submissionData.seasonId).build(),
                    home: null,
                    away: null,
                    disabled: false,
                    readOnly: false,
                    awayPlayers: null,
                    homePlayers: null,
                };

                it('shows away submission toggle', async () => {
                    await renderComponent(
                        fixtureData,
                        {
                            access,
                            submission: null,
                            setSubmission,
                            setFixtureData,
                            data: submissionData,
                        },
                        account);

                    assertToggleShown(false, 'AWAY (3-2)');
                });

                it('clicking toggle switches to submission and data', async () => {
                    await renderComponent(
                        fixtureData,
                        {
                            access,
                            submission: null,
                            setSubmission,
                            setFixtureData,
                            data: submissionData,
                        },
                        account);

                    await assertDisplayOfSubmissionData(false, submissionData);
                });

                it('clicking toggle reverts fixture data', async () => {
                    await renderComponent(
                        fixtureData,
                        {
                            access,
                            submission: 'away',
                            setSubmission,
                            setFixtureData,
                            data: submissionData,
                        },
                        account);

                    await assertRevertToFixtureData(false, submissionData);
                });

                it('does not show home submission toggle', async () => {
                    await renderComponent(
                        fixtureData,
                        {
                            access,
                            submission: null,
                            setSubmission,
                            setFixtureData,
                            data: submissionData,
                        },
                        account);

                    assertToggleNotShown(true);
                });
            });
        });
    });
});