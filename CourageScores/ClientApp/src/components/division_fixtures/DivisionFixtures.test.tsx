import {
    api,
    appProps,
    brandingProps,
    cleanUp,
    doChange,
    doClick,
    doSelectOption,
    ErrorState,
    findButton,
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
        create: async () => {
            return { success: true };
        },
        upsert: async (id: string, note: EditFixtureDateNoteDto) => {
            updatedNote = { id, note };
            return { success: true };
        },
    });
    const tournamentApi = api<ITournamentGameApi>({
        update: async (): Promise<
            IClientActionResultDto<TournamentGameDto>
        > => {
            return { success: true };
        },
    });
    const templateApi = api<ISeasonTemplateApi>({
        getCompatibility: async (): Promise<
            IClientActionResultDto<IClientActionResultDto<TemplateDto>[]>
        > => {
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

    function getInSeasonDivisionData(): IDivisionDataContainerProps {
        const team: TeamDto = teamBuilder('A team').build();

        return divisionDataBuilder()
            .season((s) =>
                s.starting('2022-02-03T00:00:00').ending('2022-08-25T00:00:00'),
            )
            .name('A division')
            .withTeam(team)
            .onReloadDivision(noop)
            .setDivisionData(noop)
            .build();
    }

    function assertFixture(
        tr: Element,
        home: string,
        homeScore: string,
        awayScore: string,
        away: string,
        account?: UserDto,
    ) {
        const columns = tr.querySelectorAll('td');
        expect(columns.length).toEqual(5 + (account ? 1 : 0));
        expect(columns[0].textContent).toEqual(home);
        expect(columns[1].textContent).toEqual(homeScore);
        expect(columns[2].textContent).toEqual('vs');
        expect(columns[3].textContent).toEqual(awayScore);

        const selectedAwayTeam = columns[4].querySelector(
            'div.btn-group > button',
        );
        if (account && selectedAwayTeam) {
            expect(selectedAwayTeam.textContent).toEqual(away);
        } else {
            expect(columns[4].textContent).toEqual(away);
        }
    }

    function assertTournament(
        tr: Element,
        text: string,
        winner?: string,
        account?: UserDto,
    ) {
        const columns = tr.querySelectorAll('td');
        expect(columns.length).toEqual((winner ? 2 : 1) + (account ? 1 : 0));
        expect(columns[0].textContent).toEqual(text);
        if (winner) {
            expect(columns[1].textContent).toEqual('Winner: ' + winner);
        }
    }

    function getFixtureDateElement(index: number, account?: UserDto): Element {
        const fixtureElements = Array.from(
            context.container.querySelectorAll('div.content-background > div'),
        ) as HTMLElement[];
        expect(fixtureElements.length).toEqual(2 + (account ? 2 : 0));
        const fixtureDatesContainer = fixtureElements[account ? 2 : 1];
        const fixtureDates = fixtureDatesContainer.children;
        expect(fixtureElements.length).toBeGreaterThan(index);
        return fixtureDates[index];
    }

    function assertFixtureDate(
        fixtureDateElement: Element,
        expectedDate: string,
    ) {
        const fixtureDateHeading = fixtureDateElement.querySelector('h4')!;
        expect(fixtureDateHeading.textContent).toEqual('📅 ' + expectedDate);
    }

    function team(name: string): TeamDto {
        return teamBuilder(name).build();
    }

    function getFixturesForDate(
        fixtureDateElement: Element,
        expectedCount?: number,
    ) {
        const fixtures = fixtureDateElement.querySelectorAll('table tbody tr');
        expect(fixtures.length).toEqual(expectedCount ?? fixtures.length);
        return Array.from(fixtures);
    }

    function getDialog() {
        return context.container.querySelector('.modal-dialog');
    }

    function getNote(fixtureDateElement: Element) {
        return fixtureDateElement.querySelector('.alert');
    }

    function getAdminSection() {
        return context.container.querySelector(
            'div[datatype="fixture-management-1"]',
        );
    }

    function getTournamentProposals(
        fixtureDateElement: Element,
        count?: number,
    ) {
        const tournaments = fixtureDateElement.querySelectorAll(
            'table tbody tr:not([datatype="new-tournament-fixture"])',
        );
        expect(tournaments.length).toEqual(count ?? tournaments.length);
        return Array.from(tournaments);
    }

    function getDeleteAllButton() {
        return findButton(context.container, '⚠️ Delete all league fixtures');
    }

    describe('when logged out', () => {
        const account: UserDto | undefined = undefined;
        let divisionData: IDivisionDataContainerProps;

        beforeEach(() => {
            divisionData = getInSeasonDivisionData();
        });

        it('renders notes', async () => {
            divisionData.fixtures!.push(
                fixtureDateBuilder('2022-10-13T00:00:00')
                    .withNote((n) => n.note('Finals night!'))
                    .build(),
            );

            await renderComponent(divisionData, account);

            const fixtureDateElement = getFixtureDateElement(0, account);
            assertFixtureDate(fixtureDateElement, '13 Oct');
            expect(getNote(fixtureDateElement)!.textContent).toEqual(
                '📌Finals night!',
            );
        });

        it('renders played league fixtures', async () => {
            divisionData.fixtures!.push(
                fixtureDateBuilder('2022-10-13T00:00:00')
                    .withFixture((f) =>
                        f.playing(team('home1'), team('away1')).scores(1, 2),
                    )
                    .build(),
            );

            await renderComponent(divisionData, account);

            const fixtureDateElement = getFixtureDateElement(0, account);
            assertFixtureDate(fixtureDateElement, '13 Oct');
            assertFixture(
                getFixturesForDate(fixtureDateElement, 1)[0],
                'home1',
                '1',
                '2',
                'away1',
                account,
            );
        });

        it('renders played knockout fixtures', async () => {
            divisionData.fixtures!.push(
                fixtureDateBuilder('2022-10-13T00:00:00')
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

            await renderComponent(divisionData, account);

            const fixtureDateElement = getFixtureDateElement(0, account);
            assertFixtureDate(fixtureDateElement, '13 Oct');
            assertFixture(
                getFixturesForDate(fixtureDateElement, 1)[0],
                'home2 - knockout',
                '3',
                '4',
                'away2 - knockout',
                account,
            );
        });

        it('renders postponed fixtures', async () => {
            divisionData.fixtures!.push(
                fixtureDateBuilder('2022-10-13T00:00:00')
                    .withFixture((f) =>
                        f
                            .playing(team('home3'), team('away3'))
                            .scores(0, 0)
                            .postponed()
                            .knockout(),
                    )
                    .build(),
            );

            await renderComponent(divisionData, account);

            const fixtureDateElement = getFixtureDateElement(0, account);
            assertFixtureDate(fixtureDateElement, '13 Oct');
            assertFixture(
                getFixturesForDate(fixtureDateElement, 1)[0],
                'home3',
                'P',
                'P',
                'away3',
                account,
            );
        });

        it('renders byes', async () => {
            divisionData.fixtures!.push(
                fixtureDateBuilder('2022-10-13T00:00:00')
                    .withFixture((f) =>
                        f.bye(teamBuilder('home4 - bye').build()),
                    )
                    .build(),
            );

            await renderComponent(divisionData, account);

            const fixtureDateElement = getFixtureDateElement(0, account);
            assertFixtureDate(fixtureDateElement, '13 Oct');
            assertFixture(
                getFixturesForDate(fixtureDateElement, 1)[0],
                'home4 - bye',
                '',
                '',
                'Bye',
                account,
            );
        });

        it('renders played tournaments', async () => {
            divisionData.fixtures!.push(
                fixtureDateBuilder('2022-10-13T00:00:00')
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

            const fixtureDateElement = getFixtureDateElement(0, account);
            assertFixtureDate(fixtureDateElement, "13 OctWho's playing?");
            assertTournament(
                getFixturesForDate(fixtureDateElement, 1)[0],
                'Pairs at an address',
                'The winning side',
                account,
            );
        });

        it('renders unplayed tournaments', async () => {
            divisionData.fixtures!.push(
                fixtureDateBuilder('2022-10-13T00:00:00')
                    .withTournament((t) =>
                        t
                            .address('another address')
                            .forSeason(divisionData.season)
                            .type('Pairs'),
                    )
                    .build(),
            );

            await renderComponent(divisionData, account);

            const fixtureDateElement = getFixtureDateElement(0, account);
            assertFixtureDate(fixtureDateElement, "13 OctWho's playing?");
            assertTournament(
                getFixturesForDate(fixtureDateElement, 1)[0],
                'Pairs at another address',
                account,
            );
        });

        it('renders tournament players', async () => {
            divisionData.fixtures!.push(
                fixtureDateBuilder('2022-10-13T00:00:00')
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
                account,
                '/division',
                '/division#show-who-is-playing',
            );

            const fixtureDateElement = getFixtureDateElement(0, account);
            expect(fixtureDateElement.textContent).toContain('SIDE PLAYER');
        });

        it('can change filters', async () => {
            divisionData.fixtures!.push(
                fixtureDateBuilder('2022-10-13T00:00:00')
                    .withTournament((t) =>
                        t.forSeason(divisionData.season).type('Pairs'),
                    )
                    .build(),
            );
            await renderComponent(divisionData, account);
            const filterContainer = context.container.querySelector(
                '.content-background > div[datatype="fixture-filters"]',
            )!;

            await doSelectOption(
                filterContainer.querySelector('.dropdown-menu'),
                'League fixtures',
            );
        });

        it('hides filters when no controls', async () => {
            divisionData.fixtures!.push(
                fixtureDateBuilder('2022-10-13T00:00:00')
                    .withTournament((t) =>
                        t.forSeason(divisionData.season).type('Pairs'),
                    )
                    .build(),
            );
            await renderComponent(
                divisionData,
                account,
                undefined,
                undefined,
                true,
            );

            const filterContainer = context.container.querySelector(
                '.content-background > div[datatype="fixture-filters"]',
            );
            expect(filterContainer).toBeFalsy();
        });

        it('filters fixtures dates', async () => {
            divisionData.fixtures!.push(
                fixtureDateBuilder('2022-10-13T00:00:00')
                    .withTournament((t) =>
                        t.forSeason(divisionData.season).type('Pairs'),
                    )
                    .build(),
            );
            await renderComponent(
                divisionData,
                account,
                '/divisions',
                '/divisions?date=2020-01-01',
            );

            expect(context.container.textContent).not.toContain(
                'Pairs at another address',
            );
        });

        it('filters fixtures', async () => {
            divisionData.fixtures!.push(
                fixtureDateBuilder('2022-10-13T00:00:00')
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
                account,
                '/divisions',
                '/divisions?date=2022-10-13&type=tournaments',
            );

            expect(context.container.textContent).toContain(
                'Pairs at another address',
            );
        });

        it('filters fixtures dates after fixtures', async () => {
            divisionData.fixtures!.push(
                fixtureDateBuilder('2022-10-13T00:00:00')
                    .withTournament((t) =>
                        t.forSeason(divisionData.season).type('Pairs'),
                    )
                    .build(),
            );
            await renderComponent(
                divisionData,
                account,
                '/divisions',
                '/divisions?date=2022-10-13&type=league',
            );

            expect(context.container.textContent).not.toContain('📅');
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
            expect(getNote(fixtureDateElement)!.textContent).toEqual(
                '📌Finals night!Edit',
            );
        });

        it('renders played league fixtures', async () => {
            divisionData.fixtures!.push(
                fixtureDateBuilder('2022-10-13T00:00:00')
                    .withFixture((f) =>
                        f.playing(team('home1'), team('away1')).scores(1, 2),
                    )
                    .build(),
            );

            await renderComponent(divisionData, account);

            const fixtureDateElement = getFixtureDateElement(0, account);
            assertFixture(
                getFixturesForDate(fixtureDateElement, 1)[0],
                'home1',
                '1',
                '2',
                'away1',
                account,
            );
        });

        it('renders played knockout fixtures', async () => {
            divisionData.fixtures!.push(
                fixtureDateBuilder('2022-10-13T00:00:00')
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

            await renderComponent(divisionData, account);

            const fixtureDateElement = getFixtureDateElement(0, account);
            assertFixture(
                getFixturesForDate(fixtureDateElement, 1)[0],
                'home2 - knockout',
                '3',
                '4',
                'away2 - knockout',
                account,
            );
        });

        it('renders postponed fixtures', async () => {
            divisionData.fixtures!.push(
                fixtureDateBuilder('2022-10-13T00:00:00')
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
            assertFixture(
                getFixturesForDate(fixtureDateElement, 1)[0],
                'home3',
                'P',
                'P',
                'A team',
                account,
            );
        });

        it('renders byes', async () => {
            const team = teamBuilder('home4 - bye').build();
            divisionData.fixtures!.push(
                fixtureDateBuilder('2022-10-13T00:00:00')
                    .withFixture((f) => f.bye(team), team.id)
                    .build(),
            );

            await renderComponent(divisionData, account);

            const fixtureDateElement = getFixtureDateElement(0, account);
            assertFixture(
                getTournamentProposals(fixtureDateElement, 1)[0],
                'home4 - bye',
                '',
                '',
                'Bye',
                account,
            );
        });

        it('renders played tournaments', async () => {
            divisionData.fixtures!.push(
                fixtureDateBuilder('2022-10-13T00:00:00')
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

            const fixtureDateElement = getFixtureDateElement(0, account);
            assertTournament(
                getTournamentProposals(fixtureDateElement, 1)[0],
                'Pairs at an address',
                'The winning side',
                account,
            );
        });

        it('renders unplayed tournaments', async () => {
            divisionData.fixtures!.push(
                fixtureDateBuilder('2022-10-13T00:00:00')
                    .withTournament((t) =>
                        t
                            .address('another address')
                            .type('Pairs')
                            .forSeason(divisionData.season),
                    )
                    .build(),
            );

            await renderComponent(divisionData, account);

            const fixtureDateElement = getFixtureDateElement(0, account);
            assertTournament(
                getTournamentProposals(fixtureDateElement, 1)[0],
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
                fixtureDateBuilder('2022-10-13T00:00:00')
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
            const addressDropdown = fixtureDateElement.querySelector(
                '.address-dropdown .dropdown-menu',
            );
            await doSelectOption(addressDropdown, 'another address');
            await doClick(findButton(fixtureDateElement, '➕'));

            expect(divisionReloaded).toEqual(true);
            expect(newFixtures).not.toBeNull();
        });

        it('can add a note', async () => {
            divisionData.fixtures!.push(
                fixtureDateBuilder('2022-10-13T00:00:00')
                    .withFixture((f) => f)
                    .build(),
            );
            await renderComponent(divisionData, account);
            const fixtureDateElement = getFixtureDateElement(0, account);

            await doClick(findButton(fixtureDateElement, '📌 Add note'));

            expect(getDialog()!.textContent).toContain('Create note');
        });

        it('can edit a note', async () => {
            divisionData.fixtures!.push(
                fixtureDateBuilder('2022-10-13T00:00:00')
                    .withNote((n) => n.note('A note'))
                    .build(),
            );
            await renderComponent(divisionData, account);
            const fixtureDateElement = getFixtureDateElement(0, account);

            await doClick(findButton(getNote(fixtureDateElement), 'Edit'));

            expect(getDialog()!.textContent).toContain('Edit note');
        });

        it('can save changes to notes', async () => {
            let divisionReloaded: boolean = false;
            divisionData.onReloadDivision = async () => {
                divisionReloaded = true;
                return divisionData;
            };
            divisionData.fixtures!.push(
                fixtureDateBuilder('2022-10-13T00:00:00')
                    .withNote((n) => n.note('A note'))
                    .build(),
            );
            await renderComponent(divisionData, account);
            const fixtureDateElement = getFixtureDateElement(0, account);
            await doClick(findButton(getNote(fixtureDateElement), 'Edit'));

            const dialog = getDialog()!;
            await doChange(
                dialog,
                'textarea[name="note"]',
                'New note',
                context.user!,
            );
            await doClick(findButton(dialog, 'Save'));

            expect(getDialog()).toBeFalsy();
            expect(divisionReloaded).toEqual(true);
            expect(updatedNote).not.toBeNull();
        });

        it('can close edit notes dialog', async () => {
            divisionData.fixtures!.push(
                fixtureDateBuilder('2022-10-13T00:00:00')
                    .withNote((n) => n.note('A note'))
                    .build(),
            );
            await renderComponent(divisionData, account);
            const fixtureDateElement = getFixtureDateElement(0, account);
            await doClick(findButton(getNote(fixtureDateElement), 'Edit'));

            await doClick(findButton(getDialog()!, 'Close'));

            expect(getDialog()).toBeFalsy();
        });

        it('can open add date dialog', async () => {
            await renderComponent(divisionData, account);

            await doClick(findButton(getAdminSection(), '➕ Add date'));

            expect(getDialog()!.textContent).toContain('Add date');
        });

        it('can close add date dialog', async () => {
            await renderComponent(divisionData, account);

            await doClick(findButton(getAdminSection(), '➕ Add date'));
            await doClick(findButton(getDialog()!, 'Close'));

            expect(getDialog()).toBeFalsy();
        });

        it('prevents adding a date when no date selected', async () => {
            await renderComponent(divisionData, account);
            await doClick(findButton(getAdminSection(), '➕ Add date'));

            await doClick(findButton(getDialog(), 'Add date'));

            expect(newFixtures).toBeNull();
            context.prompts.alertWasShown('Select a date first');
        });

        it('does not add date if already exists', async () => {
            divisionData.fixtures!.push(
                fixtureDateBuilder('2022-10-13T00:00:00')
                    .withNote((n) => n.note('A note'))
                    .withTournament((t) =>
                        t.proposed().forSeason(divisionData.season),
                    )
                    .build(),
            );
            await renderComponent(divisionData, account);
            await doClick(findButton(getAdminSection(), '➕ Add date'));
            const dialog = getDialog()!;

            await doChange(
                dialog,
                'input[type="date"]',
                '2022-10-13',
                context.user!,
            );
            await doClick(findButton(dialog, 'Add date'));

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
            await doClick(findButton(getAdminSection(), '➕ Add date'));
            const dialog = getDialog()!;

            await doChange(
                dialog,
                'input[type="date"]',
                '2023-05-06',
                context.user!,
            );
            await doClick(dialog, 'input[name="isKnockout"]');
            await doClick(findButton(dialog, 'Add date'));

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
            await doClick(findButton(getAdminSection(), '➕ Add date'));
            const dialog = getDialog()!;

            await doChange(
                dialog,
                'input[type="date"]',
                '2023-05-06',
                context.user!,
            );
            await doClick(dialog, 'input[name="isKnockout"]');
            await doClick(findButton(dialog, 'Add date'));

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
                fixtureDateBuilder('2022-05-06T00:00:00')
                    .isNew()
                    .withFixture((f) => f.bye(homeTeam), homeTeam.id)
                    .build(),
            );

            await renderComponent(divisionData, account);
        });

        it('can open create new fixtures dialog', async () => {
            await renderComponent(divisionData, account);

            await doClick(findButton(getAdminSection(), '🗓️ Create fixtures'));

            expect(getDialog()!.textContent).toContain(
                'Create season fixtures...',
            );
        });

        it('can close create new fixtures dialog', async () => {
            await renderComponent(divisionData, account);
            await doClick(findButton(getAdminSection(), '🗓️ Create fixtures'));

            await doClick(findButton(getDialog()!, 'Close'));

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

                await doClick(getDeleteAllButton());

                expect(bulkDeleteRequest).toBeNull();
            });

            it('handles a failure when dry running the delete', async () => {
                account!.access!.bulkDeleteLeagueFixtures = true;
                await renderComponent(divisionData, account);
                context.prompts.respondToConfirm(dryRunPrompt, true);
                bulkDeleteResponse = {
                    success: false,
                };

                await doClick(getDeleteAllButton());

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

                await doClick(getDeleteAllButton());

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

                await doClick(getDeleteAllButton());

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

                await doClick(getDeleteAllButton());

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

                await doClick(getDeleteAllButton());

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
