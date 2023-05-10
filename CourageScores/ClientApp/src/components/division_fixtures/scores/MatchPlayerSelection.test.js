// noinspection JSUnresolvedFunction

import React from "react";
import {cleanUp, renderApp, doClick, doChange} from "../../../tests/helpers";
import {MatchPlayerSelection, NEW_PLAYER} from "./MatchPlayerSelection";
import {createTemporaryId} from "../../../Utilities";

describe('MatchPlayerSelection', () => {
    let context;
    let reportedError;
    let updatedMatch;
    let updatedMatchOptions;
    let additional180;
    let additionalHiCheck;
    let createPlayerFor;
    const onMatchChanged = (newMatch) => {
        updatedMatch = newMatch;
    }
    const onMatchOptionsChanged = (newMatchOptions) => {
        updatedMatchOptions = newMatchOptions;
    }
    const on180 = (player) => {
        additional180 = player;
    }
    const onHiCheck = (notablePlayer) => {
        additionalHiCheck = notablePlayer;
    }
    const setCreatePlayerFor = (opts) => {
        createPlayerFor = opts;
    }

    afterEach(() => {
        cleanUp(context);
    });

    async function renderComponent(account, props) {
        reportedError = null;
        updatedMatch = null;
        updatedMatchOptions = null;
        additional180 = null;
        additionalHiCheck = null;
        createPlayerFor = null;
        context = await renderApp(
            { },
            {
                onError: (err) => {
                    reportedError = {
                        message: err.message,
                        stack: err.stack
                    };
                },
                account
            },
            (<MatchPlayerSelection
                onMatchChanged={onMatchChanged}
                onMatchOptionsChanged={onMatchOptionsChanged}
                on180={on180}
                onHiCheck={onHiCheck}
                setCreatePlayerFor={setCreatePlayerFor}
                {...props} />),
            null,
            null,
            'tbody');
    }

    function assertSelectedPlayer(cell, expected) {
        const displayedItem = cell.querySelector('.btn-group .dropdown-toggle');
        expect(displayedItem).toBeTruthy();

        if (expected) {
            expect(displayedItem.textContent).toEqual(expected);
        } else {
            expect(displayedItem.textContent.trim()).toEqual('');
        }
    }

    function assertSelectablePlayers(cell, expected) {
        const menuItems = Array.from(cell.querySelectorAll('.btn-group .dropdown-item'));
        const menuItemText = menuItems.map(item => item.textContent.trim());
        expect(menuItemText).toEqual([''].concat(expected));
    }

    function assertScore(cell, expected) {
        const input = cell.querySelector('input');
        expect(input).toBeTruthy();
        expect(input.value).toEqual(expected);
    }

    async function selectPlayer(cell, playerName) {
        const options = Array.from(cell.querySelectorAll('button.dropdown-item'));
        const option = options.filter(o => o.textContent === playerName)[0];
        if (option) {
            await doClick(option);
            return;
        }

        console.log(options.map(o => o.textContent));
        expect(option).toBeTruthy();
    }

    describe('renders', () => {
        const seasonId = createTemporaryId();
        const divisionId = createTemporaryId();
        const account = { access: {} };
        const homePlayer = { id: createTemporaryId(), name: 'HOME' };
        const awayPlayer = { id: createTemporaryId(), name: 'AWAY' };

        it('when no players selected', async () => {
            const props = {
                match: {
                    homeScore: null,
                    awayScore: null,
                    homePlayers: [ ],
                    awayPlayers: [ ],
                },
                otherMatches: [],
                disabled: false,
                homePlayers: [ homePlayer ],
                awayPlayers: [ awayPlayer ],
                readOnly: false,
                seasonId: seasonId,
                divisionId: divisionId,
                matchOptions: {
                    playerCount: 1,
                    numberOfLegs: 5,
                },
            };

            await renderComponent(account, props);

            expect(reportedError).toBeFalsy();
            const cells = Array.from(context.container.querySelectorAll('td'));
            assertSelectedPlayer(cells[0], null);
            assertScore(cells[1], '');
            assertScore(cells[3], '');
            assertSelectedPlayer(cells[4], null);
        });

        it('when no scores', async () => {
            const props = {
                match: {
                    homeScore: null,
                    awayScore: null,
                    homePlayers: [ homePlayer ],
                    awayPlayers: [ awayPlayer ],
                },
                otherMatches: [],
                disabled: false,
                homePlayers: [ homePlayer ],
                awayPlayers: [ awayPlayer ],
                readOnly: false,
                seasonId: seasonId,
                divisionId: divisionId,
                matchOptions: {
                    playerCount: 1,
                    numberOfLegs: 5,
                },
            };

            await renderComponent(account, props);

            expect(reportedError).toBeFalsy();
            const cells = Array.from(context.container.querySelectorAll('td'));
            assertScore(cells[1], '');
            assertScore(cells[3], '');
            expect(cells[0].className).not.toContain('bg-winner');
            expect(cells[1].className).not.toContain('bg-winner');
            expect(cells[3].className).not.toContain('bg-winner');
            expect(cells[4].className).not.toContain('bg-winner');
        });

        it('when home winner', async () => {
            const props = {
                match: {
                    homeScore: 3,
                    awayScore: 1,
                    homePlayers: [ homePlayer ],
                    awayPlayers: [ awayPlayer ],
                },
                otherMatches: [],
                disabled: false,
                homePlayers: [ homePlayer ],
                awayPlayers: [ awayPlayer ],
                readOnly: false,
                seasonId: seasonId,
                divisionId: divisionId,
                matchOptions: {
                    playerCount: 1,
                    numberOfLegs: 5,
                },
            };

            await renderComponent(account, props);

            expect(reportedError).toBeFalsy();
            const cells = Array.from(context.container.querySelectorAll('td'));
            assertSelectedPlayer(cells[0], 'HOME');
            assertScore(cells[1], '3');
            assertScore(cells[3], '1');
            assertSelectedPlayer(cells[4], 'AWAY');
            expect(cells[0].className).toContain('bg-winner');
            expect(cells[1].className).toContain('bg-winner');
            expect(cells[3].className).not.toContain('bg-winner');
            expect(cells[4].className).not.toContain('bg-winner');
        });

        it('when away winner', async () => {
            const props = {
                match: {
                    homeScore: 1,
                    awayScore: 3,
                    homePlayers: [ homePlayer ],
                    awayPlayers: [ awayPlayer ],
                },
                otherMatches: [],
                disabled: false,
                homePlayers: [ homePlayer ],
                awayPlayers: [ awayPlayer ],
                readOnly: false,
                seasonId: seasonId,
                divisionId: divisionId,
                matchOptions: {
                    playerCount: 1,
                    numberOfLegs: 5,
                },
            };

            await renderComponent(account, props);

            expect(reportedError).toBeFalsy();
            const cells = Array.from(context.container.querySelectorAll('td'));
            assertSelectedPlayer(cells[0], 'HOME');
            assertScore(cells[1], '1');
            assertScore(cells[3], '3');
            assertSelectedPlayer(cells[4], 'AWAY');
            expect(cells[0].className).not.toContain('bg-winner');
            expect(cells[1].className).not.toContain('bg-winner');
            expect(cells[3].className).toContain('bg-winner');
            expect(cells[4].className).toContain('bg-winner');
        });

        it('when a draw', async () => {
            const props = {
                match: {
                    homeScore: 1,
                    awayScore: 1,
                    homePlayers: [ homePlayer ],
                    awayPlayers: [ awayPlayer ],
                },
                otherMatches: [],
                disabled: false,
                homePlayers: [ homePlayer ],
                awayPlayers: [ awayPlayer ],
                readOnly: false,
                seasonId: seasonId,
                divisionId: divisionId,
                matchOptions: {
                    playerCount: 1,
                    numberOfLegs: 5,
                },
            };

            await renderComponent(account, props);

            expect(reportedError).toBeFalsy();
            const cells = Array.from(context.container.querySelectorAll('td'));
            assertSelectedPlayer(cells[0], 'HOME');
            assertScore(cells[1], '1');
            assertScore(cells[3], '1');
            assertSelectedPlayer(cells[4], 'AWAY');
            expect(cells[0].className).not.toContain('bg-winner');
            expect(cells[1].className).not.toContain('bg-winner');
            expect(cells[3].className).not.toContain('bg-winner');
            expect(cells[4].className).not.toContain('bg-winner');
        });

        it('possible home players', async () => {
            const anotherHomePlayer = { id: createTemporaryId(), name: 'ANOTHER HOME' };
            const props = {
                match: {
                    homeScore: 1,
                    awayScore: 1,
                    homePlayers: [ homePlayer ],
                    awayPlayers: [ awayPlayer ],
                },
                otherMatches: [],
                disabled: false,
                homePlayers: [ homePlayer, anotherHomePlayer ],
                awayPlayers: [ awayPlayer ],
                readOnly: false,
                seasonId: seasonId,
                divisionId: divisionId,
                matchOptions: {
                    playerCount: 1,
                    numberOfLegs: 5,
                },
            };

            await renderComponent(account, props);

            expect(reportedError).toBeFalsy();
            const cells = Array.from(context.container.querySelectorAll('td'));
            assertSelectablePlayers(cells[0], [ 'HOME', 'ANOTHER HOME' ]);
            assertSelectablePlayers(cells[4], [ 'AWAY' ]);
        });

        it('possible away players', async () => {
            const anotherAwayPlayer = { id: createTemporaryId(), name: 'ANOTHER AWAY' };
            const props = {
                match: {
                    homeScore: 1,
                    awayScore: 1,
                    homePlayers: [ homePlayer ],
                    awayPlayers: [ awayPlayer ],
                },
                otherMatches: [],
                disabled: false,
                homePlayers: [ homePlayer ],
                awayPlayers: [ awayPlayer, anotherAwayPlayer ],
                readOnly: false,
                seasonId: seasonId,
                divisionId: divisionId,
                matchOptions: {
                    playerCount: 1,
                    numberOfLegs: 5,
                },
            };

            await renderComponent(account, props);

            expect(reportedError).toBeFalsy();
            const cells = Array.from(context.container.querySelectorAll('td'));
            assertSelectablePlayers(cells[0], [ 'HOME' ]);
            assertSelectablePlayers(cells[4], [ 'AWAY', 'ANOTHER AWAY' ]);
        });

        it('when home players are selected for other matches', async () => {
            const anotherHomePlayer = { id: createTemporaryId(), name: 'ANOTHER HOME' };
            const props = {
                match: {
                    homeScore: 1,
                    awayScore: 1,
                    homePlayers: [ homePlayer ],
                    awayPlayers: [ awayPlayer ],
                },
                otherMatches: [ {
                    homeScore: 2,
                    awayScore: 2,
                    homePlayers: [ anotherHomePlayer ],
                    awayPlayers: [],
                    matchOptions: {
                        playerCount: 1,
                    }
                } ],
                disabled: false,
                homePlayers: [ homePlayer, anotherHomePlayer ],
                awayPlayers: [ awayPlayer ],
                readOnly: false,
                seasonId: seasonId,
                divisionId: divisionId,
                matchOptions: {
                    playerCount: 1,
                    numberOfLegs: 5,
                },
            };

            await renderComponent(account, props);

            expect(reportedError).toBeFalsy();
            const cells = Array.from(context.container.querySelectorAll('td'));
            assertSelectablePlayers(cells[0], [ 'HOME' ]);
            assertSelectablePlayers(cells[4], [ 'AWAY' ]);
        });

        it('when away players are selected for other matches', async () => {
            const anotherAwayPlayer = { id: createTemporaryId(), name: 'ANOTHER AWAY' };
            const props = {
                match: {
                    homeScore: 1,
                    awayScore: 1,
                    homePlayers: [ homePlayer ],
                    awayPlayers: [ awayPlayer ],
                },
                otherMatches: [ {
                    homeScore: 2,
                    awayScore: 2,
                    homePlayers: [ ],
                    awayPlayers: [ anotherAwayPlayer ],
                    matchOptions: {
                        playerCount: 1,
                    }
                } ],
                disabled: false,
                homePlayers: [ homePlayer ],
                awayPlayers: [ awayPlayer, anotherAwayPlayer ],
                readOnly: false,
                seasonId: seasonId,
                divisionId: divisionId,
                matchOptions: {
                    playerCount: 1,
                    numberOfLegs: 5,
                },
            };

            await renderComponent(account, props);

            expect(reportedError).toBeFalsy();
            const cells = Array.from(context.container.querySelectorAll('td'));
            assertSelectablePlayers(cells[0], [ 'HOME' ]);
            assertSelectablePlayers(cells[4], [ 'AWAY' ]);
        });

        it('when permitted to record scores as you go', async () => {
            const props = {
                match: {
                    homeScore: 1,
                    awayScore: 1,
                    homePlayers: [ homePlayer ],
                    awayPlayers: [ awayPlayer ],
                },
                otherMatches: [ ],
                disabled: false,
                homePlayers: [ homePlayer ],
                awayPlayers: [ awayPlayer ],
                readOnly: false,
                seasonId: seasonId,
                divisionId: divisionId,
                matchOptions: {
                    playerCount: 1,
                    numberOfLegs: 5,
                },
            };
            const account = {
                access: {
                    recordScoresAsYouGo: true
                }
            };

            await renderComponent(account, props);

            expect(reportedError).toBeFalsy();
            const cells = Array.from(context.container.querySelectorAll('td'));
            expect(cells[0].textContent).toContain('📊');
        });

        it('when not permitted to record scores as you go', async () => {
            const props = {
                match: {
                    homeScore: 1,
                    awayScore: 1,
                    homePlayers: [ homePlayer ],
                    awayPlayers: [ awayPlayer ],
                },
                otherMatches: [ ],
                disabled: false,
                homePlayers: [ homePlayer ],
                awayPlayers: [ awayPlayer ],
                readOnly: false,
                seasonId: seasonId,
                divisionId: divisionId,
                matchOptions: {
                    playerCount: 1,
                    numberOfLegs: 5,
                },
            };
            const account = {
                access: {
                    recordScoresAsYouGo: false
                }
            };

            await renderComponent(account, props);

            expect(reportedError).toBeFalsy();
            const cells = Array.from(context.container.querySelectorAll('td'));
            expect(cells[0].textContent).not.toContain('📊');
        });

        it('match options dialog', async () => {
            const props = {
                match: {
                    homeScore: 1,
                    awayScore: 1,
                    homePlayers: [ homePlayer ],
                    awayPlayers: [ awayPlayer ],
                },
                otherMatches: [ ],
                disabled: false,
                homePlayers: [ homePlayer ],
                awayPlayers: [ awayPlayer ],
                readOnly: false,
                seasonId: seasonId,
                divisionId: divisionId,
                matchOptions: {
                    playerCount: 1,
                    numberOfLegs: 5,
                },
            };
            await renderComponent(account, props);
            expect(reportedError).toBeFalsy();
            const cells = Array.from(context.container.querySelectorAll('td'));
            const matchOptionsButton = cells[4].querySelector('button[title]');
            expect(matchOptionsButton.textContent).toEqual('🛠');

            await doClick(matchOptionsButton);

            const matchOptionsDialog = cells[4].querySelector('div.modal-dialog');
            expect(matchOptionsDialog).toBeTruthy();
        });

        it('sayg dialog', async () => {
            const props = {
                match: {
                    homeScore: 1,
                    awayScore: 1,
                    homePlayers: [ homePlayer ],
                    awayPlayers: [ awayPlayer ],
                },
                otherMatches: [ ],
                disabled: false,
                homePlayers: [ homePlayer ],
                awayPlayers: [ awayPlayer ],
                readOnly: false,
                seasonId: seasonId,
                divisionId: divisionId,
                matchOptions: {
                    playerCount: 1,
                    numberOfLegs: 5,
                },
            };
            const account = {
                access: {
                    recordScoresAsYouGo: true
                }
            };
            await renderComponent(account, props);
            expect(reportedError).toBeFalsy();
            const cells = Array.from(context.container.querySelectorAll('td'));
            const matchOptionsButton = cells[0].querySelector('button.position-absolute');
            expect(matchOptionsButton.textContent).toEqual('📊');

            await doClick(matchOptionsButton);

            const matchOptionsDialog = cells[0].querySelector('div.modal-dialog');
            expect(matchOptionsDialog).toBeTruthy();
        });
    });

    describe('interactivity', () => {
        const seasonId = createTemporaryId();
        const divisionId = createTemporaryId();
        const account = { access: { managePlayers: true } };
        const homePlayer = { id: createTemporaryId(), name: 'HOME' };
        const awayPlayer = { id: createTemporaryId(), name: 'AWAY' };
        const newPlayer = { id: NEW_PLAYER, name: 'Add a player...' };

        it('can set home player', async () => {
            const props = {
                match: {
                    homeScore: null,
                    awayScore: null,
                    homePlayers: [ ],
                    awayPlayers: [ ],
                },
                otherMatches: [],
                disabled: false,
                homePlayers: [ homePlayer, newPlayer ],
                awayPlayers: [ awayPlayer, newPlayer ],
                readOnly: false,
                seasonId: seasonId,
                divisionId: divisionId,
                matchOptions: {
                    playerCount: 1,
                    numberOfLegs: 5,
                },
            };
            await renderComponent(account, props);
            expect(reportedError).toBeFalsy();
            const cells = Array.from(context.container.querySelectorAll('td'));

            await selectPlayer(cells[0], 'HOME');

            expect(reportedError).toBeNull();
            expect(createPlayerFor).toBeNull();
            expect(updatedMatch).not.toBeNull();
            expect(updatedMatch.homePlayers).toEqual([ homePlayer ]);
            expect(updatedMatch.awayPlayers).toEqual([ ]);
            expect(updatedMatch.homeScore).toEqual(null);
            expect(updatedMatch.awayScore).toEqual(null);
        });

        it('can add a home player', async () => {
            const props = {
                match: {
                    homeScore: null,
                    awayScore: null,
                    homePlayers: [ ],
                    awayPlayers: [ ],
                },
                otherMatches: [],
                disabled: false,
                homePlayers: [ homePlayer, newPlayer ],
                awayPlayers: [ awayPlayer, newPlayer ],
                readOnly: false,
                seasonId: seasonId,
                divisionId: divisionId,
                matchOptions: {
                    playerCount: 1,
                    numberOfLegs: 5,
                },
            };
            await renderComponent(account, props);
            expect(reportedError).toBeFalsy();
            const cells = Array.from(context.container.querySelectorAll('td'));

            await selectPlayer(cells[0], 'Add a player...');

            expect(reportedError).toBeNull();
            expect(createPlayerFor).not.toBeNull();
            expect(createPlayerFor).toEqual({
                index: 0,
                side: 'home',
            });
            expect(updatedMatch).toBeNull();
        });

        it('can remove/unset a home player', async () => {
            const props = {
                match: {
                    homeScore: null,
                    awayScore: null,
                    homePlayers: [ homePlayer ],
                    awayPlayers: [ ],
                },
                otherMatches: [],
                disabled: false,
                homePlayers: [ homePlayer, newPlayer ],
                awayPlayers: [ awayPlayer, newPlayer ],
                readOnly: false,
                seasonId: seasonId,
                divisionId: divisionId,
                matchOptions: {
                    playerCount: 1,
                    numberOfLegs: 5,
                },
            };
            await renderComponent(account, props);
            expect(reportedError).toBeFalsy();
            const cells = Array.from(context.container.querySelectorAll('td'));

            await selectPlayer(cells[0], ' ');

            expect(reportedError).toBeNull();
            expect(createPlayerFor).toBeNull();
            expect(updatedMatch).not.toBeNull();
            expect(updatedMatch.homePlayers).toEqual([ ]);
            expect(updatedMatch.awayPlayers).toEqual([ ]);
            expect(updatedMatch.homeScore).toEqual(null);
            expect(updatedMatch.awayScore).toEqual(null);
        });

        it('can set away player', async () => {
            const props = {
                match: {
                    homeScore: null,
                    awayScore: null,
                    homePlayers: [ ],
                    awayPlayers: [ ],
                },
                otherMatches: [],
                disabled: false,
                homePlayers: [ homePlayer, newPlayer ],
                awayPlayers: [ awayPlayer, newPlayer ],
                readOnly: false,
                seasonId: seasonId,
                divisionId: divisionId,
                matchOptions: {
                    playerCount: 1,
                    numberOfLegs: 5,
                },
            };
            await renderComponent(account, props);
            expect(reportedError).toBeFalsy();
            const cells = Array.from(context.container.querySelectorAll('td'));

            await selectPlayer(cells[4], 'AWAY');

            expect(reportedError).toBeNull();
            expect(createPlayerFor).toBeNull();
            expect(updatedMatch).not.toBeNull();
            expect(updatedMatch.homePlayers).toEqual([ ]);
            expect(updatedMatch.awayPlayers).toEqual([ awayPlayer ]);
            expect(updatedMatch.homeScore).toEqual(null);
            expect(updatedMatch.awayScore).toEqual(null);
        });

        it('can add an away player', async () => {
            const props = {
                match: {
                    homeScore: null,
                    awayScore: null,
                    homePlayers: [ ],
                    awayPlayers: [ ],
                },
                otherMatches: [],
                disabled: false,
                homePlayers: [ homePlayer, newPlayer ],
                awayPlayers: [ awayPlayer, newPlayer ],
                readOnly: false,
                seasonId: seasonId,
                divisionId: divisionId,
                matchOptions: {
                    playerCount: 1,
                    numberOfLegs: 5,
                },
            };
            await renderComponent(account, props);
            expect(reportedError).toBeFalsy();
            const cells = Array.from(context.container.querySelectorAll('td'));

            await selectPlayer(cells[4], 'Add a player...');

            expect(reportedError).toBeNull();
            expect(createPlayerFor).not.toBeNull();
            expect(createPlayerFor).toEqual({
                index: 0,
                side: 'away',
            });
            expect(updatedMatch).toBeNull();
        });

        it('can remove/unset an away player', async () => {
            const props = {
                match: {
                    homeScore: null,
                    awayScore: null,
                    homePlayers: [ ],
                    awayPlayers: [ awayPlayer ],
                },
                otherMatches: [],
                disabled: false,
                homePlayers: [ homePlayer, newPlayer ],
                awayPlayers: [ awayPlayer, newPlayer ],
                readOnly: false,
                seasonId: seasonId,
                divisionId: divisionId,
                matchOptions: {
                    playerCount: 1,
                    numberOfLegs: 5,
                },
            };
            await renderComponent(account, props);
            expect(reportedError).toBeFalsy();
            const cells = Array.from(context.container.querySelectorAll('td'));

            await selectPlayer(cells[4], ' ');

            expect(reportedError).toBeNull();
            expect(createPlayerFor).toBeNull();
            expect(updatedMatch).not.toBeNull();
            expect(updatedMatch.homePlayers).toEqual([ ]);
            expect(updatedMatch.awayPlayers).toEqual([ ]);
            expect(updatedMatch.homeScore).toEqual(null);
            expect(updatedMatch.awayScore).toEqual(null);
        });

        it('can update home score', async () => {
            const props = {
                match: {
                    homeScore: null,
                    awayScore: null,
                    homePlayers: [ ],
                    awayPlayers: [ ],
                },
                otherMatches: [],
                disabled: false,
                homePlayers: [ homePlayer, newPlayer ],
                awayPlayers: [ awayPlayer, newPlayer ],
                readOnly: false,
                seasonId: seasonId,
                divisionId: divisionId,
                matchOptions: {
                    playerCount: 1,
                    numberOfLegs: 5,
                },
            };
            await renderComponent(account, props);
            expect(reportedError).toBeFalsy();
            const cells = Array.from(context.container.querySelectorAll('td'));

            doChange(cells[1], 'input', '3');

            expect(reportedError).toBeNull();
            expect(createPlayerFor).toBeNull();
            expect(updatedMatch).not.toBeNull();
            expect(updatedMatch.homePlayers).toEqual([ ]);
            expect(updatedMatch.awayPlayers).toEqual([ ]);
            expect(updatedMatch.homeScore).toEqual(3);
            expect(updatedMatch.awayScore).toEqual(null);
        });

        it('can update away score', async () => {
            const props = {
                match: {
                    homeScore: null,
                    awayScore: null,
                    homePlayers: [ ],
                    awayPlayers: [ ],
                },
                otherMatches: [],
                disabled: false,
                homePlayers: [ homePlayer, newPlayer ],
                awayPlayers: [ awayPlayer, newPlayer ],
                readOnly: false,
                seasonId: seasonId,
                divisionId: divisionId,
                matchOptions: {
                    playerCount: 1,
                    numberOfLegs: 5,
                },
            };
            await renderComponent(account, props);
            expect(reportedError).toBeFalsy();
            const cells = Array.from(context.container.querySelectorAll('td'));

            doChange(cells[3], 'input', '3');

            expect(reportedError).toBeNull();
            expect(createPlayerFor).toBeNull();
            expect(updatedMatch).not.toBeNull();
            expect(updatedMatch.homePlayers).toEqual([ ]);
            expect(updatedMatch.awayPlayers).toEqual([ ]);
            expect(updatedMatch.homeScore).toEqual(null);
            expect(updatedMatch.awayScore).toEqual(3);
        });

        it('sets homeScore to numberOfLegs if greater than numberOfLegs', async () => {
            const props = {
                match: {
                    homeScore: null,
                    awayScore: null,
                    homePlayers: [ ],
                    awayPlayers: [ ],
                },
                otherMatches: [],
                disabled: false,
                homePlayers: [ homePlayer, newPlayer ],
                awayPlayers: [ awayPlayer, newPlayer ],
                readOnly: false,
                seasonId: seasonId,
                divisionId: divisionId,
                matchOptions: {
                    playerCount: 1,
                    numberOfLegs: 5,
                },
            };
            await renderComponent(account, props);
            expect(reportedError).toBeFalsy();
            const cells = Array.from(context.container.querySelectorAll('td'));

            doChange(cells[1], 'input', '6');

            expect(reportedError).toBeNull();
            expect(createPlayerFor).toBeNull();
            expect(updatedMatch).not.toBeNull();
            expect(updatedMatch.homePlayers).toEqual([ ]);
            expect(updatedMatch.awayPlayers).toEqual([ ]);
            expect(updatedMatch.homeScore).toEqual(5);
            expect(updatedMatch.awayScore).toEqual(null);
        });

        it('sets awayScore to numberOfLegs if greater than numberOfLegs', async () => {
            const props = {
                match: {
                    homeScore: null,
                    awayScore: null,
                    homePlayers: [ ],
                    awayPlayers: [ ],
                },
                otherMatches: [],
                disabled: false,
                homePlayers: [ homePlayer, newPlayer ],
                awayPlayers: [ awayPlayer, newPlayer ],
                readOnly: false,
                seasonId: seasonId,
                divisionId: divisionId,
                matchOptions: {
                    playerCount: 1,
                    numberOfLegs: 5,
                },
            };
            await renderComponent(account, props);
            expect(reportedError).toBeFalsy();
            const cells = Array.from(context.container.querySelectorAll('td'));

            doChange(cells[3], 'input', '6');

            expect(reportedError).toBeNull();
            expect(createPlayerFor).toBeNull();
            expect(updatedMatch).not.toBeNull();
            expect(updatedMatch.homePlayers).toEqual([ ]);
            expect(updatedMatch.awayPlayers).toEqual([ ]);
            expect(updatedMatch.homeScore).toEqual(null);
            expect(updatedMatch.awayScore).toEqual(5);
        });

        it('changes away score down if entered home score + existing away score > numberOfLegs', async () => {
            const props = {
                match: {
                    homeScore: null,
                    awayScore: 3,
                    homePlayers: [ ],
                    awayPlayers: [ ],
                },
                otherMatches: [],
                disabled: false,
                homePlayers: [ homePlayer, newPlayer ],
                awayPlayers: [ awayPlayer, newPlayer ],
                readOnly: false,
                seasonId: seasonId,
                divisionId: divisionId,
                matchOptions: {
                    playerCount: 1,
                    numberOfLegs: 5,
                },
            };
            await renderComponent(account, props);
            expect(reportedError).toBeFalsy();
            const cells = Array.from(context.container.querySelectorAll('td'));

            doChange(cells[1], 'input', '3');

            expect(reportedError).toBeNull();
            expect(createPlayerFor).toBeNull();
            expect(updatedMatch).not.toBeNull();
            expect(updatedMatch.homePlayers).toEqual([ ]);
            expect(updatedMatch.awayPlayers).toEqual([ ]);
            expect(updatedMatch.homeScore).toEqual(3);
            expect(updatedMatch.awayScore).toEqual(2);
        });

        it('changes home score down if entered away score + existing home score > numberOfLegs', async () => {
            const props = {
                match: {
                    homeScore: 3,
                    awayScore: null,
                    homePlayers: [ ],
                    awayPlayers: [ ],
                },
                otherMatches: [],
                disabled: false,
                homePlayers: [ homePlayer, newPlayer ],
                awayPlayers: [ awayPlayer, newPlayer ],
                readOnly: false,
                seasonId: seasonId,
                divisionId: divisionId,
                matchOptions: {
                    playerCount: 1,
                    numberOfLegs: 5,
                },
            };
            await renderComponent(account, props);
            expect(reportedError).toBeFalsy();
            const cells = Array.from(context.container.querySelectorAll('td'));

            doChange(cells[3], 'input', '3');

            expect(reportedError).toBeNull();
            expect(createPlayerFor).toBeNull();
            expect(updatedMatch).not.toBeNull();
            expect(updatedMatch.homePlayers).toEqual([ ]);
            expect(updatedMatch.awayPlayers).toEqual([ ]);
            expect(updatedMatch.homeScore).toEqual(2);
            expect(updatedMatch.awayScore).toEqual(3);
        });

        it('can update match options [playerCount]', async () => {
            const props = {
                match: {
                    homeScore: 1,
                    awayScore: 1,
                    homePlayers: [ homePlayer ],
                    awayPlayers: [ awayPlayer ],
                },
                otherMatches: [ ],
                disabled: false,
                homePlayers: [ homePlayer ],
                awayPlayers: [ awayPlayer ],
                readOnly: false,
                seasonId: seasonId,
                divisionId: divisionId,
                matchOptions: {
                    playerCount: 1,
                    numberOfLegs: 5,
                    startingScore: 501,
                },
            };
            await renderComponent(account, props);
            expect(reportedError).toBeFalsy();
            const cells = Array.from(context.container.querySelectorAll('td'));
            const matchOptionsButton = cells[4].querySelector('button[title]');
            expect(matchOptionsButton.textContent).toEqual('🛠');
            await doClick(matchOptionsButton);
            const matchOptionsDialog = cells[4].querySelector('div.modal-dialog');
            expect(matchOptionsDialog).toBeTruthy();

            doChange(matchOptionsDialog, 'input[name="playerCount"]', '3');

            expect(updatedMatchOptions).not.toBeNull();
            expect(updatedMatchOptions).toEqual({
                playerCount: '3',
                numberOfLegs: 5,
                startingScore: 501,
            });
        });

        it('can update match options [numberOfLegs]', async () => {
            const props = {
                match: {
                    homeScore: 1,
                    awayScore: 1,
                    homePlayers: [ homePlayer ],
                    awayPlayers: [ awayPlayer ],
                },
                otherMatches: [ ],
                disabled: false,
                homePlayers: [ homePlayer ],
                awayPlayers: [ awayPlayer ],
                readOnly: false,
                seasonId: seasonId,
                divisionId: divisionId,
                matchOptions: {
                    playerCount: 1,
                    numberOfLegs: 5,
                    startingScore: 501,
                },
            };
            await renderComponent(account, props);
            expect(reportedError).toBeFalsy();
            const cells = Array.from(context.container.querySelectorAll('td'));
            const matchOptionsButton = cells[4].querySelector('button[title]');
            expect(matchOptionsButton.textContent).toEqual('🛠');
            await doClick(matchOptionsButton);
            const matchOptionsDialog = cells[4].querySelector('div.modal-dialog');
            expect(matchOptionsDialog).toBeTruthy();

            doChange(matchOptionsDialog, 'input[name="numberOfLegs"]', '3');

            expect(updatedMatchOptions).not.toBeNull();
            expect(updatedMatchOptions).toEqual({
                playerCount: 1,
                numberOfLegs: '3',
                startingScore: 501,
            });
        });

        it('can update match options [startingScore]', async () => {
            const props = {
                match: {
                    homeScore: 1,
                    awayScore: 1,
                    homePlayers: [ homePlayer ],
                    awayPlayers: [ awayPlayer ],
                },
                otherMatches: [ ],
                disabled: false,
                homePlayers: [ homePlayer ],
                awayPlayers: [ awayPlayer ],
                readOnly: false,
                seasonId: seasonId,
                divisionId: divisionId,
                matchOptions: {
                    playerCount: 1,
                    numberOfLegs: 5,
                    startingScore: 501,
                },
            };
            await renderComponent(account, props);
            expect(reportedError).toBeFalsy();
            const cells = Array.from(context.container.querySelectorAll('td'));
            const matchOptionsButton = cells[4].querySelector('button[title]');
            expect(matchOptionsButton.textContent).toEqual('🛠');
            await doClick(matchOptionsButton);
            const matchOptionsDialog = cells[4].querySelector('div.modal-dialog');
            expect(matchOptionsDialog).toBeTruthy();

            doChange(matchOptionsDialog, 'input[name="startingScore"]', '601');

            expect(updatedMatchOptions).not.toBeNull();
            expect(updatedMatchOptions).toEqual({
                playerCount: 1,
                numberOfLegs: 5,
                startingScore: '601',
            });
        });

        it('cannot modify players when readonly', async () => {
            const props = {
                match: {
                    homeScore: null,
                    awayScore: null,
                    homePlayers: [ ],
                    awayPlayers: [ ],
                },
                otherMatches: [],
                disabled: false,
                homePlayers: [ homePlayer, newPlayer ],
                awayPlayers: [ awayPlayer, newPlayer ],
                readOnly: true,
                seasonId: seasonId,
                divisionId: divisionId,
                matchOptions: {
                    playerCount: 1,
                    numberOfLegs: 5,
                },
            };
            await renderComponent(account, props);
            expect(reportedError).toBeFalsy();
            const cells = Array.from(context.container.querySelectorAll('td'));

            await selectPlayer(cells[0], 'HOME');
            expect(reportedError).toBeNull();
            expect(createPlayerFor).toBeNull();
            expect(updatedMatch).toBeNull();

            await selectPlayer(cells[4], 'AWAY');
            expect(reportedError).toBeNull();
            expect(createPlayerFor).toBeNull();
            expect(updatedMatch).toBeNull();
        });

        it('cannot modify scores when readonly', async () => {
            const props = {
                match: {
                    homeScore: null,
                    awayScore: null,
                    homePlayers: [ ],
                    awayPlayers: [ ],
                },
                otherMatches: [],
                disabled: false,
                homePlayers: [ homePlayer, newPlayer ],
                awayPlayers: [ awayPlayer, newPlayer ],
                readOnly: true,
                seasonId: seasonId,
                divisionId: divisionId,
                matchOptions: {
                    playerCount: 1,
                    numberOfLegs: 5,
                },
            };
            await renderComponent(account, props);
            expect(reportedError).toBeFalsy();
            const cells = Array.from(context.container.querySelectorAll('td'));

            doChange(cells[1], 'input', '3');
            expect(reportedError).toBeNull();
            expect(createPlayerFor).toBeNull();
            expect(updatedMatch).toBeNull();

            doChange(cells[3], 'input', '3');
            expect(reportedError).toBeNull();
            expect(createPlayerFor).toBeNull();
            expect(updatedMatch).toBeNull();
        });

        it('cannot modify players when disabled', async () => {
            const props = {
                match: {
                    homeScore: null,
                    awayScore: null,
                    homePlayers: [ ],
                    awayPlayers: [ ],
                },
                otherMatches: [],
                disabled: true,
                homePlayers: [ homePlayer, newPlayer ],
                awayPlayers: [ awayPlayer, newPlayer ],
                readOnly: false,
                seasonId: seasonId,
                divisionId: divisionId,
                matchOptions: {
                    playerCount: 1,
                    numberOfLegs: 5,
                },
            };

            await renderComponent(account, props);

            expect(reportedError).toBeFalsy();
            const cells = Array.from(context.container.querySelectorAll('td'));
            const homePlayers = Array.from(cells[0].querySelectorAll('.dropdown-item'));
            const awayPlayers = Array.from(cells[4].querySelectorAll('.dropdown-item'));
            expect(homePlayers).toEqual([]);
            expect(awayPlayers).toEqual([]);
        });

        it('cannot modify scores when disabled', async () => {
            const props = {
                match: {
                    homeScore: null,
                    awayScore: null,
                    homePlayers: [ ],
                    awayPlayers: [ ],
                },
                otherMatches: [],
                disabled: true,
                homePlayers: [ homePlayer, newPlayer ],
                awayPlayers: [ awayPlayer, newPlayer ],
                readOnly: false,
                seasonId: seasonId,
                divisionId: divisionId,
                matchOptions: {
                    playerCount: 1,
                    numberOfLegs: 5,
                },
            };

            await renderComponent(account, props);
            expect(reportedError).toBeFalsy();
            const cells = Array.from(context.container.querySelectorAll('td'));
            const homeScore = cells[1].querySelector('input');
            const awayScore = cells[3].querySelector('input');
            expect(homeScore).toBeFalsy();
            expect(awayScore).toBeFalsy();
        });
    });
});