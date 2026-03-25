import {
    appProps,
    brandingProps,
    cleanUp,
    ErrorState,
    iocProps,
    renderApp,
    TestContext,
} from '../../helpers/tests';
import {
    DivisionDataContainer,
    IDivisionDataContainerProps,
} from '../league/DivisionDataContainer';
import { createTemporaryId } from '../../helpers/projection';
import { renderDate } from '../../helpers/rendering';
import { IPlayerOverviewProps, PlayerOverview } from './PlayerOverview';
import { DivisionPlayerDto } from '../../interfaces/models/dtos/Division/DivisionPlayerDto';
import { TeamDto } from '../../interfaces/models/dtos/Team/TeamDto';
import { SeasonDto } from '../../interfaces/models/dtos/Season/SeasonDto';
import { DivisionDto } from '../../interfaces/models/dtos/DivisionDto';
import { DivisionFixtureDateDto } from '../../interfaces/models/dtos/Division/DivisionFixtureDateDto';
import { teamBuilder } from '../../helpers/builders/teams';
import { seasonBuilder } from '../../helpers/builders/seasons';
import {
    divisionBuilder,
    divisionDataBuilder,
    fixtureDateBuilder,
} from '../../helpers/builders/divisions';

describe('PlayerOverview', () => {
    let context: TestContext;
    let reportedError: ErrorState;

    afterEach(async () => {
        await cleanUp(context);
    });

    beforeEach(() => {
        reportedError = new ErrorState();
    });

    async function renderComponent(
        props: IPlayerOverviewProps,
        divisionData: IDivisionDataContainerProps,
    ) {
        context = await renderApp(
            iocProps(),
            brandingProps(),
            appProps({}, reportedError),
            <DivisionDataContainer {...divisionData}>
                <PlayerOverview {...props} />
            </DivisionDataContainer>,
        );
    }

    describe('renders', () => {
        const division: DivisionDto = divisionBuilder('DIVISION').build();
        const season: SeasonDto = seasonBuilder('SEASON')
            .withDivision(division)
            .build();
        const team: TeamDto = teamBuilder('TEAM').build();

        const player: DivisionPlayerDto = {
            id: createTemporaryId(),
            rank: 1,
            name: 'NAME',
            team: team.name,
            teamId: team.id,
            singles: {
                matchesPlayed: 2,
                matchesWon: 3,
                matchesLost: 4,
            },
            points: 5,
            winPercentage: 6,
            oneEighties: 7,
            over100Checkouts: 8,
            fixtures: {},
        };

        it('player and team details', async () => {
            await renderComponent(
                { playerId: player.id! },
                divisionDataBuilder(division)
                    .withTeam(team)
                    .withPlayer(player)
                    .season(
                        (s) => s.withDivision(division),
                        season.id,
                        season.name,
                    )
                    .build(),
            );

            reportedError.verifyNoError();
            const heading = context.required('h3');
            expect(heading.text()).toContain(player.name);
            expect(heading.text()).toContain(team.name);
            expect(
                heading.required('a').element<HTMLAnchorElement>().href,
            ).toEqual(
                `http://localhost/division/${division.name}/team:${team.name}/${season.name}`,
            );
        });

        it('when player not found given no player name', async () => {
            await renderComponent(
                { playerId: createTemporaryId(), playerName: '' },
                divisionDataBuilder(division)
                    .withTeam(team)
                    .withPlayer(player)
                    .season((s) => s.withDivision(division))
                    .build(),
            );

            reportedError.verifyNoError();
            expect(context.text()).toContain('⚠ Player could not be found');
        });

        it('when player not found and no team', async () => {
            await renderComponent(
                { playerId: createTemporaryId(), playerName: 'PLAYER' },
                divisionDataBuilder(division)
                    .withTeam(team)
                    .withPlayer(player)
                    .season((s) => s.withDivision(division))
                    .build(),
            );

            reportedError.verifyNoError();
            expect(context.text()).toContain('⚠ PLAYER could not be found');
        });

        it('when player not found and team identified', async () => {
            await renderComponent(
                {
                    playerId: createTemporaryId(),
                    playerName: 'PLAYER',
                    teamName: 'TEAM',
                },
                divisionDataBuilder(division)
                    .withTeam(team)
                    .withPlayer(player)
                    .season((s) => s.withDivision(division))
                    .build(),
            );

            reportedError.verifyNoError();
            expect(context.text()).toContain('⚠ PLAYER could not be found');
            expect(context.text()).toContain('View TEAM team');
        });

        it('table headings', async () => {
            await renderComponent(
                { playerId: player.id! },
                divisionDataBuilder(division)
                    .withTeam(team)
                    .withPlayer(player)
                    .season((s) => s.withDivision(division))
                    .build(),
            );

            reportedError.verifyNoError();
            const table = context.required('table.table');
            const headings = table.all('thead tr th').map((th) => th.text());
            expect(headings).toEqual(['Date', 'Home', '', 'vs', '', 'Away']);
        });

        it('league fixture', async () => {
            const fixtureId = createTemporaryId();
            const fixtureDate: DivisionFixtureDateDto = fixtureDateBuilder(
                '2023-05-06T00:00:00',
            )
                .withFixture(
                    (f) =>
                        f
                            .playing(teamBuilder('HOME').build(), team)
                            .scores(3, 1),
                    fixtureId,
                )
                .build();
            const playerWithLeagueFixture = Object.assign({}, player);
            playerWithLeagueFixture.fixtures![fixtureDate.date] = fixtureId;
            await renderComponent(
                { playerId: playerWithLeagueFixture.id! },
                divisionDataBuilder(division)
                    .withTeam(team)
                    .withPlayer(playerWithLeagueFixture)
                    .withFixtureDate(
                        (fd) =>
                            fd.withFixture(
                                (f) =>
                                    f
                                        .playing(
                                            teamBuilder('HOME').build(),
                                            team,
                                        )
                                        .scores(3, 1),
                                fixtureId,
                            ),
                        '2023-05-06T00:00:00',
                    )
                    .season(
                        (s) => s.withDivision(division),
                        season.id,
                        season.name,
                    )
                    .build(),
            );

            reportedError.verifyNoError();
            const table = context.required('table.table');
            const rows = table.all('tbody tr');
            expect(rows.length).toEqual(1);
            const cells = rows[0].all('td');
            expect(cells.map((td) => td.text())).toEqual([
                renderDate(fixtureDate.date),
                'HOME',
                '3',
                'vs',
                '1',
                'TEAM',
            ]);
            expect(
                cells[0].required('a').element<HTMLAnchorElement>().href,
            ).toEqual(`http://localhost/score/${fixtureId}`);
            expect(
                cells[1].required('a').element<HTMLAnchorElement>().href,
            ).toEqual(
                `http://localhost/division/${division.name}/team:HOME/${season.name}`,
            );
            expect(cells[5].optional('a')).toBeFalsy();
        });

        it('league fixture with no scores', async () => {
            const fixtureId = createTemporaryId();
            const fixtureDate: DivisionFixtureDateDto = fixtureDateBuilder(
                '2023-05-06T00:00:00',
            )
                .withFixture(
                    (f) =>
                        f
                            .playing(teamBuilder('HOME').build(), team)
                            .scores(undefined, undefined),
                    fixtureId,
                )
                .build();
            const playerWithLeagueFixture = Object.assign({}, player);
            playerWithLeagueFixture.fixtures![fixtureDate.date] = fixtureId;
            await renderComponent(
                { playerId: playerWithLeagueFixture.id! },
                divisionDataBuilder(division)
                    .withTeam(team)
                    .withPlayer(playerWithLeagueFixture)
                    .withFixtureDate(
                        (fd) =>
                            fd.withFixture(
                                (f) =>
                                    f
                                        .playing(
                                            teamBuilder('HOME').build(),
                                            team,
                                        )
                                        .scores(undefined, undefined),
                                fixtureId,
                            ),
                        '2023-05-06T00:00:00',
                    )
                    .season(
                        (s) => s.withDivision(division),
                        season.id,
                        season.name,
                    )
                    .build(),
            );

            reportedError.verifyNoError();
            const table = context.required('table.table');
            const rows = table.all('tbody tr');
            expect(rows.length).toEqual(1);
            const cells = rows[0].all('td');
            expect(cells.map((td) => td.text())).toEqual([
                renderDate(fixtureDate.date),
                'HOME',
                '-',
                'vs',
                '-',
                'TEAM',
            ]);
            expect(
                cells[0].required('a').element<HTMLAnchorElement>().href,
            ).toEqual(`http://localhost/score/${fixtureId}`);
            expect(
                cells[1].required('a').element<HTMLAnchorElement>().href,
            ).toEqual(
                `http://localhost/division/${division.name}/team:HOME/${season.name}`,
            );
            expect(cells[5].optional('a')).toBeFalsy();
        });

        it('league knockout fixture', async () => {
            const fixtureId = createTemporaryId();
            const fixtureDate: DivisionFixtureDateDto = fixtureDateBuilder(
                '2023-05-06T00:00:00',
            )
                .withFixture(
                    (f) =>
                        f
                            .playing(team, teamBuilder('AWAY').build())
                            .knockout()
                            .scores(3, 1),
                    fixtureId,
                )
                .build();
            const playerWithLeagueFixture = Object.assign({}, player);
            playerWithLeagueFixture.fixtures![fixtureDate.date] = fixtureId;
            await renderComponent(
                { playerId: playerWithLeagueFixture.id! },
                divisionDataBuilder(division)
                    .withTeam(team)
                    .withPlayer(playerWithLeagueFixture)
                    .withFixtureDate(
                        (fd) =>
                            fd.withFixture(
                                (f) =>
                                    f
                                        .playing(
                                            team,
                                            teamBuilder('AWAY').build(),
                                        )
                                        .knockout()
                                        .scores(3, 1),
                                fixtureId,
                            ),
                        '2023-05-06T00:00:00',
                    )
                    .season(
                        (s) => s.withDivision(division),
                        season.id,
                        season.name,
                    )
                    .build(),
            );

            reportedError.verifyNoError();
            const table = context.required('table.table');
            const rows = table.all('tbody tr');
            expect(rows.length).toEqual(1);
            const cells = rows[0].all('td');
            expect(cells.map((td) => td.text())).toEqual([
                renderDate(fixtureDate.date),
                'TEAM',
                '3',
                'vs',
                '1',
                'AWAY',
            ]);
            expect(
                cells[0].required('a').element<HTMLAnchorElement>().href,
            ).toEqual(`http://localhost/score/${fixtureId}`);
            expect(cells[1].optional('a')).toBeFalsy();
            expect(
                cells[5].required('a').element<HTMLAnchorElement>().href,
            ).toEqual(
                `http://localhost/division/${division.name}/team:AWAY/${season.name}`,
            );
        });

        it('postponed league fixture', async () => {
            const fixtureId = createTemporaryId();
            const fixtureDate: DivisionFixtureDateDto = fixtureDateBuilder(
                '2023-05-06T00:00:00',
            )
                .withFixture(
                    (f) =>
                        f
                            .playing(team, teamBuilder('AWAY').build())
                            .scores(3, 1)
                            .postponed(),
                    fixtureId,
                )
                .build();
            const playerWithLeagueFixture = Object.assign({}, player);
            playerWithLeagueFixture.fixtures![fixtureDate.date] = fixtureId;
            await renderComponent(
                { playerId: playerWithLeagueFixture.id! },
                divisionDataBuilder(division)
                    .withTeam(team)
                    .withPlayer(playerWithLeagueFixture)
                    .withFixtureDate(
                        (fd) =>
                            fd.withFixture(
                                (f) =>
                                    f
                                        .playing(
                                            team,
                                            teamBuilder('AWAY').build(),
                                        )
                                        .scores(3, 1)
                                        .postponed(),
                                fixtureId,
                            ),
                        '2023-05-06T00:00:00',
                    )
                    .season(
                        (s) => s.withDivision(division),
                        season.id,
                        season.name,
                    )
                    .build(),
            );

            reportedError.verifyNoError();
            const table = context.required('table.table');
            const rows = table.all('tbody tr');
            expect(rows.length).toEqual(1);
            const cells = rows[0].all('td');
            expect(cells.map((td) => td.text())).toEqual([
                renderDate(fixtureDate.date),
                'TEAM',
                'P',
                'vs',
                'P',
                'AWAY',
            ]);
            expect(
                cells[0].required('a').element<HTMLAnchorElement>().href,
            ).toEqual(`http://localhost/score/${fixtureId}`);
            expect(cells[1].optional('a')).toBeFalsy();
            expect(
                cells[5].required('a').element<HTMLAnchorElement>().href,
            ).toEqual(
                `http://localhost/division/${division.name}/team:AWAY/${season.name}`,
            );
        });

        it('unplayed tournament fixture', async () => {
            const tournamentId = createTemporaryId();
            const fixtureDate: DivisionFixtureDateDto = fixtureDateBuilder(
                '2023-05-06T00:00:00',
            )
                .withTournament(
                    (t) => t.withPlayer(player).type('TYPE').address('ADDRESS'),
                    tournamentId,
                )
                .build();
            await renderComponent(
                { playerId: player.id! },
                divisionDataBuilder(division)
                    .withTeam(team)
                    .withPlayer(player)
                    .withFixtureDate(
                        (fd) =>
                            fd.withTournament(
                                (t) =>
                                    t
                                        .withPlayer(player)
                                        .type('TYPE')
                                        .address('ADDRESS'),
                                tournamentId,
                            ),
                        '2023-05-06T00:00:00',
                    )
                    .season((s) => s.withDivision(division))
                    .build(),
            );

            reportedError.verifyNoError();
            const table = context.required('table.table');
            const rows = table.all('tbody tr');
            expect(rows.length).toEqual(1);
            const cells = rows[0].all('td');
            expect(cells.map((td) => td.text())).toEqual([
                renderDate(fixtureDate.date),
                'TYPE at ADDRESS',
                '',
            ]);
            expect(
                cells[0].required('a').element<HTMLAnchorElement>().href,
            ).toEqual(`http://localhost/tournament/${tournamentId}`);
        });

        it('tournament fixture with winner', async () => {
            const tournamentId = createTemporaryId();
            const fixtureDate: DivisionFixtureDateDto = fixtureDateBuilder(
                '2023-05-06T00:00:00',
            )
                .withTournament(
                    (t) =>
                        t
                            .withPlayer(player)
                            .type('TYPE')
                            .address('ADDRESS')
                            .winner('WINNER'),
                    tournamentId,
                )
                .build();
            await renderComponent(
                { playerId: player.id! },
                divisionDataBuilder(division)
                    .withTeam(team)
                    .withPlayer(player)
                    .withFixtureDate(
                        (fd) =>
                            fd.withTournament(
                                (t) =>
                                    t
                                        .withPlayer(player)
                                        .type('TYPE')
                                        .address('ADDRESS')
                                        .winner('WINNER'),
                                tournamentId,
                            ),
                        '2023-05-06T00:00:00',
                    )
                    .season((s) => s.withDivision(division))
                    .build(),
            );

            reportedError.verifyNoError();
            const table = context.required('table.table');
            const rows = table.all('tbody tr');
            expect(rows.length).toEqual(1);
            const cells = rows[0].all('td');
            expect(cells.map((td) => td.text())).toEqual([
                renderDate(fixtureDate.date),
                'TYPE at ADDRESS',
                'Winner: WINNER',
            ]);
            expect(
                cells[0].required('a').element<HTMLAnchorElement>().href,
            ).toEqual(`http://localhost/tournament/${tournamentId}`);
        });

        it('excludes proposed tournament fixtures', async () => {
            await renderComponent(
                { playerId: player.id! },
                divisionDataBuilder(division)
                    .withTeam(team)
                    .withPlayer(player)
                    .withFixtureDate((fd) =>
                        fd.withTournament((t) =>
                            t
                                .withPlayer(player)
                                .type('TYPE')
                                .address('ADDRESS')
                                .winner('WINNER')
                                .proposed(),
                        ),
                    )
                    .season((s) => s.withDivision(division))
                    .build(),
            );

            reportedError.verifyNoError();
            const table = context.required('table.table');
            const rows = table.all('tbody tr');
            expect(rows.length).toEqual(0);
        });
    });
});
