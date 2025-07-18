import {
    api,
    appProps,
    brandingProps,
    cleanUp,
    doClick,
    ErrorState,
    findButton,
    iocProps,
    renderApp,
    TestContext,
    user,
} from '../../helpers/tests';
import {
    ITournamentContainerProps,
    TournamentContainer,
} from './TournamentContainer';
import { UserDto } from '../../interfaces/models/dtos/Identity/UserDto';
import { IMatchSaygProps, MatchSayg } from './MatchSayg';
import { TournamentGameDto } from '../../interfaces/models/dtos/Game/TournamentGameDto';
import {
    ITournamentMatchBuilder,
    sideBuilder,
    tournamentBuilder,
} from '../../helpers/builders/tournaments';
import { matchOptionsBuilder } from '../../helpers/builders/games';
import { PatchTournamentDto } from '../../interfaces/models/dtos/Game/PatchTournamentDto';
import { PatchTournamentRoundDto } from '../../interfaces/models/dtos/Game/PatchTournamentRoundDto';
import { createTemporaryId } from '../../helpers/projection';
import { ITournamentGameApi } from '../../interfaces/apis/ITournamentGameApi';
import { CreateTournamentSaygDto } from '../../interfaces/models/dtos/Game/CreateTournamentSaygDto';
import { IClientActionResultDto } from '../common/IClientActionResultDto';
import { ISaygApi } from '../../interfaces/apis/ISaygApi';
import { UpdateRecordedScoreAsYouGoDto } from '../../interfaces/models/dtos/Game/Sayg/UpdateRecordedScoreAsYouGoDto';
import { RecordedScoreAsYouGoDto } from '../../interfaces/models/dtos/Game/Sayg/RecordedScoreAsYouGoDto';
import { saygBuilder } from '../../helpers/builders/sayg';
import { ENTER_SCORE_BUTTON } from '../../helpers/constants';
import { checkoutWith, keyPad } from '../../helpers/sayg';
import { START_SCORING } from './tournaments';
import { tournamentContainerPropsBuilder } from './tournamentContainerPropsBuilder';
import { BuilderParam } from '../../helpers/builders/builders';

describe('MatchSayg', () => {
    let context: TestContext;
    let reportedError: ErrorState;
    let updatedTournament: TournamentGameDto | null;
    let patchedData: {
        patch: PatchTournamentDto | PatchTournamentRoundDto;
        nestInRound?: boolean;
        saygId?: string;
    }[];
    let tournamentSaved: { preventLoading?: boolean } | null;
    let addedSayg: { id: string; saygRequest: CreateTournamentSaygDto } | null;
    let apiResponse: IClientActionResultDto<TournamentGameDto> | null = null;
    let saygApiResponse: IClientActionResultDto<RecordedScoreAsYouGoDto> | null =
        null;
    let saygDataLookup: { [id: string]: RecordedScoreAsYouGoDto };
    let deletedSayg: { id: string; matchId: string } | null;

    const tournamentApi = api<ITournamentGameApi>({
        async addSayg(
            id: string,
            saygRequest: CreateTournamentSaygDto,
        ): Promise<IClientActionResultDto<TournamentGameDto>> {
            addedSayg = { id, saygRequest };
            return (
                apiResponse || {
                    success: true,
                    result: {
                        id: id,
                        type: 'SAYG ADDED',
                        address: '',
                        date: '',
                    },
                }
            );
        },
        async deleteSayg(
            id: string,
            matchId: string,
        ): Promise<IClientActionResultDto<TournamentGameDto>> {
            deletedSayg = { id, matchId };
            return (
                apiResponse || {
                    success: true,
                    result: {
                        id,
                        type: 'SAYG DELETED',
                        address: '',
                        date: '',
                    },
                }
            );
        },
    });
    const saygApi = api<ISaygApi>({
        async get(id: string): Promise<RecordedScoreAsYouGoDto | null> {
            return saygDataLookup[id];
        },
        async upsert(
            data: UpdateRecordedScoreAsYouGoDto,
        ): Promise<IClientActionResultDto<RecordedScoreAsYouGoDto>> {
            return (
                saygApiResponse || {
                    success: true,
                    result: Object.assign({}, data) as RecordedScoreAsYouGoDto,
                }
            );
        },
    });

    async function setTournamentData(newTournamentData: TournamentGameDto) {
        updatedTournament = newTournamentData;
    }

    async function saveTournament(
        preventLoading?: boolean,
    ): Promise<TournamentGameDto | undefined> {
        tournamentSaved = {
            preventLoading,
        };
        return undefined;
    }

    async function patchData(
        patch: PatchTournamentDto | PatchTournamentRoundDto,
        nestInRound?: boolean,
        saygId?: string,
    ) {
        patchedData.push({ patch, nestInRound, saygId });
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
    });

    async function renderComponent(
        containerProps: ITournamentContainerProps,
        props: IMatchSaygProps,
        account?: UserDto,
    ) {
        context = await renderApp(
            iocProps({ tournamentApi, saygApi }),
            brandingProps(),
            appProps({ account }, reportedError),
            <TournamentContainer {...containerProps}>
                <MatchSayg {...props} />
            </TournamentContainer>,
        );
        reportedError.verifyNoError();
    }

    function matchSaygProps(
        customisations: Partial<IMatchSaygProps>,
    ): IMatchSaygProps {
        return {
            match: null!,
            matchOptions: null!,
            matchIndex: 0,
            patchData,
            ...customisations,
        };
    }

    function dialog() {
        return context.container.querySelector('.modal-dialog');
    }

    describe('renders', () => {
        const matchOptions = matchOptionsBuilder().build();
        const sideA = sideBuilder('SIDE A').withPlayer('PLAYER A').build();
        const sideB = sideBuilder('SIDE B').withPlayer('PLAYER B').build();
        const sideC_multiplePlayers = sideBuilder('SIDE C')
            .withPlayer('PLAYER C 1')
            .withPlayer('PLAYER C 2')
            .build();
        const notPermitted: UserDto = user({ recordScoresAsYouGo: false });
        const permitted: UserDto = user({ recordScoresAsYouGo: true });
        const containerProps = new tournamentContainerPropsBuilder({
            saveTournament,
            setTournamentData,
        });
        const sideASideBTournament = tournamentBuilder()
            .round((b) =>
                b.withMatch((m) =>
                    m.sideA(sideA).sideB(sideB).saygId(createTemporaryId()),
                ),
            )
            .build();

        it('shows no sayg links when no players', async () => {
            const tournamentData = tournamentBuilder()
                .round((b) =>
                    b.withMatch((m) => m.sideA((s) => s).sideB((s) => s)),
                )
                .build();
            const match = tournamentData.round?.matches![0]!;
            match.sideA.players = undefined;
            match.sideB.players = undefined;

            await renderComponent(
                containerProps.withTournament(tournamentData).build(),
                matchSaygProps({ match, matchOptions }),
                permitted,
            );

            expect(context.container.innerHTML).not.toContain('📊');
            expect(context.container.innerHTML).not.toContain(START_SCORING);
        });

        it('shows no sayg links when no data and not logged in', async () => {
            await renderComponent(
                containerProps.withTournament(sideASideBTournament).build(),
                matchSaygProps({
                    match: sideASideBTournament.round?.matches![0]!,
                    matchOptions,
                }),
            );

            expect(context.container.innerHTML).not.toContain('📊');
            expect(context.container.innerHTML).not.toContain(START_SCORING);
        });

        it('shows no sayg links when no data and not permitted', async () => {
            await renderComponent(
                containerProps.withTournament(sideASideBTournament).build(),
                matchSaygProps({
                    match: sideASideBTournament.round?.matches![0]!,
                    matchOptions,
                }),
                notPermitted,
            );

            expect(context.container.innerHTML).not.toContain('📊');
            expect(context.container.innerHTML).not.toContain(START_SCORING);
        });

        it('shows no sayg links when no data and sideA not selected', async () => {
            const tournamentData = tournamentBuilder()
                .round((b) =>
                    b.withMatch((m) =>
                        m.sideB(sideB).saygId(createTemporaryId()),
                    ),
                )
                .build();

            await renderComponent(
                containerProps.withTournament(tournamentData).build(),
                matchSaygProps({
                    match: tournamentData.round?.matches![0]!,
                    matchOptions,
                }),
            );

            expect(context.container.innerHTML).not.toContain('📊');
            expect(context.container.innerHTML).not.toContain(START_SCORING);
        });

        it('shows no sayg links when no data and sideB not selected', async () => {
            const tournamentData = tournamentBuilder()
                .round((b) =>
                    b.withMatch((m) =>
                        m.sideA(sideA).saygId(createTemporaryId()),
                    ),
                )
                .build();

            await renderComponent(
                containerProps.withTournament(tournamentData).build(),
                matchSaygProps({
                    match: tournamentData.round?.matches![0]!,
                    matchOptions,
                }),
            );

            expect(context.container.innerHTML).not.toContain('📊');
            expect(context.container.innerHTML).not.toContain(START_SCORING);
        });

        it('shows view sayg link when data and not logged in', async () => {
            await renderComponent(
                containerProps.withTournament(sideASideBTournament).build(),
                matchSaygProps({
                    match: sideASideBTournament.round?.matches![0]!,
                    matchOptions,
                    showViewSayg: true,
                }),
            );

            expect(context.container.innerHTML).toContain('📊');
            expect(context.container.innerHTML).not.toContain(START_SCORING);
        });

        it('shows view sayg link when data and not permitted', async () => {
            await renderComponent(
                containerProps.withTournament(sideASideBTournament).build(),
                matchSaygProps({
                    match: sideASideBTournament.round?.matches![0]!,
                    matchOptions,
                    showViewSayg: true,
                }),
                notPermitted,
            );

            expect(context.container.innerHTML).toContain('📊');
            expect(context.container.innerHTML).not.toContain(START_SCORING);
        });

        it('does not show view sayg link when data and not permitted and not requested', async () => {
            await renderComponent(
                containerProps.withTournament(sideASideBTournament).build(),
                matchSaygProps({
                    match: sideASideBTournament.round?.matches![0]!,
                    matchOptions,
                }),
                notPermitted,
            );

            expect(context.container.innerHTML).not.toContain(START_SCORING);
        });

        it('shows edit sayg link when data and permitted', async () => {
            await renderComponent(
                containerProps.withTournament(sideASideBTournament).build(),
                matchSaygProps({
                    match: sideASideBTournament.round?.matches![0]!,
                    matchOptions,
                }),
                permitted,
            );

            expect(context.container.innerHTML).toContain(START_SCORING);
        });

        it('shows edit sayg link when no data but single round (superleague)', async () => {
            const tournamentData = tournamentBuilder()
                .singleRound()
                .round((b) =>
                    b.withMatch((m) =>
                        m.sideA(sideA).sideB(sideB).saygId(createTemporaryId()),
                    ),
                )
                .build();

            await renderComponent(
                containerProps.withTournament(tournamentData).build(),
                matchSaygProps({
                    match: tournamentData.round?.matches![0]!,
                    matchOptions,
                }),
                permitted,
            );

            expect(context.container.innerHTML).toContain(START_SCORING);
        });

        it('shows edit sayg link when no data and both sides have single players', async () => {
            await renderComponent(
                containerProps.withTournament(sideASideBTournament).build(),
                matchSaygProps({
                    match: sideASideBTournament.round?.matches![0]!,
                    matchOptions,
                }),
                permitted,
            );

            expect(context.container.innerHTML).toContain(START_SCORING);
        });

        it('shows no edit sayg link when no data and sideA does not have a single player', async () => {
            const tournamentData = tournamentBuilder()
                .round((b) =>
                    b.withMatch((m) =>
                        m.sideA(sideC_multiplePlayers).sideB(sideB),
                    ),
                )
                .build();

            await renderComponent(
                containerProps.withTournament(tournamentData).build(),
                matchSaygProps({
                    match: tournamentData.round?.matches![0]!,
                    matchOptions,
                }),
                permitted,
            );

            expect(context.container.innerHTML).not.toContain('📊');
            expect(context.container.innerHTML).not.toContain(START_SCORING);
        });

        it('shows no edit sayg link when no data and sideB does not have a single player', async () => {
            const tournamentData = tournamentBuilder()
                .round((b) =>
                    b.withMatch((m) =>
                        m.sideA(sideA).sideB(sideC_multiplePlayers),
                    ),
                )
                .build();

            await renderComponent(
                containerProps.withTournament(tournamentData).build(),
                matchSaygProps({
                    match: tournamentData.round?.matches![0]!,
                    matchOptions,
                }),
                permitted,
            );

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
        const pairA = sideBuilder('PAIR A')
            .withPlayer('PLAYER A 1')
            .withPlayer('PLAYER A 2')
            .build();
        const pairB = sideBuilder('PAIR B')
            .withPlayer('PLAYER B 1')
            .withPlayer('PLAYER B 2')
            .build();
        const permitted: UserDto = user({ recordScoresAsYouGo: true });
        const permittedWithDebug: UserDto = user({
            recordScoresAsYouGo: true,
            showDebugOptions: true,
        });
        const containerProps = new tournamentContainerPropsBuilder({
            saveTournament,
            setTournamentData,
        });
        const sideASideBTournament = tournamentBuilder()
            .round((b) => b.withMatch((m) => m.sideA(sideA).sideB(sideB)))
            .build();
        let saygData: RecordedScoreAsYouGoDto;

        async function enterScore(score: number, noOfDarts?: number) {
            await keyPad(
                context,
                score.toString().split('').concat(ENTER_SCORE_BUTTON),
            );
            if (noOfDarts) {
                await checkoutWith(context, noOfDarts.toString());
            }
        }

        async function enterFirstPlayerScores(threeDartScores: number[]) {
            let cumulativeScore: number = 0;

            for (const score of threeDartScores) {
                cumulativeScore += score;
                await enterScore(
                    score,
                    cumulativeScore === 501 ? 3 : undefined,
                );
                await enterScore(1); // opponent score
            }
        }

        async function executeSaygScoringTest(
            matchBuilder: BuilderParam<ITournamentMatchBuilder>,
            sideAScores: number[],
            readOnly?: boolean,
        ) {
            const tournamentData = tournamentBuilder()
                .round((b) => b.withMatch(matchBuilder))
                .build();
            const match = tournamentData.round!.matches![0];

            await renderComponent(
                containerProps.withTournament(tournamentData).build(),
                matchSaygProps({ match, matchOptions, readOnly }),
                permitted,
            );
            await doClick(findButton(context.container, START_SCORING));

            reportedError.verifyNoError();
            await doClick(findButton(dialog(), `🎯${match.sideA.name}`)); // pick sideA goes first
            patchedData = [];
            await enterFirstPlayerScores(sideAScores);

            reportedError.verifyNoError();
        }

        beforeEach(() => {
            saygData = saygBuilder()
                .numberOfLegs(matchOptions.numberOfLegs!)
                .scores(0, 0)
                .yourName(sideA.name!)
                .opponentName(sideB.name)
                .startingScore(501)
                .addTo(saygDataLookup)
                .build();
        });

        it('navigates to live data', async () => {
            const saygId = createTemporaryId();
            const tournamentData = tournamentBuilder()
                .round((b) =>
                    b.withMatch((m) =>
                        m.sideA(sideA, 1).sideB(sideB, 2).saygId(saygId),
                    ),
                )
                .build();

            await renderComponent(
                containerProps.withTournament(tournamentData).build(),
                matchSaygProps({
                    match: tournamentData.round?.matches![0]!,
                    matchOptions,
                    showViewSayg: true,
                }),
            );

            const viewLink = context.container.querySelector('a')!;
            expect(viewLink.textContent).toEqual('📊 1 - 2');
            expect(viewLink.href).toEqual(
                `http://localhost/live/match/?id=${saygId}`,
            );
        });

        it('prompts user to save match if no id', async () => {
            const tournamentData = tournamentBuilder()
                .round((b) =>
                    b.withMatch((m) => m.noId().sideA(sideA).sideB(sideB)),
                )
                .build();
            await renderComponent(
                containerProps.withTournament(tournamentData).build(),
                matchSaygProps({
                    match: tournamentData.round?.matches![0]!,
                    matchOptions,
                }),
                permitted,
            );

            await doClick(findButton(context.container, START_SCORING));

            context.prompts.alertWasShown('Save the tournament first');
            expect(tournamentSaved).toBeNull();
            reportedError.verifyNoError();
        });

        it('saves the tournament before creating data', async () => {
            await renderComponent(
                containerProps.withTournament(sideASideBTournament).build(),
                matchSaygProps({
                    match: sideASideBTournament.round?.matches![0]!,
                    matchOptions,
                }),
                permitted,
            );

            await doClick(findButton(context.container, START_SCORING));

            reportedError.verifyNoError();
            context.prompts.alertWasNotShown('');
            expect(tournamentSaved).toEqual({
                preventLoading: true,
            });
        });

        it('creates sayg data for match', async () => {
            await renderComponent(
                containerProps.withTournament(sideASideBTournament).build(),
                matchSaygProps({
                    match: sideASideBTournament.round?.matches![0]!,
                    matchOptions,
                }),
                permitted,
            );

            await doClick(findButton(context.container, START_SCORING));

            reportedError.verifyNoError();
            expect(addedSayg).toEqual({
                id: sideASideBTournament.id,
                saygRequest: {
                    matchOptions,
                    matchId: sideASideBTournament.round?.matches![0].id,
                },
            });
        });

        it('shows error if unable to create sayg data', async () => {
            await renderComponent(
                containerProps.withTournament(sideASideBTournament).build(),
                matchSaygProps({
                    match: sideASideBTournament.round?.matches![0]!,
                    matchOptions,
                }),
                permitted,
            );
            apiResponse = {
                success: false,
                errors: ['SOME ERROR'],
            };

            await doClick(findButton(context.container, START_SCORING));

            reportedError.verifyNoError();
            expect(updatedTournament).toBeNull();
            expect(context.container.textContent).toContain('SOME ERROR');
        });

        it('updates tournament data and shows dialog once data created', async () => {
            await renderComponent(
                containerProps.withTournament(sideASideBTournament).build(),
                matchSaygProps({
                    match: sideASideBTournament.round?.matches![0]!,
                    matchOptions,
                }),
                permitted,
            );

            await doClick(findButton(context.container, START_SCORING));

            reportedError.verifyNoError();
            expect(updatedTournament).toEqual({
                id: sideASideBTournament.id,
                type: 'SAYG ADDED',
                address: '',
                date: '',
            });
            expect(dialog()).toBeTruthy();
        });

        it('does not show live link in dialog if sideA won', async () => {
            const sayg = saygBuilder()
                .numberOfLegs(1)
                .yourName(sideA.name!)
                .opponentName(sideB.name)
                .scores(1, 0)
                .withLeg(0, (l) =>
                    l
                        .playerSequence('home', 'away')
                        .currentThrow('home')
                        .startingScore(501)
                        .home((c) =>
                            c.withThrow(180).withThrow(180).withThrow(141),
                        )
                        .away((c) => c.withThrow(100).withThrow(100)),
                )
                .addTo(saygDataLookup)
                .build();
            const tournamentData = tournamentBuilder()
                .round((b) =>
                    b.withMatch((m) =>
                        m
                            .sideA(sideA, 3) // winner
                            .sideB(sideB, 0)
                            .saygId(sayg.id),
                    ),
                )
                .build();

            await renderComponent(
                containerProps.withTournament(tournamentData).build(),
                matchSaygProps({
                    match: tournamentData.round?.matches![0]!,
                    matchOptions,
                }),
                permitted,
            );
            const createDataButton = context.container.querySelector('button')!;
            expect(createDataButton.textContent).toEqual('📊 3 - 0');

            await doClick(createDataButton);

            expect(dialog()).toBeTruthy();
            expect(
                dialog()!.querySelector('.modal-header')!.textContent,
            ).toContain('SIDE A vs SIDE B - best of 1');
            expect(dialog()!.innerHTML).toContain('Match statistics');
        });

        it('does not show live link in dialog if sideB won', async () => {
            const sayg = saygBuilder()
                .numberOfLegs(1)
                .yourName(sideA.name!)
                .opponentName(sideB.name)
                .scores(0, 1)
                .withLeg(0, (l) =>
                    l
                        .playerSequence('home', 'away')
                        .currentThrow('home')
                        .startingScore(501)
                        .home((c) => c.withThrow(100).withThrow(100))
                        .away((c) =>
                            c.withThrow(180).withThrow(180).withThrow(141),
                        ),
                )
                .addTo(saygDataLookup)
                .build();
            const tournamentData = tournamentBuilder()
                .round((b) =>
                    b.withMatch((m) =>
                        m
                            .sideA(sideA, 0)
                            .sideB(sideB, 3) // winner
                            .saygId(sayg.id),
                    ),
                )
                .build();

            await renderComponent(
                containerProps.withTournament(tournamentData).build(),
                matchSaygProps({
                    match: tournamentData.round?.matches![0]!,
                    matchOptions,
                }),
                permitted,
            );
            const createDataButton = context.container.querySelector('button')!;
            expect(createDataButton.textContent).toEqual('📊 0 - 3');

            await doClick(createDataButton);

            expect(dialog()).toBeTruthy();
            expect(
                dialog()!.querySelector('.modal-header')!.textContent,
            ).toContain('SIDE A vs SIDE B - best of 1');
            expect(dialog()!.innerHTML).toContain('Match statistics');
        });

        it('can close dialog', async () => {
            const saygId = createTemporaryId();
            const tournamentData = tournamentBuilder()
                .round((b) =>
                    b.withMatch((m) =>
                        m.sideA(sideA).sideB(sideB).saygId(saygId),
                    ),
                )
                .build();

            await renderComponent(
                containerProps.withTournament(tournamentData).build(),
                matchSaygProps({
                    match: tournamentData.round?.matches![0]!,
                    matchOptions,
                }),
                permitted,
            );
            await doClick(findButton(context.container, START_SCORING));

            await doClick(findButton(dialog(), 'Close'));

            expect(dialog()).toBeFalsy();
        });

        it('can patch data with updated score', async () => {
            await executeSaygScoringTest(
                (m) => m.sideA(sideA).sideB(sideB).saygId(saygData.id),
                [177, 177, 100, 47],
            );

            expect(patchedData).toEqual([
                {
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
                },
            ]);
        });

        it('reports and patches hi-checks when single-player', async () => {
            await executeSaygScoringTest(
                (m) => m.sideA(sideA).sideB(sideB).saygId(saygData.id),
                [100, 100, 100, 50, 151],
            );

            const patchesWithHiChecks = patchedData.filter(
                (p) =>
                    (p.patch as PatchTournamentDto).additionalOver100Checkout,
            );
            expect(patchesWithHiChecks).toEqual([
                {
                    patch: {
                        additionalOver100Checkout: {
                            score: 151,
                            name: sideA.players![0].name,
                            id: sideA.players![0].id,
                        },
                    },
                },
            ]);
        });

        it('reports and patches 180s when single-player', async () => {
            await executeSaygScoringTest(
                (m) => m.sideA(sideA).sideB(sideB).saygId(saygData.id),
                [180],
            );

            expect(patchedData).toEqual([
                {
                    patch: {
                        additional180: {
                            name: sideA.players![0].name,
                            id: sideA.players![0].id,
                        },
                    },
                },
            ]);
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

            await executeSaygScoringTest(
                (m) => m.sideA(teamA).sideB(teamB).saygId(saygData.id),
                [100, 100, 100, 50, 151],
            );

            const patchesWithHiChecks = patchedData.filter(
                (p) =>
                    (p.patch as PatchTournamentDto).additionalOver100Checkout,
            );
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

            await executeSaygScoringTest(
                (m) => m.sideA(teamA).sideB(teamB).saygId(saygData.id),
                [180],
            );

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

            await executeSaygScoringTest(
                (m) => m.sideA(pairA).sideB(pairB).saygId(saygData.id),
                [100, 100, 100, 50, 151],
            );

            const patchesWithHiChecks = patchedData.filter(
                (p) =>
                    (p.patch as PatchTournamentDto).additionalOver100Checkout,
            );
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

            await executeSaygScoringTest(
                (m) => m.sideA(pairA).sideB(pairB).saygId(saygData.id),
                [180],
            );

            expect(patchedData).toEqual([]);
        });

        it('does not report or patch hi-checks when readonly', async () => {
            await executeSaygScoringTest(
                (m) => m.sideA(sideA).sideB(sideB).saygId(saygData.id),
                [100, 100, 100, 50, 151],
                true,
            );

            const patchesWithHiChecks = patchedData.filter(
                (p) =>
                    (p.patch as PatchTournamentDto).additionalOver100Checkout,
            );
            expect(patchesWithHiChecks).toEqual([]);
        });

        it('does not report or patch 180 when readonly', async () => {
            await executeSaygScoringTest(
                (m) => m.sideA(sideA).sideB(sideB).saygId(saygData.id),
                [180],
                true,
            );

            expect(patchedData).toEqual([]);
        });

        it('confirms before deleting sayg', async () => {
            const tournamentData = tournamentBuilder()
                .round((b) =>
                    b.withMatch((m) =>
                        m.sideA(sideA).sideB(sideB).saygId(saygData.id),
                    ),
                )
                .build();

            await renderComponent(
                containerProps.withTournament(tournamentData).build(),
                matchSaygProps({
                    match: tournamentData.round?.matches![0]!,
                    matchOptions,
                }),
                permittedWithDebug,
            );
            await doClick(findButton(context.container, START_SCORING));
            context.prompts.respondToConfirm(
                'Are you sure you want to delete the sayg data for this match?',
                false,
            );

            await doClick(findButton(dialog(), 'Debug options'));
            const deleteButton = dialog()!.querySelector(
                '.dropdown-item.text-danger',
            )!;
            expect(deleteButton.textContent).toEqual('Delete sayg');
            await doClick(deleteButton);

            reportedError.verifyNoError();
            context.prompts.confirmWasShown(
                'Are you sure you want to delete the sayg data for this match?',
            );
        });

        it('can delete sayg then close dialog and update tournament data', async () => {
            const matchId = createTemporaryId();
            const tournamentData = tournamentBuilder()
                .round((b) =>
                    b.withMatch(
                        (m) => m.sideA(sideA).sideB(sideB).saygId(saygData.id),
                        matchId,
                    ),
                )
                .build();

            await renderComponent(
                containerProps.withTournament(tournamentData).build(),
                matchSaygProps({
                    match: tournamentData.round?.matches![0]!,
                    matchOptions,
                }),
                permittedWithDebug,
            );
            await doClick(findButton(context.container, START_SCORING));
            context.prompts.respondToConfirm(
                'Are you sure you want to delete the sayg data for this match?',
                true,
            );
            context.prompts.respondToConfirm(
                'Clear match score (to allow scores to be re-recorded?)',
                true,
            );
            apiResponse = {
                result: tournamentData,
                success: true,
            };

            await doClick(findButton(dialog(), 'Debug options'));
            const deleteButton = dialog()!.querySelector(
                '.dropdown-item.text-danger',
            )!;
            expect(deleteButton.textContent).toEqual('Delete sayg');
            await doClick(deleteButton);

            reportedError.verifyNoError();
            expect(deletedSayg).toEqual({
                id: tournamentData.id,
                matchId: matchId,
            });
            expect(updatedTournament).toEqual(tournamentData);
            expect(dialog()).toBeFalsy();
        });

        it('shows error if unable to delete sayg', async () => {
            const matchId = createTemporaryId();
            const tournamentData = tournamentBuilder()
                .round((b) =>
                    b.withMatch(
                        (m) => m.sideA(sideA).sideB(sideB).saygId(saygData.id),
                        matchId,
                    ),
                )
                .build();

            await renderComponent(
                containerProps.withTournament(tournamentData).build(),
                matchSaygProps({
                    match: tournamentData.round?.matches![0]!,
                    matchOptions,
                }),
                permittedWithDebug,
            );
            await doClick(findButton(context.container, START_SCORING));
            context.prompts.respondToConfirm(
                'Are you sure you want to delete the sayg data for this match?',
                true,
            );
            apiResponse = {
                success: false,
                errors: ['SOME ERROR'],
            };

            await doClick(findButton(dialog(), 'Debug options'));
            const deleteButton = dialog()!.querySelector(
                '.dropdown-item.text-danger',
            )!;
            expect(deleteButton.textContent).toEqual('Delete sayg');
            await doClick(deleteButton);

            reportedError.verifyErrorEquals(apiResponse);
            expect(deletedSayg).toEqual({
                id: tournamentData.id,
                matchId: matchId,
            });
            expect(updatedTournament).toBeNull();
            expect(dialog()).toBeTruthy();
        });
    });
});
