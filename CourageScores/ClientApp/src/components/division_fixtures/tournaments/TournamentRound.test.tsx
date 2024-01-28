import {
    api,
    appProps,
    brandingProps,
    cleanUp,
    doChange,
    doClick,
    doSelectOption, ErrorState,
    findButton,
    iocProps,
    renderApp, TestContext
} from "../../../helpers/tests";
import React from "react";
import {ITournamentRoundProps, TournamentRound} from "./TournamentRound";
import {ITournamentContainerProps, TournamentContainer} from "./TournamentContainer";
import {ITournamentApi} from "../../../api/tournament";
import {ISaygApi} from "../../../api/sayg";
import {IUpdateRecordedScoreAsYouGoDto} from "../../../interfaces/serverSide/Game/Sayg/IUpdateRecordedScoreAsYouGoDto";
import {IClientActionResultDto} from "../../../interfaces/IClientActionResultDto";
import {IRecordedScoreAsYouGoDto} from "../../../interfaces/serverSide/Game/Sayg/IRecordedScoreAsYouGoDto";
import {IUserDto} from "../../../interfaces/serverSide/Identity/IUserDto";
import {ITournamentSideDto} from "../../../interfaces/serverSide/Game/ITournamentSideDto";
import {ITournamentGameDto} from "../../../interfaces/serverSide/Game/ITournamentGameDto";
import {ITournamentPlayerDto} from "../../../interfaces/serverSide/Game/ITournamentPlayerDto";
import {IPatchTournamentDto} from "../../../interfaces/serverSide/Game/IPatchTournamentDto";
import {IPatchTournamentRoundDto} from "../../../interfaces/serverSide/Game/IPatchTournamentRoundDto";
import {ITournamentRoundDto} from "../../../interfaces/serverSide/Game/ITournamentRoundDto";
import {
    ITournamentMatchBuilder, ITournamentRoundBuilder,
    roundBuilder,
    sideBuilder,
    tournamentBuilder, tournamentMatchBuilder
} from "../../../helpers/builders/tournaments";
import {IMatchOptionsBuilder} from "../../../helpers/builders/games";
import {ILegBuilder, ILegCompetitorScoreBuilder, saygBuilder} from "../../../helpers/builders/sayg";
import {createTemporaryId} from "../../../helpers/projection";

describe('TournamentRound', () => {
    let context: TestContext;
    let reportedError: ErrorState;
    let oneEighty: ITournamentPlayerDto;
    let hiCheck: {player: ITournamentPlayerDto, note: number};
    let updatedRound: ITournamentRoundDto;
    let warnBeforeSave: string;
    let patchedData: { patch: IPatchTournamentDto | IPatchTournamentRoundDto, nestInRound?: boolean };
    let saygApiData: { [id: string]: IRecordedScoreAsYouGoDto };
    const tournamentApi = api<ITournamentApi>({
        addSayg: async () => {
            return {
                success: true,
                result: { /* tournament data */}
            };
        }
    });
    const saygApi = api<ISaygApi>({
        get: async (id: string) => {
            return saygApiData[id];
        },
        upsert: async (data: IUpdateRecordedScoreAsYouGoDto): Promise<IClientActionResultDto<IRecordedScoreAsYouGoDto>> => {
            const result: IUpdateRecordedScoreAsYouGoDto = Object.assign({}, data);
            if (!result.id) {
                result.id = createTemporaryId();
            }

            return {
                success: true,
                result: result as IRecordedScoreAsYouGoDto,
            };
        },
    });

    afterEach(() => {
        cleanUp(context);
    });

    beforeEach(() => {
        reportedError = new ErrorState();
        oneEighty = null;
        hiCheck = null;
        saygApiData = {};
        updatedRound = null;
        warnBeforeSave = null;
        patchedData = null;
    });

    async function onChange(newRound: ITournamentRoundDto) {
        updatedRound = newRound;
    }

    async function onHiCheck(player: ITournamentPlayerDto, score: number) {
        hiCheck = {player, note: score};
    }

    async function on180(player: ITournamentPlayerDto) {
        oneEighty = player
    }

    async function setTournamentData() {
    }

    async function patchData(patch: IPatchTournamentDto | IPatchTournamentRoundDto, nestInRound?: boolean) {
        patchedData = { patch, nestInRound }
    }

    async function setWarnBeforeSave(msg: string) {
        warnBeforeSave = msg;
    }

    async function saveTournament() {
        return null;
    }

    async function renderComponent(containerProps: ITournamentContainerProps, props: ITournamentRoundProps, account?: IUserDto) {
        context = await renderApp(
            iocProps({tournamentApi, saygApi}),
            brandingProps(),
            appProps({
                account
            }, reportedError),
            (<TournamentContainer {...containerProps} >
                <TournamentRound {...props} />
            </TournamentContainer>));
    }

    function assertMatch(table: Element, ordinal: number, expectedText: string[]) {
        const matchRow = table.querySelector(`tr:nth-child(${ordinal})`);
        const cells = Array.from(matchRow.querySelectorAll('td'));
        expect(cells.map(td => td.textContent)).toEqual(expectedText);
    }

    function assertEditableMatch(table: Element, ordinal: number, expectedText: string[]) {
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
        const side1: ITournamentSideDto = sideBuilder('SIDE 1').build();
        const side2: ITournamentSideDto = sideBuilder('SIDE 2').build();
        const side3: ITournamentSideDto = sideBuilder('SIDE 3').build();
        const side4: ITournamentSideDto = sideBuilder('SIDE 4').build();
        const readOnly: boolean = true;
        const emptyTournamentGame: ITournamentGameDto = tournamentBuilder().build();
        const defaultTournamentContainerProps: ITournamentContainerProps = {
            tournamentData: emptyTournamentGame,
            setTournamentData,
            setWarnBeforeSave,
            saveTournament,
        };

        describe('renders', () => {
            it('when no matches', async () => {
                await renderComponent(defaultTournamentContainerProps, {
                    round: roundBuilder().build(),
                    sides: [],
                    readOnly,
                    depth: 1,
                    onChange,
                    on180,
                    patchData,
                    onHiCheck,
                });

                expect(reportedError.hasError()).toEqual(false);
                expect(context.container.textContent).toContain('No matches defined');
            });

            it('unplayed round', async () => {
                await renderComponent(defaultTournamentContainerProps, {
                    round: roundBuilder()
                        .withMatch((m: ITournamentMatchBuilder) => m.sideA(side1).sideB(side2))
                        .withMatchOption((o: IMatchOptionsBuilder) => o.startingScore(601).numberOfLegs(7))
                        .build(),
                    sides: [side1, side2, side3, side4],
                    readOnly,
                    depth: 1,
                    onChange,
                    on180,
                    patchData,
                    onHiCheck,
                });

                expect(reportedError.hasError()).toEqual(false);
                expect(context.container.querySelector('div > strong').textContent).toEqual('Semi-Final');
                const table = context.container.querySelector('table');
                assertMatch(table, 1, ['SIDE 1', '', 'vs', '', 'SIDE 2']);
            });

            it('played round', async () => {
                await renderComponent(defaultTournamentContainerProps, {
                    round: roundBuilder()
                        .withMatch((m: ITournamentMatchBuilder) => m.sideA(side1, 1).sideB(side2, 2))
                        .withMatch((m: ITournamentMatchBuilder) => m.sideA(side3, 2).sideB(side4, 1))
                        .withMatchOption((o: IMatchOptionsBuilder) => o.startingScore(601).numberOfLegs(7))
                        .build(),
                    sides: [side1, side2, side3, side4],
                    readOnly,
                    depth: 1,
                    onChange,
                    on180,
                    patchData,
                    onHiCheck,
                });

                expect(reportedError.hasError()).toEqual(false);
                expect(context.container.querySelector('div > strong').textContent).toEqual('Semi-Final');
                const table = context.container.querySelector('table');
                assertMatch(table, 1, ['SIDE 1', '1', 'vs', '2', 'SIDE 2']);
                assertMatch(table, 2, ['SIDE 3', '2', 'vs', '1', 'SIDE 4']);
            });

            it('next round (when all sides have a score)', async () => {
                await renderComponent(defaultTournamentContainerProps, {
                    allowNextRound: true,
                    round: roundBuilder()
                        .withMatch((m: ITournamentMatchBuilder) => m.sideA(side1, 1).sideB(side2, 2))
                        .withMatch((m: ITournamentMatchBuilder) => m.sideA(side3, 2).sideB(side4, 1))
                        .withMatchOption((o: IMatchOptionsBuilder) => o.startingScore(601).numberOfLegs(7))
                        .round((r: ITournamentRoundBuilder) => r
                            .withMatch((m: ITournamentMatchBuilder) => m.sideA(side2).sideB(side3))
                            .withMatchOption((o: IMatchOptionsBuilder) => o.startingScore(601).numberOfLegs(7))
                        )
                        .build(),
                    sides: [side1, side2, side3, side4],
                    readOnly,
                    depth: 1,
                    onChange,
                    on180,
                    patchData,
                    onHiCheck,
                });

                expect(reportedError.hasError()).toEqual(false);
                expect(context.container.querySelector('div > strong').textContent).toEqual('Semi-Final');
                const roundTables = context.container.querySelectorAll('table');
                assertMatch(roundTables[0], 1, ['SIDE 1', '1', 'vs', '2', 'SIDE 2']);
                assertMatch(roundTables[0], 2, ['SIDE 3', '2', 'vs', '1', 'SIDE 4']);
                assertMatch(roundTables[1], 1, ['SIDE 2', '', 'vs', '', 'SIDE 3']);
            });
        });

        it('final round (when all sides have a score)', async () => {
            const side5: ITournamentSideDto = sideBuilder('SIDE 5').build();
            const side6: ITournamentSideDto = sideBuilder('SIDE 6').build();
            const side7: ITournamentSideDto = sideBuilder('SIDE 7').build();
            const side8: ITournamentSideDto = sideBuilder('SIDE 8').build();

            await renderComponent(defaultTournamentContainerProps, {
                allowNextRound: true,
                round: roundBuilder()
                    .withMatch((m: ITournamentMatchBuilder) => m.sideA(side1, 1).sideB(side2, 2))
                    .withMatch((m: ITournamentMatchBuilder) => m.sideA(side3, 2).sideB(side4, 1))
                    .withMatch((m: ITournamentMatchBuilder) => m.sideA(side5, 2).sideB(side6, 1))
                    .withMatch((m: ITournamentMatchBuilder) => m.sideA(side7, 2).sideB(side8, 1))
                    .withMatchOption((o: IMatchOptionsBuilder) => o.startingScore(601).numberOfLegs(3))
                    .withMatchOption((o: IMatchOptionsBuilder) => o.startingScore(601).numberOfLegs(3))
                    .withMatchOption((o: IMatchOptionsBuilder) => o.startingScore(601).numberOfLegs(3))
                    .withMatchOption((o: IMatchOptionsBuilder) => o.startingScore(601).numberOfLegs(3))
                    .round((r: ITournamentRoundBuilder) => r
                        .withMatch((m: ITournamentMatchBuilder) => m.sideA(side2, 2).sideB(side3, 1))
                        .withMatch((m: ITournamentMatchBuilder) => m.sideA(side5, 1).sideB(side7, 2))
                        .withMatchOption((o: IMatchOptionsBuilder) => o.startingScore(601).numberOfLegs(3))
                        .withMatchOption((o: IMatchOptionsBuilder) => o.startingScore(601).numberOfLegs(3)))
                    .build(),
                sides: [side1, side2, side3, side4, side5, side6, side7, side8],
                readOnly,
                depth: 1,
                onChange,
                on180,
                patchData,
                onHiCheck,
            });

            expect(reportedError.hasError()).toEqual(false);
            expect(Array.from(context.container.querySelectorAll('div > strong')).map(s => s.textContent)).toEqual(['Quarter-Final', 'Semi-Final']);
            const roundTables = context.container.querySelectorAll('table');
            assertMatch(roundTables[0], 1, ['SIDE 1', '1', 'vs', '2', 'SIDE 2']);
            assertMatch(roundTables[0], 2, ['SIDE 3', '2', 'vs', '1', 'SIDE 4']);
            assertMatch(roundTables[0], 3, ['SIDE 5', '2', 'vs', '1', 'SIDE 6']);
            assertMatch(roundTables[0], 4, ['SIDE 7', '2', 'vs', '1', 'SIDE 8']);
            assertMatch(roundTables[1], 1, ['SIDE 2', '2', 'vs', '1', 'SIDE 3']);
            assertMatch(roundTables[1], 2, ['SIDE 5', '1', 'vs', '2', 'SIDE 7']);
        });

        it('no next round (when single round)', async () => {
            await renderComponent(defaultTournamentContainerProps, {
                round: roundBuilder()
                    .withMatch((m: ITournamentMatchBuilder) => m.sideA(side1, 1).sideB(side2, 2))
                    .withMatch((m: ITournamentMatchBuilder) => m.sideA(side3, 2).sideB(side4, 1))
                    .withMatchOption((o: IMatchOptionsBuilder) => o.startingScore(601).numberOfLegs(7))
                    .round((r: ITournamentRoundBuilder) => r
                        .withMatch((m: ITournamentMatchBuilder) => m.sideA(side2).sideB(side3))
                        .withMatchOption((o: IMatchOptionsBuilder) => o.startingScore(601).numberOfLegs(7)))
                    .build(),
                sides: [side1, side2, side3, side4],
                readOnly,
                depth: 1,
                onChange,
                on180,
                patchData,
                onHiCheck,
            });

            expect(reportedError.hasError()).toEqual(false);
            expect(context.container.querySelector('div > strong').textContent).toEqual('Semi-Final');
            const roundTables = context.container.querySelectorAll('table');
            expect(roundTables.length).toEqual(1);
        });

        it('cannot change round name', async () => {
            const match = tournamentMatchBuilder().sideA(side1).sideB(side2).build();
            await renderComponent(defaultTournamentContainerProps, {
                round: roundBuilder().withMatch(match).build(),
                sides: [side1, side2, side3, side4],
                readOnly,
                depth: 1,
                onChange,
                on180,
                patchData,
                onHiCheck,
            });
            expect(reportedError.hasError()).toEqual(false);

            await doClick(context.container.querySelector('strong'));

            expect(context.container.querySelector('input')).toBeFalsy();
        });
    });

    describe('when logged in', () => {
        const side1: ITournamentSideDto = sideBuilder('SIDE 1').withPlayer('PLAYER').build();
        const side2: ITournamentSideDto = sideBuilder('SIDE 2').withPlayer('PLAYER').build();
        const side3: ITournamentSideDto = sideBuilder('SIDE 3').build();
        const side4: ITournamentSideDto = sideBuilder('SIDE 4').build();
        const readOnly: boolean = false;
        const emptyTournamentGame: ITournamentGameDto = tournamentBuilder().build();
        const defaultTournamentContainerProps: ITournamentContainerProps = {
            tournamentData: emptyTournamentGame,
            setTournamentData: setTournamentData,
            setWarnBeforeSave,
            saveTournament,
        }

        describe('renders', () => {
            it('when no matches', async () => {
                await renderComponent(defaultTournamentContainerProps, {
                    round: roundBuilder().build(),
                    sides: [side1, side2],
                    readOnly,
                    depth: 1,
                    onChange,
                    on180,
                    patchData,
                    onHiCheck,
                });

                expect(reportedError.hasError()).toEqual(false);
                expect(context.container.querySelector('table')).toBeTruthy();
            });

            it('unplayed round', async () => {
                await renderComponent(defaultTournamentContainerProps, {
                    round: roundBuilder()
                        .withMatch((m: ITournamentMatchBuilder) => m.sideA(side1).sideB(side2))
                        .withMatchOption((o: IMatchOptionsBuilder) => o.startingScore(601).numberOfLegs(7))
                        .build(),
                    sides: [side1, side2, side3, side4],
                    readOnly,
                    depth: 1,
                    onChange,
                    on180,
                    patchData,
                    onHiCheck,
                });

                expect(reportedError.hasError()).toEqual(false);
                expect(context.container.querySelector('div > strong').textContent).toEqual('Semi-Final');
                const table = context.container.querySelector('table');
                assertEditableMatch(table, 1, ['SIDE 1', '', 'vs', '', 'SIDE 2', '🗑🛠']);
            });

            it('played round', async () => {
                await renderComponent(
                    {
                        tournamentData: emptyTournamentGame,
                        matchOptionDefaults: {numberOfLegs: 3},
                        setTournamentData,
                    },
                    {
                        round: roundBuilder()
                            .withMatch((m: ITournamentMatchBuilder) => m.sideA(side1, 1).sideB(side2, 2))
                            .withMatch((m: ITournamentMatchBuilder) => m.sideA(side3, 2).sideB(side4, 1))
                            .withMatchOption((o: IMatchOptionsBuilder) => o.startingScore(601).numberOfLegs(7))
                            .build(),
                        sides: [side1, side2, side3, side4],
                        readOnly,
                        depth: 1,
                        onChange,
                        on180,
                        patchData,
                        onHiCheck,
                    });

                expect(reportedError.hasError()).toEqual(false);
                expect(context.container.querySelector('div > strong').textContent).toEqual('Semi-Final');
                const table = context.container.querySelector('table');
                assertEditableMatch(table, 1, ['SIDE 1', '1', 'vs', '2', 'SIDE 2', '🗑🛠']);
                assertEditableMatch(table, 2, ['SIDE 3', '2', 'vs', '1', 'SIDE 4', '🗑🛠']);
            });

            it('next round (when all sides have a score)', async () => {
                await renderComponent(defaultTournamentContainerProps, {
                    allowNextRound: true,
                    round: roundBuilder()
                        .withMatch((m: ITournamentMatchBuilder) => m.sideA(side1, 1).sideB(side2, 2))
                        .withMatch((m: ITournamentMatchBuilder) => m.sideA(side3, 2).sideB(side4, 1))
                        .withMatchOption((o: IMatchOptionsBuilder) => o.startingScore(601).numberOfLegs(3))
                        .withMatchOption((o: IMatchOptionsBuilder) => o.startingScore(601).numberOfLegs(3))
                        .round((r: ITournamentRoundBuilder) => r
                            .withMatch((m: ITournamentMatchBuilder) => m.sideA(side2).sideB(side3))
                            .withMatchOption((o: IMatchOptionsBuilder) => o.startingScore(601).numberOfLegs(7)))
                        .build(),
                    sides: [side1, side2, side3, side4],
                    readOnly,
                    depth: 1,
                    onChange,
                    on180,
                    patchData,
                    onHiCheck,
                });

                expect(reportedError.hasError()).toEqual(false);
                expect(context.container.querySelector('div > strong').textContent).toEqual('Semi-Final');
                const roundTables = context.container.querySelectorAll('table');
                assertEditableMatch(roundTables[0], 1, ['SIDE 1', '1', 'vs', '2', 'SIDE 2']);
                assertEditableMatch(roundTables[0], 2, ['SIDE 3', '2', 'vs', '1', 'SIDE 4']);
                expect(context.container.querySelector('div > table+div > strong').textContent).toEqual('Final');
                assertEditableMatch(roundTables[1], 1, ['SIDE 2', '', 'vs', '', 'SIDE 3', '🗑🛠']);
            });

            it('final round (when all sides have a score)', async () => {
                const side5 = sideBuilder('SIDE 5').build();
                const side6 = sideBuilder('SIDE 6').build();
                const side7 = sideBuilder('SIDE 7').build();
                const side8 = sideBuilder('SIDE 8').build();

                await renderComponent(
                    {
                        tournamentData: emptyTournamentGame,
                        matchOptionDefaults: {numberOfLegs: 3},
                        setTournamentData,
                    },
                    {
                        allowNextRound: true,
                        round: roundBuilder()
                            .withMatch((m: ITournamentMatchBuilder) => m.sideA(side1, 1).sideB(side2, 2))
                            .withMatch((m: ITournamentMatchBuilder) => m.sideA(side3, 2).sideB(side4, 1))
                            .withMatch((m: ITournamentMatchBuilder) => m.sideA(side5, 2).sideB(side6, 1))
                            .withMatch((m: ITournamentMatchBuilder) => m.sideA(side7, 2).sideB(side8, 1))
                            .withMatchOption((o: IMatchOptionsBuilder) => o.startingScore(601).numberOfLegs(3))
                            .withMatchOption((o: IMatchOptionsBuilder) => o.startingScore(601).numberOfLegs(3))
                            .withMatchOption((o: IMatchOptionsBuilder) => o.startingScore(601).numberOfLegs(3))
                            .withMatchOption((o: IMatchOptionsBuilder) => o.startingScore(601).numberOfLegs(3))
                            .round((r: ITournamentRoundBuilder) => r
                                .withMatch((m: ITournamentMatchBuilder) => m.sideA(side2, 2).sideB(side3, 1))
                                .withMatch((m: ITournamentMatchBuilder) => m.sideA(side5, 1).sideB(side7, 2))
                                .withMatchOption((o: IMatchOptionsBuilder) => o.startingScore(601).numberOfLegs(3))
                                .withMatchOption((o: IMatchOptionsBuilder) => o.startingScore(601).numberOfLegs(3)))
                            .build(),
                        sides: [side1, side2, side3, side4, side5, side6, side7, side8],
                        readOnly,
                        depth: 1,
                        onChange,
                        on180,
                        patchData,
                        onHiCheck,
                    });

                expect(reportedError.hasError()).toEqual(false);
                expect(Array.from(context.container.querySelectorAll('div > strong')).map(s => s.textContent)).toEqual(['Quarter-Final', 'Semi-Final', 'Final']);
                const roundTables = context.container.querySelectorAll('table');
                assertMatch(roundTables[0], 1, ['SIDE 1', '1', 'vs', '2', 'SIDE 2']);
                assertMatch(roundTables[0], 2, ['SIDE 3', '2', 'vs', '1', 'SIDE 4']);
                assertMatch(roundTables[0], 3, ['SIDE 5', '2', 'vs', '1', 'SIDE 6']);
                assertMatch(roundTables[0], 4, ['SIDE 7', '2', 'vs', '1', 'SIDE 8']);
                assertEditableMatch(roundTables[1], 1, ['SIDE 2', '2', 'vs', '1', 'SIDE 3', '🗑🛠']);
                assertEditableMatch(roundTables[1], 2, ['SIDE 5', '1', 'vs', '2', 'SIDE 7', '🗑🛠']);
                assertEditableMatch(roundTables[2], 1, ['', '', 'vs', '', '', '➕']); // can add a match to the final round
            });

            it('no next round (when single round)', async () => {
                await renderComponent(defaultTournamentContainerProps, {
                    round: roundBuilder()
                        .withMatch((m: ITournamentMatchBuilder) => m.sideA(side1, 1).sideB(side2, 2))
                        .withMatch((m: ITournamentMatchBuilder) => m.sideA(side3, 2).sideB(side4, 1))
                        .withMatchOption((o: IMatchOptionsBuilder) => o.startingScore(601).numberOfLegs(7))
                        .round((r: ITournamentRoundBuilder) => r
                            .withMatch((m: ITournamentMatchBuilder) => m.sideA(side2).sideB(side3))
                            .withMatchOption((o: IMatchOptionsBuilder) => o.startingScore(601).numberOfLegs(7)))
                        .build(),
                    sides: [side1, side2, side3, side4],
                    readOnly,
                    depth: 1,
                    onChange,
                    on180,
                    patchData,
                    onHiCheck,
                });

                expect(reportedError.hasError()).toEqual(false);
                expect(context.container.querySelector('div > strong').textContent).toEqual('Semi-Final');
                const roundTables = context.container.querySelectorAll('table');
                expect(roundTables.length).toEqual(1);
            });
        });

        describe('interactivity', () => {
            it('can delete match', async () => {
                await renderComponent(
                    {
                        tournamentData: emptyTournamentGame,
                        matchOptionDefaults: {numberOfLegs: 3},
                        setTournamentData,
                        setWarnBeforeSave,
                    },
                    {
                        round: roundBuilder()
                            .withMatch((m: ITournamentMatchBuilder) => m.sideA(side1).sideB(side2))
                            .build(),
                        sides: [side1, side2, side3, side4],
                        readOnly,
                        depth: 1,
                        onChange,
                        on180,
                        patchData,
                        onHiCheck,
                    });
                expect(reportedError.hasError()).toEqual(false);
                const matchRow = context.container.querySelector('table tr:nth-child(1)');
                window.confirm = () => true;

                await doClick(findButton(matchRow, '🗑'));

                expect(reportedError.hasError()).toEqual(false);
                expect(updatedRound).toEqual({
                    matches: [],
                    matchOptions: [],
                    nextRound: null,
                });
            });

            it('can change sideA score', async () => {
                const match = tournamentMatchBuilder().sideA(side1).sideB(side2).build();
                await renderComponent(
                    {
                        tournamentData: emptyTournamentGame,
                        matchOptionDefaults: {numberOfLegs: 3},
                        setTournamentData,
                        setWarnBeforeSave,
                    },
                    {
                        round: roundBuilder().withMatch(match).build(),
                        sides: [side1, side2, side3, side4],
                        readOnly,
                        depth: 1,
                        onChange,
                        on180,
                        patchData,
                        onHiCheck,
                    });
                expect(reportedError.hasError()).toEqual(false);
                const matchRow = context.container.querySelector('table tr:nth-child(1)');
                const sideAScore = matchRow.querySelector('td:nth-child(2)');

                await doChange(sideAScore, 'input', '2', context.user);

                expect(reportedError.hasError()).toEqual(false);
                expect(updatedRound).toEqual({
                    matches: [{
                        id: match.id,
                        scoreA: 2,
                        scoreB: null,
                        sideA: side1,
                        sideB: side2,
                    }],
                    matchOptions: [],
                    nextRound: null,
                });
            });

            it('can change sideB score', async () => {
                const match = tournamentMatchBuilder().sideA(side1).sideB(side2).build();
                await renderComponent(
                    {
                        tournamentData: emptyTournamentGame,
                        matchOptionDefaults: {numberOfLegs: 3},
                        setTournamentData,
                        setWarnBeforeSave,
                    },
                    {
                        round: roundBuilder().withMatch(match).build(),
                        sides: [side1, side2, side3, side4],
                        readOnly,
                        depth: 1,
                        onChange,
                        on180,
                        patchData,
                        onHiCheck,
                    });
                expect(reportedError.hasError()).toEqual(false);
                const matchRow = context.container.querySelector('table tr:nth-child(1)');
                const sideBScore = matchRow.querySelector('td:nth-child(4)');

                await doChange(sideBScore, 'input', '2', context.user);

                expect(reportedError.hasError()).toEqual(false);
                expect(updatedRound).toEqual({
                    matches: [{
                        id: match.id,
                        scoreA: null,
                        scoreB: 2,
                        sideA: side1,
                        sideB: side2,
                    }],
                    matchOptions: [],
                    nextRound: null,
                });
            });

            it('can change match options', async () => {
                const match = tournamentMatchBuilder().sideA(side1).sideB(side2).build();
                await renderComponent(
                    {
                        tournamentData: emptyTournamentGame,
                        matchOptionDefaults: {numberOfLegs: 5, startingScore: 501},
                        setTournamentData,
                        setWarnBeforeSave,
                    },
                    {
                        round: roundBuilder().withMatch(match).build(),
                        sides: [side1, side2, side3, side4],
                        readOnly,
                        depth: 1,
                        onChange,
                        on180,
                        patchData,
                        onHiCheck,
                    });
                expect(reportedError.hasError()).toEqual(false);
                const matchRow = context.container.querySelector('table tr:nth-child(1)');

                await doClick(findButton(matchRow, '🛠'));
                const matchOptionsDialog = context.container.querySelector('.modal-dialog');
                expect(matchOptionsDialog).toBeTruthy();
                await doChange(matchOptionsDialog, 'input[name="startingScore"]', '123', context.user);
                await doClick(findButton(matchOptionsDialog, 'Close'));
                expect(context.container.querySelector('.modal-dialog')).toBeFalsy();
                expect(reportedError.hasError()).toEqual(false);
                expect(updatedRound).not.toBeNull();
                expect(updatedRound.matchOptions).toEqual([{
                    startingScore: 123,
                    numberOfLegs: 5,
                }]);
            });

            it('cannot open sayg when not permitted', async () => {
                const match = tournamentMatchBuilder().sideA(side1).sideB(side2).build();
                const permittedAccount: IUserDto = {
                    name: '',
                    givenName: '',
                    emailAddress: '',
                    access: {
                        recordScoresAsYouGo: false,
                    }
                };
                await renderComponent(
                    {
                        tournamentData: emptyTournamentGame,
                        matchOptionDefaults: {numberOfLegs: 3},
                        setTournamentData,
                        setWarnBeforeSave,
                    },
                    {
                        round: roundBuilder().withMatch(match).build(),
                        sides: [side1, side2, side3, side4],
                        readOnly,
                        depth: 1,
                        onChange,
                        on180,
                        patchData,
                        onHiCheck,
                    },
                    permittedAccount);
                expect(reportedError.hasError()).toEqual(false);
                const matchRow = context.container.querySelector('table tr:nth-child(1)');

                expect(matchRow.textContent).not.toContain('📊');
            });

            it('can change open sayg', async () => {
                const match = tournamentMatchBuilder().sideA(side1).sideB(side2).build();
                const permittedAccount: IUserDto = {
                    name: '',
                    emailAddress: '',
                    givenName: '',
                    access: {
                        recordScoresAsYouGo: true,
                    }
                };
                await renderComponent(
                    {
                        tournamentData: emptyTournamentGame,
                        matchOptionDefaults: {numberOfLegs: 3},
                        setTournamentData,
                        setWarnBeforeSave,
                        saveTournament,
                    },
                    {
                        round: roundBuilder().withMatch(match).build(),
                        sides: [side1, side2, side3, side4],
                        readOnly,
                        depth: 1,
                        onChange,
                        on180,
                        patchData,
                        onHiCheck,
                    },
                    permittedAccount);
                expect(reportedError.hasError()).toEqual(false);
                const matchRow = context.container.querySelector('table tr:nth-child(1)');

                await doClick(findButton(matchRow, '📊'));
                expect(reportedError.hasError()).toEqual(false);
                const saygDialog = context.container.querySelector('.modal-dialog');
                expect(saygDialog).toBeTruthy();
            });

            it('can change sideA', async () => {
                const match = tournamentMatchBuilder().sideA(side1).sideB(side2).build();
                await renderComponent(
                    {
                        tournamentData: emptyTournamentGame,
                        matchOptionDefaults: {numberOfLegs: 3},
                        setTournamentData,
                        setWarnBeforeSave,
                    },
                    {
                        round: roundBuilder().withMatch(match).build(),
                        sides: [side1, side2, side3, side4],
                        readOnly,
                        depth: 1,
                        onChange,
                        on180,
                        patchData,
                        onHiCheck,
                    });
                expect(reportedError.hasError()).toEqual(false);
                const matchRow = context.container.querySelector('table tr:nth-child(1)');
                const sideA = matchRow.querySelector('td:nth-child(1)');

                await doSelectOption(sideA.querySelector('.dropdown-menu'), 'SIDE 3');

                expect(reportedError.hasError()).toEqual(false);
                expect(updatedRound).toEqual({
                    matches: [{
                        id: match.id,
                        scoreA: null,
                        scoreB: null,
                        sideA: side3,
                        sideB: side2,
                    }],
                    matchOptions: [],
                    nextRound: null,
                });
            });

            it('can change sideB', async () => {
                const match = tournamentMatchBuilder().sideA(side1).sideB(side2).build();
                await renderComponent(
                    {
                        tournamentData: emptyTournamentGame,
                        matchOptionDefaults: {numberOfLegs: 3},
                        setTournamentData,
                        setWarnBeforeSave,
                    },
                    {
                        round: roundBuilder().withMatch(match).build(),
                        sides: [side1, side2, side3, side4],
                        readOnly,
                        depth: 1,
                        onChange,
                        on180,
                        patchData,
                        onHiCheck,
                    });
                expect(reportedError.hasError()).toEqual(false);
                const matchRow = context.container.querySelector('table tr:nth-child(1)');
                const sideB = matchRow.querySelector('td:nth-child(5)');

                await doSelectOption(sideB.querySelector('.dropdown-menu'), 'SIDE 3');

                expect(reportedError.hasError()).toEqual(false);
                expect(updatedRound).toEqual({
                    matches: [{
                        id: match.id,
                        scoreA: null,
                        scoreB: null,
                        sideA: side1,
                        sideB: side3,
                    }],
                    matchOptions: [],
                    nextRound: null,
                });
            });

            it('cannot add match with only sideA', async () => {
                await renderComponent(defaultTournamentContainerProps, {
                    round: roundBuilder().build(),
                    sides: [side1, side2, side3, side4],
                    readOnly,
                    depth: 1,
                    onChange,
                    on180,
                    patchData,
                    onHiCheck,
                });
                expect(reportedError.hasError()).toEqual(false);
                const matchRow = context.container.querySelector('table tr:nth-child(1)');
                let message: string;
                window.alert = (msg) => message = msg;

                await doSelectOption(matchRow.querySelector('td:nth-child(1) .dropdown-menu'), 'SIDE 1');
                await doClick(findButton(matchRow, '➕'));

                expect(updatedRound).toBeFalsy();
                expect(message).toEqual('Select the sides first');
            });

            it('cannot add match with only sideB', async () => {
                await renderComponent(defaultTournamentContainerProps, {
                    round: roundBuilder().build(),
                    sides: [side1, side2, side3, side4],
                    readOnly,
                    depth: 1,
                    onChange,
                    on180,
                    patchData,
                    onHiCheck,
                });
                expect(reportedError.hasError()).toEqual(false);
                const matchRow = context.container.querySelector('table tr:nth-child(1)');
                let message: string;
                window.alert = (msg) => message = msg;

                await doSelectOption(matchRow.querySelector('td:nth-child(1) .dropdown-menu'), 'SIDE 1');
                await doClick(findButton(matchRow, '➕'));

                expect(updatedRound).toBeFalsy();
                expect(message).toEqual('Select the sides first');
            });

            it('can add match', async () => {
                await renderComponent(
                    {
                        tournamentData: tournamentBuilder().bestOf(3).build(),
                        matchOptionDefaults: {numberOfLegs: 3, startingScore: 501},
                        setTournamentData,
                        setWarnBeforeSave,
                    },
                    {
                        round: roundBuilder().build(),
                        sides: [side1, side2, side3, side4],
                        readOnly,
                        depth: 1,
                        onChange,
                        on180,
                        patchData,
                        onHiCheck,
                    });
                expect(reportedError.hasError()).toEqual(false);
                const matchRow = context.container.querySelector('table tr:nth-child(1)');

                await doSelectOption(matchRow.querySelector('td:nth-child(1) .dropdown-menu'), 'SIDE 1');
                await doSelectOption(matchRow.querySelector('td:nth-child(5) .dropdown-menu'), 'SIDE 2');
                await doClick(findButton(matchRow, '➕'));

                expect(updatedRound).not.toBeNull();
                expect(updatedRound.matches).toEqual([{
                    id: expect.any(String),
                    sideA: side1,
                    sideB: side2,
                }]);
                expect(updatedRound.matchOptions).toEqual([{
                    startingScore: 501,
                    numberOfLegs: 3,
                }]);
            });

            it('sets up warning if side not added and tournament saved', async () => {
                await renderComponent(defaultTournamentContainerProps, {
                    round: roundBuilder().build(),
                    sides: [side1, side2, side3, side4],
                    readOnly,
                    depth: 1,
                    onChange,
                    on180,
                    patchData,
                    onHiCheck,
                });
                expect(reportedError.hasError()).toEqual(false);
                const matchRow = context.container.querySelector('table tr:nth-child(1)');

                await doSelectOption(matchRow.querySelector('td:nth-child(1) .dropdown-menu'), 'SIDE 1');
                await doSelectOption(matchRow.querySelector('td:nth-child(5) .dropdown-menu'), 'SIDE 2');

                expect(updatedRound).toBeNull();
                expect(warnBeforeSave).toEqual('Add the (new) match before saving, otherwise it would be lost.\n' +
                    '\n' +
                    'Semi-Final: SIDE 1 vs SIDE 2');
            });

            it('can set sides in sub-round', async () => {
                await renderComponent(defaultTournamentContainerProps, {
                    allowNextRound: true,
                    round: roundBuilder()
                        .withMatch((m: ITournamentMatchBuilder) => m.sideA(side1, 1).sideB(side2, 2))
                        .withMatch((m: ITournamentMatchBuilder) => m.sideA(side3, 2).sideB(side4, 1))
                        .withMatchOption((o: IMatchOptionsBuilder) => o.startingScore(601).numberOfLegs(3))
                        .withMatchOption((o: IMatchOptionsBuilder) => o.startingScore(601).numberOfLegs(3))
                        .round((r: ITournamentRoundBuilder) => r
                            .withMatch((m: ITournamentMatchBuilder) => m.sideA(side2).sideB(side3))
                            .withMatchOption((o: IMatchOptionsBuilder) => o.startingScore(601).numberOfLegs(7)))
                        .build(),
                    sides: [side1, side2, side3, side4],
                    readOnly,
                    depth: 1,
                    onChange,
                    on180,
                    patchData,
                    onHiCheck,
                });
                expect(reportedError.hasError()).toEqual(false);
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
                await renderComponent(defaultTournamentContainerProps, {
                    allowNextRound: true,
                    round: roundBuilder()
                        .withMatch((m: ITournamentMatchBuilder) => m.sideA(side1, 1).sideB(side2, 2))
                        .withMatch((m: ITournamentMatchBuilder) => m.sideA(side3, 2).sideB(side4, 1))
                        .withMatchOption((o: IMatchOptionsBuilder) => o.startingScore(601).numberOfLegs(7))
                        .round((r: ITournamentRoundBuilder) => r
                            .withMatch((m: ITournamentMatchBuilder) => m.sideA(side2, 1).sideB(side3, 2))
                            .withMatchOption((o: IMatchOptionsBuilder) => o.startingScore(601).numberOfLegs(7)))
                        .build(),
                    sides: [side1, side2, side3, side4],
                    readOnly,
                    depth: 1,
                    onChange,
                    on180,
                    patchData,
                    onHiCheck,
                });
                expect(reportedError.hasError()).toEqual(false);

                const roundTables = Array.from(context.container.querySelectorAll('table'));
                expect(roundTables.length).toEqual(2);
            });

            it('can record 180', async () => {
                const saygData = saygBuilder()
                    .withLeg(0, (l: ILegBuilder) => l
                        .playerSequence('home', 'away')
                        .home((c: ILegCompetitorScoreBuilder) => c.withThrow(0))
                        .away((c: ILegCompetitorScoreBuilder) => c.withThrow(0))
                        .startingScore(501)
                        .currentThrow('home'))
                    .numberOfLegs(3)
                    .build();
                const permittedAccount: IUserDto = {
                    name: '',
                    givenName: '',
                    emailAddress: '',
                    access: {
                        recordScoresAsYouGo: true,
                    }
                };
                await renderComponent(
                    {
                        tournamentData: emptyTournamentGame,
                        matchOptionDefaults: {numberOfLegs: 3},
                        setTournamentData,
                        setWarnBeforeSave,
                    },
                    {
                        round: roundBuilder().withMatch((m: ITournamentMatchBuilder) => m.sideA(side1).sideB(side2).saygId(saygData.id)).build(),
                        sides: [side1, side2, side3, side4],
                        readOnly,
                        depth: 1,
                        onChange,
                        on180,
                        patchData,
                        onHiCheck,
                    },
                    permittedAccount);
                saygApiData[saygData.id] = saygData;
                expect(reportedError.hasError()).toEqual(false);
                const matchRow = context.container.querySelector('table tr:nth-child(1)');
                await doClick(findButton(matchRow, '📊'));
                expect(reportedError.hasError()).toEqual(false);
                const saygDialog = context.container.querySelector('.modal-dialog');
                expect(saygDialog.querySelector('[data-name="data-error"]')).toBeFalsy();
                await doChange(saygDialog, 'input[data-score-input="true"]', '180', context.user);
                await doClick(findButton(saygDialog, '📌📌📌'));

                expect(oneEighty).not.toBeNull();
            });

            it('can record hiCheck', async () => {
                const saygData = saygBuilder()
                    .withLeg(0, (l: ILegBuilder) => l
                        .playerSequence('home', 'away')
                        .home((c: ILegCompetitorScoreBuilder) => c.withThrow(0).score(351))
                        .away((c: ILegCompetitorScoreBuilder) => c.withThrow(0).score(301))
                        .startingScore(501)
                        .currentThrow('home'))
                    .numberOfLegs(3)
                    .build();
                const permittedAccount: IUserDto = {
                    name: '',
                    givenName: '',
                    emailAddress: '',
                    access: {
                        recordScoresAsYouGo: true,
                    }
                };
                await renderComponent(
                    {
                        tournamentData: emptyTournamentGame,
                        matchOptionDefaults: {numberOfLegs: 3},
                        setTournamentData,
                        setWarnBeforeSave,
                    },
                    {
                        round: roundBuilder().withMatch((m: ITournamentMatchBuilder) => m.sideA(side1).sideB(side2).saygId(saygData.id)).build(),
                        sides: [side1, side2, side3, side4],
                        readOnly,
                        depth: 1,
                        onChange,
                        on180,
                        patchData,
                        onHiCheck,
                    },
                    permittedAccount);
                saygApiData[saygData.id] = saygData;
                expect(reportedError.hasError()).toEqual(false);
                const matchRow = context.container.querySelector('table tr:nth-child(1)');
                await doClick(findButton(matchRow, '📊'));
                expect(reportedError.hasError()).toEqual(false);
                const saygDialog = context.container.querySelector('.modal-dialog');
                expect(saygDialog.querySelector('[data-name="data-error"]')).toBeFalsy();
                await doChange(saygDialog, 'input[data-score-input="true"]', '150', context.user);
                await doClick(findButton(saygDialog, '📌📌📌'));

                expect(hiCheck).not.toBeNull();
                expect(hiCheck.note).toEqual(150);
            });

            it('completing a leg patches the match data', async () => {
                const saygData = saygBuilder()
                    .withLeg(0, (l: ILegBuilder) => l
                        .playerSequence('home', 'away')
                        .home((c: ILegCompetitorScoreBuilder) => c.withThrow(450, false, 3).score(450))
                        .away((c: ILegCompetitorScoreBuilder) => c.withThrow(300, false, 3).score(300))
                        .startingScore(501)
                        .currentThrow('home'))
                    .scores(0, 0)
                    .startingScore(501)
                    .build();
                const permittedAccount: IUserDto = {
                    name: '',
                    givenName: '',
                    emailAddress: '',
                    access: {
                        recordScoresAsYouGo: true,
                    }
                };
                await renderComponent(
                    {
                        tournamentData: emptyTournamentGame,
                        matchOptionDefaults: {numberOfLegs: 3},
                        setTournamentData,
                        setWarnBeforeSave,
                    },
                    {
                        round: roundBuilder()
                            .withMatch((m: ITournamentMatchBuilder) => m.sideA(side1, 0).sideB(side2, 0).saygId(saygData.id))
                            .withMatchOption((o: IMatchOptionsBuilder) => o.numberOfLegs(3).startingScore(501))
                            .build(),
                        sides: [side1, side2],
                        readOnly,
                        depth: 1,
                        onChange,
                        on180,
                        patchData,
                        onHiCheck,
                    },
                    permittedAccount);
                saygApiData[saygData.id] = saygData;
                expect(reportedError.hasError()).toEqual(false);
                const matchRow = context.container.querySelector('table tr:nth-child(1)');
                await doClick(findButton(matchRow, '📊'));
                expect(reportedError.hasError()).toEqual(false);
                const saygDialog = context.container.querySelector('.modal-dialog');
                expect(saygDialog.querySelector('[data-name="data-error"]')).toBeFalsy();

                await doChange(saygDialog, 'input[data-score-input="true"]', '51', context.user);
                await doClick(findButton(saygDialog, '📌📌📌'));

                expect(reportedError.hasError()).toEqual(false);
                expect(patchedData).toEqual({
                    nestInRound: true,
                    patch: {
                        match: {
                            sideA: side1.id,
                            sideB: side2.id,
                            scoreA: 1,
                            scoreB: 0
                        },
                    },
                });
            });

            it('completing a leg in a nested match patches the match data', async () => {
                const saygData = saygBuilder()
                    .withLeg(0, (l: ILegBuilder) => l
                        .playerSequence('home', 'away')
                        .home((c: ILegCompetitorScoreBuilder) => c.withThrow(450, false, 3).score(450))
                        .away((c: ILegCompetitorScoreBuilder) => c.withThrow(300, false, 3).score(300))
                        .startingScore(501)
                        .currentThrow('home'))
                    .scores(0, 0)
                    .startingScore(501)
                    .build();
                const nestedSaygData = saygBuilder()
                    .withLeg(0, (l: ILegBuilder) => l
                        .playerSequence('home', 'away')
                        .home((c: ILegCompetitorScoreBuilder) => c.withThrow(460, false, 3).score(460))
                        .away((c: ILegCompetitorScoreBuilder) => c.withThrow(360, false, 3).score(360))
                        .startingScore(501)
                        .currentThrow('home'))
                    .scores(0, 0)
                    .startingScore(501)
                    .build();
                const permittedAccount: IUserDto = {
                    name: '',
                    givenName: '',
                    emailAddress: '',
                    access: {
                        recordScoresAsYouGo: true,
                    }
                };
                await renderComponent(
                    {
                        tournamentData: emptyTournamentGame,
                        matchOptionDefaults: {numberOfLegs: 3},
                        setTournamentData,
                        setWarnBeforeSave,
                        saveTournament,
                    },
                    {
                        round: roundBuilder()
                            .withMatch((m: ITournamentMatchBuilder) => m.sideA(side1, 3).sideB(side2, 2).saygId(saygData.id))
                            .withMatchOption((o: IMatchOptionsBuilder) => o.numberOfLegs(3).startingScore(501))
                            .round((r: ITournamentRoundBuilder) => r
                                .withMatch((m: ITournamentMatchBuilder) => m.sideA(side1, 0).sideB(side3, 0).saygId(nestedSaygData.id))
                                .withMatchOption((o: IMatchOptionsBuilder) => o.numberOfLegs(3).startingScore(501)))
                            .build(),
                        sides: [side1, side2, side3],
                        readOnly,
                        depth: 1,
                        allowNextRound: true,
                        onChange,
                        on180,
                        patchData,
                        onHiCheck,
                    },
                    permittedAccount);
                saygApiData[saygData.id] = saygData;
                saygApiData[nestedSaygData.id] = nestedSaygData;
                expect(reportedError.hasError()).toEqual(false);
                const secondRoundTable = context.container.querySelectorAll('table')[1];
                const matchRow = secondRoundTable.querySelector('tr:nth-child(1)');
                await doClick(findButton(matchRow, '📊'));
                expect(reportedError.hasError()).toEqual(false);
                const saygDialog = context.container.querySelector('.modal-dialog');
                expect(saygDialog.querySelector('[data-name="data-error"]')).toBeFalsy();

                await doChange(saygDialog, 'input[data-score-input="true"]', '41', context.user);
                await doClick(findButton(saygDialog, '📌📌📌'));

                expect(reportedError.hasError()).toEqual(false);
                expect(patchedData).toEqual({
                    nestInRound: true,
                    patch: {
                        nextRound: {
                            match: {
                                sideA: side1.id,
                                sideB: side3.id,
                                scoreA: 1,
                                scoreB: 0
                            },
                        },
                    },
                });
            });
        });

    });
});