import {
    api,
    appProps,
    brandingProps,
    cleanUp,
    doClick,
    doSelectOption,
    ErrorState,
    findButton,
    iocProps,
    noop,
    renderApp,
    TestContext,
    user,
} from '../../helpers/tests';
import { Division, IRequestedDivisionDataDto } from './Division';
import { any } from '../../helpers/collections';
import { renderDate } from '../../helpers/rendering';
import { DivisionDataDto } from '../../interfaces/models/dtos/Division/DivisionDataDto';
import { SeasonHealthCheckResultDto } from '../../interfaces/models/dtos/Health/SeasonHealthCheckResultDto';
import { GameDto } from '../../interfaces/models/dtos/Game/GameDto';
import { DivisionDto } from '../../interfaces/models/dtos/DivisionDto';
import { SeasonDto } from '../../interfaces/models/dtos/Season/SeasonDto';
import { TeamDto } from '../../interfaces/models/dtos/Team/TeamDto';
import { IApp } from '../common/IApp';
import { IClientActionResultDto } from '../common/IClientActionResultDto';
import { seasonBuilder } from '../../helpers/builders/seasons';
import {
    divisionBuilder,
    divisionDataBuilder,
} from '../../helpers/builders/divisions';
import { teamBuilder } from '../../helpers/builders/teams';
import { playerBuilder } from '../../helpers/builders/players';
import { IFailedRequest } from '../common/IFailedRequest';
import { IDivisionApi } from '../../interfaces/apis/IDivisionApi';
import { DivisionDataFilter } from '../../interfaces/models/dtos/Division/DivisionDataFilter';
import { IGameApi } from '../../interfaces/apis/IGameApi';
import { ISeasonApi } from '../../interfaces/apis/ISeasonApi';
import { IFeatureApi } from '../../interfaces/apis/IFeatureApi';
import { ConfiguredFeatureDto } from '../../interfaces/models/dtos/ConfiguredFeatureDto';
import {
    DivisionUriContainer,
    IDivisionUriContainerProps,
    UrlStyle,
} from './DivisionUriContainer';
import { DivisionPlayerDto } from '../../interfaces/models/dtos/Division/DivisionPlayerDto';

describe('Division', () => {
    const TEAM_TABLE_HEADINGS = [
        'Venue',
        'Played',
        'Points',
        'Won',
        'Lost',
        'Drawn',
        '+/-',
    ];
    const PLAYER_TABLE_HEADINGS = [
        'Rank',
        'Player',
        'Venue',
        'Played',
        'Won',
        'Lost',
        'Points',
        'Win %',
        '180s',
        'hi-check',
    ];

    let context: TestContext;
    let reportedError: ErrorState;
    let divisionDataMap: { [key: string]: IRequestedDivisionDataDto };
    let dataRequested: { divisionId: string; seasonId?: string }[];
    let features: ConfiguredFeatureDto[];

    const divisionApi = api<IDivisionApi>({
        data: async (filter: DivisionDataFilter): Promise<DivisionDataDto> => {
            const seasonId: string = filter.seasonId!;
            const divisionId: string = filter.divisionId!.join(',');
            const key: string = `${divisionId}${seasonId ? ':' + seasonId : ''}`;

            if (!any(Object.keys(divisionDataMap), (k: string) => k === key)) {
                throw new Error(`DivisionData request not expected for ${key}`);
            }

            dataRequested.push({ divisionId, seasonId });
            return divisionDataMap[key];
        },
    });
    const seasonApi = api<ISeasonApi>({
        getHealth: async (): Promise<SeasonHealthCheckResultDto> => {
            return {
                success: true,
                checks: {},
                messages: [],
                warnings: [],
                errors: [],
            };
        },
    });
    const gameApi = api<IGameApi>({
        update: async (): Promise<IClientActionResultDto<GameDto>> => {
            return { success: true };
        },
        delete: async (): Promise<IClientActionResultDto<GameDto>> => {
            return { success: true };
        },
    });
    const featureApi = api<IFeatureApi>({
        async getFeatures(): Promise<ConfiguredFeatureDto[]> {
            return features;
        },
    });

    afterEach(async () => {
        await cleanUp(context);
    });

    beforeEach(() => {
        dataRequested = [];
        divisionDataMap = {};
        reportedError = new ErrorState();
        features = [];
    });

    async function renderComponent(
        appContainerProps: IApp,
        route: string,
        address: string,
        containerProps?: IDivisionUriContainerProps,
    ) {
        containerProps = containerProps ?? defaultContainerProps();

        context = await renderApp(
            iocProps({ divisionApi, seasonApi, gameApi, featureApi }),
            brandingProps(),
            appProps(appContainerProps, reportedError),
            <DivisionUriContainer {...containerProps}>
                {containerProps.children}
            </DivisionUriContainer>,
            route,
            address,
        );
    }

    function getSeasonSelection() {
        return context.container.querySelector(
            '.btn-group .btn-group:nth-child(1)',
        ) as HTMLElement;
    }

    function getDivisionSelection() {
        return context.container.querySelector(
            '.btn-group .btn-group:nth-child(2)',
        )?.textContent;
    }

    function tableHeadings() {
        const table = context.container.querySelector(
            '.content-background table.table',
        )!;

        return Array.from(table.querySelectorAll('thead tr th')).map(
            (th) => th.textContent,
        );
    }

    function heading() {
        return context.container.querySelector('.content-background h3')
            ?.textContent;
    }

    function subHeading() {
        return context.container.querySelector('.content-background h5')
            ?.textContent;
    }

    function tabs() {
        return Array.from(context.container.querySelectorAll('a.nav-link')).map(
            (a) => a.textContent,
        );
    }

    function getContent() {
        return context.container.querySelector(
            '.content-background',
        ) as HTMLElement;
    }

    function defaultContainerProps(
        customisations?: Partial<IDivisionUriContainerProps>,
    ): IDivisionUriContainerProps {
        return {
            urlStyle: UrlStyle.Multiple,
            children: <Division />,
            ...customisations,
        };
    }

    describe('when out of season', () => {
        const divisionData = divisionDataBuilder().build();
        const divisionId = divisionData.id;

        beforeEach(() => {
            divisionDataMap[divisionData.id!] = divisionData;
        });

        function defaultAppProps(customisations?: Partial<IApp>) {
            return appProps(
                {
                    divisions: [],
                    seasons: [seasonBuilder('SEASON').build()],
                    ...customisations,
                },
                reportedError,
            );
        }

        it('renders prompt for season', async () => {
            await renderComponent(
                defaultAppProps({ controls: true }),
                '/division/:divisionId',
                `/division/${divisionId}`,
                defaultContainerProps({ urlStyle: UrlStyle.Single }),
            );

            const seasonSelection = getSeasonSelection();
            expect(seasonSelection.textContent).toContain('Select a season');
            expect(seasonSelection.className).toContain('show');
            expect(getDivisionSelection()).toContain('All divisions');
        });

        it('renders prompt for season when no controls', async () => {
            await renderComponent(
                defaultAppProps(),
                '/division/:divisionId',
                `/division/${divisionId}`,
                defaultContainerProps({ urlStyle: UrlStyle.Single }),
            );

            const seasonSelection = getSeasonSelection();
            expect(seasonSelection.textContent).toContain('Select a season');
            expect(seasonSelection.className).toContain('show');
            expect(getDivisionSelection()).toContain('All divisions');
        });
    });

    describe('when in season', () => {
        const division: DivisionDto = divisionBuilder('DIVISION').build();
        const season: SeasonDto = seasonBuilder('SEASON')
            .starting('2023-01-01')
            .ending('2023-06-01')
            .withDivision(division)
            .build();
        const team: TeamDto = teamBuilder('TEAM_NAME').build();
        const player: DivisionPlayerDto = playerBuilder('PLAYER_NAME')
            .team(team)
            .singles((a) => a.matchesPlayed(1))
            .build();
        const superleagueDivision = divisionBuilder('superleague')
            .superleague()
            .build();
        const superleagueDivisionData = divisionDataBuilder(division)
            .season((s) =>
                s
                    .starting('2023-01-01')
                    .ending('2023-06-01')
                    .withDivision(division),
            )
            .withPlayer(player)
            .withTeam(team)
            .superleague()
            .build();

        function defaultAppProps(customisations?: Partial<IApp>) {
            return appProps(
                {
                    divisions: [division],
                    seasons: [season],
                    ...customisations,
                },
                reportedError,
            );
        }

        beforeEach(() => {
            const divisionData = divisionDataBuilder(division)
                .season(
                    (s) =>
                        s
                            .starting('2023-01-01')
                            .ending('2023-06-01')
                            .withDivision(division),
                    season.id,
                )
                .withPlayer(player)
                .withTeam(team)
                .build();

            divisionDataMap[division.id] = divisionData;
            divisionDataMap[division.id + ':' + season.id] = divisionData;

            divisionDataMap[superleagueDivision.id] = superleagueDivisionData;
            divisionDataMap[superleagueDivision.id + ':' + season.id] =
                superleagueDivisionData;

            console.log = noop;
        });

        describe('teams', () => {
            async function renderTeams(
                address: string,
                route?: string,
                containerProps?: IDivisionUriContainerProps,
            ) {
                await renderComponent(
                    defaultAppProps(),
                    route ?? '/teams',
                    address,
                    containerProps,
                );
            }

            it('renders teams table via division id', async () => {
                await renderTeams(`/teams/?division=${division.id}`);

                expect(tableHeadings()).toEqual(TEAM_TABLE_HEADINGS);
            });

            it('renders teams table via division name', async () => {
                await renderTeams(`/teams/?division=${division.name}`);

                expect(tableHeadings()).toEqual(TEAM_TABLE_HEADINGS);
            });

            it('renders teams table via division and season name', async () => {
                await renderTeams(
                    `/teams/${season.name}/?division=${division.name}`,
                    '/teams/:seasonId',
                );

                expect(tableHeadings()).toEqual(TEAM_TABLE_HEADINGS);
            });

            it('renders teams table via season id', async () => {
                await renderTeams(
                    `/teams/${season.name}/?division=${division.name}`,
                    '/teams/:seasonId',
                );

                expect(tableHeadings()).toEqual(TEAM_TABLE_HEADINGS);
            });

            it('renders multi-division teams table via division and season name', async () => {
                await renderTeams(
                    `/teams/${season.name}?division=${division.name}`,
                    '/teams/:seasonId',
                    defaultContainerProps({ mode: 'teams' }),
                );

                expect(tableHeadings()).toEqual(TEAM_TABLE_HEADINGS);
            });

            it('renders multi-division teams table via division and season id', async () => {
                await renderTeams(
                    `/teams/${season.id}?division=${division.id}`,
                    '/teams/:seasonId',
                    defaultContainerProps({ mode: 'teams' }),
                );

                expect(tableHeadings()).toEqual(TEAM_TABLE_HEADINGS);
            });

            it('renders teams tab for superleague', async () => {
                await renderComponent(
                    defaultAppProps({ divisions: [superleagueDivision] }),
                    '/teams',
                    `/teams/?division=${superleagueDivision.id}`,
                );

                expect(tabs()).toContain('Teams');
            });
        });

        describe('team', () => {
            it('renders team details when provided with team id', async () => {
                await renderComponent(
                    defaultAppProps({ teams: [team] }),
                    '/division/:divisionId/:mode/:seasonId',
                    `/division/${division.id}/team:${team.id}/${season.id}`,
                    defaultContainerProps({ urlStyle: UrlStyle.Single }),
                );

                expect(heading()).toEqual('TEAM_NAME 🔗');
            });

            it('renders team details when provided with team name', async () => {
                await renderComponent(
                    defaultAppProps({ teams: [team] }),
                    '/division/:divisionId/:mode/:seasonId',
                    `/division/${division.name}/team:${team.name}/${season.name}`,
                    defaultContainerProps({ urlStyle: UrlStyle.Single }),
                );

                expect(heading()).toEqual('TEAM_NAME 🔗');
            });

            it('renders team not found when provided no team name', async () => {
                await renderComponent(
                    defaultAppProps({ teams: [team] }),
                    '/division/:divisionId/:mode/:seasonId',
                    `/division/${division.name}/team:/${season.name}`,
                    defaultContainerProps({ urlStyle: UrlStyle.Single }),
                );

                expect(getContent().textContent).toContain(
                    '⚠ Team could not be found',
                );
            });

            it('renders team not found when provided with missing team', async () => {
                await renderComponent(
                    defaultAppProps({ teams: [team] }),
                    '/division/:divisionId/:mode/:seasonId',
                    `/division/${division.name}/team:UNKNOWN_TEAM/${season.name}`,
                    defaultContainerProps({ urlStyle: UrlStyle.Single }),
                );

                expect(getContent().textContent).toContain(
                    '⚠ Team could not be found',
                );
            });
        });

        describe('fixtures', () => {
            it('renders fixtures list via division id', async () => {
                await renderComponent(
                    defaultAppProps(),
                    '/fixtures',
                    `/fixtures/?division=${division.id}`,
                    defaultContainerProps({ mode: 'fixtures' }),
                );

                expect(getContent().textContent).toContain('No fixtures, yet');
            });

            it('renders fixtures list via division name', async () => {
                await renderComponent(
                    defaultAppProps(),
                    '/fixtures',
                    `/fixtures/?division=${division.name}`,
                    defaultContainerProps({ mode: 'fixtures' }),
                );

                expect(getContent().textContent).toContain('No fixtures, yet');
            });

            it('renders fixtures list via division and season name', async () => {
                await renderComponent(
                    defaultAppProps(),
                    '/division/:divisionId/:mode/:seasonId',
                    `/division/${division.name}/fixtures/${season.name}`,
                    defaultContainerProps({ urlStyle: UrlStyle.Single }),
                );

                expect(getContent().textContent).toContain('No fixtures, yet');
            });

            it('renders fixtures list via division and season id', async () => {
                await renderComponent(
                    defaultAppProps(),
                    '/division/:divisionId/:mode/:seasonId',
                    `/division/${division.id}/fixtures/${season.id}`,
                    defaultContainerProps({ urlStyle: UrlStyle.Single }),
                );

                expect(getContent().textContent).toContain('No fixtures, yet');
            });

            it('renders multi-division fixtures list via division and season name', async () => {
                await renderComponent(
                    defaultAppProps(),
                    '/fixtures/:seasonId',
                    `/fixtures/${season.name}?division=${division.name}`,
                    defaultContainerProps({ mode: 'fixtures' }),
                );

                expect(getContent().textContent).toContain('No fixtures, yet');
            });

            it('renders multi-division fixtures list via division and season id', async () => {
                await renderComponent(
                    defaultAppProps(),
                    '/fixtures/:seasonId',
                    `/fixtures/${season.id}?division=${division.id}`,
                    defaultContainerProps({ mode: 'fixtures' }),
                );

                expect(getContent().textContent).toContain('No fixtures, yet');
            });

            it('renders fixtures with favourite teams feature enabled', async () => {
                const feature: ConfiguredFeatureDto = {
                    id: '0edb9fc6-6579-4c4c-9506-77c2485c09a0',
                    configuredValue: 'true',
                    name: 'EnableFavourites',
                    description: 'Favourite teams',
                };
                features = [feature];

                await renderComponent(
                    defaultAppProps(),
                    '/fixtures/:seasonId',
                    `/fixtures/${season.id}/?division=${division.id}`,
                    defaultContainerProps({ mode: 'fixtures' }),
                );

                expect(getContent().textContent).toContain('No fixtures, yet');
            });

            it('renders fixtures tab for superleague', async () => {
                await renderComponent(
                    defaultAppProps({ divisions: [superleagueDivision] }),
                    '/fixtures/:seasonId',
                    `/fixtures/${season.id}/?division=${superleagueDivision.id}`,
                );

                expect(tabs()).toContain('Fixtures');
            });
        });

        describe('players', () => {
            it('renders players table via division id', async () => {
                await renderComponent(
                    defaultAppProps(),
                    '/players',
                    `/players/?division=${division.id}`,
                    defaultContainerProps({ mode: 'players' }),
                );

                expect(tableHeadings()).toEqual(PLAYER_TABLE_HEADINGS);
            });

            it('renders players table via division name', async () => {
                await renderComponent(
                    defaultAppProps(),
                    '/players',
                    `/players/?division=${division.id}`,
                    defaultContainerProps({ mode: 'players' }),
                );

                expect(tableHeadings()).toEqual(PLAYER_TABLE_HEADINGS);
            });

            it('renders players table via division and season name', async () => {
                await renderComponent(
                    defaultAppProps(),
                    '/division/:divisionId/:mode/:seasonId',
                    `/division/${division.name}/players/${season.name}`,
                    defaultContainerProps({ urlStyle: UrlStyle.Single }),
                );

                expect(tableHeadings()).toEqual(PLAYER_TABLE_HEADINGS);
            });

            it('renders players table via season id', async () => {
                await renderComponent(
                    defaultAppProps(),
                    '/division/:divisionId/:mode/:seasonId',
                    `/division/${division.name}/players/${season.id}`,
                    defaultContainerProps({ urlStyle: UrlStyle.Single }),
                );

                expect(tableHeadings()).toEqual(PLAYER_TABLE_HEADINGS);
            });

            it('renders multi-division players table via division and season name', async () => {
                await renderComponent(
                    defaultAppProps(),
                    '/players/:seasonId',
                    `/players/${season.name}?division=${division.name}`,
                    defaultContainerProps({ mode: 'players' }),
                );

                expect(tableHeadings()).toEqual(PLAYER_TABLE_HEADINGS);
            });

            it('renders players table via season id', async () => {
                await renderComponent(
                    defaultAppProps(),
                    '/players/:seasonId',
                    `/players/${season.id}?division=${division.id}`,
                    defaultContainerProps({ mode: 'players' }),
                );

                expect(tableHeadings()).toEqual(PLAYER_TABLE_HEADINGS);
            });

            it('does not render players tab for superleague', async () => {
                await renderComponent(
                    defaultAppProps({
                        divisions: [superleagueDivision],
                    }),
                    '/players/:seasonId',
                    `/players/${season.id}/?division=${superleagueDivision.id}`,
                );

                expect(tabs()).not.toContain('Players');
            });
        });

        describe('player', () => {
            it('renders player details when provided with player id', async () => {
                await renderComponent(
                    defaultAppProps(),
                    '/division/:divisionId/:mode',
                    `/division/${division.id}/player:${player.id}`,
                    defaultContainerProps({ urlStyle: UrlStyle.Single }),
                );

                expect(heading()).toContain('PLAYER_NAME');
            });

            it('renders player details when provided with player and team name', async () => {
                await renderComponent(
                    defaultAppProps(),
                    '/division/:divisionId/:mode',
                    `/division/${division.name}/player:${player.name}@${team.name}`,
                    defaultContainerProps({ urlStyle: UrlStyle.Single }),
                );

                expect(heading()).toContain('PLAYER_NAME');
            });

            it('renders player not found when provided with missing team', async () => {
                await renderComponent(
                    defaultAppProps(),
                    '/division/:divisionId/:mode',
                    `/division/${division.name}/player:${player.name}@UNKNOWN_TEAM`,
                    defaultContainerProps({ urlStyle: UrlStyle.Single }),
                );

                expect(subHeading()).toContain(
                    '⚠ PLAYER_NAME could not be found',
                );
            });

            it('renders player not found when provided with missing player', async () => {
                await renderComponent(
                    defaultAppProps(),
                    '/division/:divisionId/:mode',
                    `/division/${division.name}/player:UNKNOWN_PLAYER@${team.name}`,
                    defaultContainerProps({ urlStyle: UrlStyle.Single }),
                );

                expect(subHeading()).toContain(
                    '⚠ UNKNOWN_PLAYER could not be found',
                );
            });

            it('renders player not found when provided no player name', async () => {
                await renderComponent(
                    defaultAppProps(),
                    '/division/:divisionId/:mode',
                    `/division/${division.name}/player:`,
                    defaultContainerProps({ urlStyle: UrlStyle.Single }),
                );

                expect(subHeading()).toContain('⚠ Player could not be found');
            });

            it('renders player not found when provided with malformed names', async () => {
                await renderComponent(
                    defaultAppProps(),
                    '/division/:divisionId/:mode',
                    `/division/${division.name}/player:foo`,
                    defaultContainerProps({ urlStyle: UrlStyle.Single }),
                );

                expect(subHeading()).toContain('⚠ Player could not be found');
            });
        });

        describe('reports', () => {
            it('does not render tab when logged out', async () => {
                await renderComponent(
                    defaultAppProps(),
                    '/division/:divisionId',
                    `/division/${division.id}`,
                    defaultContainerProps({ urlStyle: UrlStyle.Single }),
                );

                expect(tabs()).not.toContain('Reports');
            });

            it('does not render tab when not permitted', async () => {
                await renderComponent(
                    defaultAppProps({ account: user({}) }),
                    '/division/:divisionId',
                    `/division/${division.id}`,
                    defaultContainerProps({ urlStyle: UrlStyle.Single }),
                );

                expect(tabs()).not.toContain('Reports');
            });

            it('renders tab when permitted', async () => {
                await renderComponent(
                    defaultAppProps({
                        account: user({ runReports: true }),
                        controls: true,
                    }),
                    '/division/:divisionId/:mode',
                    `/division/${division.id}/reports`,
                    defaultContainerProps({ urlStyle: UrlStyle.Single }),
                );

                expect(tabs()).toContain('Reports');
            });

            it('does not render reports content when not permitted', async () => {
                await renderComponent(
                    defaultAppProps({ account: user({}) }),
                    '/division/:divisionId/:mode',
                    `/division/${division.id}/reports`,
                    defaultContainerProps({ urlStyle: UrlStyle.Single }),
                );

                const button =
                    context.container.querySelector('.btn.btn-primary');
                expect(button).toBeFalsy();
            });

            it('renders reports content when permitted', async () => {
                await renderComponent(
                    defaultAppProps({ account: user({ runReports: true }) }),
                    '/division/:divisionId/:mode',
                    `/division/${division.id}/reports`,
                    defaultContainerProps({ urlStyle: UrlStyle.Single }),
                );

                const button =
                    context.container.querySelector('.btn.btn-primary')!;
                expect(button.textContent).toEqual('📊 Get reports...');
            });

            it('does not render reports tab for superleague', async () => {
                await renderComponent(
                    defaultAppProps({ divisions: [superleagueDivision] }),
                    '/division/:divisionId/:mode',
                    `/division/${superleagueDivision.id}/reports`,
                );

                expect(tabs()).not.toContain('Reports');
            });
        });

        describe('health', () => {
            it('does not health tab when logged out', async () => {
                await renderComponent(
                    defaultAppProps(),
                    '/division/:divisionId',
                    `/division/${division.id}`,
                    defaultContainerProps({ urlStyle: UrlStyle.Single }),
                );

                expect(tabs()).not.toContain('Health');
            });

            it('does not render tab when not permitted', async () => {
                await renderComponent(
                    defaultAppProps({
                        account: user({}),
                    }),
                    '/division/:divisionId',
                    `/division/${division.id}`,
                    defaultContainerProps({ urlStyle: UrlStyle.Single }),
                );

                expect(tabs()).not.toContain('Health');
            });

            it('renders tab when permitted', async () => {
                await renderComponent(
                    defaultAppProps({
                        account: user({ runHealthChecks: true }),
                        controls: true,
                    }),
                    '/division/:divisionId/:mode',
                    `/division/${division.id}/health`,
                    defaultContainerProps({ urlStyle: UrlStyle.Single }),
                );

                expect(tabs()).toContain('Health');
            });

            it('does not render health content when not permitted', async () => {
                await renderComponent(
                    defaultAppProps({ account: user({}) }),
                    '/division/:divisionId/:mode',
                    `/division/${division.id}/health`,
                    defaultContainerProps({ urlStyle: UrlStyle.Single }),
                );

                const button =
                    context.container.querySelector('.btn.btn-primary');
                expect(button).toBeFalsy();
            });

            it('renders health content when permitted', async () => {
                await renderComponent(
                    defaultAppProps({
                        account: user({ runHealthChecks: true }),
                    }),
                    '/division/:divisionId/:mode',
                    `/division/${division.id}/health`,
                    defaultContainerProps({ urlStyle: UrlStyle.Single }),
                );

                const component = context.container.querySelector(
                    'div[datatype="health"]',
                )!;
                expect(component).toBeTruthy();
            });

            it('does not render health tab for superleague', async () => {
                await renderComponent(
                    defaultAppProps({ divisions: [superleagueDivision] }),
                    '/division/:divisionId/:mode',
                    `/division/${superleagueDivision.id}/health`,
                );

                expect(tabs()).not.toContain('Health');
            });
        });

        describe('data errors', () => {
            beforeEach(() => {
                divisionDataMap[division.id] = {
                    season: season,
                    id: division.id,
                    name: division.name,
                    teams: [],
                    dataErrors: [
                        {
                            message: 'Some error',
                        },
                    ],
                };
            });

            it('renders data errors when permitted', async () => {
                await renderComponent(
                    defaultAppProps({ account: user({}) }),
                    '/division/:divisionId',
                    `/division/${division.id}`,
                    defaultContainerProps({ urlStyle: UrlStyle.Single }),
                );

                expect(heading()).toEqual('⚠ Errors in division data');
            });

            it('can hide data errors', async () => {
                await renderComponent(
                    defaultAppProps({ account: user({}) }),
                    '/division/:divisionId',
                    `/division/${division.id}`,
                    defaultContainerProps({ urlStyle: UrlStyle.Single }),
                );
                expect(heading()).toEqual('⚠ Errors in division data');

                await doClick(findButton(context.container, 'Hide errors'));

                expect(heading()).toBeFalsy();
            });

            it('does not render data errors when not permitted', async () => {
                await renderComponent(
                    defaultAppProps(),
                    '/division/:divisionId',
                    `/division/${division.id}`,
                    defaultContainerProps({ urlStyle: UrlStyle.Single }),
                );

                expect(heading()).toBeFalsy();
            });
        });

        describe('edge cases', () => {
            const homeTeam = teamBuilder('HOME')
                .forSeason(season, division)
                .build();
            const awayTeam = teamBuilder('AWAY')
                .forSeason(season, division)
                .build();

            function getFixtureContainer(date: string) {
                const element = context.container.querySelector(
                    `div[data-fixture-date="${date}"]`,
                )!;
                return element.parentElement!;
            }

            it('when a different season id is returned to requested', async () => {
                divisionDataMap[division.id + ':' + season.id] = {
                    season: seasonBuilder('ANOTHER SEASON').build(),
                    id: division.id, // different id to requested
                    name: division.name,
                    teams: [],
                };

                await renderComponent(
                    defaultAppProps({ account: user({}) }),
                    '/teams/:seasonId',
                    `/teams/${season.id}/?division=${division.id}`,
                );

                expect(reportedError.error).toEqual(
                    `Data for a different season returned, requested: ${season.id}`,
                );
            });

            it('renders no data for invalid division name', async () => {
                divisionDataMap[division.id] = {
                    season: season,
                    id: division.id,
                    name: division.name,
                    teams: [],
                };

                await renderComponent(
                    defaultAppProps(),
                    '/teams',
                    `/teams/?division=unknown`,
                );

                expect(getContent().textContent).toEqual('No data found');
            });

            it('renders no data when season not found', async () => {
                await renderComponent(
                    defaultAppProps(),
                    '/teams/:seasonId',
                    `/teams/UNKNOWN/?division=${division.id}`,
                );

                expect(getContent().textContent).toEqual('No data found');
            });

            it('renders no data when no divisions', async () => {
                await renderComponent(
                    defaultAppProps({
                        divisions: [],
                    }),
                    '/teams',
                    `/teams/?division=${division.name}`,
                );

                expect(getContent().innerHTML).toContain('No data found');
            });

            it('renders error when data returns with a status code with errors', async () => {
                const error: IFailedRequest = {
                    status: 500,
                    errors: {
                        key1: ['some error1'],
                        key2: ['some error2'],
                    },
                };
                divisionDataMap[division.id] =
                    error as IRequestedDivisionDataDto;

                await renderComponent(
                    defaultAppProps(),
                    '/teams',
                    `/teams/?division=${division.id}`,
                );

                expect(reportedError.error).toEqual(
                    'Error accessing division: Code: 500 -- key1: some error1, key2: some error2',
                );
            });

            it('renders error when data returns with a status code without errors', async () => {
                divisionDataMap[division.id] = {
                    status: 500,
                } as IRequestedDivisionDataDto;

                await renderComponent(
                    defaultAppProps(),
                    '/teams',
                    `/teams/?division=${division.id}`,
                );

                expect(reportedError.error).toEqual(
                    'Error accessing division: Code: 500',
                );
            });

            it('reloads division data when fixture created', async () => {
                divisionDataMap[division.id] = divisionDataBuilder(division)
                    .season(
                        (s) =>
                            s
                                .starting('2023-01-01')
                                .ending('2023-06-01')
                                .withDivision(division),
                        season.id,
                    )
                    .withFixtureDate(
                        (d) => d.withFixture((f) => f.bye(homeTeam).knockout()),
                        '2023-07-01',
                    )
                    .build();
                await renderComponent(
                    defaultAppProps({
                        account: user({ manageGames: true }),
                        teams: [homeTeam, awayTeam],
                    }),
                    '/fixtures',
                    `/fixtures/?division=${division.id}`,
                    defaultContainerProps({ mode: 'fixtures' }),
                );
                expect(dataRequested).toEqual([{ divisionId: division.id }]); // data loaded once
                const fixtureContainer = getFixtureContainer('2023-07-01');

                await doSelectOption(
                    fixtureContainer.querySelector('.dropdown-menu'),
                    'AWAY',
                );
                await doClick(findButton(fixtureContainer, '💾'));

                expect(dataRequested).toEqual([
                    { divisionId: division.id },
                    { divisionId: division.id },
                ]); // data loaded twice
            });

            it('reloads division data when fixture deleted', async () => {
                divisionDataMap[division.id] = divisionDataBuilder(division)
                    .season((s) =>
                        s
                            .starting('2023-01-01')
                            .ending('2023-06-01')
                            .withDivision(division),
                    )
                    .withFixtureDate(
                        (d) =>
                            d.withFixture((f) =>
                                f.playing(homeTeam, awayTeam).knockout(),
                            ),
                        '2023-07-01',
                    )
                    .build();
                await renderComponent(
                    defaultAppProps({
                        account: user({ manageGames: true }),
                        teams: [homeTeam, awayTeam],
                    }),
                    '/fixtures',
                    `/fixtures/?division=${division.id}`,
                    defaultContainerProps({ mode: 'fixtures' }),
                );
                expect(dataRequested).toEqual([{ divisionId: division.id }]); // data loaded once
                const fixtureContainer = getFixtureContainer('2023-07-01');
                context.prompts.respondToConfirm(
                    'Are you sure you want to delete this fixture?\n\nHOME vs AWAY',
                    true,
                );

                await doClick(findButton(fixtureContainer, '🗑'));

                expect(dataRequested).toEqual([
                    { divisionId: division.id },
                    { divisionId: division.id },
                ]); // data loaded twice
            });
        });
    });

    describe('rendering options', () => {
        const division: DivisionDto = divisionBuilder('DIVISION').build();
        const season: SeasonDto = seasonBuilder('SEASON')
            .starting('2023-01-01')
            .ending('2023-06-01')
            .withDivision(division)
            .build();

        beforeEach(() => {
            divisionDataMap[division.id] = {
                season: season,
                id: division.id,
                name: division.name,
                teams: [],
            };
        });

        function defaultAppProps(customisations?: Partial<IApp>) {
            return appProps(
                {
                    divisions: [division],
                    seasons: [season],
                    ...customisations,
                },
                reportedError,
            );
        }

        it('does show division controls when not denied', async () => {
            await renderComponent(
                defaultAppProps({ controls: true }),
                '/teams',
                `/teams/?division=${division.id}`,
            );

            expect(context.container.querySelector('.btn-group')).toBeTruthy();
            expect(context.container.innerHTML).toContain(
                `${season.name} (${renderDate(season.startDate)} - ${renderDate(season.endDate)})`,
            );
            expect(context.container.innerHTML).toContain(division.name);
        });

        it('does show tabs when not denied', async () => {
            await renderComponent(
                defaultAppProps({ controls: true }),
                '/teams',
                `/teams/?division=${division.id}`,
            );

            expect(context.container.querySelector('.nav-tabs')).toBeTruthy();
            expect(context.container.innerHTML).toContain('Teams');
            expect(context.container.innerHTML).toContain('Fixtures');
            expect(context.container.innerHTML).toContain('Players');
        });

        it('does not show division controls when instructed', async () => {
            await renderComponent(
                defaultAppProps({ controls: false }),
                '/teams',
                `/teams/?division=${division.id}`,
            );

            expect(context.container.querySelector('.btn-group')).toBeFalsy();
        });

        it('does not show tabs when instructed', async () => {
            await renderComponent(
                defaultAppProps({ controls: false }),
                '/teams',
                `/teams/?division=${division.id}`,
            );

            expect(context.container.querySelector('.nav-tabs')).toBeFalsy();
        });
    });
});
