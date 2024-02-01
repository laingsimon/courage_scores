import {appProps, brandingProps, cleanUp, ErrorState, iocProps, renderApp, TestContext} from "../../helpers/tests";
import React from "react";
import {DivisionDataContainer, IDivisionDataContainerProps} from "../DivisionDataContainer";
import {createTemporaryId} from "../../helpers/projection";
import {renderDate} from "../../helpers/rendering";
import {PlayerOverview} from "./PlayerOverview";
import {DivisionPlayerDto} from "../../interfaces/models/dtos/Division/DivisionPlayerDto";
import {TeamDto} from "../../interfaces/models/dtos/Team/TeamDto";
import {SeasonDto} from "../../interfaces/models/dtos/Season/SeasonDto";
import {DivisionDto} from "../../interfaces/models/dtos/DivisionDto";
import {DivisionFixtureDateDto} from "../../interfaces/models/dtos/Division/DivisionFixtureDateDto";
import {teamBuilder} from "../../helpers/builders/teams";
import {seasonBuilder} from "../../helpers/builders/seasons";
import {
    divisionBuilder,
    divisionDataBuilder,
    fixtureDateBuilder,
    IDivisionFixtureBuilder
} from "../../helpers/builders/divisions";
import {ITournamentBuilder} from "../../helpers/builders/tournaments";

describe('PlayerOverview', () => {
    let context: TestContext;
    let reportedError: ErrorState;

    afterEach(() => {
        cleanUp(context);
    });

    beforeEach(() => {
        reportedError = new ErrorState();
    });

    async function renderComponent(playerId: string, divisionData: IDivisionDataContainerProps) {
        context = await renderApp(
            iocProps(),
            brandingProps(),
            appProps({}, reportedError),
            (<DivisionDataContainer {...divisionData}>
                <PlayerOverview playerId={playerId}/>
            </DivisionDataContainer>));
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
            fixtures: {}
        };

        it('player and team details', async () => {
            await renderComponent(
                player.id,
                divisionDataBuilder(division)
                    .withTeam(team)
                    .withPlayer(player)
                    .season(season)
                    .build());

            expect(reportedError.hasError()).toEqual(false);
            const heading = context.container.querySelector('h3');
            expect(heading).toBeTruthy();
            expect(heading.textContent).toContain(player.name);
            expect(heading.textContent).toContain(team.name);
            const linkToTeam = heading.querySelector('a');
            expect(linkToTeam).toBeTruthy();
            expect(linkToTeam.href).toEqual(`http://localhost/division/${division.name}/team:${team.name}/${season.name}`);
        });

        it('when player not found', async () => {
            await renderComponent(
                createTemporaryId(),
                divisionDataBuilder(division)
                    .withTeam(team)
                    .withPlayer(player)
                    .season(season)
                    .build());

            expect(reportedError.hasError()).toEqual(false);
            expect(context.container.textContent).toContain('⚠ Player could not be found');
        });

        it('table headings', async () => {
            await renderComponent(
                player.id,
                divisionDataBuilder(division)
                    .withTeam(team)
                    .withPlayer(player)
                    .season(season)
                    .build());

            expect(reportedError.hasError()).toEqual(false);
            const table = context.container.querySelector('table.table');
            expect(table).toBeTruthy();
            const headings = Array.from(table.querySelectorAll('thead tr th')).map(th => th.textContent);
            expect(headings).toEqual(['Date', 'Home', '', 'vs', '', 'Away']);
        });

        it('league fixture', async () => {
            const fixtureId = createTemporaryId();
            const fixtureDate: DivisionFixtureDateDto = fixtureDateBuilder('2023-05-06T00:00:00')
                .withFixture((f: IDivisionFixtureBuilder) => f.playing(teamBuilder('HOME'), team).scores(3, 1), fixtureId)
                .build();
            const playerWithLeagueFixture = Object.assign({}, player);
            playerWithLeagueFixture.fixtures[fixtureDate.date] = fixtureId;
            await renderComponent(
                playerWithLeagueFixture.id,
                divisionDataBuilder(division)
                    .withTeam(team)
                    .withPlayer(playerWithLeagueFixture)
                    .withFixtureDate(fixtureDate)
                    .season(season)
                    .build());

            expect(reportedError.hasError()).toEqual(false);
            const table = context.container.querySelector('table.table');
            expect(table).toBeTruthy();
            const rows = Array.from(table.querySelectorAll('tbody tr'));
            expect(rows.length).toEqual(1);
            const cells = Array.from(rows[0].querySelectorAll('td'));
            expect(cells.map(td => td.textContent)).toEqual([
                renderDate(fixtureDate.date),
                'HOME',
                '3',
                'vs',
                '1',
                'TEAM',
            ]);
            const linkToFixture = cells[0].querySelector('a');
            expect(linkToFixture).toBeTruthy();
            expect(linkToFixture.href).toEqual(`http://localhost/score/${fixtureId}`);
            const linkToHomeTeam = cells[1].querySelector('a');
            expect(linkToHomeTeam).toBeTruthy();
            expect(linkToHomeTeam.href).toEqual(`http://localhost/division/${division.name}/team:HOME/${season.name}`);
            const linkToAwayTeam = cells[5].querySelector('a');
            expect(linkToAwayTeam).toBeFalsy();
        });

        it('league fixture with no scores', async () => {
            const fixtureId = createTemporaryId();
            const fixtureDate: DivisionFixtureDateDto = fixtureDateBuilder('2023-05-06T00:00:00')
                .withFixture((f: IDivisionFixtureBuilder) => f.playing(teamBuilder('HOME'), team).scores(null, null), fixtureId)
                .build();
            const playerWithLeagueFixture = Object.assign({}, player);
            playerWithLeagueFixture.fixtures[fixtureDate.date] = fixtureId;
            await renderComponent(
                playerWithLeagueFixture.id,
                divisionDataBuilder(division)
                    .withTeam(team)
                    .withPlayer(playerWithLeagueFixture)
                    .withFixtureDate(fixtureDate)
                    .season(season)
                    .build());

            expect(reportedError.hasError()).toEqual(false);
            const table = context.container.querySelector('table.table');
            expect(table).toBeTruthy();
            const rows = Array.from(table.querySelectorAll('tbody tr'));
            expect(rows.length).toEqual(1);
            const cells = Array.from(rows[0].querySelectorAll('td'));
            expect(cells.map(td => td.textContent)).toEqual([
                renderDate(fixtureDate.date),
                'HOME',
                '-',
                'vs',
                '-',
                'TEAM',
            ]);
            const linkToFixture = cells[0].querySelector('a');
            expect(linkToFixture).toBeTruthy();
            expect(linkToFixture.href).toEqual(`http://localhost/score/${fixtureId}`);
            const linkToHomeTeam = cells[1].querySelector('a');
            expect(linkToHomeTeam).toBeTruthy();
            expect(linkToHomeTeam.href).toEqual(`http://localhost/division/${division.name}/team:HOME/${season.name}`);
            const linkToAwayTeam = cells[5].querySelector('a');
            expect(linkToAwayTeam).toBeFalsy();
        });

        it('league knockout fixture', async () => {
            const fixtureId = createTemporaryId();
            const fixtureDate: DivisionFixtureDateDto = fixtureDateBuilder('2023-05-06T00:00:00')
                .withFixture((f: IDivisionFixtureBuilder) => f.playing(team, teamBuilder('AWAY'))
                    .knockout()
                    .scores(3, 1), fixtureId)
                .build();
            const playerWithLeagueFixture = Object.assign({}, player);
            playerWithLeagueFixture.fixtures[fixtureDate.date] = fixtureId;
            await renderComponent(
                playerWithLeagueFixture.id,
                divisionDataBuilder(division)
                    .withTeam(team)
                    .withPlayer(playerWithLeagueFixture)
                    .withFixtureDate(fixtureDate)
                    .season(season)
                    .build());

            expect(reportedError.hasError()).toEqual(false);
            const table = context.container.querySelector('table.table');
            expect(table).toBeTruthy();
            const rows = Array.from(table.querySelectorAll('tbody tr'));
            expect(rows.length).toEqual(1);
            const cells = Array.from(rows[0].querySelectorAll('td'));
            expect(cells.map(td => td.textContent)).toEqual([
                renderDate(fixtureDate.date),
                'TEAM',
                '3',
                'vs',
                '1',
                'AWAY',
            ]);
            const linkToFixture = cells[0].querySelector('a');
            expect(linkToFixture).toBeTruthy();
            expect(linkToFixture.href).toEqual(`http://localhost/score/${fixtureId}`);
            const linkToHomeTeam = cells[1].querySelector('a');
            expect(linkToHomeTeam).toBeFalsy();
            const linkToAwayTeam = cells[5].querySelector('a');
            expect(linkToAwayTeam).toBeTruthy();
            expect(linkToAwayTeam.href).toEqual(`http://localhost/division/${division.name}/team:AWAY/${season.name}`);
        });

        it('postponed league fixture', async () => {
            const fixtureId = createTemporaryId();
            const fixtureDate: DivisionFixtureDateDto = fixtureDateBuilder('2023-05-06T00:00:00')
                .withFixture((f: IDivisionFixtureBuilder) => f.playing(team, teamBuilder('AWAY'))
                    .scores(3, 1)
                    .postponed(), fixtureId)
                .build();
            const playerWithLeagueFixture = Object.assign({}, player);
            playerWithLeagueFixture.fixtures[fixtureDate.date] = fixtureId;
            await renderComponent(
                playerWithLeagueFixture.id,
                divisionDataBuilder(division)
                    .withTeam(team)
                    .withPlayer(playerWithLeagueFixture)
                    .withFixtureDate(fixtureDate)
                    .season(season)
                    .build());

            expect(reportedError.hasError()).toEqual(false);
            const table = context.container.querySelector('table.table');
            expect(table).toBeTruthy();
            const rows = Array.from(table.querySelectorAll('tbody tr'));
            expect(rows.length).toEqual(1);
            const cells = Array.from(rows[0].querySelectorAll('td'));
            expect(cells.map(td => td.textContent)).toEqual([
                renderDate(fixtureDate.date),
                'TEAM',
                'P',
                'vs',
                'P',
                'AWAY',
            ]);
            const linkToFixture = cells[0].querySelector('a');
            expect(linkToFixture).toBeTruthy();
            expect(linkToFixture.href).toEqual(`http://localhost/score/${fixtureId}`);
            const linkToHomeTeam = cells[1].querySelector('a');
            expect(linkToHomeTeam).toBeFalsy();
            const linkToAwayTeam = cells[5].querySelector('a');
            expect(linkToAwayTeam).toBeTruthy();
            expect(linkToAwayTeam.href).toEqual(`http://localhost/division/${division.name}/team:AWAY/${season.name}`);
        });

        it('unplayed tournament fixture', async () => {
            const tournamentId = createTemporaryId();
            const fixtureDate: DivisionFixtureDateDto = fixtureDateBuilder('2023-05-06T00:00:00')
                .withTournament((t: ITournamentBuilder) => t.withPlayer(player)
                    .type('TYPE')
                    .address('ADDRESS'), tournamentId)
                .build();
            await renderComponent(
                player.id,
                divisionDataBuilder(division)
                    .withTeam(team)
                    .withPlayer(player)
                    .withFixtureDate(fixtureDate)
                    .season(season)
                    .build());

            expect(reportedError.hasError()).toEqual(false);
            const table = context.container.querySelector('table.table');
            expect(table).toBeTruthy();
            const rows = Array.from(table.querySelectorAll('tbody tr'));
            expect(rows.length).toEqual(1);
            const cells = Array.from(rows[0].querySelectorAll('td'));
            expect(cells.map(td => td.textContent)).toEqual([
                renderDate(fixtureDate.date),
                'TYPE at ADDRESS',
                ''
            ]);
            const linkToFixture = cells[0].querySelector('a');
            expect(linkToFixture).toBeTruthy();
            expect(linkToFixture.href).toEqual(`http://localhost/tournament/${tournamentId}`);
        });

        it('tournament fixture with winner', async () => {
            const tournamentId = createTemporaryId();
            const fixtureDate: DivisionFixtureDateDto = fixtureDateBuilder('2023-05-06T00:00:00')
                .withTournament((t: ITournamentBuilder) => t.withPlayer(player)
                    .type('TYPE')
                    .address('ADDRESS')
                    .winner('WINNER'), tournamentId)
                .build();
            await renderComponent(
                player.id,
                divisionDataBuilder(division)
                    .withTeam(team)
                    .withPlayer(player)
                    .withFixtureDate(fixtureDate)
                    .season(season)
                    .build());

            expect(reportedError.hasError()).toEqual(false);
            const table = context.container.querySelector('table.table');
            expect(table).toBeTruthy();
            const rows = Array.from(table.querySelectorAll('tbody tr'));
            expect(rows.length).toEqual(1);
            const cells = Array.from(rows[0].querySelectorAll('td'));
            expect(cells.map(td => td.textContent)).toEqual([
                renderDate(fixtureDate.date),
                'TYPE at ADDRESS',
                'Winner: WINNER',
            ]);
            const linkToFixture = cells[0].querySelector('a');
            expect(linkToFixture).toBeTruthy();
            expect(linkToFixture.href).toEqual(`http://localhost/tournament/${tournamentId}`);
        });

        it('excludes proposed tournament fixtures', async () => {
            const fixtureDate: DivisionFixtureDateDto = fixtureDateBuilder('2023-05-06T00:00:00')
                .withTournament((t: ITournamentBuilder) => t.withPlayer(player)
                    .type('TYPE')
                    .address('ADDRESS')
                    .winner('WINNER')
                    .proposed())
                .build();
            await renderComponent(
                player.id,
                divisionDataBuilder(division)
                    .withTeam(team)
                    .withPlayer(player)
                    .withFixtureDate(fixtureDate)
                    .season(season)
                    .build());

            expect(reportedError.hasError()).toEqual(false);
            const table = context.container.querySelector('table.table');
            expect(table).toBeTruthy();
            const rows = Array.from(table.querySelectorAll('tbody tr'));
            expect(rows.length).toEqual(0);
        });
    });
});