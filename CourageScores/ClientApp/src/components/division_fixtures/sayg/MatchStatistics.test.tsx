import {
    api,
    appProps,
    brandingProps,
    cleanUp,
    doClick,
    doSelectOption, ErrorState,
    findButton,
    iocProps, MockSocketFactory,
    noop,
    renderApp, TestContext
} from "../../../helpers/tests";
import React from "react";
import {ILegCompetitorScoreBuilder, legBuilder, saygBuilder} from "../../../helpers/builders/sayg";
import {ISaygLoadingContainerProps, SaygLoadingContainer} from "./SaygLoadingContainer";
import {createTemporaryId} from "../../../helpers/projection";
import {act} from "@testing-library/react";
import {ISaygApi} from "../../../api/sayg";
import {IRecordedScoreAsYouGoDto} from "../../../interfaces/serverSide/Game/Sayg/IRecordedScoreAsYouGoDto";
import {IUpdateRecordedScoreAsYouGoDto} from "../../../interfaces/serverSide/Game/Sayg/IUpdateRecordedScoreAsYouGoDto";
import {IAppContainerProps} from "../../../AppContainer";
import {ILiveOptions} from "../../../interfaces/ILiveOptions";
import {IUserDto} from "../../../interfaces/serverSide/Identity/IUserDto";
import {ILegDto} from "../../../interfaces/serverSide/Game/Sayg/ILegDto";
import {ILegDisplayOptions} from "../../../interfaces/ILegDisplayOptions";

describe('MatchStatistics', () => {
    let context: TestContext;
    let reportedError: ErrorState;
    let saygData: IRecordedScoreAsYouGoDto;
    let updatedSayg: IUpdateRecordedScoreAsYouGoDto;
    let socketFactory: MockSocketFactory;

    const saygApi = api<ISaygApi>({
        get: () => {
            return saygData;
        },
        upsert: (data: IUpdateRecordedScoreAsYouGoDto) => {
            updatedSayg = data;
            return {
                success: true,
                result: data,
            };
        },
    });

    afterEach(() => {
        cleanUp(context);
    });

    beforeEach(() => {
        reportedError = new ErrorState();
        updatedSayg = null;
        socketFactory = new MockSocketFactory();
    });

    async function renderComponent(saygContainerProps: ISaygLoadingContainerProps, data?: IRecordedScoreAsYouGoDto, appContainerProps?: IAppContainerProps) {
        saygData = data;
        context = await renderApp(
            iocProps({saygApi, socketFactory: socketFactory.createSocket}),
            brandingProps(),
            appProps(appContainerProps, reportedError),
            <SaygLoadingContainer {...saygContainerProps} />);
    }

    function assertHeaderText(expected: string[], homeWinner?: boolean, awayWinner?: boolean) {
        const table = context.container.querySelector('table');
        const row = table.querySelector('thead tr');
        if (expected.length === 0) {
            expect(row).toBeFalsy();
            return;
        }

        const headerText: string[] = Array.from(row.querySelectorAll('th')).map(th => th.textContent);
        expect(headerText).toEqual(expected);
        assertColumnClassNames(row, 'th', 'text-primary', homeWinner, awayWinner);
    }

    function assertMatchAverage(expected: string[], homeWinner?: boolean, awayWinner?: boolean) {
        const table = context.container.querySelector('table');
        const row = table.querySelector('tfoot tr:nth-child(1)');
        const rowText: string[] = Array.from(row.querySelectorAll('td')).map(th => th.textContent);
        expect(rowText).toEqual(expected);
        assertColumnClassNames(row, 'td', 'bg-winner', homeWinner, awayWinner);
    }

    function assertMatchDartCount(expected: string[], homeWinner?: boolean, awayWinner?: boolean) {
        const table = context.container.querySelector('table');
        const row = table.querySelector('tfoot tr:nth-child(2)');
        const rowText: string[] = Array.from(row.querySelectorAll('td')).map(th => th.textContent);
        expect(rowText).toEqual(expected);
        assertColumnClassNames(row, 'td', 'bg-winner', homeWinner, awayWinner);
    }

    function assertScoreRow(expected: string[], homeWinner?: boolean, awayWinner?: boolean) {
        const table = context.container.querySelector('table');
        const row = table.querySelector('tbody tr:nth-child(1)');
        const rowText: string[] = Array.from(row.querySelectorAll('td')).map(th => th.textContent);
        expect(rowText).toEqual(expected);
        assertColumnClassNames(row, 'td', 'bg-winner text-primary', homeWinner, awayWinner);
    }

    function assertColumnClassNames(row: Element, nodeName: string, className: string, home: boolean, away?: boolean) {
        const homeCell = row.querySelector(nodeName + ':nth-child(2)');
        expect(homeCell).toBeTruthy();
        if (home) {
            expect(homeCell.className).toContain(className);
        } else {
            expect(homeCell.className).not.toContain(className);
        }

        if (away !== null && away !== undefined) {
            const awayCell = row.querySelector(nodeName + ':nth-child(3)');
            expect(awayCell).toBeTruthy();
            if (away) {
                expect(awayCell.className).toContain(className);
            } else {
                expect(awayCell.className).not.toContain(className);
            }
        }
    }

    function assertLegRow(legIndex: number, expected: string[], homeWinner?: boolean, awayWinner?: boolean) {
        const table = context.container.querySelector('table');
        const rowOrdinal: number = legIndex + 2;
        const row = table.querySelector(`tbody tr:nth-child(${rowOrdinal})`);
        const rowText: string[] = Array.from(row.querySelectorAll('td')).map(th => th.textContent);
        expect(rowText).toEqual(expected);
        assertColumnClassNames(row, 'td', 'bg-winner text-primary', homeWinner, awayWinner);
    }

    function emptyLiveOptions(): ILiveOptions {
        return {};
    }

    it('renders 2 player statistics', async () => {
        const leg = legBuilder()
            .currentThrow('home')
            .startingScore(501)
            .home((c: ILegCompetitorScoreBuilder) => c.withThrow(123, false, 3).score(123).noOfDarts(3))
            .away((c: ILegCompetitorScoreBuilder) => c.withThrow(100, false, 3).withThrow(150, false, 3).score(250).noOfDarts(6))
            .build();
        const saygData = saygBuilder()
            .withLeg(0, leg)
            .scores(3, 2)
            .yourName('HOME')
            .opponentName('AWAY')
            .numberOfLegs(3)
            .startingScore(501)
            .build();

        await renderComponent({
            id: saygData.id,
            liveOptions: emptyLiveOptions(),
        },
        saygData);

        assertHeaderText(['', 'HOME', 'AWAY'], true, false);
        assertScoreRow(['Score', '3', '2'], true, false);
        assertLegRow(
            0,
            [
                'Leg: 1Details',
                'Average: 123 (3 darts)Remaining: 378',
                'Average: 125 (6 darts)Remaining: 251']);
        assertMatchAverage(['Match average3️⃣', '123', '125'], false, true);
        assertMatchDartCount(['Match darts', '3', '6'], true, false);
    });

    it('renders single player statistics', async () => {
        const leg = legBuilder()
            .currentThrow('home')
            .startingScore(501)
            .home((c: ILegCompetitorScoreBuilder) => c.withThrow(123, false, 3).score(123).noOfDarts(3))
            .away((c: ILegCompetitorScoreBuilder) => c)
            .winner('home')
            .build();
        const saygData = saygBuilder()
            .withLeg(0, leg)
            .scores(3)
            .yourName('HOME')
            .numberOfLegs(3)
            .build();

        await renderComponent({
            id: saygData.id,
            liveOptions: emptyLiveOptions(),
        },
        saygData);

        assertHeaderText([]);
        assertScoreRow(['Score', '3']);
        assertLegRow(
            0,
            [
                'Leg: 1Details',
                'Average: 123 (3 darts)Checkout: 123']);
        assertMatchAverage(['Match average3️⃣', '123']);
        assertMatchDartCount(['Match darts', '3'], true);
    });

    it('can expand leg to show throws', async () => {
        const leg = legBuilder()
            .currentThrow('home')
            .startingScore(501)
            .home((c: ILegCompetitorScoreBuilder) => c.withThrow(123, false, 3).score(123).noOfDarts(3))
            .away((c: ILegCompetitorScoreBuilder) => c.withThrow(100, false, 3).withThrow(150, false, 3).score(250).noOfDarts(6))
            .build();
        const saygData = saygBuilder()
            .withLeg(0, leg)
            .scores(3, 2)
            .yourName('HOME')
            .opponentName('AWAY')
            .numberOfLegs(3)
            .build();
        await renderComponent({
            id: saygData.id,
            liveOptions: emptyLiveOptions(),
        }, saygData);

        await doClick(context.container.querySelector('input[name="showThrows"]'));

        assertLegRow(
            0,
            [
                'Leg: 1DetailsClick to show running average',
                'Average: 123 (3 darts)Remaining: 378ThrewScoreDarts1233783',
                '123', '378', '3',
                'Average: 125 (6 darts)Remaining: 251ThrewScoreDarts10040131502513',
                '100', '401', '3',
                '150', '251', '3']);
    });

    it('can toggle leg to show averages', async () => {
        const leg = legBuilder()
            .currentThrow('home')
            .startingScore(501)
            .home((c: ILegCompetitorScoreBuilder) => c.withThrow(123, false, 3).score(123).noOfDarts(3))
            .away((c: ILegCompetitorScoreBuilder) => c.withThrow(100, false, 3).withThrow(150, false, 3).score(250).noOfDarts(6))
            .build();
        const saygData = saygBuilder()
            .withLeg(0, leg)
            .scores(3, 2)
            .yourName('HOME')
            .opponentName('AWAY')
            .numberOfLegs(3)
            .build();
        await renderComponent({
            id: saygData.id,
            liveOptions: emptyLiveOptions(),
        }, saygData);

        await doClick(context.container.querySelector('input[name="showThrows"]'));
        await doClick(findButton(context.container, 'Click to show running average'));

        assertLegRow(
            0,
            [
                'Leg: 1DetailsClick to show No. of darts',
                'Average: 123 (3 darts)Remaining: 378ThrewScoreAvg123378123',
                '123', '378', '123',
                'Average: 125 (6 darts)Remaining: 251ThrewScoreAvg100401100150251125',
                '100', '401', '100',
                '150', '251', '125']);
    });

    it('allows throw to be edited when change handler is passed in', async () => {
        const leg = legBuilder()
            .currentThrow('home')
            .startingScore(501)
            .home((c: ILegCompetitorScoreBuilder) => c.withThrow(123, false, 3).score(123).noOfDarts(3))
            .away((c: ILegCompetitorScoreBuilder) => c.withThrow(100, false, 3).withThrow(150, false, 3).score(250).noOfDarts(6))
            .build();
        const saygData = saygBuilder()
            .withLeg(0, leg)
            .scores(3, 2)
            .yourName('HOME')
            .opponentName('AWAY')
            .numberOfLegs(3)
            .build();
        const account: IUserDto = {
            emailAddress: '',
            givenName: '',
            name: '',
            access: {
                recordScoresAsYouGo: true
            },
        };
        await renderComponent({
            id: saygData.id,
            liveOptions: emptyLiveOptions(),
        }, saygData, appProps({
            account,
        }));
        await doClick(context.container.querySelector('input[name="showThrows"]'));
        const legRow = context.container.querySelector('table tbody tr:nth-child(2)');

        await doClick(legRow, 'table tbody tr:nth-child(2)');
        expect(context.container.querySelector('.modal-dialog')).toBeTruthy();
        expect(context.container.querySelector('.modal-dialog').textContent).toContain('Edit throw');
        await doClick(findButton(legRow, 'Save changes'));

        expect(reportedError.hasError()).toEqual(false);
        expect(updatedSayg).not.toBeNull();
    });

    it('prevents edit of throw when no change handler is passed in', async () => {
        const leg = legBuilder()
            .currentThrow('home')
            .startingScore(501)
            .home((c: ILegCompetitorScoreBuilder) => c.withThrow(123, false, 3).score(123).noOfDarts(3))
            .away((c: ILegCompetitorScoreBuilder) => c.withThrow(100, false, 3).withThrow(150, false, 3).score(250).noOfDarts(6))
            .build();
        const saygData = saygBuilder()
            .withLeg(0, leg)
            .scores(3, 2)
            .yourName('HOME')
            .opponentName('AWAY')
            .numberOfLegs(3)
            .build();
        await renderComponent({
            id: saygData.id,
            liveOptions: emptyLiveOptions(),
        }, saygData);
        await doClick(context.container.querySelector('input[name="showThrows"]'));
        const legRow = context.container.querySelector('table tbody tr:nth-child(2)');

        await doClick(legRow, 'table tbody tr:nth-child(2)');

        expect(context.container.querySelector('.modal-dialog')).toBeFalsy();
    });

    it('does not render refresh options when not allowed', async () => {
        const leg = legBuilder()
            .currentThrow('home')
            .startingScore(501)
            .home((c: ILegCompetitorScoreBuilder) => c.withThrow(123, false, 3).score(123).noOfDarts(3))
            .away((c: ILegCompetitorScoreBuilder) => c)
            .winner('home')
            .build();
        const saygData = saygBuilder()
            .withLeg(0, leg)
            .scores(1)
            .yourName('HOME')
            .numberOfLegs(3)
            .build();

        await renderComponent({
            id: saygData.id,
            matchStatisticsOnly: true,
            liveOptions: emptyLiveOptions(),
        }, saygData);

        expect(context.container.querySelector('h4 .dropdown-menu')).toBeFalsy();
        expect(context.container.querySelector('h4').textContent).not.toContain('⏸️');
    });

    it('does not render refresh options when home has won', async () => {
        const leg = legBuilder()
            .currentThrow('home')
            .startingScore(501)
            .home((c: ILegCompetitorScoreBuilder) => c.withThrow(123, false, 3).score(123).noOfDarts(3))
            .away((c: ILegCompetitorScoreBuilder) => c.noOfDarts(1))
            .winner('home')
            .build();
        const liveOptions: ILiveOptions = {
            canSubscribe: true,
            subscribeAtStartup: [createTemporaryId()],
        };
        const saygData = saygBuilder()
            .withLeg(0, leg)
            .scores(2)
            .yourName('HOME')
            .numberOfLegs(3)
            .build();
        console.log = noop;

        await renderComponent({
            id: saygData.id,
            matchStatisticsOnly: true,
            liveOptions,
            lastLegDisplayOptions: { showThrows: true },
        }, saygData);

        expect(context.container.querySelector('h4 .dropdown-menu')).toBeFalsy();
        expect(context.container.querySelector('h4').textContent).not.toContain('⏸️');
    });

    it('does not render refresh options when away has won', async () => {
        const leg = legBuilder()
            .currentThrow('home')
            .startingScore(501)
            .home((c: ILegCompetitorScoreBuilder) => c.withThrow(123, false, 3).score(123).noOfDarts(3))
            .away((c: ILegCompetitorScoreBuilder) => c.noOfDarts(1))
            .winner('home')
            .build();
        const liveOptions: ILiveOptions = {
            canSubscribe: true,
            subscribeAtStartup: [createTemporaryId()],
        };
        console.log = noop;
        const saygData = saygBuilder()
            .withLeg(0, leg)
            .scores(0)
            .yourName('HOME')
            .numberOfLegs(3)
            .build();

        await renderComponent({
            id: saygData.id,
            matchStatisticsOnly: true,
            liveOptions,
            lastLegDisplayOptions: { showThrows: true },
        }, saygData);

        expect(context.container.querySelector('h4 .dropdown-menu')).toBeFalsy();
        expect(context.container.querySelector('h4').textContent).not.toContain('⏸️');
    });

    it('enables live updates by default', async () => {
        const leg: ILegDto = legBuilder()
            .currentThrow('home')
            .startingScore(501)
            .home((c: ILegCompetitorScoreBuilder) => c)
            .away((c: ILegCompetitorScoreBuilder) => c)
            .build();
        const id = createTemporaryId();
        const liveOptions: ILiveOptions = {
            canSubscribe: true,
            subscribeAtStartup: [id],
        };
        const account: IUserDto = {
            name: '',
            emailAddress: '',
            givenName: '',
            access: { useWebSockets: true },
        };
        console.log = noop;
        const saygData: IRecordedScoreAsYouGoDto = saygBuilder()
            .withLeg(0, leg)
            .scores(0, 0)
            .yourName('HOME')
            .numberOfLegs(3)
            .build();

        await renderComponent({
            id: saygData.id,
            matchStatisticsOnly: true,
            liveOptions,
            lastLegDisplayOptions: { showThrows: true },
        }, saygData, appProps({ account }));

        expect(socketFactory.socketWasCreated()).toEqual(true);
        expect(Object.keys(socketFactory.subscriptions)).toEqual([ id ]);
    });

    it('does not enable live updates by default', async () => {
        const leg: ILegDto = legBuilder()
            .currentThrow('home')
            .startingScore(501)
            .home((c: ILegCompetitorScoreBuilder) => c)
            .away((c: ILegCompetitorScoreBuilder) => c)
            .build();
        const liveOptions: ILiveOptions = {
            canSubscribe: true,
            subscribeAtStartup: [],
        };
        const account: IUserDto = {
            name: '',
            emailAddress: '',
            givenName: '',
            access: {
                useWebSockets: true,
            },
        }
        const saygData: IRecordedScoreAsYouGoDto = saygBuilder()
            .withLeg(0, leg)
            .scores(0, 0)
            .yourName('HOME')
            .numberOfLegs(3)
            .build();

        await renderComponent({
            id: saygData.id,
            matchStatisticsOnly: true,
            liveOptions,
            lastLegDisplayOptions: { showThrows: true },
        }, saygData, appProps({
            account,
        }));

        const selectedOption = context.container.querySelector('h4 .dropdown-menu .active');
        expect(selectedOption).toBeTruthy();
        expect(selectedOption.textContent).toEqual('⏸️ Paused');
        expect(socketFactory.socketWasCreated()).toEqual(false);
    });

    it('shows throws on last leg when not finished', async () => {
        const leg: ILegDto = legBuilder()
            .currentThrow('home')
            .startingScore(501)
            .home((c: ILegCompetitorScoreBuilder) => c.withThrow(100, false, 3).score(100).noOfDarts(3))
            .away((c: ILegCompetitorScoreBuilder) => c.withThrow(75, false, 2).score(75).noOfDarts(2))
            .build();
        const id = createTemporaryId();
        const liveOptions: ILiveOptions = {
            canSubscribe: true,
            subscribeAtStartup: [id],
        };
        const account: IUserDto = {
            givenName: '',
            name: '',
            emailAddress: '',
            access: { useWebSockets: true },
        };
        console.log = noop;
        const saygData: IRecordedScoreAsYouGoDto = saygBuilder(id)
            .withLeg(0, leg)
            .scores(0, 0)
            .yourName('HOME')
            .opponentName('AWAY')
            .numberOfLegs(3)
            .build();

        await renderComponent({
            id: saygData.id,
            matchStatisticsOnly: true,
            liveOptions,
            lastLegDisplayOptions: { showThrows: true, showAverage: true },
        }, saygData, appProps({ account }));

        assertLegRow(
            0,
            [
                'Leg: 1running average',
                'Average: 100 (3 darts)Remaining: 401ThrewScoreAvg100401100',
                '100',
                '401',
                '100',
                'Average: 112.5 (2 darts)Remaining: 426ThrewScoreAvg75426112.5',
                '75',
                '426',
                '112.5',
            ]);
    });

    it('closes socket when live updates are canceled', async () => {
        const leg: ILegDto = legBuilder()
            .currentThrow('home')
            .startingScore(501)
            .home((c: ILegCompetitorScoreBuilder) => c.withThrow(100, false, 3).score(100).noOfDarts(3))
            .away((c: ILegCompetitorScoreBuilder) => c.withThrow(75, false, 2).score(75).noOfDarts(2))
            .build();
        const saygId = createTemporaryId();
        const liveOptions: ILiveOptions = {
            canSubscribe: true,
            subscribeAtStartup: [saygId],
        };
        const account: IUserDto = {
            name: '',
            givenName: '',
            emailAddress: '',
            access: {
                useWebSockets: true
            },
        };
        const saygData: IRecordedScoreAsYouGoDto = saygBuilder()
            .withLeg(0, leg)
            .scores(1)
            .yourName('HOME')
            .numberOfLegs(3)
            .build();
        console.log = noop;
        await renderComponent({
            id: saygData.id,
            matchStatisticsOnly: true,
            liveOptions,
            lastLegDisplayOptions: { showThrows: true },
        }, saygData, appProps({
            account,
        }));
        expect(Object.keys(socketFactory.subscriptions)).toEqual([saygId]);
        expect(reportedError.hasError()).toEqual(false);

        await doSelectOption(context.container.querySelector('h4 .dropdown-menu'), '⏸️ Paused');

        expect(reportedError.hasError()).toEqual(false);
        expect(socketFactory.subscriptions).toBeTruthy();
    });

    it('shows widescreen statistics', async () => {
        const leg: ILegDto = legBuilder()
            .currentThrow('home')
            .startingScore(501)
            .home((c: ILegCompetitorScoreBuilder) => c.withThrow(100, false, 3).score(100).noOfDarts(3))
            .away((c: ILegCompetitorScoreBuilder) => c.withThrow(75, false, 2).score(75).noOfDarts(2))
            .build();
        const saygId = createTemporaryId();
        const liveOptions: ILiveOptions = {
            canSubscribe: true,
            subscribeAtStartup: [saygId],
        };
        const saygData: IRecordedScoreAsYouGoDto = saygBuilder(saygId)
            .withLeg(0, leg)
            .scores(1)
            .yourName('HOME')
            .numberOfLegs(3)
            .build();
        const account: IUserDto = {
            emailAddress: '',
            name: '',
            givenName: '',
            access: {
                useWebSockets: true,
            },
        };
        console.log = noop;
        await renderComponent({
            id: saygData.id,
            matchStatisticsOnly: true,
            liveOptions,
            lastLegDisplayOptions: { showThrows: true },
        }, saygData, appProps({
            account,
        }));
        expect(Object.keys(socketFactory.subscriptions)).toEqual([saygId]);
        expect(reportedError.hasError()).toEqual(false);

        await doClick(findButton(context.container.querySelector('h4'), '🖥'));

        expect(reportedError.hasError()).toEqual(false);
        expect(context.container.innerHTML).toContain('WidescreenMatchStatistics');
    });

    it('collapses all legs when final leg played', async () => {
        const leg: ILegDto = legBuilder()
            .currentThrow('home')
            .startingScore(501)
            .home((c: ILegCompetitorScoreBuilder) => c.withThrow(100, false, 3).score(100).noOfDarts(3))
            .away((c: ILegCompetitorScoreBuilder) => c.withThrow(75, false, 2).score(75).noOfDarts(2))
            .build();
        const finishedLeg = legBuilder()
            .currentThrow('home')
            .startingScore(501)
            .home((c: ILegCompetitorScoreBuilder) => c.withThrow(501, false, 3).score(501).noOfDarts(3))
            .away((c: ILegCompetitorScoreBuilder) => c.withThrow(75, false, 2).score(75).noOfDarts(2))
            .build();
        const id = createTemporaryId();
        const liveOptions: ILiveOptions = {
            canSubscribe: true,
            subscribeAtStartup: [id],
        };
        const account: IUserDto = {
            givenName: '',
            name: '',
            emailAddress: '',
            access: { useWebSockets: true },
        };
        const saygData: IRecordedScoreAsYouGoDto = saygBuilder(id)
            .withLeg(0, leg)
            .scores(0, 0)
            .yourName('HOME')
            .opponentName('AWAY')
            .numberOfLegs(3)
            .build();
        console.log = noop;
        await renderComponent({
            id: saygData.id,
            liveOptions,
            lastLegDisplayOptions: { showThrows: true, initial: true } as ILegDisplayOptions,
        }, saygData, appProps({ account }));

        const newSaygData = saygBuilder(id)
            .withLeg(0, finishedLeg)
            .withLeg(1, finishedLeg)
            .withLeg(2, finishedLeg)
            .scores(2, 0)
            .yourName('HOME')
            .opponentName('AWAY')
            .numberOfLegs(3)
            .build();
        expect(socketFactory.socketWasCreated()).toEqual(true);
        await act(async () => {
            socketFactory.socket.onmessage({
                type: 'message',
                data: JSON.stringify({
                    type: 'Update',
                    data: newSaygData,
                    id: newSaygData.id,
                })
            } as MessageEvent<string>);
        });

        expect(reportedError.hasError()).toEqual(false);
        const firstRow = context.container.querySelector('table tbody tr:first-child');
        const finishedHeadings = Array.from(firstRow.querySelectorAll('td'));
        expect(finishedHeadings.map(th => th.textContent)).toEqual(['Score', '2', '0']);
    });
});