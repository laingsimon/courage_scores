import {
    api,
    appProps,
    brandingProps,
    cleanUp,
    ErrorState,
    IComponent,
    iocProps,
    renderApp,
    TestContext,
    user,
} from '../../helpers/tests';
import { renderDate } from '../../helpers/rendering';
import { createTemporaryId } from '../../helpers/projection';
import { DivisionFixture, IDivisionFixtureProps } from './DivisionFixture';
import { DivisionDataContainer } from '../league/DivisionDataContainer';
import { IClientActionResultDto } from '../common/IClientActionResultDto';
import { EditGameDto } from '../../interfaces/models/dtos/Game/EditGameDto';
import { GameDto } from '../../interfaces/models/dtos/Game/GameDto';
import { UserDto } from '../../interfaces/models/dtos/Identity/UserDto';
import { TeamDto } from '../../interfaces/models/dtos/Team/TeamDto';
import { DivisionFixtureDateDto } from '../../interfaces/models/dtos/Division/DivisionFixtureDateDto';
import { SeasonDto } from '../../interfaces/models/dtos/Season/SeasonDto';
import { DivisionDto } from '../../interfaces/models/dtos/DivisionDto';
import { IEditableDivisionFixtureDateDto } from './IEditableDivisionFixtureDateDto';
import {
    divisionBuilder,
    divisionDataBuilder,
    divisionFixtureBuilder,
    IDivisionDataBuilder,
    IDivisionFixtureBuilder,
} from '../../helpers/builders/divisions';
import { teamBuilder } from '../../helpers/builders/teams';
import { ISeasonBuilder, seasonBuilder } from '../../helpers/builders/seasons';
import { IGameApi } from '../../interfaces/apis/IGameApi';
import { IPreferenceData } from '../common/PreferencesContainer';
import { IDatedDivisionFixtureDto } from './IDatedDivisionFixtureDto';
import { take } from '../../helpers/collections';
import { BuilderParam } from '../../helpers/builders/builders';

describe('DivisionFixture', () => {
    const home = teamBuilder('HOME').build();
    const away = teamBuilder('AWAY').build();

    let context: TestContext;
    let reportedError: ErrorState;
    let divisionReloaded: boolean;
    let updatedFixtures:
        | ((x: IEditableDivisionFixtureDateDto[]) => DivisionFixtureDateDto[])
        | null;
    let beforeReloadDivisionCalled: boolean;
    let savedFixture: EditGameDto | null;
    let deletedFixture: string | null;
    let apiResponse: IClientActionResultDto<GameDto> | null;

    const gameApi = api<IGameApi>({
        async update(fixture: EditGameDto) {
            savedFixture = fixture;
            return apiResponse || { success: true };
        },
        async delete(id: string) {
            deletedFixture = id;
            return apiResponse || { success: true };
        },
    });

    async function onReloadDivision() {
        divisionReloaded = true;

        if (!beforeReloadDivisionCalled) {
            throw new Error(
                'Reload Division called before beforeReloadDivision',
            );
        }

        return null;
    }

    async function beforeReloadDivision() {
        beforeReloadDivisionCalled = true;
    }

    async function onUpdateFixtures(
        data: (
            x: IEditableDivisionFixtureDateDto[],
        ) => DivisionFixtureDateDto[],
    ) {
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

    async function renderComponent(
        props: IDivisionFixtureProps,
        divisionData: IDivisionDataBuilder,
        account: UserDto | undefined,
        teams: TeamDto[],
        preferenceData?: IPreferenceData,
    ) {
        context = await renderApp(
            iocProps({ gameApi }),
            brandingProps(),
            appProps(
                {
                    account,
                    teams,
                },
                reportedError,
            ),
            <DivisionDataContainer
                {...divisionData.build()}
                onReloadDivision={onReloadDivision}>
                <DivisionFixture {...props} />
            </DivisionDataContainer>,
            undefined,
            undefined,
            'tbody',
            preferenceData,
        );
    }

    function props(
        fixture: IDatedDivisionFixtureDto,
        customisations?: Partial<IDivisionFixtureProps>,
    ) {
        return {
            date: fixture.date,
            fixture,
            beforeReloadDivision,
            onUpdateFixtures,
            ...customisations,
        } as IDivisionFixtureProps;
    }

    function getAwayCell(): IComponent {
        return context.required('td:nth-child(5)');
    }

    function assertFixtureRow(
        id: string,
        home: string,
        away: string,
        homeScore: string = '',
        awayScore: string = '',
    ) {
        assertCellText(home, away, homeScore, awayScore);
        const linkToFixture = `http://localhost/score/${id}`;
        assertFixtureLinks(linkToFixture, linkToFixture);
    }

    function assertCellText(
        home: string,
        away: string,
        homeScore: string = '',
        awayScore: string = '',
        deleteButton?: boolean,
    ) {
        const td = context.all('td');
        const expected = [home, homeScore, 'vs', awayScore, away];
        const cells = td.map((c) => c.text());

        if (deleteButton === true) {
            expected.push('🗑');
        }

        const actual = deleteButton === undefined ? take(cells, 5) : cells;
        expect(actual).toEqual(expected);
    }

    function assertFixtureLinks(home: string, away?: string) {
        const cells = context.all('td');
        const linkToHome = cells[0].required('a').element<HTMLAnchorElement>();
        expect(linkToHome.href).toEqual(home);
        if (away) {
            const linkToAway = cells[4].required('a');
            expect(linkToAway.element<HTMLAnchorElement>().href).toEqual(away);
        }
    }

    describe('when logged out', () => {
        const season: SeasonDto = seasonBuilder('SEASON').build();
        const division: DivisionDto = divisionBuilder('DIVISION').build();
        const team: TeamDto = teamBuilder('TEAM').build();
        const account: UserDto | undefined = undefined;
        const date: string = '2023-05-06T00:00:00';
        const fixture = divisionFixtureBuilder(date)
            .playing(home, away)
            .build();
        const bye = divisionFixtureBuilder(date).bye(home).build();

        function homeAwayFixture(fm?: BuilderParam<IDivisionFixtureBuilder>) {
            fm = fm ?? ((fb) => fb);

            return divisionDataBuilder(division)
                .withFixtureDate(
                    (d) => d.withFixture((f) => fm(f.playing(home, away))),
                    date,
                )
                .season()
                .withTeam(team);
        }

        it('renders unplayed fixture', async () => {
            await renderComponent(props(fixture), homeAwayFixture(), account, [
                team,
            ]);

            assertFixtureRow(fixture.id!, 'HOME', 'AWAY');
        });

        it('renders postponed fixture', async () => {
            const fixture = divisionFixtureBuilder(date)
                .postponed()
                .playing(home, away)
                .build();
            await renderComponent(
                props(fixture),
                homeAwayFixture((f) => f.postponed()),
                account,
                [team],
            );

            assertFixtureRow(fixture.id!, 'HOME', 'AWAY', 'P', 'P');
        });

        it('renders qualifier fixture', async () => {
            await renderComponent(
                props(fixture),
                homeAwayFixture((fb) => fb.knockout()),
                account,
                [team],
            );

            assertFixtureRow(fixture.id!, 'HOME', 'AWAY');
        });

        it('renders bye', async () => {
            await renderComponent(
                props(bye),
                divisionDataBuilder(division)
                    .withFixtureDate(
                        (d) => d.withFixture((f) => f.bye(home)),
                        date,
                    )
                    .season((s) => s, season.id, season.name)
                    .withTeam(team),
                account,
                [team],
            );

            const link = `http://localhost/division/${division.name}/team:${bye.homeTeam.name}/${season.name}`;
            assertCellText('HOME', 'Bye');
            assertFixtureLinks(link);
        });

        it('does not shade when no favourites', async () => {
            await renderComponent(
                props(bye),
                homeAwayFixture().favouritesEnabled(true),
                account,
                [team],
                {},
            );

            const row = context.required('tr');
            expect(row.className()).not.toContain('opacity-25');
        });

        it('shades non-favourite teams', async () => {
            const fixture = divisionFixtureBuilder(date).build();
            await renderComponent(
                props(fixture),
                homeAwayFixture().favouritesEnabled(true),
                account,
                [team],
                {
                    favouriteTeamIds: ['1234'],
                },
            );

            const row = context.required('tr');
            expect(row.className()).toContain('opacity-25');
        });

        it('does not shade bye for favourite-team', async () => {
            await renderComponent(
                props(bye),
                divisionDataBuilder(division)
                    .withFixtureDate(
                        (d) => d.withFixture((f) => f.bye(home)),
                        date,
                    )
                    .season()
                    .withTeam(team)
                    .favouritesEnabled(true),
                account,
                [team],
                {
                    favouriteTeamIds: [bye.homeTeam.id!],
                },
            );

            const row = context.required('tr');
            expect(row.className()).not.toContain('opacity-25');
        });

        it('does not shade home-team favourite', async () => {
            await renderComponent(
                props(fixture),
                homeAwayFixture().favouritesEnabled(true),
                account,
                [team],
                {
                    favouriteTeamIds: [fixture.homeTeam.id!],
                },
            );

            const row = context.required('tr');
            expect(row.className()).not.toContain('opacity-25');
        });

        it('does not shade away-team favourite', async () => {
            await renderComponent(
                props(fixture),
                homeAwayFixture().favouritesEnabled(true),
                account,
                [team],
                {
                    favouriteTeamIds: [fixture!.awayTeam!.id!],
                },
            );

            const row = context.required('tr');
            expect(row.className()).not.toContain('opacity-25');
        });

        it('can set a favourite team', async () => {
            await renderComponent(
                props(fixture),
                homeAwayFixture().favouritesEnabled(true),
                account,
                [team],
                { favouriteTeamIds: [] },
            );
            const row = context.required('tr');
            const selector = 'button[datatype="toggle-favourite"]';
            const favouriteToggles = row.all(selector);

            await favouriteToggles[0].click();

            const favouriteTeamIds =
                context.cookies!.get('preferences').favouriteTeamIds;
            expect(favouriteTeamIds).toEqual([fixture.homeTeam.id]);
        });

        it('can unset a favourite team', async () => {
            await renderComponent(
                props(fixture),
                homeAwayFixture().favouritesEnabled(true),
                account,
                [team],
                { favouriteTeamIds: [fixture.homeTeam.id!] },
            );
            const row = context.required('tr');
            const selector = 'button[datatype="toggle-favourite"]';
            const favouriteToggles = row.all(selector);

            await favouriteToggles[0].click();

            const favouriteTeamIds =
                context.cookies!.get('preferences').favouriteTeamIds;
            expect(favouriteTeamIds).toEqual([]);
        });
    });

    describe('when logged in', () => {
        const season: SeasonDto = seasonBuilder('SEASON').build();
        const division: DivisionDto = divisionBuilder('DIVISION').build();
        const home = teamBuilder('HOME')
            .address('HOME ADDRESS')
            .forSeason(season, division)
            .build();
        const away = teamBuilder('AWAY')
            .address('AWAY ADDRESS')
            .forSeason(season, division)
            .build();
        const account = user({
            manageGames: true,
        });
        const date: string = '2023-05-06T00:00:00';
        const nextDate: string = '2023-05-13T00:00:00';
        const anotherTeam = teamBuilder('ANOTHER TEAM')
            .address('ANOTHER ADDRESS')
            .build();
        const fixture = divisionFixtureBuilder(date)
            .playing(home, away)
            .build();
        const bye = divisionFixtureBuilder(date).bye(home).build();
        const dd = divisionDataBuilder(division)
            .season()
            .withTeam(home)
            .withTeam(away);
        const deletePrompt =
            'Are you sure you want to delete this fixture?\n\nHOME vs AWAY';

        function homeAwayFixture(
            fixture: IDatedDivisionFixtureDto,
            fixtureModifier?: BuilderParam<IDivisionFixtureBuilder>,
            seasonBuilder?: BuilderParam<ISeasonBuilder>,
        ) {
            fixtureModifier = fixtureModifier ?? ((fb) => fb);

            return divisionDataBuilder(division)
                .withFixtureDate(
                    (d) =>
                        d.withFixture(
                            (f) => fixtureModifier(f.playing(home, away)),
                            fixture.id!,
                        ),
                    date,
                )
                .season(seasonBuilder)
                .withTeam(home)
                .withTeam(away);
        }

        function getSaveCell(): IComponent {
            return context.required('td:nth-child(6)');
        }

        it('renders unplayed fixture', async () => {
            await renderComponent(
                props(fixture),
                homeAwayFixture(fixture),
                account,
                [home, away],
            );

            assertCellText('HOME', 'AWAYAWAY', '', '', true);
            assertFixtureLinks(`http://localhost/score/${fixture.id}`);
        });

        it('renders postponed fixture', async () => {
            const fixture = divisionFixtureBuilder(date)
                .playing(home, away)
                .postponed()
                .build();
            await renderComponent(
                props(fixture),
                homeAwayFixture(fixture, (f) => f.postponed()),
                account,
                [home, away],
            );

            assertCellText('HOME', 'AWAYAWAY', 'P', 'P', true);
            assertFixtureLinks(`http://localhost/score/${fixture.id}`);
        });

        it('renders qualifier fixture', async () => {
            await renderComponent(
                props(fixture),
                homeAwayFixture(
                    fixture,
                    (f) => f.knockout(),
                    (s) => s.id(season.id).name(season.name),
                ),
                account,
                [home, away],
            );

            assertCellText('HOME', 'AWAYAWAY', '', '', true);
            assertFixtureLinks(`http://localhost/score/${fixture.id}`);
        });

        it('renders bye', async () => {
            await renderComponent(
                props(bye),
                divisionDataBuilder(division)
                    .withFixtureDate(
                        (d) => d.withFixture((f) => f.bye(home)),
                        date,
                    )
                    .season((s) => s, season.id, season.name)
                    .withTeam(home)
                    .withTeam(away),
                account,
                [home, away],
            );

            assertCellText('HOME', 'AWAY', '', '');
            const link = `http://localhost/division/${division.name}/team:${bye.homeTeam.name}/${season.name}`;
            assertFixtureLinks(link);
        });

        it('renders selectable away team with same address (league fixture)', async () => {
            const anotherTeamAtHomeAddress = teamBuilder('ANOTHER TEAM')
                .address('HOME ADDRESS')
                .build();
            const fixture = divisionFixtureBuilder(date).build();
            await renderComponent(
                props(fixture),
                homeAwayFixture(fixture).withTeam(anotherTeamAtHomeAddress),
                account,
                [home, away, anotherTeamAtHomeAddress],
            );

            expect(getAwayCell().text()).toContain('ANOTHER TEAM');
            expect(getAwayCell().text()).not.toContain('🚫');
        });

        it('renders unselectable away team playing elsewhere (league fixture)', async () => {
            const fixture = divisionFixtureBuilder(date).build();
            await renderComponent(
                props(fixture),
                divisionDataBuilder(division)
                    .withFixtureDate(
                        (d) =>
                            d
                                .withFixture((f) => f)
                                .withFixture((f) => f.playing(home, away)),
                        date,
                    )
                    .season()
                    .withTeam(home)
                    .withTeam(away),
                account,
                [home, away],
            );

            const text = '🚫 AWAY (Already playing against HOME)';
            expect(getAwayCell().text()).toContain(text);
        });

        it('renders unselectable away team played fixture previously (league fixture)', async () => {
            const anotherFixture = divisionFixtureBuilder(nextDate)
                .playing(home, away)
                .build();
            await renderComponent(
                props(bye),
                divisionDataBuilder(division)
                    .withFixtureDate((d) => d.withFixture((f) => f), date)
                    .withFixtureDate(
                        (d) => d.withFixture((f) => f.playing(home, away)),
                        nextDate,
                    )
                    .season()
                    .withTeam(home)
                    .withTeam(away),
                account,
                [home, away],
            );

            expect(getAwayCell().text()).toContain(
                `🚫 AWAY (Already playing same leg on ${renderDate(anotherFixture.date)})`,
            );
        });

        it('renders selectable away team when away team is playing a qualifier on another date', async () => {
            await renderComponent(
                props(bye),
                divisionDataBuilder(division)
                    .withFixtureDate((d) => d.withFixture((f) => f), date)
                    .withFixtureDate(
                        (d) =>
                            d.withFixture((f) =>
                                f.playing(home, away).knockout(),
                            ),
                        nextDate,
                    )
                    .season()
                    .withTeam(home)
                    .withTeam(away),
                account,
                [home, away],
            );

            expect(getAwayCell().text()).toEqual(`AWAY`);
        });

        it('renders selectable away team with same address (qualifier)', async () => {
            const anotherTeamAtHomeAddress = teamBuilder('ANOTHER TEAM')
                .address('HOME ADDRESS')
                .forSeason(season, division)
                .build();
            await renderComponent(
                props(bye),
                homeAwayFixture(
                    bye,
                    (f) => f.knockout(),
                    (s) => s.id(season.id),
                ).withTeam(anotherTeamAtHomeAddress),
                account,
                [home, away, anotherTeamAtHomeAddress],
            );

            expect(getAwayCell().text()).toEqual(`AWAYANOTHER TEAM`);
        });

        it('does not render team with deleted team season', async () => {
            const deletedAwayTeam: TeamDto = teamBuilder('DELETED AWAY')
                .forSeason(season, division, undefined, true)
                .build();
            const fixture = divisionFixtureBuilder(date).knockout().build();
            await renderComponent(
                props(fixture),
                homeAwayFixture(fixture).withTeam(deletedAwayTeam),
                account,
                [home, deletedAwayTeam],
            );

            expect(getAwayCell().text()).not.toContain(`DELETED AWAY`);
        });

        it('renders unselectable away team playing elsewhere (qualifier)', async () => {
            const fixture = divisionFixtureBuilder(date).build();
            await renderComponent(
                props(fixture),
                divisionDataBuilder(division)
                    .withFixtureDate(
                        (d) =>
                            d
                                .withFixture((f) => f.knockout())
                                .withFixture((f) =>
                                    f.playing(home, away).knockout(),
                                ),
                        date,
                    )
                    .season((s) => s, season.id)
                    .withTeam(home)
                    .withTeam(away),
                account,
                [home, away],
            );

            const text = '🚫 AWAY (Already playing against HOME)';
            expect(getAwayCell().text()).toContain(text);
        });

        it('renders selectable home team when no other fixtures for date', async () => {
            const fixture = divisionFixtureBuilder(date).build();
            await renderComponent(props(fixture), dd, account, [home, away]);

            expect(getAwayCell().text()).not.toContain('🚫');
        });

        it('renders no away selection when home address is in use', async () => {
            const otherFixtureId = createTemporaryId();
            const fixture = divisionFixtureBuilder(date)
                .withOtherFixtureUsingUsingAddress(
                    'HOME - SAME ADDRESS',
                    otherFixtureId,
                )
                .build();
            await renderComponent(props(fixture), dd, account, [home, away]);

            const text = '🚫HOME - SAME ADDRESS vs AWAY using this venue';
            expect(getAwayCell().optional('.dropdown-menu')).toBeFalsy();
            expect(getAwayCell().text()).toContain(text);
            const link = `http://localhost/score/${otherFixtureId}`;
            const linkToOtherFixture = getAwayCell()
                .required('a')
                .element<HTMLAnchorElement>();
            expect(linkToOtherFixture.href).toEqual(link);
        });

        it('renders unselectable away team played fixture previously (qualifier)', async () => {
            await renderComponent(
                props(bye),
                divisionDataBuilder(division)
                    .withFixtureDate(
                        (d) => d.withFixture((f) => f.knockout()),
                        bye.date,
                    )
                    .withFixtureDate(
                        (d) =>
                            d.withFixture((f) =>
                                f.playing(home, away).knockout(),
                            ),
                        nextDate,
                    )
                    .season((s) => s, season.id)
                    .withTeam(home)
                    .withTeam(away),
                account,
                [home, away],
            );

            expect(getAwayCell().text()).toEqual('AWAY');
        });

        it('can change away team', async () => {
            await renderComponent(
                props(bye),
                homeAwayFixture(bye).withTeam(anotherTeam),
                account,
                [home, away, anotherTeam],
            );

            await getAwayCell()
                .required('.dropdown-menu')
                .select('ANOTHER TEAM');

            expect(updatedFixtures).not.toBeNull();
            expect(updatedFixtures!([{ date, fixtures: [bye] }])).toEqual([
                {
                    date,
                    fixtures: [
                        {
                            id: bye.id,
                            date,
                            homeTeam: home,
                            awayTeam: {
                                id: anotherTeam.id,
                                name: anotherTeam.name,
                            },
                            originalAwayTeamId: 'unset',
                            fixturesUsingAddress: [],
                        },
                    ],
                },
            ]);
        });

        it('can change away team for qualifiers', async () => {
            await renderComponent(
                props(bye),
                homeAwayFixture(bye, (f) => f.knockout()).withTeam(anotherTeam),
                account,
                [home, away, anotherTeam],
            );

            await getAwayCell()
                .required('.dropdown-menu')
                .select('ANOTHER TEAM');

            expect(updatedFixtures).not.toBeNull();
            expect(
                updatedFixtures!([{ date, fixtures: [bye], isKnockout: true }]),
            ).toEqual([
                {
                    date,
                    fixtures: [
                        {
                            date,
                            homeTeam: home,
                            awayTeam: {
                                id: anotherTeam.id,
                                name: anotherTeam.name,
                            },
                            id: bye.id,
                            originalAwayTeamId: 'unset',
                            fixturesUsingAddress: [],
                        },
                    ],
                    isKnockout: true,
                },
            ]);
        });

        it('can save league fixture change', async () => {
            const fixture = divisionFixtureBuilder(date)
                .playing(home, away)
                .originalAwayTeamId('unset')
                .build();
            await renderComponent(
                props(fixture),
                homeAwayFixture(fixture, (f) =>
                    f.originalAwayTeamId('unset'),
                ).withTeam(anotherTeam),
                account,
                [home, away, anotherTeam],
            );

            await getSaveCell().button('💾').click();

            expect(savedFixture).not.toBeNull();
            expect(beforeReloadDivisionCalled).toEqual(true);
            expect(divisionReloaded).toEqual(true);
        });

        it('can save qualifier change', async () => {
            const fixture = divisionFixtureBuilder(date)
                .playing(home, away)
                .originalAwayTeamId('unset')
                .build();
            await renderComponent(
                props(fixture),
                homeAwayFixture(fixture, (f) =>
                    f.originalAwayTeamId('unset').knockout(),
                ).withTeam(anotherTeam),
                account,
                [home, away, anotherTeam],
            );

            await getSaveCell().button('💾').click();

            expect(savedFixture).not.toBeNull();
            expect(beforeReloadDivisionCalled).toEqual(true);
            expect(divisionReloaded).toEqual(true);
        });

        it('handles error during save', async () => {
            const fixture = divisionFixtureBuilder(date)
                .playing(home, away)
                .originalAwayTeamId('unset')
                .build();
            await renderComponent(
                props(fixture),
                homeAwayFixture(fixture).withTeam(anotherTeam),
                account,
                [home, away, anotherTeam],
            );
            apiResponse = { success: false, errors: ['SOME ERROR'] };

            await getSaveCell().button('💾').click();

            expect(savedFixture).not.toBeNull();
            expect(beforeReloadDivisionCalled).toEqual(false);
            expect(divisionReloaded).toEqual(false);
            expect(context.text()).toContain('Could not save fixture details');
            expect(context.text()).toContain('SOME ERROR');
        });

        it('can delete league fixture', async () => {
            await renderComponent(
                props(fixture),
                homeAwayFixture(fixture).withTeam(anotherTeam),
                account,
                [home, away, anotherTeam],
            );
            context.prompts.respondToConfirm(deletePrompt, true);

            await getSaveCell().button('🗑').click();

            context.prompts.confirmWasShown(deletePrompt);
            expect(deletedFixture).toEqual(fixture.id);
            expect(beforeReloadDivisionCalled).toEqual(true);
            expect(divisionReloaded).toEqual(true);
        });

        it('cannot delete fixture if readonly', async () => {
            await renderComponent(
                props(fixture, { readOnly: true }),
                homeAwayFixture(fixture).withTeam(anotherTeam),
                account,
                [home, away, anotherTeam],
            );

            expect(getSaveCell().button('🗑').enabled()).toEqual(false);
        });

        it('does not delete league fixture', async () => {
            await renderComponent(
                props(fixture),
                homeAwayFixture(fixture).withTeam(anotherTeam),
                account,
                [home, away, anotherTeam],
            );
            context.prompts.respondToConfirm(deletePrompt, false);

            await getSaveCell().button('🗑').click();

            expect(deletedFixture).toBeNull();
            expect(beforeReloadDivisionCalled).toEqual(false);
            expect(divisionReloaded).toEqual(false);
        });

        it('handles error during delete', async () => {
            await renderComponent(
                props(fixture),
                homeAwayFixture(fixture).withTeam(anotherTeam),
                account,
                [home, away, anotherTeam],
            );
            context.prompts.respondToConfirm(deletePrompt, true);
            apiResponse = { success: false, errors: ['SOME ERROR'] };

            await getSaveCell().button('🗑').click();

            expect(deletedFixture).toEqual(fixture.id);
            expect(beforeReloadDivisionCalled).toEqual(false);
            expect(divisionReloaded).toEqual(false);
            expect(context.text()).toContain('Could not save fixture details');
            expect(context.text()).toContain('SOME ERROR');
        });

        it('can close error dialog from deletion failure', async () => {
            await renderComponent(
                props(fixture),
                homeAwayFixture(fixture).withTeam(anotherTeam),
                account,
                [home, away, anotherTeam],
            );
            context.prompts.respondToConfirm(deletePrompt, true);
            apiResponse = { success: false, errors: ['SOME ERROR'] };
            await getSaveCell().button('🗑').click();
            expect(context.text()).toContain('Could not save fixture details');

            await context.button('Close').click();

            const text = 'Could not save fixture details';
            expect(context.text()).not.toContain(text);
        });

        it('can delete qualifier', async () => {
            await renderComponent(
                props(fixture),
                homeAwayFixture(fixture, (f) => f.knockout()).withTeam(
                    anotherTeam,
                ),
                account,
                [home, away, anotherTeam],
            );
            context.prompts.respondToConfirm(deletePrompt, true);

            await getSaveCell().button('🗑').click();

            context.prompts.confirmWasShown(deletePrompt);
            expect(deletedFixture).toEqual(fixture.id);
            expect(beforeReloadDivisionCalled).toEqual(true);
            expect(divisionReloaded).toEqual(true);
        });

        it('cannot save when readonly', async () => {
            const fixture = divisionFixtureBuilder(date)
                .playing(home, away)
                .originalAwayTeamId('unset')
                .build();
            await renderComponent(
                props(fixture, { readOnly: true }),
                homeAwayFixture(fixture, (f) =>
                    f.originalAwayTeamId('unset'),
                ).withTeam(anotherTeam),
                account,
                [home, away, anotherTeam],
            );

            const row = context.required('td:nth-child(6)');
            expect(row.button('💾').enabled()).toEqual(false);
        });

        it('cannot delete when readonly', async () => {
            await renderComponent(
                props(fixture, { readOnly: true }),
                homeAwayFixture(fixture).withTeam(anotherTeam),
                account,
                [home, away, anotherTeam],
            );

            const row = context.required('td:nth-child(6)');
            expect(row.button('🗑').enabled()).toEqual(false);
        });

        it('cannot change away team when readonly', async () => {
            const fixture = divisionFixtureBuilder(date).build();
            await renderComponent(
                props(fixture, { readOnly: true }),
                homeAwayFixture(fixture).withTeam(anotherTeam),
                account,
                [home, away, anotherTeam],
            );

            await getAwayCell()
                .required('.dropdown-menu')
                .select('ANOTHER TEAM');

            expect(updatedFixtures).toBeNull();
        });

        it('does not shade non-favourite team when an admin', async () => {
            const fixture = divisionFixtureBuilder(date).build();
            await renderComponent(
                props(fixture),
                homeAwayFixture(fixture).favouritesEnabled(true),
                account,
                [home],
                {
                    favouriteTeamIds: ['1234'],
                },
            );

            const row = context.required('tr');
            expect(row.className()).not.toContain('opacity-25');
        });
    });
});
