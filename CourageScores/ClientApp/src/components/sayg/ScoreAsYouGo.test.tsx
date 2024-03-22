import {
    appProps,
    brandingProps,
    cleanUp,
    doChange,
    doClick, ErrorState,
    findButton,
    iocProps,
    renderApp, TestContext
} from "../../helpers/tests";
import {IScoreAsYouGoProps, ScoreAsYouGo} from "./ScoreAsYouGo";
import {ILegBuilder, ILegCompetitorScoreBuilder, legBuilder, saygBuilder} from "../../helpers/builders/sayg";
import {ILiveContainerProps, LiveContainer} from "../../live/LiveContainer";
import {RecordedScoreAsYouGoDto} from "../../interfaces/models/dtos/Game/Sayg/RecordedScoreAsYouGoDto";
import {CHECKOUT_3_DART, ENTER_SCORE_BUTTON} from "../../helpers/constants";

describe('ScoreAsYouGo', () => {
    let context: TestContext;
    let changedLegs: RecordedScoreAsYouGoDto[];
    let completedLegs: {homeScore: number, awayScore: number}[];
    let reportedError: ErrorState;

    afterEach(() => {
        cleanUp(context);
    });

    beforeEach(() => {
        reportedError = new ErrorState();
        changedLegs = [];
        completedLegs = [];
    });

    async function on180(_: string) {
    }

    async function onHiCheck(_: string, __: number) {
    }

    async function onChange(leg: RecordedScoreAsYouGoDto) {
        changedLegs.push(leg);
    }

    async function onLegComplete(homeScore: number, awayScore: number) {
        completedLegs.push({homeScore, awayScore});
    }

    async function renderComponent(props: IScoreAsYouGoProps, liveProps?: ILiveContainerProps) {
        context = await renderApp(
            iocProps(),
            brandingProps(),
            appProps({}, reportedError),
            <LiveContainer {...liveProps}>
                <ScoreAsYouGo {...props} />
            </LiveContainer>);
    }

    it('renders match statistics for single player games', async () => {
        await renderComponent({
            data: saygBuilder().build(),
            home: 'HOME',
            away: 'AWAY',
            startingScore: 501,
            numberOfLegs: 3,
            awayScore: 0,
            homeScore: 3,
            singlePlayer: true,
            onChange,
            onLegComplete,
            on180,
            onHiCheck,
        }, { liveOptions: {} });

        expect(context.container.textContent).toContain('Match statistics');
    });

    it('renders match statistics for 2 player games when all legs played', async () => {
        await renderComponent({
            data: saygBuilder().build(),
            home: 'HOME',
            away: 'AWAY',
            startingScore: 501,
            numberOfLegs: 5,
            awayScore: 2,
            homeScore: 3,
            singlePlayer: false,
            onChange,
            onLegComplete,
            on180,
            onHiCheck,
        }, { liveOptions: {} });

        expect(context.container.textContent).toContain('Match statistics');
    });

    it('renders match statistics for 2 player games when home player unbeatable', async () => {
        await renderComponent({
            data: saygBuilder().build(),
            home: 'HOME',
            away: 'AWAY',
            startingScore: 501,
            numberOfLegs: 5,
            awayScore: 0,
            homeScore: 3,
            singlePlayer: false,
            onChange,
            onLegComplete,
            on180,
            onHiCheck,
        }, { liveOptions: {} });

        expect(context.container.textContent).toContain('Match statistics');
    });

    it('renders match statistics for 2 player games when away player unbeatable', async () => {
        await renderComponent({
            data: saygBuilder().build(),
            home: 'HOME',
            away: 'AWAY',
            startingScore: 501,
            numberOfLegs: 5,
            awayScore: 3,
            homeScore: 0,
            singlePlayer: false,
            onChange,
            onLegComplete,
            on180,
            onHiCheck,
        }, { liveOptions: {} });

        expect(context.container.textContent).toContain('Match statistics');
    });

    it('renders play leg otherwise', async () => {
        await renderComponent({
            data: saygBuilder().build(),
            home: 'HOME',
            away: 'AWAY',
            startingScore: 501,
            numberOfLegs: 5,
            awayScore: 0,
            homeScore: 0,
            singlePlayer: false,
            onChange,
            onLegComplete,
            on180,
            onHiCheck,
        });

        expect(context.container.textContent).toContain('Who plays first?');
    });

    it('can update leg', async () => {
        await renderComponent({
            data: saygBuilder().withLeg(0, (l: ILegBuilder) => l).build(),
            home: 'HOME',
            away: 'AWAY',
            startingScore: 501,
            numberOfLegs: 1,
            awayScore: 0,
            homeScore: 0,
            singlePlayer: false,
            onChange,
            onLegComplete,
            on180,
            onHiCheck,
        });

        await doClick(findButton(context.container, '🎯HOME'));

        expect(changedLegs).toEqual([{
            id: expect.any(String),
            legs: {
                0:
                    {
                        isLastLeg: false,
                        away: null,
                        home: null,
                        currentThrow: 'home',
                        playerSequence: [
                            {text: 'HOME', value: 'home'},
                            {text: 'AWAY', value: 'away'}
                        ]
                    }
            },
            yourName: null,
        }]);
    });

    it('can record home winner for 2 player match', async () => {
        const leg = legBuilder()
            .currentThrow('home')
            .playerSequence('home', 'away')
            .home((c: ILegCompetitorScoreBuilder) => c.noOfDarts(3).score(400).withThrow(400, false, 3))
            .away((c: ILegCompetitorScoreBuilder) => c.noOfDarts(3).score(100).withThrow(50, false, 3))
            .startingScore(501)
            .lastLeg()
            .build();
        await renderComponent({
            data: saygBuilder().withLeg(0, leg).build(),
            home: 'HOME',
            away: 'AWAY',
            startingScore: 501,
            numberOfLegs: 1,
            awayScore: 0,
            homeScore: 0,
            singlePlayer: false,
            onChange,
            onLegComplete,
            on180,
            onHiCheck,
        });

        await doChange(context.container, 'input[data-score-input="true"]', '101', context.user);
        await doClick(findButton(context.container, ENTER_SCORE_BUTTON));
        await doClick(findButton(context.container, CHECKOUT_3_DART));

        expect(completedLegs).toEqual([{homeScore: 1, awayScore: 0}]);
        expect(changedLegs).toEqual([{
            id: expect.any(String),
            legs: {
                0: {
                    currentThrow: 'away',
                    playerSequence: [
                        {text: 'HOME', value: 'home'},
                        {text: 'AWAY', value: 'away'}
                    ],
                    home: {
                        bust: false,
                        noOfDarts: 6,
                        throws: [
                            {noOfDarts: 3, score: 400, bust: false},
                            {noOfDarts: 3, score: 101}
                        ],
                        score: 501,
                    },
                    away: {
                        noOfDarts: 3,
                        bust: false,
                        throws: [{noOfDarts: 3, score: 50, bust: false}],
                        score: 100,
                    },
                    startingScore: 501,
                    winner: 'home',
                    isLastLeg: true,
                }
            },
            yourName: null,
        }]);
    });

    it('can record home winner for 2 player match, not last leg', async () => {
        const leg = legBuilder()
            .currentThrow('home')
            .playerSequence('home', 'away')
            .home((c: ILegCompetitorScoreBuilder) => c.noOfDarts(3).score(400).withThrow(400, false, 3))
            .away((c: ILegCompetitorScoreBuilder) => c.noOfDarts(3).score(100).withThrow(50, false, 3))
            .startingScore(501)
            .build();
        await renderComponent({
            data: saygBuilder().withLeg(0, leg).build(),
            home: 'HOME',
            away: 'AWAY',
            startingScore: 501,
            numberOfLegs: 3,
            awayScore: 0,
            homeScore: 0,
            singlePlayer: false,
            onChange,
            onLegComplete,
            on180,
            onHiCheck,
        });

        await doChange(context.container, 'input[data-score-input="true"]', '101', context.user);
        await doClick(findButton(context.container, ENTER_SCORE_BUTTON));
        await doClick(findButton(context.container, CHECKOUT_3_DART));

        expect(completedLegs).toEqual([{homeScore: 1, awayScore: 0}]);
        expect(changedLegs[1]).toEqual({
            id: expect.any(String),
            legs: {
                0: {
                    currentThrow: 'home',
                    playerSequence: [
                        {text: 'HOME', value: 'home'},
                        {text: 'AWAY', value: 'away'},
                    ],
                    home: {
                        bust: false,
                        noOfDarts: 6,
                        throws: [
                            {noOfDarts: 3, score: 400, bust: false},
                            {noOfDarts: 3, score: 101}
                        ],
                        score: 501,
                    },
                    away: {
                        bust: false,
                        noOfDarts: 3,
                        throws: [{noOfDarts: 3, score: 50, bust: false}],
                        score: 100,
                    },
                    startingScore: 501,
                    isLastLeg: false,
                },
                1: {
                    currentThrow: 'away',
                    playerSequence: [
                        {text: 'AWAY', value: 'away'},
                        {text: 'HOME', value: 'home'},
                    ],
                    home: {
                        noOfDarts: 0,
                        throws: [],
                        score: 0,
                    },
                    away: {
                        noOfDarts: 0,
                        throws: [],
                        score: 0,
                    },
                    startingScore: 501,
                    isLastLeg: false,
                }
            },
            yourName: null,
        });
    });

    it('shows statistics if home player wins over half of legs', async () => {
        const leg = legBuilder()
            .currentThrow('home')
            .playerSequence('home', 'away')
            .lastLeg()
            .home((c: ILegCompetitorScoreBuilder) => c.noOfDarts(3).score(400).withThrow(400, false, 3))
            .away((c: ILegCompetitorScoreBuilder) => c.noOfDarts(3).score(100).withThrow(50, false, 3))
            .startingScore(501)
            .build();
        await renderComponent({
            data: saygBuilder()
                .withLeg(0, (l: ILegBuilder) => l
                    .home((c: ILegCompetitorScoreBuilder) => c
                        .withThrow(100)
                        .withThrow(100)
                        .withThrow(100)
                        .withThrow(100)
                        .withThrow(101)))
                .withLeg(1, leg)
                .build(),
            home: 'HOME',
            away: 'AWAY',
            startingScore: 501,
            numberOfLegs: 3,
            awayScore: 0,
            homeScore: 1,
            singlePlayer: false,
            onChange,
            onLegComplete,
            on180,
            onHiCheck,
        });

        await doChange(context.container, 'input[data-score-input="true"]', '101', context.user);
        await doClick(findButton(context.container, ENTER_SCORE_BUTTON));
        await doClick(findButton(context.container, CHECKOUT_3_DART));

        expect(completedLegs).toEqual([{homeScore: 2, awayScore: 0}]);
        expect(changedLegs.length).toEqual(1);
        expect(Object.keys(changedLegs[0].legs)).toEqual(['0', '1']);
        expect(changedLegs[0].legs[1].currentThrow).toEqual('away');
    });

    it('shows statistics if away player wins over half of legs', async () => {
        const leg = legBuilder()
            .currentThrow('away')
            .lastLeg()
            .playerSequence('home', 'away')
            .home((c: ILegCompetitorScoreBuilder) => c.noOfDarts(3).score(100).withThrow(50, false, 3))
            .away((c: ILegCompetitorScoreBuilder) => c.noOfDarts(3).score(400).withThrow(400, false, 3))
            .startingScore(501)
            .build();
        await renderComponent({
            data: saygBuilder()
                .withLeg(0, (l: ILegBuilder) => l
                    .away((c: ILegCompetitorScoreBuilder) => c
                        .withThrow(100)
                        .withThrow(100)
                        .withThrow(100)
                        .withThrow(100)
                        .withThrow(101)))
                .withLeg(1, leg)
                .build(),
            home: 'HOME',
            away: 'AWAY',
            startingScore: 501,
            numberOfLegs: 3,
            awayScore: 1,
            homeScore: 0,
            singlePlayer: false,
            onChange,
            onLegComplete,
            on180,
            onHiCheck,
        });

        await doChange(context.container, 'input[data-score-input="true"]', '101', context.user);
        await doClick(findButton(context.container, ENTER_SCORE_BUTTON));
        await doClick(findButton(context.container, CHECKOUT_3_DART));

        expect(completedLegs).toEqual([{homeScore: 0, awayScore: 2}]);
        expect(changedLegs.length).toEqual(1);
        expect(Object.keys(changedLegs[0].legs)).toEqual(['0', '1']);
        expect(changedLegs[0].legs[1].currentThrow).toEqual('home');
    });

    it('can record winner for single player match', async () => {
        const leg = legBuilder()
            .currentThrow('home')
            .playerSequence('home', 'away')
            .home((c: ILegCompetitorScoreBuilder) => c.noOfDarts(3).score(400).withThrow(400, false, 3))
            .away((c: ILegCompetitorScoreBuilder) => c)
            .startingScore(501)
            .lastLeg()
            .build();
        await renderComponent({
            data: saygBuilder().withLeg(0, leg).build(),
            home: 'HOME',
            startingScore: 501,
            numberOfLegs: 1,
            awayScore: 0,
            homeScore: 0,
            singlePlayer: true,
            onChange,
            onLegComplete,
            on180,
            onHiCheck,
        });

        await doChange(context.container, 'input[data-score-input="true"]', '101', context.user);
        await doClick(findButton(context.container, ENTER_SCORE_BUTTON));
        await doClick(findButton(context.container, CHECKOUT_3_DART));

        expect(completedLegs).toEqual([{homeScore: 1, awayScore: 0}]);
        expect(changedLegs).toEqual([{
            id: expect.any(String),
            legs: {
                0: {
                    currentThrow: 'home',
                    playerSequence: [
                        {text: 'HOME', value: 'home'},
                        {text: 'AWAY', value: 'away'}
                    ],
                    home: {
                        bust: false,
                        noOfDarts: 6,
                        throws: [
                            {noOfDarts: 3, score: 400, bust: false},
                            {noOfDarts: 3, score: 101}
                        ],
                        score: 501,
                    },
                    away: {
                        throws: [],
                        bust: false,
                        noOfDarts: 0,
                        score: 0
                    },
                    startingScore: 501,
                    winner: 'home',
                    isLastLeg: true,
                }
            },
            yourName: null,
        }]);
    });
});