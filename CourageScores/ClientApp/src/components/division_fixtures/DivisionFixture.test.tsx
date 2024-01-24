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
import {DataMap, toMap} from "../../helpers/collections";
import React from "react";
import {DivisionFixture, IDivisionFixtureProps} from "./DivisionFixture";
import {DivisionDataContainer, IDivisionDataContainerProps} from "../DivisionDataContainer";
import {IGameApi} from "../../api/game";
import {IClientActionResultDto} from "../../interfaces/IClientActionResultDto";
import {IEditGameDto} from "../../interfaces/serverSide/Game/IEditGameDto";
import {IGameDto} from "../../interfaces/serverSide/Game/IGameDto";
import {IUserDto} from "../../interfaces/serverSide/Identity/IUserDto";
import {ITeamDto} from "../../interfaces/serverSide/Team/ITeamDto";
import {IDivisionFixtureDateDto} from "../../interfaces/serverSide/Division/IDivisionFixtureDateDto";
import {ISeasonDto} from "../../interfaces/serverSide/Season/ISeasonDto";
import {IDivisionDto} from "../../interfaces/serverSide/IDivisionDto";
import {IDatedDivisionFixtureDto} from "../../interfaces/IDatedDivisionFixtureDto";
import {IEditableDivisionFixtureDateDto} from "../../interfaces/IEditableDivisionFixtureDateDto";
import {
    divisionBuilder,
    divisionDataBuilder,
    divisionFixtureBuilder,
    IDivisionFixtureDateBuilder
} from "../../helpers/builders/divisions";
import {teamBuilder} from "../../helpers/builders/teams";
import {seasonBuilder} from "../../helpers/builders/seasons";

describe('DivisionFixture', () => {
    let context: TestContext;
    let reportedError: ErrorState;
    let divisionReloaded: boolean;
    let updatedFixtures: (x: IEditableDivisionFixtureDateDto[]) => IDivisionFixtureDateDto[];
    let beforeReloadDivisionCalled: boolean;
    let savedFixture: {fixture: IEditGameDto, lastUpdated?: string};
    let deletedFixture: string;
    let apiResponse: IClientActionResultDto<IGameDto>;

    const gameApi = api<IGameApi>({
        update: async (fixture: IEditGameDto, lastUpdated?: string) => {
            savedFixture = {fixture, lastUpdated};
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

    async function onUpdateFixtures(data: (x: IEditableDivisionFixtureDateDto[]) => IDivisionFixtureDateDto[]): Promise<IDivisionFixtureDateDto[]> {
        updatedFixtures = data;
        return [];
    }

    afterEach(() => {
        cleanUp(context);
    });

    beforeEach(() => {
        reportedError = new ErrorState();
        divisionReloaded = false;
        updatedFixtures = null;
        beforeReloadDivisionCalled = null;
        savedFixture = null;
        deletedFixture = null;
        apiResponse = null;
    });

    async function renderComponent(props: IDivisionFixtureProps, divisionData: IDivisionDataContainerProps, account: IUserDto, teams: DataMap<ITeamDto>) {
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
            null,
            null,
            'tbody');
    }

    describe('when logged out', () => {
        const season: ISeasonDto = seasonBuilder('SEASON').build();
        const division: IDivisionDto = divisionBuilder('DIVISION').build();
        const team: ITeamDto = teamBuilder('TEAM').build();
        const account: IUserDto = null;

        it('renders unplayed fixture', async () => {
            const date = '2023-05-06T00:00:00';
            const fixture: IDatedDivisionFixtureDto = divisionFixtureBuilder(date)
                .playing('HOME', 'AWAY')
                .build();
            await renderComponent(
                {fixture, date, readOnly: false, beforeReloadDivision, onUpdateFixtures},
                divisionDataBuilder(division)
                    .withFixtureDate((d: IDivisionFixtureDateBuilder) => d.withFixture(fixture), date)
                    .season(season)
                    .withTeam(team)
                    .build(),
                account,
                toMap([team]));

            expect(reportedError.hasError()).toEqual(false);
            const cells = Array.from(context.container.querySelectorAll('td'));
            const cellText = cells.map(td => td.textContent);
            expect(cellText).toEqual(['HOME', '', 'vs', '', 'AWAY']);
            const linkToHome = cells[0].querySelector('a');
            expect(linkToHome.href).toEqual(`http://localhost/score/${fixture.id}`);
            const linkToAway = cells[4].querySelector('a');
            expect(linkToAway.href).toEqual(`http://localhost/score/${fixture.id}`);
        });

        it('renders postponed fixture', async () => {
            const date = '2023-05-06T00:00:00';
            const fixture: IDatedDivisionFixtureDto = divisionFixtureBuilder(date)
                .postponed()
                .playing('HOME', 'AWAY')
                .build();
            await renderComponent(
                {fixture, date, readOnly: false, beforeReloadDivision, onUpdateFixtures},
                divisionDataBuilder(division)
                    .withFixtureDate((d: IDivisionFixtureDateBuilder) => d.withFixture(fixture), date)
                    .season(season)
                    .withTeam(team)
                    .build(),
                account,
                toMap([team]));

            expect(reportedError.hasError()).toEqual(false);
            const cells = Array.from(context.container.querySelectorAll('td'));
            const cellText = cells.map(td => td.textContent);
            expect(cellText).toEqual(['HOME', 'P', 'vs', 'P', 'AWAY']);
            const linkToHome = cells[0].querySelector('a');
            expect(linkToHome.href).toEqual(`http://localhost/score/${fixture.id}`);
            const linkToAway = cells[4].querySelector('a');
            expect(linkToAway.href).toEqual(`http://localhost/score/${fixture.id}`);
        });

        it('renders qualifier fixture', async () => {
            const date = '2023-05-06T00:00:00';
            const fixture: IDatedDivisionFixtureDto = divisionFixtureBuilder(date)
                .playing('HOME', 'AWAY')
                .knockout()
                .build();
            await renderComponent(
                {fixture, date, readOnly: false, beforeReloadDivision, onUpdateFixtures},
                divisionDataBuilder(division)
                    .withFixtureDate((d: IDivisionFixtureDateBuilder) => d.withFixture(fixture), date)
                    .season(season)
                    .withTeam(team)
                    .build(),
                account,
                toMap([team]));

            expect(reportedError.hasError()).toEqual(false);
            const cells = Array.from(context.container.querySelectorAll('td'));
            const cellText = cells.map(td => td.textContent);
            expect(cellText).toEqual(['HOME', '', 'vs', '', 'AWAY']);
            const linkToHome = cells[0].querySelector('a');
            expect(linkToHome.href).toEqual(`http://localhost/score/${fixture.id}`);
            const linkToAway = cells[4].querySelector('a');
            expect(linkToAway.href).toEqual(`http://localhost/score/${fixture.id}`);
        });

        it('renders bye', async () => {
            const date = '2023-05-06T00:00:00';
            const fixture: IDatedDivisionFixtureDto = divisionFixtureBuilder(date)
                .bye('HOME')
                .build();
            await renderComponent(
                {fixture, date, readOnly: false, beforeReloadDivision, onUpdateFixtures},
                divisionDataBuilder(division)
                    .withFixtureDate((d: IDivisionFixtureDateBuilder) => d.withFixture(fixture), date)
                    .season(season)
                    .withTeam(team)
                    .build(),
                account,
                toMap([team]));

            expect(reportedError.hasError()).toEqual(false);
            const cells = Array.from(context.container.querySelectorAll('td'));
            const cellText = cells.map(td => td.textContent);
            expect(cellText).toEqual(['HOME', '', 'vs', '', 'Bye']);
            const linkToHome = cells[0].querySelector('a');
            expect(linkToHome.href).toEqual(`http://localhost/division/${division.name}/team:${fixture.homeTeam.name}/${season.name}`);
            const linkToAway = cells[4].querySelector('a');
            expect(linkToAway).toBeFalsy();
        });
    });

    describe('when logged in', () => {
        const season: ISeasonDto = seasonBuilder('SEASON').build();
        const division: IDivisionDto = divisionBuilder('DIVISION').build();
        const homeTeam: ITeamDto = teamBuilder('HOME')
            .address('HOME ADDRESS')
            .forSeason(season, division)
            .build();
        const awayTeam: ITeamDto = teamBuilder('AWAY')
            .address('AWAY ADDRESS')
            .forSeason(season, division)
            .build();
        const account: IUserDto = {
            emailAddress: '',
            name: '',
            givenName: '',
            access: {
                manageGames: true,
            }
        };

        it('renders unplayed fixture', async () => {
            const date = '2023-05-06T00:00:00';
            const fixture: IDatedDivisionFixtureDto = divisionFixtureBuilder(date)
                .playing(homeTeam, awayTeam)
                .build();
            await renderComponent(
                {fixture, date, readOnly: false, beforeReloadDivision, onUpdateFixtures},
                divisionDataBuilder(division)
                    .withFixtureDate((d: IDivisionFixtureDateBuilder) => d.withFixture(fixture), date)
                    .season(season)
                    .withTeam(homeTeam).withTeam(awayTeam)
                    .build(),
                account,
                toMap([homeTeam, awayTeam]));

            expect(reportedError.hasError()).toEqual(false);
            const cells = Array.from(context.container.querySelectorAll('td'));
            const cellText = cells.map(td => td.textContent);
            expect(cellText).toEqual(['HOME', '', 'vs', '', 'AWAYAWAY', '🗑']);
            const linkToHome = cells[0].querySelector('a');
            expect(linkToHome.href).toEqual(`http://localhost/score/${fixture.id}`);
        });

        it('renders postponed fixture', async () => {
            const date = '2023-05-06T00:00:00';
            const fixture: IDatedDivisionFixtureDto = divisionFixtureBuilder(date)
                .playing(homeTeam, awayTeam)
                .postponed()
                .build();
            await renderComponent(
                {fixture, date, readOnly: false, beforeReloadDivision, onUpdateFixtures},
                divisionDataBuilder(division)
                    .withFixtureDate((d: IDivisionFixtureDateBuilder) => d.withFixture(fixture), date)
                    .season(season)
                    .withTeam(homeTeam).withTeam(awayTeam)
                    .build(),
                account,
                toMap([homeTeam, awayTeam]));

            expect(reportedError.hasError()).toEqual(false);
            const cells = Array.from(context.container.querySelectorAll('td'));
            const cellText = cells.map(td => td.textContent);
            expect(cellText).toEqual(['HOME', 'P', 'vs', 'P', 'AWAYAWAY', '🗑']);
            const linkToHome = cells[0].querySelector('a');
            expect(linkToHome.href).toEqual(`http://localhost/score/${fixture.id}`);
        });

        it('renders qualifier fixture', async () => {
            const date = '2023-05-06T00:00:00';
            const fixture: IDatedDivisionFixtureDto = divisionFixtureBuilder(date)
                .playing(homeTeam, awayTeam)
                .knockout()
                .build();
            await renderComponent(
                {fixture, date, readOnly: false, beforeReloadDivision, onUpdateFixtures},
                divisionDataBuilder(division)
                    .withFixtureDate((d: IDivisionFixtureDateBuilder) => d.withFixture(fixture), date)
                    .season(season)
                    .withTeam(homeTeam).withTeam(awayTeam)
                    .build(),
                account,
                toMap([homeTeam, awayTeam]));

            expect(reportedError.hasError()).toEqual(false);
            const cells = Array.from(context.container.querySelectorAll('td'));
            const cellText = cells.map(td => td.textContent);
            expect(cellText).toEqual(['HOME', '', 'vs', '', 'AWAYAWAY', '🗑']);
            const linkToHome = cells[0].querySelector('a');
            expect(linkToHome.href).toEqual(`http://localhost/score/${fixture.id}`);
        });

        it('renders bye', async () => {
            const date = '2023-05-06T00:00:00';
            const fixture: IDatedDivisionFixtureDto = divisionFixtureBuilder(date)
                .bye(homeTeam)
                .build();
            await renderComponent(
                {fixture, date, readOnly: false, beforeReloadDivision, onUpdateFixtures},
                divisionDataBuilder(division)
                    .withFixtureDate((d: IDivisionFixtureDateBuilder) => d.withFixture(fixture), date)
                    .season(season)
                    .withTeam(homeTeam).withTeam(awayTeam)
                    .build(),
                account,
                toMap([homeTeam, awayTeam]));

            expect(reportedError.hasError()).toEqual(false);
            const cells = Array.from(context.container.querySelectorAll('td'));
            const cellText = cells.map(td => td.textContent);
            expect(cellText).toEqual(['HOME', '', 'vs', '', 'AWAY', '']);
            const linkToHome = cells[0].querySelector('a');
            expect(linkToHome.href).toEqual(`http://localhost/division/${division.name}/team:${fixture.homeTeam.name}/${season.name}`);
        });

        it('renders selectable away team with same address (league fixture)', async () => {
            const date = '2023-05-06T00:00:00';
            const anotherTeamAtHomeAddress: ITeamDto = teamBuilder('ANOTHER TEAM')
                .address('HOME ADDRESS')
                .build();
            const fixture: IDatedDivisionFixtureDto = divisionFixtureBuilder(date)
                .bye(homeTeam)
                .build();
            await renderComponent(
                {fixture, date, readOnly: false, beforeReloadDivision, onUpdateFixtures},
                divisionDataBuilder(division)
                    .withFixtureDate((d: IDivisionFixtureDateBuilder) => d.withFixture(fixture), date)
                    .season(season)
                    .withTeam(homeTeam).withTeam(awayTeam).withTeam(anotherTeamAtHomeAddress)
                    .build(),
                account,
                toMap([homeTeam, awayTeam, anotherTeamAtHomeAddress]));

            expect(reportedError.hasError()).toEqual(false);
            const awayCell = context.container.querySelector('td:nth-child(5)');
            expect(awayCell.textContent).toContain('ANOTHER TEAM');
            expect(awayCell.textContent).not.toContain('🚫');
        });

        it('renders unselectable away team playing elsewhere (league fixture)', async () => {
            const date = '2023-05-06T00:00:00';
            const fixture: IDatedDivisionFixtureDto = divisionFixtureBuilder(date)
                .bye(homeTeam)
                .build();
            const anotherFixture: IDatedDivisionFixtureDto = divisionFixtureBuilder(date)
                .playing(homeTeam, awayTeam)
                .build();
            await renderComponent(
                {fixture, date, readOnly: false, beforeReloadDivision, onUpdateFixtures},
                divisionDataBuilder(division)
                    .withFixtureDate((d: IDivisionFixtureDateBuilder) => d.withFixture(fixture).withFixture(anotherFixture), date)
                    .season(season)
                    .withTeam(homeTeam).withTeam(awayTeam)
                    .build(),
                account,
                toMap([homeTeam, awayTeam]));

            expect(reportedError.hasError()).toEqual(false);
            const awayCell = context.container.querySelector('td:nth-child(5)');
            expect(awayCell.textContent).toContain('🚫 AWAY (Already playing against HOME)');
        });

        it('renders unselectable away team played fixture previously (league fixture)', async () => {
            const fixture: IDatedDivisionFixtureDto = divisionFixtureBuilder('2023-05-06T00:00:00')
                .bye(homeTeam)
                .build();
            const anotherFixture: IDatedDivisionFixtureDto = divisionFixtureBuilder('2023-05-13T00:00:00')
                .playing(homeTeam, awayTeam)
                .build();
            await renderComponent(
                {fixture, date: fixture.date, readOnly: false, beforeReloadDivision, onUpdateFixtures},
                divisionDataBuilder(division)
                    .withFixtureDate((d: IDivisionFixtureDateBuilder) => d.withFixture(fixture), fixture.date)
                    .withFixtureDate((d: IDivisionFixtureDateBuilder) => d.withFixture(anotherFixture), anotherFixture.date)
                    .season(season)
                    .withTeam(homeTeam).withTeam(awayTeam)
                    .build(),
                account,
                toMap([homeTeam, awayTeam]));

            expect(reportedError.hasError()).toEqual(false);
            const awayCell = context.container.querySelector('td:nth-child(5)');
            expect(awayCell.textContent).toContain(`🚫 AWAY (Already playing same leg on ${renderDate(anotherFixture.date)})`);
        });

        it('renders selectable away team when away team is playing a qualifier on another date', async () => {
            const fixture: IDatedDivisionFixtureDto = divisionFixtureBuilder('2023-05-06T00:00:00')
                .bye(homeTeam)
                .build();
            const anotherFixture: IDatedDivisionFixtureDto = divisionFixtureBuilder('2023-05-13T00:00:00')
                .playing(homeTeam, awayTeam)
                .knockout()
                .build();
            await renderComponent(
                {fixture, date: fixture.date, readOnly: false, beforeReloadDivision, onUpdateFixtures},
                divisionDataBuilder(division)
                    .withFixtureDate((d: IDivisionFixtureDateBuilder) => d.withFixture(fixture), fixture.date)
                    .withFixtureDate((d: IDivisionFixtureDateBuilder) => d.withFixture(anotherFixture), anotherFixture.date)
                    .season(season)
                    .withTeam(homeTeam).withTeam(awayTeam)
                    .build(),
                account,
                toMap([homeTeam, awayTeam]));

            expect(reportedError.hasError()).toEqual(false);
            const awayCell = context.container.querySelector('td:nth-child(5)');
            expect(awayCell.textContent).toEqual(`AWAY`);
        });

        it('renders selectable away team with same address (qualifier)', async () => {
            const date = '2023-05-06T00:00:00';
            const fixture: IDatedDivisionFixtureDto = divisionFixtureBuilder(date)
                .bye(homeTeam)
                .knockout()
                .build();
            const anotherTeamAtHomeAddress: ITeamDto = teamBuilder('ANOTHER TEAM')
                .address('HOME ADDRESS')
                .forSeason(season, division)
                .build();
            await renderComponent(
                {fixture, date, readOnly: false, beforeReloadDivision, onUpdateFixtures},
                divisionDataBuilder(division)
                    .withFixtureDate((d: IDivisionFixtureDateBuilder) => d.withFixture(fixture), date)
                    .season(season)
                    .withTeam(homeTeam).withTeam(awayTeam).withTeam(anotherTeamAtHomeAddress)
                    .build(),
                account,
                toMap([homeTeam, awayTeam, anotherTeamAtHomeAddress]));

            expect(reportedError.hasError()).toEqual(false);
            const awayCell = context.container.querySelector('td:nth-child(5)');
            expect(awayCell.textContent).toEqual(`AWAYANOTHER TEAM`);
        });

        it('renders unselectable away team playing elsewhere (qualifier)', async () => {
            const date = '2023-05-06T00:00:00';
            const fixture: IDatedDivisionFixtureDto = divisionFixtureBuilder(date)
                .bye(homeTeam)
                .knockout()
                .build();
            const anotherFixture: IDatedDivisionFixtureDto = divisionFixtureBuilder(date)
                .playing(homeTeam, awayTeam)
                .knockout()
                .build();
            await renderComponent(
                {fixture, date, readOnly: false, beforeReloadDivision, onUpdateFixtures},
                divisionDataBuilder(division)
                    .withFixtureDate((d: IDivisionFixtureDateBuilder) => d.withFixture(fixture).withFixture(anotherFixture), date)
                    .season(season)
                    .withTeam(homeTeam).withTeam(awayTeam)
                    .build(),
                account,
                toMap([homeTeam, awayTeam]));

            expect(reportedError.hasError()).toEqual(false);
            const awayCell = context.container.querySelector('td:nth-child(5)');
            expect(awayCell.textContent).toContain('🚫 AWAY (Already playing against HOME)');
        });

        it('renders selectable home team when no other fixtures for date', async () => {
            const date = '2023-05-06T00:00:00';
            const fixture: IDatedDivisionFixtureDto = divisionFixtureBuilder(date)
                .bye(homeTeam)
                .knockout()
                .build();
            await renderComponent(
                {fixture, date, readOnly: false, beforeReloadDivision, onUpdateFixtures},
                divisionDataBuilder(division)
                    .season(season)
                    .withTeam(homeTeam).withTeam(awayTeam)
                    .build(),
                account,
                toMap([homeTeam, awayTeam]));

            expect(reportedError.hasError()).toEqual(false);
            const awayCell = context.container.querySelector('td:nth-child(5)');
            expect(awayCell.textContent).not.toContain('🚫');
        });

        it('renders no away selection when home address is in use', async () => {
            const date = '2023-05-06T00:00:00';
            const otherFixtureId = createTemporaryId();
            const fixture: IDatedDivisionFixtureDto = divisionFixtureBuilder(date)
                .bye(homeTeam)
                .knockout()
                .withOtherFixtureUsingUsingAddress('HOME - SAME ADDRESS', otherFixtureId)
                .build();
            await renderComponent(
                {fixture, date, readOnly: false, beforeReloadDivision, onUpdateFixtures},
                divisionDataBuilder(division)
                    .season(season)
                    .withTeam(homeTeam).withTeam(awayTeam)
                    .build(),
                account,
                toMap([homeTeam, awayTeam]));

            expect(reportedError.hasError()).toEqual(false);
            const awayCell = context.container.querySelector('td:nth-child(5)');
            expect(awayCell.querySelector('.dropdown-menu')).toBeFalsy();
            expect(awayCell.textContent).toContain('🚫 HOME - SAME ADDRESS vs AWAY using this venue');
            const linkToOtherFixture = awayCell.querySelector('a');
            expect(linkToOtherFixture.href).toEqual(`http://localhost/score/${otherFixtureId}`);
        });

        it('renders unselectable away team played fixture previously (qualifier)', async () => {
            const fixture: IDatedDivisionFixtureDto = divisionFixtureBuilder('2023-05-06T00:00:00')
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
                    .withFixtureDate((d: IDivisionFixtureDateBuilder) => d.withFixture(fixture), fixture.date)
                    .withFixtureDate((d: IDivisionFixtureDateBuilder) => d.withFixture(anotherFixture), anotherFixture.date)
                    .season(season)
                    .withTeam(homeTeam).withTeam(awayTeam)
                    .build(),
                account,
                toMap([homeTeam, awayTeam]));

            expect(reportedError.hasError()).toEqual(false);
            const awayCell = context.container.querySelector('td:nth-child(5)');
            expect(awayCell.textContent).toEqual('AWAY');
        });

        it('can change away team', async () => {
            const date = '2023-05-06T00:00:00';
            const anotherTeam: ITeamDto = teamBuilder('ANOTHER TEAM')
                .address('ANOTHER ADDRESS')
                .build();
            const fixture: IDatedDivisionFixtureDto = divisionFixtureBuilder(date)
                .bye(homeTeam)
                .build();
            await renderComponent(
                {fixture, date, readOnly: false, beforeReloadDivision, onUpdateFixtures},
                divisionDataBuilder(division)
                    .withFixtureDate((d: IDivisionFixtureDateBuilder) => d.withFixture(fixture), date)
                    .season(season)
                    .withTeam(homeTeam).withTeam(awayTeam).withTeam(anotherTeam)
                    .build(),
                account,
                toMap([homeTeam, awayTeam, anotherTeam]));
            const awayCell = context.container.querySelector('td:nth-child(5)');

            await doSelectOption(awayCell.querySelector('.dropdown-menu'), 'ANOTHER TEAM');

            expect(reportedError.hasError()).toEqual(false);
            expect(updatedFixtures).not.toBeNull();
            expect(updatedFixtures([{date, fixtures: [fixture]}])).toEqual([{
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
            const date = '2023-05-06T00:00:00';
            const anotherTeam: ITeamDto = teamBuilder('ANOTHER TEAM')
                .address('ANOTHER ADDRESS')
                .build();
            const fixture: IDatedDivisionFixtureDto = divisionFixtureBuilder(date)
                .bye(homeTeam)
                .build();
            await renderComponent(
                {fixture, date, readOnly: false, beforeReloadDivision, onUpdateFixtures},
                divisionDataBuilder(division)
                    .withFixtureDate((d: IDivisionFixtureDateBuilder) => d.withFixture(fixture).knockout(), date)
                    .season(season)
                    .withTeam(homeTeam).withTeam(awayTeam).withTeam(anotherTeam)
                    .build(),
                account,
                toMap([homeTeam, awayTeam, anotherTeam]));
            const awayCell = context.container.querySelector('td:nth-child(5)');

            await doSelectOption(awayCell.querySelector('.dropdown-menu'), 'ANOTHER TEAM');

            expect(reportedError.hasError()).toEqual(false);
            expect(updatedFixtures).not.toBeNull();
            expect(updatedFixtures([{date, fixtures: [fixture], isKnockout: true}])).toEqual([{
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
            const date = '2023-05-06T00:00:00';
            const anotherTeam: ITeamDto = teamBuilder('ANOTHER TEAM')
                .address('ANOTHER ADDRESS')
                .build();
            const fixture: IDatedDivisionFixtureDto = divisionFixtureBuilder(date)
                .playing(homeTeam, awayTeam)
                .originalAwayTeamId('unset')
                .build();
            await renderComponent(
                {fixture, date, readOnly: false, beforeReloadDivision, onUpdateFixtures},
                divisionDataBuilder(division)
                    .withFixtureDate((d: IDivisionFixtureDateBuilder) => d.withFixture(fixture), date)
                    .season(season)
                    .withTeam(homeTeam).withTeam(awayTeam).withTeam(anotherTeam)
                    .build(),
                account,
                toMap([homeTeam, awayTeam, anotherTeam]));
            const saveCell = context.container.querySelector('td:nth-child(6)');
            expect(saveCell.textContent).toContain('💾');

            await doClick(findButton(saveCell, '💾'));

            expect(reportedError.hasError()).toEqual(false);
            expect(savedFixture).not.toBeNull();
            expect(beforeReloadDivisionCalled).toEqual(true);
            expect(divisionReloaded).toEqual(true);
        });

        it('can save qualifier change', async () => {
            const date = '2023-05-06T00:00:00';
            const anotherTeam: ITeamDto = teamBuilder('ANOTHER TEAM')
                .address('ANOTHER ADDRESS')
                .build();
            const fixture: IDatedDivisionFixtureDto = divisionFixtureBuilder(date)
                .playing(homeTeam, awayTeam)
                .originalAwayTeamId('unset')
                .knockout()
                .build();
            await renderComponent(
                {fixture, date, readOnly: false, beforeReloadDivision, onUpdateFixtures},
                divisionDataBuilder(division)
                    .withFixtureDate((d: IDivisionFixtureDateBuilder) => d.withFixture(fixture), date)
                    .season(season)
                    .withTeam(homeTeam).withTeam(awayTeam).withTeam(anotherTeam)
                    .build(),
                account,
                toMap([homeTeam, awayTeam, anotherTeam]));
            const saveCell = context.container.querySelector('td:nth-child(6)');
            expect(saveCell.textContent).toContain('💾');

            await doClick(findButton(saveCell, '💾'));

            expect(reportedError.hasError()).toEqual(false);
            expect(savedFixture).not.toBeNull();
            expect(beforeReloadDivisionCalled).toEqual(true);
            expect(divisionReloaded).toEqual(true);
        });

        it('handles error during save', async () => {
            const date = '2023-05-06T00:00:00';
            const anotherTeam: ITeamDto = teamBuilder('ANOTHER TEAM')
                .address('ANOTHER ADDRESS')
                .build();
            const fixture: IDatedDivisionFixtureDto = divisionFixtureBuilder(date)
                .playing(homeTeam, awayTeam)
                .knockout()
                .originalAwayTeamId('unset')
                .build();
            await renderComponent(
                {fixture, date, readOnly: false, beforeReloadDivision, onUpdateFixtures},
                divisionDataBuilder(division)
                    .withFixtureDate((d: IDivisionFixtureDateBuilder) => d.withFixture(fixture), date)
                    .season(season)
                    .withTeam(homeTeam).withTeam(awayTeam).withTeam(anotherTeam)
                    .build(),
                account,
                toMap([homeTeam, awayTeam, anotherTeam]));
            const saveCell = context.container.querySelector('td:nth-child(6)');
            expect(saveCell.textContent).toContain('💾');
            apiResponse = {success: false, errors: ['SOME ERROR']};

            await doClick(findButton(saveCell, '💾'));

            expect(reportedError.hasError()).toEqual(false);
            expect(savedFixture).not.toBeNull();
            expect(beforeReloadDivisionCalled).toEqual(null);
            expect(divisionReloaded).toEqual(false);
            expect(context.container.textContent).toContain('Could not save fixture details');
            expect(context.container.textContent).toContain('SOME ERROR');
        });

        it('can delete league fixture', async () => {
            const date = '2023-05-06T00:00:00';
            const anotherTeam: ITeamDto = teamBuilder('ANOTHER TEAM')
                .address('ANOTHER ADDRESS')
                .build();
            const fixture: IDatedDivisionFixtureDto = divisionFixtureBuilder(date)
                .playing(homeTeam, awayTeam)
                .build();
            await renderComponent(
                {fixture, date, readOnly: false, beforeReloadDivision, onUpdateFixtures},
                divisionDataBuilder(division)
                    .withFixtureDate((d: IDivisionFixtureDateBuilder) => d.withFixture(fixture), date)
                    .season(season)
                    .withTeam(homeTeam).withTeam(awayTeam).withTeam(anotherTeam)
                    .build(),
                account,
                toMap([homeTeam, awayTeam, anotherTeam]));
            const saveCell = context.container.querySelector('td:nth-child(6)');
            expect(saveCell.textContent).toContain('🗑');
            let confirm: string;
            window.confirm = (message) => {
                confirm = message;
                return true;
            }

            await doClick(findButton(saveCell, '🗑'));

            expect(reportedError.hasError()).toEqual(false);
            expect(confirm).toEqual('Are you sure you want to delete this fixture?\n\nHOME vs AWAY');
            expect(deletedFixture).toEqual(fixture.id);
            expect(beforeReloadDivisionCalled).toEqual(true);
            expect(divisionReloaded).toEqual(true);
        });

        it('cannot delete fixture if readonly', async () => {
            const date = '2023-05-06T00:00:00';
            const anotherTeam: ITeamDto = teamBuilder('ANOTHER TEAM')
                .address('ANOTHER ADDRESS')
                .build();
            const fixture: IDatedDivisionFixtureDto = divisionFixtureBuilder(date)
                .playing(homeTeam, awayTeam)
                .build();
            await renderComponent(
                {fixture, date, readOnly: true, beforeReloadDivision, onUpdateFixtures},
                divisionDataBuilder(division)
                    .withFixtureDate((d: IDivisionFixtureDateBuilder) => d.withFixture(fixture), date)
                    .season(season)
                    .withTeam(homeTeam).withTeam(awayTeam).withTeam(anotherTeam)
                    .build(),
                account,
                toMap([homeTeam, awayTeam, anotherTeam]));
            const saveCell = context.container.querySelector('td:nth-child(6)');
            expect(saveCell.textContent).toContain('🗑');
            window.confirm = () => {
                return false;
            };

            const button = findButton(saveCell, '🗑');

            expect(button.disabled).toEqual(true);
        });

        it('does not delete league fixture', async () => {
            const date = '2023-05-06T00:00:00';
            const anotherTeam: ITeamDto = teamBuilder('ANOTHER TEAM')
                .address('ANOTHER ADDRESS')
                .build();
            const fixture: IDatedDivisionFixtureDto = divisionFixtureBuilder(date)
                .playing(homeTeam, awayTeam)
                .build();
            await renderComponent(
                {fixture, date, readOnly: false, beforeReloadDivision, onUpdateFixtures},
                divisionDataBuilder(division)
                    .withFixtureDate((d: IDivisionFixtureDateBuilder) => d.withFixture(fixture), date)
                    .season(season)
                    .withTeam(homeTeam).withTeam(awayTeam).withTeam(anotherTeam)
                    .build(),
                account,
                toMap([homeTeam, awayTeam, anotherTeam]));
            const saveCell = context.container.querySelector('td:nth-child(6)');
            expect(saveCell.textContent).toContain('🗑');
            window.confirm = () => false;

            await doClick(findButton(saveCell, '🗑'));

            expect(reportedError.hasError()).toEqual(false);
            expect(deletedFixture).toBeNull();
            expect(beforeReloadDivisionCalled).toEqual(null);
            expect(divisionReloaded).toEqual(false);
        });

        it('handles error during delete', async () => {
            const date = '2023-05-06T00:00:00';
            const anotherTeam: ITeamDto = teamBuilder('ANOTHER TEAM')
                .address('ANOTHER ADDRESS')
                .build();
            const fixture: IDatedDivisionFixtureDto = divisionFixtureBuilder(date)
                .playing(homeTeam, awayTeam)
                .build();
            await renderComponent(
                {fixture, date, readOnly: false, beforeReloadDivision, onUpdateFixtures},
                divisionDataBuilder(division)
                    .withFixtureDate((d: IDivisionFixtureDateBuilder) => d.withFixture(fixture), date)
                    .season(season)
                    .withTeam(homeTeam).withTeam(awayTeam).withTeam(anotherTeam)
                    .build(),
                account,
                toMap([homeTeam, awayTeam, anotherTeam]));
            const saveCell = context.container.querySelector('td:nth-child(6)');
            expect(saveCell.textContent).toContain('🗑');
            window.confirm = () => true;
            apiResponse = {success: false, errors: ['SOME ERROR']};

            await doClick(findButton(saveCell, '🗑'));

            expect(reportedError.hasError()).toEqual(false);
            expect(deletedFixture).toEqual(fixture.id);
            expect(beforeReloadDivisionCalled).toEqual(null);
            expect(divisionReloaded).toEqual(false);
            expect(context.container.textContent).toContain('Could not save fixture details');
            expect(context.container.textContent).toContain('SOME ERROR');
        });

        it('can close error dialog from deletion failure', async () => {
            const date = '2023-05-06T00:00:00';
            const anotherTeam: ITeamDto = teamBuilder('ANOTHER TEAM')
                .address('ANOTHER ADDRESS')
                .build();
            const fixture: IDatedDivisionFixtureDto = divisionFixtureBuilder(date)
                .playing(homeTeam, awayTeam)
                .build();
            await renderComponent(
                {fixture, date, readOnly: false, beforeReloadDivision, onUpdateFixtures},
                divisionDataBuilder(division)
                    .withFixtureDate((d: IDivisionFixtureDateBuilder) => d.withFixture(fixture), date)
                    .season(season)
                    .withTeam(homeTeam).withTeam(awayTeam).withTeam(anotherTeam)
                    .build(),
                account,
                toMap([homeTeam, awayTeam, anotherTeam]));
            const saveCell = context.container.querySelector('td:nth-child(6)');
            expect(saveCell.textContent).toContain('🗑');
            window.confirm = () => true;
            apiResponse = {success: false, errors: ['SOME ERROR']};
            await doClick(findButton(saveCell, '🗑'));
            expect(context.container.textContent).toContain('Could not save fixture details');

            await doClick(findButton(context.container, 'Close'));

            expect(context.container.textContent).not.toContain('Could not save fixture details');
        });

        it('can delete qualifier', async () => {
            const date = '2023-05-06T00:00:00';
            const anotherTeam: ITeamDto = teamBuilder('ANOTHER TEAM')
                .address('ANOTHER ADDRESS')
                .build();
            const fixture: IDatedDivisionFixtureDto = divisionFixtureBuilder(date)
                .playing(homeTeam, awayTeam)
                .knockout()
                .build();
            await renderComponent(
                {fixture, date, readOnly: false, beforeReloadDivision, onUpdateFixtures},
                divisionDataBuilder(division)
                    .withFixtureDate((d: IDivisionFixtureDateBuilder) => d.withFixture(fixture), date)
                    .season(season)
                    .withTeam(homeTeam).withTeam(awayTeam).withTeam(anotherTeam)
                    .build(),
                account,
                toMap([homeTeam, awayTeam, anotherTeam]));
            const saveCell = context.container.querySelector('td:nth-child(6)');
            expect(saveCell.textContent).toContain('🗑');
            let confirm: string;
            window.confirm = (message) => {
                confirm = message;
                return true;
            }

            await doClick(findButton(saveCell, '🗑'));

            expect(reportedError.hasError()).toEqual(false);
            expect(confirm).toEqual('Are you sure you want to delete this fixture?\n\nHOME vs AWAY');
            expect(deletedFixture).toEqual(fixture.id);
            expect(beforeReloadDivisionCalled).toEqual(true);
            expect(divisionReloaded).toEqual(true);
        });

        it('cannot save when readonly', async () => {
            const date = '2023-05-06T00:00:00';
            const anotherTeam: ITeamDto = teamBuilder('ANOTHER TEAM')
                .address('ANOTHER ADDRESS')
                .build();
            const fixture: IDatedDivisionFixtureDto = divisionFixtureBuilder(date)
                .playing(homeTeam, awayTeam)
                .originalAwayTeamId('unset')
                .build();
            await renderComponent(
                {fixture, date, readOnly: true, beforeReloadDivision, onUpdateFixtures},
                divisionDataBuilder(division)
                    .withFixtureDate((d: IDivisionFixtureDateBuilder) => d.withFixture(fixture), date)
                    .season(season)
                    .withTeam(homeTeam).withTeam(awayTeam).withTeam(anotherTeam)
                    .build(),
                account,
                toMap([homeTeam, awayTeam, anotherTeam]));

            const saveCell = context.container.querySelector('td:nth-child(6)');
            const deleteButton = findButton(saveCell, '💾');
            expect(deleteButton.disabled).toEqual(true);
        });

        it('cannot delete when readonly', async () => {
            const date = '2023-05-06T00:00:00';
            const anotherTeam: ITeamDto = teamBuilder('ANOTHER TEAM')
                .address('ANOTHER ADDRESS')
                .build();
            const fixture: IDatedDivisionFixtureDto = divisionFixtureBuilder(date)
                .playing(homeTeam, awayTeam)
                .build();
            await renderComponent(
                {fixture, date, readOnly: true, beforeReloadDivision, onUpdateFixtures},
                divisionDataBuilder(division)
                    .withFixtureDate((d: IDivisionFixtureDateBuilder) => d.withFixture(fixture), date)
                    .season(season)
                    .withTeam(homeTeam).withTeam(awayTeam).withTeam(anotherTeam)
                    .build(),
                account,
                toMap([homeTeam, awayTeam, anotherTeam]));

            const saveCell = context.container.querySelector('td:nth-child(6)');
            const deleteButton = findButton(saveCell, '🗑');
            expect(deleteButton.disabled).toEqual(true);
        });

        it('cannot change away team when readonly', async () => {
            const date = '2023-05-06T00:00:00';
            const anotherTeam: ITeamDto = teamBuilder('ANOTHER TEAM')
                .address('ANOTHER ADDRESS')
                .build();
            const fixture: IDatedDivisionFixtureDto = divisionFixtureBuilder(date)
                .bye(homeTeam)
                .build();
            await renderComponent(
                {fixture, date, readOnly: true, beforeReloadDivision, onUpdateFixtures},
                divisionDataBuilder(division)
                    .withFixtureDate((d: IDivisionFixtureDateBuilder) => d.withFixture(fixture), date)
                    .season(season)
                    .withTeam(homeTeam).withTeam(awayTeam).withTeam(anotherTeam)
                    .build(),
                account,
                toMap([homeTeam, awayTeam, anotherTeam]));
            const awayCell = context.container.querySelector('td:nth-child(5)');

            await doSelectOption(awayCell.querySelector('.dropdown-menu'), 'ANOTHER TEAM');

            expect(reportedError.hasError()).toEqual(false);
            expect(updatedFixtures).toBeNull();
        });
    });
});