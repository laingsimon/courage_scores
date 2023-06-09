// noinspection JSUnresolvedFunction

import {cleanUp, renderApp, findButton, doClick, doChange, doSelectOption} from "../../../helpers/tests";
import React from "react";
import {createTemporaryId} from "../../../helpers/projection";
import {toMap, any} from "../../../helpers/collections";
import {TournamentRoundMatch} from "./TournamentRoundMatch";

describe('TournamentRoundMatch', () => {
    let context;
    let reportedError;
    let updatedRound;
    let updatedMatchOptions;
    let hiChecks;
    let oneEighties;

    afterEach(() => {
        cleanUp(context);
    });

    function onHiCheck(player, notes) {
        hiChecks.push({ player, notes });
    }

    function on180(player) {
        oneEighties.push(player);
    }

    async function renderComponent(props, account) {
        reportedError = null;
        updatedRound = null;
        updatedMatchOptions = null;
        hiChecks = [];
        oneEighties = [];
        context = await renderApp(
            { },
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
            (<TournamentRoundMatch
                {...props}
                onChange={updated => updatedRound = updated}
                onMatchOptionsChanged={updated => updatedMatchOptions = updated}
                onHiCheck={onHiCheck}
                on180={on180} />),
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
                await renderComponent({
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
                await renderComponent({
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
                await renderComponent({
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
                await renderComponent({
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
                await renderComponent({
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

            it('cannot open sayg', async () => {
                const match = {
                    sideA: sideA,
                    sideB: sideB,
                    scoreA: 1,
                    scoreB: 2,
                };
                await renderComponent({
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

            it('can open sayg', async () => {
                const match = {
                    sideA: sideA,
                    sideB: sideB,
                    scoreA: 1,
                    scoreB: 2,
                    sayg: {
                        legs: { }
                    },
                };
                await renderComponent({
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
                    manageGames: true,
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

                await renderComponent({
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
                await renderComponent({
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
                manageGames: true,
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
            await renderComponent({
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

            await doClick(findButton(cells[0], '📊'));

            expect(reportedError).toBeNull();
            const dialog = context.container.querySelector('.modal-dialog');
            expect(dialog).toBeTruthy();
            expect(dialog.textContent).toContain('SIDE A vs SIDE B');
        });

        it('can close sayg', async () => {
            const match = {
                sideA: sideA,
                sideB: sideB,
                scoreA: 1,
                scoreB: 2,
            };
            await renderComponent({
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
            await doClick(findButton(cells[0], '📊'));
            expect(context.container.querySelector('.modal-dialog')).toBeTruthy();

            await doClick(findButton(context.container.querySelector('.modal-dialog'), 'Close'));

            expect(context.container.querySelector('.modal-dialog')).toBeFalsy();
        });

        it('can open existing sayg', async () => {
            const match = {
                sideA: sideA,
                sideB: sideB,
                scoreA: 1,
                scoreB: 2,
                sayg: {
                    legs: { }
                },
            };
            await renderComponent({
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
                sayg: {
                    legs: { }
                },
            };
            await renderComponent({
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
            await doClick(findButton(cells[0], '📊'));
            const dialog = context.container.querySelector('.modal-dialog');
            await doClick(findButton(dialog, '🎯SIDE A'));

            expect(reportedError).toBeNull();
            const saygData = updatedRound.matches[0].sayg;
            expect(saygData.legs[0].playerSequence).toEqual([
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
                sayg: {
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
                },
            };
            await renderComponent({
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
            await doClick(findButton(cells[0], '📊'));

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
                sayg: {
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
                },
            };
            await renderComponent({
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
                sayg: {
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
                },
            };
            await renderComponent({
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
            const cells = Array.from(context.container.querySelectorAll('tr td'));
            await doClick(findButton(cells[0], '📊'));

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
                sayg: {
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
                },
            };
            await renderComponent({
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
            await doClick(findButton(cells[0], '📊'));

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
                sayg: {
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
                },
            };
            await renderComponent({
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
                sayg: {
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
                },
            };
            await renderComponent({
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
            const cells = Array.from(context.container.querySelectorAll('tr td'));
            await doClick(findButton(cells[0], '📊'));

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
            await renderComponent({
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
            await renderComponent({
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
            await renderComponent({
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
            await renderComponent({
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
            await renderComponent({
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
            await renderComponent({
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
            await renderComponent({
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