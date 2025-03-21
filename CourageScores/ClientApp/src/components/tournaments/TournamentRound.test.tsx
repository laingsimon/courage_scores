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
} from "../../helpers/tests";
import {ITournamentRoundProps, TournamentRound} from "./TournamentRound";
import {ITournamentContainerProps, TournamentContainer} from "./TournamentContainer";
import {UpdateRecordedScoreAsYouGoDto} from "../../interfaces/models/dtos/Game/Sayg/UpdateRecordedScoreAsYouGoDto";
import {IClientActionResultDto} from "../common/IClientActionResultDto";
import {RecordedScoreAsYouGoDto} from "../../interfaces/models/dtos/Game/Sayg/RecordedScoreAsYouGoDto";
import {UserDto} from "../../interfaces/models/dtos/Identity/UserDto";
import {TournamentSideDto} from "../../interfaces/models/dtos/Game/TournamentSideDto";
import {TournamentGameDto} from "../../interfaces/models/dtos/Game/TournamentGameDto";
import {TournamentRoundDto} from "../../interfaces/models/dtos/Game/TournamentRoundDto";
import {
    ITournamentMatchBuilder, ITournamentRoundBuilder,
    roundBuilder,
    sideBuilder,
    tournamentBuilder, tournamentMatchBuilder
} from "../../helpers/builders/tournaments";
import {IMatchOptionsBuilder} from "../../helpers/builders/games";
import {createTemporaryId} from "../../helpers/projection";
import {ISaygApi} from "../../interfaces/apis/ISaygApi";
import {ITournamentGameApi} from "../../interfaces/apis/ITournamentGameApi";
import {CreateTournamentSaygDto} from "../../interfaces/models/dtos/Game/CreateTournamentSaygDto";
import {tournamentContainerPropsBuilder} from "./tournamentContainerPropsBuilder";
import {TournamentMatchDto} from "../../interfaces/models/dtos/Game/TournamentMatchDto";

describe('TournamentRound', () => {
    let context: TestContext;
    let reportedError: ErrorState | null;
    let updatedRound: TournamentRoundDto | null;
    let warnBeforeEditDialogClose: string | null;
    let saygApiData: { [id: string]: RecordedScoreAsYouGoDto };
    const tournamentApi = api<ITournamentGameApi>({
        addSayg: async (id: string, _: CreateTournamentSaygDto): Promise<IClientActionResultDto<TournamentGameDto>> => {
            return {
                success: true,
                result: {
                    id,
                    address: '',
                    date: '',
                }
            };
        }
    });
    const saygApi = api<ISaygApi>({
        get: async (id: string): Promise<RecordedScoreAsYouGoDto | null> => {
            return saygApiData[id];
        },
        upsert: async (data: UpdateRecordedScoreAsYouGoDto): Promise<IClientActionResultDto<RecordedScoreAsYouGoDto>> => {
            const result: UpdateRecordedScoreAsYouGoDto = Object.assign({}, data);
            if (!result.id) {
                result.id = createTemporaryId();
            }

            return {
                success: true,
                result: result as RecordedScoreAsYouGoDto,
            };
        },
    });

    afterEach(async () => {
        await cleanUp(context);
    });

    beforeEach(() => {
        reportedError = new ErrorState();
        saygApiData = {};
        updatedRound = null;
        warnBeforeEditDialogClose = null;
    });

    async function onChange(newRound: TournamentRoundDto) {
        updatedRound = newRound;
    }

    async function setWarnBeforeEditDialogClose(msg: string) {
        warnBeforeEditDialogClose = msg;
    }

    async function renderComponent(containerProps: ITournamentContainerProps, props: ITournamentRoundProps, account?: UserDto) {
        context = await renderApp(
            iocProps({tournamentApi, saygApi}),
            brandingProps(),
            appProps({
                account
            }, reportedError!),
            (<TournamentContainer {...containerProps} >
                <TournamentRound {...props} />
            </TournamentContainer>));

        reportedError!.verifyNoError();
    }

    function assertMatch(table: Element, ordinal: number, expectedText: string[]) {
        const matchRow = table.querySelector(`tr:nth-child(${ordinal})`)!;
        const cells = Array.from(matchRow.querySelectorAll('td'));
        expect(cells.map(td => td.textContent)).toEqual(expectedText);
    }

    function assertEditableMatch(table: Element, ordinal: number, expectedText: string[]) {
        const matchRow = table.querySelector(`tr:nth-child(${ordinal})`)!;
        const cells = Array.from(matchRow.querySelectorAll('td'));
        expect(cells.map(td => {
            if (td.querySelector('.dropdown-toggle')) {
                return td.querySelector('.dropdown-toggle')!.textContent;
            }
            if (td.querySelector('input')) {
                return td.querySelector('input')!.value;
            }

            return td.textContent;
        })).toEqual(expectedText);
    }

    describe('when logged out (readonly)', () => {
        const side1: TournamentSideDto = sideBuilder('SIDE 1').build();
        const side2: TournamentSideDto = sideBuilder('SIDE 2').build();
        const side3: TournamentSideDto = sideBuilder('SIDE 3').build();
        const side4: TournamentSideDto = sideBuilder('SIDE 4').build();
        const readOnly: boolean = true;
        const containerProps = new tournamentContainerPropsBuilder({
            setWarnBeforeEditDialogClose,
        });

        describe('renders', () => {
            it('when no matches', async () => {
                await renderComponent(containerProps.build(), {
                    round: roundBuilder().build(),
                    sides: [],
                    readOnly,
                    onChange,
                });

                expect(context.container.textContent).toContain('No matches defined');
            });

            it('unplayed round', async () => {
                await renderComponent(containerProps.build(), {
                    round: roundBuilder()
                        .withMatch((m: ITournamentMatchBuilder) => m.sideA(side1).sideB(side2))
                        .withMatchOption((o: IMatchOptionsBuilder) => o.startingScore(601).numberOfLegs(7))
                        .build(),
                    sides: [side1, side2, side3, side4],
                    readOnly,
                    onChange,
                });

                const table = context.container.querySelector('table')!;
                assertMatch(table, 1, ['SIDE 1', '', 'vs', '', 'SIDE 2']);
            });

            it('played round', async () => {
                await renderComponent(containerProps.build(), {
                    round: roundBuilder()
                        .withMatch((m: ITournamentMatchBuilder) => m.sideA(side1, 1).sideB(side2, 2))
                        .withMatch((m: ITournamentMatchBuilder) => m.sideA(side3, 2).sideB(side4, 1))
                        .withMatchOption((o: IMatchOptionsBuilder) => o.startingScore(601).numberOfLegs(7))
                        .build(),
                    sides: [side1, side2, side3, side4],
                    readOnly,
                    onChange,
                });

                const table = context.container.querySelector('table')!;
                assertMatch(table, 1, ['SIDE 1', '1', 'vs', '2', 'SIDE 2']);
                assertMatch(table, 2, ['SIDE 3', '2', 'vs', '1', 'SIDE 4']);
            });
        });

        it('no next round (when single round)', async () => {
            await renderComponent(containerProps.build(), {
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
                onChange,
            });

            const roundTables = context.container.querySelectorAll('table');
            expect(roundTables.length).toEqual(1);
        });
    });

    describe('when logged in', () => {
        const side1: TournamentSideDto = sideBuilder('SIDE 1').withPlayer('PLAYER').build();
        const side2: TournamentSideDto = sideBuilder('SIDE 2').withPlayer('PLAYER').build();
        const side3: TournamentSideDto = sideBuilder('SIDE 3').build();
        const side4: TournamentSideDto = sideBuilder('SIDE 4').build();
        const readOnly: boolean = false;
        const containerProps = new tournamentContainerPropsBuilder({
            setWarnBeforeEditDialogClose,
        });

        describe('renders', () => {
            it('when no matches', async () => {
                await renderComponent(containerProps.build(), {
                    round: roundBuilder().build(),
                    sides: [side1, side2],
                    readOnly,
                    onChange,
                });

                expect(context.container.querySelector('table')).toBeTruthy();
            });

            it('unplayed round', async () => {
                await renderComponent(containerProps.build(), {
                    round: roundBuilder()
                        .withMatch((m: ITournamentMatchBuilder) => m.sideA(side1).sideB(side2))
                        .withMatchOption((o: IMatchOptionsBuilder) => o.startingScore(601).numberOfLegs(7))
                        .build(),
                    sides: [side1, side2, side3, side4],
                    readOnly,
                    onChange,
                });

                const table = context.container.querySelector('table')!;
                assertEditableMatch(table, 1, ['SIDE 1', '', 'vs', '', 'SIDE 2', '🗑🛠']);
            });

            it('played round', async () => {
                await renderComponent(
                    containerProps.withMatchOptionDefaults({numberOfLegs: 3}).build(),
                    {
                        round: roundBuilder()
                            .withMatch((m: ITournamentMatchBuilder) => m.sideA(side1, 1).sideB(side2, 2))
                            .withMatch((m: ITournamentMatchBuilder) => m.sideA(side3, 2).sideB(side4, 1))
                            .withMatchOption((o: IMatchOptionsBuilder) => o.startingScore(601).numberOfLegs(7))
                            .build(),
                        sides: [side1, side2, side3, side4],
                        readOnly,
                        onChange,
                    });

                const table = context.container.querySelector('table')!;
                assertEditableMatch(table, 1, ['SIDE 1', '1', 'vs', '2', 'SIDE 2', '🗑🛠']);
                assertEditableMatch(table, 2, ['SIDE 3', '2', 'vs', '1', 'SIDE 4', '🗑🛠']);
            });

            it('no next round (when single round)', async () => {
                await renderComponent(containerProps.build(), {
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
                    onChange,
                });

                const roundTables = context.container.querySelectorAll('table');
                expect(roundTables.length).toEqual(1);
            });
        });

        describe('interactivity', () => {
            it('can delete match', async () => {
                await renderComponent(
                    containerProps.withMatchOptionDefaults({numberOfLegs: 3}).build(),
                    {
                        round: roundBuilder()
                            .withMatch((m: ITournamentMatchBuilder) => m.sideA(side1).sideB(side2))
                            .build(),
                        sides: [side1, side2, side3, side4],
                        readOnly,
                        onChange,
                    });
                const matchRow = context.container.querySelector('table tr:nth-child(1)');
                context.prompts.respondToConfirm('Are you sure you want to remove this match?', true);

                await doClick(findButton(matchRow, '🗑'));

                reportedError!.verifyNoError();
                expect(updatedRound).toEqual({
                    matches: [],
                    matchOptions: [],
                });
            });

            it('can change match options', async () => {
                const match = tournamentMatchBuilder().sideA(side1).sideB(side2).build();
                await renderComponent(
                    containerProps.withMatchOptionDefaults({numberOfLegs: 5, startingScore: 501}).build(),
                    {
                        round: roundBuilder().withMatch(match).build(),
                        sides: [side1, side2, side3, side4],
                        readOnly,
                        onChange,
                    });
                const matchRow = context.container.querySelector('table tr:nth-child(1)');

                await doClick(findButton(matchRow, '🛠'));
                const matchOptionsDialog = context.container.querySelector('.modal-dialog');
                expect(matchOptionsDialog).toBeTruthy();
                await doChange(matchOptionsDialog!, 'input[name="startingScore"]', '123', context.user);
                await doClick(findButton(matchOptionsDialog, 'Close'));
                expect(context.container.querySelector('.modal-dialog')).toBeFalsy();
                reportedError!.verifyNoError();
                expect(updatedRound).not.toBeNull();
                expect(updatedRound!.matchOptions).toEqual([{
                    startingScore: 123,
                    numberOfLegs: 5,
                }]);
            });

            it('cannot open sayg when not permitted', async () => {
                const match = tournamentMatchBuilder().sideA(side1).sideB(side2).build();
                const permittedAccount: UserDto = {
                    name: '',
                    givenName: '',
                    emailAddress: '',
                    access: {
                        recordScoresAsYouGo: false,
                    }
                };
                await renderComponent(
                    containerProps.withMatchOptionDefaults({numberOfLegs: 3}).build(),
                    {
                        round: roundBuilder().withMatch(match).build(),
                        sides: [side1, side2, side3, side4],
                        readOnly,
                        onChange,
                    },
                    permittedAccount);
                const matchRow = context.container.querySelector('table tr:nth-child(1)')!;

                expect(matchRow.textContent).not.toContain('📊');
            });

            it('can change sideA', async () => {
                const match = tournamentMatchBuilder().sideA(side1).sideB(side2).build();
                await renderComponent(
                    containerProps.withMatchOptionDefaults({numberOfLegs: 3}).build(),
                    {
                        round: roundBuilder().withMatch(match).build(),
                        sides: [side1, side2, side3, side4],
                        readOnly,
                        onChange,
                    });
                const matchRow = context.container.querySelector('table tr:nth-child(1)')!;
                const sideA = matchRow.querySelector('td:nth-child(1)')!;

                await doSelectOption(sideA.querySelector('.dropdown-menu'), 'SIDE 3');

                reportedError!.verifyNoError();
                expect(updatedRound).toEqual({
                    matches: [{
                        id: match.id,
                        sideA: side3,
                        sideB: side2,
                    }],
                    matchOptions: [],
                });
            });

            it('can change sideB', async () => {
                const match = tournamentMatchBuilder().sideA(side1).sideB(side2).build();
                await renderComponent(
                    containerProps.withMatchOptionDefaults({numberOfLegs: 3}).build(),
                    {
                        round: roundBuilder().withMatch(match).build(),
                        sides: [side1, side2, side3, side4],
                        readOnly,
                        onChange,
                    });
                const matchRow = context.container.querySelector('table tr:nth-child(1)')!;
                const sideB = matchRow.querySelector('td:nth-child(5)')!;

                await doSelectOption(sideB.querySelector('.dropdown-menu'), 'SIDE 3');

                reportedError!.verifyNoError();
                expect(updatedRound).toEqual({
                    matches: [{
                        id: match.id,
                        sideA: side1,
                        sideB: side3,
                    }],
                    matchOptions: [],
                });
            });

            it('cannot add match with only sideA', async () => {
                await renderComponent(containerProps.build(), {
                    round: roundBuilder().build(),
                    sides: [side1, side2, side3, side4],
                    readOnly,
                    onChange,
                });
                const matchRow = context.container.querySelector('table tr:nth-child(1)')!;

                await doSelectOption(matchRow.querySelector('td:nth-child(1) .dropdown-menu'), 'SIDE 1');
                await doClick(findButton(matchRow, '➕'));

                expect(updatedRound).toBeFalsy();
                context.prompts.alertWasShown('Select the sides first');
            });

            it('cannot add match with only sideB', async () => {
                await renderComponent(containerProps.build(), {
                    round: roundBuilder().build(),
                    sides: [side1, side2, side3, side4],
                    readOnly,
                    onChange,
                });
                const matchRow = context.container.querySelector('table tr:nth-child(1)')!;

                await doSelectOption(matchRow.querySelector('td:nth-child(1) .dropdown-menu'), 'SIDE 1');
                await doClick(findButton(matchRow, '➕'));

                expect(updatedRound).toBeFalsy();
                context.prompts.alertWasShown('Select the sides first');
            });

            it('can add match', async () => {
                const newMatch = {
                    id: '',
                };
                async function setNewMatch(updates: TournamentMatchDto) {
                    if (updates.id) {
                        // setNewMatch(createNewMatch()) has been called, this would wipe out the current state
                        // excluding these updates to allow us to confirm the previous update is working as expected.
                        return;
                    }
                    Object.assign(newMatch, updates)
                }
                await renderComponent(
                    containerProps
                        .withNewMatch(newMatch as TournamentMatchDto)
                        .withSetNewMatch(setNewMatch)
                        .withTournament(tournamentBuilder().bestOf(3).build())
                        .withMatchOptionDefaults({numberOfLegs: 3, startingScore: 501})
                        .build(),
                    {
                        round: roundBuilder().build(),
                        sides: [side1, side2, side3, side4],
                        readOnly,
                        onChange,
                    });
                const matchRow = context.container.querySelector('table tr:nth-child(1)')!;

                await doSelectOption(matchRow.querySelector('td:nth-child(1) .dropdown-menu'), 'SIDE 1');
                await doSelectOption(matchRow.querySelector('td:nth-child(5) .dropdown-menu'), 'SIDE 2');
                await doClick(findButton(matchRow, '➕'));

                expect(updatedRound).not.toBeNull();
                expect(updatedRound!.matches).toEqual([{
                    id: expect.any(String),
                    sideA: side1,
                    sideB: side2,
                }]);
                expect(updatedRound!.matchOptions).toEqual([{
                    startingScore: 501,
                    numberOfLegs: 3,
                }]);
            });

            it('sets up warning if side not added and tournament saved', async () => {
                const newMatch = {
                    id: '',
                };
                async function setNewMatch(updates: TournamentMatchDto) {
                    if (updates.id) {
                        // setNewMatch(createNewMatch()) has been called, this would wipe out the current state
                        // excluding these updates to allow us to confirm the previous update is working as expected.
                        return;
                    }
                    Object.assign(newMatch, updates)
                }
                await renderComponent(containerProps
                        .withNewMatch(newMatch as TournamentMatchDto)
                        .withSetNewMatch(setNewMatch)
                        .build(), {
                    round: roundBuilder().build(),
                    sides: [side1, side2, side3, side4],
                    readOnly,
                    onChange,
                });
                const matchRow = context.container.querySelector('table tr:nth-child(1)')!;

                await doSelectOption(matchRow.querySelector('td:nth-child(1) .dropdown-menu'), 'SIDE 1');
                await doSelectOption(matchRow.querySelector('td:nth-child(5) .dropdown-menu'), 'SIDE 2');

                expect(updatedRound).toBeNull();
                expect(warnBeforeEditDialogClose).toEqual('Add the (new) match before saving, otherwise it would be lost.\n' +
                    '\n' +
                    'SIDE 1 vs SIDE 2');
            });
        });
    });
});