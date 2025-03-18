import {
    api,
    appProps,
    brandingProps,
    cleanUp,
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
import {PatchTournamentDto} from "../../interfaces/models/dtos/Game/PatchTournamentDto";
import {PatchTournamentRoundDto} from "../../interfaces/models/dtos/Game/PatchTournamentRoundDto";
import {createTemporaryId} from "../../helpers/projection";
import {ITournamentGameApi} from "../../interfaces/apis/ITournamentGameApi";
import {CreateTournamentSaygDto} from "../../interfaces/models/dtos/Game/CreateTournamentSaygDto";
import {IClientActionResultDto} from "../common/IClientActionResultDto";
import {ISaygApi} from "../../interfaces/apis/ISaygApi";
import {UpdateRecordedScoreAsYouGoDto} from "../../interfaces/models/dtos/Game/Sayg/UpdateRecordedScoreAsYouGoDto";
import {RecordedScoreAsYouGoDto} from "../../interfaces/models/dtos/Game/Sayg/RecordedScoreAsYouGoDto";
import {ILegBuilder, ILegCompetitorScoreBuilder, saygBuilder} from "../../helpers/builders/sayg";
import {TournamentMatchDto} from "../../interfaces/models/dtos/Game/TournamentMatchDto";
import {ENTER_SCORE_BUTTON} from "../../helpers/constants";
import {checkoutWith, keyPad} from "../../helpers/sayg";
import {START_SCORING} from "./tournaments";
import {TournamentSideDto} from "../../interfaces/models/dtos/Game/TournamentSideDto";

describe('MatchSayg', () => {
    let context: TestContext;
    let reportedError: ErrorState;
    let updatedTournament: TournamentGameDto | null;
    let patchedData: { patch: PatchTournamentDto | PatchTournamentRoundDto, nestInRound?: boolean, saygId?: string }[];
    let tournamentSaved: { preventLoading?: boolean } | null;
    let addedSayg: { id: string, saygRequest: CreateTournamentSaygDto } | null;
    let apiResponse: IClientActionResultDto<TournamentGameDto> | null = null;
    let saygApiResponse: IClientActionResultDto<RecordedScoreAsYouGoDto> | null = null;
    let saygDataLookup: { [id: string]: RecordedScoreAsYouGoDto };
    let deletedSayg: { id: string, matchId: string } | null;
    let scrollPrevented: boolean;

    const tournamentApi = api<ITournamentGameApi>({
        async addSayg(id: string, saygRequest: CreateTournamentSaygDto): Promise<IClientActionResultDto<TournamentGameDto>> {
            addedSayg = { id, saygRequest };
            return apiResponse || {
                success: true,
                result: {
                    id: id,
                    type: 'SAYG ADDED',
                    address: '',
                    date: '',
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
                    address: '',
                    date: '',
                }
            };
        }
    });
    const saygApi = api<ISaygApi>({
        async get(id: string): Promise<RecordedScoreAsYouGoDto | null> {
            return saygDataLookup[id];
        },
        async upsert(data: UpdateRecordedScoreAsYouGoDto): Promise<IClientActionResultDto<RecordedScoreAsYouGoDto>> {
            return saygApiResponse || {
                success: true,
                result: Object.assign({}, data) as RecordedScoreAsYouGoDto,
            };
        },
    });

    async function setTournamentData(newTournamentData: TournamentGameDto) {
        updatedTournament = newTournamentData;
    }

    async function saveTournament(preventLoading?: boolean): Promise<TournamentGameDto | undefined> {
        tournamentSaved = {
            preventLoading
        };
        return undefined;
    }

    async function patchData(patch: PatchTournamentDto | PatchTournamentRoundDto, nestInRound?: boolean, saygId?: string) {
        patchedData.push({ patch, nestInRound, saygId });
    }

    function setPreventScroll(prevent: boolean) {
        scrollPrevented = prevent;
    }

    async function setDraggingSide(_: TournamentSideDto) {
    }

    async function setNewMatch(_: TournamentMatchDto) {
    }

    afterEach(async () => {
        await cleanUp(context);
    });

    beforeEach(() => {
        reportedError = new ErrorState();
        updatedTournament = null;
        patchedData = [];
        tournamentSaved = null;
        addedSayg = null;
        apiResponse = null;
        saygDataLookup = {};
        deletedSayg = null;
        scrollPrevented = false;
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

    function user(recordScoresAsYouGo?: boolean, showDebugOptions?: boolean): UserDto {
        return {
            emailAddress: '',
            name: '',
            givenName: '',
            access: {
                recordScoresAsYouGo,
                showDebugOptions,
            },
        };
    }

    function containerProps(tournamentData: TournamentGameDto): ITournamentContainerProps {
        return {
            setTournamentData,
            tournamentData,
            preventScroll: false,
            setPreventScroll,
            saveTournament,
            setDraggingSide,
            newMatch: {},
            setNewMatch,
        };
    }

    describe('renders', () => {
        const matchOptions = matchOptionsBuilder().build();
        const sideA = sideBuilder('SIDE A').withPlayer('PLAYER A').build();
        const sideB = sideBuilder('SIDE B').withPlayer('PLAYER B').build();
        const sideC_multiplePlayers = sideBuilder('SIDE C')
            .withPlayer('PLAYER C 1')
            .withPlayer('PLAYER C 2')
            .build();
        const notPermitted: UserDto = user(false);
        const permitted: UserDto = user(true);
        const sideAvsSideBMatch: TournamentMatchDto = tournamentMatchBuilder().sideA(sideA).sideB(sideB).saygId(createTemporaryId()).build();
        const sideAvsSideBRound = roundBuilder().withMatch(sideAvsSideBMatch).build();

        it('shows no sayg links when no players', async () => {
            const match = tournamentMatchBuilder()
                .sideA((s: ITournamentSideBuilder) => s)
                .sideB((s: ITournamentSideBuilder) => s)
                .build();
            match.sideA.players = undefined;
            match.sideB.players = undefined;
            const round = roundBuilder().withMatch(match).build();
            const tournamentData = tournamentBuilder().round(round).build();

            await renderComponent({
                setTournamentData,
                tournamentData,
                preventScroll: false,
                setPreventScroll,
                setDraggingSide,
                newMatch: {},
                setNewMatch,
            }, {
                match,
                matchIndex: 0,
                patchData,
                matchOptions,
            }, permitted);

            reportedError.verifyNoError();
            expect(context.container.innerHTML).not.toContain('📊');
            expect(context.container.innerHTML).not.toContain(START_SCORING);
        });

        it('shows no sayg links when no data and not logged in', async () => {
            const tournamentData = tournamentBuilder().round(sideAvsSideBRound).build();

            await renderComponent(containerProps(tournamentData), {
                match: sideAvsSideBMatch,
                matchIndex: 0,
                patchData,
                matchOptions,
            });

            reportedError.verifyNoError();
            expect(context.container.innerHTML).not.toContain('📊');
            expect(context.container.innerHTML).not.toContain(START_SCORING);
        });

        it('shows no sayg links when no data and not permitted', async () => {
            const tournamentData = tournamentBuilder().round(sideAvsSideBRound).build();

            await renderComponent(containerProps(tournamentData), {
                match: sideAvsSideBMatch,
                matchIndex: 0,
                patchData,
                matchOptions,
            }, notPermitted);

            reportedError.verifyNoError();
            expect(context.container.innerHTML).not.toContain('📊');
            expect(context.container.innerHTML).not.toContain(START_SCORING);
        });

        it('shows no sayg links when no data and sideA not selected', async () => {
            const match = tournamentMatchBuilder().sideB(sideB).saygId(createTemporaryId()).build();
            const round = roundBuilder().withMatch(match).build();
            const tournamentData = tournamentBuilder().round(round).build();

            await renderComponent(containerProps(tournamentData), {
                match,
                matchIndex: 0,
                patchData,
                matchOptions,
            });

            reportedError.verifyNoError();
            expect(context.container.innerHTML).not.toContain('📊');
            expect(context.container.innerHTML).not.toContain(START_SCORING);
        });

        it('shows no sayg links when no data and sideB not selected', async () => {
            const match = tournamentMatchBuilder().sideA(sideA).saygId(createTemporaryId()).build();
            const round = roundBuilder().withMatch(match).build();
            const tournamentData = tournamentBuilder().round(round).build();

            await renderComponent(containerProps(tournamentData), {
                match,
                matchIndex: 0,
                patchData,
                matchOptions,
            });

            reportedError.verifyNoError();
            expect(context.container.innerHTML).not.toContain('📊');
            expect(context.container.innerHTML).not.toContain(START_SCORING);
        });

        it('shows view sayg link when data and not logged in', async () => {
            const tournamentData = tournamentBuilder().round(sideAvsSideBRound).build();

            await renderComponent(containerProps(tournamentData), {
                match: sideAvsSideBMatch,
                matchIndex: 0,
                patchData,
                matchOptions,
                showViewSayg: true,
            });

            reportedError.verifyNoError();
            expect(context.container.innerHTML).toContain('📊');
            expect(context.container.innerHTML).not.toContain(START_SCORING);
        });

        it('shows view sayg link when data and not permitted', async () => {
            const tournamentData = tournamentBuilder().round(sideAvsSideBRound).build();

            await renderComponent(containerProps(tournamentData), {
                match: sideAvsSideBMatch,
                matchIndex: 0,
                patchData,
                matchOptions,
                showViewSayg: true,
            }, notPermitted);

            reportedError.verifyNoError();
            expect(context.container.innerHTML).toContain('📊');
            expect(context.container.innerHTML).not.toContain(START_SCORING);
        });

        it('does not show view sayg link when data and not permitted and not requested', async () => {
            const tournamentData = tournamentBuilder().round(sideAvsSideBRound).build();

            await renderComponent(containerProps(tournamentData), {
                match: sideAvsSideBMatch,
                matchIndex: 0,
                patchData,
                matchOptions,
                showViewSayg: false,
            }, notPermitted);

            reportedError.verifyNoError();
            expect(context.container.innerHTML).not.toContain(START_SCORING);
        });

        it('shows edit sayg link when data and permitted', async () => {
            const tournamentData = tournamentBuilder().round(sideAvsSideBRound).build();

            await renderComponent(containerProps(tournamentData), {
                match: sideAvsSideBMatch,
                matchIndex: 0,
                patchData,
                matchOptions,
            }, permitted);

            reportedError.verifyNoError();
            expect(context.container.innerHTML).toContain(START_SCORING);
        });

        it('shows edit sayg link when no data but single round (superleague)', async () => {
            const tournamentData = tournamentBuilder().singleRound().round(sideAvsSideBRound).build();

            await renderComponent(containerProps(tournamentData), {
                match: sideAvsSideBMatch,
                matchIndex: 0,
                patchData,
                matchOptions,
            }, permitted);

            reportedError.verifyNoError();
            expect(context.container.innerHTML).toContain(START_SCORING);
        });

        it('shows edit sayg link when no data and both sides have single players', async () => {
            const tournamentData = tournamentBuilder().round(sideAvsSideBRound).build();

            await renderComponent(containerProps(tournamentData), {
                match: sideAvsSideBMatch,
                matchIndex: 0,
                patchData,
                matchOptions,
            }, permitted);

            reportedError.verifyNoError();
            expect(context.container.innerHTML).toContain(START_SCORING);
        });

        it('shows no edit sayg link when no data and sideA does not have a single player', async () => {
            const match = tournamentMatchBuilder().sideA(sideC_multiplePlayers).sideB(sideB).build();
            const round = roundBuilder().withMatch(match).build();
            const tournamentData = tournamentBuilder().round(round).build();

            await renderComponent(containerProps(tournamentData), {
                match,
                matchIndex: 0,
                patchData,
                matchOptions,
            }, permitted);

            reportedError.verifyNoError();
            expect(context.container.innerHTML).not.toContain('📊');
            expect(context.container.innerHTML).not.toContain(START_SCORING);
        });

        it('shows no edit sayg link when no data and sideB does not have a single player', async () => {
            const match = tournamentMatchBuilder().sideA(sideA).sideB(sideC_multiplePlayers).build();
            const round = roundBuilder().withMatch(match).build();
            const tournamentData = tournamentBuilder().round(round).build();

            await renderComponent(containerProps(tournamentData), {
                match,
                matchIndex: 0,
                patchData,
                matchOptions,
            }, permitted);

            reportedError.verifyNoError();
            expect(context.container.innerHTML).not.toContain('📊');
            expect(context.container.innerHTML).not.toContain(START_SCORING);
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
        const permitted: UserDto = user(true);
        const permittedWithDebug: UserDto = user(true, true);

        async function enterScore(score: number, noOfDarts?: number) {
            await keyPad(context, score.toString().split('').concat(ENTER_SCORE_BUTTON));
            if (noOfDarts) {
                await checkoutWith(context, noOfDarts.toString());
            }
        }

        async function enterFirstPlayerScores(threeDartScores: number[]) {
            let cumulativeScore: number = 0;

            for (const score of threeDartScores) {
                cumulativeScore+= score;
                await enterScore(score, cumulativeScore === 501 ? 3 : undefined);
                await enterScore(1); // opponent score
            }
        }

        async function executeSaygScoringTest(match: TournamentMatchDto, sideAScores: number[], readOnly?: boolean) {
            const round = roundBuilder().withMatch(match).build();
            const tournamentData = tournamentBuilder().round(round).build();

            await renderComponent({
                setTournamentData,
                tournamentData,
                saveTournament,
                preventScroll: false,
                setPreventScroll,
                setDraggingSide,
                newMatch: {},
                setNewMatch,
            }, {
                match,
                matchIndex: 0,
                patchData,
                matchOptions,
                readOnly
            }, permitted);
            reportedError.verifyNoError();
            const createDataButton = context.container.querySelector('button')!;
            expect(createDataButton.textContent).toEqual(START_SCORING);
            await doClick(createDataButton);
            const dialog = context.container.querySelector('.modal-dialog')!;

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

            await renderComponent(containerProps(tournamentData), {
                match,
                matchIndex: 0,
                patchData,
                matchOptions,
                showViewSayg: true,
            });
            reportedError.verifyNoError();

            const viewLink = context.container.querySelector('a')!;
            expect(viewLink.textContent).toEqual('📊 1 - 2');
            expect(viewLink.href).toEqual(`http://localhost/live/match/${saygId}`);
        });

        it('prompts user to save match if no id', async () => {
            const match = tournamentMatchBuilder().noId().sideA(sideA).sideB(sideB).build();
            const round = roundBuilder().withMatch(match).build();
            const tournamentData = tournamentBuilder().round(round).build();
            await renderComponent(containerProps(tournamentData), {
                match,
                matchIndex: 0,
                patchData,
                matchOptions,
            }, permitted);
            reportedError.verifyNoError();
            const createDataButton = context.container.querySelector('button')!;
            expect(createDataButton.textContent).toEqual(START_SCORING);

            await doClick(createDataButton);

            context.prompts.alertWasShown('Save the tournament first');
            expect(tournamentSaved).toBeNull();
            reportedError.verifyNoError();
        });

        it('saves the tournament before creating data', async () => {
            const match = tournamentMatchBuilder().sideA(sideA).sideB(sideB).build();
            const round = roundBuilder().withMatch(match).build();
            const tournamentData = tournamentBuilder().round(round).build();
            await renderComponent(containerProps(tournamentData), {
                match,
                matchIndex: 0,
                patchData,
                matchOptions,
            }, permitted);
            reportedError.verifyNoError();
            const createDataButton = context.container.querySelector('button')!;
            expect(createDataButton.textContent).toEqual(START_SCORING);

            await doClick(createDataButton);

            reportedError.verifyNoError();
            context.prompts.alertWasNotShown('');
            expect(tournamentSaved).toEqual({
                preventLoading: true,
            });
        });

        it('creates sayg data for match', async () => {
            const match = tournamentMatchBuilder().sideA(sideA).sideB(sideB).build();
            const round = roundBuilder().withMatch(match).build();
            const tournamentData = tournamentBuilder().round(round).build();
            await renderComponent(containerProps(tournamentData), {
                match,
                matchIndex: 0,
                patchData,
                matchOptions,
            }, permitted);
            reportedError.verifyNoError();
            const createDataButton = context.container.querySelector('button')!;
            expect(createDataButton.textContent).toEqual(START_SCORING);

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
            await renderComponent(containerProps(tournamentData), {
                match,
                matchIndex: 0,
                patchData,
                matchOptions,
            }, permitted);
            reportedError.verifyNoError();
            const createDataButton = context.container.querySelector('button')!;
            expect(createDataButton.textContent).toEqual(START_SCORING);
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

            await renderComponent(containerProps(tournamentData), {
                match,
                matchIndex: 0,
                patchData,
                matchOptions,
            }, permitted);
            reportedError.verifyNoError();
            const createDataButton = context.container.querySelector('button')!;
            expect(createDataButton.textContent).toEqual(START_SCORING);

            await doClick(createDataButton);

            reportedError.verifyNoError();
            expect(updatedTournament).toEqual({
                id: tournamentData.id,
                type: 'SAYG ADDED',
                address: '',
                date: '',
            });
            expect(context.container.querySelector('.modal-dialog')).toBeTruthy();
            expect(scrollPrevented).toEqual(true);
        });

        it('does not show live link in dialog if sideA won', async () => {
            const sayg = saygBuilder()
                .numberOfLegs(1)
                .yourName(sideA.name!).opponentName(sideB.name)
                .scores(1, 0)
                .withLeg(0, (l: ILegBuilder) => l
                    .playerSequence('home', 'away')
                    .currentThrow('home')
                    .startingScore(501)
                    .home((c: ILegCompetitorScoreBuilder) => c.withThrow(180).withThrow(180).withThrow(141))
                    .away((c: ILegCompetitorScoreBuilder) => c.withThrow(100).withThrow(100)))
                .addTo(saygDataLookup)
                .build();
            const match = tournamentMatchBuilder()
                .sideA(sideA, 3) // winner
                .sideB(sideB, 0)
                .saygId(sayg.id)
                .build();
            const round = roundBuilder().withMatch(match).build();
            const tournamentData = tournamentBuilder().round(round).build();

            await renderComponent(containerProps(tournamentData), {
                match,
                matchIndex: 0,
                patchData,
                matchOptions,
            }, permitted);
            reportedError.verifyNoError();
            const createDataButton = context.container.querySelector('button')!;
            expect(createDataButton.textContent).toEqual('📊 3 - 0');

            await doClick(createDataButton);

            const dialog = context.container.querySelector('.modal-dialog')!;
            expect(dialog).toBeTruthy();
            expect(dialog.querySelector('.modal-header')!.textContent).toContain('SIDE A vs SIDE B - best of 1');
            expect(dialog.innerHTML).toContain('Match statistics');
            expect(scrollPrevented).toEqual(true);
        });

        it('does not show live link in dialog if sideB won', async () => {
            const sayg = saygBuilder()
                .numberOfLegs(1)
                .yourName(sideA.name!).opponentName(sideB.name)
                .scores(0, 1)
                .withLeg(0, (l: ILegBuilder) => l
                    .playerSequence('home', 'away')
                    .currentThrow('home')
                    .startingScore(501)
                    .home((c: ILegCompetitorScoreBuilder) => c.withThrow(100).withThrow(100))
                    .away((c: ILegCompetitorScoreBuilder) => c.withThrow(180).withThrow(180).withThrow(141)))
                .addTo(saygDataLookup)
                .build();
            const match = tournamentMatchBuilder()
                .sideA(sideA, 0)
                .sideB(sideB, 3) // winner
                .saygId(sayg.id)
                .build();
            const round = roundBuilder().withMatch(match).build();
            const tournamentData = tournamentBuilder().round(round).build();

            await renderComponent(containerProps(tournamentData), {
                match,
                matchIndex: 0,
                patchData,
                matchOptions,
            }, permitted);
            reportedError.verifyNoError();
            const createDataButton = context.container.querySelector('button')!;
            expect(createDataButton.textContent).toEqual('📊 0 - 3');

            await doClick(createDataButton);

            const dialog = context.container.querySelector('.modal-dialog')!;
            expect(dialog).toBeTruthy();
            expect(dialog.querySelector('.modal-header')!.textContent).toContain('SIDE A vs SIDE B - best of 1');
            expect(dialog.innerHTML).toContain('Match statistics');
            expect(scrollPrevented).toEqual(true);
        });

        it('can close dialog', async () => {
            const saygId = createTemporaryId();
            const match = tournamentMatchBuilder().sideA(sideA).sideB(sideB).saygId(saygId).build();
            const round = roundBuilder().withMatch(match).build();
            const tournamentData = tournamentBuilder().round(round).build();

            await renderComponent(containerProps(tournamentData), {
                match,
                matchIndex: 0,
                patchData,
                matchOptions,
            }, permitted);
            reportedError.verifyNoError();
            const createDataButton = context.container.querySelector('button')!;
            expect(createDataButton.textContent).toEqual(START_SCORING);
            await doClick(createDataButton);
            const dialog = context.container.querySelector('.modal-dialog')!;

            await doClick(findButton(dialog, 'Close'));

            expect(context.container.querySelector('.modal-dialog')).toBeFalsy();
            expect(scrollPrevented).toEqual(false);
        });

        it('can patch data with updated score', async () => {
            const saygData = saygBuilder()
                .numberOfLegs(matchOptions.numberOfLegs!)
                .scores(0, 0)
                .yourName(sideA.name!)
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
                saygId: saygData.id,
            }]);
        });

        it('reports and patches hi-checks when single-player', async () => {
            const saygData = saygBuilder()
                .numberOfLegs(matchOptions.numberOfLegs!)
                .scores(0, 0)
                .yourName(sideA.name!)
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
                        name: sideA.players![0].name,
                        id: sideA.players![0].id,
                    },
                }
            }]);
        });

        it('reports and patches 180s when single-player', async () => {
            const saygData = saygBuilder()
                .numberOfLegs(matchOptions.numberOfLegs!)
                .scores(0, 0)
                .yourName(sideA.name!)
                .opponentName(sideB.name)
                .startingScore(501)
                .addTo(saygDataLookup)
                .build();
            const match = tournamentMatchBuilder().sideA(sideA).sideB(sideB).saygId(saygData.id).build();

            await executeSaygScoringTest(match, [180]);

            expect(patchedData).toEqual([{
                patch: {
                    additional180: {
                        name: sideA.players![0].name,
                        id: sideA.players![0].id,
                    },
                }
            }]);
        });

        it('does not report or patch hi-checks when teams', async () => {
            const saygData = saygBuilder()
                .numberOfLegs(matchOptions.numberOfLegs!)
                .scores(0, 0)
                .yourName(teamA.name!)
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
                .numberOfLegs(matchOptions.numberOfLegs!)
                .scores(0, 0)
                .yourName(teamA.name!)
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
                .numberOfLegs(matchOptions.numberOfLegs!)
                .scores(0, 0)
                .yourName(pairA.name!)
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
                .numberOfLegs(matchOptions.numberOfLegs!)
                .scores(0, 0)
                .yourName(pairA.name!)
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
                .numberOfLegs(matchOptions.numberOfLegs!)
                .scores(0, 0)
                .yourName(sideA.name!)
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
                .numberOfLegs(matchOptions.numberOfLegs!)
                .scores(0, 0)
                .yourName(sideA.name!)
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
                .numberOfLegs(matchOptions.numberOfLegs!)
                .scores(0, 0)
                .yourName(sideA.name!)
                .opponentName(sideB.name)
                .startingScore(501)
                .addTo(saygDataLookup)
                .build();
            const match = tournamentMatchBuilder().sideA(sideA).sideB(sideB).saygId(saygData.id).build();
            const round = roundBuilder().withMatch(match).build();
            const tournamentData = tournamentBuilder().round(round).build();

            await renderComponent(containerProps(tournamentData), {
                match,
                matchIndex: 0,
                patchData,
                matchOptions,
            }, permittedWithDebug);
            reportedError.verifyNoError();
            const createDataButton = context.container.querySelector('button')!;
            expect(createDataButton.textContent).toEqual(START_SCORING);
            await doClick(createDataButton);
            const dialog = context.container.querySelector('.modal-dialog')!;
            context.prompts.respondToConfirm('Are you sure you want to delete the sayg data for this match?', false);

            await doClick(findButton(dialog, 'Debug options'));
            const deleteButton = dialog.querySelector('.dropdown-item.text-danger')!;
            expect(deleteButton.textContent).toEqual('Delete sayg');
            await doClick(deleteButton);

            reportedError.verifyNoError();
            context.prompts.confirmWasShown('Are you sure you want to delete the sayg data for this match?');
        });

        it('can delete sayg then close dialog and update tournament data', async () => {
            const saygData = saygBuilder()
                .numberOfLegs(matchOptions.numberOfLegs!)
                .scores(0, 0)
                .yourName(sideA.name!)
                .opponentName(sideB.name)
                .startingScore(501)
                .addTo(saygDataLookup)
                .build();
            const match = tournamentMatchBuilder().sideA(sideA).sideB(sideB).saygId(saygData.id).build();
            const round = roundBuilder().withMatch(match).build();
            const tournamentData = tournamentBuilder().round(round).build();

            await renderComponent(containerProps(tournamentData), {
                match,
                matchIndex: 0,
                patchData,
                matchOptions,
            }, permittedWithDebug);
            reportedError.verifyNoError();
            const createDataButton = context.container.querySelector('button')!;
            expect(createDataButton.textContent).toEqual(START_SCORING);
            await doClick(createDataButton);
            const dialog = context.container.querySelector('.modal-dialog')!;
            context.prompts.respondToConfirm('Are you sure you want to delete the sayg data for this match?', true);
            context.prompts.respondToConfirm('Clear match score (to allow scores to be re-recorded?)', true);
            apiResponse = {
                result: tournamentData,
                success: true,
            };

            await doClick(findButton(dialog, 'Debug options'));
            const deleteButton = dialog.querySelector('.dropdown-item.text-danger')!;
            expect(deleteButton.textContent).toEqual('Delete sayg');
            await doClick(deleteButton);

            reportedError.verifyNoError();
            expect(deletedSayg).toEqual({
                id: tournamentData.id,
                matchId: match.id,
            });
            expect(updatedTournament).toEqual(tournamentData);
            expect(context.container.querySelector('.modal-dialog')).toBeFalsy();
        });

        it('shows error if unable to delete sayg', async () => {
            const saygData = saygBuilder()
                .numberOfLegs(matchOptions.numberOfLegs!)
                .scores(0, 0)
                .yourName(sideA.name!)
                .opponentName(sideB.name)
                .startingScore(501)
                .addTo(saygDataLookup)
                .build();
            const match = tournamentMatchBuilder().sideA(sideA).sideB(sideB).saygId(saygData.id).build();
            const round = roundBuilder().withMatch(match).build();
            const tournamentData = tournamentBuilder().round(round).build();

            await renderComponent(containerProps(tournamentData), {
                match,
                matchIndex: 0,
                patchData,
                matchOptions,
            }, permittedWithDebug);
            reportedError.verifyNoError();
            const createDataButton = context.container.querySelector('button')!;
            expect(createDataButton.textContent).toEqual(START_SCORING);
            await doClick(createDataButton);
            const dialog = context.container.querySelector('.modal-dialog')!;
            context.prompts.respondToConfirm('Are you sure you want to delete the sayg data for this match?', true);
            apiResponse = {
                success: false,
                errors: [ 'SOME ERROR' ],
            };

            await doClick(findButton(dialog, 'Debug options'));
            const deleteButton = dialog.querySelector('.dropdown-item.text-danger')!;
            expect(deleteButton.textContent).toEqual('Delete sayg');
            await doClick(deleteButton);

            reportedError.verifyErrorEquals(apiResponse);
            expect(deletedSayg).toEqual({
                id: tournamentData.id,
                matchId: match.id,
            });
            expect(updatedTournament).toBeNull();
            expect(context.container.querySelector('.modal-dialog')).toBeTruthy();
        });
    });
});