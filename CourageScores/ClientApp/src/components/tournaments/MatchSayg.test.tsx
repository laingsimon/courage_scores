import {
    api,
    appProps,
    brandingProps,
    cleanUp, doChange,
    doClick,
    ErrorState, findButton,
    iocProps,
    renderApp,
    TestContext
} from "../../helpers/tests";
import {ITournamentContainerProps, TournamentContainer} from "./TournamentContainer";
import {UserDto} from "../../interfaces/models/dtos/Identity/UserDto";
import {IMatchSaygProps, MatchSayg} from "./MatchSayg";
import {TournamentGameDto} from "../../interfaces/models/dtos/Game/TournamentGameDto";
import {
    ITournamentSideBuilder,
    roundBuilder,
    sideBuilder,
    tournamentBuilder,
    tournamentMatchBuilder
} from "../../helpers/builders/tournaments";
import {matchOptionsBuilder} from "../../helpers/builders/games";
import {TournamentRoundDto} from "../../interfaces/models/dtos/Game/TournamentRoundDto";
import {PatchTournamentDto} from "../../interfaces/models/dtos/Game/PatchTournamentDto";
import {PatchTournamentRoundDto} from "../../interfaces/models/dtos/Game/PatchTournamentRoundDto";
import {createTemporaryId, repeat} from "../../helpers/projection";
import {ITournamentGameApi} from "../../interfaces/apis/ITournamentGameApi";
import {CreateTournamentSaygDto} from "../../interfaces/models/dtos/Game/CreateTournamentSaygDto";
import {IClientActionResultDto} from "../common/IClientActionResultDto";
import {ISaygApi} from "../../interfaces/apis/ISaygApi";
import {UpdateRecordedScoreAsYouGoDto} from "../../interfaces/models/dtos/Game/Sayg/UpdateRecordedScoreAsYouGoDto";
import {RecordedScoreAsYouGoDto} from "../../interfaces/models/dtos/Game/Sayg/RecordedScoreAsYouGoDto";
import {saygBuilder} from "../../helpers/builders/sayg";
import {TournamentMatchDto} from "../../interfaces/models/dtos/Game/TournamentMatchDto";

describe('MatchSayg', () => {
    let context: TestContext;
    let reportedError: ErrorState;
    let updatedTournament: TournamentGameDto;
    let changedData: TournamentRoundDto;
    let patchedData: { patch: PatchTournamentDto | PatchTournamentRoundDto, nestInRound?: boolean }[];
    let tournamentSaved: { preventLoading?: boolean };
    let addedSayg: { id: string, saygRequest: CreateTournamentSaygDto };
    let apiResponse = null;
    let saygDataLookup: { [id: string]: RecordedScoreAsYouGoDto };
    let deletedSayg: { id: string, matchId: string };

    const tournamentApi = api<ITournamentGameApi>({
        async addSayg(id: string, saygRequest: CreateTournamentSaygDto): Promise<IClientActionResultDto<TournamentGameDto>> {
            addedSayg = { id, saygRequest };
            return apiResponse || {
                success: true,
                result: {
                    id: id,
                    type: 'SAYG ADDED',
                }
            };
        },
        async deleteSayg(id: string, matchId: string): Promise<IClientActionResultDto<TournamentGameDto>> {
            deletedSayg = { id, matchId };
            return apiResponse || {
                success: true,
                result: {
                    id,
                    type: 'SAYG DELETED',
                }
            };
        }
    });
    const saygApi = api<ISaygApi>({
        async get(id: string): Promise<RecordedScoreAsYouGoDto | null> {
            return saygDataLookup[id];
        },
        async upsert(data: UpdateRecordedScoreAsYouGoDto): Promise<IClientActionResultDto<RecordedScoreAsYouGoDto>> {
            return apiResponse || {
                success: true,
                result: Object.assign({}, data),
            };
        },
    });

    async function setTournamentData(newTournamentData: TournamentGameDto) {
        updatedTournament = newTournamentData;
    }

    async function saveTournament(preventLoading?: boolean) {
        tournamentSaved = {
            preventLoading
        };
        return null;
    }

    async function onChange(newRound: TournamentRoundDto) {
        changedData = newRound;
    }

    async function patchData(patch: PatchTournamentDto | PatchTournamentRoundDto, nestInRound?: boolean) {
        patchedData.push({ patch, nestInRound });
    }

    afterEach(() => {
        cleanUp(context);
    });

    beforeEach(() => {
        reportedError = new ErrorState();
        updatedTournament = null;
        changedData = null;
        patchedData = [];
        tournamentSaved = null;
        addedSayg = null;
        apiResponse = null;
        saygDataLookup = {};
        deletedSayg = null;
    });

    async function renderComponent(containerProps: ITournamentContainerProps, props: IMatchSaygProps, account?: UserDto) {
        context = await renderApp(
            iocProps({tournamentApi, saygApi}),
            brandingProps(),
            appProps({account}, reportedError),
            (<TournamentContainer {...containerProps}>
                <MatchSayg {...props} />
            </TournamentContainer>));
    }

    describe('renders', () => {
        const matchOptions = matchOptionsBuilder().build();
        const sideA = sideBuilder('SIDE A').withPlayer('PLAYER A').build();
        const sideB = sideBuilder('SIDE B').withPlayer('PLAYER B').build();
        const sideC_multiplePlayers = sideBuilder('SIDE C')
            .withPlayer('PLAYER C 1')
            .withPlayer('PLAYER C 2')
            .build();
        const notPermitted: UserDto = {
            emailAddress: '',
            name: '',
            givenName: '',
            access: {
                recordScoresAsYouGo: false,
            },
        };
        const permitted: UserDto = {
            emailAddress: '',
            name: '',
            givenName: '',
            access: {
                recordScoresAsYouGo: true,
            },
        };

        it('shows no sayg links when no players', async () => {
            const match = tournamentMatchBuilder()
                .sideA((s: ITournamentSideBuilder) => s)
                .sideB((s: ITournamentSideBuilder) => s)
                .build();
            match.sideA.players = null;
            match.sideB.players = null;
            const round = roundBuilder().withMatch(match).build();
            const tournamentData = tournamentBuilder().round(round).build();

            await renderComponent({
                setTournamentData,
                tournamentData,
            }, {
                match,
                matchIndex: 0,
                round,
                onChange,
                patchData,
                matchOptions,
            }, permitted);

            reportedError.verifyNoError();
            expect(context.container.innerHTML).not.toContain('👁️');
            expect(context.container.innerHTML).not.toContain('📊');
        });

        it('shows no sayg links when no data and not logged in', async () => {
            const match = tournamentMatchBuilder().sideA(sideA).sideB(sideB).build();
            const round = roundBuilder().withMatch(match).build();
            const tournamentData = tournamentBuilder().round(round).build();

            await renderComponent({
                setTournamentData,
                tournamentData,
            }, {
                match,
                matchIndex: 0,
                round,
                onChange,
                patchData,
                matchOptions,
            });

            reportedError.verifyNoError();
            expect(context.container.innerHTML).not.toContain('👁️');
            expect(context.container.innerHTML).not.toContain('📊');
        });

        it('shows no sayg links when no data and not permitted', async () => {
            const match = tournamentMatchBuilder().sideA(sideA).sideB(sideB).build();
            const round = roundBuilder().withMatch(match).build();
            const tournamentData = tournamentBuilder().round(round).build();

            await renderComponent({
                setTournamentData,
                tournamentData,
            }, {
                match,
                matchIndex: 0,
                round,
                onChange,
                patchData,
                matchOptions,
            }, notPermitted);

            reportedError.verifyNoError();
            expect(context.container.innerHTML).not.toContain('👁️');
            expect(context.container.innerHTML).not.toContain('📊');
        });

        it('shows no sayg links when no data and sideA not selected', async () => {
            const match = tournamentMatchBuilder().sideB(sideB).saygId(createTemporaryId()).build();
            const round = roundBuilder().withMatch(match).build();
            const tournamentData = tournamentBuilder().round(round).build();

            await renderComponent({
                setTournamentData,
                tournamentData,
            }, {
                match,
                matchIndex: 0,
                round,
                onChange,
                patchData,
                matchOptions,
            });

            reportedError.verifyNoError();
            expect(context.container.innerHTML).not.toContain('👁️');
            expect(context.container.innerHTML).not.toContain('📊');
        });

        it('shows no sayg links when no data and sideB not selected', async () => {
            const match = tournamentMatchBuilder().sideA(sideA).saygId(createTemporaryId()).build();
            const round = roundBuilder().withMatch(match).build();
            const tournamentData = tournamentBuilder().round(round).build();

            await renderComponent({
                setTournamentData,
                tournamentData,
            }, {
                match,
                matchIndex: 0,
                round,
                onChange,
                patchData,
                matchOptions,
            });

            reportedError.verifyNoError();
            expect(context.container.innerHTML).not.toContain('👁️');
            expect(context.container.innerHTML).not.toContain('📊');
        });

        it('shows view sayg link when data and not logged in', async () => {
            const match = tournamentMatchBuilder().sideA(sideA).sideB(sideB).saygId(createTemporaryId()).build();
            const round = roundBuilder().withMatch(match).build();
            const tournamentData = tournamentBuilder().round(round).build();

            await renderComponent({
                setTournamentData,
                tournamentData,
            }, {
                match,
                matchIndex: 0,
                round,
                onChange,
                patchData,
                matchOptions,
                showViewSayg: true,
            });

            reportedError.verifyNoError();
            expect(context.container.innerHTML).toContain('👁️');
            expect(context.container.innerHTML).not.toContain('📊');
        });

        it('shows view sayg link when data and not permitted', async () => {
            const match = tournamentMatchBuilder().sideA(sideA).sideB(sideB).saygId(createTemporaryId()).build();
            const round = roundBuilder().withMatch(match).build();
            const tournamentData = tournamentBuilder().round(round).build();

            await renderComponent({
                setTournamentData,
                tournamentData,
            }, {
                match,
                matchIndex: 0,
                round,
                onChange,
                patchData,
                matchOptions,
                showViewSayg: true,
            }, notPermitted);

            reportedError.verifyNoError();
            expect(context.container.innerHTML).toContain('👁️');
            expect(context.container.innerHTML).not.toContain('📊');
        });

        it('does not show view sayg link when data and not permitted and not requested', async () => {
            const match = tournamentMatchBuilder().sideA(sideA).sideB(sideB).saygId(createTemporaryId()).build();
            const round = roundBuilder().withMatch(match).build();
            const tournamentData = tournamentBuilder().round(round).build();

            await renderComponent({
                setTournamentData,
                tournamentData,
            }, {
                match,
                matchIndex: 0,
                round,
                onChange,
                patchData,
                matchOptions,
                showViewSayg: false,
            }, notPermitted);

            reportedError.verifyNoError();
            expect(context.container.innerHTML).not.toContain('👁️');
            expect(context.container.innerHTML).not.toContain('📊');
        });

        it('shows edit sayg link when data and permitted', async () => {
            const match = tournamentMatchBuilder().sideA(sideA).sideB(sideB).saygId(createTemporaryId()).build();
            const round = roundBuilder().withMatch(match).build();
            const tournamentData = tournamentBuilder().round(round).build();

            await renderComponent({
                setTournamentData,
                tournamentData,
            }, {
                match,
                matchIndex: 0,
                round,
                onChange,
                patchData,
                matchOptions,
            }, permitted);

            reportedError.verifyNoError();
            expect(context.container.innerHTML).not.toContain('👁️');
            expect(context.container.innerHTML).toContain('📊');
        });

        it('shows edit sayg link when no data but single round (superleague)', async () => {
            const match = tournamentMatchBuilder().sideA(sideA).sideB(sideB).build();
            const round = roundBuilder().withMatch(match).build();
            const tournamentData = tournamentBuilder().singleRound().round(round).build();

            await renderComponent({
                setTournamentData,
                tournamentData,
            }, {
                match,
                matchIndex: 0,
                round,
                onChange,
                patchData,
                matchOptions,
            }, permitted);

            reportedError.verifyNoError();
            expect(context.container.innerHTML).not.toContain('👁️');
            expect(context.container.innerHTML).toContain('📊');
        });

        it('shows edit sayg link when no data and both sides have single players', async () => {
            const match = tournamentMatchBuilder().sideA(sideA).sideB(sideB).build();
            const round = roundBuilder().withMatch(match).build();
            const tournamentData = tournamentBuilder().round(round).build();

            await renderComponent({
                setTournamentData,
                tournamentData,
            }, {
                match,
                matchIndex: 0,
                round,
                onChange,
                patchData,
                matchOptions,
            }, permitted);

            reportedError.verifyNoError();
            expect(context.container.innerHTML).not.toContain('👁️');
            expect(context.container.innerHTML).toContain('📊');
        });

        it('shows no edit sayg link when no data and sideA does not have a single player', async () => {
            const match = tournamentMatchBuilder().sideA(sideC_multiplePlayers).sideB(sideB).build();
            const round = roundBuilder().withMatch(match).build();
            const tournamentData = tournamentBuilder().round(round).build();

            await renderComponent({
                setTournamentData,
                tournamentData,
            }, {
                match,
                matchIndex: 0,
                round,
                onChange,
                patchData,
                matchOptions,
            }, permitted);

            reportedError.verifyNoError();
            expect(context.container.innerHTML).not.toContain('👁️');
            expect(context.container.innerHTML).not.toContain('📊');
        });

        it('shows no edit sayg link when no data and sideB does not have a single player', async () => {
            const match = tournamentMatchBuilder().sideA(sideA).sideB(sideC_multiplePlayers).build();
            const round = roundBuilder().withMatch(match).build();
            const tournamentData = tournamentBuilder().round(round).build();

            await renderComponent({
                setTournamentData,
                tournamentData,
            }, {
                match,
                matchIndex: 0,
                round,
                onChange,
                patchData,
                matchOptions,
            }, permitted);

            reportedError.verifyNoError();
            expect(context.container.innerHTML).not.toContain('👁️');
            expect(context.container.innerHTML).not.toContain('📊');
        });
    });

    describe('interactivity', () => {
        const matchOptions = matchOptionsBuilder().numberOfLegs(5).build();
        const sideA = sideBuilder('SIDE A').withPlayer('PLAYER A').build();
        const sideB = sideBuilder('SIDE B').withPlayer('PLAYER B').build();
        const teamA = sideBuilder('TEAM A').teamId(createTemporaryId()).build();
        const teamB = sideBuilder('TEAM B').teamId(createTemporaryId()).build();
        const pairA = sideBuilder('PAIR A').withPlayer('PLAYER A 1').withPlayer('PLAYER A 2').build();
        const pairB = sideBuilder('PAIR B').withPlayer('PLAYER B 1').withPlayer('PLAYER B 2').build();
        const permitted: UserDto = {
            emailAddress: '',
            name: '',
            givenName: '',
            access: {
                recordScoresAsYouGo: true,
            },
        };
        const permittedWithDebug: UserDto = {
            emailAddress: '',
            name: '',
            givenName: '',
            access: {
                recordScoresAsYouGo: true,
                showDebugOptions: true,
            },
        };

        async function enterScore(score: number, noOfDarts?: number) {
            await doChange(context.container, 'input[data-score-input="true"]', score.toString(), context.user);

            const text: string = repeat(noOfDarts || 3, _ => '📌').join('');
            await doClick(findButton(context.container, text));
        }

        async function enterFirstPlayerScores(threeDartScores: number[]) {
            for (let i = 0; i < threeDartScores.length; i++) {
                const score = threeDartScores[i];
                await enterScore(score, 3);
                await enterScore(1, 3); // opponent score
            }
        }

        async function executeSaygScoringTest(match: TournamentMatchDto, sideAScores: number[], readOnly?: boolean) {
            const round = roundBuilder().withMatch(match).build();
            const tournamentData = tournamentBuilder().round(round).build();

            await renderComponent({
                setTournamentData,
                tournamentData,
                saveTournament,
            }, {
                match,
                matchIndex: 0,
                round,
                onChange,
                patchData,
                matchOptions,
                readOnly
            }, permitted);
            reportedError.verifyNoError();
            const createDataButton = context.container.querySelector('button');
            expect(createDataButton.textContent).toEqual('📊');
            await doClick(createDataButton);
            const dialog = context.container.querySelector('.modal-dialog');

            reportedError.verifyNoError();
            await doClick(findButton(dialog, `🎯${match.sideA.name}`)); // pick sideA goes first
            patchedData = [];
            await enterFirstPlayerScores(sideAScores);

            reportedError.verifyNoError();
        }

        it('navigates to live data', async () => {
            const saygId = createTemporaryId();
            const match = tournamentMatchBuilder().sideA(sideA, 1).sideB(sideB, 2).saygId(saygId).build();
            const round = roundBuilder().withMatch(match).build();
            const tournamentData = tournamentBuilder().round(round).build();

            await renderComponent({
                setTournamentData,
                tournamentData,
            }, {
                match,
                matchIndex: 0,
                round,
                onChange,
                patchData,
                matchOptions,
                showViewSayg: true,
            });
            reportedError.verifyNoError();

            const viewLink = context.container.querySelector('a');
            expect(viewLink.textContent).toEqual('👁️');
            expect(viewLink.href).toEqual(`http://localhost/live/match/${saygId}`);
        });

        it('prompts user to save match if no id', async () => {
            const match = tournamentMatchBuilder().noId().sideA(sideA).sideB(sideB).build();
            const round = roundBuilder().withMatch(match).build();
            const tournamentData = tournamentBuilder().round(round).build();
            await renderComponent({
                setTournamentData,
                tournamentData,
                saveTournament,
            }, {
                match,
                matchIndex: 0,
                round,
                onChange,
                patchData,
                matchOptions,
            }, permitted);
            reportedError.verifyNoError();
            const createDataButton = context.container.querySelector('button');
            expect(createDataButton.textContent).toEqual('📊');
            let message: string;
            window.alert = (msg) => message = msg;

            await doClick(createDataButton);

            expect(message).toEqual('Save the tournament first');
            expect(tournamentSaved).toBeNull();
            reportedError.verifyNoError();
        });

        it('saves the tournament before creating data', async () => {
            const match = tournamentMatchBuilder().sideA(sideA).sideB(sideB).build();
            const round = roundBuilder().withMatch(match).build();
            const tournamentData = tournamentBuilder().round(round).build();
            await renderComponent({
                setTournamentData,
                tournamentData,
                saveTournament,
            }, {
                match,
                matchIndex: 0,
                round,
                onChange,
                patchData,
                matchOptions,
            }, permitted);
            reportedError.verifyNoError();
            const createDataButton = context.container.querySelector('button');
            expect(createDataButton.textContent).toEqual('📊');
            let message: string;
            window.alert = (msg) => message = msg;

            await doClick(createDataButton);

            reportedError.verifyNoError();
            expect(message).toBeFalsy();
            expect(tournamentSaved).toEqual({
                preventLoading: true,
            });
        });

        it('creates sayg data for match', async () => {
            const match = tournamentMatchBuilder().sideA(sideA).sideB(sideB).build();
            const round = roundBuilder().withMatch(match).build();
            const tournamentData = tournamentBuilder().round(round).build();
            await renderComponent({
                setTournamentData,
                tournamentData,
                saveTournament,
            }, {
                match,
                matchIndex: 0,
                round,
                onChange,
                patchData,
                matchOptions,
            }, permitted);
            reportedError.verifyNoError();
            const createDataButton = context.container.querySelector('button');
            expect(createDataButton.textContent).toEqual('📊');

            await doClick(createDataButton);

            reportedError.verifyNoError();
            expect(addedSayg).toEqual({
                id: tournamentData.id,
                saygRequest: {
                    matchOptions,
                    matchId: match.id,
                },
            });
        });

        it('shows error if unable to create sayg data', async () => {
            const match = tournamentMatchBuilder().sideA(sideA).sideB(sideB).build();
            const round = roundBuilder().withMatch(match).build();
            const tournamentData = tournamentBuilder().round(round).build();
            await renderComponent({
                setTournamentData,
                tournamentData,
                saveTournament,
            }, {
                match,
                matchIndex: 0,
                round,
                onChange,
                patchData,
                matchOptions,
            }, permitted);
            reportedError.verifyNoError();
            const createDataButton = context.container.querySelector('button');
            expect(createDataButton.textContent).toEqual('📊');
            apiResponse = {
                success: false,
                errors: [
                    'SOME ERROR',
                ],
            };

            await doClick(createDataButton);

            reportedError.verifyNoError();
            expect(updatedTournament).toBeNull();
            expect(context.container.textContent).toContain('SOME ERROR');
        });

        it('updates tournament data and shows dialog once data created', async () => {
            const match = tournamentMatchBuilder().sideA(sideA).sideB(sideB).build();
            const round = roundBuilder().withMatch(match).build();
            const tournamentData = tournamentBuilder().round(round).build();

            await renderComponent({
                setTournamentData,
                tournamentData,
                saveTournament,
            }, {
                match,
                matchIndex: 0,
                round,
                onChange,
                patchData,
                matchOptions,
            }, permitted);
            reportedError.verifyNoError();
            const createDataButton = context.container.querySelector('button');
            expect(createDataButton.textContent).toEqual('📊');

            await doClick(createDataButton);

            reportedError.verifyNoError();
            expect(updatedTournament).toEqual({
                id: tournamentData.id,
                type: 'SAYG ADDED',
            });
            expect(context.container.querySelector('.modal-dialog')).toBeTruthy();
        });

        it('does not show live link in dialog if sideA won', async () => {
            const saygId = createTemporaryId();
            const match = tournamentMatchBuilder()
                .sideA(sideA, 3) // winner
                .sideB(sideB, 0)
                .saygId(saygId)
                .build();
            const round = roundBuilder().withMatch(match).build();
            const tournamentData = tournamentBuilder().round(round).build();

            await renderComponent({
                setTournamentData,
                tournamentData,
                saveTournament,
            }, {
                match,
                matchIndex: 0,
                round,
                onChange,
                patchData,
                matchOptions,
            }, permitted);
            reportedError.verifyNoError();
            const createDataButton = context.container.querySelector('button');
            expect(createDataButton.textContent).toEqual('📊');

            await doClick(createDataButton);

            const dialog = context.container.querySelector('.modal-dialog');
            expect(dialog).toBeTruthy();
            expect(dialog.querySelector('.btn-success')).toBeFalsy();
        });

        it('does not show live link in dialog if sideB won', async () => {
            const saygId = createTemporaryId();
            const match = tournamentMatchBuilder()
                .sideA(sideA, 0)
                .sideB(sideB, 3) // winner
                .saygId(saygId)
                .build();
            const round = roundBuilder().withMatch(match).build();
            const tournamentData = tournamentBuilder().round(round).build();

            await renderComponent({
                setTournamentData,
                tournamentData,
                saveTournament,
            }, {
                match,
                matchIndex: 0,
                round,
                onChange,
                patchData,
                matchOptions,
            }, permitted);
            reportedError.verifyNoError();
            const createDataButton = context.container.querySelector('button');
            expect(createDataButton.textContent).toEqual('📊');

            await doClick(createDataButton);

            const dialog = context.container.querySelector('.modal-dialog') as HTMLAnchorElement;
            expect(dialog).toBeTruthy();
            expect(dialog.querySelector('.btn-success')).toBeFalsy();
        });

        it('shows live link in dialog if no winner', async () => {
            const saygId = createTemporaryId();
            const match = tournamentMatchBuilder()
                .sideA(sideA, 1)
                .sideB(sideB, 1)
                .saygId(saygId)
                .build();
            const round = roundBuilder().withMatch(match).build();
            const tournamentData = tournamentBuilder().round(round).build();

            await renderComponent({
                setTournamentData,
                tournamentData,
                saveTournament,
            }, {
                match,
                matchIndex: 0,
                round,
                onChange,
                patchData,
                matchOptions,
            }, permitted);
            reportedError.verifyNoError();
            const createDataButton = context.container.querySelector('button');
            expect(createDataButton.textContent).toEqual('📊');

            await doClick(createDataButton);

            const dialog = context.container.querySelector('.modal-dialog');
            expect(dialog).toBeTruthy();
            const liveLink = dialog.querySelector('.btn-success') as HTMLAnchorElement;
            expect(liveLink).toBeTruthy();
            expect(liveLink.href).toEqual(`http://localhost/live/match/${saygId}`);
        });

        it('can close dialog', async () => {
            const saygId = createTemporaryId();
            const match = tournamentMatchBuilder().sideA(sideA).sideB(sideB).saygId(saygId).build();
            const round = roundBuilder().withMatch(match).build();
            const tournamentData = tournamentBuilder().round(round).build();

            await renderComponent({
                setTournamentData,
                tournamentData,
                saveTournament,
            }, {
                match,
                matchIndex: 0,
                round,
                onChange,
                patchData,
                matchOptions,
            }, permitted);
            reportedError.verifyNoError();
            const createDataButton = context.container.querySelector('button');
            expect(createDataButton.textContent).toEqual('📊');
            await doClick(createDataButton);
            const dialog = context.container.querySelector('.modal-dialog');

            await doClick(findButton(dialog, 'Close'));

            expect(context.container.querySelector('.modal-dialog')).toBeFalsy();
        });

        it('can patch data with updated score', async () => {
            const saygData = saygBuilder()
                .numberOfLegs(matchOptions.numberOfLegs)
                .scores(0, 0)
                .yourName(sideA.name)
                .opponentName(sideB.name)
                .startingScore(501)
                .addTo(saygDataLookup)
                .build();
            const match = tournamentMatchBuilder().sideA(sideA).sideB(sideB).saygId(saygData.id).build();

            await executeSaygScoringTest(match, [177, 177, 100, 47]);

            expect(patchedData).toEqual([{
                nestInRound: true,
                patch: {
                    match: {
                        scoreA: 1,
                        scoreB: 0,
                        sideA: sideA.id,
                        sideB: sideB.id,
                    },
                },
            }]);
        });

        it('reports and patches hi-checks when single-player', async () => {
            const saygData = saygBuilder()
                .numberOfLegs(matchOptions.numberOfLegs)
                .scores(0, 0)
                .yourName(sideA.name)
                .opponentName(sideB.name)
                .startingScore(501)
                .addTo(saygDataLookup)
                .build();
            const match = tournamentMatchBuilder().sideA(sideA).sideB(sideB).saygId(saygData.id).build();

            await executeSaygScoringTest(match, [100, 100, 100, 50, 151]);

            const patchesWithHiChecks = patchedData.filter(p => (p.patch as PatchTournamentDto).additionalOver100Checkout);
            expect(patchesWithHiChecks).toEqual([{
                patch: {
                    additionalOver100Checkout: {
                        score: 151,
                        name: sideA.players[0].name,
                        id: sideA.players[0].id,
                    },
                }
            }]);
        });

        it('reports and patches 180s when single-player', async () => {
            const saygData = saygBuilder()
                .numberOfLegs(matchOptions.numberOfLegs)
                .scores(0, 0)
                .yourName(sideA.name)
                .opponentName(sideB.name)
                .startingScore(501)
                .addTo(saygDataLookup)
                .build();
            const match = tournamentMatchBuilder().sideA(sideA).sideB(sideB).saygId(saygData.id).build();

            await executeSaygScoringTest(match, [180]);

            expect(patchedData).toEqual([{
                patch: {
                    additional180: {
                        name: sideA.players[0].name,
                        id: sideA.players[0].id,
                    },
                }
            }]);
        });

        it('does not report or patch hi-checks when teams', async () => {
            const saygData = saygBuilder()
                .numberOfLegs(matchOptions.numberOfLegs)
                .scores(0, 0)
                .yourName(teamA.name)
                .opponentName(teamB.name)
                .startingScore(501)
                .addTo(saygDataLookup)
                .build();
            const match = tournamentMatchBuilder().sideA(teamA).sideB(teamB).saygId(saygData.id).build();

            await executeSaygScoringTest(match, [100, 100, 100, 50, 151]);

            const patchesWithHiChecks = patchedData.filter(p => (p.patch as PatchTournamentDto).additionalOver100Checkout);
            expect(patchesWithHiChecks).toEqual([]);
        });

        it('does not report or patch 180 when teams', async () => {
            const saygData = saygBuilder()
                .numberOfLegs(matchOptions.numberOfLegs)
                .scores(0, 0)
                .yourName(teamA.name)
                .opponentName(teamB.name)
                .startingScore(501)
                .addTo(saygDataLookup)
                .build();
            const match = tournamentMatchBuilder().sideA(teamA).sideB(teamB).saygId(saygData.id).build();

            await executeSaygScoringTest(match, [180]);

            expect(patchedData).toEqual([]);
        });

        it('does not report or patch hi-checks when not single-player', async () => {
            const saygData = saygBuilder()
                .numberOfLegs(matchOptions.numberOfLegs)
                .scores(0, 0)
                .yourName(pairA.name)
                .opponentName(pairB.name)
                .startingScore(501)
                .addTo(saygDataLookup)
                .build();
            const match = tournamentMatchBuilder().sideA(pairA).sideB(pairB).saygId(saygData.id).build();

            await executeSaygScoringTest(match, [100, 100, 100, 50, 151]);

            const patchesWithHiChecks = patchedData.filter(p => (p.patch as PatchTournamentDto).additionalOver100Checkout);
            expect(patchesWithHiChecks).toEqual([]);
        });

        it('does not report or patch 180 when not single-player', async () => {
            const saygData = saygBuilder()
                .numberOfLegs(matchOptions.numberOfLegs)
                .scores(0, 0)
                .yourName(pairA.name)
                .opponentName(pairB.name)
                .startingScore(501)
                .addTo(saygDataLookup)
                .build();
            const match = tournamentMatchBuilder().sideA(pairA).sideB(pairB).saygId(saygData.id).build();

            await executeSaygScoringTest(match, [180]);

            expect(patchedData).toEqual([]);
        });

        it('does not report or patch hi-checks when readonly', async () => {
            const saygData = saygBuilder()
                .numberOfLegs(matchOptions.numberOfLegs)
                .scores(0, 0)
                .yourName(sideA.name)
                .opponentName(sideB.name)
                .startingScore(501)
                .addTo(saygDataLookup)
                .build();
            const match = tournamentMatchBuilder().sideA(sideA).sideB(sideB).saygId(saygData.id).build();

            await executeSaygScoringTest(match, [100, 100, 100, 50, 151], true);

            const patchesWithHiChecks = patchedData.filter(p => (p.patch as PatchTournamentDto).additionalOver100Checkout);
            expect(patchesWithHiChecks).toEqual([]);
        });

        it('does not report or patch 180 when readonly', async () => {
            const saygData = saygBuilder()
                .numberOfLegs(matchOptions.numberOfLegs)
                .scores(0, 0)
                .yourName(sideA.name)
                .opponentName(sideB.name)
                .startingScore(501)
                .addTo(saygDataLookup)
                .build();
            const match = tournamentMatchBuilder().sideA(sideA).sideB(sideB).saygId(saygData.id).build();

            await executeSaygScoringTest(match, [180], true);

            expect(patchedData).toEqual([]);
        });

        it('confirms before deleting sayg', async () => {
            const saygData = saygBuilder()
                .numberOfLegs(matchOptions.numberOfLegs)
                .scores(0, 0)
                .yourName(sideA.name)
                .opponentName(sideB.name)
                .startingScore(501)
                .addTo(saygDataLookup)
                .build();
            const match = tournamentMatchBuilder().sideA(sideA).sideB(sideB).saygId(saygData.id).build();
            const round = roundBuilder().withMatch(match).build();
            const tournamentData = tournamentBuilder().round(round).build();

            await renderComponent({
                setTournamentData,
                tournamentData,
                saveTournament,
            }, {
                match,
                matchIndex: 0,
                round,
                onChange,
                patchData,
                matchOptions,
            }, permittedWithDebug);
            reportedError.verifyNoError();
            const createDataButton = context.container.querySelector('button');
            expect(createDataButton.textContent).toEqual('📊');
            await doClick(createDataButton);
            const dialog = context.container.querySelector('.modal-dialog');
            let confirm: string;
            window.confirm = (msg) => {
                confirm = msg;
                return false;
            }

            await doClick(findButton(dialog, 'Debug options'));
            const deleteButton = dialog.querySelector('.dropdown-item.text-danger');
            expect(deleteButton.textContent).toEqual('Delete sayg');
            await doClick(deleteButton);

            reportedError.verifyNoError();
            expect(confirm).toEqual('Are you sure you want to delete the sayg data for this match?');
        });

        it('can delete sayg then close dialog and update tournament data', async () => {
            const saygData = saygBuilder()
                .numberOfLegs(matchOptions.numberOfLegs)
                .scores(0, 0)
                .yourName(sideA.name)
                .opponentName(sideB.name)
                .startingScore(501)
                .addTo(saygDataLookup)
                .build();
            const match = tournamentMatchBuilder().sideA(sideA).sideB(sideB).saygId(saygData.id).build();
            const round = roundBuilder().withMatch(match).build();
            const tournamentData = tournamentBuilder().round(round).build();

            await renderComponent({
                setTournamentData,
                tournamentData,
                saveTournament,
            }, {
                match,
                matchIndex: 0,
                round,
                onChange,
                patchData,
                matchOptions,
            }, permittedWithDebug);
            reportedError.verifyNoError();
            const createDataButton = context.container.querySelector('button');
            expect(createDataButton.textContent).toEqual('📊');
            await doClick(createDataButton);
            const dialog = context.container.querySelector('.modal-dialog');
            window.confirm = () => true;

            await doClick(findButton(dialog, 'Debug options'));
            const deleteButton = dialog.querySelector('.dropdown-item.text-danger');
            expect(deleteButton.textContent).toEqual('Delete sayg');
            await doClick(deleteButton);

            reportedError.verifyNoError();
            expect(deletedSayg).toEqual({
                id: tournamentData.id,
                matchId: match.id,
            });
            expect(changedData.matches[0].saygId).toBeNull();
            expect(updatedTournament).toEqual({
                id: tournamentData.id,
                type: 'SAYG DELETED',
            });
            expect(context.container.querySelector('.modal-dialog')).toBeFalsy();
        });

        it('shows error if unable to delete sayg', async () => {
            const saygData = saygBuilder()
                .numberOfLegs(matchOptions.numberOfLegs)
                .scores(0, 0)
                .yourName(sideA.name)
                .opponentName(sideB.name)
                .startingScore(501)
                .addTo(saygDataLookup)
                .build();
            const match = tournamentMatchBuilder().sideA(sideA).sideB(sideB).saygId(saygData.id).build();
            const round = roundBuilder().withMatch(match).build();
            const tournamentData = tournamentBuilder().round(round).build();

            await renderComponent({
                setTournamentData,
                tournamentData,
                saveTournament,
            }, {
                match,
                matchIndex: 0,
                round,
                onChange,
                patchData,
                matchOptions,
            }, permittedWithDebug);
            reportedError.verifyNoError();
            const createDataButton = context.container.querySelector('button');
            expect(createDataButton.textContent).toEqual('📊');
            await doClick(createDataButton);
            const dialog = context.container.querySelector('.modal-dialog');
            window.confirm = () => true;
            apiResponse = {
                success: false,
                errors: [ 'SOME ERROR' ],
            };

            await doClick(findButton(dialog, 'Debug options'));
            const deleteButton = dialog.querySelector('.dropdown-item.text-danger');
            expect(deleteButton.textContent).toEqual('Delete sayg');
            await doClick(deleteButton);

            reportedError.verifyErrorEquals(apiResponse);
            expect(deletedSayg).toEqual({
                id: tournamentData.id,
                matchId: match.id,
            });
            expect(changedData).toBeNull();
            expect(updatedTournament).toBeNull();
            expect(context.container.querySelector('.modal-dialog')).toBeTruthy();
        });
    });
});