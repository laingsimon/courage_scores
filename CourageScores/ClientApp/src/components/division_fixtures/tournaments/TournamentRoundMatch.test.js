// noinspection JSUnresolvedFunction

import {cleanUp, renderApp, findButton, doClick, doChange, doSelectOption} from "../../../helpers/tests";
import React from "react";
import {createTemporaryId} from "../../../helpers/projection";
import {toMap, any} from "../../../helpers/collections";
import {TournamentRoundMatch} from "./TournamentRoundMatch";
import {TournamentContainer} from "./TournamentContainer";

describe('TournamentRoundMatch', () => {
    let context;
    let reportedError;
    let updatedRound;
    let updatedMatchOptions;
    let hiChecks;
    let oneEighties;
    let updatedTournamentData;
    let updatedSaygData;
    let createdSaygSessions;
    let addSaygLookup;
    let updatedPatch;
    const tournamentApi = {
        addSayg: async (tournamentId, matchId, matchOptions) => {
            createdSaygSessions.push({ tournamentId, matchId, matchOptions });
            const responseData = addSaygLookup.filter(l => l.match.id === matchId)[0];

            if (!responseData) {
                throw new Error('Did not expect match to have sayg session created');
            }

            // NOTE: intentionally mutates the source data so the tests work with updated state.
            responseData.match.saygId = responseData.saygId;

            return {
                success: responseData.success,
                result: responseData.result
            };
        }
    };
    let saygApiData;
    const saygApi = {
        get: async (id) => {
            return saygApiData[id];
        },
        upsert: async(data) => {
            updatedSaygData = data;
            return {
                success: true,
                result: data,
            };
        },
    };

    afterEach(() => {
        cleanUp(context);
    });

    function onHiCheck(player, notes) {
        hiChecks.push({ player, notes });
    }

    function on180(player) {
        oneEighties.push(player);
    }

    function setTournamentData(data) {
        updatedTournamentData = data;
    }

    async function renderComponent(containerProps, props, account) {
        reportedError = null;
        updatedRound = null;
        updatedMatchOptions = null;
        updatedTournamentData = null;
        hiChecks = [];
        oneEighties = [];
        saygApiData = {};
        addSaygLookup = [];
        updatedSaygData = null;
        updatedPatch = null;
        createdSaygSessions = [];
        context = await renderApp(
            { tournamentApi, saygApi },
            {
                onError: (err) => {
                    if (err.message) {
                        reportedError = {
                            message: err.message,
                            stack: err.stack
                        };
                    } else {
                        reportedError = err;
                    }
                },
                account,
            },
            (<TournamentContainer {...containerProps} setTournamentData={setTournamentData}>
                <TournamentRoundMatch
                    {...props}
                    onChange={updated => updatedRound = updated}
                    onMatchOptionsChanged={updated => updatedMatchOptions = updated}
                    onHiCheck={onHiCheck}
                    on180={on180}
                    patchData={(patch) => updatedPatch = patch} />
            </TournamentContainer>),
            null,
            null,
            'tbody');
    }

    function assertDropdown(cell, selected, optionsText) {
        const dropdownToggle = cell.querySelector('.dropdown-toggle');
        expect(dropdownToggle).toBeTruthy();
        expect(dropdownToggle.textContent).toEqual(selected);

        const options = Array.from(cell.querySelectorAll('.dropdown-item'));
        expect(options.map(o => o.textContent)).toEqual(optionsText);
    }

    function assertScore(cell, expectedScore) {
        const input = cell.querySelector('input');
        expect(input).toBeTruthy();
        expect(input.value).toEqual(expectedScore);
    }

    describe('renders', () => {
        const sideA = {
            id: createTemporaryId(),
            name: 'SIDE A',
        };
        const sideB = {
            id: createTemporaryId(),
            name: 'SIDE B',
        };
        const sideC = {
            id: createTemporaryId(),
            name: 'SIDE C',
        };
        const sideD = {
            id: createTemporaryId(),
            name: 'SIDE D',
        };
        const sideE = {
            id: createTemporaryId(),
            name: 'SIDE E',
        };
        let returnFromExceptSelected;
        const exceptSelected = (side, matchIndex, sideName) => {
            const exceptSides = returnFromExceptSelected[sideName];
            if (!exceptSides) {
                return true;
            }
            return !any(exceptSides, s => s.name === side.name);
        };

        beforeEach(() => {
            returnFromExceptSelected = {};
        });

        describe('when logged out', () => {
            const account = null;

            it('when has next round', async () => {
                const match = {
                    sideA: sideA,
                    sideB: sideB,
                    scoreA: 1,
                    scoreB: 2,
                };
                await renderComponent({ tournamentData: { id: createTemporaryId() } }, {
                    readOnly: true,
                    match: match,
                    hasNextRound: true,
                    sideMap: toMap([ sideA, sideB ]),
                    exceptSelected: exceptSelected,
                    matchIndex: 0,
                    round: {
                        matches: [ match ]
                    },
                    matchOptions: {},
                }, account);

                expect(reportedError).toBeNull();
                const cells = Array.from(context.container.querySelectorAll('tr td'));
                expect(cells.length).toEqual(5);
                expect(cells[0].textContent).toEqual('SIDE A');
                expect(cells[1].textContent).toEqual('1');
                expect(cells[2].textContent).toEqual('vs');
                expect(cells[3].textContent).toEqual('2');
                expect(cells[4].textContent).toEqual('SIDE B');
            });

            it('when has next round and no scores', async () => {
                const match = {
                    sideA: sideA,
                    sideB: sideB,
                };
                await renderComponent({ tournamentData: { id: createTemporaryId() } }, {
                    readOnly: true,
                    match: match,
                    hasNextRound: true,
                    sideMap: toMap([ sideA, sideB ]),
                    exceptSelected: exceptSelected,
                    matchIndex: 0,
                    round: {
                        matches: [ match ]
                    },
                    matchOptions: {},
                }, account);

                expect(reportedError).toBeNull();
                const cells = Array.from(context.container.querySelectorAll('tr td'));
                expect(cells.length).toEqual(5);
                expect(cells[0].textContent).toEqual('SIDE A');
                expect(cells[1].textContent).toEqual('');
                expect(cells[2].textContent).toEqual('vs');
                expect(cells[3].textContent).toEqual('');
                expect(cells[4].textContent).toEqual('SIDE B');
            });

            it('sideA winner', async () => {
                const match = {
                    sideA: sideA,
                    sideB: sideB,
                    scoreA: 3,
                    scoreB: 2,
                };
                await renderComponent({ tournamentData: { id: createTemporaryId() } }, {
                    readOnly: true,
                    match: match,
                    hasNextRound: true,
                    sideMap: toMap([ sideA, sideB ]),
                    exceptSelected: exceptSelected,
                    matchIndex: 0,
                    round: {
                        matches: [ match ]
                    },
                    matchOptions: {},
                }, account);

                expect(reportedError).toBeNull();
                const cells = Array.from(context.container.querySelectorAll('tr td'));
                expect(cells.length).toEqual(5);
                expect(cells[0].className).toContain('bg-winner');
                expect(cells[1].className).toContain('bg-winner');
                expect(cells[3].className).not.toContain('bg-winner');
                expect(cells[4].className).not.toContain('bg-winner');
            });

            it('sideB winner', async () => {
                const match = {
                    sideA: sideA,
                    sideB: sideB,
                    scoreA: 2,
                    scoreB: 3,
                };
                await renderComponent({ tournamentData: { id: createTemporaryId() } }, {
                    readOnly: true,
                    match: match,
                    hasNextRound: true,
                    sideMap: toMap([ sideA, sideB ]),
                    exceptSelected: exceptSelected,
                    matchIndex: 0,
                    round: {
                        matches: [ match ]
                    },
                    matchOptions: {},
                }, account);

                expect(reportedError).toBeNull();
                const cells = Array.from(context.container.querySelectorAll('tr td'));
                expect(cells.length).toEqual(5);
                expect(cells[0].className).not.toContain('bg-winner');
                expect(cells[1].className).not.toContain('bg-winner');
                expect(cells[3].className).toContain('bg-winner');
                expect(cells[4].className).toContain('bg-winner');
            });

            it('when no next round', async () => {
                const match = {
                    sideA: sideA,
                    sideB: sideB,
                    scoreA: 1,
                    scoreB: 2,
                };
                await renderComponent({ tournamentData: { id: createTemporaryId() } }, {
                    readOnly: true,
                    match: match,
                    hasNextRound: false,
                    sideMap: toMap([ sideA, sideB ]),
                    exceptSelected: exceptSelected,
                    matchIndex: 0,
                    round: {
                        matches: [ match ]
                    },
                    matchOptions: {},
                }, account);

                expect(reportedError).toBeNull();
                const cells = Array.from(context.container.querySelectorAll('tr td'));
                expect(cells.length).toEqual(5);
                expect(cells[0].textContent).toEqual('SIDE A');
                expect(cells[1].textContent).toEqual('1');
                expect(cells[2].textContent).toEqual('vs');
                expect(cells[3].textContent).toEqual('2');
                expect(cells[4].textContent).toEqual('SIDE B');
            });

            it('cannot open sayg if not exists', async () => {
                const match = {
                    sideA: sideA,
                    sideB: sideB,
                    scoreA: 1,
                    scoreB: 2,
                };
                await renderComponent({ tournamentData: { id: createTemporaryId() } }, {
                    readOnly: true,
                    match: match,
                    hasNextRound: false,
                    sideMap: toMap([ sideA, sideB ]),
                    exceptSelected: exceptSelected,
                    matchIndex: 0,
                    round: {
                        matches: [ match ]
                    },
                    matchOptions: {},
                }, account);

                expect(reportedError).toBeNull();
                const cells = Array.from(context.container.querySelectorAll('tr td'));
                expect(cells[0].textContent).not.toContain('📊');
            });

            it('can open sayg if it exists', async () => {
                const saygData = {
                    id: createTemporaryId(),
                    legs: { }
                };
                const match = {
                    sideA: sideA,
                    sideB: sideB,
                    scoreA: 1,
                    scoreB: 2,
                    saygId: saygData.id,
                };
                await renderComponent({ tournamentData: { id: createTemporaryId() } }, {
                    readOnly: true,
                    match: match,
                    hasNextRound: false,
                    sideMap: toMap([ sideA, sideB ]),
                    exceptSelected: exceptSelected,
                    matchIndex: 0,
                    round: {
                        matches: [ match ]
                    },
                    matchOptions: {},
                }, account);
                const cells = Array.from(context.container.querySelectorAll('tr td'));

                await doClick(findButton(cells[0], '📊'));

                expect(reportedError).toBeNull();
                const dialog = context.container.querySelector('.modal-dialog');
                expect(dialog).toBeTruthy();
                expect(dialog.textContent).toContain('SIDE A vs SIDE B');
            });
        });

        describe('when logged in', () => {
            const account = {
                access: {
                    manageTournaments: true,
                    recordScoresAsYouGo: true,
                }
            };

            it('when no next round', async () => {
                const match = {
                    sideA: sideA,
                    sideB: sideB,
                    scoreA: 1,
                    scoreB: 2,
                };
                returnFromExceptSelected['sideA'] = [ sideC, sideD ];
                returnFromExceptSelected['sideB'] = [ sideD, sideE ];

                await renderComponent({ tournamentData: { id: createTemporaryId() } }, {
                    readOnly: false,
                    match: match,
                    hasNextRound: false,
                    sideMap: toMap([ sideA, sideB, sideC, sideD, sideE ]),
                    exceptSelected: exceptSelected,
                    matchIndex: 0,
                    round: {
                        matches: [ match ]
                    },
                    matchOptions: {},
                }, account);

                expect(reportedError).toBeNull();
                const cells = Array.from(context.container.querySelectorAll('tr td'));
                expect(cells.length).toEqual(6);
                assertDropdown(cells[0], 'SIDE A', [ 'SIDE A', 'SIDE B', 'SIDE E' ]);
                assertScore(cells[1], '1');
                expect(cells[2].textContent).toEqual('vs');
                assertScore(cells[3], '2');
                assertDropdown(cells[4], 'SIDE B', [ 'SIDE A', 'SIDE B', 'SIDE C' ]);
            });

            it('cannot open match options', async () => {
                const match = {
                    sideA: sideA,
                    sideB: sideB,
                    scoreA: 1,
                    scoreB: 2,
                };
                await renderComponent({ tournamentData: { id: createTemporaryId() } }, {
                    readOnly: false,
                    match: match,
                    hasNextRound: false,
                    sideMap: toMap([ sideA, sideB ]),
                    exceptSelected: exceptSelected,
                    matchIndex: 0,
                    round: {
                        matches: [ match ]
                    },
                    matchOptions: {},
                }, account);

                expect(reportedError).toBeNull();
                const cells = Array.from(context.container.querySelectorAll('tr td'));
                expect(cells[5].textContent).toContain('🛠');
            });

        });
    });

    describe('interactivity', () => {
        const playerSideA = {
            id: createTemporaryId(),
            name: 'PLAYER SIDE A'
        };
        const playerSideB = {
            id: createTemporaryId(),
            name: 'PLAYER SIDE A'
        };
        const sideA = {
            id: createTemporaryId(),
            name: 'SIDE A',
            players: [playerSideA],
        };
        const sideB = {
            id: createTemporaryId(),
            name: 'SIDE B',
            players: [playerSideB],
        };
        const sideC = {
            id: createTemporaryId(),
            name: 'SIDE C',
            players: [ playerSideA, playerSideB ],
        };
        const sideD = {
            id: createTemporaryId(),
            name: 'SIDE D',
            players: [ playerSideA, playerSideB ],
        };
        const sideE = {
            id: createTemporaryId(),
            name: 'SIDE E',
        };
        let returnFromExceptSelected;
        const exceptSelected = (side, matchIndex, sideName) => {
            const exceptSides = returnFromExceptSelected[sideName];
            if (!exceptSides) {
                return true;
            }
            return !any(exceptSides, s => s.name === side.name);
        };
        const account = {
            access: {
                manageTournaments: true,
                recordScoresAsYouGo: true,
            }
        };

        beforeEach(() => {
            returnFromExceptSelected = {};
            console.log = () => {};
        });

        it('can open sayg', async () => {
            const match = {
                sideA: sideA,
                sideB: sideB,
                scoreA: 1,
                scoreB: 2,
            };
            const matchOptions = {
                startingScore: 501,
                numberOfLegs: 3,
            }
            await renderComponent({ tournamentData: { id: createTemporaryId() } }, {
                readOnly: false,
                match: match,
                hasNextRound: false,
                sideMap: toMap([ sideA, sideB ]),
                exceptSelected: exceptSelected,
                matchIndex: 0,
                round: {
                    matches: [ match ]
                },
                matchOptions,
            }, account);
            const saygData = { legs: { 0: { startingScore: 501 } }, id: createTemporaryId(), };
            addSaygLookup.push({
                match: match,
                success: true,
                result: {
                    id: createTemporaryId(),
                    round: {
                        matches: [ match ]
                    },
                },
                saygId: saygData.id,
            });
            saygApiData[saygData.id] = saygData;
            const cells = Array.from(context.container.querySelectorAll('tr td'));

            await doClick(findButton(cells[0], '📊'));

            expect(reportedError).toBeNull();
            const dialog = context.container.querySelector('.modal-dialog');
            expect(dialog).toBeTruthy();
            expect(dialog.textContent).toContain('SIDE A vs SIDE B');
            expect(createdSaygSessions.length).toEqual(1);
            expect(createdSaygSessions[0].matchId).toEqual(match.id);
            expect(createdSaygSessions[0].matchOptions).toEqual(matchOptions);
        });

        it('can close sayg', async () => {
            const match = {
                sideA: sideA,
                sideB: sideB,
                scoreA: 1,
                scoreB: 2,
            };
            await renderComponent({ tournamentData: { id: createTemporaryId() } }, {
                readOnly: false,
                match: match,
                hasNextRound: false,
                sideMap: toMap([ sideA, sideB ]),
                exceptSelected: exceptSelected,
                matchIndex: 0,
                round: {
                    matches: [ match ]
                },
                matchOptions: {},
            }, account);
            const saygData = { legs: { 0: { startingScore: 501 } }, id: createTemporaryId(), };
            addSaygLookup.push({
                match: match,
                success: true,
                result: {
                    id: createTemporaryId(),
                    round: {
                        matches: [ match ]
                    },
                },
                saygId: saygData.id,
            });
            saygApiData[saygData.id] = saygData;
            const cells = Array.from(context.container.querySelectorAll('tr td'));
            await doClick(findButton(cells[0], '📊'));
            expect(context.container.querySelector('.modal-dialog')).toBeTruthy();

            expect(reportedError).toBeNull();
            await doClick(findButton(context.container.querySelector('.modal-dialog'), 'Close'));

            expect(context.container.querySelector('.modal-dialog')).toBeFalsy();
        });

        it('can open existing sayg', async () => {
            const saygData = { legs: { 0: { startingScore: 501 } }, id: createTemporaryId(), };
            const match = {
                sideA: sideA,
                sideB: sideB,
                scoreA: 1,
                scoreB: 2,
                saygId: saygData.id,
            };
            await renderComponent({ tournamentData: { id: createTemporaryId() } }, {
                readOnly: false,
                match: match,
                hasNextRound: false,
                sideMap: toMap([ sideA, sideB ]),
                exceptSelected: exceptSelected,
                matchIndex: 0,
                round: {
                    matches: [ match ]
                },
                matchOptions: {},
            }, account);
            saygApiData[saygData.id] = saygData;
            const cells = Array.from(context.container.querySelectorAll('tr td'));

            await doClick(findButton(cells[0], '📊'));

            expect(reportedError).toBeNull();
            const dialog = context.container.querySelector('.modal-dialog');
            expect(dialog).toBeTruthy();
            expect(dialog.textContent).toContain('SIDE A vs SIDE B');
        });

        it('can set first player for match', async () => {
            const match = {
                sideA: sideA,
                sideB: sideB,
                scoreA: 0,
                scoreB: 0,
                saygId: createTemporaryId(),
            };
            await renderComponent({ tournamentData: { id: createTemporaryId() } }, {
                readOnly: false,
                match: match,
                hasNextRound: false,
                sideMap: toMap([ sideA, sideB ]),
                exceptSelected: exceptSelected,
                matchIndex: 0,
                round: {
                    matches: [ match ]
                },
                matchOptions: {},
            }, account);
            saygApiData[match.saygId] = {
                legs: { 0: { startingScore: 501, home: { throws: [], score: 0 }, away: { throws: [], score: 0 } } },
                yourName: 'SIDE A',
                opponentName: 'SIDE B',
            };
            const cells = Array.from(context.container.querySelectorAll('tr td'));
            await doClick(findButton(cells[0], '📊'));
            expect(reportedError).toBeNull();

            const dialog = context.container.querySelector('.modal-dialog');
            await doClick(findButton(dialog, '🎯SIDE A'));

            expect(reportedError).toBeNull();
            expect(updatedSaygData.legs[0].playerSequence).toEqual([
                { text: 'SIDE A', value: 'home' },
                { text: 'SIDE B', value: 'away' },
            ]);
        });

        it('can record sayg 180', async () => {
            const match = {
                sideA: sideA,
                sideB: sideB,
                scoreA: 0,
                scoreB: 0,
                saygId: createTemporaryId(),
            };
            await renderComponent({ tournamentData: { id: createTemporaryId() } }, {
                readOnly: false,
                match: match,
                hasNextRound: false,
                sideMap: toMap([ sideA, sideB ]),
                exceptSelected: exceptSelected,
                matchIndex: 0,
                round: {
                    matches: [ match ]
                },
                matchOptions: {},
            }, account);
            saygApiData[match.saygId] = {
                legs: {
                    0: {
                        playerSequence: [
                            { text: 'SIDE A', value: 'home' },
                            { text: 'SIDE B', value: 'away' },
                        ],
                        currentThrow: 'home',
                        home: { throws: [], score: 0, startingScore: 501, },
                        away: { throws: [], score: 0, startingScore: 501, },
                        homeScore: 0,
                        awayScore: 0,
                        startingScore: 501,
                        numberOfLegs: 3,
                    }
                }
            };
            const cells = Array.from(context.container.querySelectorAll('tr td'));
            await doClick(findButton(cells[0], '📊'));
            expect(reportedError).toBeNull();

            await doChange(context.container.querySelector('.modal-dialog'), 'input[data-score-input="true"]', '180', context.user);
            await doClick(findButton(context.container.querySelector('.modal-dialog'), '📌📌📌'));

            expect(reportedError).toBeNull();
            expect(oneEighties).toEqual([playerSideA]);
        });

        it('cannot record sayg 180 when readonly', async () => {
            const match = {
                sideA: sideA,
                sideB: sideB,
                scoreA: 0,
                scoreB: 0,
                saygId: createTemporaryId(),
            };
            await renderComponent({ tournamentData: { id: createTemporaryId() } }, {
                readOnly: true,
                match: match,
                hasNextRound: false,
                sideMap: toMap([ sideA, sideB ]),
                exceptSelected: exceptSelected,
                matchIndex: 0,
                round: {
                    matches: [ match ]
                },
                matchOptions: {},
            }, account);
            saygApiData[match.saygId] = {
                legs: {
                    0: {
                        playerSequence: [
                            { text: 'SIDE A', value: 'home' },
                            { text: 'SIDE B', value: 'away' },
                        ],
                        currentThrow: 'home',
                        home: { throws: [], score: 0, startingScore: 501, },
                        away: { throws: [], score: 0, startingScore: 501, },
                        homeScore: 0,
                        awayScore: 0,
                        startingScore: 501,
                        numberOfLegs: 3,
                    }
                }
            };
            const cells = Array.from(context.container.querySelectorAll('tr td'));
            await doClick(findButton(cells[0], '📊'));
            expect(reportedError).toBeNull();

            await doChange(context.container.querySelector('.modal-dialog'), 'input[data-score-input="true"]', '180', context.user);
            await doClick(findButton(context.container.querySelector('.modal-dialog'), '📌📌📌'));

            expect(reportedError).toBeNull();
            expect(oneEighties).toEqual([]);
        });

        it('cannot record sayg 180 for multi-player sides', async () => {
            const match = {
                sideA: sideC,
                sideB: sideD,
                scoreA: 0,
                scoreB: 0,
                saygId: createTemporaryId(),
            };
            await renderComponent({ tournamentData: { id: createTemporaryId() } }, {
                readOnly: false,
                match: match,
                hasNextRound: false,
                sideMap: toMap([ sideC, sideD ]),
                exceptSelected: exceptSelected,
                matchIndex: 0,
                round: {
                    matches: [ match ]
                },
                matchOptions: {},
            }, account);
            saygApiData[match.saygId] = {
                legs: {
                    0: {
                        playerSequence: [
                            { text: 'SIDE C', value: 'home' },
                            { text: 'SIDE D', value: 'away' },
                        ],
                        currentThrow: 'home',
                        home: { throws: [], score: 0, startingScore: 501, },
                        away: { throws: [], score: 0, startingScore: 501, },
                        homeScore: 0,
                        awayScore: 0,
                        startingScore: 501,
                        numberOfLegs: 3,
                    }
                }
            };
            const cells = Array.from(context.container.querySelectorAll('tr td'));
            await doClick(findButton(cells[0], '📊'));
            expect(reportedError).toBeNull();

            await doChange(context.container.querySelector('.modal-dialog'), 'input[data-score-input="true"]', '180', context.user);
            await doClick(findButton(context.container.querySelector('.modal-dialog'), '📌📌📌'));

            expect(reportedError).toBeNull();
            expect(oneEighties).toEqual([]);
        });

        it('can record sayg hi-check', async () => {
            const match = {
                sideA: sideA,
                sideB: sideB,
                scoreA: 0,
                scoreB: 0,
                saygId: createTemporaryId(),
            };
            await renderComponent({ tournamentData: { id: createTemporaryId() } }, {
                readOnly: false,
                match: match,
                hasNextRound: false,
                sideMap: toMap([ sideA, sideB ]),
                exceptSelected: exceptSelected,
                matchIndex: 0,
                round: {
                    matches: [ match ]
                },
                matchOptions: {},
            }, account);
            saygApiData[match.saygId] = {
                legs: {
                    0: {
                        playerSequence: [
                            { text: 'SIDE B', value: 'away' },
                            { text: 'SIDE A', value: 'home' },
                        ],
                        currentThrow: 'away',
                        home: { throws: [ {} ], score: 200, startingScore: 501, },
                        away: { throws: [ {} ], score: 350, startingScore: 501, },
                        homeScore: 200,
                        awayScore: 350,
                        startingScore: 501,
                        numberOfLegs: 3,
                    }
                }
            };
            const cells = Array.from(context.container.querySelectorAll('tr td'));
            await doClick(findButton(cells[0], '📊'));
            expect(reportedError).toBeNull();

            await doChange(context.container.querySelector('.modal-dialog'), 'input[data-score-input="true"]', '151', context.user);
            await doClick(findButton(context.container.querySelector('.modal-dialog'), '📌📌📌'));

            expect(reportedError).toBeNull();
            expect(hiChecks).toEqual([{
                notes: 151,
                player: playerSideB,
            }]);
        });

        it('cannot record sayg hi-check when readonly', async () => {
            const match = {
                sideA: sideA,
                sideB: sideB,
                scoreA: 0,
                scoreB: 0,
                saygId: createTemporaryId(),
            };
            await renderComponent({ tournamentData: { id: createTemporaryId() } }, {
                readOnly: true,
                match: match,
                hasNextRound: false,
                sideMap: toMap([ sideA, sideB ]),
                exceptSelected: exceptSelected,
                matchIndex: 0,
                round: {
                    matches: [ match ]
                },
                matchOptions: {},
            }, account);
            saygApiData[match.saygId] = {
                legs: {
                    0: {
                        playerSequence: [
                            { text: 'SIDE B', value: 'away' },
                            { text: 'SIDE A', value: 'home' },
                        ],
                        currentThrow: 'away',
                        home: { throws: [ {} ], score: 200, startingScore: 501, },
                        away: { throws: [ {} ], score: 350, startingScore: 501, },
                        homeScore: 200,
                        awayScore: 350,
                        startingScore: 501,
                        numberOfLegs: 3,
                    }
                }
            };
            const cells = Array.from(context.container.querySelectorAll('tr td'));
            await doClick(findButton(cells[0], '📊'));
            expect(reportedError).toBeNull();

            await doChange(context.container.querySelector('.modal-dialog'), 'input[data-score-input="true"]', '151', context.user);
            await doClick(findButton(context.container.querySelector('.modal-dialog'), '📌📌📌'));

            expect(reportedError).toBeNull();
            expect(hiChecks).toEqual([]);
        });

        it('cannot record sayg hi-check for multi-player sides', async () => {
            const match = {
                sideA: sideC,
                sideB: sideD,
                scoreA: 0,
                scoreB: 0,
                saygId: createTemporaryId(),
            };
            await renderComponent({ tournamentData: { id: createTemporaryId() } }, {
                readOnly: false,
                match: match,
                hasNextRound: false,
                sideMap: toMap([ sideC, sideD ]),
                exceptSelected: exceptSelected,
                matchIndex: 0,
                round: {
                    matches: [ match ]
                },
                matchOptions: {},
            }, account);
            saygApiData[match.saygId] = {
                legs: {
                    0: {
                        playerSequence: [
                            { text: 'SIDE C', value: 'away' },
                            { text: 'SIDE D', value: 'home' },
                        ],
                        currentThrow: 'away',
                        home: { throws: [ {} ], score: 200, startingScore: 501, },
                        away: { throws: [ {} ], score: 350, startingScore: 501, },
                        homeScore: 200,
                        awayScore: 350,
                        startingScore: 501,
                        numberOfLegs: 3,
                    }
                }
            };
            const cells = Array.from(context.container.querySelectorAll('tr td'));
            await doClick(findButton(cells[0], '📊'));
            expect(reportedError).toBeNull();

            await doChange(context.container.querySelector('.modal-dialog'), 'input[data-score-input="true"]', '151', context.user);
            await doClick(findButton(context.container.querySelector('.modal-dialog'), '📌📌📌'));

            expect(reportedError).toBeNull();
            expect(hiChecks).toEqual([]);
        });

        it('can open match options dialog', async () => {
            const match = {
                sideA: sideA,
                sideB: sideB,
                scoreA: 1,
                scoreB: 2,
            };
            await renderComponent({ tournamentData: { id: createTemporaryId() } }, {
                readOnly: false,
                match: match,
                hasNextRound: false,
                sideMap: toMap([ sideA, sideB ]),
                exceptSelected: exceptSelected,
                matchIndex: 0,
                round: {
                    matches: [ match ]
                },
                matchOptions: {},
            }, account);
            const cells = Array.from(context.container.querySelectorAll('tr td'));

            await doClick(findButton(cells[5], '🛠'));

            expect(reportedError).toBeNull();
            const dialog = context.container.querySelector('.modal-dialog');
            expect(dialog).toBeTruthy();
            expect(dialog.textContent).toContain('Edit match options');
        });

        it('can close match options dialog', async () => {
            const match = {
                sideA: sideA,
                sideB: sideB,
                scoreA: 1,
                scoreB: 2,
            };
            await renderComponent({ tournamentData: { id: createTemporaryId() } }, {
                readOnly: false,
                match: match,
                hasNextRound: false,
                sideMap: toMap([ sideA, sideB ]),
                exceptSelected: exceptSelected,
                matchIndex: 0,
                round: {
                    matches: [ match ]
                },
                matchOptions: {},
            }, account);
            const cells = Array.from(context.container.querySelectorAll('tr td'));
            await doClick(findButton(cells[5], '🛠'));
            expect(context.container.querySelector('.modal-dialog')).toBeTruthy();

            await doClick(findButton(context.container.querySelector('.modal-dialog'), 'Close'));

            expect(context.container.querySelector('.modal-dialog')).toBeFalsy();
        });

        it('can change sideA score', async () => {
            const match = {
                sideA: sideA,
                sideB: sideB,
                scoreA: 1,
                scoreB: 2,
            };
            returnFromExceptSelected['sideA'] = [ sideC, sideD ];
            returnFromExceptSelected['sideB'] = [ sideD, sideE ];
            await renderComponent({ tournamentData: { id: createTemporaryId() } }, {
                readOnly: false,
                match: match,
                hasNextRound: false,
                sideMap: toMap([ sideA, sideB, sideC, sideD, sideE ]),
                exceptSelected: exceptSelected,
                matchIndex: 0,
                round: {
                    matches: [ match ]
                },
                matchOptions: {},
            }, account);
            const cells = Array.from(context.container.querySelectorAll('tr td'));

            await doChange(cells[1], 'input', '5', context.user);

            expect(reportedError).toBeNull();
            expect(updatedRound).toEqual({
                matches: [ Object.assign({}, match, { scoreA: '5' }) ],
            });
        });

        it('can change A side', async () => {
            const match = {
                sideA: sideA,
                sideB: sideB,
                scoreA: 1,
                scoreB: 2,
            };
            returnFromExceptSelected['sideA'] = [ sideB, sideD ];
            returnFromExceptSelected['sideB'] = [ sideA, sideE ];
            await renderComponent({ tournamentData: { id: createTemporaryId() } }, {
                readOnly: false,
                match: match,
                hasNextRound: false,
                sideMap: toMap([ sideA, sideB, sideC, sideD, sideE ]),
                exceptSelected: exceptSelected,
                matchIndex: 0,
                round: {
                    matches: [ match ]
                },
                matchOptions: {},
            }, account);
            const cells = Array.from(context.container.querySelectorAll('tr td'));

            await doSelectOption(cells[0].querySelector('.dropdown-menu'), 'SIDE C');

            expect(reportedError).toBeNull();
            expect(updatedRound).toEqual({
                matches: [ Object.assign({}, match, { sideA: sideC }) ],
            });
        });

        it('can change sideB score', async () => {
            const match = {
                sideA: sideA,
                sideB: sideB,
                scoreA: 1,
                scoreB: 2,
            };
            returnFromExceptSelected['sideA'] = [ sideC, sideD ];
            returnFromExceptSelected['sideB'] = [ sideD, sideE ];
            await renderComponent({ tournamentData: { id: createTemporaryId() } }, {
                readOnly: false,
                match: match,
                hasNextRound: false,
                sideMap: toMap([ sideA, sideB, sideC, sideD, sideE ]),
                exceptSelected: exceptSelected,
                matchIndex: 0,
                round: {
                    matches: [ match ]
                },
                matchOptions: {},
            }, account);
            const cells = Array.from(context.container.querySelectorAll('tr td'));

            await doChange(cells[3], 'input', '5', context.user);

            expect(reportedError).toBeNull();
            expect(updatedRound).toEqual({
                matches: [ Object.assign({}, match, { scoreB: '5' }) ],
            });
        });

        it('can change B side', async () => {
            const match = {
                sideA: sideA,
                sideB: sideB,
                scoreA: 1,
                scoreB: 2,
            };
            returnFromExceptSelected['sideA'] = [ sideB, sideD ];
            returnFromExceptSelected['sideB'] = [ sideA, sideE ];
            await renderComponent({ tournamentData: { id: createTemporaryId() } }, {
                readOnly: false,
                match: match,
                hasNextRound: false,
                sideMap: toMap([ sideA, sideB, sideC, sideD, sideE ]),
                exceptSelected: exceptSelected,
                matchIndex: 0,
                round: {
                    matches: [ match ]
                },
                matchOptions: {},
            }, account);
            const cells = Array.from(context.container.querySelectorAll('tr td'));

            await doSelectOption(cells[4].querySelector('.dropdown-menu'), 'SIDE C');

            expect(reportedError).toBeNull();
            expect(updatedRound).toEqual({
                matches: [ Object.assign({}, match, { sideB: sideC }) ],
            });
        });

        it('can remove a match', async () => {
            const match = {
                sideA: sideA,
                sideB: sideB,
                scoreA: 1,
                scoreB: 2,
            };
            returnFromExceptSelected['sideA'] = [ sideB, sideD ];
            returnFromExceptSelected['sideB'] = [ sideA, sideE ];
            await renderComponent({ tournamentData: { id: createTemporaryId() } }, {
                readOnly: false,
                match: match,
                hasNextRound: false,
                sideMap: toMap([ sideA, sideB, sideC, sideD, sideE ]),
                exceptSelected: exceptSelected,
                matchIndex: 0,
                round: {
                    matches: [ match ]
                },
                matchOptions: {},
            }, account);
            const cells = Array.from(context.container.querySelectorAll('tr td'));
            let confirm;
            window.confirm = (message) => { confirm = message; return true; };

            await doClick(findButton(cells[5], '🗑'));

            expect(reportedError).toBeNull();
            expect(confirm).toEqual('Are you sure you want to remove this match?');
            expect(updatedRound).toEqual({
                matches: [ ],
            });
        });
    });
});