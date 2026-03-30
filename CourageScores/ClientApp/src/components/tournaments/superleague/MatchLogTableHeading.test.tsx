import {
    appProps,
    brandingProps,
    cleanUp,
    ErrorState,
    IComponent,
    iocProps,
    renderApp,
    TestContext,
} from '../../../helpers/tests';
import {
    IMatchLogTableHeadingProps,
    MatchLogTableHeading,
} from './MatchLogTableHeading';

describe('MatchLogTableHeading', () => {
    let context: TestContext;
    let reportedError: ErrorState;

    afterEach(async () => {
        await cleanUp(context);
    });

    beforeEach(() => {
        reportedError = new ErrorState();
    });

    async function renderComponent(props: IMatchLogTableHeadingProps) {
        context = await renderApp(
            iocProps(),
            brandingProps(),
            appProps({}, reportedError),
            <MatchLogTableHeading {...props} />,
            undefined,
            undefined,
            'tbody',
        );
    }

    function getRowContent(row: IComponent): string[] {
        return row.all('th').map((th) => th.text());
    }

    describe('renders', () => {
        it('rows', async () => {
            await renderComponent({
                team: 'TEAM',
                noOfThrows: 3,
            });

            reportedError.verifyNoError();
            const rows = context.all('tr');
            expect(rows.length).toEqual(2);
            expect(getRowContent(rows[0])).toEqual([
                'TEAM',
                'Dart average',
                '',
                '',
            ]);
            expect(getRowContent(rows[1])).toEqual([
                'Player',
                'L',
                'AD',
                'GS',
                'SL',
                '100+',
                '140+',
                '180',
                'T',
                'Player',
                'Team',
                'GD',
                '1',
                '2',
                '3',
                '4',
            ]);
        });

        it('correct dart average offset', async () => {
            await renderComponent({
                team: 'TEAM',
                noOfThrows: 3,
            });

            reportedError.verifyNoError();
            const rows = context.all('tr');
            expect(rows.length).toEqual(2);
            const cells = rows[0]
                .all('th')
                .map((c) => c.element<HTMLTableCellElement>());
            expect(cells.length).toEqual(4);
            expect(cells[0].colSpan).toEqual(9);
            expect(cells[1].colSpan).toEqual(2);
            expect(cells[2].colSpan).toEqual(1);
            expect(cells[3].colSpan).toEqual(4);
        });
    });
});
