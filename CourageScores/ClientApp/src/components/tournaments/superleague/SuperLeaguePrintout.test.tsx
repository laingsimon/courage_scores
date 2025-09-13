import {
    api,
    appProps,
    brandingProps,
    cleanUp,
    doClick,
    doSelectOption,
    ErrorState,
    findButton,
    iocProps,
    MockSocketFactory,
    noop,
    renderApp,
    TestContext,
} from '../../../helpers/tests';
import {
    ISuperLeaguePrintoutProps,
    SuperLeaguePrintout,
} from './SuperLeaguePrintout';
import {
    ITournamentContainerProps,
    TournamentContainer,
} from '../TournamentContainer';
import { act } from '@testing-library/react';
import { RecordedScoreAsYouGoDto } from '../../../interfaces/models/dtos/Game/Sayg/RecordedScoreAsYouGoDto';
import { TournamentGameDto } from '../../../interfaces/models/dtos/Game/TournamentGameDto';
import { DivisionDto } from '../../../interfaces/models/dtos/DivisionDto';
import {
    ILegBuilder,
    ILegCompetitorScoreBuilder,
    saygBuilder,
} from '../../../helpers/builders/sayg';
import { tournamentBuilder } from '../../../helpers/builders/tournaments';
import { divisionBuilder } from '../../../helpers/builders/divisions';
import { ISaygApi } from '../../../interfaces/apis/ISaygApi';
import { MessageType } from '../../../interfaces/models/dtos/MessageType';
import { AccessDto } from '../../../interfaces/models/dtos/Identity/AccessDto';
import { UpdateRecordedScoreAsYouGoDto } from '../../../interfaces/models/dtos/Game/Sayg/UpdateRecordedScoreAsYouGoDto';
import { IClientActionResultDto } from '../../common/IClientActionResultDto';
import { CHECKOUT_2_DART } from '../../../helpers/constants';
import { checkoutWith, enterScores } from '../../../helpers/sayg';
import { START_SCORING } from '../tournaments';
import { tournamentContainerPropsBuilder } from '../tournamentContainerPropsBuilder';
import { BuilderParam } from '../../../helpers/builders/builders';
import { playerBuilder } from '../../../helpers/builders/players';

describe('SuperLeaguePrintout', () => {
    let context: TestContext;
    let reportedError: ErrorState;
    let saygApiResponseMap: { [id: string]: RecordedScoreAsYouGoDto } = {};
    let saygDataRequests: { [id: string]: number };
    let socketFactory: MockSocketFactory;
    let patchSuccess: boolean;

    const saygApi = api<ISaygApi>({
        get: async (id: string) => {
            const data: RecordedScoreAsYouGoDto = saygApiResponseMap[id];
            if (!saygDataRequests[id]) {
                saygDataRequests[id] = 0;
            }
            if (data) {
                saygDataRequests[id]++;
                return data;
            }

            throw new Error('Unexpected request for sayg data: ' + id);
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

    afterEach(async () => {
        await cleanUp(context);
    });

    beforeEach(() => {
        patchSuccess = true;
        saygDataRequests = {};
        saygApiResponseMap = {};
        reportedError = new ErrorState();
        socketFactory = new MockSocketFactory();

        document.exitFullscreen = noop;
    });

    async function patchData(): Promise<boolean> {
        return patchSuccess;
    }

    async function renderComponent(
        tournamentData: ITournamentContainerProps,
        props: ISuperLeaguePrintoutProps,
        access: AccessDto,
    ) {
        context = await renderApp(
            iocProps({
                saygApi,
                socketFactory: socketFactory.createSocket,
            }),
            brandingProps(),
            appProps(
                {
                    account: {
                        emailAddress: '',
                        givenName: '',
                        name: '',
                        access,
                    },
                },
                reportedError,
            ),
            <TournamentContainer {...tournamentData}>
                <SuperLeaguePrintout {...props} />
            </TournamentContainer>,
        );
    }

    function createLeg(
        homeWinner?: boolean,
        awayWinner?: boolean,
    ): BuilderParam<ILegBuilder> {
        function winningThrows(c: ILegCompetitorScoreBuilder) {
            return c
                .withThrow(90)
                .withThrow(100)
                .withThrow(110)
                .withThrow(120)
                .withThrow(81);
        }

        function notWinningThrows(c: ILegCompetitorScoreBuilder) {
            return c
                .withThrow(90)
                .withThrow(90)
                .withThrow(90)
                .withThrow(90)
                .withThrow(90);
        }

        return (b) =>
            b
                .home((c) =>
                    homeWinner ? winningThrows(c) : notWinningThrows(c),
                )
                .away((c) =>
                    awayWinner ? winningThrows(c) : notWinningThrows(c),
                )
                .startingScore(501);
    }

    describe('renders', () => {
        const access: AccessDto = {
            useWebSockets: true,
        };
        const containerProps = new tournamentContainerPropsBuilder();

        it('print out', async () => {
            const saygData1: RecordedScoreAsYouGoDto = saygBuilder()
                .withLeg(0, createLeg(true, false))
                .withLeg(1, createLeg(true, false))
                .build();
            const saygData2: RecordedScoreAsYouGoDto = saygBuilder()
                .withLeg(0, createLeg(false, true))
                .withLeg(1, createLeg(false, true))
                .build();
            const tournamentData: TournamentGameDto = tournamentBuilder()
                .round((r) =>
                    r
                        .withMatch((m) =>
                            m.saygId(saygData1.id).sideA('A', 1).sideB('B', 2),
                        )
                        .withMatch((m) =>
                            m.saygId(saygData2.id).sideA('C', 3).sideB('D', 4),
                        ),
                )
                .build();
            const division: DivisionDto = divisionBuilder('DIVISION').build();
            saygApiResponseMap = {};
            saygApiResponseMap[saygData1.id] = saygData1;
            saygApiResponseMap[saygData2.id] = saygData2;

            await renderComponent(
                containerProps.withTournament(tournamentData).build(),
                { division },
                access,
            );

            reportedError.verifyNoError();
            const headings = Array.from(
                context.container.querySelectorAll('h2'),
            );
            expect(headings.map((h) => h.textContent)).toEqual([
                'Master draw',
                'Match log',
                'Summary',
                'SOMERSET DARTS ORGANISATION',
            ]);
        });
    });

    describe('interactivity', () => {
        describe('live updates', () => {
            const access: AccessDto = {
                useWebSockets: true,
            };
            const containerProps = new tournamentContainerPropsBuilder();

            it('can start live updates', async () => {
                const saygData1: RecordedScoreAsYouGoDto = saygBuilder()
                    .withLeg(0, createLeg(true, false))
                    .withLeg(1, createLeg(true, false))
                    .build();
                const saygData2: RecordedScoreAsYouGoDto = saygBuilder()
                    .withLeg(0, createLeg(false, true))
                    .withLeg(1, createLeg(false, true))
                    .build();
                const tournamentData: TournamentGameDto = tournamentBuilder()
                    .round((r) =>
                        r
                            .withMatch((m) =>
                                m
                                    .saygId(saygData1.id)
                                    .sideA('A', 1)
                                    .sideB('B', 2),
                            )
                            .withMatch((m) =>
                                m
                                    .saygId(saygData2.id)
                                    .sideA('C', 3)
                                    .sideB('D', 4),
                            ),
                    )
                    .build();
                const division: DivisionDto =
                    divisionBuilder('DIVISION').build();
                saygApiResponseMap = {};
                saygApiResponseMap[saygData1.id] = saygData1;
                saygApiResponseMap[saygData2.id] = saygData2;
                await renderComponent(
                    containerProps.withTournament(tournamentData).build(),
                    { division },
                    access,
                );

                await doSelectOption(
                    context.container.querySelector('.dropdown-menu'),
                    '▶️ Live',
                );

                expect(Object.keys(socketFactory.subscriptions).sort()).toEqual(
                    [saygData1.id, saygData2.id, tournamentData.id].sort(),
                );
            });

            it('can handle live updates', async () => {
                const saygData1: RecordedScoreAsYouGoDto = saygBuilder()
                    .withLeg(0, createLeg(true, false))
                    .withLeg(1, createLeg(true, false))
                    .build();
                const saygData2: RecordedScoreAsYouGoDto = saygBuilder()
                    .withLeg(0, createLeg(false, true))
                    .withLeg(1, createLeg(false, true))
                    .build();
                const tournamentData: TournamentGameDto = tournamentBuilder()
                    .round((r) =>
                        r
                            .withMatch((m) =>
                                m
                                    .saygId(saygData1.id)
                                    .sideA('A', 1)
                                    .sideB('B', 2),
                            )
                            .withMatch((m) =>
                                m
                                    .saygId(saygData2.id)
                                    .sideA('C', 3)
                                    .sideB('D', 4),
                            ),
                    )
                    .build();
                const division: DivisionDto =
                    divisionBuilder('DIVISION').build();
                saygApiResponseMap = {};
                saygApiResponseMap[saygData1.id] = saygData1;
                saygApiResponseMap[saygData2.id] = saygData2;
                await renderComponent(
                    containerProps.withTournament(tournamentData).build(),
                    { division },
                    access,
                );
                await doSelectOption(
                    context.container.querySelector('.dropdown-menu'),
                    '▶️ Live',
                );
                expect(
                    context.container.querySelector(
                        'div[datatype="match-report"] > div > div:nth-child(1)',
                    )!.textContent,
                ).toEqual('Legs won: 2');
                expect(
                    context.container.querySelector(
                        'div[datatype="match-report"] > div > div:nth-child(2)',
                    )!.textContent,
                ).toEqual('Legs won: 2');

                //send through some data
                const newSaygData = saygBuilder(saygData1.id)
                    .withLeg(0, createLeg(true, false))
                    .withLeg(1, createLeg(true, false))
                    .withLeg(2, createLeg(false, true))
                    .build();
                await act(async () => {
                    socketFactory.socket!.onmessage!({
                        type: 'message',
                        data: JSON.stringify({
                            type: MessageType.update,
                            id: newSaygData.id,
                            data: newSaygData,
                        }),
                    } as MessageEvent<string>);
                });

                expect(
                    context.container.querySelector(
                        'div[datatype="match-report"] > div > div:nth-child(1)',
                    )!.textContent,
                ).toEqual('Legs won: 2');
                expect(
                    context.container.querySelector(
                        'div[datatype="match-report"] > div > div:nth-child(2)',
                    )!.textContent,
                ).toEqual('Legs won: 3');
            });

            it('can stop live updates', async () => {
                const saygData1: RecordedScoreAsYouGoDto = saygBuilder()
                    .withLeg(0, createLeg(true, false))
                    .withLeg(1, createLeg(true, false))
                    .build();
                const saygData2: RecordedScoreAsYouGoDto = saygBuilder()
                    .withLeg(0, createLeg(false, true))
                    .withLeg(1, createLeg(false, true))
                    .build();
                const tournamentData: TournamentGameDto = tournamentBuilder()
                    .round((r) =>
                        r
                            .withMatch((m) =>
                                m
                                    .saygId(saygData1.id)
                                    .sideA('A', 1)
                                    .sideB('B', 2),
                            )
                            .withMatch((m) =>
                                m
                                    .saygId(saygData2.id)
                                    .sideA('C', 3)
                                    .sideB('D', 4),
                            ),
                    )
                    .build();
                const division: DivisionDto =
                    divisionBuilder('DIVISION').build();
                saygApiResponseMap = {};
                saygApiResponseMap[saygData1.id] = saygData1;
                saygApiResponseMap[saygData2.id] = saygData2;
                await renderComponent(
                    containerProps.withTournament(tournamentData).build(),
                    { division },
                    access,
                );
                await doSelectOption(
                    context.container.querySelector('.dropdown-menu'),
                    '▶️ Live',
                );

                await doSelectOption(
                    context.container.querySelector('.dropdown-menu'),
                    '⏸️ Paused',
                );

                expect(Object.keys(socketFactory.subscriptions)).toEqual([]);
            });

            it('can stop then restart live updates', async () => {
                const saygData1: RecordedScoreAsYouGoDto = saygBuilder()
                    .withLeg(0, createLeg(true, false))
                    .withLeg(1, createLeg(true, false))
                    .build();
                const saygData2: RecordedScoreAsYouGoDto = saygBuilder()
                    .withLeg(0, createLeg(false, true))
                    .withLeg(1, createLeg(false, true))
                    .build();
                const tournamentData: TournamentGameDto = tournamentBuilder()
                    .round((r) =>
                        r
                            .withMatch((m) =>
                                m
                                    .saygId(saygData1.id)
                                    .sideA('A', 1)
                                    .sideB('B', 2),
                            )
                            .withMatch((m) =>
                                m
                                    .saygId(saygData2.id)
                                    .sideA('C', 3)
                                    .sideB('D', 4),
                            ),
                    )
                    .build();
                const division: DivisionDto =
                    divisionBuilder('DIVISION').build();
                saygApiResponseMap = {};
                saygApiResponseMap[saygData1.id] = saygData1;
                saygApiResponseMap[saygData2.id] = saygData2;
                await renderComponent(
                    containerProps.withTournament(tournamentData).build(),
                    { division },
                    access,
                );
                await doSelectOption(
                    context.container.querySelector('.dropdown-menu'),
                    '▶️ Live',
                );
                await doSelectOption(
                    context.container.querySelector('.dropdown-menu'),
                    '⏸️ Paused',
                );
                expect(Object.keys(socketFactory.subscriptions)).toEqual([]);

                await doSelectOption(
                    context.container.querySelector('.dropdown-menu'),
                    '▶️ Live',
                );

                expect(Object.keys(socketFactory.subscriptions).sort()).toEqual(
                    [tournamentData.id, saygData1.id, saygData2.id].sort(),
                );
            });
        });

        describe('sayg', () => {
            const access: AccessDto = {
                manageTournaments: true,
                recordScoresAsYouGo: true,
            };
            const containerProps = new tournamentContainerPropsBuilder();

            it('does not reload sayg data if patch cannot be applied', async () => {
                saygApiResponseMap = {};
                const saygData1: RecordedScoreAsYouGoDto = saygBuilder()
                    .yourName('PLAYER A')
                    .opponentName('PLAYER B')
                    .scores(0, 0)
                    .numberOfLegs(1)
                    .startingScore(501)
                    .addTo(saygApiResponseMap)
                    .build();
                const player = playerBuilder('PLAYER').build();
                const tournamentData: TournamentGameDto = tournamentBuilder()
                    .round((r) =>
                        r.withMatch((m) =>
                            m
                                .saygId(saygData1.id)
                                .sideA('PLAYER A', undefined, player)
                                .sideB('PLAYER B', undefined, player),
                        ),
                    )
                    .build();
                const division: DivisionDto =
                    divisionBuilder('DIVISION').build();
                await renderComponent(
                    containerProps.withTournament(tournamentData).build(),
                    { division },
                    access,
                );
                await doClick(findButton(context.container, START_SCORING));
                const dialog =
                    context.container.querySelector('div.modal-dialog')!;
                expect(saygDataRequests[saygData1.id]).toEqual(2); // data is loaded as the dialog opens
                patchSuccess = false;

                await enterScores(
                    context,
                    [100, 100, 100, 100, 50, 51], // PLAYER A
                    [10, 10, 10, 10, 10], // PLAYER B
                );
                await checkoutWith(context, CHECKOUT_2_DART);
                expect(dialog.textContent).toContain('Match statistics');
                await doClick(findButton(dialog, 'Close')); // close the match statistics dialog

                const summary = context.container.querySelector(
                    'div[datatype="summary"]',
                )!;
                expect(summary.textContent).toContain('PLAYER A'); // player should be shown in the table
                expect(saygDataRequests[saygData1.id]).toEqual(2); // data isn't reloaded if the patch fails
            });

            it('does not reload sayg data if patch is unsuccessful', async () => {
                saygApiResponseMap = {};
                const saygData1: RecordedScoreAsYouGoDto = saygBuilder()
                    .yourName('PLAYER A')
                    .opponentName('PLAYER B')
                    .scores(0, 0)
                    .numberOfLegs(1)
                    .startingScore(501)
                    .addTo(saygApiResponseMap)
                    .build();
                const player = playerBuilder('PLAYER').build();
                const tournamentData: TournamentGameDto = tournamentBuilder()
                    .round((r) =>
                        r.withMatch((m) =>
                            m
                                .saygId(saygData1.id)
                                .sideA('PLAYER A', undefined, player)
                                .sideB('PLAYER B', undefined, player),
                        ),
                    )
                    .build();
                const division: DivisionDto =
                    divisionBuilder('DIVISION').build();
                await renderComponent(
                    containerProps.withTournament(tournamentData).build(),
                    { division, patchData },
                    access,
                );
                await doClick(findButton(context.container, START_SCORING));
                const dialog =
                    context.container.querySelector('div.modal-dialog')!;
                expect(saygDataRequests[saygData1.id]).toEqual(2); // data is loaded as the dialog opens
                patchSuccess = false;

                await enterScores(
                    context,
                    [100, 100, 100, 100, 50, 51], // PLAYER A
                    [10, 10, 10, 10, 10], // PLAYER B
                );
                await checkoutWith(context, CHECKOUT_2_DART);
                expect(dialog.textContent).toContain('Match statistics');
                await doClick(findButton(dialog, 'Close')); // close the match statistics dialog

                const summary = context.container.querySelector(
                    'div[datatype="summary"]',
                )!;
                expect(summary.textContent).toContain('PLAYER A'); // player should be shown in the table
                expect(saygDataRequests[saygData1.id]).toEqual(2); // data isn't reloaded if the patch fails
            });
        });
    });
});
