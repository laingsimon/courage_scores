// noinspection JSUnresolvedFunction

import React from "react";
import {cleanUp, doClick, renderApp} from "../../../helpers/tests";
import {toMap} from "../../../helpers/collections";
import {ScoreCardHeading} from "./ScoreCardHeading";
import {LeagueFixtureContainer} from "./LeagueFixtureContainer";
import {divisionBuilder, fixtureBuilder, seasonBuilder, teamBuilder} from "../../../helpers/builders";
import {renderDate} from "../../../helpers/rendering";

describe('ScoreCardHeading', () => {
    let context;
    let reportedError;
    let updatedFixtureData;
    let updatedSubmission;
    const setFixtureData = (newFixtureData) => {
        updatedFixtureData = newFixtureData;
    }
    const setSubmission = (newSubmission) => {
        updatedSubmission = newSubmission;
    }

    afterEach(() => {
        cleanUp(context);
    });

    async function renderComponent(access, data, account, submission, containerProps, teams) {
        reportedError = null;
        updatedFixtureData = null;
        updatedSubmission = null;
        context = await renderApp(
            {},
            {name: 'Courage Scores'},
            {
                onError: (err) => {
                    reportedError = {
                        message: err.message,
                        stack: err.stack
                    };
                },
                error: null,
                account,
                teams: toMap(teams || []),
            },
            (<LeagueFixtureContainer {...containerProps}>
                <ScoreCardHeading
                    data={data}
                    access={access}
                    submission={submission}
                    setSubmission={setSubmission}
                    setFixtureData={setFixtureData}/>
            </LeagueFixtureContainer>),
            null,
            null,
            'table');
    }

    function assertToggleNotShown(home) {
        const heading = context.container.querySelector(`thead > tr > td:nth-child(${home ? 1 : 3})`);
        expect(heading).toBeTruthy();
        const headingLink = heading.querySelector('a');
        expect(headingLink.textContent).toContain(home ? 'HOME' : 'AWAY');
        expect(heading.querySelectorAll('span').length).toEqual(0);
    }

    function assertToggleShown(home, text) {
        const heading = context.container.querySelector(`thead > tr > td:nth-child(${home ? 1 : 3})`);
        expect(heading).toBeTruthy();
        const toggleButton = heading.querySelector('.btn');
        expect(toggleButton.textContent).toContain(home ? 'HOME' : 'AWAY');
        expect(toggleButton.textContent).toContain('📬');
        expect(toggleButton.textContent).toContain(text);
    }

    async function assertRevertToFixtureData(home, data) {
        const heading = context.container.querySelector(`thead > tr > td:nth-child(${home ? 1 : 3})`);
        expect(heading).toBeTruthy();

        await doClick(heading.querySelector('span'));

        expect(updatedSubmission).toEqual(null);
        expect(updatedFixtureData).toEqual(data);
    }

    async function assertDisplayOfSubmissionData(home, data) {
        const heading = context.container.querySelector(`thead > tr > td:nth-child(${home ? 1 : 3})`);
        expect(heading).toBeTruthy();

        await doClick(heading.querySelector('span'));

        expect(updatedSubmission).toEqual(home ? 'home' : 'away');
        expect(updatedFixtureData).toEqual(home ? data.homeSubmission : data.awaySubmission);
    }

    function assertWinner(winner) {
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

    function assertLinkAddress(home, data, fixtureData) {
        const team = home ? data.home : data.away;
        const heading = context.container.querySelector(`thead > tr > td:nth-child(${home ? 1 : 3})`);
        expect(heading).toBeTruthy();
        const linkToTeam = heading.querySelector('a');
        expect(linkToTeam).toBeTruthy();
        expect(linkToTeam.href).toContain(`/division/${fixtureData.division.name}/team:${team.name}/${fixtureData.season.name}`);
    }

    function assertLinkText(home, text) {
        const heading = context.container.querySelector(`thead > tr > td:nth-child(${home ? 1 : 3})`);
        expect(heading).toBeTruthy();
        const linkToTeam = heading.querySelector('a');
        expect(linkToTeam).toBeTruthy();
        expect(linkToTeam.textContent).toEqual(text);
    }

    describe('when logged out', () => {
        const access = '';
        const account = null;
        const division = divisionBuilder('DIVISION').build();
        const season = seasonBuilder('SEASON').build();

        describe('when no winner', () => {
            const submissionData = fixtureBuilder()
                .forSeason(season)
                .forDivision(division)
                .playing('HOME', 'AWAY')
                .homeSubmission()
                .awaySubmission()
                .build();
            const winner = '';
            const fixtureData = {
                division: divisionBuilder('DIVISION', submissionData.divisionId).build(),
                season: seasonBuilder('SEASON', submissionData.seasonId).build(),
            };

            it('renders home team details', async () => {
                await renderComponent(access, submissionData, account, null, fixtureData);

                assertLinkAddress(true, submissionData, fixtureData);
                assertLinkText(true, 'HOME - 0');
                assertWinner(winner);
                assertToggleNotShown(true);
            });

            it('renders away team details', async () => {
                await renderComponent(access, submissionData, account, null, fixtureData);

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
                .withMatch(m => m.withHome('HOME PLAYER').withAway('AWAY PLAYER').scores(3, 1))
                .withMatch(m => m.withHome('HOME PLAYER').withAway('AWAY PLAYER').scores(3, 1))
                .withMatch(m => m.withHome('HOME PLAYER').withAway('AWAY PLAYER').scores(3, 1))
                .build();
            const winner = 'home';
            const fixtureData = {
                division: divisionBuilder('DIVISION', submissionData.divisionId).build(),
                season: seasonBuilder('SEASON', submissionData.seasonId).build(),
            };

            it('renders home team details', async () => {
                await renderComponent(access, submissionData, account, null, fixtureData);

                assertLinkAddress(true, submissionData, fixtureData);
                assertLinkText(true, 'HOME - 3');
                assertWinner(winner);
                assertToggleNotShown(true);
            });

            it('renders away team details', async () => {
                await renderComponent(access, submissionData, account, null, fixtureData);

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
                .withMatch(m => m.withHome('HOME PLAYER').withAway('AWAY PLAYER').scores(1, 3))
                .withMatch(m => m.withHome('HOME PLAYER').withAway('AWAY PLAYER').scores(1, 3))
                .withMatch(m => m.withHome('HOME PLAYER').withAway('AWAY PLAYER').scores(1, 3))
                .build();
            const winner = 'away';
            const fixtureData = {
                division: divisionBuilder('DIVISION', submissionData.divisionId).build(),
                season: seasonBuilder('SEASON', submissionData.seasonId).build(),
            };

            it('renders home team details', async () => {
                await renderComponent(access, submissionData, account, null, fixtureData);

                assertLinkAddress(true, submissionData, fixtureData);
                assertLinkText(true, 'HOME - 0');
                assertWinner(winner);
                assertToggleNotShown(true);
            });

            it('renders away team details', async () => {
                await renderComponent(access, submissionData, account, null, fixtureData);

                assertLinkAddress(false, submissionData, fixtureData);
                assertLinkText(false, '3 - AWAY');
                assertWinner(winner);
                assertToggleNotShown(false);
            });
        });
    });

    describe('when an admin', () => {
        const access = 'admin';
        const team = teamBuilder('TEAM').build();
        const account = {
            teamId: team.id,
        };
        const division = divisionBuilder('DIVISION').build();
        const season = seasonBuilder('SEASON').build();

        describe('when no home or away submission', () => {
            const submissionData = fixtureBuilder()
                .forSeason(season)
                .forDivision(division)
                .playing('HOME', 'AWAY')
                .homeSubmission()
                .awaySubmission()
                .build();
            const fixtureData = {
                division: divisionBuilder('DIVISION', submissionData.divisionId).build(),
                season: seasonBuilder('SEASON', submissionData.seasonId).build(),
            };

            it('does not show home submission toggle', async () => {
                await renderComponent(access, submissionData, account, null, fixtureData);

                assertToggleNotShown(true);
            });

            it('does not show away submission toggle', async () => {
                await renderComponent(access, submissionData, account, null, fixtureData);

                assertToggleNotShown(false);
            });
        });

        describe('when a home submission', () => {
            const submissionData = fixtureBuilder()
                .forSeason(season)
                .forDivision(division)
                .playing('HOME', 'AWAY')
                .homeSubmission(f => f)
                .awaySubmission()
                .withMatch(m => m.withHome('HOME PLAYER').withAway('AWAY PLAYER').scores(2, 1))
                .withMatch(m => m.withHome('HOME PLAYER').withAway('AWAY PLAYER').scores(2, 1))
                .withMatch(m => m.withHome('HOME PLAYER').withAway('AWAY PLAYER').scores(2, 1))
                .withMatch(m => m.withHome('HOME PLAYER').withAway('AWAY PLAYER').scores(1, 2))
                .build();
            const fixtureData = {
                division: divisionBuilder('DIVISION', submissionData.divisionId).build(),
                season: seasonBuilder('SEASON', submissionData.seasonId).build(),
            };

            it('shows unpublished alert when submission team identified', async () => {
                const updated = '2023-04-05';
                submissionData['home'].editor = 'EDITOR';
                submissionData['home'].updated = updated;

                await renderComponent(access, submissionData, account, 'home', fixtureData, [team]);

                const alert = context.container.querySelector('.alert');
                expect(alert.textContent).toContain('You are viewing the submission from HOME, created by EDITOR as of ' + renderDate(updated));
            });

            it('shows home submission toggle', async () => {
                await renderComponent(access, submissionData, account, null, fixtureData);

                assertToggleShown(true, 'HOME (3)');
            });

            it('clicking toggle switches to submission and data', async () => {
                await renderComponent(access, submissionData, account, null, fixtureData);

                await assertDisplayOfSubmissionData(true, submissionData);
            });

            it('clicking toggle reverts fixture data', async () => {
                await renderComponent(access, submissionData, account, 'home', fixtureData);

                await assertRevertToFixtureData(true, submissionData);
            });
        });

        describe('when an away submission', () => {
            const submissionData = fixtureBuilder()
                .forSeason(season)
                .forDivision(division)
                .playing('HOME', 'AWAY')
                .homeSubmission()
                .awaySubmission(f => f)
                .withMatch(m => m.withHome('HOME PLAYER').withAway('AWAY PLAYER').scores(2, 1))
                .withMatch(m => m.withHome('HOME PLAYER').withAway('AWAY PLAYER').scores(2, 1))
                .withMatch(m => m.withHome('HOME PLAYER').withAway('AWAY PLAYER').scores(2, 1))
                .withMatch(m => m.withHome('HOME PLAYER').withAway('AWAY PLAYER').scores(1, 2))
                .build();
            const fixtureData = {
                division: divisionBuilder('DIVISION', submissionData.divisionId).build(),
                season: seasonBuilder('SEASON', submissionData.seasonId).build(),
            };

            it('shows away submission toggle', async () => {
                await renderComponent(access, submissionData, account, null, fixtureData);

                assertToggleShown(false, 'AWAY (1)');
            });

            it('clicking toggle switches to submission and data', async () => {
                await renderComponent(access, submissionData, account, null, fixtureData);

                await assertDisplayOfSubmissionData(false, submissionData);
            });

            it('clicking toggle reverts fixture data', async () => {
                await renderComponent(access, submissionData, account, 'away', fixtureData);

                await assertRevertToFixtureData(false, submissionData);
            });
        });
    });

    describe('when a clerk', () => {
        const access = 'clerk';
        const team = teamBuilder('TEAM').build();
        const account = {
            teamId: team.id,
        };
        const division = divisionBuilder('DIVISION').build();
        const season = seasonBuilder('SEASON').build();

        describe('for a different team', () => {
            describe('when no home or away submission', () => {
                const submissionData = fixtureBuilder()
                    .forSeason(season)
                    .forDivision(division)
                    .playing('HOME', 'AWAY')
                    .homeSubmission()
                    .awaySubmission()
                    .build();
                const fixtureData = {
                    division: divisionBuilder('DIVISION', submissionData.divisionId).build(),
                    season: seasonBuilder('SEASON', submissionData.seasonId).build(),
                };

                it('does not show home submission toggle', async () => {
                    await renderComponent(access, submissionData, account, null, fixtureData);

                    assertToggleNotShown(true);
                });

                it('does not show away submission toggle', async () => {
                    await renderComponent(access, submissionData, account, null, fixtureData);

                    assertToggleNotShown(false);
                });
            });

            describe('when a home submission', () => {
                const submissionData = fixtureBuilder()
                    .forSeason(season)
                    .forDivision(division)
                    .playing('HOME', 'AWAY')
                    .homeSubmission(f => f)
                    .awaySubmission()
                    .build();
                const fixtureData = {
                    division: divisionBuilder('DIVISION', submissionData.divisionId).build(),
                    season: seasonBuilder('SEASON', submissionData.seasonId).build(),
                };

                it('shows unpublished alert when submission team identified', async () => {
                    const teams = [team];
                    await renderComponent(access, submissionData, account, null, fixtureData, teams);

                    const alert = context.container.querySelector('.alert');
                    expect(alert.textContent).toContain('⚠ You are editing the submission from TEAM, they are not visible on the website.');
                    expect(alert.textContent).toContain('The results will be published by an administrator, or automatically if someone from HOME submits matching results.');
                });

                it('shows unpublished alert when no submission team', async () => {
                    await renderComponent(access, submissionData, account, null, fixtureData);

                    const alert = context.container.querySelector('.alert');
                    expect(alert.textContent).toContain('⚠ You are editing your submission, they are not visible on the website.');
                    expect(alert.textContent).toContain('The results will be published by an administrator, or automatically if someone from HOME submits matching results.');
                });

                it('does not show home submission toggle', async () => {
                    await renderComponent(access, submissionData, account, null, fixtureData);

                    assertToggleNotShown(true);
                });

                it('does not show away submission toggle', async () => {
                    await renderComponent(access, submissionData, account, null, fixtureData);

                    assertToggleNotShown(false);
                });
            });

            describe('when an away submission', () => {
                const submissionData = fixtureBuilder()
                    .forSeason(season)
                    .forDivision(division)
                    .playing('HOME', 'AWAY')
                    .homeSubmission()
                    .awaySubmission(f => f)
                    .build();
                const fixtureData = {
                    division: divisionBuilder('DIVISION', submissionData.divisionId).build(),
                    season: seasonBuilder('SEASON', submissionData.seasonId).build(),
                };

                it('does not show home submission toggle', async () => {
                    await renderComponent(access, submissionData, account, null, fixtureData);

                    assertToggleNotShown(true);
                });

                it('does not show away submission toggle', async () => {
                    await renderComponent(access, submissionData, account, null, fixtureData);

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
                const fixtureData = {
                    division: divisionBuilder('DIVISION', submissionData.divisionId).build(),
                    season: seasonBuilder('SEASON', submissionData.seasonId).build(),
                };

                it('does not show home submission toggle', async () => {
                    await renderComponent(access, submissionData, account, null, fixtureData);

                    assertToggleNotShown(true);
                });

                it('does not show away submission toggle', async () => {
                    await renderComponent(access, submissionData, account, null, fixtureData);

                    assertToggleNotShown(false);
                });
            });

            describe('when a home submission', () => {
                const submissionData = fixtureBuilder()
                    .forSeason(season)
                    .forDivision(division)
                    .playing('HOME', 'AWAY')
                    .homeSubmission(f => f, account.teamId)
                    .withMatch(m => m.withHome('HOME PLAYER').withAway('AWAY PLAYER').scores(2, 1))
                    .withMatch(m => m.withHome('HOME PLAYER').withAway('AWAY PLAYER').scores(2, 1))
                    .withMatch(m => m.withHome('HOME PLAYER').withAway('AWAY PLAYER').scores(2, 1))
                    .withMatch(m => m.withHome('HOME PLAYER').withAway('AWAY PLAYER').scores(1, 2))
                    .awaySubmission()
                    .build();
                const fixtureData = {
                    division: divisionBuilder('DIVISION', submissionData.divisionId).build(),
                    season: seasonBuilder('SEASON', submissionData.seasonId).build(),
                };

                it('shows home submission toggle', async () => {
                    await renderComponent(access, submissionData, account, null, fixtureData);

                    assertToggleShown(true, 'HOME (3)');
                });

                it('clicking toggle switches to submission and data', async () => {
                    await renderComponent(access, submissionData, account, null, fixtureData);

                    await assertDisplayOfSubmissionData(true, submissionData);
                });

                it('clicking toggle reverts fixture data', async () => {
                    await renderComponent(access, submissionData, account, 'home', fixtureData);

                    await assertRevertToFixtureData(true, submissionData);
                });

                it('does not show away submission toggle', async () => {
                    await renderComponent(access, submissionData, account, null, fixtureData);

                    assertToggleNotShown(false);
                });
            });

            describe('when an away submission', () => {
                const submissionData = fixtureBuilder()
                    .forSeason(season)
                    .forDivision(division)
                    .playing('HOME', 'AWAY')
                    .homeSubmission()
                    .awaySubmission(f => f)
                    .build();
                const fixtureData = {
                    division: divisionBuilder('DIVISION', submissionData.divisionId).build(),
                    season: seasonBuilder('SEASON', submissionData.seasonId).build(),
                };

                it('does not show home submission toggle', async () => {
                    await renderComponent(access, submissionData, account, null, fixtureData);

                    assertToggleNotShown(true)
                });

                it('does not show away submission toggle', async () => {
                    await renderComponent(access, submissionData, account, null, fixtureData);

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
                const fixtureData = {
                    division: divisionBuilder('DIVISION', submissionData.divisionId).build(),
                    season: seasonBuilder('SEASON', submissionData.seasonId).build(),
                };

                it('does not show home submission toggle', async () => {
                    await renderComponent(access, submissionData, account, null, fixtureData);

                    assertToggleNotShown(true);
                });

                it('does not show away submission toggle', async () => {
                    await renderComponent(access, submissionData, account, null, fixtureData);

                    assertToggleNotShown(false);
                });
            });

            describe('when a home submission', () => {
                const submissionData = fixtureBuilder()
                    .forSeason(season)
                    .forDivision(division)
                    .playing('HOME', 'AWAY')
                    .homeSubmission(f => f)
                    .awaySubmission()
                    .build();
                const fixtureData = {
                    division: divisionBuilder('DIVISION', submissionData.divisionId).build(),
                    season: seasonBuilder('SEASON', submissionData.seasonId).build(),
                };

                it('does not show home submission toggle', async () => {
                    await renderComponent(access, submissionData, account, null, fixtureData);

                    assertToggleNotShown(true);
                });

                it('does not show away submission toggle', async () => {
                    await renderComponent(access, submissionData, account, null, fixtureData);

                    assertToggleNotShown(false);
                });
            });

            describe('when an away submission', () => {
                const submissionData = fixtureBuilder()
                    .forSeason(season)
                    .forDivision(division)
                    .playing('HOME', 'AWAY')
                    .homeSubmission()
                    .awaySubmission(f => f, account.teamId)
                    .withMatch(m => m.withHome('HOME PLAYER').withAway('AWAY PLAYER').scores(2, 1))
                    .withMatch(m => m.withHome('HOME PLAYER').withAway('AWAY PLAYER').scores(2, 1))
                    .withMatch(m => m.withHome('HOME PLAYER').withAway('AWAY PLAYER').scores(2, 1))
                    .withMatch(m => m.withHome('HOME PLAYER').withAway('AWAY PLAYER').scores(1, 2))
                    .build();
                const fixtureData = {
                    division: divisionBuilder('DIVISION', submissionData.divisionId).build(),
                    season: seasonBuilder('SEASON', submissionData.seasonId).build(),
                };

                it('shows away submission toggle', async () => {
                    await renderComponent(access, submissionData, account, null, fixtureData);

                    assertToggleShown(false, 'AWAY (1)');
                });

                it('clicking toggle switches to submission and data', async () => {
                    await renderComponent(access, submissionData, account, null, fixtureData);

                    await assertDisplayOfSubmissionData(false, submissionData);
                });

                it('clicking toggle reverts fixture data', async () => {
                    await renderComponent(access, submissionData, account, 'away', fixtureData);

                    await assertRevertToFixtureData(false, submissionData);
                });

                it('does not show home submission toggle', async () => {
                    await renderComponent(access, submissionData, account, null, fixtureData);

                    assertToggleNotShown(true);
                });
            });
        });
    });
});