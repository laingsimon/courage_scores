import {
    appProps,
    brandingProps,
    cleanUp,
    ErrorState,
    iocProps,
    renderApp,
    TestContext,
} from '../../helpers/tests';
import { createTemporaryId } from '../../helpers/projection';
import { renderDate } from '../../helpers/rendering';
import {
    DivisionFixtureDate,
    IDivisionFixtureDateProps,
} from './DivisionFixtureDate';
import {
    DivisionDataContainer,
    IDivisionDataContainerProps,
} from '../league/DivisionDataContainer';
import { UserDto } from '../../interfaces/models/dtos/Identity/UserDto';
import { TeamDto } from '../../interfaces/models/dtos/Team/TeamDto';
import { DivisionDto } from '../../interfaces/models/dtos/DivisionDto';
import { SeasonDto } from '../../interfaces/models/dtos/Season/SeasonDto';
import { DivisionFixtureDateDto } from '../../interfaces/models/dtos/Division/DivisionFixtureDateDto';
import {
    divisionBuilder,
    divisionDataBuilder,
    fixtureDateBuilder,
} from '../../helpers/builders/divisions';
import { seasonBuilder } from '../../helpers/builders/seasons';
import { teamBuilder } from '../../helpers/builders/teams';

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

    async function renderComponent(
        props: IDivisionFixtureDateProps,
        divisionData: IDivisionDataContainerProps,
        account?: UserDto,
        excludeControls?: boolean,
        teams?: TeamDto[],
    ) {
        context = await renderApp(
            iocProps(),
            brandingProps(),
            appProps(
                {
                    account,
                    controls: !excludeControls,
                    teams: teams || [],
                },
                reportedError,
            ),
            <DivisionDataContainer {...divisionData}>
                <DivisionFixtureDate {...props} />
            </DivisionDataContainer>,
        );
    }

    function getDate(daysFromToday: number) {
        let date = new Date();
        date.setMonth(date.getMonth() + daysFromToday);
        return date.toISOString();
    }

    function teamDto(name: string): TeamDto {
        return teamBuilder(name).build();
    }

    function props(
        date: DivisionFixtureDateDto,
        customisations?: Partial<IDivisionFixtureDateProps>,
    ): IDivisionFixtureDateProps {
        return {
            date,
            showPlayers: {},
            setShowPlayers,
            onTournamentChanged,
            setEditNote,
            startAddNote,
            setNewFixtures,
            ...customisations,
        };
    }

    describe('when logged out', () => {
        const team: TeamDto = teamBuilder('TEAM').build();
        const division: DivisionDto = divisionBuilder('DIVISION').build();
        const account: UserDto | undefined = undefined;

        it('renders league fixtures', async () => {
            const fixtureDate = fixtureDateBuilder('2023-05-06T00:00:00')
                .withFixture((f) => f.bye(teamBuilder('HOME').build()))
                .build();
            await renderComponent(
                props(fixtureDate),
                divisionDataBuilder(division)
                    .withFixtureDate(
                        (fd) =>
                            fd.withFixture((f) =>
                                f.bye(teamBuilder('HOME').build()),
                            ),
                        '2023-05-06T00:00:00',
                    )
                    .season()
                    .withTeam(team)
                    .build(),
                account,
            );

            reportedError.verifyNoError();
            const heading = context.required('h4');
            expect(heading.text()).toContain(renderDate(fixtureDate.date));
            const table = context.required('table');
            expect(table.all('tr').length).toEqual(1);
            const row = table.required('tr');
            expect(row.html()).toContain('HOME');
            expect(row.html()).toContain('Bye');
        });

        it('renders league qualifier/knockout fixtures', async () => {
            const fixtureDate = fixtureDateBuilder('2023-05-06T00:00:00')
                .withFixture((f) =>
                    f.playing(teamDto('HOME'), teamDto('AWAY')).knockout(),
                )
                .build();
            await renderComponent(
                props(fixtureDate),
                divisionDataBuilder(division)
                    .withFixtureDate(
                        (fd) =>
                            fd.withFixture((f) =>
                                f
                                    .playing(teamDto('HOME'), teamDto('AWAY'))
                                    .knockout(),
                            ),
                        '2023-05-06T00:00:00',
                    )
                    .season()
                    .withTeam(team)
                    .build(),
                account,
            );

            reportedError.verifyNoError();
            const heading = context.required('h4');
            expect(heading.text()).toContain(renderDate(fixtureDate.date));
            const table = context.required('table');
            expect(table.all('tr').length).toEqual(1);
            const row = table.required('tr');
            expect(row.html()).toContain('HOME');
            expect(row.html()).toContain('AWAY');
        });

        it('does not render league qualifier/knockout byes', async () => {
            const homeTeamId = createTemporaryId();
            const fixtureDate = fixtureDateBuilder('2023-05-06T00:00:00')
                .withFixture(
                    (f) =>
                        f
                            .bye(teamBuilder('A BYE HOME', homeTeamId).build())
                            .knockout(),
                    homeTeamId,
                )
                .withFixture((f) =>
                    f
                        .playing(
                            teamDto('ANOTHER HOME'),
                            teamDto('ANOTHER AWAY'),
                        )
                        .knockout(),
                )
                .build();
            await renderComponent(
                props(fixtureDate),
                divisionDataBuilder(division)
                    .withFixtureDate(
                        (fd) =>
                            fd
                                .withFixture(
                                    (f) =>
                                        f
                                            .bye(
                                                teamBuilder(
                                                    'A BYE HOME',
                                                    homeTeamId,
                                                ).build(),
                                            )
                                            .knockout(),
                                    homeTeamId,
                                )
                                .withFixture((f) =>
                                    f
                                        .playing(
                                            teamDto('ANOTHER HOME'),
                                            teamDto('ANOTHER AWAY'),
                                        )
                                        .knockout(),
                                ),
                        '2023-05-06T00:00:00',
                    )
                    .season()
                    .withTeam(team)
                    .build(),
                account,
            );

            reportedError.verifyNoError();
            const table = context.required('table');
            expect(table.all('tr').length).toEqual(1);
            const row = table.required('tr');
            expect(row.html()).toContain('ANOTHER HOME');
            expect(row.html()).toContain('ANOTHER AWAY');
        });

        it('renders tournament fixtures', async () => {
            const fixtureDate = fixtureDateBuilder('2023-05-06T00:00:00')
                .withTournament((t) => t.type('TYPE').address('ADDRESS'))
                .build();
            await renderComponent(
                props(fixtureDate),
                divisionDataBuilder(division)
                    .withFixtureDate(
                        (fd) =>
                            fd.withTournament((t) =>
                                t.type('TYPE').address('ADDRESS'),
                            ),
                        '2023-05-06T00:00:00',
                    )
                    .season()
                    .withTeam(team)
                    .build(),
                account,
            );

            reportedError.verifyNoError();
            const heading = context.required('h4');
            expect(heading.text()).toContain(renderDate(fixtureDate.date));
            const table = context.required('table');
            expect(table.all('tr').length).toEqual(1);
            const row = table.required('tr');
            expect(row.text()).toContain('TYPE at ADDRESS');
        });

        it('renders tournament fixtures with winner', async () => {
            const fixtureDate = fixtureDateBuilder('2023-05-06T00:00:00')
                .withTournament((t) =>
                    t.type('TYPE').address('ADDRESS').winner('WINNER'),
                )
                .build();
            await renderComponent(
                props(fixtureDate),
                divisionDataBuilder(division)
                    .withFixtureDate(
                        (fd) =>
                            fd.withTournament((t) =>
                                t
                                    .type('TYPE')
                                    .address('ADDRESS')
                                    .winner('WINNER'),
                            ),
                        '2023-05-06T00:00:00',
                    )
                    .season()
                    .withTeam(team)
                    .build(),
                account,
            );

            reportedError.verifyNoError();
            const heading = context.required('h4');
            expect(heading.text()).toContain(renderDate(fixtureDate.date));
            const table = context.required('table');
            expect(table.all('tr').length).toEqual(1);
            const row = table.required('tr');
            expect(row.text()).toContain('TYPE at ADDRESS');
            expect(row.text()).toContain('Winner: WINNER');
        });

        it('renders notes', async () => {
            const fixtureDate = fixtureDateBuilder('2023-05-06T00:00:00')
                .withNote((n) => n.note('NOTE'))
                .build();
            await renderComponent(
                props(fixtureDate),
                divisionDataBuilder(division)
                    .withFixtureDate(
                        (fd) => fd.withNote((n) => n.note('NOTE')),
                        '2023-05-06T00:00:00',
                    )
                    .season()
                    .withTeam(team)
                    .build(),
                account,
            );

            reportedError.verifyNoError();
            const heading = context.required('h4');
            expect(heading.text()).toContain(renderDate(fixtureDate.date));
            const table = context.required('table');
            expect(table.all('tr').length).toEqual(0);
            const alert = context.required('div.alert');
            expect(alert.text()).toContain('NOTE');
        });

        it('renders past dates', async () => {
            const fixtureDate = fixtureDateBuilder(getDate(-1))
                .withNote((n) => n.note('NOTE'))
                .build();
            await renderComponent(
                props(fixtureDate),
                divisionDataBuilder(division)
                    .withFixtureDate(
                        (fd) => fd.withNote((n) => n.note('NOTE')),
                        '2023-05-06T00:00:00',
                    )
                    .season()
                    .withTeam(team)
                    .build(),
                account,
            );

            reportedError.verifyNoError();
            const component = context.required('div');
            expect(component.className()).not.toContain('text-secondary-50');
            expect(component.className()).not.toContain('text-primary');
        });

        it('renders today', async () => {
            const fixtureDate = fixtureDateBuilder(getDate(0))
                .withNote((n) => n.note('NOTE'))
                .build();
            await renderComponent(
                props(fixtureDate),
                divisionDataBuilder(division)
                    .withFixtureDate(
                        (fd) => fd.withNote((n) => n.note('NOTE')),
                        '2023-05-06T00:00:00',
                    )
                    .season()
                    .withTeam(team)
                    .build(),
                account,
            );

            reportedError.verifyNoError();
            const component = context.required('div');
            expect(component.className()).not.toContain('text-secondary-50');
            expect(component.className()).toContain('text-primary');
        });

        it('renders future dates', async () => {
            const fixtureDate = fixtureDateBuilder(getDate(1))
                .withNote((n) => n.note('NOTE'))
                .build();
            await renderComponent(
                props(fixtureDate),
                divisionDataBuilder(division)
                    .withFixtureDate(
                        (fd) => fd.withNote((n) => n.note('NOTE')),
                        '2023-05-06T00:00:00',
                    )
                    .season()
                    .withTeam(team)
                    .build(),
                account,
            );

            reportedError.verifyNoError();
            const component = context.required('div');
            expect(component.className()).toContain('text-secondary-50');
            expect(component.className()).not.toContain('text-primary');
        });

        it('renders who is playing', async () => {
            const fixtureDate = fixtureDateBuilder('2023-05-06T00:00:00')
                .withTournament((t) =>
                    t
                        .type('TYPE')
                        .address('ADDRESS')
                        .withSide((s) => s.name('SIDE').withPlayer('PLAYER')),
                )
                .build();
            await renderComponent(
                props(fixtureDate, {
                    showPlayers: { '2023-05-06T00:00:00': true },
                }),
                divisionDataBuilder(division)
                    .withFixtureDate(
                        (fd) =>
                            fd.withTournament((t) =>
                                t
                                    .type('TYPE')
                                    .address('ADDRESS')
                                    .withSide((s) =>
                                        s.name('SIDE').withPlayer('PLAYER'),
                                    ),
                            ),
                        '2023-05-06T00:00:00',
                    )
                    .season()
                    .withTeam(team)
                    .build(),
                account,
            );

            reportedError.verifyNoError();
            const table = context.required('table');
            expect(table.all('tr').length).toEqual(1);
            const row = table.required('tr');
            expect(row.text()).not.toContain('SIDE');
            expect(row.text()).toContain('PLAYER');
        });

        it('can show who is playing', async () => {
            const fixtureDate = fixtureDateBuilder('2023-05-06T00:00:00')
                .withTournament((t) =>
                    t
                        .type('TYPE')
                        .address('ADDRESS')
                        .withSide((s) => s.name('SIDE').withPlayer('PLAYER')),
                )
                .build();
            await renderComponent(
                props(fixtureDate),
                divisionDataBuilder(division)
                    .withFixtureDate(
                        (fd) =>
                            fd.withTournament((t) =>
                                t
                                    .type('TYPE')
                                    .address('ADDRESS')
                                    .withSide((s) =>
                                        s.name('SIDE').withPlayer('PLAYER'),
                                    ),
                            ),
                        '2023-05-06T00:00:00',
                    )
                    .season()
                    .withTeam(team)
                    .build(),
                account,
            );

            await context
                .required('input[type="checkbox"][id^="showPlayers_"]')
                .click();

            expect(showPlayers).toEqual({
                '2023-05-06T00:00:00': true,
            });
        });

        it('can hide who is playing', async () => {
            const fixtureDate = fixtureDateBuilder('2023-05-06T00:00:00')
                .withTournament((t) =>
                    t
                        .type('TYPE')
                        .address('ADDRESS')
                        .withSide((s) => s.name('SIDE').withPlayer('PLAYER')),
                )
                .build();
            await renderComponent(
                props(fixtureDate, {
                    showPlayers: {
                        '2023-05-06T00:00:00': true,
                    },
                }),
                divisionDataBuilder(division)
                    .withFixtureDate(
                        (fd) =>
                            fd.withTournament((t) =>
                                t
                                    .type('TYPE')
                                    .address('ADDRESS')
                                    .withSide((s) =>
                                        s.name('SIDE').withPlayer('PLAYER'),
                                    ),
                            ),
                        '2023-05-06T00:00:00',
                    )
                    .season()
                    .withTeam(team)
                    .build(),
                account,
            );

            await context
                .required('input[type="checkbox"][id^="showPlayers_"]')
                .click();

            expect(showPlayers).toEqual({});
        });

        it('does not show who is playing option when controls are disabled', async () => {
            const fixtureDate = fixtureDateBuilder('2023-05-06T00:00:00')
                .withTournament((t) =>
                    t
                        .type('TYPE')
                        .address('ADDRESS')
                        .withSide((s) => s.name('SIDE').withPlayer('PLAYER')),
                )
                .build();
            await renderComponent(
                props(fixtureDate),
                divisionDataBuilder(division)
                    .withFixtureDate(
                        (fd) =>
                            fd.withTournament((t) =>
                                t
                                    .type('TYPE')
                                    .address('ADDRESS')
                                    .withSide((s) =>
                                        s.name('SIDE').withPlayer('PLAYER'),
                                    ),
                            ),
                        '2023-05-06T00:00:00',
                    )
                    .season()
                    .withTeam(team)
                    .build(),
                account,
                true,
            );

            expect(
                context.optional('input[type="checkbox"][id^="showPlayers_"]'),
            ).toBeFalsy();
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
                .withFixture((f) => f.bye(team), team.id)
                .withTournament((t) => t.type('TYPE').address('ADDRESS'))
                .build();
            await renderComponent(
                props(fixtureDate),
                divisionDataBuilder(division)
                    .withFixtureDate(
                        (fd) =>
                            fd
                                .withFixture((f) => f.bye(team), team.id)
                                .withTournament((t) =>
                                    t.type('TYPE').address('ADDRESS'),
                                ),
                        '2023-05-06T00:00:00',
                    )
                    .season()
                    .withTeam(team)
                    .build(),
                account,
            );

            reportedError.verifyNoError();
            const table = context.required('table');
            expect(
                table.all('tr:not([datatype="new-tournament-fixture"])').length,
            ).toEqual(1);
            const row = table.required(
                'tr:not([datatype="new-tournament-fixture"])',
            );
            expect(row.text()).not.toContain('Bye');
            expect(row.text()).not.toContain('TEAM');
            expect(row.text()).toContain('TYPE at ADDRESS');
        });

        it('renders existing league fixtures but no potential league fixtures when any tournaments exist', async () => {
            const homeTeam = teamBuilder('HOME').build();
            const awayTeam = teamBuilder('AWAY').build();
            const fixtureDate = fixtureDateBuilder('2023-05-06T00:00:00')
                .withFixture((f) => f.bye(team), team.id)
                .withFixture((f) => f.playing(homeTeam, awayTeam), homeTeam.id)
                .withTournament((t) => t.type('TYPE').address('ADDRESS'))
                .build();
            await renderComponent(
                props(fixtureDate),
                divisionDataBuilder(division)
                    .withFixtureDate(
                        (fd) =>
                            fd
                                .withFixture((f) => f.bye(team), team.id)
                                .withFixture(
                                    (f) => f.playing(homeTeam, awayTeam),
                                    homeTeam.id,
                                )
                                .withTournament((t) =>
                                    t.type('TYPE').address('ADDRESS'),
                                ),
                        '2023-05-06T00:00:00',
                    )
                    .season()
                    .withTeam(team)
                    .withTeam(homeTeam)
                    .withTeam(awayTeam)
                    .build(),
                account,
            );

            reportedError.verifyNoError();
            const table = context.required('table');
            expect(table.all('tr').length).toEqual(2);
            const rows = table.all('tr');
            expect(
                rows.map((row) => row.required('td:nth-child(1)').text()),
            ).toEqual(['HOME', 'TYPE at ADDRESS']);
            expect(
                rows.map((row) => {
                    const activeItem = row.optional(
                        'td:nth-child(5) .dropdown-item.active',
                    );
                    return activeItem ? activeItem.text() : null;
                }),
            ).toEqual(['AWAY', null]); // null because tournaments don't have a dropdown to select away team
        });

        it('renders without teams that are assigned to another fixture on the same date', async () => {
            const fixtureDate = fixtureDateBuilder('2023-05-06T00:00:00')
                .withFixture((f) => f.bye(team), team.id)
                .withFixture((f) => f.playing(anotherTeam, team))
                .build();
            await renderComponent(
                props(fixtureDate),
                divisionDataBuilder(division)
                    .withFixtureDate(
                        (fd) =>
                            fd
                                .withFixture((f) => f.bye(team), team.id)
                                .withFixture((f) =>
                                    f.playing(anotherTeam, team),
                                ),
                        '2023-05-06T00:00:00',
                    )
                    .season()
                    .withTeam(team)
                    .build(),
                account,
            );

            reportedError.verifyNoError();
            const table = context.required('table');
            expect(table.all('tr').length).toEqual(1);
            const homeTeams = table
                .all('tr td:first-child')
                .map((td) => td.text());
            expect(homeTeams).not.toContain('TEAM');
        });

        it('can update fixtures', async () => {
            const fixtureDate = fixtureDateBuilder('2023-05-06T00:00:00')
                .withFixture((f) => f.bye(team), team.id)
                .build();
            await renderComponent(
                props(fixtureDate),
                divisionDataBuilder(division)
                    .withFixtureDate(
                        (fd) => fd.withFixture((f) => f.bye(team), team.id),
                        '2023-05-06T00:00:00',
                    )
                    .season()
                    .withTeam(team)
                    .withTeam(anotherTeam)
                    .build(),
                account,
            );
            const table = context.required('table');
            const expected = Object.assign({}, fixtureDate);
            const expectedAwayTeam = {
                id: anotherTeam.id,
                name: anotherTeam.name,
            };
            expected.fixtures![0] = Object.assign({}, expected.fixtures![0], {
                awayTeam: expectedAwayTeam,
                originalAwayTeamId: 'unset',
            });

            await table.required('.dropdown-menu').select('ANOTHER TEAM');

            reportedError.verifyNoError();
            expect(newFixtures).toEqual([expected]);
        });

        it('cannot change isKnockout when fixtures exist', async () => {
            const fixtureDate = fixtureDateBuilder('2023-05-06T00:00:00')
                .withFixture((f) => f.playing(anotherTeam, team))
                .build();

            await renderComponent(
                props(fixtureDate),
                divisionDataBuilder(division)
                    .withFixtureDate(
                        (fd) =>
                            fd.withFixture((f) => f.playing(anotherTeam, team)),
                        '2023-05-06T00:00:00',
                    )
                    .season()
                    .withTeam(team)
                    .build(),
                account,
            );

            expect(
                context.optional('input[type="checkbox"][id^="isKnockout_"]'),
            ).toBeFalsy();
        });

        it('can change isKnockout when no fixtures exist', async () => {
            const fixtureDate = fixtureDateBuilder(
                '2023-05-06T00:00:00',
            ).build();
            await renderComponent(
                props(fixtureDate),
                divisionDataBuilder(division)
                    .withFixtureDate((fd) => fd, '2023-05-06T00:00:00')
                    .season()
                    .withTeam(team)
                    .build(),
                account,
            );

            await context
                .required('input[type="checkbox"][id^="isKnockout_"]')
                .click();

            expect(newFixtures).toEqual([
                {
                    date: '2023-05-06T00:00:00',
                    fixtures: [
                        {
                            id: team.id,
                            homeTeam: {
                                id: team.id,
                                address: team.address,
                                name: team.name,
                            },
                            isKnockout: true,
                            accoladesCount: true,
                            fixturesUsingAddress: [],
                        },
                    ],
                    tournamentFixtures: [],
                    notes: [],
                    isKnockout: true,
                },
            ]);
        });

        it('can render venues after isKnockout change with no existing fixtures', async () => {
            const fixtureDate = fixtureDateBuilder('2023-05-06T00:00:00')
                .withFixture(
                    (f) => f.bye(team).knockout().accoladesCount(),
                    team.id,
                )
                .build();

            await renderComponent(
                props(fixtureDate),
                divisionDataBuilder(division)
                    .withFixtureDate(
                        (fd) =>
                            fd.withFixture(
                                (f) => f.bye(team).knockout().accoladesCount(),
                                team.id,
                            ),
                        '2023-05-06T00:00:00',
                    )
                    .season()
                    .withTeam(team)
                    .build(),
                account,
            );

            reportedError.verifyNoError();
            expect(
                context.optional('input[type="checkbox"][id^="isKnockout_"]'),
            ).toBeTruthy();
        });

        it('can add a note', async () => {
            const fixtureDate = fixtureDateBuilder('2023-05-06T00:00:00')
                .withFixture((f) => f.bye(team), team.id)
                .build();
            await renderComponent(
                props(fixtureDate),
                divisionDataBuilder(division)
                    .withFixtureDate(
                        (fd) => fd.withFixture((f) => f.bye(team), team.id),
                        '2023-05-06T00:00:00',
                    )
                    .season()
                    .withTeam(team)
                    .build(),
                account,
            );

            await context.button('📌 Add note').click();

            expect(startingToAddNote).toEqual(fixtureDate.date);
        });

        it('renders league qualifier/knockout fixtures', async () => {
            const awayTeam = teamBuilder('AWAY')
                .forSeason(season, division)
                .build();
            const fixtureId = createTemporaryId();
            const fixtureDate = fixtureDateBuilder('2023-05-06T00:00:00')
                .withFixture(
                    (f) => f.playing(team, awayTeam).knockout(),
                    fixtureId,
                )
                .build();
            await renderComponent(
                props(fixtureDate),
                divisionDataBuilder(division)
                    .withFixtureDate(
                        (fd) =>
                            fd.withFixture(
                                (f) => f.playing(team, awayTeam).knockout(),
                                fixtureId,
                            ),
                        '2023-05-06T00:00:00',
                    )
                    .season((s) => s, season.id)
                    .withTeam(team)
                    .build(),
                account,
                undefined,
                [team, awayTeam],
            );

            reportedError.verifyNoError();
            const heading = context.required('h4');
            expect(heading.text()).toContain(renderDate(fixtureDate.date));
            const table = context.required('table');
            expect(table.all('tr').length).toEqual(1);
            const row = table.required('tr');
            expect(row.html()).toContain('TEAM');
            expect(
                row.required('td:nth-child(5) .dropdown-toggle').text(),
            ).toEqual('AWAY');
        });

        it('does not render league qualifier/knockout fixtures for superleague divisions', async () => {
            const superleagueDivision: DivisionDto = divisionBuilder('DIVISION')
                .superleague()
                .build();
            const awayTeam = teamBuilder('AWAY')
                .forSeason(season, superleagueDivision)
                .build();
            const fixtureDate = fixtureDateBuilder('2023-05-06T00:00:00')
                .withFixture((f) => f.playing(team, awayTeam).knockout())
                .build();
            await renderComponent(
                props(fixtureDate),
                divisionDataBuilder(superleagueDivision)
                    .withFixtureDate(
                        (fd) =>
                            fd.withFixture((f) =>
                                f.playing(team, awayTeam).knockout(),
                            ),
                        '2023-05-06T00:00:00',
                    )
                    .season()
                    .withTeam(team)
                    .build(),
                account,
                undefined,
                [team, awayTeam],
            );

            reportedError.verifyNoError();
            const heading = context.required('h4');
            expect(heading.text()).toContain(renderDate(fixtureDate.date));
            const table = context.required('table');
            expect(table.all('tr').length).toEqual(0);
        });

        it('renders league qualifier/knockout byes', async () => {
            const awayTeam = teamBuilder('AWAY')
                .forSeason(season, division)
                .build();
            const fixtureDate = fixtureDateBuilder('2023-05-06T00:00:00')
                .withFixture((f) => f.bye(team).knockout())
                .build();
            await renderComponent(
                props(fixtureDate),
                divisionDataBuilder(division)
                    .withFixtureDate(
                        (fd) => fd.withFixture((f) => f.bye(team).knockout()),
                        '2023-05-06T00:00:00',
                    )
                    .season((s) => s, season.id)
                    .withTeam(team)
                    .build(),
                account,
                undefined,
                [team, awayTeam],
            );

            reportedError.verifyNoError();
            const heading = context.required('h4');
            expect(heading.text()).toContain(renderDate(fixtureDate.date));
            const table = context.required('table');
            expect(table.all('tr').length).toEqual(1);
            const row = table.required('tr');
            expect(row.html()).toContain('TEAM');
            expect(
                row.required('td:nth-child(5) .dropdown-toggle').text(),
            ).toEqual('');
        });
    });
});
