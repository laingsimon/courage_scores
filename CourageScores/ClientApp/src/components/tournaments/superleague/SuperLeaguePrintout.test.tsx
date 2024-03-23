import {
    api,
    appProps,
    brandingProps,
    cleanUp,
    doSelectOption,
    ErrorState,
    iocProps, MockSocketFactory,
    renderApp, TestContext
} from "../../../helpers/tests";
import {ISuperLeaguePrintoutProps, SuperLeaguePrintout} from "./SuperLeaguePrintout";
import {ITournamentContainerProps, TournamentContainer} from "../TournamentContainer";
import {act} from "@testing-library/react";
import {RecordedScoreAsYouGoDto} from "../../../interfaces/models/dtos/Game/Sayg/RecordedScoreAsYouGoDto";
import {LegDto} from "../../../interfaces/models/dtos/Game/Sayg/LegDto";
import {TournamentGameDto} from "../../../interfaces/models/dtos/Game/TournamentGameDto";
import {DivisionDto} from "../../../interfaces/models/dtos/DivisionDto";
import {ILegCompetitorScoreBuilder, legBuilder, saygBuilder} from "../../../helpers/builders/sayg";
import {
    ITournamentMatchBuilder,
    ITournamentRoundBuilder,
    tournamentBuilder
} from "../../../helpers/builders/tournaments";
import {divisionBuilder} from "../../../helpers/builders/divisions";
import {ISaygApi} from "../../../interfaces/apis/ISaygApi";
import {MessageType} from "../../../interfaces/models/dtos/MessageType";

describe('SuperLeaguePrintout', () => {
    let context: TestContext;
    let reportedError: ErrorState;
    let saygApiResponseMap: { [id: string]: RecordedScoreAsYouGoDto } = {};
    let socketFactory: MockSocketFactory;

    const saygApi = api<ISaygApi>({
        get: async (id: string) => {
            const data: RecordedScoreAsYouGoDto = saygApiResponseMap[id];
            if (data) {
                return data;
            }

            throw new Error('Unexpected request for sayg data: ' + id);
        }
    });

    afterEach(() => {
        saygApiResponseMap = {};
        cleanUp(context);
    });

    beforeEach(() => {
        reportedError = new ErrorState();
        socketFactory = new MockSocketFactory();
    });

    async function renderComponent(tournamentData: ITournamentContainerProps, props: ISuperLeaguePrintoutProps) {
        context = await renderApp(
            iocProps({
                saygApi,
                socketFactory: socketFactory.createSocket,
            }),
            brandingProps(),
            appProps({
                account: {
                    access: {
                        useWebSockets: true,
                    },
                },
            }, reportedError),
            (<TournamentContainer {...tournamentData}>
                <SuperLeaguePrintout {...props} />
            </TournamentContainer>));
    }

    function createLeg(homeWinner?: boolean, awayWinner?: boolean): LegDto {
        function winningThrows(c: ILegCompetitorScoreBuilder) {
            return c
                .withThrow(90, false, 3)
                .withThrow(100, false, 3)
                .withThrow(110, false, 3)
                .withThrow(120, false, 3)
                .withThrow(81, false, 3);
        }

        function notWinningThrows(c: ILegCompetitorScoreBuilder) {
            return c
                .withThrow(90, false, 3)
                .withThrow(90, false, 3)
                .withThrow(90, false, 3)
                .withThrow(90, false, 3)
                .withThrow(90, false, 3);
        }

        return legBuilder()
            .home((c: ILegCompetitorScoreBuilder) => homeWinner ? winningThrows(c) : notWinningThrows(c))
            .away((c: ILegCompetitorScoreBuilder) => awayWinner ? winningThrows(c) : notWinningThrows(c))
            .startingScore(501)
            .build();
    }

    describe('renders', () => {
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
                .round((r: ITournamentRoundBuilder) => r
                    .withMatch((m: ITournamentMatchBuilder) => m.saygId(saygData1.id)
                        .sideA('A', 1)
                        .sideB('B', 2))
                    .withMatch((m: ITournamentMatchBuilder) => m.saygId(saygData2.id)
                        .sideA('C', 3)
                        .sideB('D', 4)))
                .build();
            const division: DivisionDto = divisionBuilder('DIVISION').build();
            saygApiResponseMap = {};
            saygApiResponseMap[saygData1.id] = saygData1;
            saygApiResponseMap[saygData2.id] = saygData2;

            await renderComponent({
                tournamentData,
            }, { division });

            reportedError.verifyNoError();
            const headings = Array.from(context.container.querySelectorAll('h2'));
            expect(headings.map(h => h.textContent)).toEqual([
                'Master draw', 'Match log', 'Summary', 'SOMERSET DARTS ORGANISATION'
            ]);
        });
    });

    describe('interactivity', () => {
        describe('live updates', () => {
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
                    .round((r: ITournamentRoundBuilder) => r
                        .withMatch((m: ITournamentMatchBuilder) => m.saygId(saygData1.id)
                            .sideA('A', 1)
                            .sideB('B', 2))
                        .withMatch((m: ITournamentMatchBuilder) => m.saygId(saygData2.id)
                            .sideA('C', 3)
                            .sideB('D', 4)))
                    .build();
                const division: DivisionDto = divisionBuilder('DIVISION').build();
                saygApiResponseMap = {};
                saygApiResponseMap[saygData1.id] = saygData1;
                saygApiResponseMap[saygData2.id] = saygData2;
                await renderComponent({
                    tournamentData,
                }, { division });

                await doSelectOption(context.container.querySelector('.dropdown-menu'), '▶️ Live');

                expect(Object.keys(socketFactory.subscriptions).sort()).toEqual([ saygData1.id, saygData2.id, tournamentData.id ].sort());
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
                    .round((r: ITournamentRoundBuilder) => r
                        .withMatch((m: ITournamentMatchBuilder) => m.saygId(saygData1.id)
                            .sideA('A', 1)
                            .sideB('B', 2))
                        .withMatch((m: ITournamentMatchBuilder) => m.saygId(saygData2.id)
                            .sideA('C', 3)
                            .sideB('D', 4)))
                    .build();
                const division: DivisionDto = divisionBuilder('DIVISION').build();
                saygApiResponseMap = {};
                saygApiResponseMap[saygData1.id] = saygData1;
                saygApiResponseMap[saygData2.id] = saygData2;
                await renderComponent({
                    tournamentData,
                }, { division });
                await doSelectOption(context.container.querySelector('.dropdown-menu'), '▶️ Live');
                expect(context.container.querySelector('div[datatype="match-report"] > div > div:nth-child(1)').textContent).toEqual('Legs won: 2');
                expect(context.container.querySelector('div[datatype="match-report"] > div > div:nth-child(2)').textContent).toEqual('Legs won: 2');

                //send through some data
                const newSaygData = saygBuilder(saygData1.id)
                    .withLeg(0, createLeg(true, false))
                    .withLeg(1, createLeg(true, false))
                    .withLeg(2, createLeg(false, true))
                    .build();
                await act(async () => {
                    socketFactory.socket.onmessage({
                        type: 'message',
                        data: JSON.stringify({
                            type: MessageType.update,
                            id: newSaygData.id,
                            data: newSaygData
                        }),
                    } as MessageEvent<string>);
                });

                expect(context.container.querySelector('div[datatype="match-report"] > div > div:nth-child(1)').textContent).toEqual('Legs won: 2');
                expect(context.container.querySelector('div[datatype="match-report"] > div > div:nth-child(2)').textContent).toEqual('Legs won: 3');
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
                    .round((r: ITournamentRoundBuilder) => r
                        .withMatch((m: ITournamentMatchBuilder) => m.saygId(saygData1.id)
                            .sideA('A', 1)
                            .sideB('B', 2))
                        .withMatch((m: ITournamentMatchBuilder) => m.saygId(saygData2.id)
                            .sideA('C', 3)
                            .sideB('D', 4)))
                    .build();
                const division: DivisionDto = divisionBuilder('DIVISION').build();
                saygApiResponseMap = {};
                saygApiResponseMap[saygData1.id] = saygData1;
                saygApiResponseMap[saygData2.id] = saygData2;
                await renderComponent({
                    tournamentData,
                }, { division });
                await doSelectOption(context.container.querySelector('.dropdown-menu'), '▶️ Live');

                await doSelectOption(context.container.querySelector('.dropdown-menu'), '⏸️ Paused');

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
                    .round((r: ITournamentRoundBuilder) => r
                        .withMatch((m: ITournamentMatchBuilder) => m.saygId(saygData1.id)
                            .sideA('A', 1)
                            .sideB('B', 2))
                        .withMatch((m: ITournamentMatchBuilder) => m.saygId(saygData2.id)
                            .sideA('C', 3)
                            .sideB('D', 4)))
                    .build();
                const division: DivisionDto = divisionBuilder('DIVISION').build();
                saygApiResponseMap = {};
                saygApiResponseMap[saygData1.id] = saygData1;
                saygApiResponseMap[saygData2.id] = saygData2;
                await renderComponent({
                    tournamentData,
                }, { division });
                await doSelectOption(context.container.querySelector('.dropdown-menu'), '▶️ Live');
                await doSelectOption(context.container.querySelector('.dropdown-menu'), '⏸️ Paused');
                expect(Object.keys(socketFactory.subscriptions)).toEqual([]);

                await doSelectOption(context.container.querySelector('.dropdown-menu'), '▶️ Live');

                expect(Object.keys(socketFactory.subscriptions).sort()).toEqual([ tournamentData.id, saygData1.id, saygData2.id ].sort());
            });
        });
    });
});