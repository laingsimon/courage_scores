// noinspection JSUnresolvedFunction

import {cleanUp, renderApp, doClick, doChange, findButton, doSelectOption} from "../../../helpers/tests";
import React from "react";
import {TournamentRound} from "./TournamentRound";
import {createTemporaryId} from "../../../helpers/projection";
import {TournamentContainer} from "./TournamentContainer";

describe('TournamentRound', () => {
    let context;
    let reportedError;
    let oneEighty;
    let hiCheck;
    let updatedRound;
    let updatedTournamentData;
    let warnBeforeSave;
    const tournamentApi = {
        addSayg: async () => {
            return {
                success: true,
                result: { /* tournament data */ }
            };
        }
    };
    let saygApiData;
    const saygApi = {
        get: async (id) => {
            return saygApiData[id];
        }
    };

    afterEach(() => {
        cleanUp(context);
    });

    async function onChange(newRound) {
        updatedRound = newRound;
    }

    async function onHiCheck(player, note) {
        hiCheck = { player, note };
    }

    async function on180(player) {
        oneEighty = player
    }

    async function setTournamentData(data) {
        updatedTournamentData = data;
    }

    async function renderComponent(containerProps, props, account) {
        reportedError = null;
        oneEighty = null;
        updatedTournamentData = null;
        hiCheck = null;
        saygApiData = {};
        updatedRound = null;
        warnBeforeSave = null;
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
                account
            },
            (<TournamentContainer {...containerProps} setTournamentData={setTournamentData} saveTournament={() => {}} setWarnBeforeSave={msg => warnBeforeSave = msg}>
                <TournamentRound {...props} onChange={onChange} onHiCheck={onHiCheck} on180={on180} />
            </TournamentContainer>));
    }

    function assertMatch(table, ordinal, expectedText) {
        const matchRow = table.querySelector(`tr:nth-child(${ordinal})`);
        const cells = Array.from(matchRow.querySelectorAll('td'));
        expect(cells.map(td => td.textContent)).toEqual(expectedText);
    }

    function assertEditableMatch(table, ordinal, expectedText) {
        const matchRow = table.querySelector(`tr:nth-child(${ordinal})`);
        const cells = Array.from(matchRow.querySelectorAll('td'));
        expect(cells.map(td => {
            if (td.querySelector('.dropdown-toggle')) {
                return td.querySelector('.dropdown-toggle').textContent;
            }
            if (td.querySelector('input')) {
                return td.querySelector('input').value;
            }

            return td.textContent;
        })).toEqual(expectedText);
    }

    describe('when logged out (readonly)', () => {
        const side1 = {
            id: createTemporaryId(),
            name: 'SIDE 1',
            players: []
        };
        const side2 = {
            id: createTemporaryId(),
            name: 'SIDE 2',
            players: []
        };
        const side3 = {
            id: createTemporaryId(),
            name: 'SIDE 3',
            players: []
        };
        const side4 = {
            id: createTemporaryId(),
            name: 'SIDE 4',
            players: []
        };
        const readOnly = true;

        describe('renders', () => {
            it('when no matches', async () => {
                await renderComponent({ tournamentData: { id: createTemporaryId() } }, {
                    round: {
                        matches: [ ],
                        matchOptions: [ ],
                        nextRound: null,
                    },
                    sides: [ ],
                    readOnly,
                    depth: 1,
                });

                expect(reportedError).toBeNull();
                expect(context.container.textContent).toContain('No matches defined');
            });

            it('unplayed round', async () => {
                await renderComponent({ tournamentData: { id: createTemporaryId() } }, {
                    round: {
                        matches: [ {
                            id: createTemporaryId(),
                            scoreA: null,
                            scoreB: null,
                            sideA: side1,
                            sideB: side2,
                        } ],
                        matchOptions: [ {
                            startingScore: 601,
                            numberOfLegs: 7,
                        } ],
                        nextRound: null,
                    },
                    sides: [ side1, side2, side3, side4 ],
                    readOnly,
                    depth: 1,
                });

                expect(reportedError).toBeNull();
                expect(context.container.querySelector('div > strong').textContent).toEqual('Semi-Final');
                const table = context.container.querySelector('table');
                assertMatch(table, 1, [ 'SIDE 1', '', 'vs', '', 'SIDE 2' ]);
            });

            it('played round', async () => {
                await renderComponent({ tournamentData: { id: createTemporaryId() } }, {
                    round: {
                        matches: [ {
                            id: createTemporaryId(),
                            scoreA: 1,
                            scoreB: 2,
                            sideA: side1,
                            sideB: side2,
                        }, {
                            id: createTemporaryId(),
                            scoreA: 2,
                            scoreB: 1,
                            sideA: side3,
                            sideB: side4,
                        } ],
                        matchOptions: [ {
                            startingScore: 601,
                            numberOfLegs: 7,
                        } ],
                        nextRound: null,
                    },
                    sides: [ side1, side2, side3, side4 ],
                    readOnly,
                    depth: 1,
                });

                expect(reportedError).toBeNull();
                expect(context.container.querySelector('div > strong').textContent).toEqual('Semi-Final');
                const table = context.container.querySelector('table');
                assertMatch(table, 1, [ 'SIDE 1', '1', 'vs', '2', 'SIDE 2' ]);
                assertMatch(table, 2, [ 'SIDE 3', '2', 'vs', '1', 'SIDE 4' ]);
            });

            it('next round (when all sides have a score)', async () => {
                await renderComponent({ tournamentData: { id: createTemporaryId() } }, {
                    allowNextRound: true,
                    round: {
                        matches: [ {
                            id: createTemporaryId(),
                            scoreA: 1,
                            scoreB: 2,
                            sideA: side1,
                            sideB: side2,
                        }, {
                            id: createTemporaryId(),
                            scoreA: 2,
                            scoreB: 1,
                            sideA: side3,
                            sideB: side4,
                        } ],
                        matchOptions: [ {
                            startingScore: 601,
                            numberOfLegs: 7,
                        } ],
                        nextRound: {
                            matches: [ {
                                id: createTemporaryId(),
                                scoreA: null,
                                scoreB: null,
                                sideA: side2,
                                sideB: side3,
                            } ],
                            matchOptions: [ {
                                startingScore: 601,
                                numberOfLegs: 7,
                            } ],
                            nextRound: null,
                        },
                    },
                    sides: [ side1, side2, side3, side4 ],
                    readOnly,
                    depth: 1,
                });

                expect(reportedError).toBeNull();
                expect(context.container.querySelector('div > strong').textContent).toEqual('Semi-Final');
                const roundTables = context.container.querySelectorAll('table');
                assertMatch(roundTables[0], 1, [ 'SIDE 1', '1', 'vs', '2', 'SIDE 2' ]);
                assertMatch(roundTables[0], 2, [ 'SIDE 3', '2', 'vs', '1', 'SIDE 4' ]);
                assertMatch(roundTables[1], 1, [ 'SIDE 2', '', 'vs', '', 'SIDE 3' ]);
            });
        });

        it('final round (when all sides have a score)', async () => {
            const side5 = {
                id: createTemporaryId(),
                name: 'SIDE 5',
                players: []
            };
            const side6 = {
                id: createTemporaryId(),
                name: 'SIDE 6',
                players: []
            };
            const side7 = {
                id: createTemporaryId(),
                name: 'SIDE 7',
                players: []
            };
            const side8 = {
                id: createTemporaryId(),
                name: 'SIDE 8',
                players: []
            };

            await renderComponent({ tournamentData: { id: createTemporaryId() } }, {
                allowNextRound: true,
                round: {
                    matches: [ {
                        id: createTemporaryId(),
                        scoreA: 1,
                        scoreB: 2,
                        sideA: side1,
                        sideB: side2,
                    }, {
                        id: createTemporaryId(),
                        scoreA: 2,
                        scoreB: 1,
                        sideA: side3,
                        sideB: side4,
                    }, {
                        id: createTemporaryId(),
                        scoreA: 2,
                        scoreB: 1,
                        sideA: side5,
                        sideB: side6,
                    }, {
                        id: createTemporaryId(),
                        scoreA: 2,
                        scoreB: 1,
                        sideA: side7,
                        sideB: side8,
                    } ],
                    matchOptions: [ {
                        startingScore: 601,
                        numberOfLegs: 7,
                    } ],
                    nextRound: {
                        matches: [ {
                            id: createTemporaryId(),
                            scoreA: 2,
                            scoreB: 1,
                            sideA: side2,
                            sideB: side3,
                        }, {
                            id: createTemporaryId(),
                            scoreA: 1,
                            scoreB: 2,
                            sideA: side5,
                            sideB: side7,
                        } ],
                        matchOptions: [ {
                            startingScore: 601,
                            numberOfLegs: 7,
                        } ],
                        nextRound: null,
                    },
                },
                sides: [ side1, side2, side3, side4, side5, side6, side7, side8 ],
                readOnly,
                depth: 1,
            });

            expect(reportedError).toBeNull();
            expect(Array.from(context.container.querySelectorAll('div > strong')).map(s => s.textContent)).toEqual([ 'Quarter-Final', 'Semi-Final' ]);
            const roundTables = context.container.querySelectorAll('table');
            assertMatch(roundTables[0], 1, [ 'SIDE 1', '1', 'vs', '2', 'SIDE 2' ]);
            assertMatch(roundTables[0], 2, [ 'SIDE 3', '2', 'vs', '1', 'SIDE 4' ]);
            assertMatch(roundTables[0], 3, [ 'SIDE 5', '2', 'vs', '1', 'SIDE 6' ]);
            assertMatch(roundTables[0], 4, [ 'SIDE 7', '2', 'vs', '1', 'SIDE 8' ]);
            assertMatch(roundTables[1], 1, [ 'SIDE 2', '2', 'vs', '1', 'SIDE 3' ]);
            assertMatch(roundTables[1], 2, [ 'SIDE 5', '1', 'vs', '2', 'SIDE 7' ]);
        });

        it('no next round (when single round)', async () => {
            await renderComponent({ tournamentData: { id: createTemporaryId() } }, {
                round: {
                    matches: [ {
                        id: createTemporaryId(),
                        scoreA: 1,
                        scoreB: 2,
                        sideA: side1,
                        sideB: side2,
                    }, {
                        id: createTemporaryId(),
                        scoreA: 2,
                        scoreB: 1,
                        sideA: side3,
                        sideB: side4,
                    } ],
                    matchOptions: [ {
                        startingScore: 601,
                        numberOfLegs: 7,
                    } ],
                    nextRound: {
                        matches: [ {
                            id: createTemporaryId(),
                            scoreA: null,
                            scoreB: null,
                            sideA: side2,
                            sideB: side3,
                        } ],
                        matchOptions: [ {
                            startingScore: 601,
                            numberOfLegs: 7,
                        } ],
                        nextRound: null,
                    },
                },
                sides: [ side1, side2, side3, side4 ],
                readOnly,
                depth: 1,
            });

            expect(reportedError).toBeNull();
            expect(context.container.querySelector('div > strong').textContent).toEqual('Semi-Final');
            const roundTables = context.container.querySelectorAll('table');
            expect(roundTables.length).toEqual(1);
        });

        it('cannot change round name', async () => {
            const match = {
                id: createTemporaryId(),
                scoreA: null,
                scoreB: null,
                sideA: side1,
                sideB: side2,
            };
            await renderComponent({ tournamentData: { id: createTemporaryId() } }, {
                round: {
                    matches: [ match ],
                    matchOptions: [ ],
                    nextRound: null,
                },
                sides: [ side1, side2, side3, side4 ],
                readOnly,
                depth: 1,
            });
            expect(reportedError).toBeNull();

            await doClick(context.container.querySelector('strong'));

            expect(context.container.querySelector('input')).toBeFalsy();
        });
    });

    describe('when logged in', () => {
        const side1 = {
            id: createTemporaryId(),
            name: 'SIDE 1',
            players: [{}]
        };
        const side2 = {
            id: createTemporaryId(),
            name: 'SIDE 2',
            players: [{}]
        };
        const side3 = {
            id: createTemporaryId(),
            name: 'SIDE 3',
            players: []
        };
        const side4 = {
            id: createTemporaryId(),
            name: 'SIDE 4',
            players: []
        };
        const readOnly = false;

        describe('renders', () => {
            it('when no matches', async () => {
                await renderComponent({ tournamentData: { id: createTemporaryId() } }, {
                    round: {
                        matches: [ ],
                        matchOptions: [ ],
                        nextRound: null,
                    },
                    sides: [ side1, side2 ],
                    readOnly,
                    depth: 1,
                });

                expect(reportedError).toBeNull();
                expect(context.container.querySelector('table')).toBeTruthy();
            });

            it('unplayed round', async () => {
                await renderComponent({ tournamentData: { id: createTemporaryId() } }, {
                    round: {
                        matches: [ {
                            id: createTemporaryId(),
                            scoreA: null,
                            scoreB: null,
                            sideA: side1,
                            sideB: side2,
                        } ],
                        matchOptions: [ {
                            startingScore: 601,
                            numberOfLegs: 7,
                        } ],
                        nextRound: null,
                    },
                    sides: [ side1, side2, side3, side4 ],
                    readOnly,
                    depth: 1,
                });

                expect(reportedError).toBeNull();
                expect(context.container.querySelector('div > strong').textContent).toEqual('Semi-Final');
                const table = context.container.querySelector('table');
                assertEditableMatch(table, 1, [ 'SIDE 1', '', 'vs', '', 'SIDE 2', '🗑🛠' ]);
            });

            it('played round', async () => {
                await renderComponent({ tournamentData: { id: createTemporaryId() } }, {
                    round: {
                        matches: [ {
                            id: createTemporaryId(),
                            scoreA: 1,
                            scoreB: 2,
                            sideA: side1,
                            sideB: side2,
                        }, {
                            id: createTemporaryId(),
                            scoreA: 2,
                            scoreB: 1,
                            sideA: side3,
                            sideB: side4,
                        } ],
                        matchOptions: [ {
                            startingScore: 601,
                            numberOfLegs: 7,
                        } ],
                        nextRound: null,
                    },
                    sides: [ side1, side2, side3, side4 ],
                    readOnly,
                    depth: 1,
                });

                expect(reportedError).toBeNull();
                expect(context.container.querySelector('div > strong').textContent).toEqual('Semi-Final');
                const table = context.container.querySelector('table');
                assertEditableMatch(table, 1, [ 'SIDE 1', '1', 'vs', '2', 'SIDE 2', '🗑🛠' ]);
                assertEditableMatch(table, 2, [ 'SIDE 3', '2', 'vs', '1', 'SIDE 4', '🗑🛠' ]);
            });

            it('next round (when all sides have a score)', async () => {
                await renderComponent({ tournamentData: { id: createTemporaryId() } }, {
                    allowNextRound: true,
                    round: {
                        matches: [ {
                            id: createTemporaryId(),
                            scoreA: 1,
                            scoreB: 2,
                            sideA: side1,
                            sideB: side2,
                        }, {
                            id: createTemporaryId(),
                            scoreA: 2,
                            scoreB: 1,
                            sideA: side3,
                            sideB: side4,
                        } ],
                        matchOptions: [ {
                            startingScore: 601,
                            numberOfLegs: 7,
                        } ],
                        nextRound: {
                            matches: [ {
                                id: createTemporaryId(),
                                scoreA: null,
                                scoreB: null,
                                sideA: side2,
                                sideB: side3,
                            } ],
                            matchOptions: [ {
                                startingScore: 601,
                                numberOfLegs: 7,
                            } ],
                            nextRound: null,
                        },
                    },
                    sides: [ side1, side2, side3, side4 ],
                    readOnly,
                    depth: 1,
                });

                expect(reportedError).toBeNull();
                expect(context.container.querySelector('div > strong').textContent).toEqual('Semi-Final');
                const roundTables = context.container.querySelectorAll('table');
                assertEditableMatch(roundTables[0], 1, [ 'SIDE 1', '1', 'vs', '2', 'SIDE 2' ]);
                assertEditableMatch(roundTables[0], 2, [ 'SIDE 3', '2', 'vs', '1', 'SIDE 4' ]);
                expect(context.container.querySelector('div > table+div > strong').textContent).toEqual('Final');
                assertEditableMatch(roundTables[1], 1, [ 'SIDE 2', '', 'vs', '', 'SIDE 3', '🗑🛠' ]);
            });

            it('final round (when all sides have a score)', async () => {
                const side5 = {
                    id: createTemporaryId(),
                    name: 'SIDE 5',
                    players: []
                };
                const side6 = {
                    id: createTemporaryId(),
                    name: 'SIDE 6',
                    players: []
                };
                const side7 = {
                    id: createTemporaryId(),
                    name: 'SIDE 7',
                    players: []
                };
                const side8 = {
                    id: createTemporaryId(),
                    name: 'SIDE 8',
                    players: []
                };

                await renderComponent({ tournamentData: { id: createTemporaryId() } }, {
                    allowNextRound: true,
                    round: {
                        matches: [
                            {
                            id: createTemporaryId(),
                            scoreA: 1,
                            scoreB: 2,
                            sideA: side1,
                            sideB: side2,
                        }, {
                            id: createTemporaryId(),
                            scoreA: 2,
                            scoreB: 1,
                            sideA: side3,
                            sideB: side4,
                        }, {
                            id: createTemporaryId(),
                            scoreA: 2,
                            scoreB: 1,
                            sideA: side5,
                            sideB: side6,
                        }, {
                            id: createTemporaryId(),
                            scoreA: 2,
                            scoreB: 1,
                            sideA: side7,
                            sideB: side8,
                        } ],
                        matchOptions: [ {
                            startingScore: 601,
                            numberOfLegs: 7,
                        } ],
                        nextRound: {
                            matches: [
                                {
                                id: createTemporaryId(),
                                scoreA: 2,
                                scoreB: 1,
                                sideA: side2,
                                sideB: side3,
                            }, {
                                id: createTemporaryId(),
                                scoreA: 1,
                                scoreB: 2,
                                sideA: side5,
                                sideB: side7,
                            } ],
                            matchOptions: [ {
                                startingScore: 601,
                                numberOfLegs: 7,
                            } ],
                            nextRound: null,
                        },
                    },
                    sides: [ side1, side2, side3, side4, side5, side6, side7, side8 ],
                    readOnly,
                    depth: 1,
                });

                expect(reportedError).toBeNull();
                expect(Array.from(context.container.querySelectorAll('div > strong')).map(s => s.textContent)).toEqual([ 'Quarter-Final', 'Semi-Final', 'Final' ]);
                const roundTables = context.container.querySelectorAll('table');
                assertMatch(roundTables[0], 1, [ 'SIDE 1', '1', 'vs', '2', 'SIDE 2' ]);
                assertMatch(roundTables[0], 2, [ 'SIDE 3', '2', 'vs', '1', 'SIDE 4' ]);
                assertMatch(roundTables[0], 3, [ 'SIDE 5', '2', 'vs', '1', 'SIDE 6' ]);
                assertMatch(roundTables[0], 4, [ 'SIDE 7', '2', 'vs', '1', 'SIDE 8' ]);
                assertEditableMatch(roundTables[1], 1, [ 'SIDE 2', '2', 'vs', '1', 'SIDE 3', '🗑🛠' ]);
                assertEditableMatch(roundTables[1], 2, [ 'SIDE 5', '1', 'vs', '2', 'SIDE 7', '🗑🛠' ]);
                assertEditableMatch(roundTables[2], 1, [ '', '', 'vs', '', '', '➕' ]); // can add a match to the final round
            });

            it('no next round (when single round)', async () => {
                await renderComponent({ tournamentData: { id: createTemporaryId() } }, {
                    round: {
                        matches: [ {
                            id: createTemporaryId(),
                            scoreA: 1,
                            scoreB: 2,
                            sideA: side1,
                            sideB: side2,
                        }, {
                            id: createTemporaryId(),
                            scoreA: 2,
                            scoreB: 1,
                            sideA: side3,
                            sideB: side4,
                        } ],
                        matchOptions: [ {
                            startingScore: 601,
                            numberOfLegs: 7,
                        } ],
                        nextRound: {
                            matches: [ {
                                id: createTemporaryId(),
                                scoreA: null,
                                scoreB: null,
                                sideA: side2,
                                sideB: side3,
                            } ],
                            matchOptions: [ {
                                startingScore: 601,
                                numberOfLegs: 7,
                            } ],
                            nextRound: null,
                        },
                    },
                    sides: [ side1, side2, side3, side4 ],
                    readOnly,
                    depth: 1,
                });

                expect(reportedError).toBeNull();
                expect(context.container.querySelector('div > strong').textContent).toEqual('Semi-Final');
                const roundTables = context.container.querySelectorAll('table');
                expect(roundTables.length).toEqual(1);
            });
        });

        describe('interactivity', () => {
            it('can delete match', async () => {
                await renderComponent({ tournamentData: { id: createTemporaryId() } }, {
                    round: {
                        matches: [ {
                            id: createTemporaryId(),
                            scoreA: null,
                            scoreB: null,
                            sideA: side1,
                            sideB: side2,
                        } ],
                        matchOptions: [ ],
                        nextRound: null,
                    },
                    sides: [ side1, side2, side3, side4 ],
                    readOnly,
                    depth: 1,
                });
                expect(reportedError).toBeNull();
                const matchRow = context.container.querySelector('table tr:nth-child(1)');
                window.confirm = () => true;

                await doClick(findButton(matchRow, '🗑'));

                expect(reportedError).toBeNull();
                expect(updatedRound).toEqual({
                    matches: [],
                    matchOptions: [],
                    nextRound: null,
                });
            });

            it('can change round name', async () => {
                const match = {
                    id: createTemporaryId(),
                    scoreA: null,
                    scoreB: null,
                    sideA: side1,
                    sideB: side2,
                };
                await renderComponent({ tournamentData: { id: createTemporaryId() } }, {
                    round: {
                        matches: [ match ],
                        matchOptions: [ ],
                        nextRound: null,
                    },
                    sides: [ side1, side2, side3, side4 ],
                    readOnly,
                    depth: 1,
                });
                expect(reportedError).toBeNull();

                await doClick(context.container.querySelector('strong'));
                await doChange(context.container, 'input[name="name"]', 'ROUND NAME', context.user);

                expect(reportedError).toBeNull();
                expect(updatedRound).toEqual({
                    matches: [ match ],
                    matchOptions: [],
                    nextRound: null,
                    name: 'ROUND NAME',
                });
            });

            it('can change sideA score', async () => {
                const match = {
                    id: createTemporaryId(),
                    scoreA: null,
                    scoreB: null,
                    sideA: side1,
                    sideB: side2,
                };
                await renderComponent({ tournamentData: { id: createTemporaryId() } }, {
                    round: {
                        matches: [ match ],
                        matchOptions: [ ],
                        nextRound: null,
                    },
                    sides: [ side1, side2, side3, side4 ],
                    readOnly,
                    depth: 1,
                });
                expect(reportedError).toBeNull();
                const matchRow = context.container.querySelector('table tr:nth-child(1)');
                const sideAScore = matchRow.querySelector('td:nth-child(2)');

                await doChange(sideAScore, 'input', '2', context.user);

                expect(reportedError).toBeNull();
                expect(updatedRound).toEqual({
                    matches: [ {
                        id: match.id,
                        scoreA: '2',
                        scoreB: null,
                        sideA: side1,
                        sideB: side2,
                    } ],
                    matchOptions: [],
                    nextRound: null,
                });
            });

            it('can change sideB score', async () => {
                const match = {
                    id: createTemporaryId(),
                    scoreA: null,
                    scoreB: null,
                    sideA: side1,
                    sideB: side2,
                };
                await renderComponent({ tournamentData: { id: createTemporaryId() } }, {
                    round: {
                        matches: [ match ],
                        matchOptions: [ ],
                        nextRound: null,
                    },
                    sides: [ side1, side2, side3, side4 ],
                    readOnly,
                    depth: 1,
                });
                expect(reportedError).toBeNull();
                const matchRow = context.container.querySelector('table tr:nth-child(1)');
                const sideBScore = matchRow.querySelector('td:nth-child(4)');

                await doChange(sideBScore, 'input', '2', context.user);

                expect(reportedError).toBeNull();
                expect(updatedRound).toEqual({
                    matches: [ {
                        id: match.id,
                        scoreA: null,
                        scoreB: '2',
                        sideA: side1,
                        sideB: side2,
                    } ],
                    matchOptions: [],
                    nextRound: null,
                });
            });

            it('defaults match options to bestOf', async () => {
                const match = {
                    id: createTemporaryId(),
                    scoreA: null,
                    scoreB: null,
                    sideA: side1,
                    sideB: side2,
                };
                await renderComponent({ tournamentData: { id: createTemporaryId(), bestOf: 9 } }, {
                    round: {
                        matches: [ match ],
                        matchOptions: [ ],
                        nextRound: null,
                    },
                    sides: [ side1, side2, side3, side4 ],
                    readOnly,
                    depth: 1,
                });
                expect(reportedError).toBeNull();
                const matchRow = context.container.querySelector('table tr:nth-child(1)');

                await doClick(findButton(matchRow, '🛠'));

                const matchOptionsDialog = context.container.querySelector('.modal-dialog');
                expect(matchOptionsDialog).toBeTruthy();
                expect(matchOptionsDialog.querySelector('input[name="numberOfLegs"]').value).toEqual('9');
            });

            it('can change match options', async () => {
                const match = {
                    id: createTemporaryId(),
                    scoreA: null,
                    scoreB: null,
                    sideA: side1,
                    sideB: side2,
                };
                await renderComponent({ tournamentData: { id: createTemporaryId() } }, {
                    round: {
                        matches: [ match ],
                        matchOptions: [ ],
                        nextRound: null,
                    },
                    sides: [ side1, side2, side3, side4 ],
                    readOnly,
                    depth: 1,
                });
                expect(reportedError).toBeNull();
                const matchRow = context.container.querySelector('table tr:nth-child(1)');

                await doClick(findButton(matchRow, '🛠'));
                const matchOptionsDialog = context.container.querySelector('.modal-dialog');
                expect(matchOptionsDialog).toBeTruthy();
                await doChange(matchOptionsDialog, 'input[name="startingScore"]', '123', context.user);
                await doClick(findButton(matchOptionsDialog, 'Close'));
                expect(context.container.querySelector('.modal-dialog')).toBeFalsy();
                expect(reportedError).toBeNull();
                expect(updatedRound).not.toBeNull();
                expect(updatedRound.matchOptions).toEqual([ {
                    startingScore: '123',
                    numberOfLegs: 5,
                }]);
            });

            it('cannot open sayg when not permitted', async () => {
                const match = {
                    id: createTemporaryId(),
                    scoreA: null,
                    scoreB: null,
                    sideA: side1,
                    sideB: side2,
                };
                const permittedAccount = {
                    access: {
                        recordScoresAsYouGo: false,
                    }
                };
                await renderComponent({ tournamentData: { id: createTemporaryId() } }, {
                    round: {
                        matches: [ match ],
                        matchOptions: [ ],
                        nextRound: null,
                    },
                    sides: [ side1, side2, side3, side4 ],
                    readOnly,
                    depth: 1,
                }, permittedAccount);
                expect(reportedError).toBeNull();
                const matchRow = context.container.querySelector('table tr:nth-child(1)');

                expect(matchRow.textContent).not.toContain('📊');
            });

            it('can change open sayg', async () => {
                const match = {
                    id: createTemporaryId(),
                    scoreA: null,
                    scoreB: null,
                    sideA: side1,
                    sideB: side2,
                };
                const permittedAccount = {
                    access: {
                        recordScoresAsYouGo: true,
                    }
                };
                await renderComponent({ tournamentData: { id: createTemporaryId() } }, {
                    round: {
                        matches: [ match ],
                        matchOptions: [ ],
                        nextRound: null,
                    },
                    sides: [ side1, side2, side3, side4 ],
                    readOnly,
                    depth: 1,
                }, permittedAccount);
                expect(reportedError).toBeNull();
                const matchRow = context.container.querySelector('table tr:nth-child(1)');

                await doClick(findButton(matchRow, '📊'));
                expect(reportedError).toBeNull();
                const saygDialog = context.container.querySelector('.modal-dialog');
                expect(saygDialog).toBeTruthy();
            });

            it('can change sideA', async () => {
                const match = {
                    id: createTemporaryId(),
                    scoreA: null,
                    scoreB: null,
                    sideA: side1,
                    sideB: side2,
                };
                await renderComponent({ tournamentData: { id: createTemporaryId() } }, {
                    round: {
                        matches: [ match ],
                        matchOptions: [ ],
                        nextRound: null,
                    },
                    sides: [ side1, side2, side3, side4 ],
                    readOnly,
                    depth: 1,
                });
                expect(reportedError).toBeNull();
                const matchRow = context.container.querySelector('table tr:nth-child(1)');
                const sideA = matchRow.querySelector('td:nth-child(1)');

                await doSelectOption(sideA.querySelector('.dropdown-menu'), 'SIDE 3');

                expect(reportedError).toBeNull();
                expect(updatedRound).toEqual({
                    matches: [ {
                        id: match.id,
                        scoreA: null,
                        scoreB: null,
                        sideA: side3,
                        sideB: side2,
                    } ],
                    matchOptions: [],
                    nextRound: null,
                });
            });

            it('can change sideB', async () => {
                const match = {
                    id: createTemporaryId(),
                    scoreA: null,
                    scoreB: null,
                    sideA: side1,
                    sideB: side2,
                };
                await renderComponent({ tournamentData: { id: createTemporaryId() } }, {
                    round: {
                        matches: [ match ],
                        matchOptions: [ ],
                        nextRound: null,
                    },
                    sides: [ side1, side2, side3, side4 ],
                    readOnly,
                    depth: 1,
                });
                expect(reportedError).toBeNull();
                const matchRow = context.container.querySelector('table tr:nth-child(1)');
                const sideB = matchRow.querySelector('td:nth-child(5)');

                await doSelectOption(sideB.querySelector('.dropdown-menu'), 'SIDE 3');

                expect(reportedError).toBeNull();
                expect(updatedRound).toEqual({
                    matches: [ {
                        id: match.id,
                        scoreA: null,
                        scoreB: null,
                        sideA: side1,
                        sideB: side3,
                    } ],
                    matchOptions: [],
                    nextRound: null,
                });
            });

            it('cannot add match with only sideA', async () => {
                await renderComponent({ tournamentData: { id: createTemporaryId() } }, {
                    round: {
                        matches: [ ],
                        matchOptions: [ ],
                        nextRound: null,
                    },
                    sides: [ side1, side2, side3, side4 ],
                    readOnly,
                    depth: 1,
                });
                expect(reportedError).toBeNull();
                const matchRow = context.container.querySelector('table tr:nth-child(1)');
                let message;
                window.alert = (msg) => message = msg;

                await doSelectOption(matchRow.querySelector('td:nth-child(1) .dropdown-menu'), 'SIDE 1');
                await doClick(findButton(matchRow, '➕'));

                expect(updatedRound).toBeFalsy();
                expect(message).toEqual('Select the sides first');
            });

            it('cannot add match with only sideB', async () => {
                await renderComponent({ tournamentData: { id: createTemporaryId() } }, {
                    round: {
                        matches: [ ],
                        matchOptions: [ ],
                        nextRound: null,
                    },
                    sides: [ side1, side2, side3, side4 ],
                    readOnly,
                    depth: 1,
                });
                expect(reportedError).toBeNull();
                const matchRow = context.container.querySelector('table tr:nth-child(1)');
                let message;
                window.alert = (msg) => message = msg;

                await doSelectOption(matchRow.querySelector('td:nth-child(1) .dropdown-menu'), 'SIDE 1');
                await doClick(findButton(matchRow, '➕'));

                expect(updatedRound).toBeFalsy();
                expect(message).toEqual('Select the sides first');
            });

            it('can add match', async () => {
                await renderComponent({ tournamentData: { id: createTemporaryId() } }, {
                    round: {
                        matches: [ ],
                        matchOptions: [ ],
                        nextRound: null,
                    },
                    sides: [ side1, side2, side3, side4 ],
                    readOnly,
                    depth: 1,
                });
                expect(reportedError).toBeNull();
                const matchRow = context.container.querySelector('table tr:nth-child(1)');

                await doSelectOption(matchRow.querySelector('td:nth-child(1) .dropdown-menu'), 'SIDE 1');
                await doSelectOption(matchRow.querySelector('td:nth-child(5) .dropdown-menu'), 'SIDE 2');
                await doClick(findButton(matchRow, '➕'));

                expect(updatedRound).not.toBeNull();
                expect(updatedRound.matches).toEqual([{
                    sideA: side1,
                    sideB: side2,
                }]);
            });

            it('sets up warning if side not added and tournament saved', async () => {
                await renderComponent({ tournamentData: { id: createTemporaryId() } }, {
                    round: {
                        matches: [ ],
                        matchOptions: [ ],
                        nextRound: null,
                    },
                    sides: [ side1, side2, side3, side4 ],
                    readOnly,
                    depth: 1,
                });
                expect(reportedError).toBeNull();
                const matchRow = context.container.querySelector('table tr:nth-child(1)');

                await doSelectOption(matchRow.querySelector('td:nth-child(1) .dropdown-menu'), 'SIDE 1');
                await doSelectOption(matchRow.querySelector('td:nth-child(5) .dropdown-menu'), 'SIDE 2');

                expect(updatedRound).toBeNull();
                expect(warnBeforeSave).toEqual('Add the (new) match before saving, otherwise it would be lost.\n' +
                    '\n' +
                    'Semi-Final: SIDE 1 vs SIDE 2');
            });

            it('can set sides in sub-round', async () => {
                await renderComponent({ tournamentData: { id: createTemporaryId() } }, {
                    allowNextRound: true,
                    round: {
                        matches: [ {
                            id: createTemporaryId(),
                            scoreA: 1,
                            scoreB: 2,
                            sideA: side1,
                            sideB: side2,
                        }, {
                            id: createTemporaryId(),
                            scoreA: 2,
                            scoreB: 1,
                            sideA: side3,
                            sideB: side4,
                        } ],
                        matchOptions: [ {
                            startingScore: 601,
                            numberOfLegs: 7,
                        } ],
                        nextRound: {
                            matches: [ {
                                id: createTemporaryId(),
                                scoreA: null,
                                scoreB: null,
                                sideA: side2,
                                sideB: side3,
                            } ],
                            matchOptions: [ {
                                startingScore: 601,
                                numberOfLegs: 7,
                            } ],
                            nextRound: null,
                        },
                    },
                    sides: [ side1, side2, side3, side4 ],
                    readOnly,
                    depth: 1,
                });
                expect(reportedError).toBeNull();
                const roundTables = context.container.querySelectorAll('table');
                const subMatchRow = roundTables[1].querySelector('tr:nth-child(1)');

                await doSelectOption(subMatchRow.querySelector('td:nth-child(1) .dropdown-menu'), 'SIDE 2');
                await doSelectOption(subMatchRow.querySelector('td:nth-child(5) .dropdown-menu'), 'SIDE 3');

                expect(updatedRound).not.toBeNull();
                expect(updatedRound.nextRound).not.toBeNull();
                expect(updatedRound.nextRound.matches).toEqual([{
                    id: expect.any(String),
                    scoreA: null,
                    scoreB: null,
                    sideA: side2,
                    sideB: side3,
                }]);
            });

            it('does not show match selection after final', async () => {
                await renderComponent({ tournamentData: { id: createTemporaryId() } }, {
                    allowNextRound: true,
                    round: {
                        matches: [ {
                            id: createTemporaryId(),
                            scoreA: 1,
                            scoreB: 2,
                            sideA: side1,
                            sideB: side2,
                        }, {
                            id: createTemporaryId(),
                            scoreA: 2,
                            scoreB: 1,
                            sideA: side3,
                            sideB: side4,
                        } ],
                        matchOptions: [ {
                            startingScore: 601,
                            numberOfLegs: 7,
                        } ],
                        nextRound: {
                            matches: [ {
                                id: createTemporaryId(),
                                scoreA: 1,
                                scoreB: 2,
                                sideA: side2,
                                sideB: side3,
                            } ],
                            matchOptions: [ {
                                startingScore: 601,
                                numberOfLegs: 7,
                            } ],
                            nextRound: null,
                        },
                    },
                    sides: [ side1, side2, side3, side4 ],
                    readOnly,
                    depth: 1,
                });
                expect(reportedError).toBeNull();

                const roundTables = Array.from(context.container.querySelectorAll('table'));
                expect(roundTables.length).toEqual(2);
            });

            it('can record 180', async () => {
                const match = {
                    id: createTemporaryId(),
                    scoreA: null,
                    scoreB: null,
                    sideA: side1,
                    sideB: side2,
                    saygId: createTemporaryId(),
                };
                const saygData = {
                    legs: {
                        '0': {
                            playerSequence: [
                                { value: 'home', text: 'SIDE 1' },
                                { value: 'away', text: 'SIDE 2' }
                            ],
                            home: {
                                throws: [ { score: 0 } ],
                                score: 0,
                            },
                            away: {
                                throws: [ { score: 0 } ],
                                score: 0,
                            },
                            isLastLeg: false,
                            startingScore: 501,
                            currentThrow: 'home',
                        }
                    }
                };
                const permittedAccount = {
                    access: {
                        recordScoresAsYouGo: true,
                    }
                };
                await renderComponent({ tournamentData: { id: createTemporaryId() } }, {
                    round: {
                        matches: [ match ],
                        matchOptions: [ ],
                        nextRound: null,
                    },
                    sides: [ side1, side2, side3, side4 ],
                    readOnly,
                    depth: 1,
                }, permittedAccount);
                saygApiData[match.saygId] = saygData;
                expect(reportedError).toBeNull();
                const matchRow = context.container.querySelector('table tr:nth-child(1)');
                await doClick(findButton(matchRow, '📊'));
                expect(reportedError).toBeNull();
                const saygDialog = context.container.querySelector('.modal-dialog');
                expect(saygDialog.querySelector('[data-name="data-error"]')).toBeFalsy();
                await doChange(saygDialog, 'input[data-score-input="true"]', '180', context.user);
                await doClick(findButton(saygDialog, '📌📌📌'));

                expect(oneEighty).not.toBeNull();
            });

            it('can record hiCheck', async () => {
                const match = {
                    id: createTemporaryId(),
                    scoreA: null,
                    scoreB: null,
                    sideA: side1,
                    sideB: side2,
                    saygId: createTemporaryId(),
                };
                const saygData = {
                    legs: {
                        '0': {
                            playerSequence: [
                                { value: 'home', text: 'SIDE 1' },
                                { value: 'away', text: 'SIDE 2' }
                            ],
                            home: {
                                throws: [ { score: 0 } ],
                                score: 351,
                            },
                            away: {
                                throws: [ { score: 0 } ],
                                score: 301,
                            },
                            isLastLeg: false,
                            startingScore: 501,
                            currentThrow: 'home',
                        }
                    }
                };
                const permittedAccount = {
                    access: {
                        recordScoresAsYouGo: true,
                    }
                };
                await renderComponent({ tournamentData: { id: createTemporaryId() } }, {
                    round: {
                        matches: [ match ],
                        matchOptions: [ ],
                        nextRound: null,
                    },
                    sides: [ side1, side2, side3, side4 ],
                    readOnly,
                    depth: 1,
                }, permittedAccount);
                saygApiData[match.saygId] = saygData;
                expect(reportedError).toBeNull();
                const matchRow = context.container.querySelector('table tr:nth-child(1)');
                await doClick(findButton(matchRow, '📊'));
                expect(reportedError).toBeNull();
                const saygDialog = context.container.querySelector('.modal-dialog');
                expect(saygDialog.querySelector('[data-name="data-error"]')).toBeFalsy();
                await doChange(saygDialog, 'input[data-score-input="true"]', '150', context.user);
                await doClick(findButton(saygDialog, '📌📌📌'));

                expect(hiCheck).not.toBeNull();
                expect(hiCheck.note).toEqual(150);
            });
        });
    });
});