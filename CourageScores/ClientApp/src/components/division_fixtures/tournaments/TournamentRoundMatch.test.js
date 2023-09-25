// noinspection JSUnresolvedFunction

import {cleanUp, doChange, doClick, doSelectOption, findButton, noop, renderApp} from "../../../helpers/tests";
import React from "react";
import {createTemporaryId} from "../../../helpers/projection";
import {any, toMap} from "../../../helpers/collections";
import {TournamentRoundMatch} from "./TournamentRoundMatch";
import {TournamentContainer} from "./TournamentContainer";
import {
    tournamentMatchBuilder,
    matchOptionsBuilder,
    roundBuilder,
    saygBuilder,
    sideBuilder,
    playerBuilder
} from "../../../helpers/builders";

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
    let saygApiData;
    let tournamentApiResponse;
    let deletedSayg;
    const tournamentApi = {
        addSayg: async (tournamentId, matchId, matchOptions) => {
            createdSaygSessions.push({tournamentId, matchId, matchOptions});
            const responseData = addSaygLookup.filter(l => l.match.id === matchId)[0];

            if (!responseData) {
                throw new Error('Did not expect match to have sayg session created');
            }

            // NOTE: intentionally mutates the source data so the tests work with updated state.
            responseData.match.saygId = responseData.saygId;

            return tournamentApiResponse || {
                success: responseData.success,
                result: responseData.result
            };
        },
        deleteSayg: async (tournamentId, matchId) => {
            deletedSayg = { tournamentId, matchId };
            return tournamentApiResponse || {
                success: true,
            }
        }
    };
    const saygApi = {
        get: async (id) => {
            return saygApiData[id];
        },
        upsert: async (data) => {
            updatedSaygData = data;
            return {
                success: true,
                result: data,
            };
        }
    };

    afterEach(() => {
        cleanUp(context);
    });

    beforeEach(() => {
        saygApiData = {};
    });

    function onHiCheck(player, notes) {
        hiChecks.push({player, notes});
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
        tournamentApiResponse = null;
        updatedMatchOptions = null;
        updatedTournamentData = null;
        hiChecks = [];
        oneEighties = [];
        addSaygLookup = [];
        updatedSaygData = null;
        updatedPatch = null;
        createdSaygSessions = [];
        deletedSayg = null;
        context = await renderApp(
            {tournamentApi, saygApi},
            {name: 'Courage Scores'},
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
                reportClientSideException: noop,
            },
            (<TournamentContainer {...containerProps} setTournamentData={setTournamentData} saveTournament={noop}>
                <TournamentRoundMatch
                    {...props}
                    onChange={updated => updatedRound = updated}
                    onMatchOptionsChanged={updated => updatedMatchOptions = updated}
                    onHiCheck={onHiCheck}
                    on180={on180}
                    patchData={(patch) => updatedPatch = patch}/>
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
        const sideA = sideBuilder('SIDE A').build();
        const sideB = sideBuilder('SIDE B').build();
        const sideC = sideBuilder('SIDE C').build();
        const sideD = sideBuilder('SIDE D').build();
        const sideE = sideBuilder('SIDE E').build();
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
                const match = tournamentMatchBuilder().sideA(sideA, 1).sideB(sideB, 2).build();
                await renderComponent({tournamentData: {id: createTemporaryId()}}, {
                    readOnly: true,
                    match: match,
                    hasNextRound: true,
                    sideMap: toMap([sideA, sideB]),
                    exceptSelected: exceptSelected,
                    matchIndex: 0,
                    round: {
                        matches: [match]
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
                const match = tournamentMatchBuilder().sideA(sideA).sideB(sideB).build();
                await renderComponent({tournamentData: {id: createTemporaryId()}}, {
                    readOnly: true,
                    match: match,
                    hasNextRound: true,
                    sideMap: toMap([sideA, sideB]),
                    exceptSelected: exceptSelected,
                    matchIndex: 0,
                    round: roundBuilder().withMatch(match).build(),
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
                const match = tournamentMatchBuilder().sideA(sideA, 3).sideB(sideB, 2).build();
                await renderComponent({tournamentData: {id: createTemporaryId()}}, {
                    readOnly: true,
                    match: match,
                    hasNextRound: true,
                    sideMap: toMap([sideA, sideB]),
                    exceptSelected: exceptSelected,
                    matchIndex: 0,
                    round: roundBuilder().withMatch(match).build(),
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

            it('sideA outright winner shows 0 value score for sideB', async () => {
                const match = tournamentMatchBuilder().sideA(sideA, 3).sideB(sideB, 0).build();
                await renderComponent({tournamentData: {id: createTemporaryId()}}, {
                    readOnly: true,
                    match: match,
                    hasNextRound: false,
                    sideMap: toMap([sideA, sideB]),
                    exceptSelected: exceptSelected,
                    matchIndex: 0,
                    round: roundBuilder().withMatch(match).build(),
                    matchOptions: {},
                }, account);

                expect(reportedError).toBeNull();
                const cells = Array.from(context.container.querySelectorAll('tr td'));
                expect(cells.length).toEqual(5);
                expect(cells[1].textContent).toEqual('3');
                expect(cells[3].textContent).toEqual('0');
            });

            it('sideB winner', async () => {
                const match = tournamentMatchBuilder().sideA(sideA, 2).sideB(sideB, 3).build();
                await renderComponent({tournamentData: {id: createTemporaryId()}}, {
                    readOnly: true,
                    match: match,
                    hasNextRound: true,
                    sideMap: toMap([sideA, sideB]),
                    exceptSelected: exceptSelected,
                    matchIndex: 0,
                    round: roundBuilder().withMatch(match).build(),
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

            it('sideB outright winner shows 0 value score for sideA', async () => {
                const match = tournamentMatchBuilder().sideA(sideA, 0).sideB(sideB, 3).build();
                await renderComponent({tournamentData: {id: createTemporaryId()}}, {
                    readOnly: true,
                    match: match,
                    hasNextRound: false,
                    sideMap: toMap([sideA, sideB]),
                    exceptSelected: exceptSelected,
                    matchIndex: 0,
                    round: roundBuilder().withMatch(match).build(),
                    matchOptions: {},
                }, account);

                expect(reportedError).toBeNull();
                const cells = Array.from(context.container.querySelectorAll('tr td'));
                expect(cells.length).toEqual(5);
                expect(cells[1].textContent).toEqual('0');
                expect(cells[3].textContent).toEqual('3');
            });

            it('when no next round', async () => {
                const match = tournamentMatchBuilder().sideA(sideA, 1).sideB(sideB, 2).build();
                await renderComponent({tournamentData: {id: createTemporaryId()}}, {
                    readOnly: true,
                    match: match,
                    hasNextRound: false,
                    sideMap: toMap([sideA, sideB]),
                    exceptSelected: exceptSelected,
                    matchIndex: 0,
                    round: roundBuilder().withMatch(match).build(),
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
                const match = tournamentMatchBuilder().sideA(sideA, 1).sideB(sideB, 2).build();
                await renderComponent({tournamentData: {id: createTemporaryId()}}, {
                    readOnly: true,
                    match: match,
                    hasNextRound: false,
                    sideMap: toMap([sideA, sideB]),
                    exceptSelected: exceptSelected,
                    matchIndex: 0,
                    round: roundBuilder().withMatch(match).build(),
                    matchOptions: {},
                }, account);

                expect(reportedError).toBeNull();
                const cells = Array.from(context.container.querySelectorAll('tr td'));
                expect(cells[0].textContent).not.toContain('📊');
            });

            it('can open sayg if it exists', async () => {
                const saygData = saygBuilder()
                    .numberOfLegs(7)
                    .startingScore(501)
                    .addTo(saygApiData)
                    .build();
                const match = tournamentMatchBuilder().sideA(sideA, 1).sideB(sideB, 2).saygId(saygData.id).build();
                await renderComponent({tournamentData: {id: createTemporaryId()}}, {
                    readOnly: true,
                    match: match,
                    hasNextRound: false,
                    sideMap: toMap([sideA, sideB]),
                    exceptSelected: exceptSelected,
                    matchIndex: 0,
                    round: roundBuilder().withMatch(match).build(),
                    matchOptions: {},
                }, account);
                const cells = Array.from(context.container.querySelectorAll('tr td'));

                await doClick(findButton(cells[0], '📊'));

                expect(reportedError).toBeNull();
                const dialog = context.container.querySelector('.modal-dialog');
                expect(dialog).toBeTruthy();
                expect(dialog.textContent).toContain('SIDE A vs SIDE B - best of 7');
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
                const match = tournamentMatchBuilder().sideA(sideA, 1).sideB(sideB, 2).build();
                returnFromExceptSelected['sideA'] = [sideC, sideD];
                returnFromExceptSelected['sideB'] = [sideD, sideE];

                await renderComponent({tournamentData: {id: createTemporaryId()}}, {
                    readOnly: false,
                    match: match,
                    hasNextRound: false,
                    sideMap: toMap([sideA, sideB, sideC, sideD, sideE]),
                    exceptSelected: exceptSelected,
                    matchIndex: 0,
                    round: roundBuilder().withMatch(match).build(),
                    matchOptions: {},
                }, account);

                expect(reportedError).toBeNull();
                const cells = Array.from(context.container.querySelectorAll('tr td'));
                expect(cells.length).toEqual(6);
                assertDropdown(cells[0], 'SIDE A', ['SIDE A', 'SIDE B', 'SIDE E']);
                assertScore(cells[1], '1');
                expect(cells[2].textContent).toEqual('vs');
                assertScore(cells[3], '2');
                assertDropdown(cells[4], 'SIDE B', ['SIDE A', 'SIDE B', 'SIDE C']);
            });

            it('can open match options', async () => {
                const match = tournamentMatchBuilder().sideA(sideA, 1).sideB(sideB, 2).build();
                await renderComponent({tournamentData: {id: createTemporaryId()}}, {
                    readOnly: false,
                    match: match,
                    hasNextRound: false,
                    sideMap: toMap([sideA, sideB]),
                    exceptSelected: exceptSelected,
                    matchIndex: 0,
                    round: roundBuilder().withMatch(match).build(),
                    matchOptions: {},
                }, account);

                expect(reportedError).toBeNull();
                const cells = Array.from(context.container.querySelectorAll('tr td'));
                expect(cells[5].textContent).toContain('🛠');
            });

            it('can open sayg when super league tournament', async () => {
                const match = tournamentMatchBuilder().sideA(sideA, 1).sideB(sideB, 2).build();
                await renderComponent({tournamentData: {id: createTemporaryId(), singleRound: true}}, {
                    readOnly: false,
                    match: match,
                    hasNextRound: false,
                    sideMap: toMap([sideA, sideB]),
                    exceptSelected: exceptSelected,
                    matchIndex: 0,
                    round: roundBuilder().withMatch(match).build(),
                    matchOptions: {},
                }, account);

                expect(reportedError).toBeNull();
                const cells = Array.from(context.container.querySelectorAll('tr td'));
                expect(cells[0].textContent).toContain('📊');
            });

            it('can open sayg when singles tournament', async () => {
                const singlesSideA = sideBuilder('A').withPlayer('A player').build();
                const singlesSideB = sideBuilder('B').withPlayer('B player').build();
                const match = tournamentMatchBuilder().sideA(singlesSideA, 0).sideB(singlesSideB, 0).build();
                await renderComponent({tournamentData: {id: createTemporaryId()}}, {
                    readOnly: false,
                    match: match,
                    hasNextRound: false,
                    sideMap: toMap([singlesSideA, singlesSideB]),
                    exceptSelected: exceptSelected,
                    matchIndex: 0,
                    round: roundBuilder().withMatch(match).build(),
                    matchOptions: {},
                }, account);

                expect(reportedError).toBeNull();
                const cells = Array.from(context.container.querySelectorAll('tr td'));
                expect(cells[0].textContent).toContain('📊');
            });

            it('cannot open sayg when pairs tournament', async () => {
                const pairsSideA = sideBuilder('A')
                    .withPlayer('A player 1')
                    .withPlayer('A player 2')
                    .build();
                const pairsSideB = sideBuilder('B')
                    .withPlayer('B player 1')
                    .withPlayer('B player 2')
                    .build();
                const match = tournamentMatchBuilder().sideA(pairsSideA, 0).sideB(pairsSideB, 0).build();
                await renderComponent({tournamentData: {id: createTemporaryId()}}, {
                    readOnly: false,
                    match: match,
                    hasNextRound: false,
                    sideMap: toMap([pairsSideA, pairsSideB]),
                    exceptSelected: exceptSelected,
                    matchIndex: 0,
                    round: roundBuilder().withMatch(match).build(),
                    matchOptions: {},
                }, account);

                expect(reportedError).toBeNull();
                const cells = Array.from(context.container.querySelectorAll('tr td'));
                expect(cells[0].textContent).not.toContain('📊');
            });

            it('cannot open sayg when teams tournament', async () => {
                const teamSideA = sideBuilder('A').teamId(createTemporaryId()).build();
                const teamSideB = sideBuilder('B').teamId(createTemporaryId()).build();
                const match = tournamentMatchBuilder().sideA(teamSideA, 0).sideB(teamSideB, 0).build();
                await renderComponent({tournamentData: {id: createTemporaryId()}}, {
                    readOnly: false,
                    match: match,
                    hasNextRound: false,
                    sideMap: toMap([teamSideA, teamSideB]),
                    exceptSelected: exceptSelected,
                    matchIndex: 0,
                    round: roundBuilder().withMatch(match).build(),
                    matchOptions: {},
                }, account);

                expect(reportedError).toBeNull();
                const cells = Array.from(context.container.querySelectorAll('tr td'));
                expect(cells[0].textContent).not.toContain('📊');
            });

            it('sideA outright winner shows 0 value score for sideB', async () => {
                const match = tournamentMatchBuilder().sideA(sideA, 3).sideB(sideB, 0).build();
                await renderComponent({tournamentData: {id: createTemporaryId()}}, {
                    readOnly: false,
                    match: match,
                    hasNextRound: false,
                    sideMap: toMap([sideA, sideB]),
                    exceptSelected: exceptSelected,
                    matchIndex: 0,
                    round: roundBuilder().withMatch(match).build(),
                    matchOptions: {},
                }, account);

                expect(reportedError).toBeNull();
                const cells = Array.from(context.container.querySelectorAll('tr td'));
                expect(cells.length).toEqual(6);
                assertScore(cells[1], '3');
                assertScore(cells[3], '0');
            });

            it('sideB outright winner shows 0 value score for sideA', async () => {
                const match = tournamentMatchBuilder().sideA(sideA, 0).sideB(sideB, 3).build();
                await renderComponent({tournamentData: {id: createTemporaryId()}}, {
                    readOnly: false,
                    match: match,
                    hasNextRound: false,
                    sideMap: toMap([sideA, sideB]),
                    exceptSelected: exceptSelected,
                    matchIndex: 0,
                    round: roundBuilder().withMatch(match).build(),
                    matchOptions: {},
                }, account);

                expect(reportedError).toBeNull();
                const cells = Array.from(context.container.querySelectorAll('tr td'));
                expect(cells.length).toEqual(6);
                assertScore(cells[1], '0');
                assertScore(cells[3], '3');
            });
        });
    });

    describe('interactivity', () => {
        const playerSideA = playerBuilder('PLAYER SIDE A').build();
        const playerSideB = playerBuilder('PLAYER SIDE A').build();
        const sideA = sideBuilder('SIDE A').withPlayer(playerSideA).build();
        const sideB = sideBuilder('SIDE B').withPlayer(playerSideB).build();
        const sideC = sideBuilder('SIDE C')
            .withPlayer(playerSideA)
            .withPlayer(playerSideB)
            .build();
        const sideD = sideBuilder('SIDE D')
            .withPlayer(playerSideA)
            .withPlayer(playerSideB)
            .build();
        const sideE = sideBuilder('SIDE E').build();
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
            console.log = noop;
        });

        it('can open sayg', async () => {
            const match = tournamentMatchBuilder().sideA(sideA, 0).sideB(sideB, 0).build();
            const matchOptions = matchOptionsBuilder().startingScore(501).numberOfLegs(3).build();
            await renderComponent({tournamentData: {id: createTemporaryId()}}, {
                readOnly: false,
                match: match,
                hasNextRound: false,
                sideMap: toMap([sideA, sideB]),
                exceptSelected: exceptSelected,
                matchIndex: 0,
                round: roundBuilder().withMatch(match).build(),
                matchOptions,
            }, account);
            const saygData = saygBuilder()
                .withLeg('0', l => l.startingScore(501))
                .build();
            addSaygLookup.push({
                match: match,
                success: true,
                result: {
                    id: createTemporaryId(),
                    round: {
                        matches: [match]
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

        it('handles error when opening sayg dialog', async () => {
            const match = tournamentMatchBuilder().sideA(sideA, 0).sideB(sideB, 0).build();
            const matchOptions = matchOptionsBuilder().startingScore(501).numberOfLegs(3).build();
            await renderComponent({tournamentData: {id: createTemporaryId()}}, {
                readOnly: false,
                match: match,
                hasNextRound: false,
                sideMap: toMap([sideA, sideB]),
                exceptSelected: exceptSelected,
                matchIndex: 0,
                round: roundBuilder().withMatch(match).build(),
                matchOptions,
            }, account);
            const saygData = saygBuilder()
                .withLeg('0', l => l.startingScore(501))
                .build();
            addSaygLookup.push({
                match: match,
                success: true,
                result: {
                    id: createTemporaryId(),
                    round: {
                        matches: [match]
                    },
                },
                saygId: saygData.id,
            });
            saygApiData[saygData.id] = saygData;
            const cells = Array.from(context.container.querySelectorAll('tr td'));
            tournamentApiResponse = {success: false, errors: ['SOME ERROR']};

            await doClick(findButton(cells[0], '📊'));

            expect(reportedError).toBeNull();
            expect(context.container.textContent).toContain('SOME ERROR');
            expect(context.container.textContent).toContain('Could not create sayg session');
        });

        it('can close error dialog after sayg creation failure', async () => {
            const match = tournamentMatchBuilder().sideA(sideA, 0).sideB(sideB, 0).build();
            const matchOptions = matchOptionsBuilder().startingScore(501).numberOfLegs(3).build();
            await renderComponent({tournamentData: {id: createTemporaryId()}}, {
                readOnly: false,
                match: match,
                hasNextRound: false,
                sideMap: toMap([sideA, sideB]),
                exceptSelected: exceptSelected,
                matchIndex: 0,
                round: roundBuilder().withMatch(match).build(),
                matchOptions,
            }, account);
            const saygData = saygBuilder()
                .withLeg('0', l => l.startingScore(501))
                .build();
            addSaygLookup.push({
                match: match,
                success: true,
                result: {
                    id: createTemporaryId(),
                    round: {
                        matches: [match]
                    },
                },
                saygId: saygData.id,
            });
            saygApiData[saygData.id] = saygData;
            const cells = Array.from(context.container.querySelectorAll('tr td'));
            tournamentApiResponse = {success: false, errors: ['SOME ERROR']};
            await doClick(findButton(cells[0], '📊'));
            expect(context.container.textContent).toContain('Could not create sayg session');

            await doClick(findButton(context.container, 'Close'));

            expect(context.container.textContent).not.toContain('Could not create sayg session');
        });

        it('does not open sayg for tentative match', async () => {
            const match = tournamentMatchBuilder().noId().sideA(sideA, 1).sideB(sideB, 2).build();
            const matchOptions = matchOptionsBuilder().startingScore(501).numberOfLegs(3).build();
            await renderComponent({tournamentData: {id: createTemporaryId()}}, {
                readOnly: false,
                match: match,
                hasNextRound: false,
                sideMap: toMap([sideA, sideB]),
                exceptSelected: exceptSelected,
                matchIndex: 0,
                round: roundBuilder().withMatch(match).build(),
                matchOptions,
            }, account);
            const saygData = saygBuilder()
                .withLeg('0', l => l.startingScore(501))
                .build();
            addSaygLookup.push({
                match: match,
                success: true,
                result: {
                    id: createTemporaryId(),
                    round: {
                        matches: [match]
                    },
                },
                saygId: saygData.id,
            });
            saygApiData[saygData.id] = saygData;
            const cells = Array.from(context.container.querySelectorAll('tr td'));
            let message;
            window.alert = (msg) => message = msg;

            await doClick(findButton(cells[0], '📊'));

            expect(reportedError).toBeNull();
            expect(createdSaygSessions.length).toEqual(0);
            expect(message).toEqual('Save the tournament first');
        });

        it('does not open sayg for matches with score', async () => {
            const match = tournamentMatchBuilder().sideA(sideA, 1).sideB(sideB, 2).build();
            const matchOptions = matchOptionsBuilder().startingScore(501).numberOfLegs(3).build();
            await renderComponent({tournamentData: {id: createTemporaryId()}}, {
                readOnly: false,
                match: match,
                hasNextRound: false,
                sideMap: toMap([sideA, sideB]),
                exceptSelected: exceptSelected,
                matchIndex: 0,
                round: roundBuilder().withMatch(match).build(),
                matchOptions,
            }, account);
            const saygData = saygBuilder()
                .withLeg('0', l => l.startingScore(501))
                .build();
            addSaygLookup.push({
                match: match,
                success: true,
                result: {
                    id: createTemporaryId(),
                    round: {
                        matches: [match]
                    },
                },
                saygId: saygData.id,
            });
            saygApiData[saygData.id] = saygData;
            const cells = Array.from(context.container.querySelectorAll('tr td'));
            let message;
            window.alert = (msg) => message = msg;

            await doClick(findButton(cells[0], '📊'));

            expect(reportedError).toBeNull();
            expect(createdSaygSessions.length).toEqual(0);
            expect(message).toEqual('Game has already been played; cannot score as you go');
        });

        it('can close sayg', async () => {
            const match = tournamentMatchBuilder().sideA(sideA, 0).sideB(sideB, 0).build();
            await renderComponent({tournamentData: {id: createTemporaryId()}}, {
                readOnly: false,
                match: match,
                hasNextRound: false,
                sideMap: toMap([sideA, sideB]),
                exceptSelected: exceptSelected,
                matchIndex: 0,
                round: roundBuilder().withMatch(match).build(),
                matchOptions: {},
            }, account);
            const saygData = saygBuilder()
                .withLeg('0', l => l.startingScore(501))
                .build();
            addSaygLookup.push({
                match: match,
                success: true,
                result: {
                    id: createTemporaryId(),
                    round: {
                        matches: [match]
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
            const saygData = saygBuilder()
                .withLeg('0', l => l.startingScore(501))
                .build();
            const match = tournamentMatchBuilder().sideA(sideA, 1).sideB(sideB, 2).saygId(saygData.id).build();
            await renderComponent({tournamentData: {id: createTemporaryId()}}, {
                readOnly: false,
                match: match,
                hasNextRound: false,
                sideMap: toMap([sideA, sideB]),
                exceptSelected: exceptSelected,
                matchIndex: 0,
                round: roundBuilder().withMatch(match).build(),
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

        it('can delete sayg', async () => {
            const saygData = saygBuilder()
                .withLeg('0', l => l.startingScore(501))
                .build();
            const match = tournamentMatchBuilder().sideA(sideA, 1).sideB(sideB, 2).saygId(saygData.id).build();
            const tournamentId = createTemporaryId();
            const accountWithDebugOptions = Object.assign({}, account);
            accountWithDebugOptions.access = Object.assign({}, account.access);
            accountWithDebugOptions.access.showDebugOptions = true;
            await renderComponent({tournamentData: {id: tournamentId}}, {
                readOnly: false,
                match: match,
                hasNextRound: false,
                sideMap: toMap([sideA, sideB]),
                exceptSelected: exceptSelected,
                matchIndex: 0,
                round: roundBuilder().withMatch(match).build(),
                matchOptions: {},
            }, accountWithDebugOptions);
            saygApiData[saygData.id] = saygData;
            const cells = Array.from(context.container.querySelectorAll('tr td'));
            let confirm;
            window.confirm = (msg) => {
                confirm = msg;
                return true;
            };
            window.alert = () => {};
            await doClick(findButton(cells[0], '📊'));

            await doClick(findButton(cells[0], 'Delete sayg'));

            expect(reportedError).toBeNull();
            const dialog = context.container.querySelector('.modal-dialog');
            expect(dialog).toBeFalsy();
            expect(deletedSayg).toEqual({
                matchId: match.id,
                tournamentId: tournamentId,
            });
            expect(confirm).toEqual('Are you sure you want to delete the sayg data for this match?');
            expect(updatedRound.matches[0].saygId).toBeNull();
        });

        it('does not delete sayg if unconfirmed', async () => {
            const saygData = saygBuilder()
                .withLeg('0', l => l.startingScore(501))
                .build();
            const match = tournamentMatchBuilder().sideA(sideA, 1).sideB(sideB, 2).saygId(saygData.id).build();
            const tournamentId = createTemporaryId();
            const accountWithDebugOptions = Object.assign({}, account);
            accountWithDebugOptions.access = Object.assign({}, account.access);
            accountWithDebugOptions.access.showDebugOptions = true;
            await renderComponent({tournamentData: {id: tournamentId}}, {
                readOnly: false,
                match: match,
                hasNextRound: false,
                sideMap: toMap([sideA, sideB]),
                exceptSelected: exceptSelected,
                matchIndex: 0,
                round: roundBuilder().withMatch(match).build(),
                matchOptions: {},
            }, accountWithDebugOptions);
            saygApiData[saygData.id] = saygData;
            const cells = Array.from(context.container.querySelectorAll('tr td'));
            let confirm;
            window.confirm = (msg) => {
                confirm = msg;
                return false;
            };
            await doClick(findButton(cells[0], '📊'));

            await doClick(findButton(cells[0], 'Delete sayg'));

            expect(reportedError).toBeNull();
            const dialog = context.container.querySelector('.modal-dialog');
            expect(dialog).toBeTruthy();
            expect(deletedSayg).toBeNull();
            expect(confirm).toEqual('Are you sure you want to delete the sayg data for this match?');
        });

        it('handles error when deleting sayg', async () => {
            const saygData = saygBuilder()
                .withLeg('0', l => l.startingScore(501))
                .build();
            const match = tournamentMatchBuilder().sideA(sideA, 1).sideB(sideB, 2).saygId(saygData.id).build();
            const tournamentId = createTemporaryId();
            const accountWithDebugOptions = Object.assign({}, account);
            accountWithDebugOptions.access = Object.assign({}, account.access);
            accountWithDebugOptions.access.showDebugOptions = true;
            await renderComponent({tournamentData: {id: tournamentId}}, {
                readOnly: false,
                match: match,
                hasNextRound: false,
                sideMap: toMap([sideA, sideB]),
                exceptSelected: exceptSelected,
                matchIndex: 0,
                round: roundBuilder().withMatch(match).build(),
                matchOptions: {},
            }, accountWithDebugOptions);
            saygApiData[saygData.id] = saygData;
            const cells = Array.from(context.container.querySelectorAll('tr td'));
            window.confirm = () => true;
            await doClick(findButton(cells[0], '📊'));
            tournamentApiResponse = { success: false, errors: ['ERROR']};

            await doClick(findButton(cells[0], 'Delete sayg'));

            const dialog = context.container.querySelector('.modal-dialog');
            expect(dialog).toBeTruthy();
            expect(deletedSayg).toEqual({
                tournamentId: tournamentId,
                matchId: match.id,
            });
            expect(reportedError).toEqual({
                errors: ['ERROR'],
                success: false,
            });
        });

        it('can set first player for match', async () => {
            const match = tournamentMatchBuilder().sideA(sideA, 0).sideB(sideB, 0).saygId(createTemporaryId()).build();
            await renderComponent({tournamentData: {id: createTemporaryId()}}, {
                readOnly: false,
                match: match,
                hasNextRound: false,
                sideMap: toMap([sideA, sideB]),
                exceptSelected: exceptSelected,
                matchIndex: 0,
                round: roundBuilder().withMatch(match).build(),
                matchOptions: {},
            }, account);
            saygApiData[match.saygId] = saygBuilder(match.saygId)
                .withLeg('0', l => l
                    .startingScore(501)
                    .home(c => c.score(0))
                    .away(c => c.score(0)))
                .yourName('SIDE A')
                .opponentName('SIDE B')
                .build();
            const cells = Array.from(context.container.querySelectorAll('tr td'));
            await doClick(findButton(cells[0], '📊'));
            expect(reportedError).toBeNull();

            const dialog = context.container.querySelector('.modal-dialog');
            await doClick(findButton(dialog, '🎯SIDE A'));

            expect(reportedError).toBeNull();
            expect(updatedSaygData.legs[0].playerSequence).toEqual([
                {text: 'SIDE A', value: 'home'},
                {text: 'SIDE B', value: 'away'},
            ]);
        });

        it('can record sayg 180', async () => {
            const match = tournamentMatchBuilder().sideA(sideA, 0).sideB(sideB, 0).saygId(createTemporaryId()).build();
            await renderComponent({tournamentData: {id: createTemporaryId()}}, {
                readOnly: false,
                match: match,
                hasNextRound: false,
                sideMap: toMap([sideA, sideB]),
                exceptSelected: exceptSelected,
                matchIndex: 0,
                round: roundBuilder().withMatch(match).build(),
                matchOptions: {},
            }, account);
            saygApiData[match.saygId] = saygBuilder(match.saygId)
                .withLeg('0', l => l
                    .playerSequence('home', 'away')
                    .currentThrow('home')
                    .home(c => c.score(0).startingScore(501))
                    .away(c => c.score(0).startingScore(501))
                    .scores(0, 0)
                    .startingScore(501)
                    .numberOfLegs(3))
                .build();
            const cells = Array.from(context.container.querySelectorAll('tr td'));
            await doClick(findButton(cells[0], '📊'));
            expect(reportedError).toBeNull();

            await doChange(context.container.querySelector('.modal-dialog'), 'input[data-score-input="true"]', '180', context.user);
            await doClick(findButton(context.container.querySelector('.modal-dialog'), '📌📌📌'));

            expect(reportedError).toBeNull();
            expect(oneEighties).toEqual([playerSideA]);
        });

        it('cannot record sayg 180 when readonly', async () => {
            const match = tournamentMatchBuilder().sideA(sideA, 0).sideB(sideB, 0).saygId(createTemporaryId()).build();
            await renderComponent({tournamentData: {id: createTemporaryId()}}, {
                readOnly: true,
                match: match,
                hasNextRound: false,
                sideMap: toMap([sideA, sideB]),
                exceptSelected: exceptSelected,
                matchIndex: 0,
                round: roundBuilder().withMatch(match).build(),
                matchOptions: {},
            }, account);
            saygApiData[match.saygId] = saygBuilder(match.saygId)
                .withLeg('0', l => l
                    .playerSequence('home', 'away')
                    .currentThrow('home')
                    .home(c => c.score(0).startingScore(501))
                    .away(c => c.score(0).startingScore(501))
                    .scores(0, 0)
                    .startingScore(501)
                    .numberOfLegs(3))
                .build();
            const cells = Array.from(context.container.querySelectorAll('tr td'));
            await doClick(findButton(cells[0], '📊'));
            expect(reportedError).toBeNull();

            await doChange(context.container.querySelector('.modal-dialog'), 'input[data-score-input="true"]', '180', context.user);
            await doClick(findButton(context.container.querySelector('.modal-dialog'), '📌📌📌'));

            expect(reportedError).toBeNull();
            expect(oneEighties).toEqual([]);
        });

        it('cannot record sayg 180 for multi-player sides', async () => {
            const match = tournamentMatchBuilder().sideA(sideC, 0).sideB(sideD, 0).saygId(createTemporaryId()).build();
            await renderComponent({tournamentData: {id: createTemporaryId()}}, {
                readOnly: false,
                match: match,
                hasNextRound: false,
                sideMap: toMap([sideC, sideD]),
                exceptSelected: exceptSelected,
                matchIndex: 0,
                round: roundBuilder().withMatch(match).build(),
                matchOptions: {},
            }, account);
            saygApiData[match.saygId] = saygBuilder(match.saygId)
                .withLeg('0', l => l
                    .playerSequence('home', 'away')
                    .currentThrow('home')
                    .home(c => c.score(0).startingScore(501))
                    .away(c => c.score(0).startingScore(501))
                    .scores(0, 0)
                    .startingScore(501)
                    .numberOfLegs(3))
                .build();
            const cells = Array.from(context.container.querySelectorAll('tr td'));
            await doClick(findButton(cells[0], '📊'));
            expect(reportedError).toBeNull();

            await doChange(context.container.querySelector('.modal-dialog'), 'input[data-score-input="true"]', '180', context.user);
            await doClick(findButton(context.container.querySelector('.modal-dialog'), '📌📌📌'));

            expect(reportedError).toBeNull();
            expect(oneEighties).toEqual([]);
        });

        it('can record sayg hi-check', async () => {
            const match = tournamentMatchBuilder().sideA(sideA, 0).sideB(sideB, 0).saygId(createTemporaryId()).build();
            await renderComponent({tournamentData: {id: createTemporaryId()}}, {
                readOnly: false,
                match: match,
                hasNextRound: false,
                sideMap: toMap([sideA, sideB]),
                exceptSelected: exceptSelected,
                matchIndex: 0,
                round: roundBuilder().withMatch(match).build(),
                matchOptions: {},
            }, account);
            saygApiData[match.saygId] = saygBuilder(match.saygId)
                .withLeg('0', l => l
                    .playerSequence('away', 'home')
                    .currentThrow('away')
                    .home(c => c.withThrow(0).score(200).startingScore(501))
                    .away(c => c.withThrow(0).score(350).startingScore(501))
                    .scores(200, 350)
                    .startingScore(501)
                    .numberOfLegs(3))
                .build();
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
            const match = tournamentMatchBuilder().sideA(sideA, 0).sideB(sideB, 0).saygId(createTemporaryId()).build();
            await renderComponent({tournamentData: {id: createTemporaryId()}}, {
                readOnly: true,
                match: match,
                hasNextRound: false,
                sideMap: toMap([sideA, sideB]),
                exceptSelected: exceptSelected,
                matchIndex: 0,
                round: roundBuilder().withMatch(match).build(),
                matchOptions: {},
            }, account);
            saygApiData[match.saygId] = saygBuilder(match.saygId)
                .withLeg('0', l => l
                    .playerSequence('away', 'home')
                    .currentThrow('away')
                    .home(c => c.withThrow(0).score(200).startingScore(501))
                    .away(c => c.withThrow(0).score(350).startingScore(501))
                    .scores(200, 350)
                    .startingScore(501)
                    .numberOfLegs(3))
                .build();
            const cells = Array.from(context.container.querySelectorAll('tr td'));
            await doClick(findButton(cells[0], '📊'));
            expect(reportedError).toBeNull();

            await doChange(context.container.querySelector('.modal-dialog'), 'input[data-score-input="true"]', '151', context.user);
            await doClick(findButton(context.container.querySelector('.modal-dialog'), '📌📌📌'));

            expect(reportedError).toBeNull();
            expect(hiChecks).toEqual([]);
        });

        it('cannot record sayg hi-check for multi-player sides', async () => {
            const match = tournamentMatchBuilder().sideA(sideC, 0).sideB(sideD, 0).saygId(createTemporaryId()).build();
            await renderComponent({tournamentData: {id: createTemporaryId()}}, {
                readOnly: false,
                match: match,
                hasNextRound: false,
                sideMap: toMap([sideC, sideD]),
                exceptSelected: exceptSelected,
                matchIndex: 0,
                round: roundBuilder().withMatch(match).build(),
                matchOptions: {},
            }, account);
            saygApiData[match.saygId] = saygBuilder(match.saygId)
                .withLeg('0', l => l
                    .playerSequence('away', 'home')
                    .currentThrow('away')
                    .home(c => c.withThrow(0).score(200).startingScore(501))
                    .away(c => c.withThrow(0).score(350).startingScore(501))
                    .scores(200, 350)
                    .startingScore(501)
                    .numberOfLegs(3))
                .build();
            const cells = Array.from(context.container.querySelectorAll('tr td'));
            await doClick(findButton(cells[0], '📊'));
            expect(reportedError).toBeNull();

            await doChange(context.container.querySelector('.modal-dialog'), 'input[data-score-input="true"]', '151', context.user);
            await doClick(findButton(context.container.querySelector('.modal-dialog'), '📌📌📌'));

            expect(reportedError).toBeNull();
            expect(hiChecks).toEqual([]);
        });

        it('can open match options dialog', async () => {
            const match = tournamentMatchBuilder().sideA(sideA, 1).sideB(sideB, 2).build();
            await renderComponent({tournamentData: {id: createTemporaryId()}}, {
                readOnly: false,
                match: match,
                hasNextRound: false,
                sideMap: toMap([sideA, sideB]),
                exceptSelected: exceptSelected,
                matchIndex: 0,
                round: roundBuilder().withMatch(match).build(),
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
            const match = tournamentMatchBuilder().sideA(sideA, 1).sideB(sideB, 2).build();
            await renderComponent({tournamentData: {id: createTemporaryId()}}, {
                readOnly: false,
                match: match,
                hasNextRound: false,
                sideMap: toMap([sideA, sideB]),
                exceptSelected: exceptSelected,
                matchIndex: 0,
                round: roundBuilder().withMatch(match).build(),
                matchOptions: {},
            }, account);
            const cells = Array.from(context.container.querySelectorAll('tr td'));
            await doClick(findButton(cells[5], '🛠'));
            expect(context.container.querySelector('.modal-dialog')).toBeTruthy();

            await doClick(findButton(context.container.querySelector('.modal-dialog'), 'Close'));

            expect(context.container.querySelector('.modal-dialog')).toBeFalsy();
        });

        it('can change sideA score', async () => {
            const match = tournamentMatchBuilder().sideA(sideA, 1).sideB(sideB, 2).build();
            returnFromExceptSelected['sideA'] = [sideC, sideD];
            returnFromExceptSelected['sideB'] = [sideD, sideE];
            await renderComponent({tournamentData: {id: createTemporaryId()}}, {
                readOnly: false,
                match: match,
                hasNextRound: false,
                sideMap: toMap([sideA, sideB, sideC, sideD, sideE]),
                exceptSelected: exceptSelected,
                matchIndex: 0,
                round: roundBuilder().withMatch(match).build(),
                matchOptions: {},
            }, account);
            const cells = Array.from(context.container.querySelectorAll('tr td'));

            await doChange(cells[1], 'input', '5', context.user);

            expect(reportedError).toBeNull();
            expect(updatedRound).toEqual({
                matches: [Object.assign({}, match, {scoreA: '5'})],
                matchOptions: [],
                nextRound: null,
            });
        });

        it('can clear sideA score', async () => {
            const match = tournamentMatchBuilder().sideA(sideA, 1).sideB(sideB, 2).build();
            returnFromExceptSelected['sideA'] = [sideC, sideD];
            returnFromExceptSelected['sideB'] = [sideD, sideE];
            await renderComponent({tournamentData: {id: createTemporaryId()}}, {
                readOnly: false,
                match: match,
                hasNextRound: false,
                sideMap: toMap([sideA, sideB, sideC, sideD, sideE]),
                exceptSelected: exceptSelected,
                matchIndex: 0,
                round: roundBuilder().withMatch(match).build(),
                matchOptions: {},
            }, account);
            const cells = Array.from(context.container.querySelectorAll('tr td'));

            await doChange(cells[1], 'input', '', context.user);

            expect(reportedError).toBeNull();
            expect(updatedRound).toEqual({
                matches: [Object.assign({}, match, {scoreA: '0'})],
                matchOptions: [],
                nextRound: null,
            });
        });

        it('can change A side', async () => {
            const match = tournamentMatchBuilder().sideA(sideA, 1).sideB(sideB, 2).build();
            returnFromExceptSelected['sideA'] = [sideB, sideD];
            returnFromExceptSelected['sideB'] = [sideA, sideE];
            await renderComponent({tournamentData: {id: createTemporaryId()}}, {
                readOnly: false,
                match: match,
                hasNextRound: false,
                sideMap: toMap([sideA, sideB, sideC, sideD, sideE]),
                exceptSelected: exceptSelected,
                matchIndex: 0,
                round: roundBuilder().withMatch(match).build(),
                matchOptions: {},
            }, account);
            const cells = Array.from(context.container.querySelectorAll('tr td'));

            await doSelectOption(cells[0].querySelector('.dropdown-menu'), 'SIDE C');

            expect(reportedError).toBeNull();
            expect(updatedRound).toEqual({
                matches: [Object.assign({}, match, {sideA: sideC})],
                matchOptions: [],
                nextRound: null,
            });
        });

        it('can change sideB score', async () => {
            const match = tournamentMatchBuilder().sideA(sideA, 1).sideB(sideB, 2).build();
            returnFromExceptSelected['sideA'] = [sideC, sideD];
            returnFromExceptSelected['sideB'] = [sideD, sideE];
            await renderComponent({tournamentData: {id: createTemporaryId()}}, {
                readOnly: false,
                match: match,
                hasNextRound: false,
                sideMap: toMap([sideA, sideB, sideC, sideD, sideE]),
                exceptSelected: exceptSelected,
                matchIndex: 0,
                round: roundBuilder().withMatch(match).build(),
                matchOptions: {},
            }, account);
            const cells = Array.from(context.container.querySelectorAll('tr td'));

            await doChange(cells[3], 'input', '5', context.user);

            expect(reportedError).toBeNull();
            expect(updatedRound).toEqual({
                matches: [Object.assign({}, match, {scoreB: '5'})],
                matchOptions: [],
                nextRound: null,
            });
        });

        it('can clear sideB score', async () => {
            const match = tournamentMatchBuilder().sideA(sideA, 1).sideB(sideB, 2).build();
            returnFromExceptSelected['sideA'] = [sideC, sideD];
            returnFromExceptSelected['sideB'] = [sideD, sideE];
            await renderComponent({tournamentData: {id: createTemporaryId()}}, {
                readOnly: false,
                match: match,
                hasNextRound: false,
                sideMap: toMap([sideA, sideB, sideC, sideD, sideE]),
                exceptSelected: exceptSelected,
                matchIndex: 0,
                round: roundBuilder().withMatch(match).build(),
                matchOptions: {},
            }, account);
            const cells = Array.from(context.container.querySelectorAll('tr td'));

            await doChange(cells[3], 'input', '', context.user);

            expect(reportedError).toBeNull();
            expect(updatedRound).toEqual({
                matches: [Object.assign({}, match, {scoreB: '0'})],
                matchOptions: [],
                nextRound: null,
            });
        });

        it('can change B side', async () => {
            const match = tournamentMatchBuilder().sideA(sideA, 1).sideB(sideB, 2).build();
            returnFromExceptSelected['sideA'] = [sideB, sideD];
            returnFromExceptSelected['sideB'] = [sideA, sideE];
            await renderComponent({tournamentData: {id: createTemporaryId()}}, {
                readOnly: false,
                match: match,
                hasNextRound: false,
                sideMap: toMap([sideA, sideB, sideC, sideD, sideE]),
                exceptSelected: exceptSelected,
                matchIndex: 0,
                round: roundBuilder().withMatch(match).build(),
                matchOptions: {},
            }, account);
            const cells = Array.from(context.container.querySelectorAll('tr td'));

            await doSelectOption(cells[4].querySelector('.dropdown-menu'), 'SIDE C');

            expect(reportedError).toBeNull();
            expect(updatedRound).toEqual({
                matches: [Object.assign({}, match, {sideB: sideC})],
                matchOptions: [],
                nextRound: null,
            });
        });

        it('can remove a match', async () => {
            const match = tournamentMatchBuilder().sideA(sideA, 1).sideB(sideB, 2).build();
            returnFromExceptSelected['sideA'] = [sideB, sideD];
            returnFromExceptSelected['sideB'] = [sideA, sideE];
            await renderComponent({tournamentData: {id: createTemporaryId()}}, {
                readOnly: false,
                match: match,
                hasNextRound: false,
                sideMap: toMap([sideA, sideB, sideC, sideD, sideE]),
                exceptSelected: exceptSelected,
                matchIndex: 0,
                round: roundBuilder().withMatch(match).build(),
                matchOptions: {},
            }, account);
            const cells = Array.from(context.container.querySelectorAll('tr td'));
            let confirm;
            window.confirm = (message) => {
                confirm = message;
                return true;
            };

            await doClick(findButton(cells[5], '🗑'));

            expect(reportedError).toBeNull();
            expect(confirm).toEqual('Are you sure you want to remove this match?');
            expect(updatedRound).toEqual({
                matches: [],
                matchOptions: [],
                nextRound: null,
            });
        });

        it('does not remove a match', async () => {
            const match = tournamentMatchBuilder().sideA(sideA, 1).sideB(sideB, 2).build();
            returnFromExceptSelected['sideA'] = [sideB, sideD];
            returnFromExceptSelected['sideB'] = [sideA, sideE];
            await renderComponent({tournamentData: {id: createTemporaryId()}}, {
                readOnly: false,
                match: match,
                hasNextRound: false,
                sideMap: toMap([sideA, sideB, sideC, sideD, sideE]),
                exceptSelected: exceptSelected,
                matchIndex: 0,
                round: roundBuilder().withMatch(match).build(),
                matchOptions: {},
            }, account);
            const cells = Array.from(context.container.querySelectorAll('tr td'));
            let confirm;
            window.confirm = (message) => {
                confirm = message;
                return false;
            };

            await doClick(findButton(cells[5], '🗑'));

            expect(reportedError).toBeNull();
            expect(confirm).toEqual('Are you sure you want to remove this match?');
            expect(updatedRound).toBeNull();
        });
    });
});