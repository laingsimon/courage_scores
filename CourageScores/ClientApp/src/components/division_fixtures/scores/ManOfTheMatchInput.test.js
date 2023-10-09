// noinspection JSUnresolvedFunction

import React from "react";
import {cleanUp, doSelectOption, renderApp} from "../../../helpers/tests";
import {ManOfTheMatchInput} from "./ManOfTheMatchInput";
import {fixtureBuilder, playerBuilder} from "../../../helpers/builders";

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

    async function renderComponent(saving, account, fixtureData, access, disabled) {
        reportedError = null;
        updatedFixtureData = null;
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
                account: account,
            },
            (<ManOfTheMatchInput
                saving={saving}
                access={access}
                fixtureData={fixtureData}
                setFixtureData={setFixtureData}
                disabled={disabled} />),
            null,
            null,
            'tbody');
    }

    function assertPlayers(container, names, displayed, selected) {
        names.unshift(' ');

        const players = container.querySelectorAll('div.btn-group div[role="menu"] button[role="menuitem"]');
        const displayedPlayer = container.querySelector('div.btn-group > button > span');
        const selectedPlayer = container.querySelector('div.btn-group div[role="menu"] button[role="menuitem"].active');
        expect(Array.from(players).map(span => span.textContent)).toEqual(names);
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
        const account = null;
        const saving = false;
        const access = '';

        it('when no matches', async () => {
            const fixtureData = fixtureBuilder()
                .playing('HOME', 'AWAY')
                .build();

            await renderComponent(saving, account, fixtureData, access);

            expect(context.container.innerHTML).toEqual('');
        });

        it('when no selected players', async () => {
            const fixtureData = fixtureBuilder()
                .playing('HOME', 'AWAY')
                .withMatch(m => m.withHome().withAway())
                .build();

            await renderComponent(saving, account, fixtureData, access);

            expect(reportedError).toBeFalsy();
            expect(context.container.innerHTML).toEqual('');
        });

        it('when no man-of-the-match', async () => {
            const homePlayer = playerBuilder('HOME player').build();
            const awayPlayer = playerBuilder('AWAY player').build();
            const fixtureData = fixtureBuilder()
                .playing('HOME', 'AWAY')
                .withMatch(m => m.withHome(homePlayer).withAway(awayPlayer))
                .build();

            await renderComponent(saving, account, fixtureData, access);

            expect(reportedError).toBeFalsy();
            expect(context.container.innerHTML).toEqual('');
        });

        it('when home man-of-the-match', async () => {
            const homePlayer = playerBuilder('HOME player').build();
            const awayPlayer = playerBuilder('AWAY player').build();
            const fixtureData = fixtureBuilder()
                .playing('HOME', 'AWAY')
                .manOfTheMatch(homePlayer, null)
                .withMatch(m => m.withHome(homePlayer).withAway(awayPlayer))
                .build();

            await renderComponent(saving, account, fixtureData, access);

            expect(reportedError).toBeFalsy();
            expect(context.container.innerHTML).toEqual('');
        });

        it('when away man-of-the-match', async () => {
            const homePlayer = playerBuilder('HOME player').build();
            const awayPlayer = playerBuilder('AWAY player').build();
            const fixtureData = fixtureBuilder()
                .playing('HOME', 'AWAY')
                .manOfTheMatch(null, awayPlayer)
                .withMatch(m => m.withHome(homePlayer).withAway(awayPlayer))
                .build();

            await renderComponent(saving, account, fixtureData, access);

            expect(reportedError).toBeFalsy();
            expect(context.container.innerHTML).toEqual('');
        });
    });

    describe('when logged in', () => {
        let account = {};

        describe('renders', () => {
            it('when no matches', async () => {
                const fixtureData = fixtureBuilder()
                    .playing('HOME', 'AWAY')
                    .build();

                await renderComponent(false, account, fixtureData, 'admin');

                expect(reportedError).toBeFalsy();
                const cells = context.container.querySelectorAll('td');
                expect(cells.length).toEqual(3);
                assertPlayers(cells[0], [], ' ', null);
                assertPlayers(cells[2], [], ' ', null);
            });

            it('when disabled', async () => {
                const homePlayer = playerBuilder('HOME player').build();
                const awayPlayer = playerBuilder('AWAY player').build();
                const fixtureData = fixtureBuilder()
                    .playing('HOME', 'AWAY')
                    .manOfTheMatch(awayPlayer, homePlayer)
                    .withMatch(m => m.withHome(homePlayer).withAway(awayPlayer))
                    .build();

                await renderComponent(false, account, fixtureData, 'admin', true);

                expect(reportedError).toBeFalsy();
                const cells = context.container.querySelectorAll('td');
                expect(cells.length).toEqual(3);
                expect(cells[0].querySelector('.dropdown-toggle').textContent).toEqual('AWAY player');
                expect(cells[2].querySelector('.dropdown-toggle').textContent).toEqual('HOME player');
            });

            it('when no selected players', async () => {
                const fixtureData = fixtureBuilder()
                    .playing('HOME', 'AWAY')
                    .withMatch(m => m.withHome().withAway())
                    .build();

                await renderComponent(false, account, fixtureData, 'admin');

                expect(reportedError).toBeFalsy();
                const cells = context.container.querySelectorAll('td');
                expect(cells.length).toEqual(3);
                assertPlayers(cells[0], [], ' ', null);
                assertPlayers(cells[2], [], ' ', null);
            });

            it('when no man-of-the-match', async () => {
                const homePlayer = playerBuilder('HOME player').build();
                const awayPlayer = playerBuilder('AWAY player').build();
                const fixtureData = fixtureBuilder()
                    .playing('HOME', 'AWAY')
                    .withMatch(m => m.withHome(homePlayer).withAway(awayPlayer))
                    .build();

                await renderComponent(false, account, fixtureData, 'admin');

                expect(reportedError).toBeFalsy();
                const cells = context.container.querySelectorAll('td');
                expect(cells.length).toEqual(3);
                assertPlayers(cells[0], ['AWAY player'], ' ', null);
                assertPlayers(cells[2], ['HOME player'], ' ', null);
            });

            it('when home man-of-the-match', async () => {
                const homePlayer = playerBuilder('HOME player').build();
                const awayPlayer = playerBuilder('AWAY player').build();
                const fixtureData = fixtureBuilder()
                    .playing('HOME', 'AWAY')
                    .manOfTheMatch(awayPlayer, null)
                    .withMatch(m => m.withHome(homePlayer).withAway(awayPlayer))
                    .build();

                await renderComponent(false, account, fixtureData, 'admin');

                expect(reportedError).toBeFalsy();
                const cells = context.container.querySelectorAll('td');
                expect(cells.length).toEqual(3);
                assertPlayers(cells[0], ['AWAY player'], 'AWAY player', 'AWAY player');
            });

            it('when away man-of-the-match', async () => {
                const homePlayer = playerBuilder('HOME player').build();
                const awayPlayer = playerBuilder('AWAY player').build();
                const fixtureData = fixtureBuilder()
                    .playing('HOME', 'AWAY')
                    .manOfTheMatch(null, homePlayer)
                    .withMatch(m => m.withHome(homePlayer).withAway(awayPlayer))
                    .build();

                await renderComponent(false, account, fixtureData, 'admin');

                expect(reportedError).toBeFalsy();
                const cells = context.container.querySelectorAll('td');
                expect(cells.length).toEqual(3);
                assertPlayers(cells[2], ['HOME player'], 'HOME player', 'HOME player');
            });
        });

        describe('changes', () => {
            it('set home man-of-the-match', async () => {
                const homePlayer = playerBuilder('HOME player').build();
                const awayPlayer = playerBuilder('AWAY player').build();
                const fixtureData = fixtureBuilder()
                    .playing('HOME', 'AWAY')
                    .withMatch(m => m.withHome(homePlayer).withAway(awayPlayer))
                    .build();
                expect(reportedError).toBeFalsy();
                await renderComponent(false, account, fixtureData, 'admin');
                const homeMOM = context.container.querySelectorAll('td')[0];

                await doSelectOption(homeMOM.querySelector('.dropdown-menu'), 'AWAY player')

                expect(updatedFixtureData).toBeTruthy();
                expect(updatedFixtureData.home.manOfTheMatch).toEqual(awayPlayer.id);
            });

            it('unset home man-of-the-match', async () => {
                const homePlayer = playerBuilder('HOME player').build();
                const awayPlayer = playerBuilder('AWAY player').build();
                const fixtureData = fixtureBuilder()
                    .playing('HOME', 'AWAY')
                    .manOfTheMatch(homePlayer, null)
                    .withMatch(m => m.withHome(homePlayer).withAway(awayPlayer))
                    .build();

                expect(reportedError).toBeFalsy();
                await renderComponent(false, account, fixtureData, 'admin');
                const homeMOM = context.container.querySelectorAll('td')[0];

                await doSelectOption(homeMOM.querySelector('.dropdown-menu'), ' ');

                expect(updatedFixtureData).toBeTruthy();
                expect(updatedFixtureData.home.manOfTheMatch).toBeUndefined();
            });

            it('set away man-of-the-match', async () => {
                const homePlayer = playerBuilder('HOME player').build();
                const awayPlayer = playerBuilder('AWAY player').build();
                const fixtureData = fixtureBuilder()
                    .playing('HOME', 'AWAY')
                    .withMatch(m => m.withHome(homePlayer).withAway(awayPlayer))
                    .build();

                expect(reportedError).toBeFalsy();
                await renderComponent(false, account, fixtureData, 'admin');
                const awayMOM = context.container.querySelectorAll('td')[2];

                await doSelectOption(awayMOM.querySelector('.dropdown-menu'), 'HOME player');

                expect(updatedFixtureData).toBeTruthy();
                expect(updatedFixtureData.away.manOfTheMatch).toEqual(homePlayer.id);
            });

            it('unset away man-of-the-match', async () => {
                const homePlayer = playerBuilder('HOME player').build();
                const awayPlayer = playerBuilder('AWAY player').build();
                const fixtureData = fixtureBuilder()
                    .playing('HOME', 'AWAY')
                    .manOfTheMatch(null, awayPlayer)
                    .withMatch(m => m.withHome(homePlayer).withAway(awayPlayer))
                    .build();

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