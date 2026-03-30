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
import { IMatchReportProps, MatchReport } from './MatchReport';
import { ISuperleagueSaygMatchMapping } from './ISuperleagueSaygMatchMapping';
import {
    ILegBuilder,
    ILegCompetitorScoreBuilder,
    saygBuilder,
} from '../../../helpers/builders/sayg';
import { divisionBuilder } from '../../../helpers/builders/divisions';
import { tournamentMatchBuilder } from '../../../helpers/builders/tournaments';
import { BuilderParam } from '../../../helpers/builders/builders';

describe('MatchReport', () => {
    let context: TestContext;
    let reportedError: ErrorState;

    afterEach(async () => {
        await cleanUp(context);
    });

    beforeEach(() => {
        reportedError = new ErrorState();
    });

    async function renderComponent(props: IMatchReportProps) {
        context = await renderApp(
            iocProps(),
            brandingProps(),
            appProps({}, reportedError),
            <MatchReport {...props} />,
        );
    }

    function getRowContent(row: IComponent, tagName: string): string[] {
        return row.all(tagName).map((th) => th.text());
    }

    function createLeg(
        homeWinner: boolean,
        awayWinner: boolean,
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
        it('correct headings', async () => {
            await renderComponent({
                division: divisionBuilder('DIVISION').build(),
                noOfThrows: 3,
                noOfLegs: 3,
                gender: 'GENDER',
                host: 'HOST',
                opponent: 'OPPONENT',
                saygMatches: [],
            });

            reportedError.verifyNoError();
            expect(context.required('h2').text()).toEqual(
                'SOMERSET DARTS ORGANISATION',
            );
            expect(context.required('h3').text()).toEqual('DIVISION (GENDER)');
        });

        it('correct heading rows', async () => {
            await renderComponent({
                division: divisionBuilder('DIVISION').build(),
                noOfThrows: 3,
                noOfLegs: 3,
                gender: 'GENDER',
                host: 'HOST',
                opponent: 'OPPONENT',
                saygMatches: [],
            });

            reportedError.verifyNoError();
            const rows = context.all('thead tr');
            expect(rows.length).toEqual(3);
            expect(getRowContent(rows[0], 'th')).toEqual(['HOSTvOPPONENT']);
            expect(
                rows[0].required('th').element<HTMLTableCellElement>().colSpan,
            ).toEqual(23);
            expect(getRowContent(rows[1], 'th')).toEqual([
                '',
                'Scores',
                '',
                '',
                'Scores',
                '',
            ]);
            expect(
                rows[1].all('th')[1].element<HTMLTableCellElement>().colSpan,
            ).toEqual(4);
            expect(
                rows[1].all('th')[4].element<HTMLTableCellElement>().colSpan,
            ).toEqual(4);
            expect(getRowContent(rows[2], 'th')).toEqual([
                'Set',
                'Ave',
                'Players Name',
                'Leg',
                '1',
                '2',
                '3',
                '4',
                'AD',
                'GS',
                'SL',
                'Tons',
                'Ave',
                'Players Name',
                '1',
                '2',
                '3',
                '4',
                'AD',
                'GS',
                'SL',
                'Tons',
            ]);
        });

        it('sayg matches', async () => {
            const saygMatch: ISuperleagueSaygMatchMapping = {
                match: tournamentMatchBuilder().sideA('A').sideB('B').build(),
                saygData: saygBuilder()
                    .withLeg(0, createLeg(true, false))
                    .withLeg(1, createLeg(true, false))
                    .build(),
            };

            await renderComponent({
                division: divisionBuilder('DIVISION').build(),
                noOfThrows: 3,
                noOfLegs: 3,
                gender: 'GENDER',
                host: 'HOST',
                opponent: 'OPPONENT',
                saygMatches: [saygMatch],
            });

            reportedError.verifyNoError();
            const rows = context.all('tbody tr');
            expect(rows.length).toEqual(3);
            expect(getRowContent(rows[0], 'td')).toEqual([
                'M1',
                '33.4',
                'A',
                '1',
                '90',
                '100',
                '110',
                '120',
                '15',
                '81',
                '',
                '3',
                '30',
                'B',
                '90',
                '90',
                '90',
                '90',
                '15',
                '',
                '51',
                '0',
            ]);
        });

        it('legs won', async () => {
            const saygMatch: ISuperleagueSaygMatchMapping = {
                match: tournamentMatchBuilder().sideA('A').sideB('B').build(),
                saygData: saygBuilder()
                    .withLeg(0, createLeg(true, false))
                    .withLeg(1, createLeg(true, false))
                    .build(),
            };

            await renderComponent({
                division: divisionBuilder('DIVISION').build(),
                noOfThrows: 3,
                noOfLegs: 3,
                gender: 'GENDER',
                host: 'HOST',
                opponent: 'OPPONENT',
                saygMatches: [saygMatch],
            });

            reportedError.verifyNoError();
            const legsWonContainer = context.required('table.table + div');
            expect(legsWonContainer).toBeTruthy();
            const legsWon = legsWonContainer.all('div');
            expect(legsWon[0].text()).toEqual('Legs won: 2');
            expect(legsWon[1].text()).toEqual('Legs won: 0');
        });

        it('when no division', async () => {
            await renderComponent({
                division: null!,
                noOfThrows: 3,
                noOfLegs: 3,
                gender: 'GENDER',
                host: 'HOST',
                opponent: 'OPPONENT',
                saygMatches: [],
            });

            reportedError.verifyNoError();
            expect(context.required('h2').text()).toEqual(
                'SOMERSET DARTS ORGANISATION',
            );
            expect(context.required('h3')!.text()).toEqual('(GENDER)');
        });
    });
});
