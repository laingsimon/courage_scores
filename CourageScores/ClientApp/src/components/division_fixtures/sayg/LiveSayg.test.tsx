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
} from "../../../helpers/tests";
import React from "react";
import {LiveSayg} from "./LiveSayg";
import {saygBuilder} from "../../../helpers/builders/sayg";
import {IRecordedScoreAsYouGoDto} from "../../../interfaces/models/dtos/Game/Sayg/IRecordedScoreAsYouGoDto";
import {ISaygApi} from "../../../interfaces/apis/ISaygApi";

describe('LiveSayg', () => {
    let context: TestContext;
    let requestedSaygId: string;
    let saygData: IRecordedScoreAsYouGoDto;
    let reportedError: ErrorState;
    let socketFactory: MockSocketFactory;
    const saygApi = api<ISaygApi>({
        get: (id: string) => {
            requestedSaygId = id;
            return saygData;
        }
    });

    afterEach(() => {
        cleanUp(context);
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

        expect(reportedError.hasError()).toEqual(false);
        expect(requestedSaygId).toEqual(saygData.id);
    })
});