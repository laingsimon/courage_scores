import {
    api,
    appProps,
    brandingProps,
    cleanUp,
    doChange,
    doClick,
    doSelectOption, ErrorState,
    findButton,
    iocProps,
    renderApp, TestContext
} from "../../helpers/tests";
import {toMap} from "../../helpers/collections";
import {DivisionFixtures} from "./DivisionFixtures";
import {DivisionDataContainer, IDivisionDataContainerProps} from "../DivisionDataContainer";
import {EditFixtureDateNoteDto} from "../../interfaces/models/dtos/EditFixtureDateNoteDto";
import {TeamDto} from "../../interfaces/models/dtos/Team/TeamDto";
import {UserDto} from "../../interfaces/models/dtos/Identity/UserDto";
import {SeasonDto} from "../../interfaces/models/dtos/Season/SeasonDto";
import {IEditableDivisionFixtureDateDto} from "../../interfaces/IEditableDivisionFixtureDateDto";
import {seasonBuilder} from "../../helpers/builders/seasons";
import {teamBuilder} from "../../helpers/builders/teams";
import {
    divisionDataBuilder,
    fixtureDateBuilder,
    IDivisionFixtureBuilder,
    INoteBuilder
} from "../../helpers/builders/divisions";
import {ITournamentBuilder, ITournamentSideBuilder} from "../../helpers/builders/tournaments";
import {DivisionFixtureDateDto} from "../../interfaces/models/dtos/Division/DivisionFixtureDateDto";
import {ISeasonTemplateApi} from "../../interfaces/apis/ISeasonTemplateApi";
import {INoteApi} from "../../interfaces/apis/INoteApi";
import {ITournamentGameApi} from "../../interfaces/apis/ITournamentGameApi";
import {IClientActionResultDto} from "../../interfaces/IClientActionResultDto";
import {TemplateDto} from "../../interfaces/models/dtos/Season/Creation/TemplateDto";
import {TournamentGameDto} from "../../interfaces/models/dtos/Game/TournamentGameDto";

describe('DivisionFixtures', () => {
    let context: TestContext;
    let reportedError: ErrorState;
    let newFixtures: IEditableDivisionFixtureDateDto[];
    let updatedNote: {id: string, note: EditFixtureDateNoteDto};
    const seasonApi = {};
    const gameApi = {};
    const noteApi = api<INoteApi>({
        create: async () => {
            return {success: true};
        },
        upsert: async (id: string, note: EditFixtureDateNoteDto) => {
            updatedNote = {id, note};
            return {success: true};
        },
    });
    const tournamentApi = api<ITournamentGameApi>({
        update: async (): Promise<IClientActionResultDto<TournamentGameDto>> => {
            return {success: true};
        },
    });
    const templateApi = api<ISeasonTemplateApi>({
        getCompatibility: async (): Promise<IClientActionResultDto<IClientActionResultDto<TemplateDto>[]>> => {
            return {success: false};
        }
    });

    async function setNewFixtures(updatedFixtures: DivisionFixtureDateDto[]) {
        newFixtures = updatedFixtures
    }

    async function setDivisionData() {

    }

    async function onReloadDivision(_?: boolean) {
        return null;
    }

    afterEach(() => {
        cleanUp(context);
    });

    beforeEach(() => {
        reportedError = new ErrorState();
        newFixtures = null;
        updatedNote = null;
    });

    async function renderComponent(divisionData: IDivisionDataContainerProps, account: UserDto, route?: string, path?: string, excludeControls?: boolean, teams?: TeamDto[]) {
        context = await renderApp(
            iocProps({seasonApi, gameApi, noteApi, tournamentApi, templateApi}),
            brandingProps(),
            appProps({
                account,
                seasons: [],
                divisions: [],
                controls: !excludeControls,
                teams: toMap(teams || []),
            }, reportedError),
            (<DivisionDataContainer {...divisionData}>
                <DivisionFixtures setNewFixtures={setNewFixtures}/>
            </DivisionDataContainer>),
            route,
            path);
    }

    function getInSeasonDivisionData(): IDivisionDataContainerProps {
        const season: SeasonDto = seasonBuilder('A season')
            .starting('2022-02-03T00:00:00')
            .ending('2022-08-25T00:00:00')
            .build();
        const team: TeamDto = teamBuilder('A team').build();

        return divisionDataBuilder()
            .season(season)
            .name('A division')
            .withTeam(team)
            .onReloadDivision(onReloadDivision)
            .setDivisionData(setDivisionData)
            .build();
    }

    function assertFixture(tr: Element, home: string, homeScore: string, awayScore: string, away: string, account?: UserDto) {
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

    function assertTournament(tr: Element, text: string, winner?: string, account?: UserDto) {
        const columns = tr.querySelectorAll('td');
        expect(columns.length).toEqual((winner ? 2 : 1) + (account ? 1 : 0));
        expect(columns[0].textContent).toEqual(text);
        if (winner) {
            expect(columns[1].textContent).toEqual('Winner: ' + winner);
        }
    }

    function getFixtureDateElement(index: number, account?: UserDto): Element {
        const fixtureElements = Array.from(context.container.querySelectorAll('div.content-background > div')) as HTMLElement[];
        expect(fixtureElements.length).toEqual(2 + (account ? 1 : 0));
        const fixtureDatesContainer = fixtureElements[1];
        const fixtureDates = fixtureDatesContainer.children;
        expect(fixtureElements.length).toBeGreaterThan(index);
        return fixtureDates[index];
    }

    function assertFixtureDate(fixtureDateElement: Element, expectedDate: string) {
        const fixtureDateHeading = fixtureDateElement.querySelector('h4');
        expect(fixtureDateHeading.textContent).toEqual('📅 ' + expectedDate);
    }

    describe('when logged out', () => {
        const account = null;

        it('renders notes', async () => {
            const divisionData = getInSeasonDivisionData();
            divisionData.fixtures.push(fixtureDateBuilder('2022-10-13T00:00:00')
                .withNote((n: INoteBuilder) => n.note('Finals night!'))
                .build());

            await renderComponent(divisionData, account);

            reportedError.verifyNoError();
            const fixtureDateElement = getFixtureDateElement(0, account);
            assertFixtureDate(fixtureDateElement, '13 Oct');
            const noteElement = fixtureDateElement.querySelector('.alert-warning');
            expect(noteElement).toBeTruthy();
            expect(noteElement.textContent).toEqual('📌Finals night!');
        });

        it('renders played league fixtures', async () => {
            const divisionData = getInSeasonDivisionData();
            divisionData.fixtures.push(fixtureDateBuilder('2022-10-13T00:00:00')
                .withFixture((f: IDivisionFixtureBuilder) => f
                    .playing('home1', 'away1')
                    .scores(1, 2))
                .build());

            await renderComponent(divisionData, account);

            reportedError.verifyNoError();
            const fixtureDateElement = getFixtureDateElement(0, account);
            assertFixtureDate(fixtureDateElement, '13 Oct');
            const fixturesForDate = fixtureDateElement.querySelectorAll('table tbody tr');
            expect(fixturesForDate.length).toEqual(1); // number of fixtures for this date
            assertFixture(fixturesForDate[0], 'home1', '1', '2', 'away1', account);
        });

        it('renders played knockout fixtures', async () => {
            const divisionData = getInSeasonDivisionData();
            divisionData.fixtures.push(fixtureDateBuilder('2022-10-13T00:00:00')
                .withFixture((f: IDivisionFixtureBuilder) => f
                    .playing('home2 - knockout', 'away2 - knockout')
                    .scores(3, 4)
                    .knockout())
                .build());

            await renderComponent(divisionData, account);

            reportedError.verifyNoError();
            const fixtureDateElement = getFixtureDateElement(0, account);
            assertFixtureDate(fixtureDateElement, '13 Oct');
            const fixturesForDate = fixtureDateElement.querySelectorAll('table tbody tr');
            expect(fixturesForDate.length).toEqual(1); // number of fixtures for this date
            assertFixture(fixturesForDate[0], 'home2 - knockout', '3', '4', 'away2 - knockout', account);
        });

        it('renders postponed fixtures', async () => {
            const divisionData = getInSeasonDivisionData();
            divisionData.fixtures.push(fixtureDateBuilder('2022-10-13T00:00:00')
                .withFixture((f: IDivisionFixtureBuilder) => f
                    .playing('home3', 'away3')
                    .scores(0, 0)
                    .postponed()
                    .knockout())
                .build());

            await renderComponent(divisionData, account);

            reportedError.verifyNoError();
            const fixtureDateElement = getFixtureDateElement(0, account);
            assertFixtureDate(fixtureDateElement, '13 Oct');
            const fixturesForDate = fixtureDateElement.querySelectorAll('table tbody tr');
            expect(fixturesForDate.length).toEqual(1); // number of fixtures for this date
            assertFixture(fixturesForDate[0], 'home3', 'P', 'P', 'away3', account);
        });

        it('renders byes', async () => {
            const divisionData = getInSeasonDivisionData();
            divisionData.fixtures.push(fixtureDateBuilder('2022-10-13T00:00:00')
                .withFixture((f: IDivisionFixtureBuilder) => f.bye('home4 - bye'))
                .build());

            await renderComponent(divisionData, account);

            reportedError.verifyNoError();
            const fixtureDateElement = getFixtureDateElement(0, account);
            assertFixtureDate(fixtureDateElement, '13 Oct');
            const fixturesForDate = fixtureDateElement.querySelectorAll('table tbody tr');
            expect(fixturesForDate.length).toEqual(1); // number of fixtures for this date
            assertFixture(fixturesForDate[0], 'home4 - bye', '', '', 'Bye', account);
        });

        it('renders played tournaments', async () => {
            const divisionData = getInSeasonDivisionData();
            divisionData.fixtures.push(fixtureDateBuilder('2022-10-13T00:00:00')
                .withTournament((t: ITournamentBuilder) => t
                    .address('an address')
                    .date('2022-10-13T00:00:00')
                    .type('Pairs')
                    .notes('Someone to run the venue')
                    .forSeason(divisionData.season)
                    .withSide((s: ITournamentSideBuilder) => s.name('The winning side'))
                    .winner('The winning side'))
                .build());

            await renderComponent(divisionData, account);

            reportedError.verifyNoError();
            const fixtureDateElement = getFixtureDateElement(0, account);
            assertFixtureDate(fixtureDateElement, '13 OctWho\'s playing?');
            const fixturesForDate = fixtureDateElement.querySelectorAll('table tbody tr');
            expect(fixturesForDate.length).toEqual(1); // number of fixtures for this date
            assertTournament(fixturesForDate[0], 'Pairs at an address', 'The winning side', account);
        });

        it('renders unplayed tournaments', async () => {
            const divisionData = getInSeasonDivisionData();
            divisionData.fixtures.push(fixtureDateBuilder('2022-10-13T00:00:00')
                .withTournament((t: ITournamentBuilder) => t
                    .address('another address')
                    .date('2022-10-13T00:00:00')
                    .notes('Someone to run the venue')
                    .forSeason(divisionData.season)
                    .withSide((s: ITournamentSideBuilder) => s.name('The winning side'))
                    .type('Pairs'))
                .build());

            await renderComponent(divisionData, account);

            reportedError.verifyNoError();
            const fixtureDateElement = getFixtureDateElement(0, account);
            assertFixtureDate(fixtureDateElement, '13 OctWho\'s playing?');
            const fixturesForDate = fixtureDateElement.querySelectorAll('table tbody tr');
            expect(fixturesForDate.length).toEqual(1); // number of fixtures for this date
            assertTournament(fixturesForDate[0], 'Pairs at another address', account);
        });

        it('renders tournament players', async () => {
            const divisionData = getInSeasonDivisionData();
            divisionData.fixtures.push(fixtureDateBuilder('2022-10-13T00:00:00')
                .withTournament((t: ITournamentBuilder) => t
                    .address('another address')
                    .date('2022-10-13T00:00:00')
                    .notes('Someone to run the venue')
                    .forSeason(divisionData.season)
                    .withSide((s: ITournamentSideBuilder) => s.name('The winning side').withPlayer('SIDE PLAYER'))
                    .type('Pairs'))
                .build());

            await renderComponent(divisionData, account, '/division', '/division#show-who-is-playing');

            reportedError.verifyNoError();
            const fixtureDateElement = getFixtureDateElement(0, account);
            expect(fixtureDateElement.textContent).toContain('SIDE PLAYER');
        });

        it('can change filters', async () => {
            const divisionData = getInSeasonDivisionData();
            divisionData.fixtures.push(fixtureDateBuilder('2022-10-13T00:00:00')
                .withTournament((t: ITournamentBuilder) => t
                    .address('another address')
                    .date('2022-10-13T00:00:00')
                    .notes('Someone to run the venue')
                    .forSeason(divisionData.season)
                    .withSide((s: ITournamentSideBuilder) => s.name('The winning side'))
                    .type('Pairs'))
                .build());
            await renderComponent(divisionData, account);
            const filterContainer = context.container.querySelector('.content-background > div[datatype="fixture-filters"]');

            await doSelectOption(filterContainer.querySelector('.dropdown-menu'), 'League fixtures');

            reportedError.verifyNoError();
        });

        it('hides filters when no controls', async () => {
            const divisionData = getInSeasonDivisionData();
            divisionData.fixtures.push(fixtureDateBuilder('2022-10-13T00:00:00')
                .withTournament((t: ITournamentBuilder) => t
                    .address('another address')
                    .date('2022-10-13T00:00:00')
                    .notes('Someone to run the venue')
                    .forSeason(divisionData.season)
                    .withSide((s: ITournamentSideBuilder) => s.name('The winning side'))
                    .type('Pairs'))
                .build());
            await renderComponent(divisionData, account, null, null, true);

            reportedError.verifyNoError();
            const filterContainer = context.container.querySelector('.content-background > div[datatype="fixture-filters"]');
            expect(filterContainer).toBeFalsy();
        });

        it('filters fixtures dates', async () => {
            const divisionData = getInSeasonDivisionData();
            divisionData.fixtures.push(fixtureDateBuilder('2022-10-13T00:00:00')
                .withTournament((t: ITournamentBuilder) => t
                    .address('another address')
                    .date('2022-10-13T00:00:00')
                    .notes('Someone to run the venue')
                    .forSeason(divisionData.season)
                    .withSide((s: ITournamentSideBuilder) => s.name('The winning side'))
                    .type('Pairs'))
                .build());
            await renderComponent(divisionData, account, '/divisions', '/divisions?date=2020-01-01');

            reportedError.verifyNoError();
            expect(context.container.textContent).not.toContain('Pairs at another address');
        });

        it('filters fixtures', async () => {
            const divisionData = getInSeasonDivisionData();
            divisionData.fixtures.push(fixtureDateBuilder('2022-10-13T00:00:00')
                .withTournament((t: ITournamentBuilder) => t
                    .address('another address')
                    .date('2022-10-13T00:00:00')
                    .notes('Someone to run the venue')
                    .forSeason(divisionData.season)
                    .withSide((s: ITournamentSideBuilder) => s.name('The winning side'))
                    .type('Pairs'))
                .build());
            await renderComponent(divisionData, account, '/divisions', '/divisions?date=2022-10-13&type=tournaments');

            reportedError.verifyNoError();
            expect(context.container.textContent).toContain('Pairs at another address');
        });

        it('filters fixtures dates after fixtures', async () => {
            const divisionData = getInSeasonDivisionData();
            divisionData.fixtures.push(fixtureDateBuilder('2022-10-13T00:00:00')
                .withTournament((t: ITournamentBuilder) => t
                    .address('another address')
                    .date('2022-10-13T00:00:00')
                    .notes('Someone to run the venue')
                    .forSeason(divisionData.season)
                    .withSide((s: ITournamentSideBuilder) => s.name('The winning side'))
                    .type('Pairs'))
                .build());
            await renderComponent(divisionData, account, '/divisions', '/divisions?date=2022-10-13&type=league');

            reportedError.verifyNoError();
            expect(context.container.textContent).not.toContain('📅');
        });
    });

    describe('when logged in', () => {
        const account: UserDto = {
            name: '',
            givenName: '',
            emailAddress: '',
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
                .withNote((n: INoteBuilder) => n.note('Finals night!'))
                .build());

            await renderComponent(divisionData, account);

            reportedError.verifyNoError();
            const fixtureDateElement = getFixtureDateElement(0, account);
            assertFixtureDate(fixtureDateElement, '13 Oct📌 Add noteQualifier');
            const noteElement = fixtureDateElement.querySelector('.alert-warning');
            expect(noteElement).toBeTruthy();
            expect(noteElement.textContent).toEqual('📌Finals night!Edit');
        });

        it('renders played league fixtures', async () => {
            const divisionData = getInSeasonDivisionData();
            divisionData.fixtures.push(fixtureDateBuilder('2022-10-13T00:00:00')
                .withFixture((f: IDivisionFixtureBuilder) => f
                    .playing('home1', 'away1')
                    .scores(1, 2))
                .build());

            await renderComponent(divisionData, account);

            reportedError.verifyNoError();
            const fixtureDateElement = getFixtureDateElement(0, account);
            assertFixtureDate(fixtureDateElement, '13 Oct📌 Add note');
            const fixturesForDate = fixtureDateElement.querySelectorAll('table tbody tr');
            expect(fixturesForDate.length).toEqual(1); // number of fixtures for this date
            assertFixture(fixturesForDate[0], 'home1', '1', '2', 'away1', account);
        });

        it('renders played knockout fixtures', async () => {
            const divisionData = getInSeasonDivisionData();
            divisionData.fixtures.push(fixtureDateBuilder('2022-10-13T00:00:00')
                .withFixture((f: IDivisionFixtureBuilder) => f
                    .playing('home2 - knockout', 'away2 - knockout')
                    .scores(3, 4)
                    .knockout())
                .build());

            await renderComponent(divisionData, account);

            reportedError.verifyNoError();
            const fixtureDateElement = getFixtureDateElement(0, account);
            assertFixtureDate(fixtureDateElement, '13 Oct📌 Add note');
            const fixturesForDate = fixtureDateElement.querySelectorAll('table tbody tr');
            expect(fixturesForDate.length).toEqual(1); // number of fixtures for this date
            assertFixture(fixturesForDate[0], 'home2 - knockout', '3', '4', 'away2 - knockout', account);
        });

        it('renders postponed fixtures', async () => {
            const divisionData = getInSeasonDivisionData();
            divisionData.fixtures.push(fixtureDateBuilder('2022-10-13T00:00:00')
                .withFixture((f: IDivisionFixtureBuilder) => f
                    .playing('home3', divisionData.teams[0])
                    .scores(0, 0)
                    .postponed())
                .build());

            await renderComponent(divisionData, account);

            reportedError.verifyNoError();
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
                .withFixture((f: IDivisionFixtureBuilder) => f.bye(team), team.id)
                .build());

            await renderComponent(divisionData, account);

            reportedError.verifyNoError();
            const fixtureDateElement = getFixtureDateElement(0, account);
            assertFixtureDate(fixtureDateElement, '13 Oct📌 Add noteQualifier');
            const fixturesForDate = fixtureDateElement.querySelectorAll('table tbody tr');
            expect(fixturesForDate.length).toEqual(1); // number of fixtures for this date
            assertFixture(fixturesForDate[0], 'home4 - bye', '', '', 'Bye', account);
        });

        it('renders played tournaments', async () => {
            const divisionData = getInSeasonDivisionData();
            divisionData.fixtures.push(fixtureDateBuilder('2022-10-13T00:00:00')
                .withTournament((t: ITournamentBuilder) => t
                    .address('an address')
                    .date('2022-10-13T00:00:00')
                    .type('Pairs')
                    .forSeason(divisionData.season)
                    .notes('Someone to run the venue')
                    .withSide((s: ITournamentSideBuilder) => s.name('The winning side'))
                    .winner('The winning side'))
                .build());

            await renderComponent(divisionData, account);

            reportedError.verifyNoError();
            const fixtureDateElement = getFixtureDateElement(0, account);
            assertFixtureDate(fixtureDateElement, '13 Oct📌 Add noteWho\'s playing?');
            const fixturesForDate = fixtureDateElement.querySelectorAll('table tbody tr');
            expect(fixturesForDate.length).toEqual(1); // number of fixtures for this date
            assertTournament(fixturesForDate[0], 'Pairs at an address', 'The winning side', account);
        });

        it('renders unplayed tournaments', async () => {
            const divisionData = getInSeasonDivisionData();
            divisionData.fixtures.push(fixtureDateBuilder('2022-10-13T00:00:00')
                .withTournament((t: ITournamentBuilder) => t
                    .address('another address')
                    .date('2022-10-13T00:00:00')
                    .type('Pairs')
                    .forSeason(divisionData.season)
                    .notes('Someone to run the venue')
                    .withSide((s: ITournamentSideBuilder) => s.name('The winning side')))
                .build());

            await renderComponent(divisionData, account);

            reportedError.verifyNoError();
            const fixtureDateElement = getFixtureDateElement(0, account);
            assertFixtureDate(fixtureDateElement, '13 Oct📌 Add noteWho\'s playing?');
            const fixturesForDate = fixtureDateElement.querySelectorAll('table tbody tr');
            expect(fixturesForDate.length).toEqual(1); // number of fixtures for this date
            assertTournament(fixturesForDate[0], 'Pairs at another address', null, account);
        });

        it('reloads tournaments if they are changed', async () => {
            let divisionReloaded: boolean;
            const divisionData = getInSeasonDivisionData();
            divisionData.onReloadDivision = async () => {
                divisionReloaded = true;
                return divisionData;
            };
            divisionData.fixtures.push(fixtureDateBuilder('2022-10-13T00:00:00')
                .withTournament((t: ITournamentBuilder) => t
                    .address('another address')
                    .date('2022-10-13T00:00:00')
                    .forSeason(divisionData.season)
                    .proposed())
                .build());
            await renderComponent(
                divisionData,
                account);

            const fixtureDateElement = getFixtureDateElement(0, account);
            await doClick(findButton(fixtureDateElement, '➕'));

            reportedError.verifyNoError();
            expect(divisionReloaded).toEqual(true);
            expect(newFixtures).not.toBeNull();
        });

        it('can add a note', async () => {
            const divisionData = getInSeasonDivisionData();
            const team = teamBuilder('home5 - bye').build();
            divisionData.fixtures.push(fixtureDateBuilder('2022-10-13T00:00:00')
                .withFixture((f: IDivisionFixtureBuilder) => f.bye(team.address), team.id)
                .build());
            await renderComponent(divisionData, account);
            const fixtureDateElement = getFixtureDateElement(0, account);

            await doClick(findButton(fixtureDateElement, '📌 Add note'));

            reportedError.verifyNoError();
            const dialog = context.container.querySelector('.modal-dialog');
            expect(dialog).toBeTruthy();
            expect(dialog.textContent).toContain('Create note');
        });

        it('can edit a note', async () => {
            const divisionData = getInSeasonDivisionData();
            divisionData.fixtures.push(fixtureDateBuilder('2022-10-13T00:00:00')
                .withNote((n: INoteBuilder) => n.note('A note'))
                .build());
            await renderComponent(divisionData, account);
            const fixtureDateElement = getFixtureDateElement(0, account);

            await doClick(findButton(fixtureDateElement.querySelector('.alert'), 'Edit'));

            reportedError.verifyNoError();
            const dialog = context.container.querySelector('.modal-dialog');
            expect(dialog).toBeTruthy();
            expect(dialog.textContent).toContain('Edit note');
        });

        it('can save changes to notes', async () => {
            let divisionReloaded: boolean;
            const divisionData = getInSeasonDivisionData();
            divisionData.onReloadDivision = async () => {
                divisionReloaded = true;
                return divisionData;
            };
            divisionData.fixtures.push(fixtureDateBuilder('2022-10-13T00:00:00')
                .withNote((n: INoteBuilder) => n.note('A note'))
                .build());
            await renderComponent(divisionData, account);
            const fixtureDateElement = getFixtureDateElement(0, account);
            await doClick(findButton(fixtureDateElement.querySelector('.alert'), 'Edit'));

            const dialog = context.container.querySelector('.modal-dialog');
            await doChange(dialog, 'textarea[name="note"]', 'New note', context.user);
            await doClick(findButton(dialog, 'Save'));

            reportedError.verifyNoError();
            expect(context.container.querySelector('.modal-dialog')).toBeFalsy();
            expect(divisionReloaded).toEqual(true);
            expect(updatedNote).not.toBeNull();
        });

        it('can close edit notes dialog', async () => {
            const divisionData = getInSeasonDivisionData();
            divisionData.fixtures.push(fixtureDateBuilder('2022-10-13T00:00:00')
                .withNote((n: INoteBuilder) => n.note('A note'))
                .build());
            await renderComponent(divisionData, account);
            const fixtureDateElement = getFixtureDateElement(0, account);
            await doClick(findButton(fixtureDateElement.querySelector('.alert'), 'Edit'));
            const dialog = context.container.querySelector('.modal-dialog');

            await doClick(findButton(dialog, 'Close'));

            reportedError.verifyNoError();
            expect(context.container.querySelector('.modal-dialog')).toBeFalsy();
        });

        it('can open add date dialog', async () => {
            const divisionData = getInSeasonDivisionData();
            await renderComponent(divisionData, account);

            await doClick(findButton(context.container, '➕ Add date'));

            reportedError.verifyNoError();
            const dialog = context.container.querySelector('.modal-dialog');
            expect(dialog).toBeTruthy();
            expect(dialog.textContent).toContain('Add date');
        });

        it('can close add date dialog', async () => {
            const divisionData = getInSeasonDivisionData();
            await renderComponent(divisionData, account);

            await doClick(findButton(context.container, '➕ Add date'));
            await doClick(findButton(context.container.querySelector('.modal-dialog'), 'Close'));

            reportedError.verifyNoError();
            const dialog = context.container.querySelector('.modal-dialog');
            expect(dialog).toBeFalsy();
        });

        it('prevents adding a date when no date selected', async () => {
            const divisionData = getInSeasonDivisionData();
            await renderComponent(divisionData, account);
            await doClick(findButton(context.container, '➕ Add date'));
            const dialog = context.container.querySelector('.modal-dialog');
            let alert: string;
            window.alert = (message) => alert = message;

            await doClick(findButton(dialog, 'Add date'));

            reportedError.verifyNoError();
            expect(newFixtures).toBeNull();
            expect(alert).toEqual('Select a date first');
        });

        it('does not add date if already exists', async () => {
            const divisionData = getInSeasonDivisionData();
            divisionData.fixtures.push(fixtureDateBuilder('2022-10-13T00:00:00')
                .withNote((n: INoteBuilder) => n.note('A note'))
                .withTournament((t: ITournamentBuilder) => t
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

            reportedError.verifyNoError();
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

            reportedError.verifyNoError();
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
                .withFixture((f: IDivisionFixtureBuilder) => f.bye(homeTeam.address), homeTeam.id)
                .build());

            await renderComponent(divisionData, account);

            reportedError.verifyNoError();
        });

        it('can open create new fixtures dialog', async () => {
            const divisionData = getInSeasonDivisionData();
            await renderComponent(divisionData, account);

            await doClick(findButton(context.container, '🗓️ Create fixtures'));

            reportedError.verifyNoError();
            const dialog = context.container.querySelector('.modal-dialog');
            expect(dialog).toBeTruthy();
            expect(dialog.textContent).toContain('Create season fixtures...');
        });

        it('can close create new fixtures dialog', async () => {
            const divisionData = getInSeasonDivisionData();
            await renderComponent(divisionData, account);
            await doClick(findButton(context.container, '🗓️ Create fixtures'));
            reportedError.verifyNoError();

            await doClick(findButton(context.container.querySelector('.modal-dialog'), 'Close'))

            const dialog = context.container.querySelector('.modal-dialog');
            expect(dialog).toBeFalsy();
        });
    });
});