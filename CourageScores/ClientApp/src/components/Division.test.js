// noinspection JSUnresolvedFunction

import {cleanUp, renderApp} from "../helpers/tests";
import {Division} from "./Division";
import React from "react";
import {any, toMap} from "../helpers/collections";
import {createTemporaryId} from "../helpers/projection";

describe('Division', () => {
    let context;
    let reportedError;
    const divisionDataMap = { };
    const divisionApi = {
        data: async (divisionId, seasonId) => {
            const key = `${divisionId}${seasonId ? ':' + seasonId : ''}`;

            if (!any(Object.keys(divisionDataMap), k => k === key)) {
                throw new Error(`DivisionData request not expected for ${key}`);
            }

            return divisionDataMap[key];
        },
    }

    afterEach(() => {
        cleanUp(context);
    });

    async function renderComponent(appProps, route, address) {
        reportedError = null;
        context = await renderApp(
            { divisionApi },
            { name: 'Courage Scores' },
            {
                ...appProps,
                onError: (err) => {
                    if (err.message) {
                        reportedError = {
                            message: err.message,
                            stack: err.stack
                        };
                    } else {
                        reportedError = err;
                    }
                },
            },
            (<Division/>),
            route,
            address);
    }

    describe('when out of season', () => {
        const divisionId = createTemporaryId();

        it('renders prompt for season', async () => {
            divisionDataMap[divisionId] = {
                season: null,
                id: divisionId,
            };

            await renderComponent({
                divisions: [],
                seasons: [],
            }, '/division/:divisionId', `/division/${divisionId}`);

            expect(reportedError).toBeNull();
            const seasonSelection = context.container.querySelector('.btn-group .btn-group:nth-child(1)');
            const divisionSelection = context.container.querySelector('.btn-group .btn-group:nth-child(2)');
            expect(seasonSelection.textContent).toContain('Select a season');
            expect(seasonSelection.className).toContain('show');
            expect(divisionSelection.textContent).toContain('All divisions');
        });
    });

    describe('when in season', () => {
        const division = {
            id: createTemporaryId(),
            name: 'DIVISION',
        };
        const season = {
            id: createTemporaryId(),
            name: 'SEASON',
            divisions: [ division ],
            startDate: '2023-01-01',
            endDate: '2023-06-01',
        };

        describe('teams', () => {
            it('renders teams table via division id', async () => {
                divisionDataMap[division.id] = {
                    season: season,
                    id: division.id,
                    name: division.name,
                    teams: []
                };

                await renderComponent({
                    divisions: [ division ],
                    seasons: [ season ],
                }, '/division/:divisionId/:mode', `/division/${division.id}/teams`);

                expect(reportedError).toBeNull();
                const table = context.container.querySelector('.content-background table.table');
                const headings = Array.from(table.querySelectorAll('thead tr th'));
                expect(headings.map(th => th.textContent)).toEqual([ 'Venue', 'Played', 'Points', 'Won', 'Lost', 'Drawn', '+/-' ]);
            });

            it('renders teams table via division name', async () => {
                divisionDataMap[division.id] = {
                    season: season,
                    id: division.id,
                    name: division.name,
                    teams: []
                };

                await renderComponent({
                    divisions: [ division ],
                    seasons: [ season ],
                }, '/division/:divisionId/:mode', `/division/${division.name}/teams`);

                expect(reportedError).toBeNull();
                const table = context.container.querySelector('.content-background table.table');
                const headings = Array.from(table.querySelectorAll('thead tr th'));
                expect(headings.map(th => th.textContent)).toEqual([ 'Venue', 'Played', 'Points', 'Won', 'Lost', 'Drawn', '+/-' ]);
            });

            it('renders teams table within invalid division name', async () => {
                divisionDataMap[division.id] = {
                    season: season,
                    id: division.id,
                    name: division.name,
                    teams: []
                };

                await renderComponent({
                    divisions: [ division ],
                    seasons: [ season ],
                }, '/division/:divisionId/:mode', `/division/unknown/teams`);

                expect(reportedError).toBeNull();
                const content = context.container.querySelector('.content-background');
                expect(content.textContent).toEqual('No data found');
            });

            it('renders teams table via division and season name', async () => {
                divisionDataMap[division.id + ':' + season.id] = {
                    season: season,
                    id: division.id,
                    name: division.name,
                    teams: []
                };

                await renderComponent({
                    divisions: [ division ],
                    seasons: [ season ],
                }, '/division/:divisionId/:mode/:seasonId', `/division/${division.name}/teams/${season.name}`);

                expect(reportedError).toBeNull();
                const table = context.container.querySelector('.content-background table.table');
                const headings = Array.from(table.querySelectorAll('thead tr th'));
                expect(headings.map(th => th.textContent)).toEqual([ 'Venue', 'Played', 'Points', 'Won', 'Lost', 'Drawn', '+/-' ]);
            });

            it('renders teams table via season id', async () => {
                divisionDataMap[division.id + ':' + season.id] = {
                    season: season,
                    id: division.id,
                    name: division.name,
                    teams: []
                };

                await renderComponent({
                    divisions: [ division ],
                    seasons: [ season ],
                }, '/division/:divisionId/:mode/:seasonId', `/division/${division.id}/teams/${season.id}`);

                expect(reportedError).toBeNull();
                const table = context.container.querySelector('.content-background table.table');
                const headings = Array.from(table.querySelectorAll('thead tr th'));
                expect(headings.map(th => th.textContent)).toEqual([ 'Venue', 'Played', 'Points', 'Won', 'Lost', 'Drawn', '+/-' ]);
            });
        });

        describe('team', () => {
            const team = {
                id: createTemporaryId(),
                name: 'TEAM_NAME',
            };

            it('renders team details when provided with team id', async () => {
                divisionDataMap[division.id + ':' + season.id] = {
                    season: season,
                    id: division.id,
                    name: division.name,
                    fixtures: [],
                    players: [],
                    teams: [ team ],
                };

                await renderComponent({
                    divisions: [division],
                    seasons: [season],
                    teams: toMap([team]),
                }, '/division/:divisionId/:mode/:seasonId', `/division/${division.id}/team:${team.id}/${season.id}`);

                expect(reportedError).toBeNull();
                const heading = context.container.querySelector('.content-background h3');
                expect(heading.textContent).toEqual('TEAM_NAME 🔗');
            });

            it('renders team details when provided with team name', async () => {
                divisionDataMap[division.id + ':' + season.id] = {
                    season: season,
                    id: division.id,
                    name: division.name,
                    fixtures: [],
                    players: [],
                    teams: [ team ],
                };

                await renderComponent({
                    divisions: [division],
                    seasons: [season],
                    teams: toMap([team]),
                }, '/division/:divisionId/:mode/:seasonId', `/division/${division.name}/team:${team.name}/${season.name}`);

                expect(reportedError).toBeNull();
                const heading = context.container.querySelector('.content-background h3');
                expect(heading.textContent).toEqual('TEAM_NAME 🔗');
            });
        });

        describe('fixtures', () => {
            it('renders fixtures list via division id', async () => {
                divisionDataMap[division.id] = {
                    season: season,
                    id: division.id,
                    name: division.name,
                    fixtures: [],
                    teams: [],
                };

                await renderComponent({
                    divisions: [division],
                    seasons: [season],
                }, '/division/:divisionId/:mode', `/division/${division.id}/fixtures`);

                expect(reportedError).toBeNull();
                const content = context.container.querySelector('.content-background');
                expect(content.textContent).toContain('No fixtures, yet');
            });

            it('renders fixtures list via division name', async () => {
                divisionDataMap[division.id] = {
                    season: season,
                    id: division.id,
                    name: division.name,
                    fixtures: [],
                    teams: [],
                };

                await renderComponent({
                    divisions: [division],
                    seasons: [season],
                }, '/division/:divisionId/:mode', `/division/${division.name}/fixtures`);

                expect(reportedError).toBeNull();
                const content = context.container.querySelector('.content-background');
                expect(content.textContent).toContain('No fixtures, yet');
            });

            it('renders fixtures list via division and season name', async () => {
                divisionDataMap[division.id + ':' + season.id] = {
                    season: season,
                    id: division.id,
                    name: division.name,
                    fixtures: [],
                    teams: [],
                };

                await renderComponent({
                    divisions: [division],
                    seasons: [season],
                }, '/division/:divisionId/:mode/:seasonId', `/division/${division.name}/fixtures/${season.name}`);

                expect(reportedError).toBeNull();
                const content = context.container.querySelector('.content-background');
                expect(content.textContent).toContain('No fixtures, yet');
            });

            it('renders fixtures list via division and season id', async () => {
                divisionDataMap[division.id + ':' + season.id] = {
                    season: season,
                    id: division.id,
                    name: division.name,
                    fixtures: [],
                    teams: [],
                };

                await renderComponent({
                    divisions: [division],
                    seasons: [season],
                }, '/division/:divisionId/:mode/:seasonId', `/division/${division.id}/fixtures/${season.id}`);

                expect(reportedError).toBeNull();
                const content = context.container.querySelector('.content-background');
                expect(content.textContent).toContain('No fixtures, yet');
            });
        });

        describe('players', () => {
            it('renders players table via division id', async () => {
                divisionDataMap[division.id] = {
                    season: season,
                    id: division.id,
                    name: division.name,
                    players: []
                };

                await renderComponent({
                    divisions: [ division ],
                    seasons: [ season ],
                }, '/division/:divisionId/:mode', `/division/${division.id}/players`);

                expect(reportedError).toBeNull();
                const table = context.container.querySelector('.content-background table.table');
                const headings = Array.from(table.querySelectorAll('thead tr th'));
                expect(headings.map(th => th.textContent)).toEqual([ 'Rank', 'Player', 'Venue', 'Played', 'Won', 'Lost', 'Points', 'Win %', '180s', 'hi-check' ]);
            });

            it('renders players table via division name', async () => {
                divisionDataMap[division.id] = {
                    season: season,
                    id: division.id,
                    name: division.name,
                    players: []
                };

                await renderComponent({
                    divisions: [ division ],
                    seasons: [ season ],
                }, '/division/:divisionId/:mode', `/division/${division.name}/players`);

                expect(reportedError).toBeNull();
                const table = context.container.querySelector('.content-background table.table');
                const headings = Array.from(table.querySelectorAll('thead tr th'));
                expect(headings.map(th => th.textContent)).toEqual([ 'Rank', 'Player', 'Venue', 'Played', 'Won', 'Lost', 'Points', 'Win %', '180s', 'hi-check' ]);
            });

            it('renders players table via division and season name', async () => {
                divisionDataMap[division.id + ':' + season.id] = {
                    season: season,
                    id: division.id,
                    name: division.name,
                    players: []
                };

                await renderComponent({
                    divisions: [ division ],
                    seasons: [ season ],
                }, '/division/:divisionId/:mode/:seasonId', `/division/${division.name}/players/${season.name}`);

                expect(reportedError).toBeNull();
                const table = context.container.querySelector('.content-background table.table');
                const headings = Array.from(table.querySelectorAll('thead tr th'));
                expect(headings.map(th => th.textContent)).toEqual([ 'Rank', 'Player', 'Venue', 'Played', 'Won', 'Lost', 'Points', 'Win %', '180s', 'hi-check' ]);
            });

            it('renders players table via season id', async () => {
                divisionDataMap[division.id + ':' + season.id] = {
                    season: season,
                    id: division.id,
                    name: division.name,
                    players: []
                };

                await renderComponent({
                    divisions: [ division ],
                    seasons: [ season ],
                }, '/division/:divisionId/:mode/:seasonId', `/division/${division.name}/players/${season.id}`);

                expect(reportedError).toBeNull();
                const table = context.container.querySelector('.content-background table.table');
                const headings = Array.from(table.querySelectorAll('thead tr th'));
                expect(headings.map(th => th.textContent)).toEqual([ 'Rank', 'Player', 'Venue', 'Played', 'Won', 'Lost', 'Points', 'Win %', '180s', 'hi-check' ]);
            });
        });

        describe('player', () => {
            const team = {
                id: createTemporaryId(),
                name: 'TEAM_NAME',
            };
            const player = {
                id: createTemporaryId(),
                name: 'PLAYER_NAME',
                singles: {
                    matchesPlayed: 1,
                },
                teamId: team.id,
            };

            it('renders player details when provided with player id', async () => {
                divisionDataMap[division.id] = {
                    season: season,
                    id: division.id,
                    name: division.name,
                    players: [ player ],
                    teams: [ team ],
                    fixtures: [],
                };

                await renderComponent({
                    divisions: [ division ],
                    seasons: [ season ],
                }, '/division/:divisionId/:mode', `/division/${division.id}/player:${player.id}`);

                expect(reportedError).toBeNull();
                const heading = context.container.querySelector('.content-background h3');
                expect(heading.textContent).toContain('PLAYER_NAME');
            });

            it('renders player details when provided with player and team name', async () => {
                divisionDataMap[division.id] = {
                    season: season,
                    id: division.id,
                    name: division.name,
                    players: [ player ],
                    teams: [ team ],
                    fixtures: [],
                };

                await renderComponent({
                    divisions: [ division ],
                    seasons: [ season ],
                }, '/division/:divisionId/:mode', `/division/${division.name}/player:${player.name}@${team.name}`);

                expect(reportedError).toBeNull();
                const heading = context.container.querySelector('.content-background h3');
                expect(heading.textContent).toContain('PLAYER_NAME');
            });

            it('renders player details when provided with missing team', async () => {
                divisionDataMap[division.id] = {
                    season: season,
                    id: division.id,
                    name: division.name,
                    players: [ player ],
                    teams: [ team ],
                    fixtures: [],
                };

                await renderComponent({
                    divisions: [ division ],
                    seasons: [ season ],
                }, '/division/:divisionId/:mode', `/division/${division.name}/player:${player.name}@UNKNOWN_TEAM`);

                expect(reportedError).toBeNull();
                const heading = context.container.querySelector('.content-background h5');
                expect(heading.textContent).toContain('⚠ Player could not be found');
            });

            it('renders player details when provided with missing player', async () => {
                divisionDataMap[division.id] = {
                    season: season,
                    id: division.id,
                    name: division.name,
                    players: [ player ],
                    teams: [ team ],
                    fixtures: [],
                };

                await renderComponent({
                    divisions: [ division ],
                    seasons: [ season ],
                }, '/division/:divisionId/:mode', `/division/${division.name}/player:UNKNOWN_PLAYER@${team.name}`);

                expect(reportedError).toBeNull();
                const heading = context.container.querySelector('.content-background h5');
                expect(heading.textContent).toContain('⚠ Player could not be found');
            });

            it('renders player details when provided with malformed names', async () => {
                divisionDataMap[division.id] = {
                    season: season,
                    id: division.id,
                    name: division.name,
                    players: [ player ],
                    teams: [ team ],
                    fixtures: [],
                };

                await renderComponent({
                    divisions: [ division ],
                    seasons: [ season ],
                }, '/division/:divisionId/:mode', `/division/${division.name}/player:foo`);

                expect(reportedError).toBeNull();
                const heading = context.container.querySelector('.content-background h5');
                expect(heading.textContent).toContain('⚠ Player could not be found');
            });
        });

        describe('reports', () => {
            it('does not render tab when logged out', async () => {
                divisionDataMap[division.id] = {
                    season: season,
                    id: division.id,
                    name: division.name,
                    teams: [],
                };

                await renderComponent({
                    divisions: [ division ],
                    seasons: [ season ],
                }, '/division/:divisionId/:mode', `/division/${division.id}/teams`);

                expect(reportedError).toBeNull();
                const tabs = Array.from(context.container.querySelectorAll('.nav-tabs .nav-item'));
                expect(tabs.map(t => t.textContent)).not.toContain('Reports');
            });

            it('does not render tab when not permitted', async () => {
                divisionDataMap[division.id] = {
                    season: season,
                    id: division.id,
                    name: division.name,
                    teams: [],
                };

                await renderComponent({
                    divisions: [ division ],
                    seasons: [ season ],
                    account: {
                        access: {
                            runReports: false,
                        }
                    }
                }, '/division/:divisionId/:mode', `/division/${division.id}/teams`);

                expect(reportedError).toBeNull();
                const tabs = Array.from(context.container.querySelectorAll('.nav-tabs .nav-item'));
                expect(tabs.map(t => t.textContent)).not.toContain('Reports');
            });

            it('renders tab when permitted', async () => {
                divisionDataMap[division.id] = {
                    season: season,
                    id: division.id,
                    name: division.name,
                    teams: [],
                };

                await renderComponent({
                    divisions: [ division ],
                    seasons: [ season ],
                    account: {
                        access: {
                            runReports: true,
                        }
                    }
                }, '/division/:divisionId/:mode', `/division/${division.id}/teams`);

                expect(reportedError).toBeNull();
                const tabs = Array.from(context.container.querySelectorAll('.nav-tabs .nav-item'));
                expect(tabs.map(t => t.textContent)).toContain('Reports');
            });

            it('does not render reports content when not permitted', async () => {
                divisionDataMap[division.id] = {
                    season: season,
                    id: division.id,
                    name: division.name,
                    teams: [],
                };

                await renderComponent({
                    divisions: [ division ],
                    seasons: [ season ],
                    account: {
                        access: {
                            runReports: false,
                        }
                    }
                }, '/division/:divisionId/:mode', `/division/${division.id}/reports`);

                expect(reportedError).toBeNull();
                const button = context.container.querySelector('.btn.btn-primary');
                expect(button).toBeFalsy();
            });

            it('renders reports content when permitted', async () => {
                divisionDataMap[division.id] = {
                    season: season,
                    id: division.id,
                    name: division.name,
                    teams: [],
                };

                await renderComponent({
                    divisions: [ division ],
                    seasons: [ season ],
                    account: {
                        access: {
                            runReports: true,
                        }
                    }
                }, '/division/:divisionId/:mode', `/division/${division.id}/reports`);

                expect(reportedError).toBeNull();
                const button = context.container.querySelector('.btn.btn-primary');
                expect(button.textContent).toEqual('📊 Get reports...');
            });
        });

        describe('data errors', () => {
            it('renders data errors when permitted', async () => {
                divisionDataMap[division.id] = {
                    season: season,
                    id: division.id,
                    name: division.name,
                    teams: [],
                    dataErrors: [
                        'Some error'
                    ],
                };

                await renderComponent({
                    divisions: [ division ],
                    seasons: [ season ],
                    account: { },
                }, '/division/:divisionId/:mode', `/division/${division.id}/teams`);

                expect(reportedError).toBeNull();
                const heading = context.container.querySelector('h3');
                expect(heading.textContent).toEqual('⚠ Errors in division data');
            });

            it('does not render data errors when not permitted', async () => {
                divisionDataMap[division.id] = {
                    season: season,
                    id: division.id,
                    name: division.name,
                    teams: [],
                    dataErrors: [
                        'Some error'
                    ],
                };

                await renderComponent({
                    divisions: [ division ],
                    seasons: [ season ],
                }, '/division/:divisionId/:mode', `/division/${division.id}/teams`);

                expect(reportedError).toBeNull();
                const heading = context.container.querySelector('h3');
                expect(heading).toBeFalsy();
            });
        });

        describe('edge cases', () => {
            it('when a different division id is returned to requested', async () => {
                divisionDataMap[division.id] = {
                    season: season,
                    id: createTemporaryId(), // different id to requested
                    name: division.name,
                    teams: [],
                };
                console.log = () => {};

                await renderComponent({
                    divisions: [ division ],
                    seasons: [ season ],
                    account: { },
                }, '/division/:divisionId/:mode', `/division/${division.id}/teams`);

                expect(reportedError).toEqual(`Data for a different division returned, requested: ${division.id}`);
            });

            it('when a different season id is returned to requested', async () => {
                divisionDataMap[division.id + ':' + season.id] = {
                    season: {
                        id: createTemporaryId(),
                        name: 'ANOTHER SEASON',
                    },
                    id: division.id, // different id to requested
                    name: division.name,
                    teams: [],
                };
                console.log = () => {};

                await renderComponent({
                    divisions: [ division ],
                    seasons: [ season ],
                    account: { },
                }, '/division/:divisionId/:mode/:seasonId', `/division/${division.id}/teams/${season.id}`);

                expect(reportedError).toEqual(`Data for a different season returned, requested: ${season.id}`);
            });
        });
    });
});
