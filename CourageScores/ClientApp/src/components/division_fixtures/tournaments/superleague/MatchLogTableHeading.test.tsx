import {
    appProps,
    brandingProps,
    cleanUp,
    ErrorState,
    iocProps,
    renderApp,
    TestContext
} from "../../../../helpers/tests";
import {IMatchLogTableHeadingProps, MatchLogTableHeading} from "./MatchLogTableHeading";

describe('MatchLogTableHeading', () => {
    let context: TestContext;
    let reportedError: ErrorState;

    afterEach(() => {
        cleanUp(context);
    });

    beforeEach(() => {
        reportedError = new ErrorState();
    });

    async function renderComponent(props: IMatchLogTableHeadingProps) {
        context = await renderApp(
            iocProps(),
            brandingProps(),
            appProps({}, reportedError),
            (<MatchLogTableHeading {...props} />),
            null,
            null,
            'tbody');
    }

    function getRowContent(row: HTMLTableRowElement): string[] {
        return Array.from(row.querySelectorAll('th')).map(th => th.textContent);
    }

    describe('renders', () => {
        it('rows', async () => {
            await renderComponent({
                team: 'TEAM',
                noOfThrows: 3,
            });

            reportedError.verifyNoError();
            const rows = Array.from(context.container.querySelectorAll('tr')) as HTMLTableRowElement[];
            expect(rows.length).toEqual(2);
            expect(getRowContent(rows[0])).toEqual(['TEAM', 'Dart average', '', '']);
            expect(getRowContent(rows[1])).toEqual(['Player', 'L', 'AD', 'GS', 'SL', '100+', '140+', '180', 'T', 'Player', 'Team', 'GD', '1', '2', '3', '4']);
        });

        it('correct dart average offset', async () => {
            await renderComponent({
                team: 'TEAM',
                noOfThrows: 3,
            });

            reportedError.verifyNoError();
            const rows = Array.from(context.container.querySelectorAll('tr')) as HTMLTableRowElement[];
            expect(rows.length).toEqual(2);
            const cells = Array.from(rows[0].querySelectorAll('th'));
            expect(cells.length).toEqual(4);
            expect(cells[0].colSpan).toEqual(9);
            expect(cells[1].colSpan).toEqual(2);
            expect(cells[2].colSpan).toEqual(1);
            expect(cells[3].colSpan).toEqual(4);
        });
    });
});