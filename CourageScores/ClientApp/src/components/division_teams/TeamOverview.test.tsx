import {
    appProps,
    brandingProps,
    cleanUp,
    ErrorState,
    IComponent,
    iocProps,
    renderApp,
    TestContext,
} from '../../helpers/tests';
import { createTemporaryId } from '../../helpers/projection';
import {
    DivisionDataContainer,
    IDivisionDataContainerProps,
} from '../league/DivisionDataContainer';
import { TeamOverview } from './TeamOverview';
import { UserDto } from '../../interfaces/models/dtos/Identity/UserDto';
import { TeamDto } from '../../interfaces/models/dtos/Team/TeamDto';
import { DivisionPlayerDto } from '../../interfaces/models/dtos/Division/DivisionPlayerDto';
import { DivisionFixtureDateDto } from '../../interfaces/models/dtos/Division/DivisionFixtureDateDto';
import {
    divisionBuilder,
    divisionDataBuilder,
    fixtureDateBuilder,
} from '../../helpers/builders/divisions';
import { teamBuilder } from '../../helpers/builders/teams';

describe('TeamOverview', () => {
    let context: TestContext;
    let reportedError: ErrorState;
    let account: UserDto | undefined;

    afterEach(async () => {
        await cleanUp(context);
    });

    beforeEach(() => {
        reportedError = new ErrorState();
    });

    async function renderComponent(
        divisionData: IDivisionDataContainerProps,
        teams: TeamDto[],
        teamId: string,
    ) {
        context = await renderApp(
            iocProps(),
            brandingProps(),
            appProps(
                {
                    account: account,
                    teams: teams,
                },
                reportedError,
            ),
            <DivisionDataContainer {...divisionData}>
                <TeamOverview teamId={teamId} />
            </DivisionDataContainer>,
        );
    }

    function createDivisionData(
        divisionId: string,
    ): IDivisionDataContainerProps {
        return divisionDataBuilder(
            divisionBuilder('DIVISION', divisionId).build(),
        )
            .season((s) =>
                s.starting('2022-02-03T00:00:00').ending('2022-08-25T00:00:00'),
            )
            .build();
    }

    function createTeam(teamId: string): TeamDto {
        return teamBuilder('A team', teamId).address('An address').build();
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
            over100Checkouts: 7,
        };
    }

    function createHomeAndAwayFixtureDates(team: TeamDto) {
        const homeFixtureDate: DivisionFixtureDateDto = fixtureDateBuilder(
            '2001-02-03T04:05:06.000Z',
        )
            .withFixture((f) =>
                f.playing(team, teamBuilder('Another team').build()),
            )
            .build();

        const byeFixtureDate: DivisionFixtureDateDto = fixtureDateBuilder(
            '2001-02-04T04:05:06.000Z',
        )
            .withFixture((f) => f.bye(team))
            .build();

        const awayFixtureDate: DivisionFixtureDateDto = fixtureDateBuilder(
            '2001-02-05T04:05:06.000Z',
        )
            .withFixture((f) =>
                f.playing(teamBuilder('Another team').build(), team),
            )
            .build();

        return [homeFixtureDate, awayFixtureDate, byeFixtureDate];
    }

    function assertFixtureRow(
        tr: IComponent,
        date: string,
        homeTeamName: string,
        awayTeamName: string,
    ) {
        const cells = tr.all('td');
        expect(cells.length).toEqual(6);
        expect(cells[0].text()).toEqual(date);
        expect(cells[1].text()).toEqual(homeTeamName);
        expect(cells[5].text()).toEqual(awayTeamName);
    }

    function assertPlayerRow(tr: IComponent, name: string) {
        const cells = tr.all('td');
        expect(cells.length).toEqual(9);
        expect(cells[1].text()).toEqual(name);
    }

    describe('when selected for season', () => {
        it('renders team details', async () => {
            const divisionId = createTemporaryId();
            const divisionData = createDivisionData(divisionId);
            const teamId = createTemporaryId();
            const teams = [createTeam(teamId)];

            await renderComponent(divisionData, teams, teamId);

            reportedError.verifyNoError();
            const heading = context.required('.content-background > h3');
            const address = context.required('.content-background > p');
            expect(heading).toBeTruthy();
            expect(address).toBeTruthy();
            expect(heading.text()).toEqual('A team 🔗');
            expect(address.text()).toEqual('Address: An address');
        });

        it('renders team not found', async () => {
            const divisionId = createTemporaryId();
            const divisionData = createDivisionData(divisionId);
            const teamId = createTemporaryId();
            const teams = [createTeam(teamId)];

            await renderComponent(divisionData, teams, createTemporaryId());

            reportedError.verifyNoError();
            expect(context.text()).toContain('Team could not be found');
        });

        it('renders fixtures', async () => {
            const divisionId = createTemporaryId();
            const divisionData = createDivisionData(divisionId);
            const team = createTeam(createTemporaryId());
            divisionData.fixtures!.push(...createHomeAndAwayFixtureDates(team));

            await renderComponent(divisionData, [team], team.id);

            reportedError.verifyNoError();
            const tableSections = context.all(
                '.content-background > div.overflow-x-auto',
            );
            expect(tableSections.length).toEqual(2);
            const fixturesSection = tableSections[0];
            const fixtureRows = fixturesSection.all('table tbody tr');
            expect(fixtureRows.length).toEqual(2);
            assertFixtureRow(
                fixtureRows[0],
                '3 Feb',
                team.name,
                'Another team',
            );
            assertFixtureRow(
                fixtureRows[1],
                '5 Feb',
                'Another team',
                team.name,
            );
        });

        it('renders postponed fixtures', async () => {
            const divisionId = createTemporaryId();
            const divisionData = createDivisionData(divisionId);
            const team = createTeam(createTemporaryId());
            divisionData.fixtures!.push(...createHomeAndAwayFixtureDates(team));
            divisionData.fixtures![0].fixtures![0].postponed = true;

            await renderComponent(divisionData, [team], team.id);

            reportedError.verifyNoError();
            const tableSections = context.all(
                '.content-background > div.overflow-x-auto',
            );
            expect(tableSections.length).toEqual(2);
            const fixturesSection = tableSections[0];
            const fixtureRows = fixturesSection.all('table tbody tr');
            expect(fixtureRows.length).toEqual(2);
            const cellText = fixtureRows[0].all('td').map((td) => td.text());
            expect(cellText[2]).toEqual('P');
            expect(cellText[4]).toEqual('P');
        });

        it('renders fixtures without scores', async () => {
            const divisionId = createTemporaryId();
            const divisionData = createDivisionData(divisionId);
            const team = createTeam(createTemporaryId());
            divisionData.fixtures!.push(...createHomeAndAwayFixtureDates(team));
            divisionData.fixtures![0].fixtures![0].homeScore = undefined;
            divisionData.fixtures![0].fixtures![0].awayScore = undefined;

            await renderComponent(divisionData, [team], team.id);

            reportedError.verifyNoError();
            const tableSections = context.all(
                '.content-background > div.overflow-x-auto',
            );
            expect(tableSections.length).toEqual(2);
            const fixturesSection = tableSections[0];
            const fixtureRows = fixturesSection.all('table tbody tr');
            expect(fixtureRows.length).toEqual(2);
            const cellText = fixtureRows[0].all('td').map((td) => td.text());
            expect(cellText[2]).toEqual('-');
            expect(cellText[4]).toEqual('-');
        });

        it('renders players', async () => {
            const divisionId = createTemporaryId();
            const divisionData = createDivisionData(divisionId);
            const team = createTeam(createTemporaryId());
            const player = createPlayer(team);
            divisionData.players!.push(player);

            await renderComponent(divisionData, [team], team.id);

            reportedError.verifyNoError();
            const tableSections = context.all(
                '.content-background > div.overflow-x-auto',
            );
            expect(tableSections.length).toEqual(2);
            const playersSection = tableSections[1];
            const playerRows = playersSection.all('table tbody tr');
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

            reportedError.verifyNoError();
            const heading = context.required('.content-background > h3');
            const address = context.required('.content-background > p');
            expect(heading).toBeTruthy();
            expect(address).toBeTruthy();
            expect(heading.text()).toEqual('A team 🔗');
            expect(address.text()).toEqual('Address: An address');
        });

        it('does not render fixtures', async () => {
            const divisionId = createTemporaryId();
            const divisionData = createDivisionData(divisionId);
            const team = createTeam(createTemporaryId());

            await renderComponent(divisionData, [team], team.id);

            reportedError.verifyNoError();
            const tableSections = context.all(
                '.content-background > div.overflow-x-auto',
            );
            expect(tableSections.length).toEqual(2);
            const fixturesSection = tableSections[0];
            const fixtureRows = fixturesSection.all('table tbody tr');
            expect(fixtureRows.length).toEqual(0);
        });

        it('does not render players', async () => {
            const divisionId = createTemporaryId();
            const divisionData = createDivisionData(divisionId);
            const team = createTeam(createTemporaryId());

            await renderComponent(divisionData, [team], team.id);

            reportedError.verifyNoError();
            const tableSections = context.all(
                '.content-background > div.overflow-x-auto',
            );
            expect(tableSections.length).toEqual(2);
            const playersSection = tableSections[1];
            const playerRows = playersSection.all('table tbody tr');
            expect(playerRows.length).toEqual(0);
        });
    });
});
