// noinspection JSUnresolvedFunction

import {cleanUp, renderApp, doClick, findButton, doSelectOption} from "../helpers/tests";
import {Division} from "./Division";
import React from "react";
import {any, toMap} from "../helpers/collections";
import {createTemporaryId} from "../helpers/projection";
import {renderDate} from "../helpers/rendering";

describe('Division', () => {
    let context;
    let reportedError;
    let divisionDataMap;
    let dataRequested;

    const divisionApi = {
        data: async (divisionId, seasonId) => {
            const key = `${divisionId}${seasonId ? ':' + seasonId : ''}`;

            if (!any(Object.keys(divisionDataMap), k => k === key)) {
                throw new Error(`DivisionData request not expected for ${key}`);
            }

            dataRequested.push({ divisionId, seasonId });
            return divisionDataMap[key];
        },
    };
    const seasonApi = {
        getHealth: async () => {
            return { success: true, checks: {}, messages: [], warnings: [], errors: [] };
        },
    };
    const gameApi = {
        update: async (data) => {
            return { success: true };
        },
        delete: async (data) => {
            return { success: true };
        }
    }

    afterEach(() => {
        cleanUp(context);
    });

    beforeEach(() => {
        dataRequested = [];
        divisionDataMap = {};
    })

    async function renderComponent(appProps, route, address) {
        reportedError = null;
        context = await renderApp(
            { divisionApi, seasonApi, gameApi },
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
                controls: true,
            }, '/division/:divisionId', `/division/${divisionId}`);

            expect(reportedError).toBeNull();
            const seasonSelection = context.container.querySelector('.btn-group .btn-group:nth-child(1)');
            const divisionSelection = context.container.querySelector('.btn-group .btn-group:nth-child(2)');
            expect(seasonSelection.textContent).toContain('Select a season');
            expect(seasonSelection.className).toContain('show');
            expect(divisionSelection.textContent).toContain('All divisions');
        });

        it('renders prompt for season when no controls', async () => {
            divisionDataMap[divisionId] = {
                season: null,
                id: divisionId,
            };

            await renderComponent({
                divisions: [],
                seasons: [],
                controls: false,
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

            it('renders team not found when provided no team name', async () => {
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
                }, '/division/:divisionId/:mode/:seasonId', `/division/${division.name}/team:/${season.name}`);

                expect(reportedError).toBeNull();
                const content = context.container.querySelector('.content-background');
                expect(content.textContent).toContain('⚠ Team could not be found');
            });

            it('renders team not found when provided with missing team', async () => {
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
                }, '/division/:divisionId/:mode/:seasonId', `/division/${division.name}/team:UNKNOWN_TEAM/${season.name}`);

                expect(reportedError).toBeNull();
                const content = context.container.querySelector('.content-background');
                expect(content.textContent).toContain('⚠ Team could not be found');
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

            it('renders player not found when provided with missing team', async () => {
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

            it('renders player not found when provided with missing player', async () => {
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

            it('renders player not found when provided no player name', async () => {
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
                }, '/division/:divisionId/:mode', `/division/${division.name}/player:`);

                expect(reportedError).toBeNull();
                const heading = context.container.querySelector('.content-background h5');
                expect(heading.textContent).toContain('⚠ Player could not be found');
            });

            it('renders player not found when provided with malformed names', async () => {
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
                    },
                    controls: true,
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

        describe('health', () => {
            it('does not health tab when logged out', async () => {
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
                expect(tabs.map(t => t.textContent)).not.toContain('Health');
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
                            runHealthChecks: false,
                        }
                    }
                }, '/division/:divisionId/:mode', `/division/${division.id}/teams`);

                expect(reportedError).toBeNull();
                const tabs = Array.from(context.container.querySelectorAll('.nav-tabs .nav-item'));
                expect(tabs.map(t => t.textContent)).not.toContain('Health');
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
                            runHealthChecks: true,
                        }
                    },
                    controls: true,
                }, '/division/:divisionId/:mode', `/division/${division.id}/teams`);

                expect(reportedError).toBeNull();
                const tabs = Array.from(context.container.querySelectorAll('.nav-tabs .nav-item'));
                expect(tabs.map(t => t.textContent)).toContain('Health');
            });

            it('does not render health content when not permitted', async () => {
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
                            runHealthChecks: false,
                        }
                    }
                }, '/division/:divisionId/:mode', `/division/${division.id}/health`);

                expect(reportedError).toBeNull();
                const button = context.container.querySelector('.btn.btn-primary');
                expect(button).toBeFalsy();
            });

            it('renders health content when permitted', async () => {
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
                            runHealthChecks: true,
                        }
                    }
                }, '/division/:divisionId/:mode', `/division/${division.id}/health`);

                expect(reportedError).toBeNull();
                const component = context.container.querySelector('div[datatype="health"]');
                expect(component).toBeTruthy();
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

            it('can hide data errors', async () => {
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
                const heading = context.container.querySelector('h3');
                expect(heading.textContent).toEqual('⚠ Errors in division data');

                await doClick(findButton(context.container, 'Hide errors'));

                expect(context.container.querySelector('h3')).toBeFalsy();
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

            it('renders no data for invalid division name', async () => {
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

            it('renders no data when season not found', async () => {
                await renderComponent({
                    divisions: [ division ],
                    seasons: [ season ],
                }, '/division/:divisionId/:mode/:seasonId', `/division/${division.id}/teams/UNKNOWN`);

                expect(reportedError).toBeNull();
                const content = context.container.querySelector('.content-background');
                expect(content.textContent).toEqual('No data found');
            });

            it('renders no data when no divisions', async () => {
                await renderComponent({
                    divisions: [ ],
                    seasons: [ season ],
                }, '/division/:divisionId/:mode', `/division/${division.name}/teams`);

                expect(reportedError).toBeNull();
                const content = context.container.querySelector('.content-background');
                expect(content.className).toContain('loading-background');
            });

            it('renders error when data returns with a status code with errors', async () => {
                divisionDataMap[division.id] = {
                    status: 500,
                    errors: {
                        key1: 'some error1',
                        key2: 'some error2',
                    },
                };
                console.log = () => {};

                await renderComponent({
                    divisions: [ division ],
                    seasons: [ season ],
                }, '/division/:divisionId/:mode', `/division/${division.id}/teams`);

                expect(reportedError).toEqual('Error accessing division: Code: 500 -- key1: some error1, key2: some error2');
            });

            it('renders error when data returns with a status code without errors', async () => {
                divisionDataMap[division.id] = {
                    status: 500,
                };
                console.log = () => {};

                await renderComponent({
                    divisions: [ division ],
                    seasons: [ season ],
                }, '/division/:divisionId/:mode', `/division/${division.id}/teams`);

                expect(reportedError).toEqual('Error accessing division: Code: 500');
            });

            it('reloads division data when fixture created', async () => {
                const homeTeam = {
                    id: createTemporaryId(),
                    name: 'HOME',
                    seasons: [{ seasonId: season.id, players: [] }],
                };
                const awayTeam = {
                    id: createTemporaryId(),
                    name: 'AWAY',
                    seasons: [{ seasonId: season.id, players: [] }],
                };
                const fixture = {
                    id: homeTeam.id,
                    date: '2023-07-01',
                    homeTeam: homeTeam,
                    awayTeam: null,
                    isKnockout: true,
                    fixturesUsingAddress: [],
                };
                divisionDataMap[division.id] = {
                    season: season,
                    id: division.id,
                    name: division.name,
                    fixtures: [ {
                        date: fixture.date,
                        fixtures: [ fixture ],
                        tournamentFixtures: [],
                        notes: [],
                    }],
                    teams: [],
                };
                await renderComponent({
                    divisions: [ division ],
                    seasons: [ season ],
                    account: {
                        access: {
                            manageGames: true,
                        }
                    },
                    teams: [ homeTeam, awayTeam ],
                }, '/division/:divisionId/:mode', `/division/${division.id}/fixtures`);
                expect(dataRequested).toEqual([
                    { divisionId: division.id, seasonId: null },
                ]); // data loaded once
                expect(reportedError).toBeNull();
                const fixtureContainer = context.container.querySelector('div[data-fixture-date="2023-07-01"]').parentElement;

                await doSelectOption(fixtureContainer.querySelector('.dropdown-menu'), 'AWAY');
                await doClick(findButton(fixtureContainer, '💾'));

                expect(reportedError).toBeNull();
                expect(dataRequested).toEqual([
                    { divisionId: division.id, seasonId: null },
                    { divisionId: division.id, seasonId: null },
                ]); // data loaded twice
            });

            it('reloads division data when fixture deleted', async () => {
                const homeTeam = {
                    id: createTemporaryId(),
                    name: 'HOME',
                    seasons: [{ seasonId: season.id, players: [] }],
                };
                const awayTeam = {
                    id: createTemporaryId(),
                    name: 'AWAY',
                    seasons: [{ seasonId: season.id, players: [] }],
                };
                const fixture = {
                    id: createTemporaryId(),
                    date: '2023-07-01',
                    homeTeam: homeTeam,
                    awayTeam: awayTeam,
                    isKnockout: true,
                    fixturesUsingAddress: [],
                };
                divisionDataMap[division.id] = {
                    season: season,
                    id: division.id,
                    name: division.name,
                    fixtures: [ {
                        date: fixture.date,
                        fixtures: [ fixture ],
                        tournamentFixtures: [],
                        notes: [],
                    }],
                    teams: [],
                };
                await renderComponent({
                    divisions: [ division ],
                    seasons: [ season ],
                    account: {
                        access: {
                            manageGames: true,
                        }
                    },
                    teams: [ homeTeam, awayTeam ],
                }, '/division/:divisionId/:mode', `/division/${division.id}/fixtures`);
                expect(dataRequested).toEqual([
                    { divisionId: division.id, seasonId: null },
                ]); // data loaded once
                expect(reportedError).toBeNull();
                const fixtureContainer = context.container.querySelector('div[data-fixture-date="2023-07-01"]').parentElement;
                window.confirm = () => true;

                await doClick(findButton(fixtureContainer, '🗑'));

                expect(reportedError).toBeNull();
                expect(dataRequested).toEqual([
                    { divisionId: division.id, seasonId: null },
                    { divisionId: division.id, seasonId: null },
                ]); // data loaded twice
            });
        });
    });

    describe('rendering options', () => {
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

        it('does show division controls when not denied', async () => {
            divisionDataMap[division.id] = {
                season: season,
                id: division.id,
                name: division.name,
                teams: []
            };

            await renderComponent({
                divisions: [ division ],
                seasons: [ season ],
                controls: true,
            }, '/division/:divisionId/:mode', `/division/${division.id}/teams`);

            expect(reportedError).toBeNull();
            expect(context.container.querySelector('.btn-group')).toBeTruthy();
            expect(context.container.innerHTML).toContain(`${season.name} (${renderDate(season.startDate)} - ${renderDate(season.endDate)})`);
            expect(context.container.innerHTML).toContain(division.name);
        });

        it('does show tabs when not denied', async () => {
            divisionDataMap[division.id] = {
                season: season,
                id: division.id,
                name: division.name,
                teams: []
            };

            await renderComponent({
                divisions: [ division ],
                seasons: [ season ],
                controls: true,
            }, '/division/:divisionId/:mode', `/division/${division.id}/teams`);

            expect(reportedError).toBeNull();
            expect(context.container.querySelector('.nav-tabs')).toBeTruthy();
            expect(context.container.innerHTML).toContain('Teams');
            expect(context.container.innerHTML).toContain('Fixtures');
            expect(context.container.innerHTML).toContain('Players');
        });

        it('does not show division controls when instructed', async () => {
            divisionDataMap[division.id] = {
                season: season,
                id: division.id,
                name: division.name,
                teams: []
            };

            await renderComponent({
                divisions: [ division ],
                seasons: [ season ],
                controls: false,
            }, '/division/:divisionId/:mode', `/division/${division.id}/teams`);

            expect(reportedError).toBeNull();
            expect(context.container.querySelector('.btn-group')).toBeFalsy();
        });

        it('does not show tabs when instructed', async () => {
            divisionDataMap[division.id] = {
                season: season,
                id: division.id,
                name: division.name,
                teams: []
            };

            await renderComponent({
                divisions: [ division ],
                seasons: [ season ],
                controls: false,
            }, '/division/:divisionId/:mode', `/division/${division.id}/teams`);

            expect(reportedError).toBeNull();
            expect(context.container.querySelector('.nav-tabs')).toBeFalsy();
        });
    })
});
