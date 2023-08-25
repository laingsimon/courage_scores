// noinspection JSUnresolvedFunction

import {cleanUp, doClick, doSelectOption, findButton, renderApp} from "../../helpers/tests";
import {createTemporaryId} from "../../helpers/projection";
import {renderDate} from "../../helpers/rendering";
import {toMap} from "../../helpers/collections";
import React from "react";
import {DivisionFixtureDate} from "./DivisionFixtureDate";
import {DivisionDataContainer} from "../DivisionDataContainer";
import {fixtureDateBuilder, teamBuilder, seasonBuilder, divisionBuilder} from "../../helpers/builders";

describe('DivisionFixtureDate', () => {
    let context;
    let reportedError;
    let startingToAddNote;
    let showPlayers;
    let editNote;
    let newFixtures;
    let tournamentChanged;

    async function startAddNote(date) {
        startingToAddNote = date;
    }

    async function setShowPlayers(newShowPlayers) {
        showPlayers = newShowPlayers;
    }

    async function setEditNote() {
        editNote = true;
    }

    async function setNewFixtures(updatedFixtures) {
        newFixtures = updatedFixtures;
    }

    async function onTournamentChanged() {
        tournamentChanged = true;
    }

    afterEach(() => {
        cleanUp(context);
    });

    async function renderComponent(props, divisionData, account, excludeControls, teams) {
        newFixtures = null;
        startingToAddNote = null;
        showPlayers = null;
        editNote = null;
        tournamentChanged = null;
        reportedError = null;
        context = await renderApp(
            {},
            {name: 'Courage Scores'},
            {
                onError: (err) => {
                    reportedError = {
                        message: err.message,
                        stack: err.stack
                    };
                },
                account,
                controls: !excludeControls,
                teams: toMap(teams || []),
            },
            (<DivisionDataContainer {...divisionData}>
                <DivisionFixtureDate
                    {...props}
                    startAddNote={startAddNote}
                    setEditNote={setEditNote}
                    setShowPlayers={setShowPlayers}
                    setNewFixtures={setNewFixtures}
                    onTournamentChanged={onTournamentChanged}/>
            </DivisionDataContainer>));
    }

    function getDate(daysFromToday) {
        let date = new Date();
        date.setMonth(date.getMonth() + daysFromToday);
        return date.toISOString();
    }

    describe('when logged out', () => {
        const team = teamBuilder('TEAM').build();
        const season = seasonBuilder('SEASON').build();
        const division = divisionBuilder('DIVISION').build();
        const account = null;

        it('renders league fixtures', async () => {
            const fixtureDate = fixtureDateBuilder('2023-05-06T00:00:00')
                .withFixture(f => f.bye('HOME'))
                .build();
            await renderComponent({
                date: fixtureDate,
                renderContext: {},
                showPlayers: {},
            }, {fixtures: [fixtureDate], teams: [team], season, id: division.id}, account);

            expect(reportedError).toBeNull();
            const heading = context.container.querySelector('h4');
            expect(heading).toBeTruthy();
            expect(heading.textContent).toContain(renderDate(fixtureDate.date));
            const table = context.container.querySelector('table');
            expect(table).toBeTruthy();
            expect(table.querySelectorAll('tr').length).toEqual(1);
            const row = table.querySelector('tr');
            expect(row.innerHTML).toContain('HOME');
            expect(row.innerHTML).toContain('Bye');
        });

        it('renders league qualifier/knockout fixtures', async () => {
            const fixtureDate = fixtureDateBuilder('2023-05-06T00:00:00')
                .withFixture(f => f.playing('HOME', 'AWAY').knockout())
                .build();
            await renderComponent({
                date: fixtureDate,
                renderContext: {},
                showPlayers: {},
            }, {fixtures: [fixtureDate], teams: [team], season, id: division.id}, account);

            expect(reportedError).toBeNull();
            const heading = context.container.querySelector('h4');
            expect(heading).toBeTruthy();
            expect(heading.textContent).toContain(renderDate(fixtureDate.date));
            const table = context.container.querySelector('table');
            expect(table).toBeTruthy();
            expect(table.querySelectorAll('tr').length).toEqual(1);
            const row = table.querySelector('tr');
            expect(row.innerHTML).toContain('HOME');
            expect(row.innerHTML).toContain('AWAY');
        });

        it('does not render league qualifier/knockout byes', async () => {
            const homeTeamId = createTemporaryId();
            const fixtureDate = fixtureDateBuilder('2023-05-06T00:00:00')
                .withFixture(f => f.bye(teamBuilder('A BYE HOME', homeTeamId)).knockout(), homeTeamId)
                .withFixture(f => f.playing('ANOTHER HOME', 'ANOTHER AWAY').knockout())
                .build();
            await renderComponent({
                date: fixtureDate,
                renderContext: {},
                showPlayers: {},
            }, {fixtures: [fixtureDate], teams: [team], season, id: division.id, name: division.name}, account);

            expect(reportedError).toBeNull();
            const table = context.container.querySelector('table');
            expect(table).toBeTruthy();
            expect(table.querySelectorAll('tr').length).toEqual(1);
            const row = table.querySelector('tr');
            expect(row.innerHTML).toContain('ANOTHER HOME');
            expect(row.innerHTML).toContain('ANOTHER AWAY');
        });

        it('renders tournament fixtures', async () => {
            const fixtureDate = fixtureDateBuilder('2023-05-06T00:00:00')
                .withTournament(t => t
                    .type('TYPE')
                    .address('ADDRESS')
                    .build())
                .build();
            await renderComponent({
                date: fixtureDate,
                renderContext: {},
                showPlayers: {},
            }, {fixtures: [fixtureDate], teams: [team], season, id: division.id}, account);

            expect(reportedError).toBeNull();
            const heading = context.container.querySelector('h4');
            expect(heading).toBeTruthy();
            expect(heading.textContent).toContain(renderDate(fixtureDate.date));
            const table = context.container.querySelector('table');
            expect(table).toBeTruthy();
            expect(table.querySelectorAll('tr').length).toEqual(1);
            const row = table.querySelector('tr');
            expect(row.textContent).toContain('TYPE at ADDRESS');
        });

        it('renders tournament fixtures with winner', async () => {
            const fixtureDate = fixtureDateBuilder('2023-05-06T00:00:00')
                .withTournament(t => t
                    .type('TYPE')
                    .address('ADDRESS')
                    .winner('WINNER')
                    .build())
                .build();
            await renderComponent({
                date: fixtureDate,
                renderContext: {},
                showPlayers: {},
            }, {fixtures: [fixtureDate], teams: [team], season, id: division.id}, account);

            expect(reportedError).toBeNull();
            const heading = context.container.querySelector('h4');
            expect(heading).toBeTruthy();
            expect(heading.textContent).toContain(renderDate(fixtureDate.date));
            const table = context.container.querySelector('table');
            expect(table).toBeTruthy();
            expect(table.querySelectorAll('tr').length).toEqual(1);
            const row = table.querySelector('tr');
            expect(row.textContent).toContain('TYPE at ADDRESS');
            expect(row.textContent).toContain('Winner: WINNER');
        });

        it('renders notes', async () => {
            const fixtureDate = fixtureDateBuilder('2023-05-06T00:00:00')
                .withNote(n => n.note('NOTE'))
                .build();
            await renderComponent({
                date: fixtureDate,
                renderContext: {},
                showPlayers: {},
            }, {fixtures: [fixtureDate], teams: [team], season, id: division.id}, account);

            expect(reportedError).toBeNull();
            const heading = context.container.querySelector('h4');
            expect(heading).toBeTruthy();
            expect(heading.textContent).toContain(renderDate(fixtureDate.date));
            const table = context.container.querySelector('table');
            expect(table).toBeTruthy();
            expect(table.querySelectorAll('tr').length).toEqual(0);
            const alert = context.container.querySelector('div.alert');
            expect(alert).toBeTruthy();
            expect(alert.textContent).toContain('NOTE');
        });

        it('renders past dates', async () => {
            const fixtureDate = fixtureDateBuilder(getDate(-1))
                .withNote(n => n.note('NOTE'))
                .build();
            await renderComponent({
                date: fixtureDate,
                renderContext: {},
                showPlayers: {},
            }, {fixtures: [fixtureDate], teams: [team], season, id: division.id}, account);

            expect(reportedError).toBeNull();
            const component = context.container.querySelector('div');
            expect(component).toBeTruthy();
            expect(component.className).not.toContain('text-secondary-50');
            expect(component.className).not.toContain('text-primary');
        });

        it('renders today', async () => {
            const fixtureDate = fixtureDateBuilder(getDate(0))
                .withNote(n => n.note('NOTE'))
                .build();
            await renderComponent({
                date: fixtureDate,
                renderContext: {},
                showPlayers: {},
            }, {fixtures: [fixtureDate], teams: [team], season, id: division.id}, account);

            expect(reportedError).toBeNull();
            const component = context.container.querySelector('div');
            expect(component).toBeTruthy();
            expect(component.className).not.toContain('text-secondary-50');
            expect(component.className).toContain('text-primary');
        });

        it('renders future dates', async () => {
            const fixtureDate = fixtureDateBuilder(getDate(1))
                .withNote(n => n.note('NOTE'))
                .build();
            await renderComponent({
                date: fixtureDate,
                renderContext: {},
                showPlayers: {},
            }, {fixtures: [fixtureDate], teams: [team], season, id: division.id}, account);

            expect(reportedError).toBeNull();
            const component = context.container.querySelector('div');
            expect(component).toBeTruthy();
            expect(component.className).toContain('text-secondary-50');
            expect(component.className).not.toContain('text-primary');
        });

        it('renders who is playing', async () => {
            const fixtureDate = fixtureDateBuilder('2023-05-06T00:00:00')
                .withTournament(t => t
                        .type('TYPE')
                        .address('ADDRESS')
                        .withSide(s => s.name('SIDE').withPlayer('PLAYER'))
                        .build())
                .build();
            await renderComponent(
                {
                    date: fixtureDate,
                    renderContext: {},
                    showPlayers: {'2023-05-06T00:00:00': true},
                },
                {fixtures: [fixtureDate], teams: [team], season, id: division.id, players: []},
                account);

            expect(reportedError).toBeNull();
            const table = context.container.querySelector('table');
            expect(table).toBeTruthy();
            expect(table.querySelectorAll('tr').length).toEqual(1);
            const row = table.querySelector('tr');
            expect(row.textContent).not.toContain('SIDE');
            expect(row.textContent).toContain('PLAYER');
        });

        it('can show who is playing', async () => {
            const fixtureDate = fixtureDateBuilder('2023-05-06T00:00:00')
                .withTournament(
                    t => t
                        .type('TYPE')
                        .address('ADDRESS')
                        .withSide(s => s.name('SIDE').withPlayer('PLAYER')))
                .build();
            await renderComponent({
                date: fixtureDate,
                renderContext: {},
                showPlayers: {},
            }, {fixtures: [fixtureDate], teams: [team], season, id: division.id}, account);

            await doClick(context.container.querySelector('input[type="checkbox"][id^="showPlayers_"]'));

            expect(showPlayers).toEqual({
                '2023-05-06T00:00:00': true
            });
        });

        it('can hide who is playing', async () => {
            const fixtureDate = fixtureDateBuilder('2023-05-06T00:00:00')
                .withTournament(t => t
                    .type('TYPE')
                    .address('ADDRESS')
                    .withSide(s => s.name('SIDE').withPlayer('PLAYER'))
                    .build())
                .build();
            await renderComponent({
                date: fixtureDate,
                renderContext: {},
                showPlayers: {
                    '2023-05-06T00:00:00': true
                },
            }, {fixtures: [fixtureDate], teams: [team], season, id: division.id, players: []}, account);

            await doClick(context.container.querySelector('input[type="checkbox"][id^="showPlayers_"]'));

            expect(showPlayers).toEqual({});
        });

        it('does not show who is playing option when controls are disabled', async () => {
            const fixtureDate = fixtureDateBuilder('2023-05-06T00:00:00')
                .withTournament(t => t
                    .type('TYPE')
                    .address('ADDRESS')
                    .withSide(s => s.name('SIDE').withPlayer('PLAYER')))
                .build();
            await renderComponent({
                date: fixtureDate,
                renderContext: {},
                showPlayers: {},
            }, {fixtures: [fixtureDate], teams: [team], season, id: division.id}, account, true);

            expect(context.container.querySelector('input[type="checkbox"][id^="showPlayers_"]')).toBeFalsy();
        });
    });

    describe('when logged in', () => {
        const season = seasonBuilder('SEASON').build();
        const division = divisionBuilder('DIVISION').build();
        const team = teamBuilder('TEAM')
            .address('ADDRESS')
            .forSeason(season, division)
            .build();
        const anotherTeam = teamBuilder('ANOTHER TEAM')
            .address('ANOTHER ADDRESS')
            .forSeason(season, division)
            .build();
        const account = {
            access: {
                manageGames: true,
                manageNotes: true,
            },
        };

        it('renders without potential league fixtures when any tournaments exist', async () => {
            const fixtureDate = fixtureDateBuilder('2023-05-06T00:00:00')
                .withFixture(f => f.bye(team), team.id)
                .withTournament(t => t
                    .type('TYPE')
                    .address('ADDRESS')
                    .build())
                .build();
            await renderComponent({
                date: fixtureDate,
                renderContext: {},
                showPlayers: {},
            }, {fixtures: [fixtureDate], teams: [team], season, id: division.id}, account);

            expect(reportedError).toBeNull();
            const table = context.container.querySelector('table');
            expect(table).toBeTruthy();
            expect(table.querySelectorAll('tr').length).toEqual(1);
            const row = table.querySelector('tr');
            expect(row.textContent).not.toContain('Bye');
            expect(row.textContent).not.toContain('TEAM');
            expect(row.textContent).toContain('TYPE at ADDRESS');
        });

        it('renders existing league fixtures but no potential league fixtures when any tournaments exist', async () => {
            const homeTeam = teamBuilder('HOME').build();
            const awayTeam = teamBuilder('AWAY').build();
            const fixtureDate = fixtureDateBuilder('2023-05-06T00:00:00')
                .withFixture(f => f.bye(team), team.id)
                .withFixture(f => f.playing(homeTeam, awayTeam), homeTeam.id)
                .withTournament(t => t
                    .type('TYPE')
                    .address('ADDRESS')
                    .build())
                .build();
            await renderComponent({
                date: fixtureDate,
                renderContext: {},
                showPlayers: {},
            }, {fixtures: [fixtureDate], teams: [team, homeTeam, awayTeam], season, id: division.id}, account);

            expect(reportedError).toBeNull();
            const table = context.container.querySelector('table');
            expect(table).toBeTruthy();
            expect(table.querySelectorAll('tr').length).toEqual(2);
            const rows = Array.from(table.querySelectorAll('tr'));
            expect(rows.map(row => row.querySelector('td:nth-child(1)').textContent)).toEqual([ 'HOME', 'TYPE at ADDRESS' ]);
            expect(rows.map(row => {
                const activeItem = row.querySelector('td:nth-child(5) .dropdown-item.active');
                return activeItem ? activeItem.textContent : null;
            })).toEqual([ 'AWAY', null ]); // null because tournaments don't have a drop down to select away team
        });

        it('renders without teams that are assigned to another fixture on the same date', async () => {
            const fixtureDate = fixtureDateBuilder('2023-05-06T00:00:00')
                .withFixture(f => f.bye(team), team.id)
                .withFixture(f => f.playing(anotherTeam, team))
                .build();
            await renderComponent({
                date: fixtureDate,
                renderContext: {},
                showPlayers: {},
            }, {fixtures: [fixtureDate], teams: [team], season, id: division.id}, account);

            expect(reportedError).toBeNull();
            const table = context.container.querySelector('table');
            expect(table).toBeTruthy();
            expect(table.querySelectorAll('tr').length).toEqual(1);
            const homeTeams = Array.from(table.querySelectorAll('tr td:first-child')).map(td => td.textContent);
            expect(homeTeams).not.toContain('TEAM');
        });

        it('can update fixtures', async () => {
            const fixtureDate = fixtureDateBuilder('2023-05-06T00:00:00')
                .withFixture(f => f.bye(team), team.id)
                .build();
            await renderComponent({
                date: fixtureDate,
                renderContext: {},
                showPlayers: {},
            }, {fixtures: [fixtureDate], teams: [team, anotherTeam], season, id: division.id}, account);
            const table = context.container.querySelector('table');
            const expected = Object.assign({}, fixtureDate);
            const expectedAwayTeam = {
                id: anotherTeam.id,
                name: anotherTeam.name,
            };
            expected.fixtures[0] = Object.assign(
                {},
                expected.fixtures[0],
                {awayTeam: expectedAwayTeam, originalAwayTeamId: 'unset'});

            await doSelectOption(table.querySelector('.dropdown-menu'), 'ANOTHER TEAM');

            expect(reportedError).toBeNull();
            expect(newFixtures).toEqual([expected]);
        });

        it('cannot change isKnockout when fixtures exist', async () => {
            const fixtureDate = fixtureDateBuilder('2023-05-06T00:00:00')
                .withFixture(f => f.playing(anotherTeam, team))
                .build();

            await renderComponent({
                date: fixtureDate,
                renderContext: {},
                showPlayers: {},
            }, {fixtures: [fixtureDate], teams: [team], season, id: division.id}, account);

            const toggle = context.container.querySelector('input[type="checkbox"][id^="isKnockout_"]');
            expect(toggle).toBeFalsy();
        });

        it('can change isKnockout when no fixtures exist', async () => {
            const fixtureDate = fixtureDateBuilder('2023-05-06T00:00:00')
                .build();
            await renderComponent({
                date: fixtureDate,
                renderContext: {},
                showPlayers: {},
            }, {fixtures: [fixtureDate], teams: [team], season, id: division.id}, account);

            await doClick(context.container.querySelector('input[type="checkbox"][id^="isKnockout_"]'));

            expect(newFixtures).toEqual([{
                date: '2023-05-06T00:00:00',
                fixtures: [{
                    id: team.id,
                    homeTeam: {
                        id: team.id,
                        address: team.address,
                        name: team.name,
                    },
                    awayTeam: null,
                    isKnockout: true,
                    accoladesCount: true,
                    fixturesUsingAddress: [],
                }],
                tournamentFixtures: [],
                notes: [],
                isKnockout: true,
            }]);
        });

        it('can render venues after isKnockout change with no existing fixtures', async () => {
            const fixtureDate = fixtureDateBuilder('2023-05-06T00:00:00')
                .withFixture(f => f.bye(team).knockout().accoladesCount(), team.id)
                .build();

            await renderComponent({
                date: fixtureDate,
                renderContext: {},
                showPlayers: {},
            }, {fixtures: [fixtureDate], teams: [team], season, id: division.id}, account);

            expect(reportedError).toBeNull();
            expect(context.container.querySelector('input[type="checkbox"][id^="isKnockout_"]')).toBeTruthy();
        });

        it('can add a note', async () => {
            const fixtureDate = fixtureDateBuilder('2023-05-06T00:00:00')
                .withFixture(f => f.bye(team), team.id)
                .build();
            await renderComponent({
                date: fixtureDate,
                renderContext: {},
                showPlayers: {},
            }, {fixtures: [fixtureDate], teams: [team], season, id: division.id}, account);

            await doClick(findButton(context.container, '📌 Add note'));

            expect(startingToAddNote).toEqual(fixtureDate.date);
        });

        it('renders league qualifier/knockout fixtures', async () => {
            const awayTeam = teamBuilder('AWAY')
                .forSeason(season, division)
                .build();
            const fixtureDate = fixtureDateBuilder('2023-05-06T00:00:00')
                .withFixture(f => f.playing(team, awayTeam).knockout())
                .build();
            await renderComponent({
                date: fixtureDate,
                renderContext: {},
                showPlayers: {},
            }, {fixtures: [fixtureDate], teams: [team], season, id: division.id}, account, null, [team, awayTeam]);

            expect(reportedError).toBeNull();
            const heading = context.container.querySelector('h4');
            expect(heading).toBeTruthy();
            expect(heading.textContent).toContain(renderDate(fixtureDate.date));
            const table = context.container.querySelector('table');
            expect(table).toBeTruthy();
            expect(table.querySelectorAll('tr').length).toEqual(1);
            const row = table.querySelector('tr');
            expect(row.innerHTML).toContain('TEAM');
            expect(row.querySelector('td:nth-child(5) .dropdown-toggle').textContent).toEqual('AWAY');
        });

        it('renders league qualifier/knockout byes', async () => {
            const awayTeam = teamBuilder('AWAY')
                .forSeason(season, division)
                .build();
            const fixtureDate = fixtureDateBuilder('2023-05-06T00:00:00')
                .withFixture(f => f.bye(team).knockout())
                .build();
            await renderComponent({
                date: fixtureDate,
                renderContext: {},
                showPlayers: {},
            }, {fixtures: [fixtureDate], teams: [team], season, id: division.id}, account, null, [team, awayTeam]);

            expect(reportedError).toBeNull();
            const heading = context.container.querySelector('h4');
            expect(heading).toBeTruthy();
            expect(heading.textContent).toContain(renderDate(fixtureDate.date));
            const table = context.container.querySelector('table');
            expect(table).toBeTruthy();
            expect(table.querySelectorAll('tr').length).toEqual(1);
            const row = table.querySelector('tr');
            expect(row.innerHTML).toContain('TEAM');
            expect(row.querySelector('td:nth-child(5) .dropdown-toggle').textContent).toEqual('');
        });
    });
});