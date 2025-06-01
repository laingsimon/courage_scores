import {
    api,
    appProps,
    brandingProps,
    cleanUp,
    doClick,
    ErrorState, findButton,
    iocProps,
    renderApp,
    TestContext
} from "../../helpers/tests";
import {UserDto} from "../../interfaces/models/dtos/Identity/UserDto";
import {IDivisionApi} from "../../interfaces/apis/IDivisionApi";
import {ISaygApi} from "../../interfaces/apis/ISaygApi";
import {SeasonDto} from "../../interfaces/models/dtos/Season/SeasonDto";
import {seasonBuilder} from "../../helpers/builders/seasons";
import {DivisionDataFilter} from "../../interfaces/models/dtos/Division/DivisionDataFilter";
import {DivisionDataDto} from "../../interfaces/models/dtos/Division/DivisionDataDto";
import {divisionDataBuilder} from "../../helpers/builders/divisions";
import {renderDate} from "../../helpers/rendering";
import {AnalyseScores} from "./AnalyseScores";
import {AnalysisRequestDto} from "../../interfaces/models/dtos/Analysis/AnalysisRequestDto";
import {IClientActionResultDto} from "../common/IClientActionResultDto";
import {AnalysisResponseDto} from "../../interfaces/models/dtos/Analysis/AnalysisResponseDto";

const mockedUsedNavigate = jest.fn();

jest.mock('react-router', () => ({
    ...jest.requireActual('react-router'),
    useNavigate: () => mockedUsedNavigate,
}));

describe('AnalyseScores', () => {
    let context: TestContext;
    let reportedError: ErrorState;
    let season: SeasonDto;
    let divisionApiResponse: DivisionDataDto | null;
    let analysisRequest: AnalysisRequestDto | null;
    let analysisResponse: IClientActionResultDto<AnalysisResponseDto> | null;
    const divisionApi = api<IDivisionApi>({
        async data(_: DivisionDataFilter): Promise<DivisionDataDto> {
            return divisionApiResponse!;
        }
    });
    const saygApi = api<ISaygApi>({
        async analyse(request: AnalysisRequestDto): Promise<IClientActionResultDto<AnalysisResponseDto>> {
            analysisRequest = request;
            return analysisResponse || {
                success: true
            };
        }
    });

    afterEach(async () => {
        await cleanUp(context);
    });

    beforeEach(() => {
        reportedError = new ErrorState();
        season = seasonBuilder('SEASON').build();
        divisionApiResponse = null;
        analysisResponse = null;
        analysisRequest = null;
    });

    async function renderComponent(query?: string, seasonName?: string) {
        const account: UserDto = {
            access: {
                analyseMatches: true
            },
            name: '',
            givenName: '',
            emailAddress: '',
        };
        context = await renderApp(
            iocProps({divisionApi, saygApi}),
            brandingProps(),
            appProps({account, seasons: [season]}, reportedError),
            (<AnalyseScores />),
            '/analyse/:season',
            '/analyse/' + (seasonName ?? season.name) + (query || ''));
        reportedError.verifyNoError();
    }

    describe('renders', () => {
        beforeEach(() => {
            divisionApiResponse = divisionDataBuilder()
                .withFixtureDate((fd) => fd
                    .withTournament(t => t.singleRound().date('2001-02-03').type('BOARD 1').opponent('OPPONENT'))
                    .withTournament(t => t.date('2001-02-03').type('Singles')), '2001-02-03')
                .build();
        });

        it('renders tournaments on load', async () => {
            await renderComponent();

            const tournamentList = context.container.querySelector('div.list-group')!;
            const tournaments = Array.from(tournamentList.querySelectorAll('.list-group-item'));
            expect(tournaments.map(t => t.textContent)).toEqual([
                `Superleague: ${renderDate('2001-02-03')} BOARD 1 vs OPPONENT`,
                `Tournament: ${renderDate('2001-02-03')} Singles vs `,
            ]);
        });

        it('pre-selects tournaments from the query string', async () => {
            const firstTournament = divisionApiResponse!.fixtures![0]!.tournamentFixtures![0]!;
            await renderComponent(`?t=${firstTournament.id}`);

            const tournamentList = context.container.querySelector('div.list-group')!;
            const tournaments = Array.from(tournamentList.querySelectorAll('.active'));
            expect(tournaments.map(t => t.textContent)).toEqual([
                `Superleague: ${renderDate('2001-02-03')} BOARD 1 vs OPPONENT`,
            ]);
        });

        it('reports an error if season cannot be found by name or id', async () => {
            await renderComponent('', 'anotherSeason');

            const error = context.container.querySelector('.alert')!;
            expect(error.textContent).toEqual('Could not find season with name: anotherSeason');
        });

        it('shows data errors from division api response', async () => {
            divisionApiResponse!.dataErrors = [
                { message: 'An error' },
                { message: 'Another error' },
            ];

            await renderComponent();

            const error = context.container.querySelector('.alert')!;
            expect(error.textContent).toEqual('An error, Another error');
        });

        it('shows option to remove team filter', async () => {
            await renderComponent(`?team=ATeamName`);

            const filterRemovalButtons = Array.from(context.container.querySelectorAll('.btn-outline-danger'));
            expect(filterRemovalButtons.map(t => t.textContent)).toEqual([
                `❌ ATeamName`,
            ]);
        });

        it('shows option to remove analysis filter', async () => {
            await renderComponent(`?a=AnAnalysis`);

            const filterRemovalButtons = Array.from(context.container.querySelectorAll('.btn-outline-danger'));
            expect(filterRemovalButtons.map(t => t.textContent)).toEqual([
                `❌ AnAnalysis`,
            ]);
        });

        it.each([
            ['MostFrequentThrows', 'Common scores'],
            ['HighestScores', 'Best scores']
        ])('score breakdowns: %s', async (type: string, heading: string) => {
            const firstTournament = divisionApiResponse!.fixtures![0]!.tournamentFixtures![0]!;
            await renderComponent(`?t=${firstTournament.id}&team=Team1&a=${type}`);
            const analysis: AnalysisResponseDto = {
                [type]: {
                    Team1: [
                        { score: 10, number: 10 },
                        { score: 100, number: 9 },
                        { score: 180, number: 8 },
                    ],
                },
            };
            analysisResponse = {
                success: true,
                result: analysis,
            };
            await doClick(findButton(context.container,'Analyse 1 tournament/s'));

            const detail = context.container.querySelector(`[datatype="${type}"]`)!;
            const table = detail.querySelector('table')!;
            const analysisHeading = context.container.querySelector('[datatype="analysis-heading"]')!;
            const headings = Array.from(table.querySelectorAll('thead tr th')).map(th => th.textContent);
            expect(headings).toEqual(['Score', 'Times']);
            const rows = Array.from(table.querySelectorAll('tbody tr'));
            expect(analysisHeading.textContent).toContain(heading);
            expect(Array.from(rows[0].querySelectorAll('td')).map(td => td.textContent)).toEqual(['10', '10']);
            expect(Array.from(rows[0].querySelectorAll('td')).map(td => td.className)).toEqual(['', '']);
            expect(Array.from(rows[1].querySelectorAll('td')).map(td => td.textContent)).toEqual(['100', '9']);
            expect(Array.from(rows[1].querySelectorAll('td')).map(td => td.className)).toEqual(['text-danger', '']);
            expect(Array.from(rows[2].querySelectorAll('td')).map(td => td.textContent)).toEqual(['180', '8']);
            expect(Array.from(rows[2].querySelectorAll('td')).map(td => td.className)).toEqual(['text-danger fw-bold', '']);
        });

        it('empty score breakdowns', async () => {
            const firstTournament = divisionApiResponse!.fixtures![0]!.tournamentFixtures![0]!;
            await renderComponent(`?t=${firstTournament.id}&team=Team1&a=MostFrequentThrows`);
            const analysis: AnalysisResponseDto = {
                MostFrequentThrows: {
                    Team1: [],
                },
            };
            analysisResponse = {
                success: true,
                result: analysis,
            };
            await doClick(findButton(context.container,'Analyse 1 tournament/s'));

            const detail = context.container.querySelector('[datatype="MostFrequentThrows"]')!;
            expect(detail.textContent).toContain('No data');
        });

        it('named breakdowns', async () => {
            const firstTournament = divisionApiResponse!.fixtures![0]!.tournamentFixtures![0]!;
            await renderComponent(`?t=${firstTournament.id}&team=Team1&a=MostFrequentPlayers`);
            const analysis: AnalysisResponseDto = {
                MostFrequentPlayers: {
                    Team1: [
                        { name: 'Tom', value: 10 },
                        { name: 'Richard', value: 9 },
                        { name: 'Harry', value: 8 },
                    ],
                },
            };
            analysisResponse = {
                success: true,
                result: analysis,
            };
            await doClick(findButton(context.container,'Analyse 1 tournament/s'));

            const detail = context.container.querySelector('[datatype="MostFrequentPlayers"]')!;
            const table = detail.querySelector('table')!;
            const headings = Array.from(table.querySelectorAll('thead tr th')).map(th => th.textContent);
            expect(headings).toEqual(['Name', 'Times']);
            const rows = Array.from(table.querySelectorAll('tbody tr'));
            expect(Array.from(rows[0].querySelectorAll('td')).map(td => td.textContent)).toEqual(['Tom', '10']);
            expect(Array.from(rows[1].querySelectorAll('td')).map(td => td.textContent)).toEqual(['Richard', '9']);
            expect(Array.from(rows[2].querySelectorAll('td')).map(td => td.textContent)).toEqual(['Harry', '8']);
        });

        it('empty named breakdowns', async () => {
            const firstTournament = divisionApiResponse!.fixtures![0]!.tournamentFixtures![0]!;
            await renderComponent(`?t=${firstTournament.id}&team=Team1&a=MostFrequentPlayers`);
            const analysis: AnalysisResponseDto = {
                MostFrequentPlayers: {
                    Team1: [],
                },
            };
            analysisResponse = {
                success: true,
                result: analysis,
            };
            await doClick(findButton(context.container,'Analyse 1 tournament/s'));

            const detail = context.container.querySelector('[datatype="MostFrequentPlayers"]')!;
            expect(detail.textContent).toContain('No data');
        });
    });

    describe('interactivity', () => {
        beforeEach(() => {
            divisionApiResponse = divisionDataBuilder()
                .withFixtureDate((fd) => fd
                    .withTournament(t => t.singleRound().date('2001-02-03').type('BOARD 1').opponent('OPPONENT'))
                    .withTournament(t => t.date('2001-02-03').type('Singles')), '2001-02-03')
                .build();
        });

        it('prompts for some tournament selections', async () => {
            await renderComponent();

            await doClick(findButton(context.container,'Analyse 0 tournament/s'));

            const error = context.container.querySelector('.alert')!;
            expect(error.textContent).toEqual('Select some tournaments first');
        });

        it('analyses selected tournaments', async () => {
            const firstTournament = divisionApiResponse!.fixtures![0]!.tournamentFixtures![0]!;
            await renderComponent(`?t=${firstTournament.id}`);

            await doClick(findButton(context.container,'Analyse 1 tournament/s'));

            expect(analysisRequest?.tournamentIds).toEqual([firstTournament.id]);
        });

        it('shows an error if analysis fails', async () => {
            const firstTournament = divisionApiResponse!.fixtures![0]!.tournamentFixtures![0]!;
            await renderComponent(`?t=${firstTournament.id}`);
            analysisResponse = {
                success: false,
                errors: [ 'An error' ],
                warnings: [ 'A warning' ],
            };

            await doClick(findButton(context.container,'Analyse 1 tournament/s'));

            const error = context.container.querySelector('.alert')!;
            expect(error.textContent).toEqual('An error, A warning');
        });

        it('can select a tournament', async () => {
            const firstTournament = divisionApiResponse!.fixtures![0]!.tournamentFixtures![0]!;
            await renderComponent();

            await doClick(context.container.querySelector('.list-group .list-group-item')!);

            expect(mockedUsedNavigate).toHaveBeenCalledWith(`/analyse/SEASON/?t=${firstTournament.id}`);
        });

        it('can deselect a tournament', async () => {
            const firstTournament = divisionApiResponse!.fixtures![0]!.tournamentFixtures![0]!;
            await renderComponent(`?t=${firstTournament.id}`);

            await doClick(context.container.querySelector('.list-group .list-group-item')!);

            expect(mockedUsedNavigate).toHaveBeenCalledWith(`/analyse/SEASON/`);
        });

        it('can filter by a team', async () => {
            const firstTournament = divisionApiResponse!.fixtures![0]!.tournamentFixtures![0]!;
            await renderComponent(`?t=${firstTournament.id}`);
            const analysis: AnalysisResponseDto = {
                MostFrequentThrows: {
                    Team1: [
                        { number: 10, score: 5 },
                    ],
                    Team2: [
                        { number: 10, score: 5 },
                    ],
                },
            };
            analysisResponse = {
                success: true,
                result: analysis,
            };
            await doClick(findButton(context.container,'Analyse 1 tournament/s'));
            const teamHeading = context.container.querySelector('[datatype="team-heading"]')!;

            await doClick(teamHeading)

            const teamName = teamHeading.textContent!.replace('🔎 ', '');
            expect(mockedUsedNavigate).toHaveBeenCalledWith(`/analyse/SEASON/?t=${firstTournament.id}&team=${teamName}`);
        });

        it('can remove team filter', async () => {
            const firstTournament = divisionApiResponse!.fixtures![0]!.tournamentFixtures![0]!;
            await renderComponent(`?t=${firstTournament.id}&team=Team1`);
            const analysis: AnalysisResponseDto = {
                MostFrequentThrows: {
                    Team1: [
                        { number: 10, score: 5 },
                    ],
                    Team2: [
                        { number: 10, score: 5 },
                    ],
                },
            };
            analysisResponse = {
                success: true,
                result: analysis,
            };
            await doClick(findButton(context.container,'Analyse 1 tournament/s'));
            const teamHeading = context.container.querySelector('[datatype="team-heading"]')!;

            await doClick(teamHeading)

            expect(mockedUsedNavigate).toHaveBeenCalledWith(`/analyse/SEASON/?t=${firstTournament.id}`);
        });

        it('can filter by analysis', async () => {
            const firstTournament = divisionApiResponse!.fixtures![0]!.tournamentFixtures![0]!;
            await renderComponent(`?t=${firstTournament.id}`);
            const analysis: AnalysisResponseDto = {
                MostFrequentThrows: {
                    Team1: [
                        { number: 10, score: 5 },
                    ],
                    Team2: [
                        { number: 10, score: 5 },
                    ],
                },
            };
            analysisResponse = {
                success: true,
                result: analysis,
            };
            await doClick(findButton(context.container,'Analyse 1 tournament/s'));
            expect(context.container.textContent).toContain('Common scores');
            const teamHeading = context.container.querySelector('[datatype="analysis-heading"]')!;

            await doClick(teamHeading)

            expect(mockedUsedNavigate).toHaveBeenCalledWith(`/analyse/SEASON/?t=${firstTournament.id}&a=MostFrequentThrows`);
        });

        it('can remove analysis filter', async () => {
            const firstTournament = divisionApiResponse!.fixtures![0]!.tournamentFixtures![0]!;
            await renderComponent(`?t=${firstTournament.id}&a=MostFrequentThrows`);
            const analysis: AnalysisResponseDto = {
                MostFrequentThrows: {
                    Team1: [
                        { number: 10, score: 5 },
                    ],
                    Team2: [
                        { number: 10, score: 5 },
                    ],
                },
            };
            analysisResponse = {
                success: true,
                result: analysis,
            };
            await doClick(findButton(context.container,'Analyse 1 tournament/s'));
            expect(context.container.textContent).toContain('Common scores');
            const teamHeading = context.container.querySelector('[datatype="analysis-heading"]')!;

            await doClick(teamHeading)

            expect(mockedUsedNavigate).toHaveBeenCalledWith(`/analyse/SEASON/?t=${firstTournament.id}`);
        });

        it('can select all tournaments', async () => {
            await renderComponent();

            await doClick(findButton(context.container, 'All 2'));

            const tournaments = divisionApiResponse!.fixtures![0]!.tournamentFixtures!;
            const query = tournaments.map(t => `t=${t.id}`).join('&');
            expect(mockedUsedNavigate).toHaveBeenCalledWith(`/analyse/SEASON/?${query}`);
        });

        it('can unselect all tournaments', async () => {
            const tournaments = divisionApiResponse!.fixtures![0]!.tournamentFixtures!;
            const query = tournaments.map(t => `t=${t.id}`).join('&');
            await renderComponent(`?${query}`);

            await doClick(findButton(context.container, 'None'));

            expect(mockedUsedNavigate).toHaveBeenCalledWith(`/analyse/SEASON/`);
        });
    });
});