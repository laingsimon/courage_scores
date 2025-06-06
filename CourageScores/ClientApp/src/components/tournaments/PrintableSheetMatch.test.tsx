﻿import {
    api,
    appProps,
    brandingProps,
    cleanUp, doChange,
    doClick, doSelectOption,
    ErrorState, findButton,
    iocProps,
    renderApp,
    TestContext
} from "../../helpers/tests";
import {TournamentGameDto} from "../../interfaces/models/dtos/Game/TournamentGameDto";
import {ITournamentContainerProps, TournamentContainer} from "./TournamentContainer";
import {IAppContainerProps} from "../common/AppContainer";
import {IPrintableSheetMatchProps, PrintableSheetMatch} from "./PrintableSheetMatch";
import {sideBuilder, tournamentBuilder} from "../../helpers/builders/tournaments";
import {createTemporaryId} from "../../helpers/projection";
import {matchOptionsBuilder} from "../../helpers/builders/games";
import {GameMatchOptionDto} from "../../interfaces/models/dtos/Game/GameMatchOptionDto";
import {PatchTournamentDto} from "../../interfaces/models/dtos/Game/PatchTournamentDto";
import {PatchTournamentRoundDto} from "../../interfaces/models/dtos/Game/PatchTournamentRoundDto";
import {UserDto} from "../../interfaces/models/dtos/Identity/UserDto";
import {RecordedScoreAsYouGoDto} from "../../interfaces/models/dtos/Game/Sayg/RecordedScoreAsYouGoDto";
import {ISaygApi} from "../../interfaces/apis/ISaygApi";
import {saygBuilder} from "../../helpers/builders/sayg";
import {UpdateRecordedScoreAsYouGoDto} from "../../interfaces/models/dtos/Game/Sayg/UpdateRecordedScoreAsYouGoDto";
import {IClientActionResultDto} from "../common/IClientActionResultDto";
import {ILayoutDataForMatch} from "./layout/ILayoutDataForMatch";
import {START_SCORING} from "./tournaments";
import {ITournamentGameApi} from "../../interfaces/apis/ITournamentGameApi";
import {TournamentSideDto} from "../../interfaces/models/dtos/Game/TournamentSideDto";
import {TournamentRoundDto} from "../../interfaces/models/dtos/Game/TournamentRoundDto";
import {tournamentContainerPropsBuilder} from "./tournamentContainerPropsBuilder";

describe('PrintableSheetMatch', () => {
    let context: TestContext;
    let reportedError: ErrorState;
    let updatedTournament: TournamentGameDto | null;
    let patchedData: {patch: PatchTournamentDto | PatchTournamentRoundDto, nestInRound?: boolean}[];
    let saygDataLookup: { [id: string]: RecordedScoreAsYouGoDto };
    let deletedSayg: { id: string, matchId: string } | null;
    let deletedSaygResponse: IClientActionResultDto<TournamentGameDto> | null;

    const saygApi = api<ISaygApi>({
        async get(id: string): Promise<RecordedScoreAsYouGoDto | null> {
            return saygDataLookup[id];
        },
        async upsert(data: UpdateRecordedScoreAsYouGoDto): Promise<IClientActionResultDto<RecordedScoreAsYouGoDto>> {
            return {
                success: true,
                result: data as RecordedScoreAsYouGoDto,
            };
        }
    });
    const tournamentApi = api<ITournamentGameApi>({
        async deleteSayg(id: string, matchId: string): Promise<IClientActionResultDto<TournamentGameDto>> {
            deletedSayg = { id, matchId };
            return deletedSaygResponse || {
                success: true,
            };
        }
    });

    afterEach(async () => {
        await cleanUp(context);
    });

    beforeEach(() => {
        reportedError = new ErrorState();
        updatedTournament = null;
        patchedData = [];
        saygDataLookup = {};
        deletedSayg = null;
        deletedSaygResponse = null;
    });

    async function patchData(patch: PatchTournamentDto | PatchTournamentRoundDto, nestInRound?: boolean) {
        patchedData.push({patch, nestInRound});
    }

    async function setTournamentData(update: TournamentGameDto) {
        updatedTournament = update;
    }

    async function renderComponent(containerProps: ITournamentContainerProps, props: IPrintableSheetMatchProps, appProps: IAppContainerProps) {
        context = await renderApp(
            iocProps({saygApi, tournamentApi}),
            brandingProps(),
            appProps,
            (<TournamentContainer {...containerProps}>
                <PrintableSheetMatch {...props} />
            </TournamentContainer>));

        reportedError.verifyNoError();
    }

    function props(matchData: ILayoutDataForMatch, editable?: boolean, ...possibleSides: TournamentSideDto[]): IPrintableSheetMatchProps {
        return {
            matchData,
            matchIndex: 0,
            roundIndex: 0,
            possibleSides,
            editable,
        };
    }

    function withRound(props: IPrintableSheetMatchProps, round: TournamentRoundDto): IPrintableSheetMatchProps {
        props.round = round;
        return props;
    }

    function patchable(props: IPrintableSheetMatchProps): IPrintableSheetMatchProps {
        props.patchData = patchData;
        return props;
    }

    function withRoundIndex(props: IPrintableSheetMatchProps, index: number): IPrintableSheetMatchProps {
        props.roundIndex = index;
        return props;
    }

    function user(recordScoresAsYouGo?: boolean, showDebugOptions?: boolean): UserDto {
        return {
            name: '',
            emailAddress: '',
            givenName: '',
            access: {
                recordScoresAsYouGo,
                showDebugOptions,
            },
        };
    }

    describe('renders', () => {
        const matchOptionDefaults: GameMatchOptionDto = matchOptionsBuilder().build();
        const tournamentData: TournamentGameDto = tournamentBuilder().build();
        const containerProps = new tournamentContainerPropsBuilder({
            matchOptionDefaults,
            async saveTournament(): Promise<TournamentGameDto> {
                return tournamentData;
            },
            setTournamentData,
        });

        it('match mnemonic', async () => {
            const matchData: ILayoutDataForMatch = {
                scoreB: '',
                scoreA: '',
                sideA: { id: createTemporaryId(), name: '', mnemonic: 'A' },
                sideB: { id: createTemporaryId(), name: '', mnemonic: 'B' },
                mnemonic: 'M1',
            };
            await renderComponent(
                containerProps.withTournament(tournamentData).build(),
                props(matchData),
                appProps({}, reportedError));

            const matchMnemonic = context.container.querySelector('span[datatype="match-mnemonic"]')!;
            expect(matchMnemonic).toBeTruthy();
            expect(matchMnemonic.textContent).toEqual('M1');
        });

        it('when no match mnemonic', async () => {
            const matchData: ILayoutDataForMatch = {
                scoreB: '',
                scoreA: '',
                sideA: { id: createTemporaryId(), name: '', mnemonic: 'A' },
                sideB: { id: createTemporaryId(), name: '', mnemonic: 'B' },
                mnemonic: 'M1',
                hideMnemonic: true,
            };
            await renderComponent(
                containerProps.withTournament(tournamentData).build(),
                props(matchData),
                appProps({}, reportedError));

            const matchMnemonic = context.container.querySelector('span[datatype="match-mnemonic"]');
            expect(matchMnemonic).toBeFalsy();
        });

        it('sideA', async () => {
            const matchData: ILayoutDataForMatch = {
                scoreB: '',
                scoreA: '5',
                sideA: { id: createTemporaryId(), link: (<span>SIDE A</span>), name: '', mnemonic: 'A' },
                sideB: { id: createTemporaryId(), link: (<span>SIDE B</span>), name: '', mnemonic: 'B' },
                mnemonic: 'M1',
                hideMnemonic: true,
            };
            await renderComponent(
                containerProps.withTournament(tournamentData).build(),
                props(matchData),
                appProps({}, reportedError));

            const sideA = context.container.querySelector('div[datatype="sideA"]')!;
            expect(sideA).toBeTruthy();
            expect(sideA.querySelector('span[datatype="sideAname"]')!.textContent).toEqual('SIDE A');
            expect(sideA.querySelector('div[datatype="scoreA"]')!.textContent).toEqual('5');
        });

        it('sideB', async () => {
            const matchData: ILayoutDataForMatch = {
                scoreB: '7',
                scoreA: '5',
                sideA: { id: createTemporaryId(), link: (<span>SIDE A</span>), name: '', mnemonic: 'A' },
                sideB: { id: createTemporaryId(), link: (<span>SIDE B</span>), name: '', mnemonic: 'B' },
                mnemonic: 'M1',
                hideMnemonic: true,
            };
            await renderComponent(
                containerProps.withTournament(tournamentData).build(),
                props(matchData),
                appProps({}, reportedError));

            const sideB = context.container.querySelector('div[datatype="sideB"]')!;
            expect(sideB).toBeTruthy();
            expect(sideB.querySelector('span[datatype="sideBname"]')!.textContent).toEqual('SIDE B');
            expect(sideB.querySelector('div[datatype="scoreB"]')!.textContent).toEqual('7');
        });
    });

    describe('interactivity', () => {
        const matchOptionDefaults: GameMatchOptionDto = matchOptionsBuilder().numberOfLegs(7).build();
        const sideA = sideBuilder('SIDE A').build();
        const sideB = sideBuilder('SIDE B').build();
        const sideC = sideBuilder('SIDE C').build();
        const tournamentData: TournamentGameDto = tournamentBuilder().build();
        let saygData: RecordedScoreAsYouGoDto & UpdateRecordedScoreAsYouGoDto;
        let matchData: ILayoutDataForMatch;
        let tournamentDataWithMatch: TournamentGameDto;
        const containerProps = new tournamentContainerPropsBuilder({
            matchOptionDefaults,
            async saveTournament(): Promise<TournamentGameDto> {
                return tournamentData;
            },
            setTournamentData,
        });

        beforeEach(() => {
             saygData = saygBuilder()
                .yourName('SIDE A')
                .opponentName('SIDE B')
                .scores(1, 2)
                .numberOfLegs(3)
                .startingScore(501)
                .addTo(saygDataLookup)
                .build();

             matchData = {
                scoreB: '7',
                scoreA: '5',
                sideA: { },
                sideB: { },
                mnemonic: 'M1',
                hideMnemonic: true,
            };

            tournamentDataWithMatch = tournamentBuilder()
                .round(r => r
                    .withMatch(m => m
                        .sideA(sideA)
                        .sideB(sideB)
                        .saygId(saygData.id)))
                .build();
        })

        it('can change side and score for sideA', async () => {
            await renderComponent(
                containerProps.withTournament(tournamentData).build(),
                props(matchData, true, sideA, sideB, sideC),
                appProps({}, reportedError));
            const side = context.container.querySelector('div[datatype="sideA"]')!;
            await doClick(side);
            const dialog = context.container.querySelector('.modal-dialog')!;
            await doSelectOption(dialog.querySelector('.form-group :nth-child(2) div.dropdown-menu'), 'SIDE C');
            await doSelectOption(dialog.querySelector('.form-group :nth-child(4) div.dropdown-menu'), '1');
            await doClick(findButton(dialog, 'Save'));

            expect(updatedTournament!.round).toEqual({
                id: expect.any(String),
                matchOptions: expect.any(Array),
                matches: [{
                    id: expect.any(String),
                    scoreA: 1,
                    sideA: {
                        name: 'SIDE C',
                        id: sideC.id,
                        players: [],
                    },
                    sideB: {},
                }]
            });
        });

        it('can change side and score for sideB', async () => {
            await renderComponent(
                containerProps.withTournament(tournamentData).build(),
                props(matchData, true, sideA, sideB, sideC),
                appProps({}, reportedError));
            const side = context.container.querySelector('div[datatype="sideB"]')!;
            await doClick(side);
            const dialog = context.container.querySelector('.modal-dialog')!;
            await doSelectOption(dialog.querySelector('.form-group :nth-child(2) div.dropdown-menu'), 'SIDE C');
            await doSelectOption(dialog.querySelector('.form-group :nth-child(4) div.dropdown-menu'), '1');
            await doClick(findButton(dialog, 'Save'));

            expect(updatedTournament!.round).toEqual({
                id: expect.any(String),
                matchOptions: expect.any(Array),
                matches: [{
                    id: expect.any(String),
                    scoreB: 1,
                    sideA: {},
                    sideB: {
                        name: 'SIDE C',
                        id: sideC.id,
                        players: [],
                    },
                }]
            });
        });

        it('can change best-of', async () => {
            const tournamentData: TournamentGameDto = tournamentBuilder()
                .round(r => r
                    .withMatch(m => m
                        .sideA(sideA, 5)
                        .sideB(sideB, 7)))
                .build();
            const matchData: ILayoutDataForMatch = {
                scoreB: '7',
                scoreA: '5',
                sideA: { id: sideA.id, link: (<span>SIDE A</span>), name: '', mnemonic: 'A' },
                sideB: { id: sideB.id, link: (<span>SIDE B</span>), name: '', mnemonic: 'B' },
                mnemonic: 'M1',
                hideMnemonic: true,
            };
            await renderComponent(
                containerProps.withTournament(tournamentData).build(),
                props(matchData, true, sideA, sideB, sideC),
                appProps({}, reportedError));
            const side = context.container.querySelector('div[datatype="sideB"]')!;
            await doClick(side);
            const dialog = context.container.querySelector('.modal-dialog')!;
            await doChange(dialog, 'input[name="bestOf"]', '11', context.user);
            await doClick(findButton(dialog, 'Save'));

            expect(updatedTournament!.round).toEqual({
                matchOptions: [{
                    numberOfLegs: 11,
                }],
                matches: [{
                    id: expect.any(String),
                    scoreA: 5,
                    scoreB: 7,
                    sideA: sideA,
                    sideB: sideB,
                }],
            });
        });

        it('cannot save if best-of is invalid', async () => {
            const tournamentData: TournamentGameDto = tournamentBuilder()
                .round(r => r
                    .withMatch(m => m
                        .sideA(sideA, 5)
                        .sideB(sideB, 7)))
                .build();
            const matchData: ILayoutDataForMatch = {
                scoreB: '7',
                scoreA: '5',
                sideA: { id: sideA.id, link: (<span>SIDE A</span>), name: '', mnemonic: 'A' },
                sideB: { id: sideB.id, link: (<span>SIDE B</span>), name: '', mnemonic: 'B' },
                mnemonic: 'M1',
                hideMnemonic: true,
            };
            await renderComponent(
                containerProps.withTournament(tournamentData).build(),
                props(matchData, true, sideA, sideB, sideC),
                appProps({}, reportedError));
            const side = context.container.querySelector('div[datatype="sideB"]')!;
            await doClick(side);
            const dialog = context.container.querySelector('.modal-dialog')!;

            await doChange(dialog, 'input[name="bestOf"]', '', context.user);
            await doClick(findButton(dialog, 'Save'));

            context.prompts.alertWasShown('Best of is invalid');
            expect(updatedTournament).toBeNull();
        });

        it('does not open dialog match in subsequent round when first round is not complete', async () => {
            const tournamentData: TournamentGameDto = tournamentBuilder()
                .round(r => r
                    .round(r => r
                        .withMatch(m => m.sideA(sideA, 5).sideB(sideB, 7))))
                .build();
            const nestedMatchData: ILayoutDataForMatch = {
                scoreB: '7',
                scoreA: '5',
                sideA: { id: createTemporaryId(), link: (<span>SIDE A</span>), name: '', mnemonic: 'A' },
                sideB: { id: createTemporaryId(), link: (<span>SIDE B</span>), name: '', mnemonic: 'B' },
                mnemonic: 'M1',
                hideMnemonic: true,
            };
            await renderComponent(
                containerProps.withTournament(tournamentData).build(),
                withRoundIndex(props(nestedMatchData, true), 1),
                appProps({}, reportedError));
            await doClick(context.container.querySelector('div[datatype="sideB"]')!);

            context.prompts.alertWasShown('Finish entering data for the previous rounds first');
        });

        it('can change side properties for match in subsequent round', async () => {
            const tournamentData: TournamentGameDto = tournamentBuilder()
                .round(r => r
                    .withMatch(m => m.sideA(sideA, 5).sideB(sideC, 1))
                    .round(r => r
                        .withMatch(m => m.sideA(sideA, 5).sideB(sideB, 7))))
                .build();
            const nestedMatchData: ILayoutDataForMatch = {
                scoreB: '7',
                scoreA: '5',
                sideA: { id: createTemporaryId(), link: (<span>SIDE A</span>), name: '', mnemonic: 'A' },
                sideB: { id: sideB.id, link: (<span>SIDE B</span>), name: '', mnemonic: 'B' },
                mnemonic: 'M1',
                hideMnemonic: true,
            };
            await renderComponent(
                containerProps.withTournament(tournamentData).build(),
                withRoundIndex(props(nestedMatchData, true, sideA, sideB), 1),
                appProps({}, reportedError));
            await doClick(context.container.querySelector('div[datatype="sideB"]')!);
            const dialog = context.container.querySelector('.modal-dialog')!;
            await doSelectOption(dialog.querySelector('.form-group :nth-child(4) div.dropdown-menu'), '3');
            await doClick(findButton(dialog, 'Save'));

            expect(updatedTournament!.round!.nextRound).toEqual({
                matchOptions: expect.any(Array),
                matches: [{
                    id: expect.any(String),
                    scoreA: 5,
                    scoreB: 3,
                    sideA: {
                        id: sideA.id,
                        name: sideA.name,
                        players: [],
                    },
                    sideB: {
                        id: sideB.id,
                        name: sideB.name,
                        players: [],
                    },
                }],
            });
        });

        it('preselects side to mnemonic', async () => {
            matchData.sideA.mnemonic = sideC.name;
            await renderComponent(
                containerProps.withTournament(tournamentData).build(),
                props(matchData, true, sideA, sideB, sideC),
                appProps({}, reportedError));
            await doClick(context.container.querySelector('div[datatype="sideA"]')!);
            const dialog = context.container.querySelector('.modal-dialog')!;
            await doSelectOption(dialog.querySelector('.form-group :nth-child(4) div.dropdown-menu'), '1');
            await doClick(findButton(dialog, 'Save'));

            expect(updatedTournament!.round).toEqual({
                id: expect.any(String),
                matchOptions: expect.any(Array),
                matches: [{
                    id: expect.any(String),
                    scoreA: 1,
                    sideA: {
                        name: 'SIDE C',
                        id: sideC.id,
                        players: [],
                    },
                    sideB: {},
                }]
            });
        });

        it('cannot save side when no side selected', async () => {
            await renderComponent(
                containerProps.withTournament(tournamentData).build(),
                props(matchData, true, sideA, sideB, sideC),
                appProps({}, reportedError));
            await doClick(context.container.querySelector('div[datatype="sideA"]')!);
            const dialog = context.container.querySelector('.modal-dialog')!;
            await doSelectOption(dialog.querySelector('.form-group :nth-child(4) div.dropdown-menu'), '1');
            await doClick(findButton(dialog, 'Save'));

            context.prompts.alertWasShown('Select a side first');
            expect(updatedTournament).toEqual(null);
        });

        it('does not open edit dialog for sideA when not editable', async () => {
            const matchData: ILayoutDataForMatch = {
                scoreB: '7',
                scoreA: '5',
                sideA: { id: createTemporaryId(), link: (<span>SIDE A</span>), name: '', mnemonic: 'A' },
                sideB: { id: createTemporaryId(), link: (<span>SIDE B</span>), name: '', mnemonic: 'B' },
                mnemonic: 'M1',
                hideMnemonic: true,
            };
            await renderComponent(
                containerProps.withTournament(tournamentData).build(),
                props(matchData, false),
                appProps({}, reportedError));
            const sideB = context.container.querySelector('div[datatype="sideA"]')!;

            await doClick(sideB);

            const dialog = context.container.querySelector('.modal-dialog');
            expect(dialog).toBeFalsy();
        });

        it('opens edit dialog for sideA', async () => {
            const matchData: ILayoutDataForMatch = {
                scoreB: '7',
                scoreA: '5',
                sideA: { id: createTemporaryId(), link: (<span>SIDE A</span>), name: '', mnemonic: 'A' },
                sideB: { id: createTemporaryId(), link: (<span>SIDE B</span>), name: '', mnemonic: 'B' },
                mnemonic: 'M1',
                hideMnemonic: true,
            };
            await renderComponent(
                containerProps.withTournament(tournamentData).build(),
                props(matchData, true),
                appProps({}, reportedError));

            await doClick(context.container.querySelector('div[datatype="sideA"]')!);

            const dialog = context.container.querySelector('.modal-dialog')!;
            expect(dialog).toBeTruthy();
        });

        it('does not open edit dialog for sideB when not editable', async () => {
            const matchData: ILayoutDataForMatch = {
                scoreB: '7',
                scoreA: '5',
                sideA: { id: createTemporaryId(), link: (<span>SIDE A</span>), name: '', mnemonic: 'A' },
                sideB: { id: createTemporaryId(), link: (<span>SIDE B</span>), name: '', mnemonic: 'B' },
                mnemonic: 'M1',
                hideMnemonic: true,
            };
            await renderComponent(
                containerProps.withTournament(tournamentData).build(),
                props(matchData, false),
                appProps({}, reportedError));

            await doClick(context.container.querySelector('div[datatype="sideB"]')!);

            const dialog = context.container.querySelector('.modal-dialog');
            expect(dialog).toBeFalsy();
        });

        it('opens edit dialog for sideB', async () => {
            const matchData: ILayoutDataForMatch = {
                scoreB: '7',
                scoreA: '5',
                sideA: { id: createTemporaryId(), link: (<span>SIDE A</span>), name: '', mnemonic: 'A' },
                sideB: { id: createTemporaryId(), link: (<span>SIDE B</span>), name: '', mnemonic: 'B' },
                mnemonic: 'M1',
                hideMnemonic: true,
            };
            await renderComponent(
                containerProps.withTournament(tournamentData).build(),
                props(matchData, true),
                appProps({}, reportedError));

            await doClick(context.container.querySelector('div[datatype="sideB"]')!);

            const dialog = context.container.querySelector('.modal-dialog')!;
            expect(dialog).toBeTruthy();
        });

        it('can unset side A', async () => {
            const tournamentData: TournamentGameDto = tournamentBuilder()
                .round(r => r
                    .withMatch(m => m
                        .sideA(sideA, 5)
                        .sideB(sideB, 7)))
                .build();
            const matchData: ILayoutDataForMatch = {
                scoreB: '7',
                scoreA: '5',
                sideA: { id: createTemporaryId(), link: (<span>SIDE A</span>), name: '', mnemonic: 'A' },
                sideB: { id: createTemporaryId(), link: (<span>SIDE B</span>), name: '', mnemonic: 'B' },
                mnemonic: 'M1',
                hideMnemonic: true,
            };
            await renderComponent(
                containerProps.withTournament(tournamentData).build(),
                props(matchData, true),
                appProps({}, reportedError));
            await doClick(context.container.querySelector('div[datatype="sideA"]')!);

            await doClick(findButton(context.container.querySelector('.modal-dialog')!, 'Remove'));

            expect(updatedTournament!.round).toEqual({
                matchOptions: expect.any(Array),
                matches: [{
                    id: expect.any(String),
                    scoreA: null,
                    scoreB: 7,
                    sideA: {
                        players: [],
                    },
                    sideB: {
                        id: sideB.id,
                        name: sideB.name,
                        players: [],
                    },
                }],
            });
        });

        it('can unset side B', async () => {
            const tournamentData: TournamentGameDto = tournamentBuilder()
                .round(r => r
                    .withMatch(m => m
                        .sideA(sideA, 5)
                        .sideB(sideB, 7)))
                .build();
            const matchData: ILayoutDataForMatch = {
                scoreB: '7',
                scoreA: '5',
                sideA: { id: createTemporaryId(), link: (<span>SIDE A</span>), name: '', mnemonic: 'A' },
                sideB: { id: createTemporaryId(), link: (<span>SIDE B</span>), name: '', mnemonic: 'B' },
                mnemonic: 'M1',
                hideMnemonic: true,
            };
            await renderComponent(
                containerProps.withTournament(tournamentData).build(),
                props(matchData, true),
                appProps({}, reportedError));
            await doClick(context.container.querySelector('div[datatype="sideB"]')!);

            await doClick(findButton(context.container.querySelector('.modal-dialog')!, 'Remove'));

            expect(updatedTournament!.round).toEqual({
                matchOptions: expect.any(Array),
                matches: [{
                    id: expect.any(String),
                    scoreA: 5,
                    scoreB: null,
                    sideA: {
                        id: sideA.id,
                        name: sideA.name,
                        players: [],
                    },
                    sideB: {
                        players: [],
                    },
                }],
            });
        });

        it('removes match when sideA and sideB unset', async () => {
            const tournamentData: TournamentGameDto = tournamentBuilder()
                .round(r => r
                    .withMatch(m => m
                        .sideB(sideB, 7)))
                .build();
            const matchData: ILayoutDataForMatch = {
                scoreB: '7',
                scoreA: '5',
                sideA: { id: createTemporaryId(), link: (<span>SIDE A</span>), name: '', mnemonic: 'A' },
                sideB: { id: createTemporaryId(), link: (<span>SIDE B</span>), name: '', mnemonic: 'B' },
                mnemonic: 'M1',
                hideMnemonic: true,
            };
            await renderComponent(
                containerProps.withTournament(tournamentData).build(),
                props(matchData, true),
                appProps({}, reportedError));
            await doClick(context.container.querySelector('div[datatype="sideB"]')!);

            await doClick(findButton(context.container.querySelector('.modal-dialog')!, 'Remove'));

            expect(updatedTournament!.round).toEqual({
                matchOptions: expect.any(Array),
                matches: [],
            });
        });

        it('shows layout match options number of legs when present', async () => {
            matchData.matchOptions = matchOptionsBuilder().numberOfLegs(9).build();
            await renderComponent(
                containerProps.withTournament(tournamentData).build(),
                props(matchData, true, sideA, sideB, sideC),
                appProps({}, reportedError));
            await doClick(context.container.querySelector('div[datatype="sideB"]')!);

            const dialog = context.container.querySelector('.modal-dialog')!;
            const bestOf: HTMLInputElement = dialog.querySelector('input[name="bestOf"]')!;
            expect(bestOf.value).toContain('9');
            const scoreDropdownItems = Array.from(dialog.querySelectorAll('.form-group :nth-child(4) div.dropdown-menu .dropdown-item'));
            expect(scoreDropdownItems.map(i => i.textContent)).toEqual([ '0', '1', '2', '3', '4', '5']); // best of 9
        });

        it('shows default match options number of legs when match options not present', async () => {
            await renderComponent(
                containerProps.withTournament(tournamentData).build(),
                props(matchData, true, sideA, sideB, sideC),
                appProps({}, reportedError));
            await doClick(context.container.querySelector('div[datatype="sideB"]')!);

            const dialog = context.container.querySelector('.modal-dialog')!;
            const bestOf: HTMLInputElement = dialog.querySelector('input[name="bestOf"]')!;
            expect(bestOf.value).toContain('7');
            const scoreDropdownItems = Array.from(dialog.querySelectorAll('.form-group :nth-child(4) div.dropdown-menu .dropdown-item'));
            expect(scoreDropdownItems.map(i => i.textContent)).toEqual([ '0', '1', '2', '3', '4' ]); // best of 7
        });

        it('patches data in first round', async () => {
            const saygData = saygBuilder()
                .yourName('SIDE A')
                .opponentName('SIDE B')
                .scores(0, 0)
                .numberOfLegs(3)
                .startingScore(501)
                .addTo(saygDataLookup)
                .build();
            const tournamentData: TournamentGameDto = tournamentBuilder()
                .round(r => r
                    .withMatch(m => m
                        .sideA(sideA)
                        .sideB(sideB)
                        .saygId(saygData.id)))
                .build();
            const matchData: ILayoutDataForMatch = {
                scoreB: '',
                scoreA: '',
                sideA: { id: createTemporaryId(), link: (<span>SIDE A</span>), name: '', mnemonic: 'A' },
                sideB: { id: createTemporaryId(), link: (<span>SIDE B</span>), name: '', mnemonic: 'B' },
                mnemonic: 'M1',
                hideMnemonic: true,
                match: tournamentData.round!.matches![0],
            };
            await renderComponent(
                containerProps.withTournament(tournamentData).build(),
                patchable(props(matchData, true)),
                appProps({ account: user(true) }, reportedError));

            await doClick(findButton(context.container, START_SCORING));
            reportedError.verifyNoError();
            const saygDialog = context.container.querySelector('.modal-dialog');
            // set sideA to play first
            await doClick(findButton(saygDialog, '🎯SIDE A'));

            //verify patch data
            reportedError.verifyNoError();
            expect(patchedData).toEqual([{
                nestInRound: true,
                patch: {
                    match: {
                        scoreA: 0,
                        scoreB: 0,
                        sideA: sideA.id,
                        sideB: sideB.id,
                    }
                }
            }]);
        });

        it('patches data in second round', async () => {
            const saygData = saygBuilder()
                .yourName('SIDE A')
                .opponentName('SIDE B')
                .scores(0, 0)
                .numberOfLegs(3)
                .startingScore(501)
                .addTo(saygDataLookup)
                .build();
            const tournamentData: TournamentGameDto = tournamentBuilder()
                .round(r => r
                    .withMatch(m => m
                        .sideA(sideA)
                        .sideB(sideB)
                        .saygId(saygData.id)))
                .build();
            const matchData: ILayoutDataForMatch = {
                scoreB: '',
                scoreA: '',
                sideA: { id: createTemporaryId(), link: (<span>SIDE A</span>), name: '', mnemonic: 'A' },
                sideB: { id: createTemporaryId(), link: (<span>SIDE B</span>), name: '', mnemonic: 'B' },
                mnemonic: 'M1',
                hideMnemonic: true,
                match: tournamentData!.round!.matches![0],
            };
            await renderComponent(
                containerProps.withTournament(tournamentData).build(),
                patchable(withRoundIndex(props(matchData, true), 1)),
                appProps({ account: user(true) }, reportedError));

            await doClick(findButton(context.container, START_SCORING));
            reportedError.verifyNoError();
            const saygDialog = context.container.querySelector('.modal-dialog');
            // set sideA to play first
            await doClick(findButton(saygDialog, '🎯SIDE A'));

            //verify patch data
            reportedError.verifyNoError();
            expect(patchedData).toEqual([{
                nestInRound: true,
                patch: {
                    nextRound: {
                        match: {
                            scoreA: 0,
                            scoreB: 0,
                            sideA: sideA.id,
                            sideB: sideB.id,
                        }
                    }
                }
            }]);
        });

        it('cannot view scores for match without sayg', async () => {
            const tournamentData: TournamentGameDto = tournamentBuilder()
                .round(r => r
                    .withMatch(m => m
                        .sideA(sideA)
                        .sideB(sideB)))
                .build();
            const matchData: ILayoutDataForMatch = {
                scoreA: '1',
                scoreB: '2',
                sideA: { id: createTemporaryId(), link: (<span>SIDE A</span>), name: '', mnemonic: 'A' },
                sideB: { id: createTemporaryId(), link: (<span>SIDE B</span>), name: '', mnemonic: 'B' },
                mnemonic: 'M1',
                hideMnemonic: true,
                match: tournamentData!.round!.matches![0],
            };
            await renderComponent(
                containerProps.withTournament(tournamentData).build(),
                patchable(props(matchData, true)),
                appProps({ }, reportedError));

            expect(context.container.innerHTML).not.toContain('📊');
        });

        it('can view scores for match with sayg', async () => {
            const matchData: ILayoutDataForMatch = {
                scoreA: '1',
                scoreB: '2',
                sideA: { id: createTemporaryId(), link: (<span>SIDE A</span>), name: '', mnemonic: 'A' },
                sideB: { id: createTemporaryId(), link: (<span>SIDE B</span>), name: '', mnemonic: 'B' },
                mnemonic: 'M1',
                hideMnemonic: true,
                match: tournamentDataWithMatch!.round!.matches![0],
            };
            await renderComponent(
                containerProps.withTournament(tournamentDataWithMatch).build(),
                patchable(props(matchData, true)),
                appProps({ }, reportedError));

            expect(context.container.innerHTML).toContain('📊');
            const link = findButton(context.container, '📊 ');
            expect(link.href).toEqual(`http://localhost/live/match/?id=${saygData.id}`);
        });

        it('can delete sayg from match and keep scores', async () => {
            const tournamentDataWithoutSayg: TournamentGameDto = tournamentBuilder()
                .round(r => r
                    .withMatch(m => m
                        .sideA(sideA, 1)
                        .sideB(sideB, 2)))
                .build();
            const matchData: ILayoutDataForMatch = {
                scoreA: '1',
                scoreB: '2',
                sideA: { id: createTemporaryId(), link: (<span>SIDE A</span>), name: '', mnemonic: 'A' },
                sideB: { id: createTemporaryId(), link: (<span>SIDE B</span>), name: '', mnemonic: 'B' },
                mnemonic: 'M1',
                hideMnemonic: true,
                match: tournamentDataWithMatch!.round!.matches![0],
                saygId: saygData.id,
            };
            await renderComponent(
                containerProps.withTournament(tournamentDataWithMatch).build(),
                withRound(patchable(props(matchData, true)), tournamentDataWithMatch!.round!),
                appProps({ account: user(true, true) }, reportedError));
            context.prompts.respondToConfirm('Are you sure you want to delete the sayg data for this match?', true);
            context.prompts.respondToConfirm('Clear match score (to allow scores to be re-recorded?)', false);
            deletedSaygResponse = {
                success: true,
                result: tournamentDataWithoutSayg,
            };

            await doClick(findButton(context.container, START_SCORING));
            const dialog = context.container.querySelector('.modal-dialog')!;
            expect(dialog).toBeTruthy();
            await doClick(findButton(dialog, 'Debug options'));
            await doSelectOption(dialog.querySelector('[datatype="debug-options"] .dropdown-menu'), 'Delete sayg');

            reportedError.verifyNoError();
            expect(deletedSayg).toEqual({
                id: tournamentDataWithMatch.id,
                matchId: tournamentDataWithMatch!.round!.matches![0].id,
            });
            expect(updatedTournament!.round!.matches![0].saygId).toBeFalsy();
            expect(updatedTournament!.round!.matches![0].scoreA).toEqual(1);
            expect(updatedTournament!.round!.matches![0].scoreB).toEqual(2);
        });

        it('can delete sayg from match and clear scores', async () => {
            const tournamentDataWithoutSayg: TournamentGameDto = tournamentBuilder()
                .round(r => r
                    .withMatch(m => m
                        .sideA(sideA)
                        .sideB(sideB)))
                .build();
            const matchData: ILayoutDataForMatch = {
                scoreA: '1',
                scoreB: '2',
                sideA: { id: createTemporaryId(), link: (<span>SIDE A</span>), name: '', mnemonic: 'A' },
                sideB: { id: createTemporaryId(), link: (<span>SIDE B</span>), name: '', mnemonic: 'B' },
                mnemonic: 'M1',
                hideMnemonic: true,
                match: tournamentDataWithMatch!.round!.matches![0],
                saygId: saygData.id,
            };
            await renderComponent(
                containerProps.withTournament(tournamentDataWithMatch).build(),
                withRound(patchable(props(matchData, true)), tournamentDataWithMatch!.round!),
                appProps({ account: user(true, true) }, reportedError));
            context.prompts.respondToConfirm('Are you sure you want to delete the sayg data for this match?', true);
            context.prompts.respondToConfirm('Clear match score (to allow scores to be re-recorded?)', true);
            deletedSaygResponse = {
                success: true,
                result: tournamentDataWithoutSayg,
            };

            await doClick(findButton(context.container, START_SCORING));
            const dialog = context.container.querySelector('.modal-dialog')!;
            expect(dialog).toBeTruthy();
            await doClick(findButton(dialog, 'Debug options'));
            await doSelectOption(dialog.querySelector('[datatype="debug-options"] .dropdown-menu'), 'Delete sayg');

            reportedError.verifyNoError();
            expect(deletedSayg).toEqual({
                id: tournamentDataWithMatch.id,
                matchId: tournamentDataWithMatch!.round!.matches![0].id,
            });
            expect(updatedTournament!.round!.matches![0].saygId).toBeFalsy();
            expect(updatedTournament!.round!.matches![0].scoreA).toEqual(0);
            expect(updatedTournament!.round!.matches![0].scoreB).toEqual(0);
        });

        it('handles error deleting sayg from match', async () => {
            const matchData: ILayoutDataForMatch = {
                scoreA: '1',
                scoreB: '2',
                sideA: { id: createTemporaryId(), link: (<span>SIDE A</span>), name: '', mnemonic: 'A' },
                sideB: { id: createTemporaryId(), link: (<span>SIDE B</span>), name: '', mnemonic: 'B' },
                mnemonic: 'M1',
                hideMnemonic: true,
                match: tournamentDataWithMatch!.round!.matches![0],
                saygId: saygData.id,
            };
            await renderComponent(
                containerProps.withTournament(tournamentDataWithMatch).build(),
                withRound(patchable(props(matchData, true)), tournamentDataWithMatch!.round!),
                appProps({ account: user(true, true) }, reportedError));
            context.prompts.respondToConfirm('Are you sure you want to delete the sayg data for this match?', true);
            deletedSaygResponse = {
                success: false,
            }

            await doClick(findButton(context.container, START_SCORING));
            const dialog = context.container.querySelector('.modal-dialog')!;
            expect(dialog).toBeTruthy();
            await doClick(findButton(dialog, 'Debug options'));
            await doSelectOption(dialog.querySelector('[datatype="debug-options"] .dropdown-menu'), 'Delete sayg');

            expect(deletedSayg).toEqual({
                id: tournamentDataWithMatch.id,
                matchId: tournamentDataWithMatch!.round!.matches![0].id,
            });
            expect(updatedTournament).toBeNull();
        });
    });
});