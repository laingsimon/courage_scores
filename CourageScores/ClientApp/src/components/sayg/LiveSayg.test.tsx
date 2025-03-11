import {
    api,
    appProps,
    brandingProps,
    cleanUp,
    ErrorState,
    iocProps, MockSocketFactory,
    noop,
    renderApp,
    TestContext
} from "../../helpers/tests";
import {LiveSayg} from "./LiveSayg";
import {ILegBuilder, ILegCompetitorScoreBuilder, saygBuilder} from "../../helpers/builders/sayg";
import {RecordedScoreAsYouGoDto} from "../../interfaces/models/dtos/Game/Sayg/RecordedScoreAsYouGoDto";
import {ISaygApi} from "../../interfaces/apis/ISaygApi";

describe('LiveSayg', () => {
    let context: TestContext;
    let requestedSaygId: string | null;
    let saygData: RecordedScoreAsYouGoDto;
    let reportedError: ErrorState;
    let socketFactory: MockSocketFactory;
    const saygApi = api<ISaygApi>({
        get: async (id: string): Promise<RecordedScoreAsYouGoDto | null> => {
            requestedSaygId = id;
            return saygData;
        }
    });

    afterEach(async () => {
        await cleanUp(context);
    });

    beforeEach(() => {
        reportedError = new ErrorState();
        requestedSaygId = null;
        socketFactory = new MockSocketFactory();
    });

    async function renderComponent(route?: string, currentPath?: string) {
        context = await renderApp(
            iocProps({saygApi, socketFactory: socketFactory.createSocket }),
            brandingProps(),
            appProps({}, reportedError),
            <LiveSayg />,
            route,
            currentPath);
    }

    it('requests given id', async () => {
        saygData = saygBuilder()
            .build();
        console.log = noop;

        await renderComponent('/live/match/:id', '/live/match/' + saygData.id);

        reportedError.verifyNoError();
        expect(requestedSaygId).toEqual(saygData.id);
    });

    it('shows 3 dart averages', async () => {
        saygData = saygBuilder()
            .numberOfLegs(1)
            .startingScore(501)
            .yourName('HOME').opponentName('AWAY')
            .withLeg(0, (l: ILegBuilder) => l
                .home((c: ILegCompetitorScoreBuilder) => c.withThrow(180).withThrow(180).withThrow(121))
                .away((c: ILegCompetitorScoreBuilder) => c.withThrow(100).withThrow(100)))
            .build();
        console.log = noop;

        await renderComponent('/live/match/:id', `/live/match/${saygData.id}?average=3`);

        reportedError.verifyNoError();
        expect(context.container.innerHTML).toContain('Match statistics');
        const oneDartAverage: HTMLInputElement = context.container.querySelector('#oneDartAverage')!;
        expect(oneDartAverage.checked).toEqual(false);
    });

    it('shows 3 dart averages', async () => {
        saygData = saygBuilder()
            .numberOfLegs(1)
            .startingScore(501)
            .yourName('HOME').opponentName('AWAY')
            .withLeg(0, (l: ILegBuilder) => l
                .home((c: ILegCompetitorScoreBuilder) => c.withThrow(180).withThrow(180).withThrow(121))
                .away((c: ILegCompetitorScoreBuilder) => c.withThrow(100).withThrow(100)))
            .build();
        console.log = noop;

        await renderComponent('/live/match/:id', `/live/match/${saygData.id}?average=1`);

        reportedError.verifyNoError();
        expect(context.container.innerHTML).toContain('Match statistics');
        const oneDartAverage: HTMLInputElement = context.container.querySelector('#oneDartAverage')!;
        expect(oneDartAverage.checked).toEqual(true);
    });
});