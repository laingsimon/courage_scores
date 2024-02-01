import {appProps, brandingProps, cleanUp, ErrorState, iocProps, renderApp, TestContext} from "../../helpers/tests";
import React from "react";
import {createTemporaryId} from "../../helpers/projection";
import {DivisionDataContainer, IDivisionDataContainerProps} from "../DivisionDataContainer";
import {TeamOverview} from "./TeamOverview";
import {UserDto} from "../../interfaces/models/dtos/Identity/UserDto";
import {TeamDto} from "../../interfaces/models/dtos/Team/TeamDto";
import {SeasonDto} from "../../interfaces/models/dtos/Season/SeasonDto";
import {DivisionPlayerDto} from "../../interfaces/models/dtos/Division/DivisionPlayerDto";
import {DivisionFixtureDateDto} from "../../interfaces/models/dtos/Division/DivisionFixtureDateDto";
import {divisionDataBuilder, fixtureDateBuilder} from "../../helpers/builders/divisions";
import {seasonBuilder} from "../../helpers/builders/seasons";
import {teamBuilder} from "../../helpers/builders/teams";
import {IFixtureBuilder} from "../../helpers/builders/games";

describe('TeamOverview', () => {
    let context: TestContext;
    let reportedError: ErrorState;
    let account: UserDto;

    afterEach(() => {
        cleanUp(context);
    });

    beforeEach(() => {
        reportedError = new ErrorState();
    });

    async function renderComponent(divisionData: IDivisionDataContainerProps, teams: TeamDto[], teamId: string) {
        context = await renderApp(
            iocProps(),
            brandingProps(),
            appProps({
                account: account,
                teams: teams,
            }, reportedError),
            (<DivisionDataContainer {...divisionData}>
                <TeamOverview teamId={teamId}/>
            </DivisionDataContainer>));
    }

    function createDivisionData(divisionId: string): IDivisionDataContainerProps {
        const season: SeasonDto = seasonBuilder('A season')
            .starting('2022-02-03T00:00:00')
            .ending('2022-08-25T00:00:00')
            .build();

        return divisionDataBuilder(divisionId)
            .season(season)
            .build();
    }

    function createTeam(teamId: string): TeamDto {
        return teamBuilder('A team', teamId)
            .address('An address')
            .build();
    }

    function createPlayer(team: TeamDto): DivisionPlayerDto {
        return {
            id: createTemporaryId(),
            teamId: team.id,
            team: team.name,
            name: 'A player',
            singles: {
                matchesPlayed: 1,
                matchesWon: 2,
                matchesLost: 3,
            },
            points: 4,
            winPercentage: 0.5,
            oneEighties: 6,
            over100Checkouts: 7
        }
    }

    function createHomeAndAwayFixtureDates(team: TeamDto) {
        const homeFixtureDate: DivisionFixtureDateDto = fixtureDateBuilder('2001-02-03T04:05:06.000Z')
            .withFixture((f: IFixtureBuilder) => f.playing(team, teamBuilder('Another team')))
            .build();

        const byeFixtureDate: DivisionFixtureDateDto = fixtureDateBuilder('2001-02-04T04:05:06.000Z')
            .withFixture((f: IFixtureBuilder) => f.bye(team.address))
            .build();

        const awayFixtureDate: DivisionFixtureDateDto = fixtureDateBuilder('2001-02-05T04:05:06.000Z')
            .withFixture((f: IFixtureBuilder) => f.playing(teamBuilder('Another team'), team))
            .build();

        return [homeFixtureDate, awayFixtureDate, byeFixtureDate];
    }

    function assertFixtureRow(tr: HTMLTableRowElement, date: string, homeTeamName: string, awayTeamName: string) {
        const cells = tr.querySelectorAll('td');
        expect(cells.length).toEqual(6);
        expect(cells[0].textContent).toEqual(date);
        expect(cells[1].textContent).toEqual(homeTeamName);
        expect(cells[5].textContent).toEqual(awayTeamName);
    }

    function assertPlayerRow(tr: HTMLTableRowElement, name: string) {
        const cells = tr.querySelectorAll('td');
        expect(cells.length).toEqual(9);
        expect(cells[1].textContent).toEqual(name);
    }

    describe('when selected for season', () => {
        it('renders team details', async () => {
            const divisionId = createTemporaryId();
            const divisionData = createDivisionData(divisionId);
            const teamId = createTemporaryId();
            const teams = [createTeam(teamId)];

            await renderComponent(divisionData, teams, teamId);

            expect(reportedError.hasError()).toEqual(false);
            const heading = context.container.querySelector('.content-background > h3');
            const address = context.container.querySelector('.content-background > p');
            expect(heading).toBeTruthy();
            expect(address).toBeTruthy();
            expect(heading.textContent).toEqual('A team 🔗');
            expect(address.textContent).toEqual('Address: An address');
        });

        it('renders team not found', async () => {
            const divisionId = createTemporaryId();
            const divisionData = createDivisionData(divisionId);
            const teamId = createTemporaryId();
            const teams = [createTeam(teamId)];

            await renderComponent(divisionData, teams, createTemporaryId());

            expect(reportedError.hasError()).toEqual(false);
            expect(context.container.textContent).toContain('Team could not be found');
        });

        it('renders fixtures', async () => {
            const divisionId = createTemporaryId();
            const divisionData = createDivisionData(divisionId);
            const team = createTeam(createTemporaryId());
            divisionData.fixtures.push(...createHomeAndAwayFixtureDates(team));

            await renderComponent(divisionData, [team], team.id);

            expect(reportedError.hasError()).toEqual(false);
            const tableSections = context.container.querySelectorAll('.content-background > div.overflow-x-auto');
            expect(tableSections.length).toEqual(2);
            const fixturesSection = tableSections[0];
            const fixtureRows = Array.from(fixturesSection.querySelectorAll('table tbody tr')) as HTMLTableRowElement[];
            expect(fixtureRows.length).toEqual(2);
            assertFixtureRow(fixtureRows[0], '3 Feb', team.name, 'Another team');
            assertFixtureRow(fixtureRows[1], '5 Feb', 'Another team', team.name);
        });

        it('renders postponed fixtures', async () => {
            const divisionId = createTemporaryId();
            const divisionData = createDivisionData(divisionId);
            const team = createTeam(createTemporaryId());
            divisionData.fixtures.push(...createHomeAndAwayFixtureDates(team));
            divisionData.fixtures[0].fixtures[0].postponed = true;

            await renderComponent(divisionData, [team], team.id);

            expect(reportedError.hasError()).toEqual(false);
            const tableSections = Array.from(context.container.querySelectorAll('.content-background > div.overflow-x-auto')) as HTMLElement[];
            expect(tableSections.length).toEqual(2);
            const fixturesSection = tableSections[0];
            const fixtureRows = fixturesSection.querySelectorAll('table tbody tr');
            expect(fixtureRows.length).toEqual(2);
            const cellText = Array.from(fixtureRows[0].querySelectorAll('td')).map(td => td.textContent);
            expect(cellText[2]).toEqual('P');
            expect(cellText[4]).toEqual('P');
        });

        it('renders fixtures without scores', async () => {
            const divisionId = createTemporaryId();
            const divisionData = createDivisionData(divisionId);
            const team = createTeam(createTemporaryId());
            divisionData.fixtures.push(...createHomeAndAwayFixtureDates(team));
            divisionData.fixtures[0].fixtures[0].homeScore = null;
            divisionData.fixtures[0].fixtures[0].awayScore = null;

            await renderComponent(divisionData, [team], team.id);

            expect(reportedError.hasError()).toEqual(false);
            const tableSections = Array.from(context.container.querySelectorAll('.content-background > div.overflow-x-auto')) as HTMLElement[];
            expect(tableSections.length).toEqual(2);
            const fixturesSection = tableSections[0];
            const fixtureRows = fixturesSection.querySelectorAll('table tbody tr');
            expect(fixtureRows.length).toEqual(2);
            const cellText = Array.from(fixtureRows[0].querySelectorAll('td')).map(td => td.textContent);
            expect(cellText[2]).toEqual('-');
            expect(cellText[4]).toEqual('-');
        });

        it('renders players', async () => {
            const divisionId = createTemporaryId();
            const divisionData = createDivisionData(divisionId);
            const team = createTeam(createTemporaryId());
            const player = createPlayer(team);
            divisionData.players.push(player);

            await renderComponent(divisionData, [team], team.id);

            expect(reportedError.hasError()).toEqual(false);
            const tableSections = Array.from(context.container.querySelectorAll('.content-background > div.overflow-x-auto')) as HTMLElement[];
            expect(tableSections.length).toEqual(2);
            const playersSection = tableSections[1];
            const playerRows = Array.from(playersSection.querySelectorAll('table tbody tr')) as HTMLTableRowElement[];
            expect(playerRows.length).toEqual(1);
            assertPlayerRow(playerRows[0], player.name);
        });
    });

    describe('when not selected for season', () => {
        it('renders team details', async () => {
            const divisionId = createTemporaryId();
            const divisionData = createDivisionData(divisionId);
            const teamId = createTemporaryId();
            const teams = [createTeam(teamId)];

            await renderComponent(divisionData, teams, teamId);

            expect(reportedError.hasError()).toEqual(false);
            const heading = context.container.querySelector('.content-background > h3');
            const address = context.container.querySelector('.content-background > p');
            expect(heading).toBeTruthy();
            expect(address).toBeTruthy();
            expect(heading.textContent).toEqual('A team 🔗');
            expect(address.textContent).toEqual('Address: An address');
        });

        it('does not render fixtures', async () => {
            const divisionId = createTemporaryId();
            const divisionData = createDivisionData(divisionId);
            const team = createTeam(createTemporaryId());

            await renderComponent(divisionData, [team], team.id);

            expect(reportedError.hasError()).toEqual(false);
            const tableSections = Array.from(context.container.querySelectorAll('.content-background > div.overflow-x-auto')) as HTMLElement[];
            expect(tableSections.length).toEqual(2);
            const fixturesSection = tableSections[0];
            const fixtureRows = Array.from(fixturesSection.querySelectorAll('table tbody tr')) as HTMLTableRowElement[];
            expect(fixtureRows.length).toEqual(0);
        });

        it('does not render players', async () => {
            const divisionId = createTemporaryId();
            const divisionData = createDivisionData(divisionId);
            const team = createTeam(createTemporaryId());

            await renderComponent(divisionData, [team], team.id);

            expect(reportedError.hasError()).toEqual(false);
            const tableSections = Array.from(context.container.querySelectorAll('.content-background > div.overflow-x-auto')) as HTMLElement[];
            expect(tableSections.length).toEqual(2);
            const playersSection = tableSections[1];
            const playerRows = Array.from(playersSection.querySelectorAll('table tbody tr')) as HTMLTableRowElement[];
            expect(playerRows.length).toEqual(0);
        });
    });
});