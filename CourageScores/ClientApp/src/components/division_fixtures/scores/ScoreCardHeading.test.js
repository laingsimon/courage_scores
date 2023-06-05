// noinspection JSUnresolvedFunction

import React from "react";
import {cleanUp, renderApp, doClick} from "../../../tests/helpers";
import {ScoreCardHeading} from "./ScoreCardHeading";
import {createTemporaryId} from "../../../helpers/projection";

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

    async function renderComponent(access, data, winner, account, submission) {
        reportedError = null;
        updatedFixtureData = null;
        updatedSubmission = null;
        context = await renderApp(
            { },
            {
                onError: (err) => {
                    reportedError = {
                        message: err.message,
                        stack: err.stack
                    };
                },
                error: null,
                account
            },
            (<ScoreCardHeading
                data={data}
                access={access}
                winner={winner}
                submission={submission}
                setSubmission={setSubmission}
                setFixtureData={setFixtureData} />),
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

    function assertToggleShown(home) {
        const heading = context.container.querySelector(`thead > tr > td:nth-child(${home ? 1 : 3})`);
        expect(heading).toBeTruthy();
        const headingLink = heading.querySelector('a');
        expect(headingLink.textContent).toContain(home ? 'HOME' : 'AWAY');
        const toggle = heading.querySelector('span');
        expect(toggle).toBeTruthy();
        expect(toggle.textContent).toContain('📬');
    }

    async function assertRevertToFixtureData(home, data) {
        const heading = context.container.querySelector(`thead > tr > td:nth-child(${home ? 1 : 3})`);
        expect(heading).toBeTruthy();
        const toggle = heading.querySelector('span');
        expect(toggle).toBeTruthy();

        await doClick(heading, 'span');

        expect(updatedSubmission).toEqual(null);
        expect(updatedFixtureData).toEqual(data);
    }

    async function assertDisplayOfSubmissionData(home, data) {
        const heading = context.container.querySelector(`thead > tr > td:nth-child(${home ? 1 : 3})`);
        expect(heading).toBeTruthy();
        const toggle = heading.querySelector('span');
        expect(toggle).toBeTruthy();

        await doClick(heading, 'span');

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

    function assertLinkAddress(home, data) {
        const team = home ? data.home : data.away;
        const heading = context.container.querySelector(`thead > tr > td:nth-child(${home ? 1 : 3})`);
        expect(heading).toBeTruthy();
        const linkToTeam = heading.querySelector('a');
        expect(linkToTeam).toBeTruthy();
        expect(linkToTeam.href).toContain(`/division/${data.divisionId}/team:${team.id}/${data.seasonId}`);
    }

    describe('when not logged in', () => {
        const access = '';
        const account = null;

        describe('when no winner', () => {
            const submissionData = {
                divisionId: createTemporaryId(),
                seasonId: createTemporaryId(),
                home: {
                    id: createTemporaryId(),
                    name: 'HOME',
                },
                away: {
                    id: createTemporaryId(),
                    name: 'AWAY',
                },
                homeSubmission: null,
                awaySubmission: null,
            };
            const winner = '';

            it('renders home team details', async () => {
                await renderComponent(access, submissionData, winner, account);

                assertLinkAddress(true, submissionData);
                assertWinner(winner);
                assertToggleNotShown(true);
            });

            it('renders away team details', async () => {
                await renderComponent(access, submissionData, winner, account);

                assertLinkAddress(false, submissionData);
                assertWinner(winner);
                assertToggleNotShown(false);
            });
        });

        describe('when home winner', () => {
            const submissionData = {
                divisionId: createTemporaryId(),
                seasonId: createTemporaryId(),
                home: {
                    id: createTemporaryId(),
                    name: 'HOME',
                },
                away: {
                    id: createTemporaryId(),
                    name: 'AWAY',
                },
                homeSubmission: null,
                awaySubmission: null,
            };
            const winner = 'home';

            it('renders home team details', async () => {
                await renderComponent(access, submissionData, winner, account);

                assertLinkAddress(true, submissionData);
                assertWinner(winner);
                assertToggleNotShown(true);
            });

            it('renders away team details', async () => {
                await renderComponent(access, submissionData, winner, account);

                assertLinkAddress(false, submissionData);
                assertWinner(winner);
                assertToggleNotShown(false);
            });
        });

        describe('when away winner', () => {
            const submissionData = {
                divisionId: createTemporaryId(),
                seasonId: createTemporaryId(),
                home: {
                    id: createTemporaryId(),
                    name: 'HOME',
                },
                away: {
                    id: createTemporaryId(),
                    name: 'AWAY',
                },
                homeSubmission: null,
                awaySubmission: null,
            };
            const winner = 'away';

            it('renders home team details', async () => {
                await renderComponent(access, submissionData, winner, account);

                assertLinkAddress(true, submissionData);
                assertWinner(winner);
                assertToggleNotShown(true);
            });

            it('renders away team details', async () => {
                await renderComponent(access, submissionData, winner, account);

                assertLinkAddress(false, submissionData);
                assertWinner(winner);
                assertToggleNotShown(false);
            });
        });
    });

    describe('when an admin', () => {
        const access = 'admin';
        const account = {
            teamId: createTemporaryId(),
        };
        const winner = '';

        describe('when no home or away submission', () => {
            const submissionData = {
                divisionId: createTemporaryId(),
                seasonId: createTemporaryId(),
                home: {
                    id: createTemporaryId(),
                    name: 'HOME',
                },
                away: {
                    id: createTemporaryId(),
                    name: 'AWAY',
                },
                homeSubmission: null,
                awaySubmission: null,
            };

            it('does not show home submission toggle', async () => {
                await renderComponent(access, submissionData, winner, account);

                assertToggleNotShown(true);
            });

            it('does not show away submission toggle', async () => {
                await renderComponent(access, submissionData, winner, account);

                assertToggleNotShown(false);
            });
        });

        describe('when a home submission', () => {
            const submissionData = {
                divisionId: createTemporaryId(),
                seasonId: createTemporaryId(),
                home: {
                    id: createTemporaryId(),
                    name: 'HOME',
                },
                away: {
                    id: createTemporaryId(),
                    name: 'AWAY',
                },
                homeSubmission: {
                    id: createTemporaryId(),
                },
                awaySubmission: null,
            };

            it('shows home submission toggle', async () => {
                await renderComponent(access, submissionData, winner, account);

                assertToggleShown(true);
            });

            it('clicking toggle switches to submission and data', async () => {
                await renderComponent(access, submissionData, winner, account);

                await assertDisplayOfSubmissionData(true, submissionData);
            });

            it('clicking toggle reverts fixture data', async () => {
                await renderComponent(access, submissionData, winner, account, 'home');

                await assertRevertToFixtureData(true, submissionData);
            });
        });

        describe('when an away submission', () => {
            const submissionData = {
                divisionId: createTemporaryId(),
                seasonId: createTemporaryId(),
                home: {
                    id: createTemporaryId(),
                    name: 'HOME',
                },
                away: {
                    id: createTemporaryId(),
                    name: 'AWAY',
                },
                homeSubmission: null,
                awaySubmission: {
                    id: createTemporaryId(),
                },
            };

            it('shows away submission toggle', async () => {
                await renderComponent(access, submissionData, winner, account);

                assertToggleShown(false);
            });

            it('clicking toggle switches to submission and data', async () => {
                await renderComponent(access, submissionData, winner, account);

                await assertDisplayOfSubmissionData(false, submissionData);
            });

            it('clicking toggle reverts fixture data', async () => {
                await renderComponent(access, submissionData, winner, account, 'away');

                await assertRevertToFixtureData(false, submissionData);
            });
        });
    });

    describe('when a clerk', () => {
        const access = 'clerk';
        const account = {
            teamId: createTemporaryId(),
        };
        const winner = '';

        describe('for a different team', () => {
            describe('when no home or away submission', () => {
                const submissionData = {
                    divisionId: createTemporaryId(),
                    seasonId: createTemporaryId(),
                    home: {
                        id: createTemporaryId(),
                        name: 'HOME',
                    },
                    away: {
                        id: createTemporaryId(),
                        name: 'AWAY',
                    },
                    homeSubmission: null,
                    awaySubmission: null,
                };

                it('does not show home submission toggle', async () => {
                    await renderComponent(access, submissionData, winner, account);

                    assertToggleNotShown(true);
                });

                it('does not show away submission toggle', async () => {
                    await renderComponent(access, submissionData, winner, account);

                    assertToggleNotShown(false);
                });
            });

            describe('when a home submission', () => {
                const submissionData = {
                    divisionId: createTemporaryId(),
                    seasonId: createTemporaryId(),
                    home: {
                        id: createTemporaryId(),
                        name: 'HOME',
                    },
                    away: {
                        id: createTemporaryId(),
                        name: 'AWAY',
                    },
                    homeSubmission: {
                        id: createTemporaryId(),
                    },
                    awaySubmission: null,
                };

                it('does not show home submission toggle', async () => {
                    await renderComponent(access, submissionData, winner, account);

                    assertToggleNotShown(true);
                });

                it('does not show away submission toggle', async () => {
                    await renderComponent(access, submissionData, winner, account);

                    assertToggleNotShown(false);
                });
            });

            describe('when an away submission', () => {
                const submissionData = {
                    divisionId: createTemporaryId(),
                    seasonId: createTemporaryId(),
                    home: {
                        id: createTemporaryId(),
                        name: 'HOME',
                    },
                    away: {
                        id: createTemporaryId(),
                        name: 'AWAY',
                    },
                    homeSubmission: null,
                    awaySubmission: {
                        id: createTemporaryId(),
                    },
                };

                it('does not show home submission toggle', async () => {
                    await renderComponent(access, submissionData, winner, account);

                    assertToggleNotShown(true);
                });

                it('does not show away submission toggle', async () => {
                    await renderComponent(access, submissionData, winner, account);

                    assertToggleNotShown(false);
                });
            });
        });

        describe('for the home team', () => {
            describe('when no home or away submission', () => {
                const submissionData = {
                    divisionId: createTemporaryId(),
                    seasonId: createTemporaryId(),
                    home: {
                        id: account.teamId,
                        name: 'HOME',
                    },
                    away: {
                        id: createTemporaryId(),
                        name: 'AWAY',
                    },
                    homeSubmission: null,
                    awaySubmission: null,
                };

                it('does not show home submission toggle', async () => {
                    await renderComponent(access, submissionData, winner, account);

                    assertToggleNotShown(true);
                });

                it('does not show away submission toggle', async () => {
                    await renderComponent(access, submissionData, winner, account);

                    assertToggleNotShown(false);
                });
            });

            describe('when a home submission', () => {
                const submissionData = {
                    divisionId: createTemporaryId(),
                    seasonId: createTemporaryId(),
                    home: {
                        id: account.teamId,
                        name: 'HOME',
                    },
                    away: {
                        id: createTemporaryId(),
                        name: 'AWAY',
                    },
                    homeSubmission: {
                        id: account.teamId,
                    },
                    awaySubmission: null,
                };

                it('shows home submission toggle', async () => {
                    await renderComponent(access, submissionData, winner, account);

                    assertToggleShown(true);
                });

                it('clicking toggle switches to submission and data', async () => {
                    await renderComponent(access, submissionData, winner, account);

                    await assertDisplayOfSubmissionData(true, submissionData);
                });

                it('clicking toggle reverts fixture data', async () => {
                    await renderComponent(access, submissionData, winner, account, 'home');

                    await assertRevertToFixtureData(true, submissionData);
                });

                it('does not show away submission toggle', async () => {
                    await renderComponent(access, submissionData, winner, account);

                    assertToggleNotShown(false);
                });
            });

            describe('when an away submission', () => {
                const submissionData = {
                    divisionId: createTemporaryId(),
                    seasonId: createTemporaryId(),
                    home: {
                        id: account.teamId,
                        name: 'HOME',
                    },
                    away: {
                        id: createTemporaryId(),
                        name: 'AWAY',
                    },
                    homeSubmission: null,
                    awaySubmission: {
                        id: createTemporaryId(),
                    },
                };

                it('does not show home submission toggle', async () => {
                    await renderComponent(access, submissionData, winner, account);

                    assertToggleNotShown(true)
                });

                it('does not show away submission toggle', async () => {
                    await renderComponent(access, submissionData, winner, account);

                    assertToggleNotShown(false);
                });
            });
        });

        describe('for the away team', () => {
            describe('when no home or away submission', () => {
                const submissionData = {
                    divisionId: createTemporaryId(),
                    seasonId: createTemporaryId(),
                    home: {
                        id: createTemporaryId(),
                        name: 'HOME',
                    },
                    away: {
                        id: account.teamId,
                        name: 'AWAY',
                    },
                    homeSubmission: null,
                    awaySubmission: null,
                };

                it('does not show home submission toggle', async () => {
                    await renderComponent(access, submissionData, winner, account);

                    assertToggleNotShown(true);
                });

                it('does not show away submission toggle', async () => {
                    await renderComponent(access, submissionData, winner, account);

                    assertToggleNotShown(false);
                });
            });

            describe('when a home submission', () => {
                const submissionData = {
                    divisionId: createTemporaryId(),
                    seasonId: createTemporaryId(),
                    home: {
                        id: createTemporaryId(),
                        name: 'HOME',
                    },
                    away: {
                        id: account.teamId,
                        name: 'AWAY',
                    },
                    homeSubmission: {
                        id: createTemporaryId(),
                    },
                    awaySubmission: null,
                };

                it('does not show home submission toggle', async () => {
                    await renderComponent(access, submissionData, winner, account);

                    assertToggleNotShown(true);
                });

                it('does not show away submission toggle', async () => {
                    await renderComponent(access, submissionData, winner, account);

                    assertToggleNotShown(false);
                });
            });

            describe('when an away submission', () => {
                const submissionData = {
                    divisionId: createTemporaryId(),
                    seasonId: createTemporaryId(),
                    home: {
                        id: createTemporaryId(),
                        name: 'HOME',
                    },
                    away: {
                        id: account.teamId,
                        name: 'AWAY',
                    },
                    homeSubmission: null,
                    awaySubmission: {
                        id: account.teamId,
                    },
                };

                it('shows away submission toggle', async () => {
                    await renderComponent(access, submissionData, winner, account);

                    assertToggleShown(false);
                });

                it('clicking toggle switches to submission and data', async () => {
                    await renderComponent(access, submissionData, winner, account);

                    await assertDisplayOfSubmissionData(false, submissionData);
                });

                it('clicking toggle reverts fixture data', async () => {
                    await renderComponent(access, submissionData, winner, account, 'away');

                    await assertRevertToFixtureData(false, submissionData);
                });

                it('does not show home submission toggle', async () => {
                    await renderComponent(access, submissionData, winner, account);

                    assertToggleNotShown(true);
                });
            });
        });
    });
});