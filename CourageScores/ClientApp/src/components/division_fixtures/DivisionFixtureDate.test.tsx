import {
    appProps,
    brandingProps,
    cleanUp,
    doClick,
    doSelectOption, ErrorState,
    findButton,
    iocProps,
    renderApp, TestContext
} from "../../helpers/tests";
import {createTemporaryId} from "../../helpers/projection";
import {renderDate} from "../../helpers/rendering";
import {DivisionFixtureDate, IDivisionFixtureDateProps} from "./DivisionFixtureDate";
import {DivisionDataContainer, IDivisionDataContainerProps} from "../league/DivisionDataContainer";
import {UserDto} from "../../interfaces/models/dtos/Identity/UserDto";
import {TeamDto} from "../../interfaces/models/dtos/Team/TeamDto";
import {DivisionDto} from "../../interfaces/models/dtos/DivisionDto";
import {SeasonDto} from "../../interfaces/models/dtos/Season/SeasonDto";
import {DivisionFixtureDateDto} from "../../interfaces/models/dtos/Division/DivisionFixtureDateDto";
import {
    divisionBuilder,
    divisionDataBuilder,
    fixtureDateBuilder,
    IDivisionFixtureBuilder,
    INoteBuilder
} from "../../helpers/builders/divisions";
import {ITournamentBuilder, ITournamentSideBuilder} from "../../helpers/builders/tournaments";
import {seasonBuilder} from "../../helpers/builders/seasons";
import {teamBuilder} from "../../helpers/builders/teams";

describe('DivisionFixtureDate', () => {
    let context: TestContext;
    let reportedError: ErrorState;
    let startingToAddNote: string | null;
    let showPlayers: { [date: string]: boolean } | null;
    let newFixtures: DivisionFixtureDateDto[] | null;

    async function startAddNote(date: string) {
        startingToAddNote = date;
    }

    async function setShowPlayers(newShowPlayers: { [date: string]: boolean }) {
        showPlayers = newShowPlayers;
    }

    async function setEditNote() {}

    async function setNewFixtures(updatedFixtures: DivisionFixtureDateDto[]) {
        newFixtures = updatedFixtures;
    }

    async function onTournamentChanged() {}

    afterEach(async () => {
        await cleanUp(context);
    });

    beforeEach(() => {
        reportedError = new ErrorState();
        newFixtures = null;
        startingToAddNote = null;
        showPlayers = null;
    });

    async function renderComponent(props: IDivisionFixtureDateProps, divisionData: IDivisionDataContainerProps, account: UserDto | null, excludeControls?: boolean, teams?: TeamDto[]) {
        context = await renderApp(
            iocProps(),
            brandingProps(),
            appProps({
                account,
                controls: !excludeControls,
                teams: teams || [],
            }, reportedError),
            (<DivisionDataContainer {...divisionData}>
                <DivisionFixtureDate {...props} />
            </DivisionDataContainer>));
    }

    function getDate(daysFromToday: number) {
        let date = new Date();
        date.setMonth(date.getMonth() + daysFromToday);
        return date.toISOString();
    }

    describe('when logged out', () => {
        const team: TeamDto = teamBuilder('TEAM').build();
        const season: SeasonDto = seasonBuilder('SEASON').build();
        const division: DivisionDto = divisionBuilder('DIVISION').build();
        const account = null;

        it('renders league fixtures', async () => {
            const fixtureDate = fixtureDateBuilder('2023-05-06T00:00:00')
                .withFixture((f: IDivisionFixtureBuilder) => f.bye('HOME'))
                .build();
            await renderComponent({
                date: fixtureDate,
                showPlayers: {},
                setShowPlayers,
                onTournamentChanged,
                setEditNote,
                startAddNote,
                setNewFixtures,
            }, divisionDataBuilder(division)
                .withFixtureDate(fixtureDate)
                .season(season)
                .withTeam(team)
                .build(), account);

            reportedError.verifyNoError();
            const heading = context.container.querySelector('h4')!;
            expect(heading).toBeTruthy();
            expect(heading.textContent).toContain(renderDate(fixtureDate.date));
            const table = context.container.querySelector('table')!;
            expect(table).toBeTruthy();
            expect(table.querySelectorAll('tr').length).toEqual(1);
            const row = table.querySelector('tr')!;
            expect(row.innerHTML).toContain('HOME');
            expect(row.innerHTML).toContain('Bye');
        });

        it('renders league qualifier/knockout fixtures', async () => {
            const fixtureDate = fixtureDateBuilder('2023-05-06T00:00:00')
                .withFixture((f: IDivisionFixtureBuilder) => f.playing('HOME', 'AWAY').knockout())
                .build();
            await renderComponent({
                date: fixtureDate,
                showPlayers: {},
                setShowPlayers,
                onTournamentChanged,
                setEditNote,
                startAddNote,
                setNewFixtures,
            }, divisionDataBuilder(division)
                .withFixtureDate(fixtureDate)
                .season(season)
                .withTeam(team)
                .build(), account);

            reportedError.verifyNoError();
            const heading = context.container.querySelector('h4')!;
            expect(heading).toBeTruthy();
            expect(heading.textContent).toContain(renderDate(fixtureDate.date));
            const table = context.container.querySelector('table')!;
            expect(table).toBeTruthy();
            expect(table.querySelectorAll('tr').length).toEqual(1);
            const row = table.querySelector('tr')!;
            expect(row.innerHTML).toContain('HOME');
            expect(row.innerHTML).toContain('AWAY');
        });

        it('does not render league qualifier/knockout byes', async () => {
            const homeTeamId = createTemporaryId();
            const fixtureDate = fixtureDateBuilder('2023-05-06T00:00:00')
                .withFixture((f: IDivisionFixtureBuilder) => f.bye(teamBuilder('A BYE HOME', homeTeamId)).knockout(), homeTeamId)
                .withFixture((f: IDivisionFixtureBuilder) => f.playing('ANOTHER HOME', 'ANOTHER AWAY').knockout())
                .build();
            await renderComponent({
                date: fixtureDate,
                showPlayers: {},
                setShowPlayers,
                onTournamentChanged,
                setEditNote,
                startAddNote,
                setNewFixtures,
            }, divisionDataBuilder(division)
                .withFixtureDate(fixtureDate)
                .season(season)
                .withTeam(team)
                .build(), account);

            reportedError.verifyNoError();
            const table = context.container.querySelector('table')!;
            expect(table).toBeTruthy();
            expect(table.querySelectorAll('tr').length).toEqual(1);
            const row = table.querySelector('tr')!;
            expect(row.innerHTML).toContain('ANOTHER HOME');
            expect(row.innerHTML).toContain('ANOTHER AWAY');
        });

        it('renders tournament fixtures', async () => {
            const fixtureDate = fixtureDateBuilder('2023-05-06T00:00:00')
                .withTournament((t: ITournamentBuilder) => t
                    .type('TYPE')
                    .address('ADDRESS')
                    .build())
                .build();
            await renderComponent({
                date: fixtureDate,
                setShowPlayers,
                showPlayers: {},
                onTournamentChanged,
                setEditNote,
                startAddNote,
                setNewFixtures,
            }, divisionDataBuilder(division)
                .withFixtureDate(fixtureDate)
                .season(season)
                .withTeam(team)
                .build(), account);

            reportedError.verifyNoError();
            const heading = context.container.querySelector('h4')!;
            expect(heading).toBeTruthy();
            expect(heading.textContent).toContain(renderDate(fixtureDate.date));
            const table = context.container.querySelector('table')!;
            expect(table).toBeTruthy();
            expect(table.querySelectorAll('tr').length).toEqual(1);
            const row = table.querySelector('tr')!;
            expect(row.textContent).toContain('TYPE at ADDRESS');
        });

        it('renders tournament fixtures with winner', async () => {
            const fixtureDate = fixtureDateBuilder('2023-05-06T00:00:00')
                .withTournament((t: ITournamentBuilder) => t
                    .type('TYPE')
                    .address('ADDRESS')
                    .winner('WINNER')
                    .build())
                .build();
            await renderComponent({
                date: fixtureDate,
                setShowPlayers,
                showPlayers: {},
                onTournamentChanged,
                setEditNote,
                startAddNote,
                setNewFixtures,
            }, divisionDataBuilder(division)
                .withFixtureDate(fixtureDate)
                .season(season)
                .withTeam(team)
                .build(), account);

            reportedError.verifyNoError();
            const heading = context.container.querySelector('h4')!;
            expect(heading).toBeTruthy();
            expect(heading.textContent).toContain(renderDate(fixtureDate.date));
            const table = context.container.querySelector('table')!;
            expect(table).toBeTruthy();
            expect(table.querySelectorAll('tr').length).toEqual(1);
            const row = table.querySelector('tr')!;
            expect(row.textContent).toContain('TYPE at ADDRESS');
            expect(row.textContent).toContain('Winner: WINNER');
        });

        it('renders notes', async () => {
            const fixtureDate = fixtureDateBuilder('2023-05-06T00:00:00')
                .withNote((n: INoteBuilder) => n.note('NOTE'))
                .build();
            await renderComponent({
                date: fixtureDate,
                setShowPlayers,
                showPlayers: {},
                onTournamentChanged,
                setEditNote,
                startAddNote,
                setNewFixtures,
            }, divisionDataBuilder(division)
                .withFixtureDate(fixtureDate)
                .season(season)
                .withTeam(team)
                .build(), account);

            reportedError.verifyNoError();
            const heading = context.container.querySelector('h4')!;
            expect(heading).toBeTruthy();
            expect(heading.textContent).toContain(renderDate(fixtureDate.date));
            const table = context.container.querySelector('table')!;
            expect(table).toBeTruthy();
            expect(table.querySelectorAll('tr').length).toEqual(0);
            const alert = context.container.querySelector('div.alert')!;
            expect(alert).toBeTruthy();
            expect(alert.textContent).toContain('NOTE');
        });

        it('renders past dates', async () => {
            const fixtureDate = fixtureDateBuilder(getDate(-1))
                .withNote((n: INoteBuilder) => n.note('NOTE'))
                .build();
            await renderComponent({
                date: fixtureDate,
                setShowPlayers,
                showPlayers: {},
                onTournamentChanged,
                setEditNote,
                startAddNote,
                setNewFixtures,
            }, divisionDataBuilder(division)
                .withFixtureDate(fixtureDate)
                .season(season)
                .withTeam(team)
                .build(), account);

            reportedError.verifyNoError();
            const component = context.container.querySelector('div')!;
            expect(component).toBeTruthy();
            expect(component.className).not.toContain('text-secondary-50');
            expect(component.className).not.toContain('text-primary');
        });

        it('renders today', async () => {
            const fixtureDate = fixtureDateBuilder(getDate(0))
                .withNote((n: INoteBuilder) => n.note('NOTE'))
                .build();
            await renderComponent({
                date: fixtureDate,
                setShowPlayers,
                showPlayers: {},
                onTournamentChanged,
                setEditNote,
                startAddNote,
                setNewFixtures,
            }, divisionDataBuilder(division)
                .withFixtureDate(fixtureDate)
                .season(season)
                .withTeam(team)
                .build(), account);

            reportedError.verifyNoError();
            const component = context.container.querySelector('div')!;
            expect(component).toBeTruthy();
            expect(component.className).not.toContain('text-secondary-50');
            expect(component.className).toContain('text-primary');
        });

        it('renders future dates', async () => {
            const fixtureDate = fixtureDateBuilder(getDate(1))
                .withNote((n: INoteBuilder) => n.note('NOTE'))
                .build();
            await renderComponent({
                date: fixtureDate,
                setShowPlayers,
                showPlayers: {},
                onTournamentChanged,
                setEditNote,
                startAddNote,
                setNewFixtures,
            }, divisionDataBuilder(division)
                .withFixtureDate(fixtureDate)
                .season(season)
                .withTeam(team)
                .build(), account);

            reportedError.verifyNoError();
            const component = context.container.querySelector('div')!;
            expect(component).toBeTruthy();
            expect(component.className).toContain('text-secondary-50');
            expect(component.className).not.toContain('text-primary');
        });

        it('renders who is playing', async () => {
            const fixtureDate = fixtureDateBuilder('2023-05-06T00:00:00')
                .withTournament((t: ITournamentBuilder) => t
                        .type('TYPE')
                        .address('ADDRESS')
                        .withSide((s: ITournamentSideBuilder) => s.name('SIDE').withPlayer('PLAYER'))
                        .build())
                .build();
            await renderComponent(
                {
                    date: fixtureDate,
                    setShowPlayers,
                    onTournamentChanged,
                    setEditNote,
                    startAddNote,
                    setNewFixtures,
                    showPlayers: {'2023-05-06T00:00:00': true},
                },
                divisionDataBuilder(division)
                    .withFixtureDate(fixtureDate)
                    .season(season)
                    .withTeam(team)
                    .build(),
                account);

            reportedError.verifyNoError();
            const table = context.container.querySelector('table')!;
            expect(table).toBeTruthy();
            expect(table.querySelectorAll('tr').length).toEqual(1);
            const row = table.querySelector('tr')!;
            expect(row.textContent).not.toContain('SIDE');
            expect(row.textContent).toContain('PLAYER');
        });

        it('can show who is playing', async () => {
            const fixtureDate = fixtureDateBuilder('2023-05-06T00:00:00')
                .withTournament(
                    (t: ITournamentBuilder) => t
                        .type('TYPE')
                        .address('ADDRESS')
                        .withSide((s: ITournamentSideBuilder) => s.name('SIDE').withPlayer('PLAYER')))
                .build();
            await renderComponent({
                date: fixtureDate,
                showPlayers: {},
                setShowPlayers,
                onTournamentChanged,
                setEditNote,
                startAddNote,
                setNewFixtures,
            }, divisionDataBuilder(division)
                .withFixtureDate(fixtureDate)
                .season(season)
                .withTeam(team)
                .build(), account);

            await doClick(context.container.querySelector('input[type="checkbox"][id^="showPlayers_"]')!);

            expect(showPlayers).toEqual({
                '2023-05-06T00:00:00': true
            });
        });

        it('can hide who is playing', async () => {
            const fixtureDate = fixtureDateBuilder('2023-05-06T00:00:00')
                .withTournament((t: ITournamentBuilder) => t
                    .type('TYPE')
                    .address('ADDRESS')
                    .withSide((s: ITournamentSideBuilder) => s.name('SIDE').withPlayer('PLAYER'))
                    .build())
                .build();
            await renderComponent({
                date: fixtureDate,
                showPlayers: {
                    '2023-05-06T00:00:00': true
                },
                setShowPlayers,
                onTournamentChanged,
                setEditNote,
                startAddNote,
                setNewFixtures,
            }, divisionDataBuilder(division)
                .withFixtureDate(fixtureDate)
                .season(season)
                .withTeam(team)
                .build(), account);

            await doClick(context.container.querySelector('input[type="checkbox"][id^="showPlayers_"]')!);

            expect(showPlayers).toEqual({});
        });

        it('does not show who is playing option when controls are disabled', async () => {
            const fixtureDate = fixtureDateBuilder('2023-05-06T00:00:00')
                .withTournament((t: ITournamentBuilder) => t
                    .type('TYPE')
                    .address('ADDRESS')
                    .withSide((s: ITournamentSideBuilder) => s.name('SIDE').withPlayer('PLAYER')))
                .build();
            await renderComponent({
                date: fixtureDate,
                showPlayers: {},
                setShowPlayers,
                onTournamentChanged,
                setEditNote,
                startAddNote,
                setNewFixtures,
            }, divisionDataBuilder(division)
                .withFixtureDate(fixtureDate)
                .season(season)
                .withTeam(team)
                .build(), account, true);

            expect(context.container.querySelector('input[type="checkbox"][id^="showPlayers_"]')).toBeFalsy();
        });
    });

    describe('when logged in', () => {
        const season: SeasonDto = seasonBuilder('SEASON').build();
        const division: DivisionDto = divisionBuilder('DIVISION').build();
        const team: TeamDto = teamBuilder('TEAM')
            .address('ADDRESS')
            .forSeason(season, division)
            .build();
        const anotherTeam: TeamDto = teamBuilder('ANOTHER TEAM')
            .address('ANOTHER ADDRESS')
            .forSeason(season, division)
            .build();
        const account: UserDto = {
            emailAddress: '',
            name: '',
            givenName: '',
            access: {
                manageGames: true,
                manageNotes: true,
            },
        };

        it('renders without potential league fixtures when any tournaments exist', async () => {
            const fixtureDate = fixtureDateBuilder('2023-05-06T00:00:00')
                .withFixture((f: IDivisionFixtureBuilder) => f.bye(team), team.id)
                .withTournament((t: ITournamentBuilder) => t
                    .type('TYPE')
                    .address('ADDRESS')
                    .build())
                .build();
            await renderComponent({
                date: fixtureDate,
                showPlayers: {},
                setShowPlayers,
                onTournamentChanged,
                setEditNote,
                startAddNote,
                setNewFixtures,
            }, divisionDataBuilder(division)
                .withFixtureDate(fixtureDate)
                .season(season)
                .withTeam(team)
                .build(), account);

            reportedError.verifyNoError();
            const table = context.container.querySelector('table')!;
            expect(table).toBeTruthy();
            expect(table.querySelectorAll('tr:not([datatype="new-tournament-fixture"])').length).toEqual(1);
            const row = table.querySelector('tr:not([datatype="new-tournament-fixture"])')!;
            expect(row.textContent).not.toContain('Bye');
            expect(row.textContent).not.toContain('TEAM');
            expect(row.textContent).toContain('TYPE at ADDRESS');
        });

        it('renders existing league fixtures but no potential league fixtures when any tournaments exist', async () => {
            const homeTeam = teamBuilder('HOME').build();
            const awayTeam = teamBuilder('AWAY').build();
            const fixtureDate = fixtureDateBuilder('2023-05-06T00:00:00')
                .withFixture((f: IDivisionFixtureBuilder) => f.bye(team), team.id)
                .withFixture((f: IDivisionFixtureBuilder) => f.playing(homeTeam, awayTeam), homeTeam.id)
                .withTournament((t: ITournamentBuilder) => t
                    .type('TYPE')
                    .address('ADDRESS')
                    .build())
                .build();
            await renderComponent({
                date: fixtureDate,
                showPlayers: {},
                setShowPlayers,
                onTournamentChanged,
                setEditNote,
                startAddNote,
                setNewFixtures,
            }, divisionDataBuilder(division)
                .withFixtureDate(fixtureDate)
                .season(season)
                .withTeam(team).withTeam(homeTeam).withTeam(awayTeam)
                .build(), account);

            reportedError.verifyNoError();
            const table = context.container.querySelector('table')!;
            expect(table).toBeTruthy();
            expect(table.querySelectorAll('tr').length).toEqual(2);
            const rows = Array.from(table.querySelectorAll('tr'));
            expect(rows.map(row => row.querySelector('td:nth-child(1)')!.textContent)).toEqual([ 'HOME', 'TYPE at ADDRESS' ]);
            expect(rows.map(row => {
                const activeItem = row.querySelector('td:nth-child(5) .dropdown-item.active');
                return activeItem ? activeItem.textContent : null;
            })).toEqual([ 'AWAY', null ]); // null because tournaments don't have a dropdown to select away team
        });

        it('renders without teams that are assigned to another fixture on the same date', async () => {
            const fixtureDate = fixtureDateBuilder('2023-05-06T00:00:00')
                .withFixture((f: IDivisionFixtureBuilder) => f.bye(team), team.id)
                .withFixture((f: IDivisionFixtureBuilder) => f.playing(anotherTeam, team))
                .build();
            await renderComponent({
                date: fixtureDate,
                showPlayers: {},
                setShowPlayers,
                onTournamentChanged,
                setEditNote,
                startAddNote,
                setNewFixtures,
            }, divisionDataBuilder(division)
                .withFixtureDate(fixtureDate)
                .season(season)
                .withTeam(team)
                .build(), account);

            reportedError.verifyNoError();
            const table = context.container.querySelector('table')!;
            expect(table).toBeTruthy();
            expect(table.querySelectorAll('tr').length).toEqual(1);
            const homeTeams = Array.from(table.querySelectorAll('tr td:first-child')).map(td => td.textContent);
            expect(homeTeams).not.toContain('TEAM');
        });

        it('can update fixtures', async () => {
            const fixtureDate = fixtureDateBuilder('2023-05-06T00:00:00')
                .withFixture((f: IDivisionFixtureBuilder) => f.bye(team), team.id)
                .build();
            await renderComponent({
                date: fixtureDate,
                showPlayers: {},
                setShowPlayers,
                onTournamentChanged,
                setEditNote,
                startAddNote,
                setNewFixtures,
            }, divisionDataBuilder(division)
                .withFixtureDate(fixtureDate)
                .season(season)
                .withTeam(team).withTeam(anotherTeam)
                .build(), account);
            const table = context.container.querySelector('table')!;
            const expected = Object.assign({}, fixtureDate);
            const expectedAwayTeam = {
                id: anotherTeam.id,
                name: anotherTeam.name,
            };
            expected.fixtures![0] = Object.assign(
                {},
                expected.fixtures![0],
                {awayTeam: expectedAwayTeam, originalAwayTeamId: 'unset'});

            await doSelectOption(table.querySelector('.dropdown-menu')!, 'ANOTHER TEAM');

            reportedError.verifyNoError();
            expect(newFixtures).toEqual([expected]);
        });

        it('cannot change isKnockout when fixtures exist', async () => {
            const fixtureDate = fixtureDateBuilder('2023-05-06T00:00:00')
                .withFixture((f: IDivisionFixtureBuilder) => f.playing(anotherTeam, team))
                .build();

            await renderComponent({
                date: fixtureDate,
                showPlayers: {},
                setShowPlayers,
                onTournamentChanged,
                setEditNote,
                startAddNote,
                setNewFixtures,
            }, divisionDataBuilder(division)
                .withFixtureDate(fixtureDate)
                .season(season)
                .withTeam(team)
                .build(), account);

            const toggle = context.container.querySelector('input[type="checkbox"][id^="isKnockout_"]');
            expect(toggle).toBeFalsy();
        });

        it('can change isKnockout when no fixtures exist', async () => {
            const fixtureDate = fixtureDateBuilder('2023-05-06T00:00:00')
                .build();
            await renderComponent({
                date: fixtureDate,
                showPlayers: {},
                setShowPlayers,
                onTournamentChanged,
                setEditNote,
                startAddNote,
                setNewFixtures,
            }, divisionDataBuilder(division)
                .withFixtureDate(fixtureDate)
                .season(season)
                .withTeam(team)
                .build(), account);

            await doClick(context.container.querySelector('input[type="checkbox"][id^="isKnockout_"]')!);

            expect(newFixtures).toEqual([{
                date: '2023-05-06T00:00:00',
                fixtures: [{
                    id: team.id,
                    homeTeam: {
                        id: team.id,
                        address: team.address,
                        name: team.name,
                    },
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
                .withFixture((f: IDivisionFixtureBuilder) => f.bye(team).knockout().accoladesCount(), team.id)
                .build();

            await renderComponent({
                date: fixtureDate,
                showPlayers: {},
                setShowPlayers,
                onTournamentChanged,
                setEditNote,
                startAddNote,
                setNewFixtures,
            }, divisionDataBuilder(division)
                .withFixtureDate(fixtureDate)
                .season(season)
                .withTeam(team)
                .build(), account);

            reportedError.verifyNoError();
            expect(context.container.querySelector('input[type="checkbox"][id^="isKnockout_"]')).toBeTruthy();
        });

        it('can add a note', async () => {
            const fixtureDate = fixtureDateBuilder('2023-05-06T00:00:00')
                .withFixture((f: IDivisionFixtureBuilder) => f.bye(team), team.id)
                .build();
            await renderComponent({
                date: fixtureDate,
                showPlayers: {},
                setShowPlayers,
                onTournamentChanged,
                setEditNote,
                startAddNote,
                setNewFixtures,
            }, divisionDataBuilder(division)
                .withFixtureDate(fixtureDate)
                .season(season)
                .withTeam(team)
                .build(), account);

            await doClick(findButton(context.container, '📌 Add note'));

            expect(startingToAddNote).toEqual(fixtureDate.date);
        });

        it('renders league qualifier/knockout fixtures', async () => {
            const awayTeam = teamBuilder('AWAY')
                .forSeason(season, division)
                .build();
            const fixtureDate = fixtureDateBuilder('2023-05-06T00:00:00')
                .withFixture((f: IDivisionFixtureBuilder) => f.playing(team, awayTeam).knockout())
                .build();
            await renderComponent({
                date: fixtureDate,
                showPlayers: {},
                setShowPlayers,
                onTournamentChanged,
                setEditNote,
                startAddNote,
                setNewFixtures,
            }, divisionDataBuilder(division)
                .withFixtureDate(fixtureDate)
                .season(season)
                .withTeam(team)
                .build(), account, undefined, [team, awayTeam]);

            reportedError.verifyNoError();
            const heading = context.container.querySelector('h4')!;
            expect(heading).toBeTruthy();
            expect(heading.textContent).toContain(renderDate(fixtureDate.date));
            const table = context.container.querySelector('table')!;
            expect(table).toBeTruthy();
            expect(table.querySelectorAll('tr').length).toEqual(1);
            const row = table.querySelector('tr')!;
            expect(row.innerHTML).toContain('TEAM');
            expect(row.querySelector('td:nth-child(5) .dropdown-toggle')!.textContent).toEqual('AWAY');
        });

        it('does not render league qualifier/knockout fixtures for superleague divisions', async () => {
            const superleagueDivision: DivisionDto = divisionBuilder('DIVISION').superleague().build();
            const awayTeam = teamBuilder('AWAY')
                .forSeason(season, superleagueDivision)
                .build();
            const fixtureDate = fixtureDateBuilder('2023-05-06T00:00:00')
                .withFixture((f: IDivisionFixtureBuilder) => f.playing(team, awayTeam).knockout())
                .build();
            await renderComponent({
                date: fixtureDate,
                showPlayers: {},
                setShowPlayers,
                onTournamentChanged,
                setEditNote,
                startAddNote,
                setNewFixtures,
            }, divisionDataBuilder(superleagueDivision)
                .withFixtureDate(fixtureDate)
                .season(season)
                .withTeam(team)
                .build(), account, undefined, [team, awayTeam]);

            reportedError.verifyNoError();
            const heading = context.container.querySelector('h4')!;
            expect(heading).toBeTruthy();
            expect(heading.textContent).toContain(renderDate(fixtureDate.date));
            const table = context.container.querySelector('table')!;
            expect(table).toBeTruthy();
            expect(table.querySelectorAll('tr').length).toEqual(0);
        });

        it('renders league qualifier/knockout byes', async () => {
            const awayTeam = teamBuilder('AWAY')
                .forSeason(season, division)
                .build();
            const fixtureDate = fixtureDateBuilder('2023-05-06T00:00:00')
                .withFixture((f: IDivisionFixtureBuilder) => f.bye(team.address).knockout())
                .build();
            await renderComponent({
                date: fixtureDate,
                showPlayers: {},
                setShowPlayers,
                onTournamentChanged,
                setEditNote,
                startAddNote,
                setNewFixtures,
            }, divisionDataBuilder(division)
                .withFixtureDate(fixtureDate)
                .season(season)
                .withTeam(team)
                .build(), account, undefined, [team, awayTeam]);

            reportedError.verifyNoError();
            const heading = context.container.querySelector('h4')!;
            expect(heading).toBeTruthy();
            expect(heading.textContent).toContain(renderDate(fixtureDate.date));
            const table = context.container.querySelector('table')!;
            expect(table).toBeTruthy();
            expect(table.querySelectorAll('tr').length).toEqual(1);
            const row = table.querySelector('tr')!;
            expect(row.innerHTML).toContain('TEAM');
            expect(row.querySelector('td:nth-child(5) .dropdown-toggle')!.textContent).toEqual('');
        });
    });
});