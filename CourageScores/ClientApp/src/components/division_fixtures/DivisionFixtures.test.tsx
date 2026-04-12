import {
    api,
    appProps,
    brandingProps,
    cleanUp,
    ErrorState,
    IComponent,
    iocProps,
    noop,
    renderApp,
    TestContext,
    user,
} from '../../helpers/tests';
import { DivisionFixtures } from './DivisionFixtures';
import {
    DivisionDataContainer,
    IDivisionDataContainerProps,
} from '../league/DivisionDataContainer';
import { EditFixtureDateNoteDto } from '../../interfaces/models/dtos/EditFixtureDateNoteDto';
import { TeamDto } from '../../interfaces/models/dtos/Team/TeamDto';
import { UserDto } from '../../interfaces/models/dtos/Identity/UserDto';
import { IEditableDivisionFixtureDateDto } from './IEditableDivisionFixtureDateDto';
import { teamBuilder } from '../../helpers/builders/teams';
import {
    divisionDataBuilder,
    fixtureDateBuilder,
} from '../../helpers/builders/divisions';
import { DivisionFixtureDateDto } from '../../interfaces/models/dtos/Division/DivisionFixtureDateDto';
import { ISeasonTemplateApi } from '../../interfaces/apis/ISeasonTemplateApi';
import { INoteApi } from '../../interfaces/apis/INoteApi';
import { ITournamentGameApi } from '../../interfaces/apis/ITournamentGameApi';
import { IClientActionResultDto } from '../common/IClientActionResultDto';
import { TemplateDto } from '../../interfaces/models/dtos/Season/Creation/TemplateDto';
import { TournamentGameDto } from '../../interfaces/models/dtos/Game/TournamentGameDto';
import { IGameApi } from '../../interfaces/apis/IGameApi';
import { GameTeamDto } from '../../interfaces/models/dtos/Game/GameTeamDto';
import { ISeasonApi } from '../../interfaces/apis/ISeasonApi';

describe('DivisionFixtures', () => {
    let context: TestContext;
    let reportedError: ErrorState;
    let newFixtures: IEditableDivisionFixtureDateDto[] | null;
    let updatedNote: { id: string; note: EditFixtureDateNoteDto } | null;
    let bulkDeleteResponse: IClientActionResultDto<string[]> | null;
    let bulkDeleteRequest: { seasonId: string; executeDelete: boolean } | null;
    const seasonApi = api<ISeasonApi>({});
    const gameApi = api<IGameApi>({
        async deleteUnplayedLeagueFixtures(
            seasonId: string,
            executeDelete: boolean,
        ): Promise<IClientActionResultDto<string[]>> {
            bulkDeleteRequest = { seasonId, executeDelete };
            return bulkDeleteResponse!;
        },
    });
    const noteApi = api<INoteApi>({
        async create() {
            return { success: true };
        },
        async upsert(id: string, note: EditFixtureDateNoteDto) {
            updatedNote = { id, note };
            return { success: true };
        },
    });
    const tournamentApi = api<ITournamentGameApi>({
        async update(): Promise<IClientActionResultDto<TournamentGameDto>> {
            return { success: true };
        },
    });
    const templateApi = api<ISeasonTemplateApi>({
        async getCompatibility(): Promise<
            IClientActionResultDto<IClientActionResultDto<TemplateDto>[]>
        > {
            return { success: false };
        },
    });

    async function setNewFixtures(updatedFixtures: DivisionFixtureDateDto[]) {
        newFixtures = updatedFixtures;
    }

    afterEach(async () => {
        await cleanUp(context);
    });

    beforeEach(() => {
        reportedError = new ErrorState();
        newFixtures = null;
        updatedNote = null;
        bulkDeleteRequest = null;
        bulkDeleteResponse = null;
    });

    async function renderComponent(
        divisionData: IDivisionDataContainerProps,
        account?: UserDto,
        route?: string,
        path?: string,
        excludeControls?: boolean,
        teams?: TeamDto[],
    ) {
        context = await renderApp(
            iocProps({
                seasonApi,
                gameApi,
                noteApi,
                tournamentApi,
                templateApi,
            }),
            brandingProps(),
            appProps(
                {
                    account,
                    seasons: [],
                    divisions: [],
                    controls: !excludeControls,
                    teams: teams || [],
                },
                reportedError,
            ),
            <DivisionDataContainer {...divisionData}>
                <DivisionFixtures setNewFixtures={setNewFixtures} />
            </DivisionDataContainer>,
            route,
            path,
        );

        reportedError.verifyNoError();
    }

    function midnightOn(date: string) {
        return date + 'T00:00:00';
    }

    function getInSeasonDivisionData(): IDivisionDataContainerProps {
        const team: TeamDto = teamBuilder('A team').build();

        return divisionDataBuilder()
            .season((s) =>
                s
                    .starting(midnightOn('2022-02-03'))
                    .ending(midnightOn('2022-08-25')),
            )
            .name('A division')
            .withTeam(team)
            .onReloadDivision(noop)
            .setDivisionData(noop)
            .build();
    }

    function assertFixture(
        tr: IComponent,
        home: string,
        homeScore: string,
        awayScore: string,
        away: string,
        account?: UserDto,
    ) {
        const columns = tr.all('td');
        expect(columns.length).toEqual(5 + (account ? 1 : 0));
        expect(columns[0].text()).toEqual(home);
        expect(columns[1].text()).toEqual(homeScore);
        expect(columns[2].text()).toEqual('vs');
        expect(columns[3].text()).toEqual(awayScore);

        const selectedAwayTeam = columns[4].optional('div.btn-group > button');
        if (account && selectedAwayTeam) {
            expect(selectedAwayTeam.text()).toEqual(away);
        } else {
            expect(columns[4].text()).toEqual(away);
        }
    }

    function assertTournament(
        tr: IComponent,
        text: string,
        winner?: string,
        account?: UserDto,
    ) {
        const columns = tr.all('td');
        expect(columns.length).toEqual((winner ? 2 : 1) + (account ? 1 : 0));
        expect(columns[0].text()).toEqual(text);
        if (winner) {
            expect(columns[1].text()).toEqual('Winner: ' + winner);
        }
    }

    function getFixtureDateElement(index: number, account?: UserDto) {
        const fixtureElements = context.all('div.content-background > div');
        expect(fixtureElements.length).toEqual(2 + (account ? 2 : 0));
        const fixtureDatesContainer = fixtureElements[account ? 2 : 1];
        const fixtureDates = fixtureDatesContainer.all(':scope > *');
        expect(fixtureDates.length).toBeGreaterThan(index);
        return fixtureDates[index];
    }

    function assertFixtureDate(element: IComponent, expectedDate: string) {
        const fixtureDateHeading = element.required('h4');
        expect(fixtureDateHeading.text()).toEqual('📅 ' + expectedDate);
    }

    function team(name: string): TeamDto {
        return teamBuilder(name).build();
    }

    function getFixturesForDate(element: IComponent, expectedCount?: number) {
        const fixtures = element.all('table tbody tr');
        expect(fixtures.length).toEqual(expectedCount ?? fixtures.length);
        return fixtures;
    }

    function getDialog(): IComponent | undefined {
        return context.optional('.modal-dialog');
    }

    function getNote(fixtureDateElement: IComponent): IComponent | undefined {
        return fixtureDateElement.optional('.alert');
    }

    function getAdminSection(): IComponent {
        return context.required('div[datatype="fixture-management-1"]');
    }

    function getTournamentProposals(element: IComponent, count?: number) {
        const tournaments = element.all(
            'table tbody tr:not([datatype="new-tournament-fixture"])',
        );
        expect(tournaments.length).toEqual(count ?? tournaments.length);
        return tournaments;
    }

    function getDeleteAllButton(): IComponent {
        return context.button('⚠️ Delete all league fixtures');
    }

    describe('when logged out', () => {
        let divisionData: IDivisionDataContainerProps;
        let pairsTournament: DivisionFixtureDateDto;

        beforeEach(() => {
            divisionData = getInSeasonDivisionData();
            pairsTournament = fixtureDateBuilder(midnightOn('2022-10-13'))
                .withTournament((t) =>
                    t.forSeason(divisionData.season).type('Pairs'),
                )
                .build();
        });

        it('renders notes', async () => {
            divisionData.fixtures!.push(
                fixtureDateBuilder(midnightOn('2022-10-13'))
                    .withNote((n) => n.note('Finals night!'))
                    .build(),
            );

            await renderComponent(divisionData);

            const fixtureDateElement = getFixtureDateElement(0);
            assertFixtureDate(fixtureDateElement, '13 Oct');
            expect(getNote(fixtureDateElement)!.text()).toEqual(
                '📌Finals night!',
            );
        });

        it('renders played league fixtures', async () => {
            divisionData.fixtures!.push(
                fixtureDateBuilder(midnightOn('2022-10-13'))
                    .withFixture((f) =>
                        f.playing(team('home1'), team('away1')).scores(1, 2),
                    )
                    .build(),
            );

            await renderComponent(divisionData);

            const fixtureDateElement = getFixtureDateElement(0);
            assertFixtureDate(fixtureDateElement, '13 Oct');
            const element = getFixturesForDate(fixtureDateElement, 1)[0];
            assertFixture(element, 'home1', '1', '2', 'away1');
        });

        it('renders played knockout fixtures', async () => {
            divisionData.fixtures!.push(
                fixtureDateBuilder(midnightOn('2022-10-13'))
                    .withFixture((f) =>
                        f
                            .playing(
                                team('home2 - knockout'),
                                team('away2 - knockout'),
                            )
                            .scores(3, 4)
                            .knockout(),
                    )
                    .build(),
            );

            await renderComponent(divisionData);

            const fixtureDateElement = getFixtureDateElement(0);
            assertFixtureDate(fixtureDateElement, '13 Oct');
            assertFixture(
                getFixturesForDate(fixtureDateElement, 1)[0],
                'home2 - knockout',
                '3',
                '4',
                'away2 - knockout',
            );
        });

        it('renders postponed fixtures', async () => {
            divisionData.fixtures!.push(
                fixtureDateBuilder(midnightOn('2022-10-13'))
                    .withFixture((f) =>
                        f
                            .playing(team('home3'), team('away3'))
                            .scores(0, 0)
                            .postponed()
                            .knockout(),
                    )
                    .build(),
            );

            await renderComponent(divisionData);

            const fixtureDateElement = getFixtureDateElement(0);
            assertFixtureDate(fixtureDateElement, '13 Oct');
            const element = getFixturesForDate(fixtureDateElement, 1)[0];
            assertFixture(element, 'home3', 'P', 'P', 'away3');
        });

        it('renders byes', async () => {
            divisionData.fixtures!.push(
                fixtureDateBuilder(midnightOn('2022-10-13'))
                    .withFixture((f) =>
                        f.bye(teamBuilder('home4 - bye').build()),
                    )
                    .build(),
            );

            await renderComponent(divisionData);

            const fixtureDateElement = getFixtureDateElement(0);
            assertFixtureDate(fixtureDateElement, '13 Oct');
            const element = getFixturesForDate(fixtureDateElement, 1)[0];
            assertFixture(element, 'home4 - bye', '', '', 'Bye');
        });

        it('renders played tournaments', async () => {
            divisionData.fixtures!.push(
                fixtureDateBuilder(midnightOn('2022-10-13'))
                    .withTournament((t) =>
                        t
                            .address('an address')
                            .type('Pairs')
                            .forSeason(divisionData.season)
                            .winner('The winning side'),
                    )
                    .build(),
            );

            await renderComponent(divisionData);

            const fixtureDateElement = getFixtureDateElement(0);
            assertFixtureDate(fixtureDateElement, "13 OctWho's playing?");
            assertTournament(
                getFixturesForDate(fixtureDateElement, 1)[0],
                'Pairs at an address',
                'The winning side',
            );
        });

        it('renders unplayed tournaments', async () => {
            divisionData.fixtures!.push(
                fixtureDateBuilder(midnightOn('2022-10-13'))
                    .withTournament((t) =>
                        t
                            .address('another address')
                            .forSeason(divisionData.season)
                            .type('Pairs'),
                    )
                    .build(),
            );

            await renderComponent(divisionData);

            const fixtureDateElement = getFixtureDateElement(0);
            assertFixtureDate(fixtureDateElement, "13 OctWho's playing?");
            const element = getFixturesForDate(fixtureDateElement, 1)[0];
            assertTournament(element, 'Pairs at another address');
        });

        it('renders tournament players', async () => {
            divisionData.fixtures!.push(
                fixtureDateBuilder(midnightOn('2022-10-13'))
                    .withTournament((t) =>
                        t
                            .forSeason(divisionData.season)
                            .withSide((s) =>
                                s.name('SIDE').withPlayer('SIDE PLAYER'),
                            )
                            .type('Pairs'),
                    )
                    .build(),
            );

            await renderComponent(
                divisionData,
                undefined,
                '/division',
                '/division#show-who-is-playing',
            );

            expect(getFixtureDateElement(0).text()).toContain('SIDE PLAYER');
        });

        it('renders tournament players when there are no fixtures', async () => {
            divisionData.fixtures = undefined;

            await renderComponent(
                divisionData,
                undefined,
                '/division',
                '/division?notes=NOTE#show-who-is-playing',
            );

            expect(context.text()).toContain('No fixtures, yet');
        });

        it('can change filters', async () => {
            divisionData.fixtures!.push(pairsTournament);
            await renderComponent(divisionData);
            const filterContainer = context.required(
                '.content-background > div[datatype="fixture-filters"]',
            );

            await filterContainer
                .required('.dropdown-menu')
                .select('League fixtures');
        });

        it('hides filters when no controls', async () => {
            divisionData.fixtures!.push(pairsTournament);
            await renderComponent(
                divisionData,
                undefined,
                undefined,
                undefined,
                true,
            );

            const filterContainer = context.optional(
                '.content-background > div[datatype="fixture-filters"]',
            );
            expect(filterContainer).toBeFalsy();
        });

        it('filters fixtures dates', async () => {
            divisionData.fixtures!.push(pairsTournament);
            await renderComponent(
                divisionData,
                undefined,
                '/divisions',
                '/divisions?date=2020-01-01',
            );

            expect(context.text()).not.toContain('Pairs at another address');
        });

        it('filters fixtures', async () => {
            divisionData.fixtures!.push(
                fixtureDateBuilder(midnightOn('2022-10-13'))
                    .withTournament((t) =>
                        t
                            .address('another address')
                            .forSeason(divisionData.season)
                            .type('Pairs'),
                    )
                    .build(),
            );
            await renderComponent(
                divisionData,
                undefined,
                '/divisions',
                '/divisions?date=2022-10-13&type=tournaments',
            );

            expect(context.text()).toContain('Pairs at another address');
        });

        it('filters fixtures dates after fixtures', async () => {
            divisionData.fixtures!.push(pairsTournament);
            await renderComponent(
                divisionData,
                undefined,
                '/divisions',
                '/divisions?date=2022-10-13&type=league',
            );

            expect(context.text()).not.toContain('📅');
        });
    });

    describe('when logged in', () => {
        const account = user({
            manageGames: true,
            manageTournaments: true,
            manageNotes: true,
            manageScores: true,
        });
        let divisionData: IDivisionDataContainerProps;

        beforeEach(() => {
            divisionData = getInSeasonDivisionData();
        });

        it('renders notes', async () => {
            divisionData.fixtures!.push(
                fixtureDateBuilder(divisionData.season!.startDate)
                    .withNote((n) => n.note('Finals night!'))
                    .build(),
            );

            await renderComponent(divisionData, account);

            const fixtureDateElement = getFixtureDateElement(0, account);
            assertFixtureDate(fixtureDateElement, '3 Feb📌 Add noteQualifier');
            expect(getNote(fixtureDateElement)!.text()).toEqual(
                '📌Finals night!Edit',
            );
        });

        it('renders played league fixtures', async () => {
            divisionData.fixtures!.push(
                fixtureDateBuilder(midnightOn('2022-10-13'))
                    .withFixture((f) =>
                        f.playing(team('home1'), team('away1')).scores(1, 2),
                    )
                    .build(),
            );

            await renderComponent(divisionData, account);

            const fixtureDateElement = getFixtureDateElement(0, account);
            const element = getFixturesForDate(fixtureDateElement, 1)[0];
            assertFixture(element, 'home1', '1', '2', 'away1', account);
        });

        it('renders played knockout fixtures', async () => {
            divisionData.fixtures!.push(
                fixtureDateBuilder(midnightOn('2022-10-13'))
                    .withFixture((f) =>
                        f
                            .playing(team('home2 - ko'), team('away2 - ko'))
                            .scores(3, 4)
                            .knockout(),
                    )
                    .build(),
            );

            await renderComponent(divisionData, account);

            assertFixture(
                getFixturesForDate(getFixtureDateElement(0, account), 1)[0],
                'home2 - ko',
                '3',
                '4',
                'away2 - ko',
                account,
            );
        });

        it('renders postponed fixtures', async () => {
            divisionData.fixtures!.push(
                fixtureDateBuilder(midnightOn('2022-10-13'))
                    .withFixture((f) =>
                        f
                            .playing(
                                team('home3'),
                                divisionData.teams![0] as GameTeamDto,
                            )
                            .scores(0, 0)
                            .postponed(),
                    )
                    .build(),
            );

            await renderComponent(divisionData, account);

            const fixtureDateElement = getFixtureDateElement(0, account);
            const element = getFixturesForDate(fixtureDateElement, 1)[0];
            assertFixture(element, 'home3', 'P', 'P', 'A team', account);
        });

        it('renders byes', async () => {
            const team = teamBuilder('home4 - bye').build();
            divisionData.fixtures!.push(
                fixtureDateBuilder(midnightOn('2022-10-13'))
                    .withFixture((f) => f.bye(team), team.id)
                    .build(),
            );

            await renderComponent(divisionData, account);

            const fixtureDateElement = getFixtureDateElement(0, account);
            const element = getTournamentProposals(fixtureDateElement, 1)[0];
            assertFixture(element, 'home4 - bye', '', '', 'Bye', account);
        });

        it('renders played tournaments', async () => {
            divisionData.fixtures!.push(
                fixtureDateBuilder(midnightOn('2022-10-13'))
                    .withTournament((t) =>
                        t
                            .address('an address')
                            .type('Pairs')
                            .forSeason(divisionData.season)
                            .winner('The winning side'),
                    )
                    .build(),
            );

            await renderComponent(divisionData, account);

            assertTournament(
                getTournamentProposals(getFixtureDateElement(0, account), 1)[0],
                'Pairs at an address',
                'The winning side',
                account,
            );
        });

        it('renders unplayed tournaments', async () => {
            divisionData.fixtures!.push(
                fixtureDateBuilder(midnightOn('2022-10-13'))
                    .withTournament((t) =>
                        t
                            .address('another address')
                            .type('Pairs')
                            .forSeason(divisionData.season),
                    )
                    .build(),
            );

            await renderComponent(divisionData, account);

            assertTournament(
                getTournamentProposals(getFixtureDateElement(0, account), 1)[0],
                'Pairs at another address',
                undefined,
                account,
            );
        });

        it('reloads tournaments if they are changed', async () => {
            let divisionReloaded: boolean = false;
            divisionData.onReloadDivision = async () => {
                divisionReloaded = true;
                return divisionData;
            };
            divisionData.fixtures!.push(
                fixtureDateBuilder(midnightOn('2022-10-13'))
                    .withTournament((t) =>
                        t
                            .address('another address')
                            .forSeason(divisionData.season)
                            .proposed(),
                    )
                    .build(),
            );
            await renderComponent(divisionData, account);
            context.prompts.respondToConfirm(
                'Tournament is outside of the dates for the season.\nYou will need to change the start/end date for the season to be able to see the fixture in the list.\n\nContinue?',
                true,
            );

            const fixtureDateElement = getFixtureDateElement(0, account);
            const addressDropdown = fixtureDateElement.required(
                '.address-dropdown .dropdown-menu',
            );
            await addressDropdown.select('another address');
            await fixtureDateElement.button('➕').click();

            expect(divisionReloaded).toEqual(true);
            expect(newFixtures).not.toBeNull();
        });

        it('can add a note', async () => {
            divisionData.fixtures!.push(
                fixtureDateBuilder(midnightOn('2022-10-13'))
                    .withFixture((f) => f)
                    .build(),
            );
            await renderComponent(divisionData, account);

            const fixtureDateElement = getFixtureDateElement(0, account);
            await fixtureDateElement.button('📌 Add note').click();

            expect(getDialog()!.text()).toContain('Create note');
        });

        it('can edit a note', async () => {
            divisionData.fixtures!.push(
                fixtureDateBuilder(midnightOn('2022-10-13'))
                    .withNote((n) => n.note('A note'))
                    .build(),
            );
            await renderComponent(divisionData, account);

            const fixtureDateElement = getFixtureDateElement(0, account);
            await getNote(fixtureDateElement)!.button('Edit').click();

            expect(getDialog()!.text()).toContain('Edit note');
        });

        it('can save changes to notes', async () => {
            let divisionReloaded: boolean = false;
            divisionData.onReloadDivision = async () => {
                divisionReloaded = true;
                return divisionData;
            };
            divisionData.fixtures!.push(
                fixtureDateBuilder(midnightOn('2022-10-13'))
                    .withNote((n) => n.note('A note'))
                    .build(),
            );
            await renderComponent(divisionData, account);
            const fixtureDateElement = getFixtureDateElement(0, account);
            await getNote(fixtureDateElement)!.button('Edit').click();

            const dialog = getDialog()!;
            await dialog.input('note').change('New note');
            await dialog.button('Save').click();

            expect(getDialog()).toBeFalsy();
            expect(divisionReloaded).toEqual(true);
            expect(updatedNote).not.toBeNull();
        });

        it('can close edit notes dialog', async () => {
            divisionData.fixtures!.push(
                fixtureDateBuilder(midnightOn('2022-10-13'))
                    .withNote((n) => n.note('A note'))
                    .build(),
            );
            await renderComponent(divisionData, account);
            const fixtureDateElement = getFixtureDateElement(0, account);
            await getNote(fixtureDateElement)!.button('Edit').click();

            await getDialog()!.button('Close').click();

            expect(getDialog()).toBeFalsy();
        });

        it('can open add date dialog', async () => {
            await renderComponent(divisionData, account);

            await getAdminSection().button('➕ Add date').click();

            expect(getDialog()!.text()).toContain('Add date');
        });

        it('can close add date dialog', async () => {
            await renderComponent(divisionData, account);

            await getAdminSection().button('➕ Add date').click();
            await getDialog()!.button('Close').click();

            expect(getDialog()).toBeFalsy();
        });

        it('prevents adding a date when no date selected', async () => {
            await renderComponent(divisionData, account);
            await getAdminSection().button('➕ Add date').click();

            await getDialog()!.button('Add date').click();

            expect(newFixtures).toBeNull();
            context.prompts.alertWasShown('Select a date first');
        });

        it('does not add date if already exists', async () => {
            divisionData.fixtures!.push(
                fixtureDateBuilder(midnightOn('2022-10-13'))
                    .withNote((n) => n.note('A note'))
                    .withTournament((t) =>
                        t.proposed().forSeason(divisionData.season),
                    )
                    .build(),
            );
            await renderComponent(divisionData, account);
            await getAdminSection().button('➕ Add date').click();
            const dialog = getDialog()!;

            await dialog.required('input[type="date"]').change('2022-10-13');
            await dialog.button('Add date').click();

            expect(newFixtures).toBeNull();
        });

        it('can add a date', async () => {
            const team = teamBuilder('TEAM')
                .address('ADDRESS')
                .forSeason(divisionData.season, divisionData)
                .build();
            const outOfSeasonTeam = teamBuilder('OUT OF SEASON TEAM').build();
            await renderComponent(
                divisionData,
                account,
                undefined,
                undefined,
                undefined,
                [team, outOfSeasonTeam],
            );
            await getAdminSection().button('➕ Add date').click();
            const dialog = getDialog()!;

            await dialog.required('input[type="date"]').change('2023-05-06');
            await dialog.required('input[name="isKnockout"]').click();
            await dialog.button('Add date').click();

            expect(newFixtures).not.toBeNull();
            expect(newFixtures!.length).toEqual(1);
            const singleFixtureDate = newFixtures![0];
            expect(singleFixtureDate.date).toEqual('2023-05-06T00:00:00');
            expect(singleFixtureDate.isNew).toEqual(true);
            expect(singleFixtureDate.isKnockout).toEqual(true);
            expect(singleFixtureDate.fixtures!.length).toEqual(1);
            const singleFixture = singleFixtureDate.fixtures![0];
            expect(singleFixture.fixturesUsingAddress).toEqual([]);
            expect(singleFixture.homeTeam.id).toEqual(team.id);
            expect(singleFixture.homeTeam.name).toEqual(team.name);
            expect(singleFixture.homeTeam.address).toEqual(team.address);
            expect(singleFixture.awayTeam).toBeUndefined();
            expect(singleFixture.isKnockout).toEqual(true);
            expect(singleFixture.accoladesCount).toEqual(true);
            expect(singleFixture.fixturesUsingAddress).toEqual([]);
            const singleTournament = singleFixtureDate.tournamentFixtures![0];
            expect(singleTournament.address).toEqual('ADDRESS');
            expect(singleTournament.proposed).toEqual(true);
            expect(singleTournament.sides).toEqual([]);
        });

        it('does not add teams with deleted seasons to new date', async () => {
            const team = teamBuilder('TEAM')
                .address('ADDRESS')
                .forSeason(divisionData.season, divisionData)
                .build();
            const deletedTeam = teamBuilder('DELETED TEAM')
                .address('ADDRESS')
                .forSeason(divisionData.season, divisionData, undefined, true)
                .build();
            await renderComponent(
                divisionData,
                account,
                undefined,
                undefined,
                undefined,
                [team, deletedTeam],
            );
            await getAdminSection().button('➕ Add date').click();
            const dialog = getDialog()!;

            await dialog.required('input[type="date"]').change('2023-05-06');
            await dialog.required('input[name="isKnockout"]').click();
            await dialog.button('Add date').click();

            expect(newFixtures).not.toBeNull();
            expect(newFixtures!.length).toEqual(1);
            const singleFixtureDate = newFixtures![0];
            expect(singleFixtureDate.date).toEqual('2023-05-06T00:00:00');
            expect(singleFixtureDate.isNew).toEqual(true);
            expect(singleFixtureDate.isKnockout).toEqual(true);
            expect(singleFixtureDate.fixtures!.length).toEqual(1);
            const singleFixture = singleFixtureDate.fixtures![0];
            expect(singleFixture.fixturesUsingAddress).toEqual([]);
            expect(singleFixture.homeTeam.id).toEqual(team.id);
            expect(singleFixture.homeTeam.name).toEqual(team.name);
            expect(singleFixture.homeTeam.address).toEqual(team.address);
            expect(singleFixture.awayTeam).toBeUndefined();
            expect(singleFixture.isKnockout).toEqual(true);
            expect(singleFixture.accoladesCount).toEqual(true);
            expect(singleFixture.fixturesUsingAddress).toEqual([]);
            const singleTournament = singleFixtureDate.tournamentFixtures![0];
            expect(singleTournament.address).toEqual('ADDRESS');
            expect(singleTournament.proposed).toEqual(true);
        });

        it('renders new dates correctly', async () => {
            const homeTeam = teamBuilder('HOME').build();
            divisionData.fixtures!.push(
                fixtureDateBuilder(midnightOn('2022-05-06'))
                    .isNew()
                    .withFixture((f) => f.bye(homeTeam), homeTeam.id)
                    .build(),
            );

            await renderComponent(divisionData, account);
        });

        it('can open create new fixtures dialog', async () => {
            await renderComponent(divisionData, account);

            await getAdminSection().button('🗓️ Create fixtures').click();

            expect(getDialog()!.text()).toContain('Create season fixtures...');
        });

        it('can close create new fixtures dialog', async () => {
            await renderComponent(divisionData, account);
            await getAdminSection().button('🗓️ Create fixtures').click();

            await getDialog()!.button('Close').click();

            expect(getDialog()).toBeFalsy();
        });

        describe('bulk delete', () => {
            const seasonName = 'SEASON';
            const dryRunPrompt = `Are you sure you want to delete all un-played league fixtures from ALL DIVISIONS in the ${seasonName} season?

A dry-run of the deletion will run first.`;
            const executePrompt = `All the fixtures CAN be deleted without issue, are you sure you want to actually delete 1 fixtures from ${seasonName}?

a message`;

            it('does not delete any fixtures if user cancels prompt', async () => {
                account!.access!.bulkDeleteLeagueFixtures = true;
                await renderComponent(divisionData, account);
                context.prompts.respondToConfirm(dryRunPrompt, false);

                await getDeleteAllButton().click();

                expect(bulkDeleteRequest).toBeNull();
            });

            it('handles a failure when dry running the delete', async () => {
                account!.access!.bulkDeleteLeagueFixtures = true;
                await renderComponent(divisionData, account);
                context.prompts.respondToConfirm(dryRunPrompt, true);
                bulkDeleteResponse = {
                    success: false,
                };

                await getDeleteAllButton().click();

                expect(bulkDeleteRequest).toEqual({
                    seasonId: divisionData.season!.id,
                    executeDelete: false,
                });
                context.prompts.alertWasShown(
                    'There was an error when attempting to delete all the fixtures',
                );
            });

            it('exits if no fixtures are identified', async () => {
                account!.access!.bulkDeleteLeagueFixtures = true;
                await renderComponent(divisionData, account);
                context.prompts.respondToConfirm(dryRunPrompt, true);
                bulkDeleteResponse = {
                    success: true,
                    result: [],
                };

                await getDeleteAllButton().click();

                expect(bulkDeleteRequest).toEqual({
                    seasonId: divisionData.season!.id,
                    executeDelete: false,
                });
                context.prompts.alertWasShown('No fixtures can be deleted');
            });

            it('does not delete any fixtures if user cancels dry run result prompt', async () => {
                account!.access!.bulkDeleteLeagueFixtures = true;
                await renderComponent(divisionData, account);
                context.prompts.respondToConfirm(dryRunPrompt, true);
                bulkDeleteResponse = {
                    success: true,
                    result: ['a fixture that can be deleted'],
                    messages: ['a message'],
                };
                context.prompts.respondToConfirm(executePrompt, false);

                await getDeleteAllButton().click();

                expect(bulkDeleteRequest).toEqual({
                    seasonId: divisionData.season!.id,
                    executeDelete: false,
                });
            });

            it.skip('deletes all fixtures if user confirms dry run result prompt', async () => {
                account!.access!.bulkDeleteLeagueFixtures = true;
                await renderComponent(divisionData, account);
                Object.defineProperty(window, 'location', {
                    configurable: true,
                    value: { reload: jest.fn() },
                });
                context.prompts.respondToConfirm(dryRunPrompt, true);
                bulkDeleteResponse = {
                    success: true,
                    result: ['a fixture that can be deleted'],
                    messages: ['a message'],
                };
                context.prompts.respondToConfirm(executePrompt, true);

                await getDeleteAllButton().click();

                expect(bulkDeleteRequest).toEqual({
                    seasonId: divisionData.season!.id,
                    executeDelete: true,
                });
                expect(window.location.reload).toHaveBeenCalled();
            });

            it('reports an error if actual delete fails', async () => {
                account!.access!.bulkDeleteLeagueFixtures = true;
                await renderComponent(divisionData, account);
                context.prompts.respondToConfirm(dryRunPrompt, true);
                bulkDeleteResponse = {
                    success: true,
                    result: ['a fixture that can be deleted'],
                    messages: ['a message'],
                };
                context.prompts.respondToConfirm(
                    executePrompt,
                    true,
                    () => (bulkDeleteResponse!.success = false),
                );

                await getDeleteAllButton().click();

                expect(bulkDeleteRequest).toEqual({
                    seasonId: divisionData.season!.id,
                    executeDelete: true,
                });
                context.prompts.alertWasShown(
                    'There was an error deleting all the fixtures, some fixtures may have been deleted',
                );
            });
        });
    });
});
