import {
    api,
    appProps,
    brandingProps,
    cleanUp,
    doClick,
    ErrorState,
    findButton,
    iocProps,
    renderApp, TestContext
} from "../../../helpers/tests";
import React from "react";
import {IWidescreenSaygPlayerProps, WidescreenSaygPlayer} from "./WidescreenSaygPlayer";
import {ILegBuilder, ILegCompetitorScoreBuilder, saygBuilder} from "../../../helpers/builders/sayg";
import {LiveContainer} from "../LiveContainer";
import {ISaygLoadingContainerProps, SaygLoadingContainer} from "./SaygLoadingContainer";
import {ISaygApi} from "../../../api/sayg";
import {ILiveOptions} from "../../../interfaces/ILiveOptions";
import {IRecordedScoreAsYouGoDto} from "../../../interfaces/models/dtos/Game/Sayg/IRecordedScoreAsYouGoDto";

describe('WidescreenSaygPlayer', () => {
    let context: TestContext;
    let reportedError: ErrorState;
    let newStatisticsView: boolean;
    const saygApi = api<ISaygApi>({
        get: () => {
            return {};
        }
    })

    afterEach(() => {
        cleanUp(context);
    });

    beforeEach(() => {
        reportedError = new ErrorState();
        newStatisticsView = null;
    });

    async function changeStatisticsView(newValue: boolean) {
        newStatisticsView = newValue;
    }

    async function renderComponent(liveOptions: ILiveOptions, props: IWidescreenSaygPlayerProps, saygContainerProps?: ISaygLoadingContainerProps) {
        let element = <LiveContainer liveOptions={liveOptions}>
            <WidescreenSaygPlayer {...props} />
        </LiveContainer>;

        if (saygContainerProps) {
            element = (<SaygLoadingContainer {...saygContainerProps}>{element}</SaygLoadingContainer>);
        }

        context = await renderApp(
            iocProps({ saygApi }),
            brandingProps(),
            appProps({
                account: {
                    access: {
                        useWebSockets: true,
                    },
                },
            }, reportedError),
            element);
    }

    describe('renders', () => {
        let sayg: IRecordedScoreAsYouGoDto;

        beforeEach(() => {
            sayg = saygBuilder()
                .yourName('HOME')
                .opponentName('AWAY')
                .scores(1, 2)
                .numberOfLegs(5)
                .withLeg(0, (l: ILegBuilder) => l
                    .startingScore(501)
                    .home((c: ILegCompetitorScoreBuilder) => c.score(100).noOfDarts(3))
                    .away((c: ILegCompetitorScoreBuilder) => c.score(200).noOfDarts(6)))
                .build();
        });

        it('score first', async () => {
            await renderComponent(
                { },
                {
                    scoreFirst: true,
                    legs: sayg.legs,
                    player: 'home',
                    finished: false,
                    showOptions: false,
                    changeStatisticsView,
                });

            expect(reportedError.hasError()).toEqual(false);
            const scoreElement = context.container.querySelector('div:nth-child(1)');
            expect(scoreElement.querySelector('h1').textContent).toEqual('401');
        });

        it('score second', async () => {
            await renderComponent(
                { },
                {   scoreFirst: false,
                    legs: sayg.legs,
                    player: 'home',
                    finished: false,
                    showOptions: false,
                    changeStatisticsView: changeStatisticsView,
                });

            expect(reportedError.hasError()).toEqual(false);
            const scoreElement = context.container.querySelector('div:nth-child(2)');
            expect(scoreElement.querySelector('h1').textContent).toEqual('401');
        });

        it('no options', async () => {
            await renderComponent(
                { },
                {   scoreFirst: false,
                    legs: sayg.legs,
                    player: 'home',
                    finished: false,
                    showOptions: false,
                    changeStatisticsView: changeStatisticsView,
                });

            expect(reportedError.hasError()).toEqual(false);
            const optionsContainer = context.container.querySelector('div:nth-child(3)');
            expect(optionsContainer).toBeFalsy();
        });

        it('refresh control', async () => {
            await renderComponent(
                {
                    canSubscribe: true,
                },
                {   scoreFirst: false,
                    legs: sayg.legs,
                    player: 'home',
                    finished: false,
                    showOptions: true,
                    changeStatisticsView: changeStatisticsView,
                }, {
                    defaultData: sayg,
                    id: null,
                    liveOptions: {},
                });

            expect(reportedError.hasError()).toEqual(false);
            const optionsContainer = context.container.querySelector('div:nth-child(3)');
            expect(optionsContainer).toBeTruthy();
            expect(optionsContainer.textContent).toContain('⏸️ Paused');
        });

        it('no refresh control when not permitted', async () => {
            await renderComponent(
                {
                    canSubscribe: false,
                },
                {   scoreFirst: false,
                    legs: sayg.legs,
                    player: 'home',
                    finished: false,
                    showOptions: true,
                    changeStatisticsView: changeStatisticsView,
                }, {
                    defaultData: sayg,
                    id: null,
                    liveOptions: {},
                });

            expect(reportedError.hasError()).toEqual(false);
            const optionsContainer = context.container.querySelector('div:nth-child(3)');
            expect(optionsContainer).toBeTruthy();
            expect(optionsContainer.textContent).not.toContain('⏸️ Paused');
        });

        it('no refresh control when finished', async () => {
            await renderComponent(
                {
                    canSubscribe: true,
                },
                {   scoreFirst: false,
                    legs: sayg.legs,
                    player: 'home',
                    finished: true,
                    showOptions: true,
                    changeStatisticsView: changeStatisticsView,
                }, {
                    defaultData: sayg,
                    id: null,
                    liveOptions: {},
                });

            expect(reportedError.hasError()).toEqual(false);
            const optionsContainer = context.container.querySelector('div:nth-child(3)');
            expect(optionsContainer).toBeTruthy();
            expect(optionsContainer.textContent).not.toContain('⏸️ Paused');
        });

        it('change of view', async () => {
            await renderComponent(
                { },
                {   scoreFirst: false,
                    legs: sayg.legs,
                    player: 'home',
                    finished: false,
                    showOptions: true,
                    changeStatisticsView: changeStatisticsView,
                });

            expect(reportedError.hasError()).toEqual(false);
            const optionsContainer = context.container.querySelector('div:nth-child(3)');
            const changeButton = optionsContainer.querySelector('button');
            expect(changeButton.textContent).toEqual('📊');
        });

        it('no change of view', async () => {
            await renderComponent(
                { },
                {   scoreFirst: false,
                    legs: sayg.legs,
                    player: 'home',
                    finished: false,
                    showOptions: true,
                    changeStatisticsView: null,
                });

            expect(reportedError.hasError()).toEqual(false);
            const optionsContainer = context.container.querySelector('div:nth-child(3)');
            const changeButton = optionsContainer.querySelector('button');
            expect(changeButton).toBeFalsy();
        });

        it('winner when finished', async () => {
            sayg.legs[0].home.score = 501;

            await renderComponent(
                { },
                {   scoreFirst: false,
                    legs: sayg.legs,
                    player: 'home',
                    finished: true,
                    showOptions: true,
                    changeStatisticsView: null,
                });

            expect(reportedError.hasError()).toEqual(false);
            const scoreElement = context.container.querySelector('h1');
            expect(scoreElement.textContent).toEqual('🎉');
        });

        it('no winner when unfinished', async () => {
            sayg.legs[0].home.score = 501;

            await renderComponent(
                { },
                {   scoreFirst: false,
                    legs: sayg.legs,
                    player: 'home',
                    finished: false,
                    showOptions: true,
                    changeStatisticsView: null,
                });

            expect(reportedError.hasError()).toEqual(false);
            const scoreElement = context.container.querySelector('h1');
            expect(scoreElement.textContent).toEqual('0');
        });

        it('5 recent throws from first leg', async () => {
            sayg = saygBuilder()
                .yourName('HOME')
                .opponentName('AWAY')
                .scores(1, 2)
                .numberOfLegs(5)
                .withLeg(0, (l: ILegBuilder) => l
                    .startingScore(501)
                    .home((c: ILegCompetitorScoreBuilder) => c.score(100).noOfDarts(3)
                        .withThrow(2, false, 1)
                        .withThrow(4, false, 1)
                        .withThrow(6, false, 1)
                        .withThrow(8, false, 1)
                        .withThrow(10, false, 1)
                        .withThrow(12, true, 1))
                    .away((c: ILegCompetitorScoreBuilder) => c.score(200).noOfDarts(6)))
                .build();

            await renderComponent(
                { },
                {   scoreFirst: false,
                    legs: sayg.legs,
                    player: 'home',
                    finished: false,
                    showOptions: true,
                    changeStatisticsView: null,
                });

            expect(reportedError.hasError()).toEqual(false);
            const throwsElement = context.container.querySelector('div[datatype="WidescreenSaygPlayer"] > div:nth-child(1)');
            const throws = Array.from(throwsElement.querySelectorAll('div'));
            expect(throws.map(thr => thr.textContent)).toEqual([ '12', '10', '8', '6', '4' ]);
        });

        it('5 recent throws from second leg', async () => {
            sayg = saygBuilder()
                .yourName('HOME')
                .opponentName('AWAY')
                .scores(1, 2)
                .numberOfLegs(5)
                .withLeg(0, (l: ILegBuilder) => l
                    .startingScore(501)
                    .home((c: ILegCompetitorScoreBuilder) => c.score(100).noOfDarts(3)
                        .withThrow(2, false, 1)
                        .withThrow(4, false, 1)
                        .withThrow(6, false, 1)
                        .withThrow(8, false, 1)
                        .withThrow(10, false, 1)
                        .withThrow(12, true, 1))
                    .away((c: ILegCompetitorScoreBuilder) => c.score(200).noOfDarts(6)))
                .withLeg(1, (l: ILegBuilder) => l
                    .startingScore(501)
                    .home((c: ILegCompetitorScoreBuilder) => c.score(100).noOfDarts(3)
                        .withThrow(12, false, 1)
                        .withThrow(14, false, 1)
                        .withThrow(16, false, 1)
                        .withThrow(18, false, 1)
                        .withThrow(110, false, 1)
                        .withThrow(112, true, 1))
                    .away((c: ILegCompetitorScoreBuilder) => c.score(200).noOfDarts(6)))
                .build();

            await renderComponent(
                { },
                {   scoreFirst: false,
                    legs: sayg.legs,
                    player: 'home',
                    finished: false,
                    showOptions: true,
                    changeStatisticsView: null,
                });

            expect(reportedError.hasError()).toEqual(false);
            const throwsElement = context.container.querySelector('div[datatype="WidescreenSaygPlayer"] > div:nth-child(1)');
            const throws = Array.from(throwsElement.querySelectorAll('div'));
            expect(throws.map(thr => thr.textContent)).toEqual([ '112', '110', '18', '16', '14' ]);
        });

        it('less than 5 recent throws', async () => {
            sayg = saygBuilder()
                .yourName('HOME')
                .opponentName('AWAY')
                .scores(1, 2)
                .numberOfLegs(5)
                .withLeg(0, (l: ILegBuilder) => l
                    .startingScore(501)
                    .home((c: ILegCompetitorScoreBuilder) => c.score(100).noOfDarts(3)
                        .withThrow(2, false, 1)
                        .withThrow(4, false, 1)
                        .withThrow(6, false, 1))
                    .away((c: ILegCompetitorScoreBuilder) => c.score(200).noOfDarts(6)))
                .build();

            await renderComponent(
                { },
                {   scoreFirst: false,
                    legs: sayg.legs,
                    player: 'home',
                    finished: false,
                    showOptions: true,
                    changeStatisticsView: null,
                });

            expect(reportedError.hasError()).toEqual(false);
            const throwsElement = context.container.querySelector('div[datatype="WidescreenSaygPlayer"] > div:nth-child(1)');
            const throws = Array.from(throwsElement.querySelectorAll('div'));
            expect(throws.map(thr => thr.textContent)).toEqual([ '6', '4', '2' ]);
        });
    });

    describe('interactivity', () => {
        let sayg: IRecordedScoreAsYouGoDto;

        beforeEach(() => {
            sayg = saygBuilder()
                .yourName('HOME')
                .opponentName('AWAY')
                .scores(1, 2)
                .numberOfLegs(5)
                .withLeg(0, (l: ILegBuilder) => l
                    .startingScore(501)
                    .home((c: ILegCompetitorScoreBuilder) => c.score(100).noOfDarts(3))
                    .away((c: ILegCompetitorScoreBuilder) => c.score(200).noOfDarts(6)))
                .build();
        });

        it('can change statistics view', async () => {
            await renderComponent(
                { },
                {   scoreFirst: false,
                    legs: sayg.legs,
                    player: 'home',
                    finished: false,
                    showOptions: true,
                    changeStatisticsView: changeStatisticsView,
                });

            await doClick(findButton(context.container, '📊'));

            expect(reportedError.hasError()).toEqual(false);
            expect(newStatisticsView).toEqual(false);
        });
    });
});