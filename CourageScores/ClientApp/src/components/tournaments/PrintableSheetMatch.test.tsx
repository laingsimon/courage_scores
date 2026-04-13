import {
    api,
    appProps,
    brandingProps,
    cleanUp,
    ErrorState,
    IComponent,
    iocProps,
    renderApp,
    TestContext,
    user,
} from '../../helpers/tests';
import { TournamentGameDto } from '../../interfaces/models/dtos/Game/TournamentGameDto';
import {
    ITournamentContainerProps,
    TournamentContainer,
} from './TournamentContainer';
import { IAppContainerProps } from '../common/AppContainer';
import {
    IPrintableSheetMatchProps,
    PrintableSheetMatch,
} from './PrintableSheetMatch';
import {
    sideBuilder,
    tournamentBuilder,
} from '../../helpers/builders/tournaments';
import { createTemporaryId } from '../../helpers/projection';
import { matchOptionsBuilder } from '../../helpers/builders/games';
import { PatchTournamentDto } from '../../interfaces/models/dtos/Game/PatchTournamentDto';
import { PatchTournamentRoundDto } from '../../interfaces/models/dtos/Game/PatchTournamentRoundDto';
import { RecordedScoreAsYouGoDto } from '../../interfaces/models/dtos/Game/Sayg/RecordedScoreAsYouGoDto';
import { ISaygApi } from '../../interfaces/apis/ISaygApi';
import { saygBuilder } from '../../helpers/builders/sayg';
import { UpdateRecordedScoreAsYouGoDto } from '../../interfaces/models/dtos/Game/Sayg/UpdateRecordedScoreAsYouGoDto';
import { IClientActionResultDto } from '../common/IClientActionResultDto';
import { ILayoutDataForMatch } from './layout/ILayoutDataForMatch';
import { START_SCORING } from './tournaments';
import { ITournamentGameApi } from '../../interfaces/apis/ITournamentGameApi';
import { TournamentSideDto } from '../../interfaces/models/dtos/Game/TournamentSideDto';
import { TournamentRoundDto } from '../../interfaces/models/dtos/Game/TournamentRoundDto';
import { tournamentContainerPropsBuilder } from './tournamentContainerPropsBuilder';
import { ILayoutDataForSide } from './layout/ILayoutDataForSide';

describe('PrintableSheetMatch', () => {
    let context: TestContext;
    let reportedError: ErrorState;
    let updatedTournament: TournamentGameDto | null;
    let patchedData: {
        patch: PatchTournamentDto | PatchTournamentRoundDto;
        nestInRound?: boolean;
    }[];
    let saygDataLookup: { [id: string]: RecordedScoreAsYouGoDto };
    let deletedSayg: {
        id: string;
        matchId: string;
        clearScores: boolean;
    } | null;
    let deletedSaygResponse: IClientActionResultDto<TournamentGameDto> | null;

    const saygApi = api<ISaygApi>({
        async get(id: string): Promise<RecordedScoreAsYouGoDto | null> {
            return saygDataLookup[id];
        },
        async upsert(data: UpdateRecordedScoreAsYouGoDto) {
            return {
                success: true,
                result: data as RecordedScoreAsYouGoDto,
            } as IClientActionResultDto<RecordedScoreAsYouGoDto>;
        },
    });
    const tournamentApi = api<ITournamentGameApi>({
        async deleteSayg(id: string, matchId: string, clearScores: boolean) {
            deletedSayg = { id, matchId, clearScores };
            return (deletedSaygResponse || {
                success: true,
            }) as IClientActionResultDto<TournamentGameDto>;
        },
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

    async function setTournamentData(update: TournamentGameDto) {
        updatedTournament = update;
    }

    async function renderComponent(
        containerProps: ITournamentContainerProps,
        props: IPrintableSheetMatchProps,
        appProps: IAppContainerProps,
    ) {
        context = await renderApp(
            iocProps({ saygApi, tournamentApi }),
            brandingProps(),
            appProps,
            <TournamentContainer {...containerProps}>
                <PrintableSheetMatch {...props} />
            </TournamentContainer>,
        );

        reportedError.verifyNoError();
    }

    function props(
        matchData: ILayoutDataForMatch,
        editable?: boolean,
        ...possibleSides: TournamentSideDto[]
    ): IPrintableSheetMatchProps {
        return {
            matchData,
            matchIndex: 0,
            roundIndex: 0,
            possibleSides,
            editable,
        };
    }

    function withRound(p: IPrintableSheetMatchProps, r: TournamentRoundDto) {
        p.round = r;
        return p;
    }

    function patchable(p: IPrintableSheetMatchProps) {
        p.patchData = async (p, n) =>
            patchedData.push({ patch: p, nestInRound: n });
        return p;
    }

    function withRoundIndex(p: IPrintableSheetMatchProps, index: number) {
        p.roundIndex = index;
        return p;
    }

    function dialog(): IComponent {
        return context.required('.modal-dialog');
    }

    function layoutDataForMatch(customisations?: Partial<ILayoutDataForMatch>) {
        return {
            scoreA: '',
            scoreB: '',
            sideA: side(),
            sideB: side(),
            ...customisations,
        } as ILayoutDataForMatch;
    }

    function hideMnemonic(customisations?: Partial<ILayoutDataForMatch>) {
        return layoutDataForMatch({
            hideMnemonic: true,
            ...customisations,
        });
    }

    function side(customisations?: Partial<ILayoutDataForSide>) {
        return {
            id: createTemporaryId(),
            name: '',
            ...customisations,
        } as ILayoutDataForSide;
    }

    function scoreDropdownItems(dialog: IComponent) {
        return dialog
            .all('.form-group :nth-child(4) div.dropdown-menu .dropdown-item')
            .map((i) => i.text());
    }

    async function selectSide(dialog: IComponent, name: string) {
        await dialog
            .required('.form-group :nth-child(2) div.dropdown-menu')
            .select(name);
    }

    async function selectScore(dialog: IComponent, score: string) {
        await dialog
            .required('.form-group :nth-child(4) div.dropdown-menu')
            .select(score);
    }

    async function editSide(side: 'sideA' | 'sideB') {
        await context.required(`div[datatype="${side}"]`).click();
    }

    function debugOptions(dialog: IComponent) {
        return dialog.required(
            '.modal-footer [datatype="debug-options"] .dropdown-menu',
        );
    }

    function bestOf(dialog: IComponent) {
        return dialog.input('bestOf');
    }

    function equatableSide(side: TournamentSideDto) {
        return {
            name: side.name,
            id: side.id,
            players: [],
        };
    }

    describe('renders', () => {
        const matchOptionDefaults = matchOptionsBuilder().build();
        const tournamentData = tournamentBuilder().build();
        const containerProps = new tournamentContainerPropsBuilder({
            matchOptionDefaults,
            async saveTournament() {
                return tournamentData;
            },
            setTournamentData,
        });

        it('match mnemonic', async () => {
            const matchData = layoutDataForMatch({
                sideA: side({ mnemonic: 'A' }),
                sideB: side({ mnemonic: 'B' }),
                mnemonic: 'M1',
            });
            await renderComponent(
                containerProps.withTournament(tournamentData).build(),
                props(matchData),
                appProps({}, reportedError),
            );

            const m = context.required('span[datatype="match-mnemonic"]');
            expect(m.text()).toEqual('M1');
        });

        it('when no match mnemonic', async () => {
            const matchData = layoutDataForMatch({
                sideA: side({ mnemonic: 'A' }),
                sideB: side({ mnemonic: 'B' }),
                mnemonic: 'M1',
                hideMnemonic: true,
            });
            await renderComponent(
                containerProps.withTournament(tournamentData).build(),
                props(matchData),
                appProps({}, reportedError),
            );

            const m = context.optional('span[datatype="match-mnemonic"]');
            expect(m).toBeFalsy();
        });

        it('sideA', async () => {
            const matchData = layoutDataForMatch({
                scoreA: '5',
                sideA: side({ mnemonic: 'A', link: <span>SIDE A</span> }),
                sideB: side({ mnemonic: 'B', link: <span>SIDE B</span> }),
                mnemonic: 'M1',
                hideMnemonic: true,
            });
            await renderComponent(
                containerProps.withTournament(tournamentData).build(),
                props(matchData),
                appProps({}, reportedError),
            );

            const sideA = context.required('div[datatype="sideA"]');
            const name = sideA.required('span[datatype="sideAname"]');
            const score = sideA.required('div[datatype="scoreA"]');
            expect(name.text()).toEqual('SIDE A');
            expect(score.text()).toEqual('5');
        });

        it('sideB', async () => {
            const matchData = layoutDataForMatch({
                scoreB: '7',
                scoreA: '5',
                sideA: side({ mnemonic: 'A', link: <span>SIDE A</span> }),
                sideB: side({ mnemonic: 'B', link: <span>SIDE B</span> }),
                mnemonic: 'M1',
                hideMnemonic: true,
            });
            await renderComponent(
                containerProps.withTournament(tournamentData).build(),
                props(matchData),
                appProps({}, reportedError),
            );

            const sideB = context.required('div[datatype="sideB"]');
            const name = sideB.required('span[datatype="sideBname"]');
            const score = sideB.required('div[datatype="scoreB"]');
            expect(name.text()).toEqual('SIDE B');
            expect(score.text()).toEqual('7');
        });
    });

    describe('interactivity', () => {
        const matchOptionDefaults = matchOptionsBuilder()
            .numberOfLegs(7)
            .build();
        const sideA = sideBuilder('SIDE A').build();
        const sideB = sideBuilder('SIDE B').build();
        const sideC = sideBuilder('SIDE C').build();
        const tournamentData = tournamentBuilder().build();
        let saygData: RecordedScoreAsYouGoDto & UpdateRecordedScoreAsYouGoDto;
        let matchData: ILayoutDataForMatch;
        let matchData1: ILayoutDataForMatch;
        let tournamentDataWithMatch: TournamentGameDto;
        const containerProps = new tournamentContainerPropsBuilder({
            matchOptionDefaults,
            async saveTournament() {
                return tournamentData;
            },
            setTournamentData,
        });
        const tournamentDataWithoutSayg = tournamentBuilder()
            .round((r) => r.withMatch((m) => m.sideA(sideA, 1).sideB(sideB, 2)))
            .build();
        const deleteSaygPrompt =
            'Are you sure you want to delete the sayg data for this match?';
        const clearScorePrompt =
            'Clear match score (to allow scores to be re-recorded?)';
        const debugAndSaygUser = user({
            recordScoresAsYouGo: true,
            showDebugOptions: true,
            manageTournaments: true,
        });

        function sideABWithLinks(c?: Partial<ILayoutDataForMatch>) {
            return layoutDataForMatch({
                sideA: side({
                    id: sideA.id,
                    link: <span>SIDE A</span>,
                    mnemonic: 'A',
                }),
                sideB: side({
                    id: sideB.id,
                    link: <span>SIDE B</span>,
                    mnemonic: 'B',
                }),
                ...c,
            });
        }
        const matchData57M1 = hideMnemonic({
            sideA: side({
                id: sideA.id,
                link: <span>SIDE A</span>,
                mnemonic: 'A',
            }),
            sideB: side({
                id: sideB.id,
                link: <span>SIDE B</span>,
                mnemonic: 'B',
            }),
            scoreA: '5',
            scoreB: '7',
            mnemonic: 'M1',
        });
        const tournamentDataAB57 = tournamentBuilder()
            .round((r) => r.withMatch((m) => m.sideA(sideA, 5).sideB(sideB, 7)))
            .build();

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
                sideA: {},
                sideB: {},
                mnemonic: 'M1',
                hideMnemonic: true,
            };

            tournamentDataWithMatch = tournamentBuilder()
                .round((r) =>
                    r.withMatch((m) =>
                        m.sideA(sideA).sideB(sideB).saygId(saygData.id),
                    ),
                )
                .build();

            matchData1 = hideMnemonic(
                sideABWithLinks({
                    scoreA: '1',
                    scoreB: '2',
                    mnemonic: 'M1',
                    match: tournamentDataWithMatch!.round!.matches![0],
                    saygId: saygData.id,
                }),
            );
        });

        it('can change side and score for sideA', async () => {
            await renderComponent(
                containerProps.withTournament(tournamentData).build(),
                props(matchData, true, sideA, sideB, sideC),
                appProps({}, reportedError),
            );
            await editSide('sideA');
            await selectSide(dialog(), 'SIDE C');
            await selectScore(dialog(), '1');
            await dialog().button('Save').click();

            expect(updatedTournament!.round).toEqual({
                id: expect.any(String),
                matchOptions: expect.any(Array),
                matches: [
                    {
                        id: expect.any(String),
                        scoreA: 1,
                        sideA: equatableSide(sideC),
                        sideB: {},
                    },
                ],
            });
        });

        it('can change side and score for sideB', async () => {
            await renderComponent(
                containerProps.withTournament(tournamentData).build(),
                props(matchData, true, sideA, sideB, sideC),
                appProps({}, reportedError),
            );
            await editSide('sideB');
            await selectSide(dialog(), 'SIDE C');
            await selectScore(dialog(), '1');
            await dialog().button('Save').click();

            expect(updatedTournament!.round).toEqual({
                id: expect.any(String),
                matchOptions: expect.any(Array),
                matches: [
                    {
                        id: expect.any(String),
                        scoreB: 1,
                        sideA: {},
                        sideB: equatableSide(sideC),
                    },
                ],
            });
        });

        it('can change best-of', async () => {
            await renderComponent(
                containerProps.withTournament(tournamentDataAB57).build(),
                props(matchData57M1, true, sideA, sideB, sideC),
                appProps({}, reportedError),
            );
            await editSide('sideB');
            await dialog().input('bestOf').change('11');
            await dialog().button('Save').click();

            const mo = {
                numberOfLegs: 11,
            };
            const match = {
                id: expect.any(String),
                scoreA: 5,
                scoreB: 7,
                sideA: sideA,
                sideB: sideB,
            };
            expect(updatedTournament!.round).toEqual({
                matchOptions: [mo],
                matches: [match],
            });
        });

        it('cannot save if best-of is invalid', async () => {
            await renderComponent(
                containerProps.withTournament(tournamentDataAB57).build(),
                props(matchData57M1, true, sideA, sideB, sideC),
                appProps({}, reportedError),
            );
            await editSide('sideB');

            await dialog().input('bestOf').change('');
            await dialog().button('Save').click();

            context.prompts.alertWasShown('Best of is invalid');
            expect(updatedTournament).toBeNull();
        });

        it('does not open dialog match in subsequent round when first round is not complete', async () => {
            const tournamentData = tournamentBuilder()
                .round((r) =>
                    r.round((r) =>
                        r.withMatch((m) => m.sideA(sideA, 5).sideB(sideB, 7)),
                    ),
                )
                .build();
            await renderComponent(
                containerProps.withTournament(tournamentData).build(),
                withRoundIndex(props(matchData57M1, true), 1),
                appProps({}, reportedError),
            );
            await editSide('sideB');

            const prompt = 'Finish entering data for the previous rounds first';
            context.prompts.alertWasShown(prompt);
        });

        it('can change side properties for match in subsequent round', async () => {
            const tournamentData = tournamentBuilder()
                .round((r) =>
                    r
                        .withMatch((m) => m.sideA(sideA, 5).sideB(sideC, 1))
                        .round((r) =>
                            r.withMatch((m) =>
                                m.sideA(sideA, 5).sideB(sideB, 7),
                            ),
                        ),
                )
                .build();
            const nestedMatchData = hideMnemonic(
                sideABWithLinks({
                    scoreB: '7',
                    scoreA: '5',
                    sideB: side({
                        id: sideB.id,
                        link: <span>SIDE B</span>,
                        mnemonic: 'B',
                    }),
                    mnemonic: 'M1',
                }),
            );
            await renderComponent(
                containerProps.withTournament(tournamentData).build(),
                withRoundIndex(props(nestedMatchData, true, sideA, sideB), 1),
                appProps({}, reportedError),
            );
            await editSide('sideB');
            await selectScore(dialog(), '3');
            await dialog().button('Save').click();

            const match = {
                id: expect.any(String),
                scoreA: 5,
                scoreB: 3,
                sideA: equatableSide(sideA),
                sideB: equatableSide(sideB),
            };
            expect(updatedTournament!.round!.nextRound).toEqual({
                matchOptions: expect.any(Array),
                matches: [match],
            });
        });

        it('preselects side to mnemonic', async () => {
            matchData.sideA.mnemonic = sideC.name;
            await renderComponent(
                containerProps.withTournament(tournamentData).build(),
                props(matchData, true, sideA, sideB, sideC),
                appProps({}, reportedError),
            );
            await editSide('sideA');
            await selectScore(dialog(), '1');
            await dialog().button('Save').click();

            const match = {
                id: expect.any(String),
                scoreA: 1,
                sideA: equatableSide(sideC),
                sideB: {},
            };
            expect(updatedTournament!.round).toEqual({
                id: expect.any(String),
                matchOptions: expect.any(Array),
                matches: [match],
            });
        });

        it('cannot save side when no side selected', async () => {
            await renderComponent(
                containerProps.withTournament(tournamentData).build(),
                props(matchData, true, sideA, sideB, sideC),
                appProps({}, reportedError),
            );
            await editSide('sideA');
            await selectScore(dialog(), '1');
            await dialog().button('Save').click();

            context.prompts.alertWasShown('Select a side first');
            expect(updatedTournament).toEqual(null);
        });

        it('does not open edit dialog for sideA when not editable', async () => {
            await renderComponent(
                containerProps.withTournament(tournamentData).build(),
                props(matchData57M1, false),
                appProps({}, reportedError),
            );

            await editSide('sideA');

            expect(context.optional('.modal-dialog')).toBeFalsy();
        });

        it('opens edit dialog for sideA', async () => {
            await renderComponent(
                containerProps.withTournament(tournamentData).build(),
                props(matchData57M1, true),
                appProps({}, reportedError),
            );

            await editSide('sideA');

            expect(dialog()).toBeTruthy();
        });

        it('does not open edit dialog for sideB when not editable', async () => {
            await renderComponent(
                containerProps.withTournament(tournamentData).build(),
                props(matchData57M1, false),
                appProps({}, reportedError),
            );

            await editSide('sideB');

            expect(context.optional('.modal-dialog')).toBeFalsy();
        });

        it('opens edit dialog for sideB', async () => {
            await renderComponent(
                containerProps.withTournament(tournamentData).build(),
                props(matchData57M1, true),
                appProps({}, reportedError),
            );

            await editSide('sideB');

            expect(dialog()).toBeTruthy();
        });

        it('can unset side A', async () => {
            await renderComponent(
                containerProps.withTournament(tournamentDataAB57).build(),
                props(matchData57M1, true),
                appProps({}, reportedError),
            );
            await editSide('sideA');

            await dialog().button('Remove').click();

            const match = {
                id: expect.any(String),
                scoreA: null,
                scoreB: 7,
                sideA: {
                    players: [],
                },
                sideB: equatableSide(sideB),
            };
            expect(updatedTournament!.round).toEqual({
                matchOptions: expect.any(Array),
                matches: [match],
            });
        });

        it('can unset side B', async () => {
            const tournamentData = tournamentBuilder()
                .round((r) =>
                    r.withMatch((m) => m.sideA(sideA, 5).sideB(sideB, 7)),
                )
                .build();
            await renderComponent(
                containerProps.withTournament(tournamentData).build(),
                props(matchData57M1, true),
                appProps({}, reportedError),
            );
            await editSide('sideB');

            await dialog().button('Remove').click();

            const match = {
                id: expect.any(String),
                scoreA: 5,
                scoreB: null,
                sideA: equatableSide(sideA),
                sideB: {
                    players: [],
                },
            };
            expect(updatedTournament!.round).toEqual({
                matchOptions: expect.any(Array),
                matches: [match],
            });
        });

        it('removes match when sideA and sideB unset', async () => {
            const tournamentData = tournamentBuilder()
                .round((r) => r.withMatch((m) => m.sideB(sideB, 7)))
                .build();
            await renderComponent(
                containerProps.withTournament(tournamentData).build(),
                props(matchData57M1, true),
                appProps({}, reportedError),
            );
            await editSide('sideB');

            await dialog().button('Remove').click();

            expect(updatedTournament!.round).toEqual({
                matchOptions: expect.any(Array),
                matches: [],
            });
        });

        it('shows layout match options number of legs when present', async () => {
            matchData.matchOptions = matchOptionsBuilder()
                .numberOfLegs(9)
                .build();
            await renderComponent(
                containerProps.withTournament(tournamentData).build(),
                props(matchData, true, sideA, sideB, sideC),
                appProps({}, reportedError),
            );
            await editSide('sideB');

            const scoreOptions = ['0', '1', '2', '3', '4', '5'];
            expect(bestOf(dialog()).value()).toContain('9');
            expect(scoreDropdownItems(dialog())).toEqual(scoreOptions); // best of 9
        });

        it('shows default match options number of legs when match options not present', async () => {
            await renderComponent(
                containerProps.withTournament(tournamentData).build(),
                props(matchData, true, sideA, sideB, sideC),
                appProps({}, reportedError),
            );
            await editSide('sideB');

            const scoreOptions = ['0', '1', '2', '3', '4'];
            expect(bestOf(dialog()).value()).toContain('7');
            expect(scoreDropdownItems(dialog())).toEqual(scoreOptions); // best of 7
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
            const tournamentData = tournamentBuilder()
                .round((r) =>
                    r.withMatch((m) =>
                        m.sideA(sideA).sideB(sideB).saygId(saygData.id),
                    ),
                )
                .build();
            const matchData = {
                ...matchData57M1,
                match: tournamentData.round!.matches![0],
            };
            await renderComponent(
                containerProps.withTournament(tournamentData).build(),
                patchable(props(matchData, true)),
                appProps({ account: debugAndSaygUser }, reportedError),
            );

            await context.button(START_SCORING).click();
            reportedError.verifyNoError();
            await dialog().button('🎯SIDE A').click();

            //verify patch data
            reportedError.verifyNoError();
            expect(patchedData).toEqual([
                {
                    nestInRound: true,
                    patch: {
                        match: {
                            scoreA: 0,
                            scoreB: 0,
                            sideA: sideA.id,
                            sideB: sideB.id,
                        },
                    },
                },
            ]);
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
            const tournamentData = tournamentBuilder()
                .round((r) =>
                    r.withMatch((m) =>
                        m.sideA(sideA).sideB(sideB).saygId(saygData.id),
                    ),
                )
                .build();
            const matchData = {
                ...matchData57M1,
                match: tournamentData.round!.matches![0],
            };
            await renderComponent(
                containerProps.withTournament(tournamentData).build(),
                patchable(withRoundIndex(props(matchData, true), 1)),
                appProps({ account: debugAndSaygUser }, reportedError),
            );

            await context.button(START_SCORING).click();
            reportedError.verifyNoError();
            await dialog().button('🎯SIDE A').click();

            //verify patch data
            reportedError.verifyNoError();
            expect(patchedData).toEqual([
                {
                    nestInRound: true,
                    patch: {
                        nextRound: {
                            match: {
                                scoreA: 0,
                                scoreB: 0,
                                sideA: sideA.id,
                                sideB: sideB.id,
                            },
                        },
                    },
                },
            ]);
        });

        it('cannot view scores for match without sayg', async () => {
            const matchData = hideMnemonic(
                sideABWithLinks({
                    scoreA: '1',
                    scoreB: '2',
                    mnemonic: 'M1',
                    match: tournamentDataWithoutSayg!.round!.matches![0],
                }),
            );
            await renderComponent(
                containerProps
                    .withTournament(tournamentDataWithoutSayg)
                    .build(),
                patchable(props(matchData, true)),
                appProps({}, reportedError),
            );

            expect(context.html()).not.toContain('📊');
        });

        it('can view scores for match with sayg', async () => {
            const match = tournamentDataWithMatch!.round!.matches![0];
            const matchData = hideMnemonic(
                sideABWithLinks({
                    scoreA: '1',
                    scoreB: '2',
                    mnemonic: 'M1',
                    match,
                }),
            );
            match.scoreA = 1;
            match.scoreB = 2;
            await renderComponent(
                containerProps.withTournament(tournamentDataWithMatch).build(),
                patchable(props(matchData, true)),
                appProps({}, reportedError),
            );

            const expected = `http://localhost/live/match/?id=${saygData.id}`;
            const link = context.button('📊 1 - 2');
            expect(link.element<HTMLAnchorElement>().href).toEqual(expected);
        });

        it('can delete sayg from match and keep scores', async () => {
            await renderComponent(
                containerProps.withTournament(tournamentDataWithMatch).build(),
                withRound(
                    patchable(props(matchData1, true)),
                    tournamentDataWithMatch!.round!,
                ),
                appProps(
                    {
                        account: debugAndSaygUser,
                    },
                    reportedError,
                ),
            );
            context.prompts.respondToConfirm(deleteSaygPrompt, true);
            context.prompts.respondToConfirm(clearScorePrompt, false);
            deletedSaygResponse = {
                success: true,
                result: tournamentDataWithoutSayg,
            };

            await context.button(START_SCORING).click();
            await dialog().button('Debug options').click();
            await debugOptions(dialog()).select('Delete sayg');

            reportedError.verifyNoError();
            expect(deletedSayg).toEqual({
                id: tournamentDataWithMatch.id,
                matchId: tournamentDataWithMatch!.round!.matches![0].id,
                clearScores: false,
            });
            expect(updatedTournament!.round!.matches![0].saygId).toBeFalsy();
        });

        it('can delete sayg from match and clear scores', async () => {
            await renderComponent(
                containerProps.withTournament(tournamentDataWithMatch).build(),
                withRound(
                    patchable(props(matchData1, true)),
                    tournamentDataWithMatch!.round!,
                ),
                appProps(
                    {
                        account: debugAndSaygUser,
                    },
                    reportedError,
                ),
            );
            context.prompts.respondToConfirm(deleteSaygPrompt, true);
            context.prompts.respondToConfirm(clearScorePrompt, true);
            deletedSaygResponse = {
                success: true,
                result: tournamentDataWithoutSayg,
            };

            await context.button(START_SCORING).click();
            await dialog().button('Debug options').click();
            await debugOptions(dialog()).select('Delete sayg');

            reportedError.verifyNoError();
            expect(deletedSayg).toEqual({
                id: tournamentDataWithMatch.id,
                matchId: tournamentDataWithMatch!.round!.matches![0].id,
                clearScores: true,
            });
            expect(updatedTournament!.round!.matches![0].saygId).toBeFalsy();
        });

        it('handles error deleting sayg from match', async () => {
            await renderComponent(
                containerProps.withTournament(tournamentDataWithMatch).build(),
                withRound(
                    patchable(props(matchData1, true)),
                    tournamentDataWithMatch!.round!,
                ),
                appProps(
                    {
                        account: debugAndSaygUser,
                    },
                    reportedError,
                ),
            );
            context.prompts.respondToConfirm(deleteSaygPrompt, true);
            context.prompts.respondToConfirm(clearScorePrompt, true);
            deletedSaygResponse = {
                success: false,
            };

            await context.button(START_SCORING).click();
            await dialog().button('Debug options').click();
            await debugOptions(dialog()).select('Delete sayg');

            expect(deletedSayg).toEqual({
                id: tournamentDataWithMatch.id,
                matchId: tournamentDataWithMatch!.round!.matches![0].id,
                clearScores: true,
            });
            expect(updatedTournament).toBeNull();
        });
    });
});
