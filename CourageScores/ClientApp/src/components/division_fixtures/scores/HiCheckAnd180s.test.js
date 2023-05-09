// noinspection JSUnresolvedFunction

import React from "react";
import {cleanUp, doClick, renderApp, doChange} from "../../../tests/helpers";
import {HiCheckAnd180s} from "./HiCheckAnd180s";
import {createTemporaryId} from "../../../Utilities";

describe('HiCheckAnd180s', () => {
    let context;
    let reportedError;
    let updatedFixtureData;
    const setFixtureData = (newFixtureData) => {
        updatedFixtureData = newFixtureData;
    }

    afterEach(() => {
        cleanUp(context);
    });

    async function renderComponent(saving, access, fixtureData) {
        reportedError = null;
        updatedFixtureData = null;
        context = await renderApp(
            {},
            {
                onError: (err) => {
                    reportedError = {
                        message: err.message,
                        stack: err.stack
                    };
                }
            },
            (<HiCheckAnd180s
                saving={saving}
                access={access}
                fixtureData={fixtureData}
                setFixtureData={setFixtureData} />),
            null,
            null,
            'tbody');
    }

    describe('when logged out', () => {
        it('when no matches', async () => {
            const fixtureData = {
                matches: [],
                resultsPublished: false,
                divisionId: createTemporaryId(),
                seasonId: createTemporaryId(),
                oneEighties: [],
                over100Checkouts: []
            };

            await renderComponent(false, 'readonly', fixtureData);

            const cells = context.container.querySelectorAll('td');
            expect(cells.length).toEqual(1);
            expect(cells[0].colSpan).toEqual(5);
            expect(cells[0].textContent).toEqual('Select some player/s to add 180s and hi-checks');
        });

        it('when no selected players', async () => {
            const fixtureData = {
                matches: [ {
                    homePlayers: [],
                    awayPlayers: []
                } ],
                resultsPublished: false,
                divisionId: createTemporaryId(),
                seasonId: createTemporaryId(),
                oneEighties: [],
                over100Checkouts: []
            };

            await renderComponent(false, 'readonly', fixtureData);

            const cells = context.container.querySelectorAll('td');
            expect(cells.length).toEqual(1);
            expect(cells[0].colSpan).toEqual(5);
            expect(cells[0].textContent).toEqual('Select some player/s to add 180s and hi-checks');
        });

        it('when no 180s or hi-checks', async () => {
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
                resultsPublished: false,
                divisionId: createTemporaryId(),
                seasonId: createTemporaryId(),
                oneEighties: [],
                over100Checkouts: []
            };

            await renderComponent(false, 'readonly', fixtureData);

            const cells = context.container.querySelectorAll('td');
            expect(cells.length).toEqual(3);
            expect(cells[0].textContent).toEqual('180s');
            expect(cells[1].textContent).toEqual('');
            expect(cells[2].textContent).toEqual('100+ c/o');
        });

        it('when some 180s', async () => {
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
                resultsPublished: false,
                divisionId: createTemporaryId(),
                seasonId: createTemporaryId(),
                oneEighties: [ { id: homePlayer.id, name: homePlayer.name } ],
                over100Checkouts: []
            };

            await renderComponent(false, 'readonly', fixtureData);

            const cells = context.container.querySelectorAll('td');
            expect(cells.length).toEqual(3);
            const cell = cells[0];
            expect(cell.textContent).toContain('180s');
            expect(cell.textContent).toContain('HOME player');
            expect(cell.textContent).not.toContain('🗑');
            expect(cell.textContent).not.toContain('➕');
        });

        it('when some hi-checks', async () => {
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
                resultsPublished: false,
                divisionId: createTemporaryId(),
                seasonId: createTemporaryId(),
                oneEighties: [],
                over100Checkouts: [ { id: homePlayer.id, name: homePlayer.name, notes: '100' } ]
            };

            await renderComponent(false, 'readonly', fixtureData);

            const cells = context.container.querySelectorAll('td');
            expect(cells.length).toEqual(3);
            const cell = cells[2];
            expect(cell.textContent).toContain('100+ c/o');
            expect(cell.textContent).toContain('HOME player (100)');
            expect(cell.textContent).not.toContain('🗑');
            expect(cell.textContent).not.toContain('➕');
        });
    });

    describe('when logged in', () => {
       describe('renders', () => {
           it('when no matches', async () => {
               const fixtureData = {
                   matches: [],
                   resultsPublished: false,
                   divisionId: createTemporaryId(),
                   seasonId: createTemporaryId(),
                   oneEighties: [],
                   over100Checkouts: []
               };

               await renderComponent(false, 'admin', fixtureData);

               const cells = context.container.querySelectorAll('td');
               expect(cells.length).toEqual(1);
               expect(cells[0].colSpan).toEqual(5);
               expect(cells[0].textContent).toEqual('Select some player/s to add 180s and hi-checks');
           });

           it('when no selected players', async () => {
               const fixtureData = {
                   matches: [ {
                       homePlayers: [],
                       awayPlayers: []
                   } ],
                   resultsPublished: false,
                   divisionId: createTemporaryId(),
                   seasonId: createTemporaryId(),
                   oneEighties: [],
                   over100Checkouts: []
               };

               await renderComponent(false, 'admin', fixtureData);

               const cells = context.container.querySelectorAll('td');
               expect(cells.length).toEqual(1);
               expect(cells[0].colSpan).toEqual(5);
               expect(cells[0].textContent).toEqual('Select some player/s to add 180s and hi-checks');
           });

           it('when no 180s or hi-checks', async () => {
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
                   resultsPublished: false,
                   divisionId: createTemporaryId(),
                   seasonId: createTemporaryId(),
                   oneEighties: [],
                   over100Checkouts: []
               };

               await renderComponent(false, 'admin', fixtureData);

               const cells = context.container.querySelectorAll('td');
               expect(cells.length).toEqual(3);
               expect(cells[0].textContent).toContain('180s');
               expect(cells[0].textContent).toContain('HOME player');
               expect(cells[0].textContent).toContain('AWAY player');
               expect(cells[0].textContent).toContain('➕');
               expect(cells[1].textContent).toEqual('');
               expect(cells[2].textContent).toContain('100+ c/o');
               expect(cells[2].textContent).toContain('HOME player');
               expect(cells[2].textContent).toContain('AWAY player');
               expect(cells[2].textContent).toContain('➕');
           });

           it('when some 180s', async () => {
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
                   resultsPublished: false,
                   divisionId: createTemporaryId(),
                   seasonId: createTemporaryId(),
                   oneEighties: [ { id: homePlayer.id, name: homePlayer.name } ],
                   over100Checkouts: []
               };

               await renderComponent(false, 'admin', fixtureData);

               const cells = context.container.querySelectorAll('td');
               expect(cells.length).toEqual(3);
               const cell = cells[0];
               expect(cell.textContent).toContain('180s');
               expect(cell.textContent).toContain('HOME player 🗑');
               expect(cell.textContent).toContain('➕');
           });

           it('when some hi-checks', async () => {
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
                   resultsPublished: false,
                   divisionId: createTemporaryId(),
                   seasonId: createTemporaryId(),
                   oneEighties: [],
                   over100Checkouts: [ { id: homePlayer.id, name: homePlayer.name, notes: '100' } ]
               };

               await renderComponent(false, 'admin', fixtureData);

               const cells = context.container.querySelectorAll('td');
               expect(cells.length).toEqual(3);
               const cell = cells[2];
               expect(cell.textContent).toContain('100+ c/o');
               expect(cell.textContent).toContain('HOME player (100) 🗑');
               expect(cell.textContent).toContain('➕');
           });
       });

       describe('changes', () => {
           it('add a 180', async () => {
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
                   resultsPublished: false,
                   divisionId: createTemporaryId(),
                   seasonId: createTemporaryId(),
                   oneEighties: [ { id: homePlayer.id, name: homePlayer.name } ],
                   over100Checkouts: []
               };

               await renderComponent(false, 'admin', fixtureData);
               const td180s = context.container.querySelectorAll('td')[0];
               expect(td180s).toBeTruthy();
               const addPlayerContainer = td180s.querySelector('ol li:last-child');
               expect(addPlayerContainer).toBeTruthy();
               const options = addPlayerContainer.querySelector('div.btn-group > div');
               expect(options.querySelector('button:nth-child(2)').textContent).toEqual('AWAY player');
               await doClick(options, 'button:nth-child(2)'); // < unselected, AWAY player, HOME player >
               await doClick(addPlayerContainer, 'button.btn-outline-primary');

               expect(updatedFixtureData).toBeTruthy();
               expect(updatedFixtureData.oneEighties).toEqual([
                   { id: homePlayer.id, name: homePlayer.name },
                   { id: awayPlayer.id, name: awayPlayer.name }
               ]);
           });

           it('remove a 180', async () => {
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
                   resultsPublished: false,
                   divisionId: createTemporaryId(),
                   seasonId: createTemporaryId(),
                   oneEighties: [ { id: homePlayer.id, name: homePlayer.name } ],
                   over100Checkouts: []
               };

               await renderComponent(false, 'admin', fixtureData);
               const td180s = context.container.querySelectorAll('td')[0];
               expect(td180s).toBeTruthy();
               const remove180Button = td180s.querySelector('ol > li:first-child > button');
               expect(remove180Button).toBeTruthy();
               expect(remove180Button.textContent).toEqual('HOME player 🗑');
               await doClick(td180s, 'ol > li:first-child > button');

               expect(updatedFixtureData).toBeTruthy();
               expect(updatedFixtureData.oneEighties).toEqual([]);
           });

           it('add a hi-check', async () => {
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
                   resultsPublished: false,
                   divisionId: createTemporaryId(),
                   seasonId: createTemporaryId(),
                   oneEighties: [],
                   over100Checkouts: [{ id: homePlayer.id, name: homePlayer.name, notes: '100' }]
               };

               await renderComponent(false, 'admin', fixtureData);
               const tdHiChecks = context.container.querySelectorAll('td')[2];
               expect(tdHiChecks).toBeTruthy();
               const addPlayerContainer = tdHiChecks.querySelector('ol li:last-child');
               expect(addPlayerContainer).toBeTruthy();
               doChange(addPlayerContainer, 'input', '140');
               const options = addPlayerContainer.querySelector('div.btn-group > div');
               expect(options.querySelector('button:nth-child(2)').textContent).toEqual('AWAY player');
               await doClick(options, 'button:nth-child(2)'); // < unselected, AWAY player, HOME player >
               await doClick(addPlayerContainer, 'button.btn-outline-primary');

               expect(updatedFixtureData).toBeTruthy();
               expect(updatedFixtureData.over100Checkouts).toEqual([
                   { id: homePlayer.id, name: homePlayer.name, notes: '100' },
                   { id: awayPlayer.id, name: awayPlayer.name, notes: '140' }
               ]);
           });

           it('remove a hi-check', async () => {
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
                   resultsPublished: false,
                   divisionId: createTemporaryId(),
                   seasonId: createTemporaryId(),
                   oneEighties: [],
                   over100Checkouts: [{ id: homePlayer.id, name: homePlayer.name, notes: '100' }]
               };

               await renderComponent(false, 'admin', fixtureData);
               const tdHiChecks = context.container.querySelectorAll('td')[2];
               expect(tdHiChecks).toBeTruthy();
               const remove180Button = tdHiChecks.querySelector('ol > li:first-child > button');
               expect(remove180Button).toBeTruthy();
               expect(remove180Button.textContent).toEqual('HOME player (100) 🗑');
               await doClick(tdHiChecks, 'ol > li:first-child > button');

               expect(updatedFixtureData).toBeTruthy();
               expect(updatedFixtureData.over100Checkouts).toEqual([]);
           });
       });
    });
});