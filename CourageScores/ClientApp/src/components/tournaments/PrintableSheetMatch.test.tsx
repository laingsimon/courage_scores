import {
    api,
    appProps,
    brandingProps,
    cleanUp,
    doChange,
    doClick,
    doSelectOption,
    ErrorState,
    findButton,
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
import { GameMatchOptionDto } from '../../interfaces/models/dtos/Game/GameMatchOptionDto';
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
    let deletedSayg: { id: string; matchId: string } | null;
    let deletedSaygResponse: IClientActionResultDto<TournamentGameDto> | null;

    const saygApi = api<ISaygApi>({
        async get(id: string): Promise<RecordedScoreAsYouGoDto | null> {
            return saygDataLookup[id];
        },
        async upsert(
            data: UpdateRecordedScoreAsYouGoDto,
        ): Promise<IClientActionResultDto<RecordedScoreAsYouGoDto>> {
            return {
                success: true,
                result: data as RecordedScoreAsYouGoDto,
            };
        },
    });
    const tournamentApi = api<ITournamentGameApi>({
        async deleteSayg(
            id: string,
            matchId: string,
        ): Promise<IClientActionResultDto<TournamentGameDto>> {
            deletedSayg = { id, matchId };
            return (
                deletedSaygResponse || {
                    success: true,
                }
            );
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

    async function patchData(
        patch: PatchTournamentDto | PatchTournamentRoundDto,
        nestInRound?: boolean,
    ) {
        patchedData.push({ patch, nestInRound });
    }

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

    function withRound(
        props: IPrintableSheetMatchProps,
        round: TournamentRoundDto,
    ): IPrintableSheetMatchProps {
        props.round = round;
        return props;
    }

    function patchable(
        props: IPrintableSheetMatchProps,
    ): IPrintableSheetMatchProps {
        props.patchData = patchData;
        return props;
    }

    function withRoundIndex(
        props: IPrintableSheetMatchProps,
        index: number,
    ): IPrintableSheetMatchProps {
        props.roundIndex = index;
        return props;
    }

    function getDialog() {
        return context.container.querySelector('.modal-dialog');
    }

    function layoutDataForMatch(
        customisations?: Partial<ILayoutDataForMatch>,
    ): ILayoutDataForMatch {
        return {
            scoreA: '',
            scoreB: '',
            sideA: side(),
            sideB: side(),
            ...customisations,
        };
    }

    function hideMnemonic(
        customisations?: Partial<ILayoutDataForMatch>,
    ): ILayoutDataForMatch {
        return layoutDataForMatch({
            hideMnemonic: true,
            ...customisations,
        });
    }

    function side(
        customisations?: Partial<ILayoutDataForSide>,
    ): ILayoutDataForSide {
        return {
            id: createTemporaryId(),
            name: '',
            ...customisations,
        };
    }

    function scoreDropdownItems(dialog: Element) {
        return Array.from(
            dialog.querySelectorAll(
                '.form-group :nth-child(4) div.dropdown-menu .dropdown-item',
            ),
        ).map((i) => i.textContent);
    }

    async function selectSide(dialog: Element, name: string) {
        const dropdown = dialog.querySelector(
            '.form-group :nth-child(2) div.dropdown-menu',
        );
        await doSelectOption(dropdown, name);
    }

    async function selectScore(dialog: Element, score: string) {
        const dropdown = dialog.querySelector(
            '.form-group :nth-child(4) div.dropdown-menu',
        );
        await doSelectOption(dropdown, score);
    }

    async function editSide(side: 'sideA' | 'sideB') {
        await doClick(
            context.container.querySelector(`div[datatype="${side}"]`)!,
        );
    }

    function debugOptions(dialog: Element) {
        return dialog.querySelector(
            '[datatype="debug-options"] .dropdown-menu',
        );
    }

    function bestOf(dialog: Element) {
        return dialog.querySelector('input[name="bestOf"]') as HTMLInputElement;
    }

    function equatableSide(side: TournamentSideDto) {
        return {
            name: side.name,
            id: side.id,
            players: [],
        };
    }

    describe('renders', () => {
        const matchOptionDefaults: GameMatchOptionDto =
            matchOptionsBuilder().build();
        const tournamentData: TournamentGameDto = tournamentBuilder().build();
        const containerProps = new tournamentContainerPropsBuilder({
            matchOptionDefaults,
            async saveTournament(): Promise<TournamentGameDto> {
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

            const matchMnemonic = context.container.querySelector(
                'span[datatype="match-mnemonic"]',
            )!;
            expect(matchMnemonic.textContent).toEqual('M1');
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

            const matchMnemonic = context.container.querySelector(
                'span[datatype="match-mnemonic"]',
            );
            expect(matchMnemonic).toBeFalsy();
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

            const sideA = context.container.querySelector(
                'div[datatype="sideA"]',
            )!;
            expect(sideA).toBeTruthy();
            expect(
                sideA.querySelector('span[datatype="sideAname"]')!.textContent,
            ).toEqual('SIDE A');
            expect(
                sideA.querySelector('div[datatype="scoreA"]')!.textContent,
            ).toEqual('5');
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

            const sideB = context.container.querySelector(
                'div[datatype="sideB"]',
            )!;
            expect(sideB).toBeTruthy();
            expect(
                sideB.querySelector('span[datatype="sideBname"]')!.textContent,
            ).toEqual('SIDE B');
            expect(
                sideB.querySelector('div[datatype="scoreB"]')!.textContent,
            ).toEqual('7');
        });
    });

    describe('interactivity', () => {
        const matchOptionDefaults: GameMatchOptionDto = matchOptionsBuilder()
            .numberOfLegs(7)
            .build();
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
        const tournamentDataWithoutSayg: TournamentGameDto = tournamentBuilder()
            .round((r) => r.withMatch((m) => m.sideA(sideA, 1).sideB(sideB, 2)))
            .build();
        const deleteSaygPrompt =
            'Are you sure you want to delete the sayg data for this match?';
        const clearScorePrompt =
            'Clear match score (to allow scores to be re-recorded?)';
        const debugAndSaygUser = user({
            recordScoresAsYouGo: true,
            showDebugOptions: true,
        });

        function sideABWithLinks(
            customisations?: Partial<ILayoutDataForMatch>,
        ): ILayoutDataForMatch {
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
                ...customisations,
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
        const tournamentDataAB57: TournamentGameDto = tournamentBuilder()
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
        });

        it('can change side and score for sideA', async () => {
            await renderComponent(
                containerProps.withTournament(tournamentData).build(),
                props(matchData, true, sideA, sideB, sideC),
                appProps({}, reportedError),
            );
            await editSide('sideA');
            const dialog = getDialog()!;
            await selectSide(dialog, 'SIDE C');
            await selectScore(dialog, '1');
            await doClick(findButton(dialog, 'Save'));

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
            const dialog = getDialog()!;
            await selectSide(dialog, 'SIDE C');
            await selectScore(dialog, '1');
            await doClick(findButton(dialog, 'Save'));

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
            const dialog = getDialog()!;
            await doChange(dialog, 'input[name="bestOf"]', '11', context.user);
            await doClick(findButton(dialog, 'Save'));

            expect(updatedTournament!.round).toEqual({
                matchOptions: [
                    {
                        numberOfLegs: 11,
                    },
                ],
                matches: [
                    {
                        id: expect.any(String),
                        scoreA: 5,
                        scoreB: 7,
                        sideA: sideA,
                        sideB: sideB,
                    },
                ],
            });
        });

        it('cannot save if best-of is invalid', async () => {
            await renderComponent(
                containerProps.withTournament(tournamentDataAB57).build(),
                props(matchData57M1, true, sideA, sideB, sideC),
                appProps({}, reportedError),
            );
            await editSide('sideB');
            const dialog = getDialog()!;

            await doChange(dialog, 'input[name="bestOf"]', '', context.user);
            await doClick(findButton(dialog, 'Save'));

            context.prompts.alertWasShown('Best of is invalid');
            expect(updatedTournament).toBeNull();
        });

        it('does not open dialog match in subsequent round when first round is not complete', async () => {
            const tournamentData: TournamentGameDto = tournamentBuilder()
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

            context.prompts.alertWasShown(
                'Finish entering data for the previous rounds first',
            );
        });

        it('can change side properties for match in subsequent round', async () => {
            const tournamentData: TournamentGameDto = tournamentBuilder()
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
            const dialog = getDialog()!;
            await selectScore(dialog, '3');
            await doClick(findButton(dialog, 'Save'));

            expect(updatedTournament!.round!.nextRound).toEqual({
                matchOptions: expect.any(Array),
                matches: [
                    {
                        id: expect.any(String),
                        scoreA: 5,
                        scoreB: 3,
                        sideA: equatableSide(sideA),
                        sideB: equatableSide(sideB),
                    },
                ],
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
            const dialog = getDialog()!;
            await selectScore(dialog, '1');
            await doClick(findButton(dialog, 'Save'));

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

        it('cannot save side when no side selected', async () => {
            await renderComponent(
                containerProps.withTournament(tournamentData).build(),
                props(matchData, true, sideA, sideB, sideC),
                appProps({}, reportedError),
            );
            await editSide('sideA');
            const dialog = getDialog()!;
            await selectScore(dialog, '1');
            await doClick(findButton(dialog, 'Save'));

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

            expect(getDialog()).toBeFalsy();
        });

        it('opens edit dialog for sideA', async () => {
            await renderComponent(
                containerProps.withTournament(tournamentData).build(),
                props(matchData57M1, true),
                appProps({}, reportedError),
            );

            await editSide('sideA');

            expect(getDialog()).toBeTruthy();
        });

        it('does not open edit dialog for sideB when not editable', async () => {
            await renderComponent(
                containerProps.withTournament(tournamentData).build(),
                props(matchData57M1, false),
                appProps({}, reportedError),
            );

            await editSide('sideB');

            expect(getDialog()).toBeFalsy();
        });

        it('opens edit dialog for sideB', async () => {
            await renderComponent(
                containerProps.withTournament(tournamentData).build(),
                props(matchData57M1, true),
                appProps({}, reportedError),
            );

            await editSide('sideB');

            expect(getDialog()).toBeTruthy();
        });

        it('can unset side A', async () => {
            await renderComponent(
                containerProps.withTournament(tournamentDataAB57).build(),
                props(matchData57M1, true),
                appProps({}, reportedError),
            );
            await editSide('sideA');

            await doClick(findButton(getDialog()!, 'Remove'));

            expect(updatedTournament!.round).toEqual({
                matchOptions: expect.any(Array),
                matches: [
                    {
                        id: expect.any(String),
                        scoreA: null,
                        scoreB: 7,
                        sideA: {
                            players: [],
                        },
                        sideB: equatableSide(sideB),
                    },
                ],
            });
        });

        it('can unset side B', async () => {
            const tournamentData: TournamentGameDto = tournamentBuilder()
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

            await doClick(findButton(getDialog()!, 'Remove'));

            expect(updatedTournament!.round).toEqual({
                matchOptions: expect.any(Array),
                matches: [
                    {
                        id: expect.any(String),
                        scoreA: 5,
                        scoreB: null,
                        sideA: equatableSide(sideA),
                        sideB: {
                            players: [],
                        },
                    },
                ],
            });
        });

        it('removes match when sideA and sideB unset', async () => {
            const tournamentData: TournamentGameDto = tournamentBuilder()
                .round((r) => r.withMatch((m) => m.sideB(sideB, 7)))
                .build();
            await renderComponent(
                containerProps.withTournament(tournamentData).build(),
                props(matchData57M1, true),
                appProps({}, reportedError),
            );
            await editSide('sideB');

            await doClick(findButton(getDialog()!, 'Remove'));

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

            const dialog = getDialog()!;
            expect(bestOf(dialog).value).toContain('9');
            expect(scoreDropdownItems(dialog)).toEqual([
                '0',
                '1',
                '2',
                '3',
                '4',
                '5',
            ]); // best of 9
        });

        it('shows default match options number of legs when match options not present', async () => {
            await renderComponent(
                containerProps.withTournament(tournamentData).build(),
                props(matchData, true, sideA, sideB, sideC),
                appProps({}, reportedError),
            );
            await editSide('sideB');

            const dialog = getDialog()!;
            expect(bestOf(dialog).value).toContain('7');
            expect(scoreDropdownItems(dialog)).toEqual([
                '0',
                '1',
                '2',
                '3',
                '4',
            ]); // best of 7
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
                appProps(
                    { account: user({ recordScoresAsYouGo: true }) },
                    reportedError,
                ),
            );

            await doClick(findButton(context.container, START_SCORING));
            reportedError.verifyNoError();
            // set sideA to play first
            await doClick(findButton(getDialog(), '🎯SIDE A'));

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
            const tournamentData: TournamentGameDto = tournamentBuilder()
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
                appProps(
                    { account: user({ recordScoresAsYouGo: true }) },
                    reportedError,
                ),
            );

            await doClick(findButton(context.container, START_SCORING));
            reportedError.verifyNoError();
            // set sideA to play first
            await doClick(findButton(getDialog(), '🎯SIDE A'));

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

            expect(context.container.innerHTML).not.toContain('📊');
        });

        it('can view scores for match with sayg', async () => {
            const matchData = hideMnemonic(
                sideABWithLinks({
                    scoreA: '1',
                    scoreB: '2',
                    mnemonic: 'M1',
                    match: tournamentDataWithMatch!.round!.matches![0],
                }),
            );
            await renderComponent(
                containerProps.withTournament(tournamentDataWithMatch).build(),
                patchable(props(matchData, true)),
                appProps({}, reportedError),
            );

            expect(context.container.innerHTML).toContain('📊');
            const link = findButton(context.container, '📊 ');
            expect(link.href).toEqual(
                `http://localhost/live/match/?id=${saygData.id}`,
            );
        });

        it('can delete sayg from match and keep scores', async () => {
            const matchData = hideMnemonic(
                sideABWithLinks({
                    scoreA: '1',
                    scoreB: '2',
                    mnemonic: 'M1',
                    match: tournamentDataWithMatch!.round!.matches![0],
                    saygId: saygData.id,
                }),
            );
            await renderComponent(
                containerProps.withTournament(tournamentDataWithMatch).build(),
                withRound(
                    patchable(props(matchData, true)),
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

            await doClick(findButton(context.container, START_SCORING));
            const dialog = getDialog()!;
            await doClick(findButton(dialog, 'Debug options'));
            await doSelectOption(debugOptions(dialog), 'Delete sayg');

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
            const matchData = hideMnemonic(
                sideABWithLinks({
                    scoreA: '1',
                    scoreB: '2',
                    mnemonic: 'M1',
                    match: tournamentDataWithMatch!.round!.matches![0],
                    saygId: saygData.id,
                }),
            );
            await renderComponent(
                containerProps.withTournament(tournamentDataWithMatch).build(),
                withRound(
                    patchable(props(matchData, true)),
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

            await doClick(findButton(context.container, START_SCORING));
            const dialog = getDialog()!;
            await doClick(findButton(dialog, 'Debug options'));
            await doSelectOption(debugOptions(dialog), 'Delete sayg');

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
            const matchData = hideMnemonic(
                sideABWithLinks({
                    scoreA: '1',
                    scoreB: '2',
                    mnemonic: 'M1',
                    match: tournamentDataWithMatch!.round!.matches![0],
                    saygId: saygData.id,
                }),
            );
            await renderComponent(
                containerProps.withTournament(tournamentDataWithMatch).build(),
                withRound(
                    patchable(props(matchData, true)),
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
            deletedSaygResponse = {
                success: false,
            };

            await doClick(findButton(context.container, START_SCORING));
            const dialog = getDialog()!;
            await doClick(findButton(dialog, 'Debug options'));
            await doSelectOption(debugOptions(dialog), 'Delete sayg');

            expect(deletedSayg).toEqual({
                id: tournamentDataWithMatch.id,
                matchId: tournamentDataWithMatch!.round!.matches![0].id,
            });
            expect(updatedTournament).toBeNull();
        });
    });
});
