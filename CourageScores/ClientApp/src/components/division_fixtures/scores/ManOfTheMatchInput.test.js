// noinspection JSUnresolvedFunction

import React from "react";
import {cleanUp, doClick, doSelectOption, renderApp} from "../../../helpers/tests";
import {createTemporaryId} from "../../../helpers/projection";
import {ManOfTheMatchInput} from "./ManOfTheMatchInput";

describe('ManOfTheMatchInput', () => {
    let context;
    let reportedError;
    let updatedFixtureData;
    const setFixtureData = (newFixtureData) => {
        updatedFixtureData = newFixtureData;
    }

    afterEach(() => {
        cleanUp(context);
    });

    async function renderComponent(saving, account, fixtureData, access) {
        reportedError = null;
        updatedFixtureData = null;
        context = await renderApp(
            { },
            { name: 'Courage Scores' },
            {
                onError: (err) => {
                    reportedError = {
                        message: err.message,
                        stack: err.stack
                    };
                },
                account: account,
            },
            (<ManOfTheMatchInput
                saving={saving}
                access={access}
                fixtureData={fixtureData}
                setFixtureData={setFixtureData} />),
            null,
            null,
            'tbody');
    }

    function assertPlayers(container, names, displayed, selected) {
        names.unshift(' ');

        const homePlayers = container.querySelectorAll('div.btn-group div[role="menu"] button[role="menuitem"]');
        const displayedPlayer = container.querySelector('div.btn-group > button > span');
        const selectedPlayer = container.querySelector('div.btn-group div[role="menu"] button[role="menuitem"].active');
        expect(Array.from(homePlayers).map(span => span.textContent)).toEqual(names);
        expect(displayedPlayer.textContent).toEqual(displayed);
        if (selected) {
            expect(selectedPlayer).toBeTruthy();
            expect(selectedPlayer.textContent).toEqual(selected);
        } else {
            if (selectedPlayer) {
                expect(selectedPlayer.textContent).toEqual(' ');
            }
        }
    }

    describe('when logged out', () => {
        it('when no matches', async () => {
            const fixtureData = {
                matches: [],
                home: { },
                away: { },
            };

            await renderComponent(false, null, fixtureData, '');

            expect(context.container.innerHTML).toEqual('');
        });

        it('when no selected players', async () => {
            const fixtureData = {
                matches: [ {
                    homePlayers: [],
                    awayPlayers: []
                } ],
                home: { },
                away: { },
            };

            await renderComponent(false, null, fixtureData, '');

            expect(reportedError).toBeFalsy();
            expect(context.container.innerHTML).toEqual('');
        });

        it('when no man-of-the-match', async () => {
            const homePlayer = {
                id: createTemporaryId(), name: 'HOME player',
            };
            const awayPlayer = {
                id: createTemporaryId(), name: 'AWAY player',
            };
            const fixtureData = {
                matches: [ {
                    homePlayers: [ homePlayer ],
                    awayPlayers: [ awayPlayer ]
                } ],
                home: {
                    id: createTemporaryId(),
                    name: 'HOME',
                },
                away: {
                    id: createTemporaryId(),
                    name: 'AWAY',
                }
            };

            await renderComponent(false, null, fixtureData, '');

            expect(reportedError).toBeFalsy();
            expect(context.container.innerHTML).toEqual('');
        });

        it('when home man-of-the-match', async () => {
            const homePlayer = {
                id: createTemporaryId(), name: 'HOME player',
            };
            const awayPlayer = {
                id: createTemporaryId(), name: 'AWAY player',
            };
            const fixtureData = {
                matches: [ {
                    homePlayers: [ homePlayer ],
                    awayPlayers: [ awayPlayer ]
                } ],
                home: {
                    id: createTemporaryId(),
                    name: 'HOME',
                    manOfTheMatch: homePlayer.id,
                },
                away: {
                    id: createTemporaryId(),
                    name: 'AWAY',
                }
            };

            await renderComponent(false, null, fixtureData, '');

            expect(reportedError).toBeFalsy();
            expect(context.container.innerHTML).toEqual('');
        });

        it('when away man-of-the-match', async () => {
            const homePlayer = {
                id: createTemporaryId(), name: 'HOME player',
            };
            const awayPlayer = {
                id: createTemporaryId(), name: 'AWAY player',
            };
            const fixtureData = {
                matches: [ {
                    homePlayers: [ homePlayer ],
                    awayPlayers: [ awayPlayer ]
                } ],
                home: {
                    id: createTemporaryId(),
                    name: 'HOME',
                },
                away: {
                    id: createTemporaryId(),
                    name: 'AWAY',
                    manOfTheMatch: awayPlayer.id,
                }
            };

            await renderComponent(false, null, fixtureData, '');

            expect(reportedError).toBeFalsy();
            expect(context.container.innerHTML).toEqual('');
        });
    });

    describe('when logged in', () => {
        let account = { };

        describe('renders', () => {
            it('when no matches', async () => {
                const fixtureData = {
                    matches: [],
                    home: { },
                    away: { },
                };

                await renderComponent(false, account, fixtureData, 'admin');

                expect(reportedError).toBeFalsy();
                const cells = context.container.querySelectorAll('td');
                expect(cells.length).toEqual(3);
                assertPlayers(cells[0], [], ' ', null);
                assertPlayers(cells[2], [], ' ', null);
            });

            it('when no selected players', async () => {
                const fixtureData = {
                    matches: [ {
                        homePlayers: [],
                        awayPlayers: []
                    } ],
                    home: { },
                    away: { },
                };

                await renderComponent(false, account, fixtureData, 'admin');

                expect(reportedError).toBeFalsy();
                const cells = context.container.querySelectorAll('td');
                expect(cells.length).toEqual(3);
                assertPlayers(cells[0], [], ' ', null);
                assertPlayers(cells[2], [], ' ', null);
            });

            it('when no man-of-the-match', async () => {
                const homePlayer = {
                    id: createTemporaryId(), name: 'HOME player',
                };
                const awayPlayer = {
                    id: createTemporaryId(), name: 'AWAY player',
                };
                const fixtureData = {
                    matches: [ {
                        homePlayers: [ homePlayer ],
                        awayPlayers: [ awayPlayer ]
                    } ],
                    home: {
                        id: createTemporaryId(),
                        name: 'HOME',
                    },
                    away: {
                        id: createTemporaryId(),
                        name: 'AWAY',
                    }
                };

                await renderComponent(false, account, fixtureData, 'admin');

                expect(reportedError).toBeFalsy();
                const cells = context.container.querySelectorAll('td');
                expect(cells.length).toEqual(3);
                assertPlayers(cells[0], [ 'AWAY player', 'HOME player' ], ' ', null);
                assertPlayers(cells[2], [ 'AWAY player', 'HOME player' ], ' ', null);
            });

            it('when home man-of-the-match', async () => {
                const homePlayer = {
                    id: createTemporaryId(), name: 'HOME player',
                };
                const awayPlayer = {
                    id: createTemporaryId(), name: 'AWAY player',
                };
                const fixtureData = {
                    matches: [ {
                        homePlayers: [ homePlayer ],
                        awayPlayers: [ awayPlayer ]
                    } ],
                    home: {
                        id: createTemporaryId(),
                        name: 'HOME',
                        manOfTheMatch: homePlayer.id,
                    },
                    away: {
                        id: createTemporaryId(),
                        name: 'AWAY',
                    }
                };

                await renderComponent(false, account, fixtureData, 'admin');

                expect(reportedError).toBeFalsy();
                const cells = context.container.querySelectorAll('td');
                expect(cells.length).toEqual(3);
                assertPlayers(cells[0], [ 'AWAY player', 'HOME player' ], 'HOME player', 'HOME player');
            });

            it('when away man-of-the-match', async () => {
                const homePlayer = {
                    id: createTemporaryId(), name: 'HOME player',
                };
                const awayPlayer = {
                    id: createTemporaryId(), name: 'AWAY player',
                };
                const fixtureData = {
                    matches: [ {
                        homePlayers: [ homePlayer ],
                        awayPlayers: [ awayPlayer ]
                    } ],
                    home: {
                        id: createTemporaryId(),
                        name: 'HOME',
                    },
                    away: {
                        id: createTemporaryId(),
                        name: 'AWAY',
                        manOfTheMatch: awayPlayer.id,
                    }
                };

                await renderComponent(false, account, fixtureData, 'admin');

                expect(reportedError).toBeFalsy();
                const cells = context.container.querySelectorAll('td');
                expect(cells.length).toEqual(3);
                assertPlayers(cells[2], [ 'AWAY player', 'HOME player' ], 'AWAY player', 'AWAY player');
            });
        });

        describe('changes', () => {
            it('set home man-of-the-match', async () => {
                const homePlayer = {
                    id: createTemporaryId(), name: 'HOME player',
                };
                const awayPlayer = {
                    id: createTemporaryId(), name: 'AWAY player',
                };
                const fixtureData = {
                    matches: [ {
                        homePlayers: [ homePlayer ],
                        awayPlayers: [ awayPlayer ]
                    } ],
                    home: {
                        id: createTemporaryId(),
                        name: 'HOME',
                    },
                    away: {
                        id: createTemporaryId(),
                        name: 'AWAY',
                    }
                };
                expect(reportedError).toBeFalsy();
                await renderComponent(false, account, fixtureData, 'admin');
                const homeMOM = context.container.querySelectorAll('td')[0];

                await doSelectOption(homeMOM.querySelector('.dropdown-menu'), 'AWAY player')

                expect(updatedFixtureData).toBeTruthy();
                expect(updatedFixtureData.home.manOfTheMatch).toEqual(awayPlayer.id);
            });

            it('unset home man-of-the-match', async () => {
                const homePlayer = {
                    id: createTemporaryId(), name: 'HOME player',
                };
                const awayPlayer = {
                    id: createTemporaryId(), name: 'AWAY player',
                };
                const fixtureData = {
                    matches: [ {
                        homePlayers: [ homePlayer ],
                        awayPlayers: [ awayPlayer ]
                    } ],
                    home: {
                        id: createTemporaryId(),
                        name: 'HOME',
                        manOfTheMatch: homePlayer.id,
                    },
                    away: {
                        id: createTemporaryId(),
                        name: 'AWAY',
                    }
                };

                expect(reportedError).toBeFalsy();
                await renderComponent(false, account, fixtureData, 'admin');
                const homeMOM = context.container.querySelectorAll('td')[0];

                await doSelectOption(homeMOM.querySelector('.dropdown-menu'), ' ');

                expect(updatedFixtureData).toBeTruthy();
                expect(updatedFixtureData.home.manOfTheMatch).toBeUndefined();
            });

            it('set away man-of-the-match', async () => {
                const homePlayer = {
                    id: createTemporaryId(), name: 'HOME player',
                };
                const awayPlayer = {
                    id: createTemporaryId(), name: 'AWAY player',
                };
                const fixtureData = {
                    matches: [ {
                        homePlayers: [ homePlayer ],
                        awayPlayers: [ awayPlayer ]
                    } ],
                    home: {
                        id: createTemporaryId(),
                        name: 'HOME',
                    },
                    away: {
                        id: createTemporaryId(),
                        name: 'AWAY',
                    }
                };

                expect(reportedError).toBeFalsy();
                await renderComponent(false, account, fixtureData, 'admin');
                const awayMOM = context.container.querySelectorAll('td')[2];

                await doSelectOption(awayMOM.querySelector('.dropdown-menu'), 'HOME player');

                expect(updatedFixtureData).toBeTruthy();
                expect(updatedFixtureData.away.manOfTheMatch).toEqual(homePlayer.id);
            });

            it('unset away man-of-the-match', async () => {
                const homePlayer = {
                    id: createTemporaryId(), name: 'HOME player',
                };
                const awayPlayer = {
                    id: createTemporaryId(), name: 'AWAY player',
                };
                const fixtureData = {
                    matches: [ {
                        homePlayers: [ homePlayer ],
                        awayPlayers: [ awayPlayer ]
                    } ],
                    home: {
                        id: createTemporaryId(),
                        name: 'HOME',
                    },
                    away: {
                        id: createTemporaryId(),
                        name: 'AWAY',
                        manOfTheMatch: awayPlayer.id,
                    }
                };

                expect(reportedError).toBeFalsy();
                await renderComponent(false, account, fixtureData, 'admin');
                const awayMOM = context.container.querySelectorAll('td')[2];

                await doSelectOption(awayMOM.querySelector('.dropdown-menu'), ' ');

                expect(updatedFixtureData).toBeTruthy();
                expect(updatedFixtureData.away.manOfTheMatch).toBeUndefined();
            });
        });
    });
});