// noinspection JSUnresolvedFunction

import {cleanUp, doChange, doClick, doSelectOption, findButton, renderApp} from "../../helpers/tests";
import React from "react";
import {toMap} from "../../helpers/collections";
import {DivisionFixtures} from "./DivisionFixtures";
import {DivisionDataContainer} from "../DivisionDataContainer";
import {divisionDataBuilder, fixtureDateBuilder, seasonBuilder, teamBuilder} from "../../helpers/builders";

describe('DivisionFixtures', () => {
    let context;
    let reportedError;
    let newFixtures;
    let divisionReloaded = false;
    let updatedNote;
    let createdNote;
    let overriddenDivisionData;
    const seasonApi = {};
    const gameApi = {};
    const noteApi = {
        create: async (note) => {
            createdNote = note;
            return {success: true};
        },
        upsert: async (id, note, lastUpdated) => {
            updatedNote = {id, note, lastUpdated};
            return {success: true};
        },
    };
    const tournamentApi = {
        update: async () => {
            return {success: true};
        },
        create: async () => {
            return {success: true};
        }
    };
    const templateApi = {
        getCompatibility: () => {
            return {success: false};
        }
    };

    afterEach(() => {
        cleanUp(context);
    });

    async function renderComponent(divisionData, account, route, path, excludeControls, teams) {
        reportedError = null;
        newFixtures = null;
        divisionReloaded = false;
        updatedNote = null;
        overriddenDivisionData = null;
        createdNote = null;
        context = await renderApp(
            {seasonApi, gameApi, noteApi, tournamentApi, templateApi},
            {name: 'Courage Scores'},
            {
                account,
                onError: (err) => {
                    reportedError = {
                        message: err.message,
                        stack: err.stack
                    };
                },
                seasons: [],
                divisions: [],
                controls: !excludeControls,
                teams: toMap(teams || []),
            },
            (<DivisionDataContainer onReloadDivision={onReloadDivision} {...divisionData}
                                    setDivisionData={d => overriddenDivisionData = d}>
                <DivisionFixtures setNewFixtures={(updatedFixtures) => newFixtures = updatedFixtures}/>
            </DivisionDataContainer>),
            route,
            path);
    }

    function getInSeasonDivisionData() {
        const season = seasonBuilder('A season')
            .starting('2022-02-03T00:00:00')
            .ending('2022-08-25T00:00:00')
            .build();
        const team = teamBuilder('A team').build();

        return divisionDataBuilder()
            .season(season)
            .name('A division')
            .withTeam(team)
            .build();
    }

    function assertFixture(tr, home, homeScore, awayScore, away, account) {
        const columns = tr.querySelectorAll('td');
        expect(columns.length).toEqual(5 + (account ? 1 : 0));
        expect(columns[0].textContent).toEqual(home);
        expect(columns[1].textContent).toEqual(homeScore);
        expect(columns[2].textContent).toEqual('vs');
        expect(columns[3].textContent).toEqual(awayScore);

        const selectedAwayTeam = columns[4].querySelector('div.btn-group > button');
        if (account && selectedAwayTeam) {
            expect(selectedAwayTeam.textContent).toEqual(away);
        } else {
            expect(columns[4].textContent).toEqual(away);
        }
    }

    function assertTournament(tr, text, winner, account) {
        const columns = tr.querySelectorAll('td');
        expect(columns.length).toEqual((winner ? 2 : 1) + (account ? 1 : 0));
        expect(columns[0].textContent).toEqual(text);
        if (winner) {
            expect(columns[1].textContent).toEqual('Winner: ' + winner);
        }
    }

    async function onReloadDivision() {
        divisionReloaded = true;
    }

    function getFixtureDateElement(index, account) {
        const fixtureElements = context.container.querySelectorAll('div.content-background > div');
        expect(fixtureElements.length).toEqual(2 + (account ? 1 : 0));
        const fixtureDatesContainer = fixtureElements[1];
        const fixtureDates = fixtureDatesContainer.children;
        expect(fixtureElements.length).toBeGreaterThan(index);
        return fixtureDates[index];
    }

    function assertFixtureDate(fixtureDateElement, expectedDate) {
        const fixtureDateHeading = fixtureDateElement.querySelector('h4');
        expect(fixtureDateHeading.textContent).toEqual('📅 ' + expectedDate);
    }

    describe('when logged out', () => {
        const account = null;

        it('renders notes', async () => {
            const divisionData = getInSeasonDivisionData();
            divisionData.fixtures.push(fixtureDateBuilder('2022-10-13T00:00:00')
                .withNote(n => n.note('Finals night!'))
                .build());

            await renderComponent(divisionData, account);

            expect(reportedError).toBeNull();
            const fixtureDateElement = getFixtureDateElement(0, account);
            assertFixtureDate(fixtureDateElement, '13 Oct');
            const noteElement = fixtureDateElement.querySelector('.alert-warning');
            expect(noteElement).toBeTruthy();
            expect(noteElement.textContent).toEqual('📌Finals night!');
        });

        it('renders played league fixtures', async () => {
            const divisionData = getInSeasonDivisionData();
            divisionData.fixtures.push(fixtureDateBuilder('2022-10-13T00:00:00')
                .withFixture(f => f
                    .playing('home1', 'away1')
                    .scores(1, 2))
                .build());

            await renderComponent(divisionData, account);

            expect(reportedError).toBeNull();
            const fixtureDateElement = getFixtureDateElement(0, account);
            assertFixtureDate(fixtureDateElement, '13 Oct');
            const fixturesForDate = fixtureDateElement.querySelectorAll('table tbody tr');
            expect(fixturesForDate.length).toEqual(1); // number of fixtures for this date
            assertFixture(fixturesForDate[0], 'home1', '1', '2', 'away1', account);
        });

        it('renders played knockout fixtures', async () => {
            const divisionData = getInSeasonDivisionData();
            divisionData.fixtures.push(fixtureDateBuilder('2022-10-13T00:00:00')
                .withFixture(f => f
                    .playing('home2 - knockout', 'away2 - knockout')
                    .scores(3, 4)
                    .knockout())
                .build());

            await renderComponent(divisionData, account);

            expect(reportedError).toBeNull();
            const fixtureDateElement = getFixtureDateElement(0, account);
            assertFixtureDate(fixtureDateElement, '13 Oct');
            const fixturesForDate = fixtureDateElement.querySelectorAll('table tbody tr');
            expect(fixturesForDate.length).toEqual(1); // number of fixtures for this date
            assertFixture(fixturesForDate[0], 'home2 - knockout', '3', '4', 'away2 - knockout', account);
        });

        it('renders postponed fixtures', async () => {
            const divisionData = getInSeasonDivisionData();
            divisionData.fixtures.push(fixtureDateBuilder('2022-10-13T00:00:00')
                .withFixture(f => f
                    .playing('home3', 'away3')
                    .scores(0, 0)
                    .postponed()
                    .knockout())
                .build());

            await renderComponent(divisionData, account);

            expect(reportedError).toBeNull();
            const fixtureDateElement = getFixtureDateElement(0, account);
            assertFixtureDate(fixtureDateElement, '13 Oct');
            const fixturesForDate = fixtureDateElement.querySelectorAll('table tbody tr');
            expect(fixturesForDate.length).toEqual(1); // number of fixtures for this date
            assertFixture(fixturesForDate[0], 'home3', 'P', 'P', 'away3', account);
        });

        it('renders byes', async () => {
            const divisionData = getInSeasonDivisionData();
            divisionData.fixtures.push(fixtureDateBuilder('2022-10-13T00:00:00')
                .withFixture(f => f.bye('home4 - bye'))
                .build());

            await renderComponent(divisionData, account);

            expect(reportedError).toBeNull();
            const fixtureDateElement = getFixtureDateElement(0, account);
            assertFixtureDate(fixtureDateElement, '13 Oct');
            const fixturesForDate = fixtureDateElement.querySelectorAll('table tbody tr');
            expect(fixturesForDate.length).toEqual(1); // number of fixtures for this date
            assertFixture(fixturesForDate[0], 'home4 - bye', '', '', 'Bye', account);
        });

        it('renders played tournaments', async () => {
            const divisionData = getInSeasonDivisionData();
            divisionData.fixtures.push(fixtureDateBuilder('2022-10-13T00:00:00')
                .withTournament(t => t
                    .address('an address')
                    .date('2022-10-13T00:00:00')
                    .type('Pairs')
                    .notes('Someone to run the venue')
                    .forSeason(divisionData.season)
                    .withSide(s => s.name('The winning side'))
                    .winner('The winning side'))
                .build());

            await renderComponent(divisionData, account);

            expect(reportedError).toBeNull();
            const fixtureDateElement = getFixtureDateElement(0, account);
            assertFixtureDate(fixtureDateElement, '13 OctWho\'s playing?');
            const fixturesForDate = fixtureDateElement.querySelectorAll('table tbody tr');
            expect(fixturesForDate.length).toEqual(1); // number of fixtures for this date
            assertTournament(fixturesForDate[0], 'Pairs at an address', 'The winning side', account);
        });

        it('renders unplayed tournaments', async () => {
            const divisionData = getInSeasonDivisionData();
            divisionData.fixtures.push(fixtureDateBuilder('2022-10-13T00:00:00')
                .withTournament(t => t
                    .address('another address')
                    .date('2022-10-13T00:00:00')
                    .notes('Someone to run the venue')
                    .forSeason(divisionData.season)
                    .withSide(s => s.name('The winning side'))
                    .type('Pairs'))
                .build());

            await renderComponent(divisionData, account);

            expect(reportedError).toBeNull();
            const fixtureDateElement = getFixtureDateElement(0, account);
            assertFixtureDate(fixtureDateElement, '13 OctWho\'s playing?');
            const fixturesForDate = fixtureDateElement.querySelectorAll('table tbody tr');
            expect(fixturesForDate.length).toEqual(1); // number of fixtures for this date
            assertTournament(fixturesForDate[0], 'Pairs at another address', account);
        });

        it('renders tournament players', async () => {
            const divisionData = getInSeasonDivisionData();
            divisionData.fixtures.push(fixtureDateBuilder('2022-10-13T00:00:00')
                .withTournament(t => t
                    .address('another address')
                    .date('2022-10-13T00:00:00')
                    .notes('Someone to run the venue')
                    .forSeason(divisionData.season)
                    .withSide(s => s.name('The winning side').withPlayer('SIDE PLAYER'))
                    .type('Pairs'))
                .build());

            await renderComponent(divisionData, account, '/division', '/division#show-who-is-playing');

            expect(reportedError).toBeNull();
            const fixtureDateElement = getFixtureDateElement(0, account);
            expect(fixtureDateElement.textContent).toContain('SIDE PLAYER');
        });

        it('can change filters', async () => {
            const divisionData = getInSeasonDivisionData();
            divisionData.fixtures.push(fixtureDateBuilder('2022-10-13T00:00:00')
                .withTournament(t => t
                    .address('another address')
                    .date('2022-10-13T00:00:00')
                    .notes('Someone to run the venue')
                    .forSeason(divisionData.season)
                    .withSide(s => s.name('The winning side'))
                    .type('Pairs'))
                .build());
            await renderComponent(divisionData, account);
            const filterContainer = context.container.querySelector('.content-background > div[datatype="fixture-filters"]');

            await doSelectOption(filterContainer.querySelector('.dropdown-menu'), 'League fixtures');

            expect(reportedError).toBeNull();
        });

        it('hides filters when no controls', async () => {
            const divisionData = getInSeasonDivisionData();
            divisionData.fixtures.push(fixtureDateBuilder('2022-10-13T00:00:00')
                .withTournament(t => t
                    .address('another address')
                    .date('2022-10-13T00:00:00')
                    .notes('Someone to run the venue')
                    .forSeason(divisionData.season)
                    .withSide(s => s.name('The winning side'))
                    .type('Pairs'))
                .build());
            await renderComponent(divisionData, account, null, null, true);

            expect(reportedError).toBeNull();
            const filterContainer = context.container.querySelector('.content-background > div[datatype="fixture-filters"]');
            expect(filterContainer).toBeFalsy();
        });

        it('filters fixtures dates', async () => {
            const divisionData = getInSeasonDivisionData();
            divisionData.fixtures.push(fixtureDateBuilder('2022-10-13T00:00:00')
                .withTournament(t => t
                    .address('another address')
                    .date('2022-10-13T00:00:00')
                    .notes('Someone to run the venue')
                    .forSeason(divisionData.season)
                    .withSide(s => s.name('The winning side'))
                    .type('Pairs'))
                .build());
            await renderComponent(divisionData, account, '/divisions', '/divisions?date=2020-01-01');

            expect(reportedError).toBeNull();
            expect(context.container.textContent).not.toContain('Pairs at another address');
        });

        it('filters fixtures', async () => {
            const divisionData = getInSeasonDivisionData();
            divisionData.fixtures.push(fixtureDateBuilder('2022-10-13T00:00:00')
                .withTournament(t => t
                    .address('another address')
                    .date('2022-10-13T00:00:00')
                    .notes('Someone to run the venue')
                    .forSeason(divisionData.season)
                    .withSide(s => s.name('The winning side'))
                    .type('Pairs'))
                .build());
            await renderComponent(divisionData, account, '/divisions', '/divisions?date=2022-10-13&type=tournaments');

            expect(reportedError).toBeNull();
            expect(context.container.textContent).toContain('Pairs at another address');
        });

        it('filters fixtures dates after fixtures', async () => {
            const divisionData = getInSeasonDivisionData();
            divisionData.fixtures.push(fixtureDateBuilder('2022-10-13T00:00:00')
                .withTournament(t => t
                    .address('another address')
                    .date('2022-10-13T00:00:00')
                    .notes('Someone to run the venue')
                    .forSeason(divisionData.season)
                    .withSide(s => s.name('The winning side'))
                    .type('Pairs'))
                .build());
            await renderComponent(divisionData, account, '/divisions', '/divisions?date=2022-10-13&type=league');

            expect(reportedError).toBeNull();
            expect(context.container.textContent).not.toContain('📅');
        });
    });

    describe('when logged in', () => {
        const account = {
            access: {
                manageGames: true,
                manageTournaments: true,
                manageNotes: true,
                manageScores: true
            },
        };

        it('renders notes', async () => {
            const divisionData = getInSeasonDivisionData();
            divisionData.fixtures.push(fixtureDateBuilder('2022-10-13T00:00:00')
                .withNote(n => n.note('Finals night!'))
                .build());

            await renderComponent(divisionData, account);

            expect(reportedError).toBeNull();
            const fixtureDateElement = getFixtureDateElement(0, account);
            assertFixtureDate(fixtureDateElement, '13 Oct📌 Add noteQualifier');
            const noteElement = fixtureDateElement.querySelector('.alert-warning');
            expect(noteElement).toBeTruthy();
            expect(noteElement.textContent).toEqual('📌Finals night!Edit');
        });

        it('renders played league fixtures', async () => {
            const divisionData = getInSeasonDivisionData();
            divisionData.fixtures.push(fixtureDateBuilder('2022-10-13T00:00:00')
                .withFixture(f => f
                    .playing('home1', 'away1')
                    .scores(1, 2))
                .build());

            await renderComponent(divisionData, account);

            expect(reportedError).toBeNull();
            const fixtureDateElement = getFixtureDateElement(0, account);
            assertFixtureDate(fixtureDateElement, '13 Oct📌 Add note');
            const fixturesForDate = fixtureDateElement.querySelectorAll('table tbody tr');
            expect(fixturesForDate.length).toEqual(1); // number of fixtures for this date
            assertFixture(fixturesForDate[0], 'home1', '1', '2', 'away1', account);
        });

        it('renders played knockout fixtures', async () => {
            const divisionData = getInSeasonDivisionData();
            divisionData.fixtures.push(fixtureDateBuilder('2022-10-13T00:00:00')
                .withFixture(f => f
                    .playing('home2 - knockout', 'away2 - knockout')
                    .scores(3, 4)
                    .knockout())
                .build());

            await renderComponent(divisionData, account);

            expect(reportedError).toBeNull();
            const fixtureDateElement = getFixtureDateElement(0, account);
            assertFixtureDate(fixtureDateElement, '13 Oct📌 Add note');
            const fixturesForDate = fixtureDateElement.querySelectorAll('table tbody tr');
            expect(fixturesForDate.length).toEqual(1); // number of fixtures for this date
            assertFixture(fixturesForDate[0], 'home2 - knockout', '3', '4', 'away2 - knockout', account);
        });

        it('renders postponed fixtures', async () => {
            const divisionData = getInSeasonDivisionData();
            divisionData.fixtures.push(fixtureDateBuilder('2022-10-13T00:00:00')
                .withFixture(f => f
                    .playing('home3', divisionData.teams[0])
                    .scores(0, 0)
                    .postponed())
                .build());

            await renderComponent(divisionData, account);

            expect(reportedError).toBeNull();
            const fixtureDateElement = getFixtureDateElement(0, account);
            assertFixtureDate(fixtureDateElement, '13 Oct📌 Add note');
            const fixturesForDate = fixtureDateElement.querySelectorAll('table tbody tr');
            expect(fixturesForDate.length).toEqual(1); // number of fixtures for this date
            assertFixture(fixturesForDate[0], 'home3', 'P', 'P', 'A team', account);
        });

        it('renders byes', async () => {
            const divisionData = getInSeasonDivisionData();
            const team = teamBuilder('home4 - bye').build();
            divisionData.fixtures.push(fixtureDateBuilder('2022-10-13T00:00:00')
                .withFixture(f => f.bye(team), team.id)
                .build());

            await renderComponent(divisionData, account);

            expect(reportedError).toBeNull();
            const fixtureDateElement = getFixtureDateElement(0, account);
            assertFixtureDate(fixtureDateElement, '13 Oct📌 Add noteQualifier');
            const fixturesForDate = fixtureDateElement.querySelectorAll('table tbody tr');
            expect(fixturesForDate.length).toEqual(1); // number of fixtures for this date
            assertFixture(fixturesForDate[0], 'home4 - bye', '', '', 'Bye', account);
        });

        it('renders played tournaments', async () => {
            const divisionData = getInSeasonDivisionData();
            divisionData.fixtures.push(fixtureDateBuilder('2022-10-13T00:00:00')
                .withTournament(t => t
                    .address('an address')
                    .date('2022-10-13T00:00:00')
                    .type('Pairs')
                    .forSeason(divisionData.season)
                    .notes('Someone to run the venue')
                    .withSide(s => s.name('The winning side'))
                    .winner('The winning side'))
                .build());

            await renderComponent(divisionData, account);

            expect(reportedError).toBeNull();
            const fixtureDateElement = getFixtureDateElement(0, account);
            assertFixtureDate(fixtureDateElement, '13 Oct📌 Add noteWho\'s playing?');
            const fixturesForDate = fixtureDateElement.querySelectorAll('table tbody tr');
            expect(fixturesForDate.length).toEqual(1); // number of fixtures for this date
            assertTournament(fixturesForDate[0], 'Pairs at an address', 'The winning side', account);
        });

        it('renders unplayed tournaments', async () => {
            const divisionData = getInSeasonDivisionData();
            divisionData.fixtures.push(fixtureDateBuilder('2022-10-13T00:00:00')
                .withTournament(t => t
                    .address('another address')
                    .date('2022-10-13T00:00:00')
                    .type('Pairs')
                    .forSeason(divisionData.season)
                    .notes('Someone to run the venue')
                    .withSide(s => s.name('The winning side')))
                .build());

            await renderComponent(divisionData, account);

            expect(reportedError).toBeNull();
            const fixtureDateElement = getFixtureDateElement(0, account);
            assertFixtureDate(fixtureDateElement, '13 Oct📌 Add noteWho\'s playing?');
            const fixturesForDate = fixtureDateElement.querySelectorAll('table tbody tr');
            expect(fixturesForDate.length).toEqual(1); // number of fixtures for this date
            assertTournament(fixturesForDate[0], 'Pairs at another address', null, account);
        });

        it('reloads tournaments if they are changed', async () => {
            const divisionData = getInSeasonDivisionData();
            divisionData.fixtures.push(fixtureDateBuilder('2022-10-13T00:00:00')
                .withTournament(t => t
                    .address('another address')
                    .date('2022-10-13T00:00:00')
                    .forSeason(divisionData.season)
                    .proposed())
                .build());
            await renderComponent(
                {
                    ...divisionData,
                    onReloadDivision: () => {
                        divisionReloaded = true;
                        return divisionData;
                    }
                },
                account);

            const fixtureDateElement = getFixtureDateElement(0, account);
            await doClick(findButton(fixtureDateElement, '➕'));

            expect(reportedError).toBeNull();
            expect(divisionReloaded).toEqual(true);
            expect(newFixtures).not.toBeNull();
        });

        it('can add a note', async () => {
            const divisionData = getInSeasonDivisionData();
            const team = teamBuilder('home5 - bye').build();
            divisionData.fixtures.push(fixtureDateBuilder('2022-10-13T00:00:00')
                .withFixture(f => f.bye(team), team.id)
                .build());
            await renderComponent(divisionData, account);
            const fixtureDateElement = getFixtureDateElement(0, account);

            await doClick(findButton(fixtureDateElement, '📌 Add note'));

            expect(reportedError).toBeNull();
            const dialog = context.container.querySelector('.modal-dialog');
            expect(dialog).toBeTruthy();
            expect(dialog.textContent).toContain('Create note');
        });

        it('can edit a note', async () => {
            const divisionData = getInSeasonDivisionData();
            divisionData.fixtures.push(fixtureDateBuilder('2022-10-13T00:00:00')
                .withNote(n => n.note('A note'))
                .build());
            await renderComponent(divisionData, account);
            const fixtureDateElement = getFixtureDateElement(0, account);

            await doClick(findButton(fixtureDateElement.querySelector('.alert'), 'Edit'));

            expect(reportedError).toBeNull();
            const dialog = context.container.querySelector('.modal-dialog');
            expect(dialog).toBeTruthy();
            expect(dialog.textContent).toContain('Edit note');
        });

        it('can save changes to notes', async () => {
            const divisionData = getInSeasonDivisionData();
            divisionData.fixtures.push(fixtureDateBuilder('2022-10-13T00:00:00')
                .withNote(n => n.note('A note'))
                .build());
            await renderComponent(divisionData, account);
            const fixtureDateElement = getFixtureDateElement(0, account);
            await doClick(findButton(fixtureDateElement.querySelector('.alert'), 'Edit'));

            const dialog = context.container.querySelector('.modal-dialog');
            await doChange(dialog, 'textarea[name="note"]', 'New note', context.user);
            await doClick(findButton(dialog, 'Save'));

            expect(reportedError).toBeNull();
            expect(context.container.querySelector('.modal-dialog')).toBeFalsy();
            expect(divisionReloaded).toEqual(true);
            expect(updatedNote).not.toBeNull();
        });

        it('can close edit notes dialog', async () => {
            const divisionData = getInSeasonDivisionData();
            divisionData.fixtures.push(fixtureDateBuilder('2022-10-13T00:00:00')
                .withNote(n => n.note('A note'))
                .build());
            await renderComponent(divisionData, account);
            const fixtureDateElement = getFixtureDateElement(0, account);
            await doClick(findButton(fixtureDateElement.querySelector('.alert'), 'Edit'));
            const dialog = context.container.querySelector('.modal-dialog');

            await doClick(findButton(dialog, 'Close'));

            expect(reportedError).toBeNull();
            expect(context.container.querySelector('.modal-dialog')).toBeFalsy();
        });

        it('can open add date dialog', async () => {
            const divisionData = getInSeasonDivisionData();
            await renderComponent(divisionData, account);

            await doClick(findButton(context.container, '➕ Add date'));

            expect(reportedError).toBeNull();
            const dialog = context.container.querySelector('.modal-dialog');
            expect(dialog).toBeTruthy();
            expect(dialog.textContent).toContain('Add date');
        });

        it('can close add date dialog', async () => {
            const divisionData = getInSeasonDivisionData();
            await renderComponent(divisionData, account);

            await doClick(findButton(context.container, '➕ Add date'));
            await doClick(findButton(context.container.querySelector('.modal-dialog'), 'Close'));

            expect(reportedError).toBeNull();
            const dialog = context.container.querySelector('.modal-dialog');
            expect(dialog).toBeFalsy();
        });

        it('prevents adding a date when no date selected', async () => {
            const divisionData = getInSeasonDivisionData();
            await renderComponent(divisionData, account);
            await doClick(findButton(context.container, '➕ Add date'));
            const dialog = context.container.querySelector('.modal-dialog');
            let alert;
            window.alert = (message) => alert = message;

            await doClick(findButton(dialog, 'Add date'));

            expect(reportedError).toBeNull();
            expect(newFixtures).toBeNull();
            expect(alert).toEqual('Select a date first');
        });

        it('does not add date if already exists', async () => {
            const divisionData = getInSeasonDivisionData();
            divisionData.fixtures.push(fixtureDateBuilder('2022-10-13T00:00:00')
                .withNote(n => n.note('A note'))
                .withTournament(t => t
                    .address('another address')
                    .date('2022-10-13T00:00:00')
                    .proposed()
                    .forSeason(divisionData.season))
                .build());
            await renderComponent(divisionData, account);
            await doClick(findButton(context.container, '➕ Add date'));
            const dialog = context.container.querySelector('.modal-dialog');

            await doChange(dialog, 'input[type="date"]', '2022-10-13', context.user);
            await doClick(findButton(dialog, 'Add date'));

            expect(reportedError).toBeNull();
            expect(newFixtures).toBeNull();
        });

        it('can add a date', async () => {
            const divisionData = getInSeasonDivisionData();
            const team = teamBuilder('TEAM')
                .address('ADDRESS')
                .forSeason(divisionData.season, divisionData)
                .build();
            const outOfSeasonTeam = teamBuilder('OUT OF SEASON TEAM')
                .build();
            await renderComponent(divisionData, account, null, null, null, [team, outOfSeasonTeam]);
            await doClick(findButton(context.container, '➕ Add date'));
            const dialog = context.container.querySelector('.modal-dialog');

            await doChange(dialog, 'input[type="date"]', '2023-05-06', context.user);
            await doClick(dialog, 'input[name="isKnockout"]');
            await doClick(findButton(dialog, 'Add date'));

            expect(reportedError).toBeNull();
            expect(newFixtures).not.toBeNull();
            expect(newFixtures.length).toEqual(1);
            expect(newFixtures[0].date).toEqual('2023-05-06T00:00:00');
            expect(newFixtures[0].isNew).toEqual(true);
            expect(newFixtures[0].isKnockout).toEqual(true);
            expect(newFixtures[0].fixtures.length).toEqual(1);
            expect(newFixtures[0].fixtures[0].fixturesUsingAddress).toEqual([]);
            expect(newFixtures[0].fixtures[0].homeTeam.id).toEqual(team.id);
            expect(newFixtures[0].fixtures[0].homeTeam.name).toEqual(team.name);
            expect(newFixtures[0].fixtures[0].homeTeam.address).toEqual(team.address);
            expect(newFixtures[0].fixtures[0].awayTeam).toBeNull();
            expect(newFixtures[0].fixtures[0].isKnockout).toEqual(true);
            expect(newFixtures[0].fixtures[0].accoladesCount).toEqual(true);
            expect(newFixtures[0].fixtures[0].fixturesUsingAddress).toEqual([]);
            expect(newFixtures[0].tournamentFixtures[0].address).toEqual('ADDRESS');
            expect(newFixtures[0].tournamentFixtures[0].proposed).toEqual(true);
        });

        it('renders new dates correctly', async () => {
            const divisionData = getInSeasonDivisionData();
            const homeTeam = teamBuilder('HOME').build();
            divisionData.fixtures.push(fixtureDateBuilder('2022-05-06T00:00:00')
                .isNew()
                .withFixture(f => f.bye(homeTeam), homeTeam.id)
                .build());

            await renderComponent(divisionData, account);

            expect(reportedError).toBeNull();
        });

        it('can open create new fixtures dialog', async () => {
            const divisionData = getInSeasonDivisionData();
            await renderComponent(divisionData, account);

            await doClick(findButton(context.container, '🗓️ Create fixtures'));

            expect(reportedError).toBeNull();
            const dialog = context.container.querySelector('.modal-dialog');
            expect(dialog).toBeTruthy();
            expect(dialog.textContent).toContain('Create season fixtures...');
        });

        it('can close create new fixtures dialog', async () => {
            const divisionData = getInSeasonDivisionData();
            await renderComponent(divisionData, account);
            await doClick(findButton(context.container, '🗓️ Create fixtures'));
            expect(reportedError).toBeNull();

            await doClick(findButton(context.container.querySelector('.modal-dialog'), 'Close'))

            const dialog = context.container.querySelector('.modal-dialog');
            expect(dialog).toBeFalsy();
        });
    });
});