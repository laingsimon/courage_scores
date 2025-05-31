import {
    api,
    appProps,
    brandingProps,
    cleanUp,
    doClick,
    doSelectOption, ErrorState,
    findButton, iocProps,
    renderApp, TestContext,
} from "../../helpers/tests";
import {renderDate} from "../../helpers/rendering";
import {createTemporaryId} from "../../helpers/projection";
import {DivisionFixture, IDivisionFixtureProps} from "./DivisionFixture";
import {DivisionDataContainer, IDivisionDataContainerProps} from "../league/DivisionDataContainer";
import {IClientActionResultDto} from "../common/IClientActionResultDto";
import {EditGameDto} from "../../interfaces/models/dtos/Game/EditGameDto";
import {GameDto} from "../../interfaces/models/dtos/Game/GameDto";
import {UserDto} from "../../interfaces/models/dtos/Identity/UserDto";
import {TeamDto} from "../../interfaces/models/dtos/Team/TeamDto";
import {DivisionFixtureDateDto} from "../../interfaces/models/dtos/Division/DivisionFixtureDateDto";
import {SeasonDto} from "../../interfaces/models/dtos/Season/SeasonDto";
import {DivisionDto} from "../../interfaces/models/dtos/DivisionDto";
import {IDatedDivisionFixtureDto} from "./IDatedDivisionFixtureDto";
import {IEditableDivisionFixtureDateDto} from "./IEditableDivisionFixtureDateDto";
import {divisionBuilder, divisionDataBuilder, divisionFixtureBuilder} from "../../helpers/builders/divisions";
import {teamBuilder} from "../../helpers/builders/teams";
import {seasonBuilder} from "../../helpers/builders/seasons";
import {IGameApi} from "../../interfaces/apis/IGameApi";
import {IPreferenceData} from "../common/PreferencesContainer";

describe('DivisionFixture', () => {
    let context: TestContext;
    let reportedError: ErrorState;
    let divisionReloaded: boolean;
    let updatedFixtures: ((x: IEditableDivisionFixtureDateDto[]) => DivisionFixtureDateDto[]) | null;
    let beforeReloadDivisionCalled: boolean;
    let savedFixture: EditGameDto | null;
    let deletedFixture: string | null;
    let apiResponse: IClientActionResultDto<GameDto> | null;

    const gameApi = api<IGameApi>({
        update: async (fixture: EditGameDto) => {
            savedFixture = fixture;
            return apiResponse || {success: true};
        },
        delete: async (id: string) => {
            deletedFixture = id;
            return apiResponse || {success: true};
        }
    });

    async function onReloadDivision() {
        divisionReloaded = true;

        if (!beforeReloadDivisionCalled) {
            throw new Error('Reload Division called before beforeReloadDivision');
        }

        return null;
    }

    async function beforeReloadDivision() {
        beforeReloadDivisionCalled = true;
    }

    async function onUpdateFixtures(data: (x: IEditableDivisionFixtureDateDto[]) => DivisionFixtureDateDto[]): Promise<DivisionFixtureDateDto[]> {
        updatedFixtures = data;
        return [];
    }

    afterEach(async () => {
        await cleanUp(context);
    });

    beforeEach(() => {
        reportedError = new ErrorState();
        divisionReloaded = false;
        updatedFixtures = null;
        beforeReloadDivisionCalled = false;
        savedFixture = null;
        deletedFixture = null;
        apiResponse = null;
    });

    async function renderComponent(props: IDivisionFixtureProps, divisionData: IDivisionDataContainerProps, account: UserDto | undefined, teams: TeamDto[], preferenceData?: IPreferenceData) {
        context = await renderApp(
            iocProps({gameApi}),
            brandingProps(),
            appProps({
                account,
                teams,
            }, reportedError),
            (<DivisionDataContainer {...divisionData} onReloadDivision={onReloadDivision}>
                <DivisionFixture {...props} />
            </DivisionDataContainer>),
            undefined,
            undefined,
            'tbody',
            preferenceData);
    }

    describe('when logged out', () => {
        const season: SeasonDto = seasonBuilder('SEASON').build();
        const division: DivisionDto = divisionBuilder('DIVISION').build();
        const team: TeamDto = teamBuilder('TEAM').build();
        const account: UserDto | undefined = undefined;
        const date: string = '2023-05-06T00:00:00';

        it('renders unplayed fixture', async () => {
            const fixture: IDatedDivisionFixtureDto = divisionFixtureBuilder(date)
                .playing(teamBuilder('HOME').build(), teamBuilder('AWAY').build())
                .build();
            await renderComponent(
                {fixture, date, readOnly: false, beforeReloadDivision, onUpdateFixtures},
                divisionDataBuilder(division)
                    .withFixtureDate((d) => d.withFixture(f => f.playing(teamBuilder('HOME').build(), teamBuilder('AWAY').build())), date)
                    .season(s => s)
                    .withTeam(team)
                    .build(),
                account,
                [team]);

            reportedError.verifyNoError();
            const cells = Array.from(context.container.querySelectorAll('td'));
            const cellText = cells.map(td => td.textContent);
            expect(cellText).toEqual(['HOME', '', 'vs', '', 'AWAY']);
            const linkToHome = cells[0].querySelector('a')!;
            expect(linkToHome.href).toEqual(`http://localhost/score/${fixture.id}`);
            const linkToAway = cells[4].querySelector('a')!;
            expect(linkToAway.href).toEqual(`http://localhost/score/${fixture.id}`);
        });

        it('renders postponed fixture', async () => {
            const fixture: IDatedDivisionFixtureDto = divisionFixtureBuilder(date)
                .postponed()
                .playing(teamBuilder('HOME').build(), teamBuilder('AWAY').build())
                .build();
            await renderComponent(
                {fixture, date, readOnly: false, beforeReloadDivision, onUpdateFixtures},
                divisionDataBuilder(division)
                    .withFixtureDate((d) => d.withFixture(f => f.postponed().playing(teamBuilder('HOME').build(), teamBuilder('AWAY').build())), date)
                    .season(s => s)
                    .withTeam(team)
                    .build(),
                account,
                [team]);

            reportedError.verifyNoError();
            const cells = Array.from(context.container.querySelectorAll('td'));
            const cellText = cells.map(td => td.textContent);
            expect(cellText).toEqual(['HOME', 'P', 'vs', 'P', 'AWAY']);
            const linkToHome = cells[0].querySelector('a')!;
            expect(linkToHome.href).toEqual(`http://localhost/score/${fixture.id}`);
            const linkToAway = cells[4].querySelector('a')!;
            expect(linkToAway.href).toEqual(`http://localhost/score/${fixture.id}`);
        });

        it('renders qualifier fixture', async () => {
            const fixture: IDatedDivisionFixtureDto = divisionFixtureBuilder(date)
                .playing(teamBuilder('HOME').build(), teamBuilder('AWAY').build())
                .knockout()
                .build();
            await renderComponent(
                {fixture, date, readOnly: false, beforeReloadDivision, onUpdateFixtures},
                divisionDataBuilder(division)
                    .withFixtureDate((d) => d.withFixture(f => f.playing(teamBuilder('HOME').build(), teamBuilder('AWAY').build()).knockout()), date)
                    .season(s => s)
                    .withTeam(team)
                    .build(),
                account,
                [team]);

            reportedError.verifyNoError();
            const cells = Array.from(context.container.querySelectorAll('td'));
            const cellText = cells.map(td => td.textContent);
            expect(cellText).toEqual(['HOME', '', 'vs', '', 'AWAY']);
            const linkToHome = cells[0].querySelector('a')!;
            expect(linkToHome.href).toEqual(`http://localhost/score/${fixture.id}`);
            const linkToAway = cells[4].querySelector('a')!;
            expect(linkToAway.href).toEqual(`http://localhost/score/${fixture.id}`);
        });

        it('renders bye', async () => {
            const fixture: IDatedDivisionFixtureDto = divisionFixtureBuilder(date)
                .bye(teamBuilder('HOME').build())
                .build();
            await renderComponent(
                {fixture, date, readOnly: false, beforeReloadDivision, onUpdateFixtures},
                divisionDataBuilder(division)
                    .withFixtureDate((d) => d.withFixture(f => f.bye(teamBuilder('HOME').build())), date)
                    .season(s => s, season.name)
                    .withTeam(team)
                    .build(),
                account,
                [team]);

            reportedError.verifyNoError();
            const cells = Array.from(context.container.querySelectorAll('td'));
            const cellText = cells.map(td => td.textContent);
            expect(cellText).toEqual(['HOME', '', 'vs', '', 'Bye']);
            const linkToHome = cells[0].querySelector('a')!;
            expect(linkToHome.href).toEqual(`http://localhost/division/${division.name}/team:${fixture.homeTeam.name}/${season.name}`);
            const linkToAway = cells[4].querySelector('a')!;
            expect(linkToAway).toBeFalsy();
        });

        it('does not shade when no favourites', async () => {
            const fixture: IDatedDivisionFixtureDto = divisionFixtureBuilder(date)
                .bye(teamBuilder('HOME').build())
                .build();
            await renderComponent(
                {fixture, date, readOnly: false, beforeReloadDivision, onUpdateFixtures},
                divisionDataBuilder(division)
                    .withFixtureDate((d) => d.withFixture(f => f.bye(teamBuilder('HOME').build())), date)
                    .season(s => s)
                    .withTeam(team)
                    .favouritesEnabled(true)
                    .build(),
                account,
                [team],
                { });

            reportedError.verifyNoError();
            const row = context.container.querySelector('tr')!;
            expect(row.className).not.toContain('opacity-25');
        });

        it('shades non-favourite teams', async () => {
            const fixture: IDatedDivisionFixtureDto = divisionFixtureBuilder(date)
                .bye(teamBuilder('HOME').build())
                .build();
            await renderComponent(
                {fixture, date, readOnly: false, beforeReloadDivision, onUpdateFixtures},
                divisionDataBuilder(division)
                    .withFixtureDate((d) => d.withFixture(f => f.bye(teamBuilder('HOME').build())), date)
                    .season(s => s)
                    .withTeam(team)
                    .favouritesEnabled(true)
                    .build(),
                account,
                [team],
                {
                    favouriteTeamIds: ['1234'],
                });

            reportedError.verifyNoError();
            const row = context.container.querySelector('tr')!;
            expect(row.className).toContain('opacity-25');
        });

        it('does not shade bye for favourite-team', async () => {
            const fixture: IDatedDivisionFixtureDto = divisionFixtureBuilder(date)
                .bye(teamBuilder('HOME').build())
                .build();
            await renderComponent(
                {fixture, date, readOnly: false, beforeReloadDivision, onUpdateFixtures},
                divisionDataBuilder(division)
                    .withFixtureDate((d) => d.withFixture(f => f.bye(teamBuilder('HOME').build())), date)
                    .season(s => s)
                    .withTeam(team)
                    .favouritesEnabled(true)
                    .build(),
                account,
                [team],
                {
                    favouriteTeamIds: [fixture.homeTeam.id],
                });

            reportedError.verifyNoError();
            const row = context.container.querySelector('tr')!;
            expect(row.className).not.toContain('opacity-25');
        });

        it('does not shade home-team favourite', async () => {
            const fixture: IDatedDivisionFixtureDto = divisionFixtureBuilder(date)
                .playing(teamBuilder('HOME').build(), teamBuilder('AWAY').build())
                .build();
            await renderComponent(
                {fixture, date, readOnly: false, beforeReloadDivision, onUpdateFixtures},
                divisionDataBuilder(division)
                    .withFixtureDate((d) => d.withFixture(f => f.playing(teamBuilder('HOME').build(), teamBuilder('AWAY').build())), date)
                    .season(s => s)
                    .withTeam(team)
                    .favouritesEnabled(true)
                    .build(),
                account,
                [team],
                {
                    favouriteTeamIds: [fixture.homeTeam.id],
                });

            reportedError.verifyNoError();
            const row = context.container.querySelector('tr')!;
            expect(row.className).not.toContain('opacity-25');
        });

        it('does not shade away-team favourite', async () => {
            const fixture: IDatedDivisionFixtureDto = divisionFixtureBuilder(date)
                .playing(teamBuilder('HOME').build(), teamBuilder('AWAY').build())
                .build();
            await renderComponent(
                {fixture, date, readOnly: false, beforeReloadDivision, onUpdateFixtures},
                divisionDataBuilder(division)
                    .withFixtureDate((d) => d.withFixture(f => f.playing(teamBuilder('HOME').build(), teamBuilder('AWAY').build())), date)
                    .season(s => s)
                    .withTeam(team)
                    .favouritesEnabled(true)
                    .build(),
                account,
                [team],
                {
                    favouriteTeamIds: [fixture!.awayTeam!.id],
                });

            reportedError.verifyNoError();
            const row = context.container.querySelector('tr')!;
            expect(row.className).not.toContain('opacity-25');
        });

        it('can set a favourite team', async () => {
            const fixture: IDatedDivisionFixtureDto = divisionFixtureBuilder(date)
                .playing(teamBuilder('HOME').build(), teamBuilder('AWAY').build())
                .build();
            await renderComponent(
                {fixture, date, readOnly: false, beforeReloadDivision, onUpdateFixtures},
                divisionDataBuilder(division)
                    .withFixtureDate((d) => d.withFixture(f => f.playing(teamBuilder('HOME').build(), teamBuilder('AWAY').build())), date)
                    .season(s => s)
                    .withTeam(team)
                    .favouritesEnabled(true)
                    .build(),
                account,
                [team],
                { favouriteTeamIds: [] });
            const row = context.container.querySelector('tr')!;
            const favouriteToggles = Array.from(row.querySelectorAll('button[datatype="toggle-favourite"]'));

            await doClick(favouriteToggles[0]);

            const favouriteTeamIds = context.cookies!.get('preferences').favouriteTeamIds;
            expect(favouriteTeamIds).toEqual([fixture.homeTeam.id]);
        });

        it('can unset a favourite team', async () => {
            const fixture: IDatedDivisionFixtureDto = divisionFixtureBuilder(date)
                .playing(teamBuilder('HOME').build(), teamBuilder('AWAY').build())
                .build();
            await renderComponent(
                {fixture, date, readOnly: false, beforeReloadDivision, onUpdateFixtures},
                divisionDataBuilder(division)
                    .withFixtureDate((d) => d.withFixture(f => f.playing(teamBuilder('HOME').build(), teamBuilder('AWAY').build())), date)
                    .season(s => s)
                    .withTeam(team)
                    .favouritesEnabled(true)
                    .build(),
                account,
                [team],
                { favouriteTeamIds: [fixture.homeTeam.id] });
            const row = context.container.querySelector('tr')!;
            const favouriteToggles = Array.from(row.querySelectorAll('button[datatype="toggle-favourite"]'));

            await doClick(favouriteToggles[0]);

            const favouriteTeamIds = context.cookies!.get('preferences').favouriteTeamIds;
            expect(favouriteTeamIds).toEqual([]);
        });
    });

    describe('when logged in', () => {
        const season: SeasonDto = seasonBuilder('SEASON').build();
        const division: DivisionDto = divisionBuilder('DIVISION').build();
        const homeTeam: TeamDto = teamBuilder('HOME')
            .address('HOME ADDRESS')
            .forSeason(season, division)
            .build();
        const awayTeam: TeamDto = teamBuilder('AWAY')
            .address('AWAY ADDRESS')
            .forSeason(season, division)
            .build();
        const account: UserDto = {
            emailAddress: '',
            name: '',
            givenName: '',
            access: {
                manageGames: true,
            }
        };
        const date: string = '2023-05-06T00:00:00';
        const anotherTeam: TeamDto = teamBuilder('ANOTHER TEAM')
            .address('ANOTHER ADDRESS')
            .build();
        const fixture: IDatedDivisionFixtureDto = divisionFixtureBuilder(date)
            .playing(homeTeam, awayTeam)
            .build();

        it('renders unplayed fixture', async () => {
            const fixture: IDatedDivisionFixtureDto = divisionFixtureBuilder(date)
                .playing(homeTeam, awayTeam)
                .build();
            await renderComponent(
                {fixture, date, readOnly: false, beforeReloadDivision, onUpdateFixtures},
                divisionDataBuilder(division)
                    .withFixtureDate((d) => d.withFixture(f => f.playing(homeTeam, awayTeam), fixture.id), date)
                    .season(s => s)
                    .withTeam(homeTeam).withTeam(awayTeam)
                    .build(),
                account,
                [homeTeam, awayTeam]);

            reportedError.verifyNoError();
            const cells = Array.from(context.container.querySelectorAll('td'));
            const cellText = cells.map(td => td.textContent);
            expect(cellText).toEqual(['HOME', '', 'vs', '', 'AWAYAWAY', '🗑']);
            const linkToHome = cells[0].querySelector('a')!;
            expect(linkToHome.href).toEqual(`http://localhost/score/${fixture.id}`);
        });

        it('renders postponed fixture', async () => {
            const fixture: IDatedDivisionFixtureDto = divisionFixtureBuilder(date)
                .playing(homeTeam, awayTeam)
                .postponed()
                .build();
            await renderComponent(
                {fixture, date, readOnly: false, beforeReloadDivision, onUpdateFixtures},
                divisionDataBuilder(division)
                    .withFixtureDate((d) => d.withFixture(f => f.playing(homeTeam, awayTeam).postponed(), fixture.id), date)
                    .season(s => s)
                    .withTeam(homeTeam).withTeam(awayTeam)
                    .build(),
                account,
                [homeTeam, awayTeam]);

            reportedError.verifyNoError();
            const cells = Array.from(context.container.querySelectorAll('td'));
            const cellText = cells.map(td => td.textContent);
            expect(cellText).toEqual(['HOME', 'P', 'vs', 'P', 'AWAYAWAY', '🗑']);
            const linkToHome = cells[0].querySelector('a')!;
            expect(linkToHome.href).toEqual(`http://localhost/score/${fixture.id}`);
        });

        it('renders qualifier fixture', async () => {
            const fixture: IDatedDivisionFixtureDto = divisionFixtureBuilder(date)
                .playing(homeTeam, awayTeam)
                .knockout()
                .build();
            await renderComponent(
                {fixture, date, readOnly: false, beforeReloadDivision, onUpdateFixtures},
                divisionDataBuilder(division)
                    .withFixtureDate((d) => d.withFixture(f => f.playing(homeTeam, awayTeam).knockout(), fixture.id), date)
                    .season(s => s, season.name, season.id)
                    .withTeam(homeTeam).withTeam(awayTeam)
                    .build(),
                account,
                [homeTeam, awayTeam]);

            reportedError.verifyNoError();
            const cells = Array.from(context.container.querySelectorAll('td'));
            const cellText = cells.map(td => td.textContent);
            expect(cellText).toEqual(['HOME', '', 'vs', '', 'AWAYAWAY', '🗑']);
            const linkToHome = cells[0].querySelector('a')!;
            expect(linkToHome.href).toEqual(`http://localhost/score/${fixture.id}`);
        });

        it('renders bye', async () => {
            const fixture: IDatedDivisionFixtureDto = divisionFixtureBuilder(date)
                .bye(homeTeam)
                .build();
            await renderComponent(
                {fixture, date, readOnly: false, beforeReloadDivision, onUpdateFixtures},
                divisionDataBuilder(division)
                    .withFixtureDate((d) => d.withFixture(f => f.bye(homeTeam)), date)
                    .season(s => s, season.name)
                    .withTeam(homeTeam).withTeam(awayTeam)
                    .build(),
                account,
                [homeTeam, awayTeam]);

            reportedError.verifyNoError();
            const cells = Array.from(context.container.querySelectorAll('td'));
            const cellText = cells.map(td => td.textContent);
            expect(cellText).toEqual(['HOME', '', 'vs', '', 'AWAY', '']);
            const linkToHome = cells[0].querySelector('a')!;
            expect(linkToHome.href).toEqual(`http://localhost/division/${division.name}/team:${fixture.homeTeam.name}/${season.name}`);
        });

        it('renders selectable away team with same address (league fixture)', async () => {
            const anotherTeamAtHomeAddress: TeamDto = teamBuilder('ANOTHER TEAM')
                .address('HOME ADDRESS')
                .build();
            const fixture: IDatedDivisionFixtureDto = divisionFixtureBuilder(date)
                .bye(homeTeam)
                .build();
            await renderComponent(
                {fixture, date, readOnly: false, beforeReloadDivision, onUpdateFixtures},
                divisionDataBuilder(division)
                    .withFixtureDate((d) => d.withFixture(f => f.bye(homeTeam)), date)
                    .season(s => s)
                    .withTeam(homeTeam).withTeam(awayTeam).withTeam(anotherTeamAtHomeAddress)
                    .build(),
                account,
                [homeTeam, awayTeam, anotherTeamAtHomeAddress]);

            reportedError.verifyNoError();
            const awayCell = context.container.querySelector('td:nth-child(5)')!;
            expect(awayCell.textContent).toContain('ANOTHER TEAM');
            expect(awayCell.textContent).not.toContain('🚫');
        });

        it('renders unselectable away team playing elsewhere (league fixture)', async () => {
            const byeFixture: IDatedDivisionFixtureDto = divisionFixtureBuilder(date)
                .bye(homeTeam)
                .build();
            await renderComponent(
                {fixture: byeFixture, date, readOnly: false, beforeReloadDivision, onUpdateFixtures},
                divisionDataBuilder(division)
                    .withFixtureDate(d => d
                        .withFixture(f => f.bye(homeTeam))
                        .withFixture(f => f.playing(homeTeam, awayTeam)), date)
                    .season(s => s)
                    .withTeam(homeTeam).withTeam(awayTeam)
                    .build(),
                account,
                [homeTeam, awayTeam]);

            reportedError.verifyNoError();
            const awayCell = context.container.querySelector('td:nth-child(5)')!;
            expect(awayCell.textContent).toContain('🚫 AWAY (Already playing against HOME)');
        });

        it('renders unselectable away team played fixture previously (league fixture)', async () => {
            const fixture: IDatedDivisionFixtureDto = divisionFixtureBuilder(date)
                .bye(homeTeam)
                .build();
            const anotherFixture: IDatedDivisionFixtureDto = divisionFixtureBuilder('2023-05-13T00:00:00')
                .playing(homeTeam, awayTeam)
                .build();
            await renderComponent(
                {fixture, date: fixture.date, readOnly: false, beforeReloadDivision, onUpdateFixtures},
                divisionDataBuilder(division)
                    .withFixtureDate(d => d.withFixture(f => f.bye(homeTeam)), fixture.date)
                    .withFixtureDate(d => d.withFixture(f => f.playing(homeTeam, awayTeam)), anotherFixture.date)
                    .season(s => s)
                    .withTeam(homeTeam).withTeam(awayTeam)
                    .build(),
                account,
                [homeTeam, awayTeam]);

            reportedError.verifyNoError();
            const awayCell = context.container.querySelector('td:nth-child(5)')!;
            expect(awayCell.textContent).toContain(`🚫 AWAY (Already playing same leg on ${renderDate(anotherFixture.date)})`);
        });

        it('renders selectable away team when away team is playing a qualifier on another date', async () => {
            const fixture: IDatedDivisionFixtureDto = divisionFixtureBuilder(date)
                .bye(homeTeam)
                .build();
            const anotherFixture: IDatedDivisionFixtureDto = divisionFixtureBuilder('2023-05-13T00:00:00')
                .playing(homeTeam, awayTeam)
                .knockout()
                .build();
            await renderComponent(
                {fixture, date: fixture.date, readOnly: false, beforeReloadDivision, onUpdateFixtures},
                divisionDataBuilder(division)
                    .withFixtureDate(d => d.withFixture(f => f.bye(homeTeam)), fixture.date)
                    .withFixtureDate(d => d.withFixture(f => f.playing(homeTeam, awayTeam).knockout()), anotherFixture.date)
                    .season(s => s)
                    .withTeam(homeTeam).withTeam(awayTeam)
                    .build(),
                account,
                [homeTeam, awayTeam]);

            reportedError.verifyNoError();
            const awayCell = context.container.querySelector('td:nth-child(5)')!;
            expect(awayCell.textContent).toEqual(`AWAY`);
        });

        it('renders selectable away team with same address (qualifier)', async () => {
            const fixture: IDatedDivisionFixtureDto = divisionFixtureBuilder(date)
                .bye(homeTeam)
                .knockout()
                .build();
            const anotherTeamAtHomeAddress: TeamDto = teamBuilder('ANOTHER TEAM')
                .address('HOME ADDRESS')
                .forSeason(season, division)
                .build();
            await renderComponent(
                {fixture, date, readOnly: false, beforeReloadDivision, onUpdateFixtures},
                divisionDataBuilder(division)
                    .withFixtureDate(d => d.withFixture(f => f.bye(homeTeam).knockout()), date)
                    .season(s => s, 'SEASON', season.id)
                    .withTeam(homeTeam).withTeam(awayTeam).withTeam(anotherTeamAtHomeAddress)
                    .build(),
                account,
                [homeTeam, awayTeam, anotherTeamAtHomeAddress]);

            reportedError.verifyNoError();
            const awayCell = context.container.querySelector('td:nth-child(5)')!;
            expect(awayCell.textContent).toEqual(`AWAYANOTHER TEAM`);
        });

        it('does not render team with deleted team season', async () => {
            const deletedAwayTeam: TeamDto = teamBuilder('DELETED AWAY')
                .forSeason(season, division, undefined, true)
                .build();
            const fixture: IDatedDivisionFixtureDto = divisionFixtureBuilder(date)
                .bye(homeTeam)
                .knockout()
                .build();
            await renderComponent(
                {fixture, date, readOnly: false, beforeReloadDivision, onUpdateFixtures},
                divisionDataBuilder(division)
                    .withFixtureDate(d => d.withFixture(f => f.bye(homeTeam).knockout()), date)
                    .season(s => s)
                    .withTeam(homeTeam).withTeam(deletedAwayTeam)
                    .build(),
                account,
                [homeTeam, deletedAwayTeam]);

            reportedError.verifyNoError();
            const awayCell = context.container.querySelector('td:nth-child(5)')!;
            expect(awayCell.textContent).not.toContain(`DELETED AWAY`);
        });

        it('renders unselectable away team playing elsewhere (qualifier)', async () => {
            const fixture: IDatedDivisionFixtureDto = divisionFixtureBuilder(date)
                .bye(homeTeam)
                .knockout()
                .build();
            await renderComponent(
                {fixture, date, readOnly: false, beforeReloadDivision, onUpdateFixtures},
                divisionDataBuilder(division)
                    .withFixtureDate(d => d
                        .withFixture(f => f.bye(homeTeam).knockout())
                        .withFixture(f => f.playing(homeTeam, awayTeam).knockout()), date)
                    .season(s => s, 'SEASON', season.id)
                    .withTeam(homeTeam).withTeam(awayTeam)
                    .build(),
                account,
                [homeTeam, awayTeam]);

            reportedError.verifyNoError();
            const awayCell = context.container.querySelector('td:nth-child(5)')!;
            expect(awayCell.textContent).toContain('🚫 AWAY (Already playing against HOME)');
        });

        it('renders selectable home team when no other fixtures for date', async () => {
            const fixture: IDatedDivisionFixtureDto = divisionFixtureBuilder(date)
                .bye(homeTeam)
                .knockout()
                .build();
            await renderComponent(
                {fixture, date, readOnly: false, beforeReloadDivision, onUpdateFixtures},
                divisionDataBuilder(division)
                    .season(s => s)
                    .withTeam(homeTeam).withTeam(awayTeam)
                    .build(),
                account,
                [homeTeam, awayTeam]);

            reportedError.verifyNoError();
            const awayCell = context.container.querySelector('td:nth-child(5)')!;
            expect(awayCell.textContent).not.toContain('🚫');
        });

        it('renders no away selection when home address is in use', async () => {
            const otherFixtureId = createTemporaryId();
            const fixture: IDatedDivisionFixtureDto = divisionFixtureBuilder(date)
                .bye(homeTeam)
                .knockout()
                .withOtherFixtureUsingUsingAddress('HOME - SAME ADDRESS', otherFixtureId)
                .build();
            await renderComponent(
                {fixture, date, readOnly: false, beforeReloadDivision, onUpdateFixtures},
                divisionDataBuilder(division)
                    .season(s => s)
                    .withTeam(homeTeam).withTeam(awayTeam)
                    .build(),
                account,
                [homeTeam, awayTeam]);

            reportedError.verifyNoError();
            const awayCell = context.container.querySelector('td:nth-child(5)')!;
            expect(awayCell.querySelector('.dropdown-menu')).toBeFalsy();
            expect(awayCell.textContent).toContain('🚫HOME - SAME ADDRESS vs AWAY using this venue');
            const linkToOtherFixture = awayCell.querySelector('a')!;
            expect(linkToOtherFixture.href).toEqual(`http://localhost/score/${otherFixtureId}`);
        });

        it('renders unselectable away team played fixture previously (qualifier)', async () => {
            const fixture: IDatedDivisionFixtureDto = divisionFixtureBuilder(date)
                .bye(homeTeam)
                .knockout()
                .build();
            const anotherFixture: IDatedDivisionFixtureDto = divisionFixtureBuilder('2023-05-13T00:00:00')
                .playing(homeTeam, awayTeam)
                .knockout()
                .build();
            await renderComponent(
                {fixture, date: fixture.date, readOnly: false, beforeReloadDivision, onUpdateFixtures},
                divisionDataBuilder(division)
                    .withFixtureDate(d => d.withFixture(f => f.bye(homeTeam).knockout()), fixture.date)
                    .withFixtureDate(d => d.withFixture(f => f.playing(homeTeam, awayTeam).knockout()), anotherFixture.date)
                    .season(s => s, 'SEASON', season.id)
                    .withTeam(homeTeam).withTeam(awayTeam)
                    .build(),
                account,
                [homeTeam, awayTeam]);

            reportedError.verifyNoError();
            const awayCell = context.container.querySelector('td:nth-child(5)')!;
            expect(awayCell.textContent).toEqual('AWAY');
        });

        it('can change away team', async () => {
            const fixture: IDatedDivisionFixtureDto = divisionFixtureBuilder(date)
                .bye(homeTeam)
                .build();
            await renderComponent(
                {fixture, date, readOnly: false, beforeReloadDivision, onUpdateFixtures},
                divisionDataBuilder(division)
                    .withFixtureDate(d => d.withFixture(f => f.bye(homeTeam)), date)
                    .season(s => s)
                    .withTeam(homeTeam).withTeam(awayTeam).withTeam(anotherTeam)
                    .build(),
                account,
                [homeTeam, awayTeam, anotherTeam]);
            const awayCell = context.container.querySelector('td:nth-child(5)')!;

            await doSelectOption(awayCell.querySelector('.dropdown-menu'), 'ANOTHER TEAM');

            reportedError.verifyNoError();
            expect(updatedFixtures).not.toBeNull();
            expect(updatedFixtures!([{date, fixtures: [fixture]}])).toEqual([{
                date,
                fixtures: [{
                    id: fixture.id,
                    date,
                    homeTeam,
                    awayTeam: {
                        id: anotherTeam.id,
                        name: anotherTeam.name,
                    },
                    originalAwayTeamId: 'unset',
                    fixturesUsingAddress: [],
                }]
            }]);
        });

        it('can change away team for qualifiers', async () => {
            const fixture: IDatedDivisionFixtureDto = divisionFixtureBuilder(date)
                .bye(homeTeam)
                .build();
            await renderComponent(
                {fixture, date, readOnly: false, beforeReloadDivision, onUpdateFixtures},
                divisionDataBuilder(division)
                    .withFixtureDate(d => d.withFixture(f => f.bye(homeTeam)).knockout(), date)
                    .season(s => s)
                    .withTeam(homeTeam).withTeam(awayTeam).withTeam(anotherTeam)
                    .build(),
                account,
                [homeTeam, awayTeam, anotherTeam]);
            const awayCell = context.container.querySelector('td:nth-child(5)')!;

            await doSelectOption(awayCell.querySelector('.dropdown-menu'), 'ANOTHER TEAM');

            reportedError.verifyNoError();
            expect(updatedFixtures).not.toBeNull();
            expect(updatedFixtures!([{date, fixtures: [fixture], isKnockout: true}])).toEqual([{
                date,
                fixtures: [{
                    date,
                    homeTeam,
                    awayTeam: {
                        id: anotherTeam.id,
                        name: anotherTeam.name,
                    },
                    id: fixture.id,
                    originalAwayTeamId: 'unset',
                    fixturesUsingAddress: [],
                }],
                isKnockout: true,
            }]);
        });

        it('can save league fixture change', async () => {
            const fixture: IDatedDivisionFixtureDto = divisionFixtureBuilder(date)
                .playing(homeTeam, awayTeam)
                .originalAwayTeamId('unset')
                .build();
            await renderComponent(
                {fixture, date, readOnly: false, beforeReloadDivision, onUpdateFixtures},
                divisionDataBuilder(division)
                    .withFixtureDate(d => d.withFixture(f => f.playing(homeTeam, awayTeam).originalAwayTeamId('unset')), date)
                    .season(s => s)
                    .withTeam(homeTeam).withTeam(awayTeam).withTeam(anotherTeam)
                    .build(),
                account,
                [homeTeam, awayTeam, anotherTeam]);
            const saveCell = context.container.querySelector('td:nth-child(6)')!;
            expect(saveCell.textContent).toContain('💾');

            await doClick(findButton(saveCell, '💾'));

            reportedError.verifyNoError();
            expect(savedFixture).not.toBeNull();
            expect(beforeReloadDivisionCalled).toEqual(true);
            expect(divisionReloaded).toEqual(true);
        });

        it('can save qualifier change', async () => {
            const fixture: IDatedDivisionFixtureDto = divisionFixtureBuilder(date)
                .playing(homeTeam, awayTeam)
                .originalAwayTeamId('unset')
                .knockout()
                .build();
            await renderComponent(
                {fixture, date, readOnly: false, beforeReloadDivision, onUpdateFixtures},
                divisionDataBuilder(division)
                    .withFixtureDate(d => d.withFixture(f => f.playing(homeTeam, awayTeam).originalAwayTeamId('unset').knockout()), date)
                    .season(s => s)
                    .withTeam(homeTeam).withTeam(awayTeam).withTeam(anotherTeam)
                    .build(),
                account,
                [homeTeam, awayTeam, anotherTeam]);
            const saveCell = context.container.querySelector('td:nth-child(6)')!;
            expect(saveCell.textContent).toContain('💾');

            await doClick(findButton(saveCell, '💾'));

            reportedError.verifyNoError();
            expect(savedFixture).not.toBeNull();
            expect(beforeReloadDivisionCalled).toEqual(true);
            expect(divisionReloaded).toEqual(true);
        });

        it('handles error during save', async () => {
            const fixture: IDatedDivisionFixtureDto = divisionFixtureBuilder(date)
                .playing(homeTeam, awayTeam)
                .knockout()
                .originalAwayTeamId('unset')
                .build();
            await renderComponent(
                {fixture, date, readOnly: false, beforeReloadDivision, onUpdateFixtures},
                divisionDataBuilder(division)
                    .withFixtureDate(d => d.withFixture(f => f.playing(homeTeam, awayTeam).knockout().originalAwayTeamId('unset')), date)
                    .season(s => s)
                    .withTeam(homeTeam).withTeam(awayTeam).withTeam(anotherTeam)
                    .build(),
                account,
                [homeTeam, awayTeam, anotherTeam]);
            const saveCell = context.container.querySelector('td:nth-child(6)')!;
            expect(saveCell.textContent).toContain('💾');
            apiResponse = {success: false, errors: ['SOME ERROR']};

            await doClick(findButton(saveCell, '💾'));

            reportedError.verifyNoError();
            expect(savedFixture).not.toBeNull();
            expect(beforeReloadDivisionCalled).toEqual(false);
            expect(divisionReloaded).toEqual(false);
            expect(context.container.textContent).toContain('Could not save fixture details');
            expect(context.container.textContent).toContain('SOME ERROR');
        });

        it('can delete league fixture', async () => {
            await renderComponent(
                {fixture, date, readOnly: false, beforeReloadDivision, onUpdateFixtures},
                divisionDataBuilder(division)
                    .withFixtureDate(d => d.withFixture(f => f.playing(homeTeam, awayTeam)), date)
                    .season(s => s)
                    .withTeam(homeTeam).withTeam(awayTeam).withTeam(anotherTeam)
                    .build(),
                account,
                [homeTeam, awayTeam, anotherTeam]);
            const saveCell = context.container.querySelector('td:nth-child(6)')!;
            expect(saveCell.textContent).toContain('🗑');
            context.prompts.respondToConfirm('Are you sure you want to delete this fixture?\n\nHOME vs AWAY', true);

            await doClick(findButton(saveCell, '🗑'));

            reportedError.verifyNoError();
            context.prompts.confirmWasShown('Are you sure you want to delete this fixture?\n\nHOME vs AWAY');
            expect(deletedFixture).toEqual(fixture.id);
            expect(beforeReloadDivisionCalled).toEqual(true);
            expect(divisionReloaded).toEqual(true);
        });

        it('cannot delete fixture if readonly', async () => {
            await renderComponent(
                {fixture, date, readOnly: true, beforeReloadDivision, onUpdateFixtures},
                divisionDataBuilder(division)
                    .withFixtureDate(d => d.withFixture(f => f.playing(homeTeam, awayTeam)), date)
                    .season(s => s)
                    .withTeam(homeTeam).withTeam(awayTeam).withTeam(anotherTeam)
                    .build(),
                account,
                [homeTeam, awayTeam, anotherTeam]);
            const saveCell = context.container.querySelector('td:nth-child(6)')!;
            expect(saveCell.textContent).toContain('🗑');

            const button = findButton(saveCell, '🗑');

            expect(button.disabled).toEqual(true);
        });

        it('does not delete league fixture', async () => {
            await renderComponent(
                {fixture, date, readOnly: false, beforeReloadDivision, onUpdateFixtures},
                divisionDataBuilder(division)
                    .withFixtureDate(d => d.withFixture(f => f.playing(homeTeam, awayTeam)), date)
                    .season(s => s)
                    .withTeam(homeTeam).withTeam(awayTeam).withTeam(anotherTeam)
                    .build(),
                account,
                [homeTeam, awayTeam, anotherTeam]);
            const saveCell = context.container.querySelector('td:nth-child(6)')!;
            expect(saveCell.textContent).toContain('🗑');
            context.prompts.respondToConfirm('Are you sure you want to delete this fixture?\n\nHOME vs AWAY', false);

            await doClick(findButton(saveCell, '🗑'));

            reportedError.verifyNoError();
            expect(deletedFixture).toBeNull();
            expect(beforeReloadDivisionCalled).toEqual(false);
            expect(divisionReloaded).toEqual(false);
        });

        it('handles error during delete', async () => {
            await renderComponent(
                {fixture, date, readOnly: false, beforeReloadDivision, onUpdateFixtures},
                divisionDataBuilder(division)
                    .withFixtureDate(d => d.withFixture(f => f.playing(homeTeam, awayTeam)), date)
                    .season(s => s)
                    .withTeam(homeTeam).withTeam(awayTeam).withTeam(anotherTeam)
                    .build(),
                account,
                [homeTeam, awayTeam, anotherTeam]);
            const saveCell = context.container.querySelector('td:nth-child(6)')!;
            expect(saveCell.textContent).toContain('🗑');
            context.prompts.respondToConfirm('Are you sure you want to delete this fixture?\n\nHOME vs AWAY', true);
            apiResponse = {success: false, errors: ['SOME ERROR']};

            await doClick(findButton(saveCell, '🗑'));

            reportedError.verifyNoError();
            expect(deletedFixture).toEqual(fixture.id);
            expect(beforeReloadDivisionCalled).toEqual(false);
            expect(divisionReloaded).toEqual(false);
            expect(context.container.textContent).toContain('Could not save fixture details');
            expect(context.container.textContent).toContain('SOME ERROR');
        });

        it('can close error dialog from deletion failure', async () => {
            await renderComponent(
                {fixture, date, readOnly: false, beforeReloadDivision, onUpdateFixtures},
                divisionDataBuilder(division)
                    .withFixtureDate(d => d.withFixture(f => f.playing(homeTeam, awayTeam)), date)
                    .season(s => s)
                    .withTeam(homeTeam).withTeam(awayTeam).withTeam(anotherTeam)
                    .build(),
                account,
                [homeTeam, awayTeam, anotherTeam]);
            const saveCell = context.container.querySelector('td:nth-child(6)')!;
            expect(saveCell.textContent).toContain('🗑');
            context.prompts.respondToConfirm('Are you sure you want to delete this fixture?\n\nHOME vs AWAY', true);
            apiResponse = {success: false, errors: ['SOME ERROR']};
            await doClick(findButton(saveCell, '🗑'));
            expect(context.container.textContent).toContain('Could not save fixture details');

            await doClick(findButton(context.container, 'Close'));

            expect(context.container.textContent).not.toContain('Could not save fixture details');
        });

        it('can delete qualifier', async () => {
            const fixture: IDatedDivisionFixtureDto = divisionFixtureBuilder(date)
                .playing(homeTeam, awayTeam)
                .knockout()
                .build();
            await renderComponent(
                {fixture, date, readOnly: false, beforeReloadDivision, onUpdateFixtures},
                divisionDataBuilder(division)
                    .withFixtureDate(d => d.withFixture(f => f.playing(homeTeam, awayTeam).knockout()), date)
                    .season(s => s)
                    .withTeam(homeTeam).withTeam(awayTeam).withTeam(anotherTeam)
                    .build(),
                account,
                [homeTeam, awayTeam, anotherTeam]);
            const saveCell = context.container.querySelector('td:nth-child(6)')!;
            expect(saveCell.textContent).toContain('🗑');
            context.prompts.respondToConfirm('Are you sure you want to delete this fixture?\n\nHOME vs AWAY', true);

            await doClick(findButton(saveCell, '🗑'));

            reportedError.verifyNoError();
            context.prompts.confirmWasShown('Are you sure you want to delete this fixture?\n\nHOME vs AWAY');
            expect(deletedFixture).toEqual(fixture.id);
            expect(beforeReloadDivisionCalled).toEqual(true);
            expect(divisionReloaded).toEqual(true);
        });

        it('cannot save when readonly', async () => {
            const fixture: IDatedDivisionFixtureDto = divisionFixtureBuilder(date)
                .playing(homeTeam, awayTeam)
                .originalAwayTeamId('unset')
                .build();
            await renderComponent(
                {fixture, date, readOnly: true, beforeReloadDivision, onUpdateFixtures},
                divisionDataBuilder(division)
                    .withFixtureDate(d => d.withFixture(f => f.playing(homeTeam, awayTeam).originalAwayTeamId('unset')), date)
                    .season(s => s)
                    .withTeam(homeTeam).withTeam(awayTeam).withTeam(anotherTeam)
                    .build(),
                account,
                [homeTeam, awayTeam, anotherTeam]);

            const saveCell = context.container.querySelector('td:nth-child(6)');
            const deleteButton = findButton(saveCell, '💾');
            expect(deleteButton.disabled).toEqual(true);
        });

        it('cannot delete when readonly', async () => {
            await renderComponent(
                {fixture, date, readOnly: true, beforeReloadDivision, onUpdateFixtures},
                divisionDataBuilder(division)
                    .withFixtureDate(d => d.withFixture(f => f.playing(homeTeam, awayTeam)), date)
                    .season(s => s)
                    .withTeam(homeTeam).withTeam(awayTeam).withTeam(anotherTeam)
                    .build(),
                account,
                [homeTeam, awayTeam, anotherTeam]);

            const saveCell = context.container.querySelector('td:nth-child(6)');
            const deleteButton = findButton(saveCell, '🗑');
            expect(deleteButton.disabled).toEqual(true);
        });

        it('cannot change away team when readonly', async () => {
            const fixture: IDatedDivisionFixtureDto = divisionFixtureBuilder(date)
                .bye(homeTeam)
                .build();
            await renderComponent(
                {fixture, date, readOnly: true, beforeReloadDivision, onUpdateFixtures},
                divisionDataBuilder(division)
                    .withFixtureDate(d => d.withFixture(f => f.bye(homeTeam)), date)
                    .season(s => s)
                    .withTeam(homeTeam).withTeam(awayTeam).withTeam(anotherTeam)
                    .build(),
                account,
                [homeTeam, awayTeam, anotherTeam]);
            const awayCell = context.container.querySelector('td:nth-child(5)')!;

            await doSelectOption(awayCell.querySelector('.dropdown-menu'), 'ANOTHER TEAM');

            reportedError.verifyNoError();
            expect(updatedFixtures).toBeNull();
        });

        it('does not shade non-favourite team when an admin', async () => {
            const fixture: IDatedDivisionFixtureDto = divisionFixtureBuilder(date)
                .bye(teamBuilder('HOME').build())
                .build();
            await renderComponent(
                {fixture, date, readOnly: false, beforeReloadDivision, onUpdateFixtures},
                divisionDataBuilder(division)
                    .withFixtureDate(d => d.withFixture(f => f.bye(teamBuilder('HOME').build())), date)
                    .season(s => s)
                    .withTeam(homeTeam)
                    .favouritesEnabled(true)
                    .build(),
                account,
                [homeTeam],
                {
                    favouriteTeamIds: ['1234'],
                });

            reportedError.verifyNoError();
            const row = context.container.querySelector('tr')!;
            expect(row.className).not.toContain('opacity-25');
        });
    });
});