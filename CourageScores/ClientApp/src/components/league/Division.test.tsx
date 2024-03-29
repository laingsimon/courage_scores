import {
    cleanUp,
    doClick,
    doSelectOption,
    findButton,
    renderApp,
    noop,
    TestContext,
    iocProps,
    brandingProps, appProps, ErrorState, api
} from "../../helpers/tests";
import {Division, IRequestedDivisionDataDto} from "./Division";
import {any, toMap} from "../../helpers/collections";
import {renderDate} from "../../helpers/rendering";
import {DivisionDataDto} from "../../interfaces/models/dtos/Division/DivisionDataDto";
import {SeasonHealthCheckResultDto} from "../../interfaces/models/dtos/Health/SeasonHealthCheckResultDto";
import {GameDto} from "../../interfaces/models/dtos/Game/GameDto";
import {DivisionDto} from "../../interfaces/models/dtos/DivisionDto";
import {SeasonDto} from "../../interfaces/models/dtos/Season/SeasonDto";
import {TeamDto} from "../../interfaces/models/dtos/Team/TeamDto";
import {TeamPlayerDto} from "../../interfaces/models/dtos/Team/TeamPlayerDto";
import {IApp} from "../common/IApp";
import {IClientActionResultDto} from "../common/IClientActionResultDto";
import {seasonBuilder} from "../../helpers/builders/seasons";
import {divisionBuilder, divisionDataBuilder, IDivisionFixtureDateBuilder} from "../../helpers/builders/divisions";
import {teamBuilder} from "../../helpers/builders/teams";
import {IPlayerPerformanceBuilder, playerBuilder} from "../../helpers/builders/players";
import {IFixtureBuilder} from "../../helpers/builders/games";
import {IFailedRequest} from "../common/IFailedRequest";
import {IDivisionApi} from "../../interfaces/apis/IDivisionApi";
import {DivisionDataFilter} from "../../interfaces/models/dtos/Division/DivisionDataFilter";
import {IGameApi} from "../../interfaces/apis/IGameApi";
import {ISeasonApi} from "../../interfaces/apis/ISeasonApi";

describe('Division', () => {
    let context: TestContext;
    let reportedError: ErrorState;
    let divisionDataMap: { [key: string]: IRequestedDivisionDataDto };
    let dataRequested: {divisionId: string, seasonId?: string}[];

    const divisionApi = api<IDivisionApi>({
        data: async (divisionId: string, filter: DivisionDataFilter): Promise<DivisionDataDto> => {
            const seasonId = filter.seasonId;
            const key = `${divisionId}${seasonId ? ':' + seasonId : ''}`;

            if (!any(Object.keys(divisionDataMap), (k: string) => k === key)) {
                throw new Error(`DivisionData request not expected for ${key}`);
            }

            dataRequested.push({divisionId, seasonId});
            return divisionDataMap[key];
        },
    });
    const seasonApi = api<ISeasonApi>({
        getHealth: async (): Promise<SeasonHealthCheckResultDto> => {
            return {success: true, checks: {}, messages: [], warnings: [], errors: []};
        },
    });
    const gameApi = api<IGameApi>({
        update: async (): Promise<IClientActionResultDto<GameDto>> => {
            return ({success: true});
        },
        delete: async (): Promise<IClientActionResultDto<GameDto>> => {
            return ({success: true});
        }
    });

    afterEach(() => {
        cleanUp(context);
    });

    beforeEach(() => {
        dataRequested = [];
        divisionDataMap = {};
        reportedError = new ErrorState();
    });

    async function renderComponent(appContainerProps: IApp, route: string, address: string) {
        context = await renderApp(
            iocProps({divisionApi, seasonApi, gameApi}),
            brandingProps(),
            appProps(appContainerProps, reportedError),
            (<Division/>),
            route,
            address);
    }

    describe('when out of season', () => {
        const divisionData = divisionDataBuilder().build();
        const divisionId = divisionData.id;

        beforeEach(() => {
            divisionDataMap[divisionData.id] = divisionData;
        });

        it('renders prompt for season', async () => {
            await renderComponent(appProps({
                divisions: [],
                seasons: [seasonBuilder('SEASON').build()],
                controls: true,
            }, reportedError), '/division/:divisionId', `/division/${divisionId}`);

            reportedError.verifyNoError();
            const seasonSelection = context.container.querySelector('.btn-group .btn-group:nth-child(1)') as HTMLElement;
            const divisionSelection = context.container.querySelector('.btn-group .btn-group:nth-child(2)') as HTMLElement;
            expect(seasonSelection.textContent).toContain('Select a season');
            expect(seasonSelection.className).toContain('show');
            expect(divisionSelection.textContent).toContain('All divisions');
        });

        it('renders prompt for season when no controls', async () => {
            await renderComponent(appProps({
                divisions: [],
                seasons: [seasonBuilder('SEASON').build()],
                controls: false,
            }, reportedError), '/division/:divisionId', `/division/${divisionId}`);

            reportedError.verifyNoError();
            const seasonSelection = context.container.querySelector('.btn-group .btn-group:nth-child(1)') as HTMLElement;
            const divisionSelection = context.container.querySelector('.btn-group .btn-group:nth-child(2)') as HTMLElement;
            expect(seasonSelection.textContent).toContain('Select a season');
            expect(seasonSelection.className).toContain('show');
            expect(divisionSelection.textContent).toContain('All divisions');
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
        const player: TeamPlayerDto = playerBuilder('PLAYER_NAME')
            .team(team)
            .singles((a: IPlayerPerformanceBuilder) => a.matchesPlayed(1))
            .build();

        beforeEach(() => {
            const divisionData = divisionDataBuilder(division)
                .season(season)
                .withPlayer(player)
                .withTeam(team)
                .build();

            divisionDataMap[division.id] = divisionData;
            divisionDataMap[division.id + ':' + season.id] = divisionData;
        });

        describe('teams', () => {
            it('renders teams table via division id', async () => {
                await renderComponent(appProps({
                    divisions: [division],
                    seasons: [season],
                }, reportedError), '/division/:divisionId/:mode', `/division/${division.id}/teams`);

                reportedError.verifyNoError();
                const table = context.container.querySelector('.content-background table.table') as HTMLTableElement;
                const headings = Array.from(table.querySelectorAll('thead tr th')) as HTMLTableCellElement[];
                expect(headings.map(th => th.textContent)).toEqual(['Venue', 'Played', 'Points', 'Won', 'Lost', 'Drawn', '+/-']);
            });

            it('renders teams table via division name', async () => {
                await renderComponent(appProps({
                    divisions: [division],
                    seasons: [season],
                }, reportedError), '/division/:divisionId/:mode', `/division/${division.name}/teams`);

                reportedError.verifyNoError();
                const table = context.container.querySelector('.content-background table.table') as HTMLTableElement;
                const headings = Array.from(table.querySelectorAll('thead tr th')) as HTMLTableCellElement[];
                expect(headings.map(th => th.textContent)).toEqual(['Venue', 'Played', 'Points', 'Won', 'Lost', 'Drawn', '+/-']);
            });

            it('renders teams table via division and season name', async () => {
                await renderComponent(appProps({
                    divisions: [division],
                    seasons: [season],
                }, reportedError), '/division/:divisionId/:mode/:seasonId', `/division/${division.name}/teams/${season.name}`);

                reportedError.verifyNoError();
                const table = context.container.querySelector('.content-background table.table') as HTMLTableElement;
                const headings = Array.from(table.querySelectorAll('thead tr th')) as HTMLTableCellElement[];
                expect(headings.map(th => th.textContent)).toEqual(['Venue', 'Played', 'Points', 'Won', 'Lost', 'Drawn', '+/-']);
            });

            it('renders teams table via season id', async () => {
                await renderComponent(appProps({
                    divisions: [division],
                    seasons: [season],
                }, reportedError), '/division/:divisionId/:mode/:seasonId', `/division/${division.id}/teams/${season.id}`);

                reportedError.verifyNoError();
                const table = context.container.querySelector('.content-background table.table') as HTMLTableElement;
                const headings = Array.from(table.querySelectorAll('thead tr th')) as HTMLTableCellElement[];
                expect(headings.map(th => th.textContent)).toEqual(['Venue', 'Played', 'Points', 'Won', 'Lost', 'Drawn', '+/-']);
            });
        });

        describe('team', () => {
            it('renders team details when provided with team id', async () => {
                await renderComponent(appProps({
                    divisions: [division],
                    seasons: [season],
                    teams: toMap([team]),
                }, reportedError), '/division/:divisionId/:mode/:seasonId', `/division/${division.id}/team:${team.id}/${season.id}`);

                reportedError.verifyNoError();
                const heading = context.container.querySelector('.content-background h3') as HTMLHeadingElement;
                expect(heading.textContent).toEqual('TEAM_NAME 🔗');
            });

            it('renders team details when provided with team name', async () => {
                await renderComponent(appProps({
                    divisions: [division],
                    seasons: [season],
                    teams: toMap([team]),
                }, reportedError), '/division/:divisionId/:mode/:seasonId', `/division/${division.name}/team:${team.name}/${season.name}`);

                reportedError.verifyNoError();
                const heading = context.container.querySelector('.content-background h3') as HTMLHeadingElement;
                expect(heading.textContent).toEqual('TEAM_NAME 🔗');
            });

            it('renders team not found when provided no team name', async () => {
                await renderComponent(appProps({
                    divisions: [division],
                    seasons: [season],
                    teams: toMap([team]),
                }, reportedError), '/division/:divisionId/:mode/:seasonId', `/division/${division.name}/team:/${season.name}`);

                reportedError.verifyNoError();
                const content = context.container.querySelector('.content-background') as HTMLElement;
                expect(content.textContent).toContain('⚠ Team could not be found');
            });

            it('renders team not found when provided with missing team', async () => {
                await renderComponent(appProps({
                    divisions: [division],
                    seasons: [season],
                    teams: toMap([team]),
                }, reportedError), '/division/:divisionId/:mode/:seasonId', `/division/${division.name}/team:UNKNOWN_TEAM/${season.name}`);

                reportedError.verifyNoError();
                const content = context.container.querySelector('.content-background') as HTMLElement;
                expect(content.textContent).toContain('⚠ Team could not be found');
            });
        });

        describe('fixtures', () => {
            it('renders fixtures list via division id', async () => {
                await renderComponent(appProps({
                    divisions: [division],
                    seasons: [season],
                }, reportedError), '/division/:divisionId/:mode', `/division/${division.id}/fixtures`);

                reportedError.verifyNoError();
                const content = context.container.querySelector('.content-background') as HTMLElement;
                expect(content.textContent).toContain('No fixtures, yet');
            });

            it('renders fixtures list via division name', async () => {
                await renderComponent(appProps({
                    divisions: [division],
                    seasons: [season],
                }, reportedError), '/division/:divisionId/:mode', `/division/${division.name}/fixtures`);

                reportedError.verifyNoError();
                const content = context.container.querySelector('.content-background') as HTMLElement;
                expect(content.textContent).toContain('No fixtures, yet');
            });

            it('renders fixtures list via division and season name', async () => {
                await renderComponent(appProps({
                    divisions: [division],
                    seasons: [season],
                }, reportedError), '/division/:divisionId/:mode/:seasonId', `/division/${division.name}/fixtures/${season.name}`);

                reportedError.verifyNoError();
                const content = context.container.querySelector('.content-background') as HTMLElement;
                expect(content.textContent).toContain('No fixtures, yet');
            });

            it('renders fixtures list via division and season id', async () => {
                await renderComponent(appProps({
                    divisions: [division],
                    seasons: [season],
                }, reportedError), '/division/:divisionId/:mode/:seasonId', `/division/${division.id}/fixtures/${season.id}`);

                reportedError.verifyNoError();
                const content = context.container.querySelector('.content-background') as HTMLElement;
                expect(content.textContent).toContain('No fixtures, yet');
            });
        });

        describe('players', () => {
            it('renders players table via division id', async () => {
                await renderComponent(appProps({
                    divisions: [division],
                    seasons: [season],
                }, reportedError), '/division/:divisionId/:mode', `/division/${division.id}/players`);

                reportedError.verifyNoError();
                const table = context.container.querySelector('.content-background table.table') as HTMLTableElement;
                const headings = Array.from(table.querySelectorAll('thead tr th'));
                expect(headings.map(th => th.textContent)).toEqual(['Rank', 'Player', 'Venue', 'Played', 'Won', 'Lost', 'Points', 'Win %', '180s', 'hi-check']);
            });

            it('renders players table via division name', async () => {
                await renderComponent(appProps({
                    divisions: [division],
                    seasons: [season],
                }, reportedError), '/division/:divisionId/:mode', `/division/${division.name}/players`);

                reportedError.verifyNoError();
                const table = context.container.querySelector('.content-background table.table') as HTMLTableElement;
                const headings = Array.from(table.querySelectorAll('thead tr th'));
                expect(headings.map(th => th.textContent)).toEqual(['Rank', 'Player', 'Venue', 'Played', 'Won', 'Lost', 'Points', 'Win %', '180s', 'hi-check']);
            });

            it('renders players table via division and season name', async () => {
                await renderComponent(appProps({
                    divisions: [division],
                    seasons: [season],
                }, reportedError), '/division/:divisionId/:mode/:seasonId', `/division/${division.name}/players/${season.name}`);

                reportedError.verifyNoError();
                const table = context.container.querySelector('.content-background table.table') as HTMLTableElement;
                const headings = Array.from(table.querySelectorAll('thead tr th'));
                expect(headings.map(th => th.textContent)).toEqual(['Rank', 'Player', 'Venue', 'Played', 'Won', 'Lost', 'Points', 'Win %', '180s', 'hi-check']);
            });

            it('renders players table via season id', async () => {
                await renderComponent(appProps({
                    divisions: [division],
                    seasons: [season],
                }, reportedError), '/division/:divisionId/:mode/:seasonId', `/division/${division.name}/players/${season.id}`);

                reportedError.verifyNoError();
                const table = context.container.querySelector('.content-background table.table') as HTMLTableElement;
                const headings = Array.from(table.querySelectorAll('thead tr th'));
                expect(headings.map(th => th.textContent)).toEqual(['Rank', 'Player', 'Venue', 'Played', 'Won', 'Lost', 'Points', 'Win %', '180s', 'hi-check']);
            });
        });

        describe('player', () => {
            it('renders player details when provided with player id', async () => {
                await renderComponent(appProps({
                    divisions: [division],
                    seasons: [season],
                }, reportedError), '/division/:divisionId/:mode', `/division/${division.id}/player:${player.id}`);

                reportedError.verifyNoError();
                const heading = context.container.querySelector('.content-background h3') as HTMLHeadingElement;
                expect(heading.textContent).toContain('PLAYER_NAME');
            });

            it('renders player details when provided with player and team name', async () => {
                await renderComponent(appProps({
                    divisions: [division],
                    seasons: [season],
                }, reportedError), '/division/:divisionId/:mode', `/division/${division.name}/player:${player.name}@${team.name}`);

                reportedError.verifyNoError();
                const heading = context.container.querySelector('.content-background h3') as HTMLHeadingElement;
                expect(heading.textContent).toContain('PLAYER_NAME');
            });

            it('renders player not found when provided with missing team', async () => {
                await renderComponent(appProps({
                    divisions: [division],
                    seasons: [season],
                }, reportedError), '/division/:divisionId/:mode', `/division/${division.name}/player:${player.name}@UNKNOWN_TEAM`);

                reportedError.verifyNoError();
                const heading = context.container.querySelector('.content-background h5') as HTMLHeadingElement;
                expect(heading.textContent).toContain('⚠ PLAYER_NAME could not be found');
            });

            it('renders player not found when provided with missing player', async () => {
                await renderComponent(appProps({
                    divisions: [division],
                    seasons: [season],
                }, reportedError), '/division/:divisionId/:mode', `/division/${division.name}/player:UNKNOWN_PLAYER@${team.name}`);

                reportedError.verifyNoError();
                const heading = context.container.querySelector('.content-background h5') as HTMLHeadingElement;
                expect(heading.textContent).toContain('⚠ UNKNOWN_PLAYER could not be found');
            });

            it('renders player not found when provided no player name', async () => {
                await renderComponent(appProps({
                    divisions: [division],
                    seasons: [season],
                }, reportedError), '/division/:divisionId/:mode', `/division/${division.name}/player:`);

                reportedError.verifyNoError();
                const heading = context.container.querySelector('.content-background h5') as HTMLHeadingElement;
                expect(heading.textContent).toContain('⚠ Player could not be found');
            });

            it('renders player not found when provided with malformed names', async () => {
                await renderComponent(appProps({
                    divisions: [division],
                    seasons: [season],
                }, reportedError), '/division/:divisionId/:mode', `/division/${division.name}/player:foo`);

                reportedError.verifyNoError();
                const heading = context.container.querySelector('.content-background h5') as HTMLHeadingElement;
                expect(heading.textContent).toContain('⚠ Player could not be found');
            });
        });

        describe('reports', () => {
            it('does not render tab when logged out', async () => {
                await renderComponent(appProps({
                    divisions: [division],
                    seasons: [season],
                }, reportedError), '/division/:divisionId/:mode', `/division/${division.id}/teams`);

                reportedError.verifyNoError();
                const tabs = Array.from(context.container.querySelectorAll('.nav-tabs .nav-item')) as HTMLElement[];
                expect(tabs.map(t => t.textContent)).not.toContain('Reports');
            });

            it('does not render tab when not permitted', async () => {
                await renderComponent(appProps({
                    divisions: [division],
                    seasons: [season],
                    account: {
                        access: {
                            runReports: false,
                        }
                    }
                }, reportedError), '/division/:divisionId/:mode', `/division/${division.id}/teams`);

                reportedError.verifyNoError();
                const tabs = Array.from(context.container.querySelectorAll('.nav-tabs .nav-item')) as HTMLElement[];
                expect(tabs.map(t => t.textContent)).not.toContain('Reports');
            });

            it('renders tab when permitted', async () => {
                await renderComponent(appProps({
                    divisions: [division],
                    seasons: [season],
                    account: {
                        access: {
                            runReports: true,
                        }
                    },
                    controls: true,
                }, reportedError), '/division/:divisionId/:mode', `/division/${division.id}/teams`);

                reportedError.verifyNoError();
                const tabs = Array.from(context.container.querySelectorAll('.nav-tabs .nav-item'));
                expect(tabs.map(t => t.textContent)).toContain('Reports');
            });

            it('does not render reports content when not permitted', async () => {
                await renderComponent(appProps({
                    divisions: [division],
                    seasons: [season],
                    account: {
                        access: {
                            runReports: false,
                        }
                    }
                }, reportedError), '/division/:divisionId/:mode', `/division/${division.id}/reports`);

                reportedError.verifyNoError();
                const button = context.container.querySelector('.btn.btn-primary') as HTMLButtonElement;
                expect(button).toBeFalsy();
            });

            it('renders reports content when permitted', async () => {
                await renderComponent(appProps({
                    divisions: [division],
                    seasons: [season],
                    account: {
                        access: {
                            runReports: true,
                        }
                    }
                }, reportedError), '/division/:divisionId/:mode', `/division/${division.id}/reports`);

                reportedError.verifyNoError();
                const button = context.container.querySelector('.btn.btn-primary') as HTMLButtonElement;
                expect(button.textContent).toEqual('📊 Get reports...');
            });
        });

        describe('health', () => {
            it('does not health tab when logged out', async () => {
                await renderComponent(appProps({
                    divisions: [division],
                    seasons: [season],
                }, reportedError), '/division/:divisionId/:mode', `/division/${division.id}/teams`);

                reportedError.verifyNoError();
                const tabs = Array.from(context.container.querySelectorAll('.nav-tabs .nav-item'));
                expect(tabs.map(t => t.textContent)).not.toContain('Health');
            });

            it('does not render tab when not permitted', async () => {
                await renderComponent(appProps({
                    divisions: [division],
                    seasons: [season],
                    account: {
                        access: {
                            runHealthChecks: false,
                        }
                    }
                }, reportedError), '/division/:divisionId/:mode', `/division/${division.id}/teams`);

                reportedError.verifyNoError();
                const tabs = Array.from(context.container.querySelectorAll('.nav-tabs .nav-item'));
                expect(tabs.map(t => t.textContent)).not.toContain('Health');
            });

            it('renders tab when permitted', async () => {
                await renderComponent(appProps({
                    divisions: [division],
                    seasons: [season],
                    account: {
                        access: {
                            runHealthChecks: true,
                        }
                    },
                    controls: true,
                }, reportedError), '/division/:divisionId/:mode', `/division/${division.id}/teams`);

                reportedError.verifyNoError();
                const tabs = Array.from(context.container.querySelectorAll('.nav-tabs .nav-item'));
                expect(tabs.map(t => t.textContent)).toContain('Health');
            });

            it('does not render health content when not permitted', async () => {
                await renderComponent(appProps({
                    divisions: [division],
                    seasons: [season],
                    account: {
                        access: {
                            runHealthChecks: false,
                        }
                    }
                }, reportedError), '/division/:divisionId/:mode', `/division/${division.id}/health`);

                reportedError.verifyNoError();
                const button = context.container.querySelector('.btn.btn-primary');
                expect(button).toBeFalsy();
            });

            it('renders health content when permitted', async () => {
                await renderComponent(appProps({
                    divisions: [division],
                    seasons: [season],
                    account: {
                        access: {
                            runHealthChecks: true,
                        }
                    }
                }, reportedError), '/division/:divisionId/:mode', `/division/${division.id}/health`);

                reportedError.verifyNoError();
                const component = context.container.querySelector('div[datatype="health"]') as HTMLElement;
                expect(component).toBeTruthy();
            });
        });

        describe('data errors', () => {
            beforeEach(() => {
                divisionDataMap[division.id] = ({
                    season: season,
                    id: division.id,
                    name: division.name,
                    teams: [],
                    dataErrors: [ {
                        message: 'Some error'
                    } ],
                });
            });

            it('renders data errors when permitted', async () => {
                await renderComponent(appProps({
                    divisions: [division],
                    seasons: [season],
                    account: {},
                }, reportedError), '/division/:divisionId/:mode', `/division/${division.id}/teams`);

                reportedError.verifyNoError();
                const heading = context.container.querySelector('h3') as HTMLHeadingElement;
                expect(heading.textContent).toEqual('⚠ Errors in division data');
            });

            it('can hide data errors', async () => {
                await renderComponent(appProps({
                    divisions: [division],
                    seasons: [season],
                    account: {},
                }, reportedError), '/division/:divisionId/:mode', `/division/${division.id}/teams`);
                const heading = context.container.querySelector('h3') as HTMLHeadingElement;
                expect(heading.textContent).toEqual('⚠ Errors in division data');

                await doClick(findButton(context.container, 'Hide errors'));

                expect(context.container.querySelector('h3')).toBeFalsy();
            });

            it('does not render data errors when not permitted', async () => {
                await renderComponent(appProps({
                    divisions: [division],
                    seasons: [season],
                }, reportedError), '/division/:divisionId/:mode', `/division/${division.id}/teams`);

                reportedError.verifyNoError();
                const heading = context.container.querySelector('h3') as HTMLHeadingElement;
                expect(heading).toBeFalsy();
            });
        });

        describe('edge cases', () => {
            it('when a different division id is returned to requested', async () => {
                divisionDataMap[division.id] = divisionDataBuilder()  // different id to requested
                    .season(season)
                    .name(division.name)
                    .build();
                console.log = noop;

                await renderComponent(appProps({
                    divisions: [division],
                    seasons: [season],
                    account: {},
                }, reportedError), '/division/:divisionId/:mode', `/division/${division.id}/teams`);

                expect(reportedError.error).toEqual(`Data for a different division returned, requested: ${division.id}`);
            });

            it('when a different season id is returned to requested', async () => {
                divisionDataMap[division.id + ':' + season.id] = ({
                    season: seasonBuilder('ANOTHER SEASON').build(),
                    id: division.id, // different id to requested
                    name: division.name,
                    teams: [],
                });
                console.log = noop;

                await renderComponent(appProps({
                    divisions: [division],
                    seasons: [season],
                    account: {},
                }, reportedError), '/division/:divisionId/:mode/:seasonId', `/division/${division.id}/teams/${season.id}`);

                expect(reportedError.error).toEqual(`Data for a different season returned, requested: ${season.id}`);
            });

            it('renders no data for invalid division name', async () => {
                divisionDataMap[division.id] = ({
                    season: season,
                    id: division.id,
                    name: division.name,
                    teams: []
                });

                await renderComponent(appProps({
                    divisions: [division],
                    seasons: [season],
                }, reportedError), '/division/:divisionId/:mode', `/division/unknown/teams`);

                reportedError.verifyNoError();
                const content = context.container.querySelector('.content-background') as HTMLElement;
                expect(content.textContent).toEqual('No data found');
            });

            it('renders no data when season not found', async () => {
                await renderComponent(appProps({
                    divisions: [division],
                    seasons: [season],
                }, reportedError), '/division/:divisionId/:mode/:seasonId', `/division/${division.id}/teams/UNKNOWN`);

                reportedError.verifyNoError();
                const content = context.container.querySelector('.content-background') as HTMLElement;
                expect(content.textContent).toEqual('No data found');
            });

            it('renders no data when no divisions', async () => {
                await renderComponent(appProps({
                    divisions: [],
                    seasons: [season],
                }, reportedError), '/division/:divisionId/:mode', `/division/${division.name}/teams`);

                reportedError.verifyNoError();
                const content = context.container.querySelector('.content-background') as HTMLElement;
                expect(content.className).toContain('loading-background');
            });

            it('renders error when data returns with a status code with errors', async () => {
                const error: IFailedRequest = {
                    status: 500,
                    errors: {
                        key1: ['some error1'],
                        key2: ['some error2'],
                    },
                };
                divisionDataMap[division.id] = error as IRequestedDivisionDataDto;
                console.log = noop;

                await renderComponent(appProps({
                    divisions: [division],
                    seasons: [season],
                }, reportedError), '/division/:divisionId/:mode', `/division/${division.id}/teams`);

                expect(reportedError.error).toEqual('Error accessing division: Code: 500 -- key1: some error1, key2: some error2');
            });

            it('renders error when data returns with a status code without errors', async () => {
                divisionDataMap[division.id] = {
                    status: 500,
                } as IRequestedDivisionDataDto;
                console.log = noop;

                await renderComponent(appProps({
                    divisions: [division],
                    seasons: [season],
                }, reportedError), '/division/:divisionId/:mode', `/division/${division.id}/teams`);

                expect(reportedError.error).toEqual('Error accessing division: Code: 500');
            });

            it('reloads division data when fixture created', async () => {
                const homeTeam = teamBuilder('HOME')
                    .forSeason(season, division)
                    .build();
                const awayTeam = teamBuilder('AWAY')
                    .forSeason(season, division)
                    .build();
                divisionDataMap[division.id] = divisionDataBuilder(division)
                    .season(season)
                    .withFixtureDate((d: IDivisionFixtureDateBuilder) => d.withFixture((f: IFixtureBuilder) => f.bye(homeTeam.address).knockout()), '2023-07-01')
                    .build();
                await renderComponent(appProps({
                    divisions: [division],
                    seasons: [season],
                    account: {
                        access: {
                            manageGames: true,
                        }
                    },
                    teams: [homeTeam, awayTeam],
                }, reportedError), '/division/:divisionId/:mode', `/division/${division.id}/fixtures`);
                expect(dataRequested).toEqual([
                    {divisionId: division.id},
                ]); // data loaded once
                reportedError.verifyNoError();
                const fixtureContainer = (context.container.querySelector('div[data-fixture-date="2023-07-01"]') as HTMLElement).parentElement as HTMLElement;

                await doSelectOption(fixtureContainer.querySelector('.dropdown-menu'), 'AWAY');
                await doClick(findButton(fixtureContainer, '💾'));

                reportedError.verifyNoError();
                expect(dataRequested).toEqual([
                    {divisionId: division.id},
                    {divisionId: division.id},
                ]); // data loaded twice
            });

            it('reloads division data when fixture deleted', async () => {
                const homeTeam = teamBuilder('HOME')
                    .forSeason(season, division)
                    .build();
                const awayTeam = teamBuilder('AWAY')
                    .forSeason(season, division)
                    .build();
                divisionDataMap[division.id] = divisionDataBuilder(division)
                    .season(season)
                    .withFixtureDate((d: IDivisionFixtureDateBuilder) => d.withFixture((f: IFixtureBuilder) => f.playing(homeTeam, awayTeam).knockout()), '2023-07-01')
                    .build();
                await renderComponent(appProps({
                    divisions: [division],
                    seasons: [season],
                    account: {
                        access: {
                            manageGames: true,
                        }
                    },
                    teams: [homeTeam, awayTeam],
                }, reportedError), '/division/:divisionId/:mode', `/division/${division.id}/fixtures`);
                expect(dataRequested).toEqual([
                    {divisionId: division.id},
                ]); // data loaded once
                reportedError.verifyNoError();
                const fixtureContainer = (context.container.querySelector('div[data-fixture-date="2023-07-01"]') as HTMLElement).parentElement as HTMLElement;
                window.confirm = () => true;

                await doClick(findButton(fixtureContainer, '🗑'));

                reportedError.verifyNoError();
                expect(dataRequested).toEqual([
                    {divisionId: division.id},
                    {divisionId: division.id},
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
            divisionDataMap[division.id] = ({
                season: season,
                id: division.id,
                name: division.name,
                teams: []
            });
        });

        it('does show division controls when not denied', async () => {
            await renderComponent(appProps({
                divisions: [division],
                seasons: [season],
                controls: true,
            }, reportedError), '/division/:divisionId/:mode', `/division/${division.id}/teams`);

            reportedError.verifyNoError();
            expect(context.container.querySelector('.btn-group')).toBeTruthy();
            expect(context.container.innerHTML).toContain(`${season.name} (${renderDate(season.startDate)} - ${renderDate(season.endDate)})`);
            expect(context.container.innerHTML).toContain(division.name);
        });

        it('does show tabs when not denied', async () => {
            await renderComponent(appProps({
                divisions: [division],
                seasons: [season],
                controls: true,
            }, reportedError), '/division/:divisionId/:mode', `/division/${division.id}/teams`);

            reportedError.verifyNoError();
            expect(context.container.querySelector('.nav-tabs')).toBeTruthy();
            expect(context.container.innerHTML).toContain('Teams');
            expect(context.container.innerHTML).toContain('Fixtures');
            expect(context.container.innerHTML).toContain('Players');
        });

        it('does not show division controls when instructed', async () => {
            await renderComponent(appProps({
                divisions: [division],
                seasons: [season],
                controls: false,
            }, reportedError), '/division/:divisionId/:mode', `/division/${division.id}/teams`);

            reportedError.verifyNoError();
            expect(context.container.querySelector('.btn-group')).toBeFalsy();
        });

        it('does not show tabs when instructed', async () => {
            await renderComponent(appProps({
                divisions: [division],
                seasons: [season],
                controls: false,
            }, reportedError), '/division/:divisionId/:mode', `/division/${division.id}/teams`);

            reportedError.verifyNoError();
            expect(context.container.querySelector('.nav-tabs')).toBeFalsy();
        });
    })
});
