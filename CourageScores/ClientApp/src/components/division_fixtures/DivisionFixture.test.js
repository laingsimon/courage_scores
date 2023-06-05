// noinspection JSUnresolvedFunction

import {cleanUp, renderApp, doClick, findButton} from "../../helpers/tests";
import {renderDate} from "../../helpers/rendering";
import {createTemporaryId} from "../../helpers/projection";
import {toMap} from "../../helpers/collections";
import React from "react";
import {DivisionFixture} from "./DivisionFixture";
import {DivisionDataContainer} from "../DivisionDataContainer";

describe('DivisionFixture', () => {
    let context;
    let reportedError;
    let divisionReloaded;
    let updatedFixtures;
    let beforeReloadDivision;
    let savedFixture;
    let deletedFixture;

    const gameApi = {
        update: async (fixture, lastUpdated) => {
            savedFixture = { fixture, lastUpdated };
            return { success: true };
        },
        delete: async (id) => {
            deletedFixture = id;
            return { success: true };
        }
    }

    function onReloadDivision() {
        divisionReloaded = true;

        if (!beforeReloadDivision) {
            throw new Error('Reload Division called before beforeReloadDivision');
        }
    }

    function onBeforeReloadDivision() {
        beforeReloadDivision = true;
    }

    afterEach(() => {
        cleanUp(context);
    });

    async function renderComponent(props, divisionData, account, teams) {
        reportedError = null;
        divisionReloaded = false;
        updatedFixtures = null;
        beforeReloadDivision = null;
        savedFixture = null;
        deletedFixture = null;
        context = await renderApp(
            { gameApi },
            {
                onError: (err) => {
                    reportedError = {
                        message: err.message,
                        stack: err.stack
                    };
                },
                account,
                teams,
            },
            (<DivisionDataContainer {...divisionData} onReloadDivision={onReloadDivision}>
                <DivisionFixture
                    {...props}
                    beforeReloadDivision={onBeforeReloadDivision}
                    onUpdateFixtures={(data) => updatedFixtures = data} />
            </DivisionDataContainer>),
            null,
            null,
            'tbody');
    }

    describe('when logged out', () => {
        const season = {
            id: createTemporaryId(),
            name: 'SEASON',
        };
        const division = {
            id: createTemporaryId(),
            name: 'DIVISION',
        };
        const team = {
            id: createTemporaryId(),
            name: 'TEAM',
        };
        const account = null;

        it('renders unplayed fixture', async () => {
            const date = '2023-05-06T00:00:00';
            const fixture = {
                id: createTemporaryId(),
                date: date,
                homeTeam: {
                    id: createTemporaryId(),
                    name: 'HOME',
                },
                awayTeam: {
                    id: createTemporaryId(),
                    name: 'AWAY',
                },
            };
            await renderComponent(
                { fixture, date, readOnly: false },
                { id: division.id, fixtures: [ { date, fixtures: [ fixture ] } ], season, teams: [ team ] },
                account,
                toMap([ team ]));

            expect(reportedError).toBeNull();
            const cells = Array.from(context.container.querySelectorAll('td'));
            const cellText = cells.map(td => td.textContent);
            expect(cellText).toEqual(['HOME', '', 'vs', '', 'AWAY']);
            const linkToHome = cells[0].querySelector('a');
            expect(linkToHome.href).toEqual(`http://localhost/score/${fixture.id}`);
            const linkToAway = cells[4].querySelector('a');
            expect(linkToAway.href).toEqual(`http://localhost/score/${fixture.id}`);
        });

        it('renders postponed fixture', async () => {
            const date = '2023-05-06T00:00:00';
            const fixture = {
                id: createTemporaryId(),
                date: date,
                homeTeam: {
                    id: createTemporaryId(),
                    name: 'HOME',
                },
                awayTeam: {
                    id: createTemporaryId(),
                    name: 'AWAY',
                },
                postponed: true
            };
            await renderComponent(
                { fixture, date, readOnly: false },
                { id: division.id, fixtures: [ { date, fixtures: [ fixture ] } ], season, teams: [ team ] },
                account,
                toMap([ team ]));

            expect(reportedError).toBeNull();
            const cells = Array.from(context.container.querySelectorAll('td'));
            const cellText = cells.map(td => td.textContent);
            expect(cellText).toEqual(['HOME', 'P', 'vs', 'P', 'AWAY']);
            const linkToHome = cells[0].querySelector('a');
            expect(linkToHome.href).toEqual(`http://localhost/score/${fixture.id}`);
            const linkToAway = cells[4].querySelector('a');
            expect(linkToAway.href).toEqual(`http://localhost/score/${fixture.id}`);
        });

        it('renders qualifier fixture', async () => {
            const date = '2023-05-06T00:00:00';
            const fixture = {
                id: createTemporaryId(),
                date: date,
                homeTeam: {
                    id: createTemporaryId(),
                    name: 'HOME',
                },
                awayTeam: {
                    id: createTemporaryId(),
                    name: 'AWAY',
                },
                isKnockout: true
            };
            await renderComponent(
                { fixture, date, readOnly: false },
                { id: division.id, fixtures: [ { date, fixtures: [ fixture ] } ], season, teams: [ team ] },
                account,
                toMap([ team ]));

            expect(reportedError).toBeNull();
            const cells = Array.from(context.container.querySelectorAll('td'));
            const cellText = cells.map(td => td.textContent);
            expect(cellText).toEqual(['HOME', '', 'vs', '', 'AWAY']);
            const linkToHome = cells[0].querySelector('a');
            expect(linkToHome.href).toEqual(`http://localhost/score/${fixture.id}`);
            const linkToAway = cells[4].querySelector('a');
            expect(linkToAway.href).toEqual(`http://localhost/score/${fixture.id}`);
        });

        it('renders bye', async () => {
            const date = '2023-05-06T00:00:00';
            const fixture = {
                id: createTemporaryId(),
                date: date,
                homeTeam: {
                    id: createTemporaryId(),
                    name: 'HOME',
                }
            };
            await renderComponent(
                { fixture, date, readOnly: false },
                { id: division.id, fixtures: [ { date, fixtures: [ fixture ] } ], season, teams: [ team ] },
                account,
                toMap([ team ]));

            expect(reportedError).toBeNull();
            const cells = Array.from(context.container.querySelectorAll('td'));
            const cellText = cells.map(td => td.textContent);
            expect(cellText).toEqual(['HOME', '', 'vs', '', 'Bye']);
            const linkToHome = cells[0].querySelector('a');
            expect(linkToHome.href).toEqual(`http://localhost/division/${division.id}/team:${fixture.homeTeam.id}/${season.id}`);
            const linkToAway = cells[4].querySelector('a');
            expect(linkToAway).toBeFalsy();
        });
    });

    describe('when logged in', () => {
        const season = {
            id: createTemporaryId(),
            name: 'SEASON',
        };
        const division = {
            id: createTemporaryId(),
            name: 'DIVISION',
        };
        const homeTeam = {
            id: createTemporaryId(),
            name: 'HOME',
            address: 'HOME ADDRESS',
            seasons: [{
                seasonId: season.id,
                divisionId: division.id,
                players: [],
            }],
        };
        const awayTeam = {
            id: createTemporaryId(),
            name: 'AWAY',
            address: 'AWAY ADDRESS',
            seasons: [{
                seasonId: season.id,
                divisionId: division.id,
                players: [],
            }],
        };
        const account = {
            access: {
                manageGames: true,
            }
        };

        it('renders unplayed fixture', async () => {
            const date = '2023-05-06T00:00:00';
            const fixture = {
                id: createTemporaryId(),
                date: date,
                homeTeam: homeTeam,
                awayTeam: awayTeam,
            };
            await renderComponent(
                { fixture, date, readOnly: false },
                { id: division.id, fixtures: [ { date, fixtures: [ fixture ] } ], season, teams: [ homeTeam, awayTeam ] },
                account,
                toMap([ homeTeam, awayTeam ]));

            expect(reportedError).toBeNull();
            const cells = Array.from(context.container.querySelectorAll('td'));
            const cellText = cells.map(td => td.textContent);
            expect(cellText).toEqual(['HOME', '', 'vs', '', 'AWAYAWAY', '🗑']);
            const linkToHome = cells[0].querySelector('a');
            expect(linkToHome.href).toEqual(`http://localhost/score/${fixture.id}`);
        });

        it('renders postponed fixture', async () => {
            const date = '2023-05-06T00:00:00';
            const fixture = {
                id: createTemporaryId(),
                date: date,
                homeTeam: homeTeam,
                awayTeam: awayTeam,
                postponed: true
            };
            await renderComponent(
                { fixture, date, readOnly: false },
                { id: division.id, fixtures: [ { date, fixtures: [ fixture ] } ], season, teams: [ homeTeam, awayTeam ] },
                account,
                toMap([ homeTeam, awayTeam ]));

            expect(reportedError).toBeNull();
            const cells = Array.from(context.container.querySelectorAll('td'));
            const cellText = cells.map(td => td.textContent);
            expect(cellText).toEqual(['HOME', 'P', 'vs', 'P', 'AWAYAWAY', '🗑']);
            const linkToHome = cells[0].querySelector('a');
            expect(linkToHome.href).toEqual(`http://localhost/score/${fixture.id}`);
        });

        it('renders qualifier fixture', async () => {
            const date = '2023-05-06T00:00:00';
            const fixture = {
                id: createTemporaryId(),
                date: date,
                homeTeam: homeTeam,
                awayTeam: awayTeam,
                isKnockout: true
            };
            await renderComponent(
                { fixture, date, readOnly: false },
                { id: division.id, fixtures: [ { date, fixtures: [ fixture ] } ], season, teams: [ homeTeam, awayTeam ] },
                account,
                toMap([ homeTeam, awayTeam ]));

            expect(reportedError).toBeNull();
            const cells = Array.from(context.container.querySelectorAll('td'));
            const cellText = cells.map(td => td.textContent);
            expect(cellText).toEqual(['HOME', '', 'vs', '', 'AWAYAWAY', '🗑']);
            const linkToHome = cells[0].querySelector('a');
            expect(linkToHome.href).toEqual(`http://localhost/score/${fixture.id}`);
        });

        it('renders bye', async () => {
            const date = '2023-05-06T00:00:00';
            const fixture = {
                id: createTemporaryId(),
                date: date,
                homeTeam: homeTeam,
            };
            await renderComponent(
                { fixture, date, readOnly: false },
                { id: division.id, fixtures: [ { date, fixtures: [ fixture ] } ], season, teams: [ homeTeam, awayTeam ] },
                account,
                toMap([ homeTeam, awayTeam ]));

            expect(reportedError).toBeNull();
            const cells = Array.from(context.container.querySelectorAll('td'));
            const cellText = cells.map(td => td.textContent);
            expect(cellText).toEqual(['HOME', '', 'vs', '', 'AWAY', '']);
            const linkToHome = cells[0].querySelector('a');
            expect(linkToHome.href).toEqual(`http://localhost/division/${division.id}/team:${fixture.homeTeam.id}/${season.id}`);
        });

        it('renders unselectable away team with same address (league fixture)', async () => {
            const date = '2023-05-06T00:00:00';
            const anotherTeamAtHomeAddress = {
                id: createTemporaryId(),
                name: 'ANOTHER TEAM',
                address: 'HOME ADDRESS',
                seasons: [],
            };
            const fixture = {
                id: createTemporaryId(),
                date: date,
                homeTeam: homeTeam,
            };
            await renderComponent(
                { fixture, date, readOnly: false },
                { id: division.id, fixtures: [ { date, fixtures: [ fixture ] } ], season, teams: [ homeTeam, awayTeam, anotherTeamAtHomeAddress ] },
                account,
                toMap([ homeTeam, awayTeam, anotherTeamAtHomeAddress ]));

            expect(reportedError).toBeNull();
            const awayCell = context.container.querySelector('td:nth-child(5)');
            expect(awayCell.textContent).toContain('🚫 ANOTHER TEAM (Same address)');
        });

        it('renders unselectable away team playing elsewhere (league fixture)', async () => {
            const date = '2023-05-06T00:00:00';
            const fixture = {
                id: createTemporaryId(),
                date: date,
                homeTeam: homeTeam,
            };
            const anotherFixture = {
                id: createTemporaryId(),
                date: date,
                homeTeam: homeTeam,
                awayTeam: awayTeam,
            };
            await renderComponent(
                { fixture, date, readOnly: false },
                { id: division.id, fixtures: [ { date, fixtures: [ fixture, anotherFixture ] } ], season, teams: [ homeTeam, awayTeam ] },
                account,
                toMap([ homeTeam, awayTeam ]));

            expect(reportedError).toBeNull();
            const awayCell = context.container.querySelector('td:nth-child(5)');
            expect(awayCell.textContent).toContain('🚫 AWAY (Already playing against HOME)');
        });

        it('renders unselectable away team played fixture previously (league fixture)', async () => {
            const fixture = {
                id: createTemporaryId(),
                date: '2023-05-06T00:00:00',
                homeTeam: homeTeam,
            };
            const anotherFixture = {
                id: createTemporaryId(),
                date: '2023-05-13T00:00:00',
                homeTeam: homeTeam,
                awayTeam: awayTeam,
                isKnockout: false,
            };
            await renderComponent(
                { fixture, date: fixture.date, readOnly: false },
                {
                    id: division.id,
                    fixtures: [
                        { date: fixture.date, fixtures: [ fixture ] },
                        { date: anotherFixture.date, fixtures: [ anotherFixture ] } ],
                    season,
                    teams: [ homeTeam, awayTeam ] },
                account,
                toMap([ homeTeam, awayTeam ]));

            expect(reportedError).toBeNull();
            const awayCell = context.container.querySelector('td:nth-child(5)');
            expect(awayCell.textContent).toContain(`🚫 AWAY (Already playing same leg on ${renderDate(anotherFixture.date)})`);
        });

        it('renders selectable away team when away team is playing a qualifier on another date', async () => {
            const fixture = {
                id: createTemporaryId(),
                date: '2023-05-06T00:00:00',
                homeTeam: homeTeam,
            };
            const anotherFixture = {
                id: createTemporaryId(),
                date: '2023-05-13T00:00:00',
                homeTeam: homeTeam,
                awayTeam: awayTeam,
                isKnockout: true,
            };
            await renderComponent(
                { fixture, date: fixture.date, readOnly: false },
                {
                    id: division.id,
                    fixtures: [
                        { date: fixture.date, fixtures: [ fixture ] },
                        { date: anotherFixture.date, fixtures: [ anotherFixture ] } ],
                    season,
                    teams: [ homeTeam, awayTeam ] },
                account,
                toMap([ homeTeam, awayTeam ]));

            expect(reportedError).toBeNull();
            const awayCell = context.container.querySelector('td:nth-child(5)');
            expect(awayCell.textContent).toEqual(`AWAY`);
        });

        it('renders selectable away team with same address (qualifier)', async () => {
            const date = '2023-05-06T00:00:00';
            const fixture = {
                id: createTemporaryId(),
                date: date,
                homeTeam: homeTeam,
                isKnockout: true,
            };
            const anotherTeamAtHomeAddress = {
                id: createTemporaryId(),
                name: 'ANOTHER TEAM',
                address: 'HOME ADDRESS',
                seasons: [{
                    seasonId: season.id,
                    divisionId: division.id,
                    players: [],
                }],
            };
            await renderComponent(
                { fixture, date, readOnly: false },
                { id: division.id, fixtures: [ { date, fixtures: [ fixture ] } ], season, teams: [ homeTeam, awayTeam, anotherTeamAtHomeAddress ] },
                account,
                toMap([ homeTeam, awayTeam, anotherTeamAtHomeAddress ]));

            expect(reportedError).toBeNull();
            const awayCell = context.container.querySelector('td:nth-child(5)');
            expect(awayCell.textContent).toEqual(`AWAYANOTHER TEAM`);
        });

        it('renders unselectable away team playing elsewhere (qualifier)', async () => {
            const date = '2023-05-06T00:00:00';
            const fixture = {
                id: createTemporaryId(),
                date: date,
                homeTeam: homeTeam,
                isKnockout: true,
            };
            const anotherFixture = {
                id: createTemporaryId(),
                date: date,
                homeTeam: homeTeam,
                awayTeam: awayTeam,
                isKnockout: true,
            };
            await renderComponent(
                { fixture, date, readOnly: false },
                { id: division.id, fixtures: [ { date, fixtures: [ fixture, anotherFixture ] } ], season, teams: [ homeTeam, awayTeam ] },
                account,
                toMap([ homeTeam, awayTeam ]));

            expect(reportedError).toBeNull();
            const awayCell = context.container.querySelector('td:nth-child(5)');
            expect(awayCell.textContent).toContain('🚫 AWAY (Already playing against HOME)');
        });

        it('renders unselectable away team played fixture previously (qualifier)', async () => {
            const fixture = {
                id: createTemporaryId(),
                date: '2023-05-06T00:00:00',
                homeTeam: homeTeam,
                isKnockout: true,
            };
            const anotherFixture = {
                id: createTemporaryId(),
                date: '2023-05-13T00:00:00',
                homeTeam: homeTeam,
                awayTeam: awayTeam,
                isKnockout: true,
            };
            await renderComponent(
                { fixture, date: fixture.date, readOnly: false },
                {
                    id: division.id,
                    fixtures: [
                        { date: fixture.date, fixtures: [ fixture ] },
                        { date: anotherFixture.date, fixtures: [ anotherFixture ] } ],
                    season,
                    teams: [ homeTeam, awayTeam ] },
                account,
                toMap([ homeTeam, awayTeam ]));

            expect(reportedError).toBeNull();
            const awayCell = context.container.querySelector('td:nth-child(5)');
            expect(awayCell.textContent).toEqual('AWAY');
        });

        it('can change away team', async () => {
            const date = '2023-05-06T00:00:00';
            const anotherTeam = {
                id: createTemporaryId(),
                name: 'ANOTHER TEAM',
                address: 'ANOTHER ADDRESS',
                seasons: [],
            };
            const fixture = {
                id: createTemporaryId(),
                date: date,
                homeTeam: homeTeam,
            };
            await renderComponent(
                { fixture, date, readOnly: false },
                { id: division.id, fixtures: [ { date, fixtures: [ fixture ] } ], season, teams: [ homeTeam, awayTeam, anotherTeam ] },
                account,
                toMap([ homeTeam, awayTeam, anotherTeam ]));
            const awayCell = context.container.querySelector('td:nth-child(5)');

            await doClick(findButton(awayCell.querySelector('.dropdown-menu'), 'ANOTHER TEAM'));

            expect(reportedError).toBeNull();
            expect(updatedFixtures).not.toBeNull();
            expect(updatedFixtures([ { date, fixtures: [ fixture ] } ])).toEqual([{
                date,
                fixtures: [ {
                    id: fixture.id,
                    date,
                    homeTeam,
                    awayTeam: {
                        id: anotherTeam.id,
                        name: anotherTeam.name,
                    },
                    originalAwayTeamId: 'unset',
                } ]
            }]);
        });

        it('can change away team for qualifiers', async () => {
            const date = '2023-05-06T00:00:00';
            const anotherTeam = {
                id: createTemporaryId(),
                name: 'ANOTHER TEAM',
                address: 'ANOTHER ADDRESS',
                seasons: [],
            };
            const fixture = {
                id: createTemporaryId(),
                date: date,
                homeTeam: homeTeam,
            };
            await renderComponent(
                { fixture, date, readOnly: false },
                {
                    id: division.id,
                    fixtures: [ { date, fixtures: [ fixture ], isKnockout: true } ],
                    season,
                    teams: [ homeTeam, awayTeam, anotherTeam ]
                },
                account,
                toMap([ homeTeam, awayTeam, anotherTeam ]));
            const awayCell = context.container.querySelector('td:nth-child(5)');

            await doClick(findButton(awayCell.querySelector('.dropdown-menu'), 'ANOTHER TEAM'));

            expect(reportedError).toBeNull();
            expect(updatedFixtures).not.toBeNull();
            expect(updatedFixtures([ { date, fixtures: [ fixture ], isKnockout: true } ])).toEqual([{
                date,
                fixtures: [ {
                    date,
                    homeTeam,
                    awayTeam: {
                        id: anotherTeam.id,
                        name: anotherTeam.name,
                    },
                    id: fixture.id,
                    originalAwayTeamId: 'unset',
                } ],
                isKnockout: true,
            }]);
        });

        it('can save league fixture change', async () => {
            const date = '2023-05-06T00:00:00';
            const anotherTeam = {
                id: createTemporaryId(),
                name: 'ANOTHER TEAM',
                address: 'ANOTHER ADDRESS',
                seasons: [],
            };
            const fixture = {
                id: createTemporaryId(),
                date: date,
                homeTeam: homeTeam,
                awayTeam: awayTeam,
                originalAwayTeamId: 'unset',
            };
            await renderComponent(
                { fixture, date, readOnly: false },
                { id: division.id, fixtures: [ { date, fixtures: [ fixture ] } ], season, teams: [ homeTeam, awayTeam, anotherTeam ] },
                account,
                toMap([ homeTeam, awayTeam, anotherTeam ]));
            const saveCell = context.container.querySelector('td:nth-child(6)');
            expect(saveCell.textContent).toContain('💾');

            await doClick(findButton(saveCell, '💾'));

            expect(reportedError).toBeNull();
            expect(savedFixture).not.toBeNull();
            expect(beforeReloadDivision).toEqual(true);
            expect(divisionReloaded).toEqual(true);
        });

        it('can save qualifier change', async () => {
            const date = '2023-05-06T00:00:00';
            const anotherTeam = {
                id: createTemporaryId(),
                name: 'ANOTHER TEAM',
                address: 'ANOTHER ADDRESS',
                seasons: [],
            };
            const fixture = {
                id: createTemporaryId(),
                date: date,
                homeTeam: homeTeam,
                awayTeam: awayTeam,
                originalAwayTeamId: 'unset',
                isKnockout: true,
            };
            await renderComponent(
                { fixture, date, readOnly: false },
                { id: division.id, fixtures: [ { date, fixtures: [ fixture ] } ], season, teams: [ homeTeam, awayTeam, anotherTeam ] },
                account,
                toMap([ homeTeam, awayTeam, anotherTeam ]));
            const saveCell = context.container.querySelector('td:nth-child(6)');
            expect(saveCell.textContent).toContain('💾');

            await doClick(findButton(saveCell, '💾'));

            expect(reportedError).toBeNull();
            expect(savedFixture).not.toBeNull();
            expect(beforeReloadDivision).toEqual(true);
            expect(divisionReloaded).toEqual(true);
        });

        it('can delete league fixture', async () => {
            const date = '2023-05-06T00:00:00';
            const anotherTeam = {
                id: createTemporaryId(),
                name: 'ANOTHER TEAM',
                address: 'ANOTHER ADDRESS',
                seasons: [],
            };
            const fixture = {
                id: createTemporaryId(),
                date: date,
                homeTeam: homeTeam,
                awayTeam: awayTeam,
            };
            await renderComponent(
                { fixture, date, readOnly: false },
                { id: division.id, fixtures: [ { date, fixtures: [ fixture ] } ], season, teams: [ homeTeam, awayTeam, anotherTeam ] },
                account,
                toMap([ homeTeam, awayTeam, anotherTeam ]));
            const saveCell = context.container.querySelector('td:nth-child(6)');
            expect(saveCell.textContent).toContain('🗑');
            let confirm;
            window.confirm = (message) => { confirm = message; return true; }

            await doClick(findButton(saveCell, '🗑'));

            expect(reportedError).toBeNull();
            expect(confirm).toEqual('Are you sure you want to delete this fixture?\n\nHOME vs AWAY');
            expect(deletedFixture).toEqual(fixture.id);
            expect(beforeReloadDivision).toEqual(true);
            expect(divisionReloaded).toEqual(true);
        });

        it('can delete qualifier', async () => {
            const date = '2023-05-06T00:00:00';
            const anotherTeam = {
                id: createTemporaryId(),
                name: 'ANOTHER TEAM',
                address: 'ANOTHER ADDRESS',
                seasons: [],
            };
            const fixture = {
                id: createTemporaryId(),
                date: date,
                homeTeam: homeTeam,
                awayTeam: awayTeam,
                isKnockout: true,
            };
            await renderComponent(
                { fixture, date, readOnly: false },
                { id: division.id, fixtures: [ { date, fixtures: [ fixture ] } ], season, teams: [ homeTeam, awayTeam, anotherTeam ] },
                account,
                toMap([ homeTeam, awayTeam, anotherTeam ]));
            const saveCell = context.container.querySelector('td:nth-child(6)');
            expect(saveCell.textContent).toContain('🗑');
            let confirm;
            window.confirm = (message) => { confirm = message; return true; }

            await doClick(findButton(saveCell, '🗑'));

            expect(reportedError).toBeNull();
            expect(confirm).toEqual('Are you sure you want to delete this fixture?\n\nHOME vs AWAY');
            expect(deletedFixture).toEqual(fixture.id);
            expect(beforeReloadDivision).toEqual(true);
            expect(divisionReloaded).toEqual(true);
        });

        it('cannot save when readonly', async () => {
            const date = '2023-05-06T00:00:00';
            const anotherTeam = {
                id: createTemporaryId(),
                name: 'ANOTHER TEAM',
                address: 'ANOTHER ADDRESS',
                seasons: [],
            };
            const fixture = {
                id: createTemporaryId(),
                date: date,
                homeTeam: homeTeam,
                awayTeam: awayTeam,
                originalAwayTeamId: 'unset'
            };
            await renderComponent(
                { fixture, date, readOnly: true },
                { id: division.id, fixtures: [ { date, fixtures: [ fixture ] } ], season, teams: [ homeTeam, awayTeam, anotherTeam ] },
                account,
                toMap([ homeTeam, awayTeam, anotherTeam ]));

            const saveCell = context.container.querySelector('td:nth-child(6)');
            const deleteButton = findButton(saveCell, '💾');
            expect(deleteButton.disabled).toEqual(true);
        });

        it('cannot delete when readonly', async () => {
            const date = '2023-05-06T00:00:00';
            const anotherTeam = {
                id: createTemporaryId(),
                name: 'ANOTHER TEAM',
                address: 'ANOTHER ADDRESS',
                seasons: [],
            };
            const fixture = {
                id: createTemporaryId(),
                date: date,
                homeTeam: homeTeam,
                awayTeam: awayTeam,
            };
            await renderComponent(
                { fixture, date, readOnly: true },
                { id: division.id, fixtures: [ { date, fixtures: [ fixture ] } ], season, teams: [ homeTeam, awayTeam, anotherTeam ] },
                account,
                toMap([ homeTeam, awayTeam, anotherTeam ]));

            const saveCell = context.container.querySelector('td:nth-child(6)');
            const deleteButton = findButton(saveCell, '🗑');
            expect(deleteButton.disabled).toEqual(true);
        });

        it('cannot change away team when readonly', async () => {
            const date = '2023-05-06T00:00:00';
            const anotherTeam = {
                id: createTemporaryId(),
                name: 'ANOTHER TEAM',
                address: 'ANOTHER ADDRESS',
                seasons: [],
            };
            const fixture = {
                id: createTemporaryId(),
                date: date,
                homeTeam: homeTeam,
            };
            await renderComponent(
                { fixture, date, readOnly: true },
                { id: division.id, fixtures: [ { date, fixtures: [ fixture ] } ], season, teams: [ homeTeam, awayTeam, anotherTeam ] },
                account,
                toMap([ homeTeam, awayTeam, anotherTeam ]));
            const awayCell = context.container.querySelector('td:nth-child(5)');
            const anotherTeamOption = findButton(awayCell.querySelector('.dropdown-menu'), 'ANOTHER TEAM');

            await doClick(anotherTeamOption);

            expect(reportedError).toBeNull();
            expect(updatedFixtures).toBeNull();
        });
    });
});