import {
    api,
    appProps,
    brandingProps,
    cleanUp,
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
import {
    ITournamentMatchBuilder,
    ITournamentRoundBuilder,
    sideBuilder,
    tournamentBuilder
} from "../../helpers/builders/tournaments";
import {ILayoutDataForMatch} from "./layout";
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

describe('PrintableSheetMatch', () => {
    let context: TestContext;
    let reportedError: ErrorState;
    let updatedTournament: TournamentGameDto;
    let patchedData: {patch: PatchTournamentDto | PatchTournamentRoundDto, nestInRound?: boolean}[];
    let saygDataLookup: { [id: string]: RecordedScoreAsYouGoDto };

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

    afterEach(() => {
        cleanUp(context);
    });

    beforeEach(() => {
        reportedError = new ErrorState();
        updatedTournament = null;
        patchedData = [];
        saygDataLookup = {};
    });

    async function patchData(patch: PatchTournamentDto | PatchTournamentRoundDto, nestInRound?: boolean) {
        patchedData.push({patch, nestInRound});
    }

    async function setTournamentData(update: TournamentGameDto) {
        updatedTournament = update;
    }

    function setPreventScroll(_: boolean) {
    }

    async function renderComponent(containerProps: ITournamentContainerProps, props: IPrintableSheetMatchProps, appProps: IAppContainerProps) {
        context = await renderApp(
            iocProps({saygApi}),
            brandingProps(),
            appProps,
            (<TournamentContainer {...containerProps}>
                <PrintableSheetMatch {...props} />
            </TournamentContainer>));
    }

    describe('renders', () => {
        const matchOptionDefaults: GameMatchOptionDto = matchOptionsBuilder().build();

        it('match mnemonic', async () => {
            const tournamentData: TournamentGameDto = tournamentBuilder().build();
            const matchData: ILayoutDataForMatch = {
                scoreB: '',
                scoreA: '',
                sideA: { id: createTemporaryId(), link: null, name: '', mnemonic: 'A' },
                sideB: { id: createTemporaryId(), link: null, name: '', mnemonic: 'B' },
                mnemonic: 'M1',
            };
            await renderComponent({
                tournamentData,
                setTournamentData,
                matchOptionDefaults,
                preventScroll: false,
                setPreventScroll,
            }, {
                matchData,
                matchIndex: 0,
                roundIndex: 0,
                possibleSides: [],
            }, appProps({}, reportedError));

            const matchMnemonic = context.container.querySelector('span[datatype="match-mnemonic"]');
            expect(matchMnemonic).toBeTruthy();
            expect(matchMnemonic.textContent).toEqual('M1');
        });

        it('when no match mnemonic', async () => {
            const tournamentData: TournamentGameDto = tournamentBuilder().build();
            const matchData: ILayoutDataForMatch = {
                scoreB: '',
                scoreA: '',
                sideA: { id: createTemporaryId(), link: null, name: '', mnemonic: 'A' },
                sideB: { id: createTemporaryId(), link: null, name: '', mnemonic: 'B' },
                mnemonic: 'M1',
                hideMnemonic: true,
            };
            await renderComponent({
                tournamentData,
                setTournamentData,
                matchOptionDefaults,
                preventScroll: false,
                setPreventScroll,
            }, {
                matchData,
                matchIndex: 0,
                roundIndex: 0,
                possibleSides: [],
            }, appProps({}, reportedError));

            const matchMnemonic = context.container.querySelector('span[datatype="match-mnemonic"]');
            expect(matchMnemonic).toBeFalsy();
        });

        it('sideA', async () => {
            const tournamentData: TournamentGameDto = tournamentBuilder().build();
            const matchData: ILayoutDataForMatch = {
                scoreB: '',
                scoreA: '5',
                sideA: { id: createTemporaryId(), link: (<span>SIDE A</span>), name: '', mnemonic: 'A' },
                sideB: { id: createTemporaryId(), link: (<span>SIDE B</span>), name: '', mnemonic: 'B' },
                mnemonic: 'M1',
                hideMnemonic: true,
            };
            await renderComponent({
                tournamentData,
                setTournamentData,
                matchOptionDefaults,
                preventScroll: false,
                setPreventScroll,
            }, {
                matchData,
                matchIndex: 0,
                roundIndex: 0,
                possibleSides: [],
            }, appProps({}, reportedError));

            const sideA = context.container.querySelector('div[datatype="sideA"]');
            expect(sideA).toBeTruthy();
            expect(sideA.querySelector('span[datatype="sideAname"]').textContent).toEqual('SIDE A');
            expect(sideA.querySelector('div[datatype="scoreA"]').textContent).toEqual('5');
        });

        it('sideB', async () => {
            const tournamentData: TournamentGameDto = tournamentBuilder().build();
            const matchData: ILayoutDataForMatch = {
                scoreB: '7',
                scoreA: '5',
                sideA: { id: createTemporaryId(), link: (<span>SIDE A</span>), name: '', mnemonic: 'A' },
                sideB: { id: createTemporaryId(), link: (<span>SIDE B</span>), name: '', mnemonic: 'B' },
                mnemonic: 'M1',
                hideMnemonic: true,
            };
            await renderComponent({
                tournamentData,
                setTournamentData,
                matchOptionDefaults,
                preventScroll: false,
                setPreventScroll,
            }, {
                matchData,
                matchIndex: 0,
                roundIndex: 0,
                possibleSides: [],
            }, appProps({}, reportedError));

            const sideB = context.container.querySelector('div[datatype="sideB"]');
            expect(sideB).toBeTruthy();
            expect(sideB.querySelector('span[datatype="sideBname"]').textContent).toEqual('SIDE B');
            expect(sideB.querySelector('div[datatype="scoreB"]').textContent).toEqual('7');
        });

        it('bye', async () => {
            const tournamentData: TournamentGameDto = tournamentBuilder().build();
            const matchData: ILayoutDataForMatch = {
                scoreB: '',
                scoreA: '5',
                sideA: { id: createTemporaryId(), link: (<span>SIDE A</span>), name: '', mnemonic: 'A' },
                sideB: null,
                mnemonic: 'M1',
                bye: true,
            };
            await renderComponent({
                tournamentData,
                setTournamentData,
                matchOptionDefaults,
                preventScroll: false,
                setPreventScroll,
            }, {
                matchData,
                matchIndex: 0,
                roundIndex: 0,
                possibleSides: [],
            }, appProps({}, reportedError));

            const sideB = context.container.querySelector('div[datatype="sideB"]');
            expect(sideB).toBeFalsy();
        });
    });

    describe('interactivity', () => {
        const matchOptionDefaults: GameMatchOptionDto = matchOptionsBuilder().numberOfLegs(7).build();
        const sideA = sideBuilder('SIDE A').build();
        const sideB = sideBuilder('SIDE B').build();
        const sideC = sideBuilder('SIDE C').build();

        it('can change side and score for sideA', async () => {
            const tournamentData: TournamentGameDto = tournamentBuilder().build();
            const matchData: ILayoutDataForMatch = {
                scoreB: '7',
                scoreA: '5',
                sideA: { id: null, name: null, link: null },
                sideB: { id: null, name: null, link: null },
                mnemonic: 'M1',
                hideMnemonic: true,
            };
            await renderComponent({
                tournamentData,
                setTournamentData,
                matchOptionDefaults,
                preventScroll: false,
                setPreventScroll,
            }, {
                matchData,
                matchIndex: 0,
                roundIndex: 0,
                possibleSides: [sideA, sideB, sideC],
                editable: true,
            }, appProps({}, reportedError));
            const side = context.container.querySelector('div[datatype="sideA"]');
            await doClick(side);
            const dialog = context.container.querySelector('.modal-dialog');
            await doSelectOption(dialog.querySelector('.form-group :nth-child(2) div.dropdown-menu'), 'SIDE C');
            await doSelectOption(dialog.querySelector('.form-group :nth-child(4) div.dropdown-menu'), '1');
            await doClick(findButton(dialog, 'Save'));

            expect(updatedTournament.round).toEqual({
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
                    sideB: {
                        id: null,
                        name: null,
                    },
                }]
            });
        });

        it('can change side and score for sideB', async () => {
            const tournamentData: TournamentGameDto = tournamentBuilder().build();
            const matchData: ILayoutDataForMatch = {
                scoreB: '7',
                scoreA: '5',
                sideA: { id: null, name: null, link: null },
                sideB: { id: null, name: null, link: null },
                mnemonic: 'M1',
                hideMnemonic: true,
            };
            await renderComponent({
                tournamentData,
                setTournamentData,
                matchOptionDefaults,
                preventScroll: false,
                setPreventScroll,
            }, {
                matchData,
                matchIndex: 0,
                roundIndex: 0,
                possibleSides: [sideA, sideB, sideC],
                editable: true,
            }, appProps({}, reportedError));
            const side = context.container.querySelector('div[datatype="sideB"]');
            await doClick(side);
            const dialog = context.container.querySelector('.modal-dialog');
            await doSelectOption(dialog.querySelector('.form-group :nth-child(2) div.dropdown-menu'), 'SIDE C');
            await doSelectOption(dialog.querySelector('.form-group :nth-child(4) div.dropdown-menu'), '1');
            await doClick(findButton(dialog, 'Save'));

            expect(updatedTournament.round).toEqual({
                id: expect.any(String),
                matchOptions: expect.any(Array),
                matches: [{
                    id: expect.any(String),
                    scoreB: 1,
                    sideA: {
                        id: null,
                        name: null,
                    },
                    sideB: {
                        name: 'SIDE C',
                        id: sideC.id,
                        players: [],
                    },
                }]
            });
        });

        it('does not open dialog match in subsequent round when first round is not complete', async () => {
            const tournamentData: TournamentGameDto = tournamentBuilder()
                .round((r: ITournamentRoundBuilder) => r
                    .round((r: ITournamentRoundBuilder) => r
                        .withMatch((m: ITournamentMatchBuilder) => m.sideA(sideA, 5).sideB(sideB, 7))))
                .build();
            const nestedMatchData: ILayoutDataForMatch = {
                scoreB: '7',
                scoreA: '5',
                sideA: { id: createTemporaryId(), link: (<span>SIDE A</span>), name: '', mnemonic: 'A' },
                sideB: { id: createTemporaryId(), link: (<span>SIDE B</span>), name: '', mnemonic: 'B' },
                mnemonic: 'M1',
                hideMnemonic: true,
            };
            await renderComponent({
                tournamentData,
                setTournamentData,
                matchOptionDefaults,
                preventScroll: false,
                setPreventScroll,
            }, {
                matchData: nestedMatchData,
                matchIndex: 0,
                roundIndex: 1,
                possibleSides: [],
                editable: true,
            }, appProps({}, reportedError));
            let alert: string;
            window.alert = (msg) => alert = msg;
            await doClick(context.container.querySelector('div[datatype="sideB"]'));

            expect(alert).toEqual('Finish entering data for the previous rounds first');
        });

        it('can change side properties for match in subsequent round', async () => {
            const tournamentData: TournamentGameDto = tournamentBuilder()
                .round((r: ITournamentRoundBuilder) => r
                    .withMatch((m: ITournamentMatchBuilder) => m.sideA(sideA, 5).sideB(sideC, 1))
                    .round((r: ITournamentRoundBuilder) => r
                        .withMatch((m: ITournamentMatchBuilder) => m.sideA(sideA, 5).sideB(sideB, 7))))
                .build();
            const nestedMatchData: ILayoutDataForMatch = {
                scoreB: '7',
                scoreA: '5',
                sideA: { id: createTemporaryId(), link: (<span>SIDE A</span>), name: '', mnemonic: 'A' },
                sideB: { id: sideB.id, link: (<span>SIDE B</span>), name: '', mnemonic: 'B' },
                mnemonic: 'M1',
                hideMnemonic: true,
            };
            await renderComponent({
                tournamentData,
                setTournamentData,
                matchOptionDefaults,
                preventScroll: false,
                setPreventScroll,
            }, {
                matchData: nestedMatchData,
                matchIndex: 0,
                roundIndex: 1,
                possibleSides: [sideA, sideB],
                editable: true,
            }, appProps({}, reportedError));
            await doClick(context.container.querySelector('div[datatype="sideB"]'));
            const dialog = context.container.querySelector('.modal-dialog');
            await doSelectOption(dialog.querySelector('.form-group :nth-child(4) div.dropdown-menu'), '3');
            await doClick(findButton(dialog, 'Save'));

            expect(updatedTournament.round.nextRound).toEqual({
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
                nextRound: null,
            });
        });

        it('preselects side to mnemonic', async () => {
            const tournamentData: TournamentGameDto = tournamentBuilder().build();
            const matchData: ILayoutDataForMatch = {
                scoreB: '7',
                scoreA: '5',
                sideA: { id: null, name: null, link: null, mnemonic: sideC.name },
                sideB: { id: null, name: null, link: null },
                mnemonic: 'M1',
                hideMnemonic: true,
            };
            await renderComponent({
                tournamentData,
                setTournamentData,
                matchOptionDefaults,
                preventScroll: false,
                setPreventScroll,
            }, {
                matchData,
                matchIndex: 0,
                roundIndex: 0,
                possibleSides: [sideA, sideB, sideC],
                editable: true,
            }, appProps({}, reportedError));
            const side = context.container.querySelector('div[datatype="sideA"]');
            await doClick(side);
            const dialog = context.container.querySelector('.modal-dialog');
            await doSelectOption(dialog.querySelector('.form-group :nth-child(4) div.dropdown-menu'), '1');
            await doClick(findButton(dialog, 'Save'));

            expect(updatedTournament.round).toEqual({
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
                    sideB: {
                        id: null,
                        name: null,
                    },
                }]
            });
        });

        it('cannot save side when no side selected', async () => {
            const tournamentData: TournamentGameDto = tournamentBuilder().build();
            const matchData: ILayoutDataForMatch = {
                scoreB: '7',
                scoreA: '5',
                sideA: { id: null, name: null, link: null },
                sideB: { id: null, name: null, link: null },
                mnemonic: 'M1',
                hideMnemonic: true,
            };
            await renderComponent({
                tournamentData,
                setTournamentData,
                matchOptionDefaults,
                preventScroll: false,
                setPreventScroll,
            }, {
                matchData,
                matchIndex: 0,
                roundIndex: 0,
                possibleSides: [sideA, sideB, sideC],
                editable: true,
            }, appProps({}, reportedError));
            let alert: string;
            window.alert = (msg) => alert = msg;
            const side = context.container.querySelector('div[datatype="sideA"]');
            await doClick(side);
            const dialog = context.container.querySelector('.modal-dialog');
            await doSelectOption(dialog.querySelector('.form-group :nth-child(4) div.dropdown-menu'), '1');
            await doClick(findButton(dialog, 'Save'));

            expect(alert).toEqual('Select a side first');
            expect(updatedTournament).toEqual(null);
        });

        it('does not open edit dialog for sideA when not editable', async () => {
            const tournamentData: TournamentGameDto = tournamentBuilder().build();
            const matchData: ILayoutDataForMatch = {
                scoreB: '7',
                scoreA: '5',
                sideA: { id: createTemporaryId(), link: (<span>SIDE A</span>), name: '', mnemonic: 'A' },
                sideB: { id: createTemporaryId(), link: (<span>SIDE B</span>), name: '', mnemonic: 'B' },
                mnemonic: 'M1',
                hideMnemonic: true,
            };
            await renderComponent({
                tournamentData,
                setTournamentData,
                matchOptionDefaults,
                preventScroll: false,
                setPreventScroll,
            }, {
                matchData,
                matchIndex: 0,
                roundIndex: 0,
                possibleSides: [],
                editable: false,
            }, appProps({}, reportedError));
            const sideB = context.container.querySelector('div[datatype="sideA"]');

            await doClick(sideB);

            const dialog = context.container.querySelector('.modal-dialog');
            expect(dialog).toBeFalsy();
        });

        it('opens edit dialog for sideA', async () => {
            const tournamentData: TournamentGameDto = tournamentBuilder().build();
            const matchData: ILayoutDataForMatch = {
                scoreB: '7',
                scoreA: '5',
                sideA: { id: createTemporaryId(), link: (<span>SIDE A</span>), name: '', mnemonic: 'A' },
                sideB: { id: createTemporaryId(), link: (<span>SIDE B</span>), name: '', mnemonic: 'B' },
                mnemonic: 'M1',
                hideMnemonic: true,
            };
            await renderComponent({
                tournamentData,
                setTournamentData,
                matchOptionDefaults,
                preventScroll: false,
                setPreventScroll,
            }, {
                matchData,
                matchIndex: 0,
                roundIndex: 0,
                possibleSides: [],
                editable: true,
            }, appProps({}, reportedError));
            const sideB = context.container.querySelector('div[datatype="sideA"]');

            await doClick(sideB);

            const dialog = context.container.querySelector('.modal-dialog');
            expect(dialog).toBeTruthy();
        });

        it('does not open edit dialog for sideB when not editable', async () => {
            const tournamentData: TournamentGameDto = tournamentBuilder().build();
            const matchData: ILayoutDataForMatch = {
                scoreB: '7',
                scoreA: '5',
                sideA: { id: createTemporaryId(), link: (<span>SIDE A</span>), name: '', mnemonic: 'A' },
                sideB: { id: createTemporaryId(), link: (<span>SIDE B</span>), name: '', mnemonic: 'B' },
                mnemonic: 'M1',
                hideMnemonic: true,
            };
            await renderComponent({
                tournamentData,
                setTournamentData,
                matchOptionDefaults,
                preventScroll: false,
                setPreventScroll,
            }, {
                matchData,
                matchIndex: 0,
                roundIndex: 0,
                possibleSides: [],
                editable: false,
            }, appProps({}, reportedError));
            const sideB = context.container.querySelector('div[datatype="sideB"]');

            await doClick(sideB);

            const dialog = context.container.querySelector('.modal-dialog');
            expect(dialog).toBeFalsy();
        });

        it('opens edit dialog for sideB', async () => {
            const tournamentData: TournamentGameDto = tournamentBuilder().build();
            const matchData: ILayoutDataForMatch = {
                scoreB: '7',
                scoreA: '5',
                sideA: { id: createTemporaryId(), link: (<span>SIDE A</span>), name: '', mnemonic: 'A' },
                sideB: { id: createTemporaryId(), link: (<span>SIDE B</span>), name: '', mnemonic: 'B' },
                mnemonic: 'M1',
                hideMnemonic: true,
            };
            await renderComponent({
                tournamentData,
                setTournamentData,
                matchOptionDefaults,
                preventScroll: false,
                setPreventScroll,
            }, {
                matchData,
                matchIndex: 0,
                roundIndex: 0,
                possibleSides: [],
                editable: true,
            }, appProps({}, reportedError));
            const sideB = context.container.querySelector('div[datatype="sideB"]');

            await doClick(sideB);

            const dialog = context.container.querySelector('.modal-dialog');
            expect(dialog).toBeTruthy();
        });

        it('can unset side A', async () => {
            const tournamentData: TournamentGameDto = tournamentBuilder()
                .round((r: ITournamentRoundBuilder) => r
                    .withMatch((m: ITournamentMatchBuilder) => m
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
            await renderComponent({
                tournamentData,
                setTournamentData,
                matchOptionDefaults,
                preventScroll: false,
                setPreventScroll,
            }, {
                matchData,
                matchIndex: 0,
                roundIndex: 0,
                possibleSides: [],
                editable: true,
            }, appProps({}, reportedError));
            await doClick(context.container.querySelector('div[datatype="sideA"]'));
            const dialog = context.container.querySelector('.modal-dialog');

            await doClick(findButton(dialog, 'Remove'));

            expect(updatedTournament.round).toEqual({
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
                nextRound: null,
            });
        });

        it('can unset side B', async () => {
            const tournamentData: TournamentGameDto = tournamentBuilder()
                .round((r: ITournamentRoundBuilder) => r
                    .withMatch((m: ITournamentMatchBuilder) => m
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
            await renderComponent({
                tournamentData,
                setTournamentData,
                matchOptionDefaults,
                preventScroll: false,
                setPreventScroll,
            }, {
                matchData,
                matchIndex: 0,
                roundIndex: 0,
                possibleSides: [],
                editable: true,
            }, appProps({}, reportedError));
            await doClick(context.container.querySelector('div[datatype="sideB"]'));
            const dialog = context.container.querySelector('.modal-dialog');

            await doClick(findButton(dialog, 'Remove'));

            expect(updatedTournament.round).toEqual({
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
                nextRound: null,
            });
        });

        it('removes match when sideA and sideB unset', async () => {
            const tournamentData: TournamentGameDto = tournamentBuilder()
                .round((r: ITournamentRoundBuilder) => r
                    .withMatch((m: ITournamentMatchBuilder) => m
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
            await renderComponent({
                tournamentData,
                setTournamentData,
                matchOptionDefaults,
                preventScroll: false,
                setPreventScroll,
            }, {
                matchData,
                matchIndex: 0,
                roundIndex: 0,
                possibleSides: [],
                editable: true,
            }, appProps({}, reportedError));
            await doClick(context.container.querySelector('div[datatype="sideB"]'));
            const dialog = context.container.querySelector('.modal-dialog');

            await doClick(findButton(dialog, 'Remove'));

            expect(updatedTournament.round).toEqual({
                matchOptions: expect.any(Array),
                matches: [],
                nextRound: null,
            });
        });

        it('shows layout match options number of legs when present', async () => {
            const tournamentData: TournamentGameDto = tournamentBuilder().build();
            const matchOptions: GameMatchOptionDto = matchOptionsBuilder().numberOfLegs(9).build();
            const matchData: ILayoutDataForMatch = {
                scoreB: '7',
                scoreA: '5',
                sideA: { id: null, name: null, link: null },
                sideB: { id: null, name: null, link: null },
                mnemonic: 'M1',
                hideMnemonic: true,
                matchOptions,
            };
            await renderComponent({
                tournamentData,
                setTournamentData,
                matchOptionDefaults,
                preventScroll: false,
                setPreventScroll,
            }, {
                matchData,
                matchIndex: 0,
                roundIndex: 0,
                possibleSides: [sideA, sideB, sideC],
                editable: true,
            }, appProps({}, reportedError));
            const side = context.container.querySelector('div[datatype="sideB"]');
            await doClick(side);

            const dialog = context.container.querySelector('.modal-dialog');
            expect(dialog.textContent).toContain('Best of 9');
            const scoreDropdownItems = Array.from(dialog.querySelectorAll('.form-group :nth-child(4) div.dropdown-menu .dropdown-item'));
            expect(scoreDropdownItems.map(i => i.textContent)).toEqual([ '0', '1', '2', '3', '4', '5']); // best of 9
        });

        it('shows default match options number of legs when match options not present', async () => {
            const tournamentData: TournamentGameDto = tournamentBuilder().build();
            const matchData: ILayoutDataForMatch = {
                scoreB: '7',
                scoreA: '5',
                sideA: { id: null, name: null, link: null },
                sideB: { id: null, name: null, link: null },
                mnemonic: 'M1',
                hideMnemonic: true,
            };
            await renderComponent({
                tournamentData,
                setTournamentData,
                matchOptionDefaults,
                preventScroll: false,
                setPreventScroll,
            }, {
                matchData,
                matchIndex: 0,
                roundIndex: 0,
                possibleSides: [sideA, sideB, sideC],
                editable: true,
            }, appProps({}, reportedError));
            const side = context.container.querySelector('div[datatype="sideB"]');
            await doClick(side);

            const dialog = context.container.querySelector('.modal-dialog');
            expect(dialog.textContent).toContain('Best of 7');
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
                .round((r: ITournamentRoundBuilder) => r
                    .withMatch((m: ITournamentMatchBuilder) => m
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
                match: tournamentData.round.matches[0],
            };
            const account: UserDto = {
                name: '',
                emailAddress: '',
                givenName: '',
                access: {
                    recordScoresAsYouGo: true,
                },
            }
            await renderComponent({
                tournamentData,
                setTournamentData,
                matchOptionDefaults,
                preventScroll: false,
                setPreventScroll,
            }, {
                matchData,
                matchIndex: 0,
                roundIndex: 0,
                possibleSides: [],
                editable: true,
                patchData
            }, appProps({ account }, reportedError));

            await doClick(findButton(context.container, '📊'));
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
                .round((r: ITournamentRoundBuilder) => r
                    .withMatch((m: ITournamentMatchBuilder) => m
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
                match: tournamentData.round.matches[0],
            };
            const account: UserDto = {
                name: '',
                emailAddress: '',
                givenName: '',
                access: {
                    recordScoresAsYouGo: true,
                },
            }
            await renderComponent({
                tournamentData,
                setTournamentData,
                matchOptionDefaults,
                preventScroll: false,
                setPreventScroll,
            }, {
                matchData,
                matchIndex: 0,
                roundIndex: 1,
                possibleSides: [],
                editable: true,
                patchData
            }, appProps({ account }, reportedError));

            await doClick(findButton(context.container, '📊'));
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
    });
});