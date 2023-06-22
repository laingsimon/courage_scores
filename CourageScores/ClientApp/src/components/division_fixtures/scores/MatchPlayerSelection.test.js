// noinspection JSUnresolvedFunction

import React from "react";
import {cleanUp, renderApp, doClick, doChange, findButton, doSelectOption} from "../../../helpers/tests";
import {MatchPlayerSelection, NEW_PLAYER} from "./MatchPlayerSelection";
import {createTemporaryId} from "../../../helpers/projection";
import {LeagueFixtureContainer} from "../LeagueFixtureContainer";
import {MatchTypeContainer} from "./MatchTypeContainer";

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
    const onHiCheck = (notablePlayer, score) => {
        additionalHiCheck = { notablePlayer, score };
    }
    const setCreatePlayerFor = (opts) => {
        createPlayerFor = opts;
    }

    afterEach(() => {
        cleanUp(context);
    });

    async function renderComponent(account, props, containerProps, matchTypeProps) {
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
            (<LeagueFixtureContainer {...containerProps}>
                <MatchTypeContainer {...matchTypeProps} setCreatePlayerFor={setCreatePlayerFor}>
                    <MatchPlayerSelection
                        onMatchChanged={onMatchChanged}
                        onMatchOptionsChanged={onMatchOptionsChanged}
                        on180={on180}
                        onHiCheck={onHiCheck}
                        {...props} />
                </MatchTypeContainer>
            </LeagueFixtureContainer>),
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
        await doSelectOption(cell.querySelector('.dropdown-menu'), playerName);
    }

    describe('renders', () => {
        const seasonId = createTemporaryId();
        const divisionId = createTemporaryId();
        const account = { access: { } };
        const homePlayer = { id: createTemporaryId(), name: 'HOME' };
        const awayPlayer = { id: createTemporaryId(), name: 'AWAY' };
        const newPlayer = { id: NEW_PLAYER, name: 'Add a player...' };
        const defaultMatchType = {
            otherMatches: [],
            matchOptions: {
                playerCount: 1,
                numberOfLegs: 5,
            },
        };
        const defaultContainerProps = {
            disabled: false,
            readOnly: false,
            seasonId: seasonId,
            divisionId: divisionId,
            homePlayers: [ homePlayer, newPlayer ],
            awayPlayers: [ awayPlayer, newPlayer ],
        };

        it('when no players selected', async () => {
            const props = {
                match: {
                    homeScore: null,
                    awayScore: null,
                    homePlayers: [ ],
                    awayPlayers: [ ],
                },
            };

            await renderComponent(account, props, defaultContainerProps, defaultMatchType);

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
                matchOptions: {
                    playerCount: 1,
                    numberOfLegs: 5,
                },
            };

            await renderComponent(account, props, defaultContainerProps, defaultMatchType);

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
            };

            await renderComponent(account, props, defaultContainerProps, defaultMatchType);

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
            };

            await renderComponent(account, props, defaultContainerProps, defaultMatchType);

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
            };

            await renderComponent(account, props, defaultContainerProps, defaultMatchType);

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
            };
            const containerProps = {
                disabled: false,
                readOnly: false,
                seasonId: seasonId,
                divisionId: divisionId,
                homePlayers: [ homePlayer, anotherHomePlayer ],
                awayPlayers: [ awayPlayer ],
            };

            await renderComponent(account, props, containerProps, defaultMatchType);

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
            };
            const containerProps = {
                disabled: false,
                readOnly: false,
                seasonId: seasonId,
                divisionId: divisionId,
                homePlayers: [ homePlayer ],
                awayPlayers: [ awayPlayer, anotherAwayPlayer ],
            };

            await renderComponent(account, props, containerProps, defaultMatchType);

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
            };
            const containerProps = {
                disabled: false,
                readOnly: false,
                seasonId: seasonId,
                divisionId: divisionId,
                homePlayers: [ homePlayer, anotherHomePlayer ],
                awayPlayers: [ awayPlayer ],
            };
            const matchTypeProps = {
                otherMatches: [ {
                    homeScore: 2,
                    awayScore: 2,
                    homePlayers: [ anotherHomePlayer ],
                    awayPlayers: [],
                    matchOptions: {
                        playerCount: 1,
                    }
                } ],
                matchOptions: {
                    playerCount: 1,
                    numberOfLegs: 5,
                },
            };

            await renderComponent(account, props, containerProps, matchTypeProps);

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
            };
            const containerProps = {
                disabled: false,
                readOnly: false,
                seasonId: seasonId,
                divisionId: divisionId,
                homePlayers: [ homePlayer ],
                awayPlayers: [ awayPlayer, anotherAwayPlayer ],
            };
            const matchTypeProps = {
                otherMatches: [ {
                    homeScore: 2,
                    awayScore: 2,
                    homePlayers: [ ],
                    awayPlayers: [ anotherAwayPlayer ],
                    matchOptions: {
                        playerCount: 1,
                    }
                } ],
                matchOptions: {
                    playerCount: 1,
                    numberOfLegs: 5,
                },
            };

            await renderComponent(account, props, containerProps, matchTypeProps);

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
            };
            const account = {
                access: {
                    recordScoresAsYouGo: true
                }
            };

            await renderComponent(account, props, defaultContainerProps, defaultMatchType);

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
            };
            const account = {
                access: {
                    recordScoresAsYouGo: false
                }
            };

            await renderComponent(account, props, defaultContainerProps, defaultMatchType);

            expect(reportedError).toBeFalsy();
            const cells = Array.from(context.container.querySelectorAll('td'));
            expect(cells[0].textContent).not.toContain('📊');
        });
    });

    describe('interactivity', () => {
        const seasonId = createTemporaryId();
        const divisionId = createTemporaryId();
        const account = { access: { managePlayers: true } };
        const homePlayer = { id: createTemporaryId(), name: 'HOME' };
        const awayPlayer = { id: createTemporaryId(), name: 'AWAY' };
        const newPlayer = { id: NEW_PLAYER, name: 'Add a player...' };
        const defaultMatchType = {
            otherMatches: [],
            matchOptions: {
                playerCount: 1,
                numberOfLegs: 5,
            },
        };
        const defaultContainerProps = {
            disabled: false,
            readOnly: false,
            seasonId: seasonId,
            divisionId: divisionId,
            homePlayers: [ homePlayer, newPlayer ],
            awayPlayers: [ awayPlayer, newPlayer ],
        };

        it('can set home player', async () => {
            const props = {
                match: {
                    homeScore: null,
                    awayScore: null,
                    homePlayers: [ ],
                    awayPlayers: [ ],
                },
            };
            await renderComponent(account, props, defaultContainerProps, defaultMatchType);
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
            };
            await renderComponent(account, props, defaultContainerProps, defaultMatchType);
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
            };
            await renderComponent(account, props, defaultContainerProps, defaultMatchType);
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
            };
            await renderComponent(account, props, defaultContainerProps, defaultMatchType);
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
            };
            await renderComponent(account, props, defaultContainerProps, defaultMatchType);
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
            };
            await renderComponent(account, props, defaultContainerProps, defaultMatchType);
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
            };
            await renderComponent(account, props, defaultContainerProps, defaultMatchType);
            expect(reportedError).toBeFalsy();
            const cells = Array.from(context.container.querySelectorAll('td'));

            await doChange(cells[1], 'input', '3', context.user);

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
            };
            await renderComponent(account, props, defaultContainerProps, defaultMatchType);
            expect(reportedError).toBeFalsy();
            const cells = Array.from(context.container.querySelectorAll('td'));

            await doChange(cells[3], 'input', '3', context.user);

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
            };
            await renderComponent(account, props, defaultContainerProps, defaultMatchType);
            expect(reportedError).toBeFalsy();
            const cells = Array.from(context.container.querySelectorAll('td'));

            await doChange(cells[1], 'input', '6', context.user);

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
            };
            await renderComponent(account, props, defaultContainerProps, defaultMatchType);
            expect(reportedError).toBeFalsy();
            const cells = Array.from(context.container.querySelectorAll('td'));

            await doChange(cells[3], 'input', '6', context.user);

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
            };
            await renderComponent(account, props, defaultContainerProps, defaultMatchType);
            expect(reportedError).toBeFalsy();
            const cells = Array.from(context.container.querySelectorAll('td'));

            await doChange(cells[1], 'input', '3', context.user);

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
            };
            await renderComponent(account, props, defaultContainerProps, defaultMatchType);
            expect(reportedError).toBeFalsy();
            const cells = Array.from(context.container.querySelectorAll('td'));

            await doChange(cells[3], 'input', '3', context.user);

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
            };
            const matchTypeProps = {
                otherMatches: [ ],
                matchOptions: {
                    playerCount: 1,
                    numberOfLegs: 5,
                    startingScore: 501,
                },
            };
            await renderComponent(account, props, defaultContainerProps, matchTypeProps);
            expect(reportedError).toBeFalsy();
            const cells = Array.from(context.container.querySelectorAll('td'));
            await doClick(findButton(cells[4], '🛠'));
            const matchOptionsDialog = cells[4].querySelector('div.modal-dialog');
            expect(matchOptionsDialog).toBeTruthy();

            await doChange(matchOptionsDialog, 'input[name="playerCount"]', '3', context.user);

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
            };
            const matchTypeProps = {
                otherMatches: [ ],
                matchOptions: {
                    playerCount: 1,
                    numberOfLegs: 5,
                    startingScore: 501,
                },
            };
            await renderComponent(account, props, defaultContainerProps, matchTypeProps);
            expect(reportedError).toBeFalsy();
            const cells = Array.from(context.container.querySelectorAll('td'));
            await doClick(findButton(cells[4], '🛠'));
            const matchOptionsDialog = cells[4].querySelector('div.modal-dialog');
            expect(matchOptionsDialog).toBeTruthy();

            await doChange(matchOptionsDialog, 'input[name="numberOfLegs"]', '3', context.user);

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
            };
            const matchTypeProps = {
                otherMatches: [ ],
                matchOptions: {
                    playerCount: 1,
                    numberOfLegs: 5,
                    startingScore: 501,
                },
            };
            await renderComponent(account, props, defaultContainerProps, matchTypeProps);
            expect(reportedError).toBeFalsy();
            const cells = Array.from(context.container.querySelectorAll('td'));
            await doClick(findButton(cells[4], '🛠'));
            const matchOptionsDialog = cells[4].querySelector('div.modal-dialog');
            expect(matchOptionsDialog).toBeTruthy();

            await doChange(matchOptionsDialog, 'input[name="startingScore"]', '601', context.user);

            expect(updatedMatchOptions).not.toBeNull();
            expect(updatedMatchOptions).toEqual({
                playerCount: 1,
                numberOfLegs: 5,
                startingScore: '601',
            });
        });

        it('can close match options dialog', async () => {
            const props = {
                match: {
                    homeScore: 1,
                    awayScore: 1,
                    homePlayers: [ homePlayer ],
                    awayPlayers: [ awayPlayer ],
                },
            };
            const matchTypeProps = {
                otherMatches: [ ],
                matchOptions: {
                    playerCount: 1,
                    numberOfLegs: 5,
                    startingScore: 501,
                },
            };
            await renderComponent(account, props, defaultContainerProps, matchTypeProps);
            expect(reportedError).toBeFalsy();
            const cells = Array.from(context.container.querySelectorAll('td'));
            await doClick(findButton(cells[4], '🛠'));
            const matchOptionsDialog = cells[4].querySelector('div.modal-dialog');
            expect(matchOptionsDialog).toBeTruthy();

            await doClick(findButton(matchOptionsDialog, 'Close'));

            expect(reportedError).toBeFalsy();
            expect(cells[4].querySelector('div.modal-dialog')).toBeFalsy();
        });

        it('cannot modify players when readonly', async () => {
            const props = {
                match: {
                    homeScore: null,
                    awayScore: null,
                    homePlayers: [ ],
                    awayPlayers: [ ],
                },
            };
            const containerProps = {
                disabled: false,
                readOnly: true,
                seasonId: seasonId,
                divisionId: divisionId,
                homePlayers: [ homePlayer, newPlayer ],
                awayPlayers: [ awayPlayer, newPlayer ],
            };
            await renderComponent(account, props, containerProps, defaultMatchType);
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
            };
            const containerProps = {
                disabled: false,
                readOnly: true,
                seasonId: seasonId,
                divisionId: divisionId,
                homePlayers: [ homePlayer, newPlayer ],
                awayPlayers: [ awayPlayer, newPlayer ],
            };
            await renderComponent(account, props, containerProps, defaultMatchType);
            expect(reportedError).toBeFalsy();
            const cells = Array.from(context.container.querySelectorAll('td'));

            await doChange(cells[1], 'input', '3', context.user);
            expect(reportedError).toBeNull();
            expect(createPlayerFor).toBeNull();
            expect(updatedMatch).toBeNull();

            await doChange(cells[3], 'input', '3', context.user);
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
            };
            const containerProps = {
                disabled: true,
                readOnly: false,
                seasonId: seasonId,
                divisionId: divisionId,
                homePlayers: [ homePlayer, newPlayer ],
                awayPlayers: [ awayPlayer, newPlayer ],
            };

            await renderComponent(account, props, containerProps, defaultMatchType);

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
            };
            const containerProps = {
                disabled: true,
                readOnly: false,
                seasonId: seasonId,
                divisionId: divisionId,
                homePlayers: [ homePlayer, newPlayer ],
                awayPlayers: [ awayPlayer, newPlayer ],
            };

            await renderComponent(account, props, containerProps, defaultMatchType);
            expect(reportedError).toBeFalsy();
            const cells = Array.from(context.container.querySelectorAll('td'));
            const homeScore = cells[1].querySelector('input');
            const awayScore = cells[3].querySelector('input');
            expect(homeScore).toBeFalsy();
            expect(awayScore).toBeFalsy();
        });

        it('can open sayg dialog', async () => {
            const props = {
                match: {
                    homeScore: 1,
                    awayScore: 1,
                    homePlayers: [ homePlayer ],
                    awayPlayers: [ awayPlayer ],
                },
            };
            const account = {
                access: {
                    recordScoresAsYouGo: true
                }
            };
            await renderComponent(account, props, defaultContainerProps, defaultMatchType);
            expect(reportedError).toBeFalsy();
            const cells = Array.from(context.container.querySelectorAll('td'));

            await doClick(findButton(cells[0], '📊'));

            const saygDialog = cells[0].querySelector('div.modal-dialog');
            expect(saygDialog).toBeTruthy();
        });

        it('can record home sayg 180', async () => {
            const props = {
                match: {
                    homeScore: 0,
                    awayScore: 0,
                    homePlayers: [ homePlayer ],
                    awayPlayers: [ awayPlayer ],
                    sayg: {
                        legs: {
                            0: {
                                playerSequence: [ { value: 'home', text: 'HOME' }, { value: 'away', text: 'AWAY' }],
                                home: { throws: [], score: 0 },
                                away: { throws: [], score: 0 },
                                currentThrow: 'home',
                                startingScore: 501,
                            }
                        },
                    }
                },
            };
            const account = {
                access: {
                    recordScoresAsYouGo: true
                }
            };
            await renderComponent(account, props, defaultContainerProps, defaultMatchType);
            expect(reportedError).toBeFalsy();
            const cells = Array.from(context.container.querySelectorAll('td'));
            await doClick(findButton(cells[0], '📊'));
            const saygDialog = cells[0].querySelector('div.modal-dialog');

            await doChange(saygDialog, 'input[data-score-input="true"]', '180', context.user);
            await doClick(findButton(saygDialog, '📌📌📌'));

            expect(additional180).toEqual({
                name: 'HOME',
                id: homePlayer.id,
            });
        });

        it('can record away sayg 180', async () => {
            const props = {
                match: {
                    homeScore: 0,
                    awayScore: 0,
                    homePlayers: [ homePlayer ],
                    awayPlayers: [ awayPlayer ],
                    sayg: {
                        legs: {
                            0: {
                                playerSequence: [ { value: 'home', text: 'HOME' }, { value: 'away', text: 'AWAY' }],
                                home: { throws: [], score: 0 },
                                away: { throws: [], score: 0 },
                                currentThrow: 'away',
                                startingScore: 501,
                            }
                        },
                    }
                },
            };
            const account = {
                access: {
                    recordScoresAsYouGo: true
                }
            };
            await renderComponent(account, props, defaultContainerProps, defaultMatchType);
            expect(reportedError).toBeFalsy();
            const cells = Array.from(context.container.querySelectorAll('td'));
            await doClick(findButton(cells[0], '📊'));
            const saygDialog = cells[0].querySelector('div.modal-dialog');

            await doChange(saygDialog, 'input[data-score-input="true"]', '180', context.user);
            await doClick(findButton(saygDialog, '📌📌📌'));

            expect(additional180).toEqual({
                name: 'AWAY',
                id: awayPlayer.id,
            });
        });

        it('can record home sayg hi-check', async () => {
            const props = {
                match: {
                    homeScore: 0,
                    awayScore: 0,
                    homePlayers: [ homePlayer ],
                    awayPlayers: [ awayPlayer ],
                    sayg: {
                        legs: {
                            0: {
                                playerSequence: [ { value: 'home', text: 'HOME' }, { value: 'away', text: 'AWAY' }],
                                home: { throws: [ {} ], score: 400 },
                                away: { throws: [ {} ], score: 0 },
                                currentThrow: 'home',
                                startingScore: 501,
                            }
                        },
                    }
                },
            };
            const account = {
                access: {
                    recordScoresAsYouGo: true
                }
            };
            await renderComponent(account, props, defaultContainerProps, defaultMatchType);
            expect(reportedError).toBeFalsy();
            const cells = Array.from(context.container.querySelectorAll('td'));
            await doClick(findButton(cells[0], '📊'));
            const saygDialog = cells[0].querySelector('div.modal-dialog');

            await doChange(saygDialog, 'input[data-score-input="true"]', '101', context.user);
            await doClick(findButton(saygDialog, '📌📌📌'));

            expect(additionalHiCheck).toEqual({
                notablePlayer: {
                    name: 'HOME',
                    id: homePlayer.id
                },
                score: '101',
            });
        });

        it('can record home sayg hi-check', async () => {
            const props = {
                match: {
                    homeScore: 0,
                    awayScore: 0,
                    homePlayers: [ homePlayer ],
                    awayPlayers: [ awayPlayer ],
                    sayg: {
                        legs: {
                            0: {
                                playerSequence: [ { value: 'home', text: 'HOME' }, { value: 'away', text: 'AWAY' }],
                                home: { throws: [ {} ], score: 0 },
                                away: { throws: [ {} ], score: 400 },
                                currentThrow: 'away',
                                startingScore: 501,
                            }
                        },
                    }
                },
            };
            const account = {
                access: {
                    recordScoresAsYouGo: true
                }
            };
            await renderComponent(account, props, defaultContainerProps, defaultMatchType);
            expect(reportedError).toBeFalsy();
            const cells = Array.from(context.container.querySelectorAll('td'));
            await doClick(findButton(cells[0], '📊'));
            const saygDialog = cells[0].querySelector('div.modal-dialog');

            await doChange(saygDialog, 'input[data-score-input="true"]', '101', context.user);
            await doClick(findButton(saygDialog, '📌📌📌'));

            expect(additionalHiCheck).toEqual({
                notablePlayer: {
                    name: 'AWAY',
                    id: awayPlayer.id
                },
                score: '101',
            });
        });

        it('can close sayg dialog', async () => {
            const props = {
                match: {
                    homeScore: 1,
                    awayScore: 1,
                    homePlayers: [ homePlayer ],
                    awayPlayers: [ awayPlayer ],
                },
            };
            const account = {
                access: {
                    recordScoresAsYouGo: true
                }
            };
            await renderComponent(account, props, defaultContainerProps, defaultMatchType);
            expect(reportedError).toBeFalsy();
            const cells = Array.from(context.container.querySelectorAll('td'));
            await doClick(findButton(cells[0], '📊'));
            const saygDialog = cells[0].querySelector('div.modal-dialog');
            expect(saygDialog).toBeTruthy();

            await doClick(findButton(saygDialog, 'Close'));

            expect(reportedError).toBeFalsy();
            expect(cells[0].querySelector('div.modal-dialog')).toBeFalsy();
        });
    });
});