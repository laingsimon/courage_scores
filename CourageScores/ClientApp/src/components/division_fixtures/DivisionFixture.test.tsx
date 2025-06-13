import {
    api,
    appProps,
    brandingProps,
    cleanUp,
    doClick,
    doSelectOption,
    ErrorState,
    findButton,
    iocProps,
    renderApp,
    TestContext,
    user,
} from '../../helpers/tests';
import { renderDate } from '../../helpers/rendering';
import { createTemporaryId } from '../../helpers/projection';
import { DivisionFixture, IDivisionFixtureProps } from './DivisionFixture';
import {
    DivisionDataContainer,
    IDivisionDataContainerProps,
} from '../league/DivisionDataContainer';
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
        update: async (fixture: EditGameDto) => {
            savedFixture = fixture;
            return apiResponse || { success: true };
        },
        delete: async (id: string) => {
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
    ): Promise<DivisionFixtureDateDto[]> {
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
        divisionData: IDivisionDataContainerProps,
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
                {...divisionData}
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
    ): IDivisionFixtureProps {
        return {
            date: fixture.date,
            fixture,
            beforeReloadDivision,
            onUpdateFixtures,
            ...customisations,
        };
    }

    function getAwayCell() {
        return context.container.querySelector('td:nth-child(5)')!;
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
        const td = Array.from(context.container.querySelectorAll('td'));
        const expected = [home, homeScore, 'vs', awayScore, away];
        const cells = td.map((td) => td.textContent);

        if (deleteButton === true) {
            expected.push('🗑');
        }

        const actual = deleteButton === undefined ? take(cells, 5) : cells;
        expect(actual).toEqual(expected);
    }

    function assertFixtureLinks(home: string, away?: string) {
        const cells = Array.from(context.container.querySelectorAll('td'));
        const linkToHome = cells[0].querySelector('a')!;
        expect(linkToHome.href).toEqual(home);
        if (away) {
            const linkToAway = cells[4].querySelector('a')!;
            expect(linkToAway.href).toEqual(away);
        }
    }

    describe('when logged out', () => {
        const season: SeasonDto = seasonBuilder('SEASON').build();
        const division: DivisionDto = divisionBuilder('DIVISION').build();
        const team: TeamDto = teamBuilder('TEAM').build();
        const account: UserDto | undefined = undefined;
        const date: string = '2023-05-06T00:00:00';

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
            const fixture = divisionFixtureBuilder(date)
                .playing(home, away)
                .build();
            await renderComponent(
                props(fixture),
                homeAwayFixture().build(),
                account,
                [team],
            );

            assertFixtureRow(fixture.id!, 'HOME', 'AWAY');
        });

        it('renders postponed fixture', async () => {
            const fixture = divisionFixtureBuilder(date)
                .postponed()
                .playing(home, away)
                .build();
            await renderComponent(
                props(fixture),
                homeAwayFixture((f) => f.postponed()).build(),
                account,
                [team],
            );

            assertFixtureRow(fixture.id!, 'HOME', 'AWAY', 'P', 'P');
        });

        it('renders qualifier fixture', async () => {
            const fixture = divisionFixtureBuilder(date)
                .playing(home, away)
                .build();
            await renderComponent(
                props(fixture),
                homeAwayFixture((fb) => fb.knockout()).build(),
                account,
                [team],
            );

            assertFixtureRow(fixture.id!, 'HOME', 'AWAY');
        });

        it('renders bye', async () => {
            const bye = divisionFixtureBuilder(date).bye(home).build();
            await renderComponent(
                props(bye),
                divisionDataBuilder(division)
                    .withFixtureDate(
                        (d) => d.withFixture((f) => f.bye(home)),
                        date,
                    )
                    .season((s) => s, season.id, season.name)
                    .withTeam(team)
                    .build(),
                account,
                [team],
            );

            assertCellText('HOME', 'Bye');
            assertFixtureLinks(
                `http://localhost/division/${division.name}/team:${bye.homeTeam.name}/${season.name}`,
            );
        });

        it('does not shade when no favourites', async () => {
            const bye = divisionFixtureBuilder(date).bye(home).build();
            await renderComponent(
                props(bye),
                homeAwayFixture().favouritesEnabled(true).build(),
                account,
                [team],
                {},
            );

            const row = context.container.querySelector('tr')!;
            expect(row.className).not.toContain('opacity-25');
        });

        it('shades non-favourite teams', async () => {
            const fixture = divisionFixtureBuilder(date).build();
            await renderComponent(
                props(fixture),
                homeAwayFixture().favouritesEnabled(true).build(),
                account,
                [team],
                {
                    favouriteTeamIds: ['1234'],
                },
            );

            const row = context.container.querySelector('tr')!;
            expect(row.className).toContain('opacity-25');
        });

        it('does not shade bye for favourite-team', async () => {
            const bye = divisionFixtureBuilder(date).bye(home).build();
            await renderComponent(
                props(bye),
                divisionDataBuilder(division)
                    .withFixtureDate(
                        (d) => d.withFixture((f) => f.bye(home)),
                        date,
                    )
                    .season()
                    .withTeam(team)
                    .favouritesEnabled(true)
                    .build(),
                account,
                [team],
                {
                    favouriteTeamIds: [bye.homeTeam.id!],
                },
            );

            const row = context.container.querySelector('tr')!;
            expect(row.className).not.toContain('opacity-25');
        });

        it('does not shade home-team favourite', async () => {
            const fixture = divisionFixtureBuilder(date)
                .playing(home, away)
                .build();
            await renderComponent(
                props(fixture),
                homeAwayFixture().favouritesEnabled(true).build(),
                account,
                [team],
                {
                    favouriteTeamIds: [fixture.homeTeam.id!],
                },
            );

            const row = context.container.querySelector('tr')!;
            expect(row.className).not.toContain('opacity-25');
        });

        it('does not shade away-team favourite', async () => {
            const fixture = divisionFixtureBuilder(date)
                .playing(home, away)
                .build();
            await renderComponent(
                props(fixture),
                homeAwayFixture().favouritesEnabled(true).build(),
                account,
                [team],
                {
                    favouriteTeamIds: [fixture!.awayTeam!.id!],
                },
            );

            const row = context.container.querySelector('tr')!;
            expect(row.className).not.toContain('opacity-25');
        });

        it('can set a favourite team', async () => {
            const fixture = divisionFixtureBuilder(date)
                .playing(home, away)
                .build();
            await renderComponent(
                props(fixture),
                homeAwayFixture().favouritesEnabled(true).build(),
                account,
                [team],
                { favouriteTeamIds: [] },
            );
            const row = context.container.querySelector('tr')!;
            const favouriteToggles = Array.from(
                row.querySelectorAll('button[datatype="toggle-favourite"]'),
            );

            await doClick(favouriteToggles[0]);

            const favouriteTeamIds =
                context.cookies!.get('preferences').favouriteTeamIds;
            expect(favouriteTeamIds).toEqual([fixture.homeTeam.id]);
        });

        it('can unset a favourite team', async () => {
            const fixture = divisionFixtureBuilder(date)
                .playing(home, away)
                .build();
            await renderComponent(
                props(fixture),
                homeAwayFixture().favouritesEnabled(true).build(),
                account,
                [team],
                { favouriteTeamIds: [fixture.homeTeam.id!] },
            );
            const row = context.container.querySelector('tr')!;
            const favouriteToggles = Array.from(
                row.querySelectorAll('button[datatype="toggle-favourite"]'),
            );

            await doClick(favouriteToggles[0]);

            const favouriteTeamIds =
                context.cookies!.get('preferences').favouriteTeamIds;
            expect(favouriteTeamIds).toEqual([]);
        });
    });

    describe('when logged in', () => {
        const season: SeasonDto = seasonBuilder('SEASON').build();
        const division: DivisionDto = divisionBuilder('DIVISION').build();
        const homeTeam = teamBuilder('HOME')
            .address('HOME ADDRESS')
            .forSeason(season, division)
            .build();
        const awayTeam = teamBuilder('AWAY')
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
            .playing(homeTeam, awayTeam)
            .build();

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
                .withTeam(homeTeam)
                .withTeam(awayTeam);
        }

        function getSaveCell() {
            return context.container.querySelector('td:nth-child(6)')!;
        }

        it('renders unplayed fixture', async () => {
            const fixture = divisionFixtureBuilder(date)
                .playing(homeTeam, awayTeam)
                .build();
            await renderComponent(
                props(fixture),
                homeAwayFixture(fixture).build(),
                account,
                [homeTeam, awayTeam],
            );

            assertCellText('HOME', 'AWAYAWAY', '', '', true);
            assertFixtureLinks(`http://localhost/score/${fixture.id}`);
        });

        it('renders postponed fixture', async () => {
            const fixture = divisionFixtureBuilder(date)
                .playing(homeTeam, awayTeam)
                .postponed()
                .build();
            await renderComponent(
                props(fixture),
                homeAwayFixture(fixture, (f) => f.postponed()).build(),
                account,
                [homeTeam, awayTeam],
            );

            assertCellText('HOME', 'AWAYAWAY', 'P', 'P', true);
            assertFixtureLinks(`http://localhost/score/${fixture.id}`);
        });

        it('renders qualifier fixture', async () => {
            const fixture = divisionFixtureBuilder(date)
                .playing(homeTeam, awayTeam)
                .build();
            await renderComponent(
                props(fixture),
                homeAwayFixture(
                    fixture,
                    (f) => f.knockout(),
                    (s) => s.id(season.id).name(season.name),
                ).build(),
                account,
                [homeTeam, awayTeam],
            );

            assertCellText('HOME', 'AWAYAWAY', '', '', true);
            assertFixtureLinks(`http://localhost/score/${fixture.id}`);
        });

        it('renders bye', async () => {
            const bye = divisionFixtureBuilder(date).bye(homeTeam).build();
            await renderComponent(
                props(bye),
                divisionDataBuilder(division)
                    .withFixtureDate(
                        (d) => d.withFixture((f) => f.bye(homeTeam)),
                        date,
                    )
                    .season((s) => s, season.id, season.name)
                    .withTeam(homeTeam)
                    .withTeam(awayTeam)
                    .build(),
                account,
                [homeTeam, awayTeam],
            );

            assertCellText('HOME', 'AWAY', '', '');
            assertFixtureLinks(
                `http://localhost/division/${division.name}/team:${bye.homeTeam.name}/${season.name}`,
            );
        });

        it('renders selectable away team with same address (league fixture)', async () => {
            const anotherTeamAtHomeAddress = teamBuilder('ANOTHER TEAM')
                .address('HOME ADDRESS')
                .build();
            const fixture = divisionFixtureBuilder(date).build();
            await renderComponent(
                props(fixture),
                homeAwayFixture(fixture)
                    .withTeam(anotherTeamAtHomeAddress)
                    .build(),
                account,
                [homeTeam, awayTeam, anotherTeamAtHomeAddress],
            );

            const awayCell = getAwayCell();
            expect(awayCell.textContent).toContain('ANOTHER TEAM');
            expect(awayCell.textContent).not.toContain('🚫');
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
                                .withFixture((f) =>
                                    f.playing(homeTeam, awayTeam),
                                ),
                        date,
                    )
                    .season()
                    .withTeam(homeTeam)
                    .withTeam(awayTeam)
                    .build(),
                account,
                [homeTeam, awayTeam],
            );

            expect(getAwayCell().textContent).toContain(
                '🚫 AWAY (Already playing against HOME)',
            );
        });

        it('renders unselectable away team played fixture previously (league fixture)', async () => {
            const bye = divisionFixtureBuilder(date).bye(homeTeam).build();
            const anotherFixture = divisionFixtureBuilder(nextDate)
                .playing(homeTeam, awayTeam)
                .build();
            await renderComponent(
                props(bye),
                divisionDataBuilder(division)
                    .withFixtureDate((d) => d.withFixture((f) => f), date)
                    .withFixtureDate(
                        (d) =>
                            d.withFixture((f) => f.playing(homeTeam, awayTeam)),
                        nextDate,
                    )
                    .season()
                    .withTeam(homeTeam)
                    .withTeam(awayTeam)
                    .build(),
                account,
                [homeTeam, awayTeam],
            );

            expect(getAwayCell().textContent).toContain(
                `🚫 AWAY (Already playing same leg on ${renderDate(anotherFixture.date)})`,
            );
        });

        it('renders selectable away team when away team is playing a qualifier on another date', async () => {
            const bye = divisionFixtureBuilder(date).bye(homeTeam).build();
            await renderComponent(
                props(bye),
                divisionDataBuilder(division)
                    .withFixtureDate((d) => d.withFixture((f) => f), date)
                    .withFixtureDate(
                        (d) =>
                            d.withFixture((f) =>
                                f.playing(homeTeam, awayTeam).knockout(),
                            ),
                        nextDate,
                    )
                    .season()
                    .withTeam(homeTeam)
                    .withTeam(awayTeam)
                    .build(),
                account,
                [homeTeam, awayTeam],
            );

            expect(getAwayCell().textContent).toEqual(`AWAY`);
        });

        it('renders selectable away team with same address (qualifier)', async () => {
            const bye = divisionFixtureBuilder(date).bye(homeTeam).build();
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
                )
                    .withTeam(anotherTeamAtHomeAddress)
                    .build(),
                account,
                [homeTeam, awayTeam, anotherTeamAtHomeAddress],
            );

            expect(getAwayCell().textContent).toEqual(`AWAYANOTHER TEAM`);
        });

        it('does not render team with deleted team season', async () => {
            const deletedAwayTeam: TeamDto = teamBuilder('DELETED AWAY')
                .forSeason(season, division, undefined, true)
                .build();
            const fixture = divisionFixtureBuilder(date).knockout().build();
            await renderComponent(
                props(fixture),
                homeAwayFixture(fixture).withTeam(deletedAwayTeam).build(),
                account,
                [homeTeam, deletedAwayTeam],
            );

            expect(getAwayCell().textContent).not.toContain(`DELETED AWAY`);
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
                                    f.playing(homeTeam, awayTeam).knockout(),
                                ),
                        date,
                    )
                    .season((s) => s, season.id)
                    .withTeam(homeTeam)
                    .withTeam(awayTeam)
                    .build(),
                account,
                [homeTeam, awayTeam],
            );

            expect(getAwayCell().textContent).toContain(
                '🚫 AWAY (Already playing against HOME)',
            );
        });

        it('renders selectable home team when no other fixtures for date', async () => {
            const fixture = divisionFixtureBuilder(date).build();
            await renderComponent(
                props(fixture),
                divisionDataBuilder(division)
                    .season()
                    .withTeam(homeTeam)
                    .withTeam(awayTeam)
                    .build(),
                account,
                [homeTeam, awayTeam],
            );

            expect(getAwayCell().textContent).not.toContain('🚫');
        });

        it('renders no away selection when home address is in use', async () => {
            const otherFixtureId = createTemporaryId();
            const fixture = divisionFixtureBuilder(date)
                .withOtherFixtureUsingUsingAddress(
                    'HOME - SAME ADDRESS',
                    otherFixtureId,
                )
                .build();
            await renderComponent(
                props(fixture),
                divisionDataBuilder(division)
                    .season()
                    .withTeam(homeTeam)
                    .withTeam(awayTeam)
                    .build(),
                account,
                [homeTeam, awayTeam],
            );

            const awayCell = getAwayCell();
            expect(awayCell.querySelector('.dropdown-menu')).toBeFalsy();
            expect(awayCell.textContent).toContain(
                '🚫HOME - SAME ADDRESS vs AWAY using this venue',
            );
            const linkToOtherFixture = awayCell.querySelector('a')!;
            expect(linkToOtherFixture.href).toEqual(
                `http://localhost/score/${otherFixtureId}`,
            );
        });

        it('renders unselectable away team played fixture previously (qualifier)', async () => {
            const bye = divisionFixtureBuilder(date).bye(homeTeam).build();
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
                                f.playing(homeTeam, awayTeam).knockout(),
                            ),
                        nextDate,
                    )
                    .season((s) => s, season.id)
                    .withTeam(homeTeam)
                    .withTeam(awayTeam)
                    .build(),
                account,
                [homeTeam, awayTeam],
            );

            expect(getAwayCell().textContent).toEqual('AWAY');
        });

        it('can change away team', async () => {
            const bye = divisionFixtureBuilder(date).bye(homeTeam).build();
            await renderComponent(
                props(bye),
                homeAwayFixture(bye).withTeam(anotherTeam).build(),
                account,
                [homeTeam, awayTeam, anotherTeam],
            );

            await doSelectOption(
                getAwayCell().querySelector('.dropdown-menu'),
                'ANOTHER TEAM',
            );

            expect(updatedFixtures).not.toBeNull();
            expect(updatedFixtures!([{ date, fixtures: [bye] }])).toEqual([
                {
                    date,
                    fixtures: [
                        {
                            id: bye.id,
                            date,
                            homeTeam,
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
            const bye = divisionFixtureBuilder(date).bye(homeTeam).build();
            await renderComponent(
                props(bye),
                homeAwayFixture(bye, (f) => f.knockout())
                    .withTeam(anotherTeam)
                    .build(),
                account,
                [homeTeam, awayTeam, anotherTeam],
            );

            await doSelectOption(
                getAwayCell().querySelector('.dropdown-menu'),
                'ANOTHER TEAM',
            );

            expect(updatedFixtures).not.toBeNull();
            expect(
                updatedFixtures!([{ date, fixtures: [bye], isKnockout: true }]),
            ).toEqual([
                {
                    date,
                    fixtures: [
                        {
                            date,
                            homeTeam,
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
                .playing(homeTeam, awayTeam)
                .originalAwayTeamId('unset')
                .build();
            await renderComponent(
                props(fixture),
                homeAwayFixture(fixture, (f) => f.originalAwayTeamId('unset'))
                    .withTeam(anotherTeam)
                    .build(),
                account,
                [homeTeam, awayTeam, anotherTeam],
            );

            await doClick(findButton(getSaveCell(), '💾'));

            expect(savedFixture).not.toBeNull();
            expect(beforeReloadDivisionCalled).toEqual(true);
            expect(divisionReloaded).toEqual(true);
        });

        it('can save qualifier change', async () => {
            const fixture = divisionFixtureBuilder(date)
                .playing(homeTeam, awayTeam)
                .originalAwayTeamId('unset')
                .build();
            await renderComponent(
                props(fixture),
                homeAwayFixture(fixture, (f) =>
                    f.originalAwayTeamId('unset').knockout(),
                )
                    .withTeam(anotherTeam)
                    .build(),
                account,
                [homeTeam, awayTeam, anotherTeam],
            );

            await doClick(findButton(getSaveCell(), '💾'));

            expect(savedFixture).not.toBeNull();
            expect(beforeReloadDivisionCalled).toEqual(true);
            expect(divisionReloaded).toEqual(true);
        });

        it('handles error during save', async () => {
            const fixture = divisionFixtureBuilder(date)
                .playing(homeTeam, awayTeam)
                .originalAwayTeamId('unset')
                .build();
            await renderComponent(
                props(fixture),
                homeAwayFixture(fixture).withTeam(anotherTeam).build(),
                account,
                [homeTeam, awayTeam, anotherTeam],
            );
            apiResponse = { success: false, errors: ['SOME ERROR'] };

            await doClick(findButton(getSaveCell(), '💾'));

            expect(savedFixture).not.toBeNull();
            expect(beforeReloadDivisionCalled).toEqual(false);
            expect(divisionReloaded).toEqual(false);
            expect(context.container.textContent).toContain(
                'Could not save fixture details',
            );
            expect(context.container.textContent).toContain('SOME ERROR');
        });

        it('can delete league fixture', async () => {
            await renderComponent(
                props(fixture),
                homeAwayFixture(fixture).withTeam(anotherTeam).build(),
                account,
                [homeTeam, awayTeam, anotherTeam],
            );
            context.prompts.respondToConfirm(
                'Are you sure you want to delete this fixture?\n\nHOME vs AWAY',
                true,
            );

            await doClick(findButton(getSaveCell(), '🗑'));

            context.prompts.confirmWasShown(
                'Are you sure you want to delete this fixture?\n\nHOME vs AWAY',
            );
            expect(deletedFixture).toEqual(fixture.id);
            expect(beforeReloadDivisionCalled).toEqual(true);
            expect(divisionReloaded).toEqual(true);
        });

        it('cannot delete fixture if readonly', async () => {
            await renderComponent(
                props(fixture, { readOnly: true }),
                homeAwayFixture(fixture).withTeam(anotherTeam).build(),
                account,
                [homeTeam, awayTeam, anotherTeam],
            );

            const button = findButton(getSaveCell(), '🗑');

            expect(button.disabled).toEqual(true);
        });

        it('does not delete league fixture', async () => {
            await renderComponent(
                props(fixture),
                homeAwayFixture(fixture).withTeam(anotherTeam).build(),
                account,
                [homeTeam, awayTeam, anotherTeam],
            );
            context.prompts.respondToConfirm(
                'Are you sure you want to delete this fixture?\n\nHOME vs AWAY',
                false,
            );

            await doClick(findButton(getSaveCell(), '🗑'));

            expect(deletedFixture).toBeNull();
            expect(beforeReloadDivisionCalled).toEqual(false);
            expect(divisionReloaded).toEqual(false);
        });

        it('handles error during delete', async () => {
            await renderComponent(
                props(fixture),
                homeAwayFixture(fixture).withTeam(anotherTeam).build(),
                account,
                [homeTeam, awayTeam, anotherTeam],
            );
            context.prompts.respondToConfirm(
                'Are you sure you want to delete this fixture?\n\nHOME vs AWAY',
                true,
            );
            apiResponse = { success: false, errors: ['SOME ERROR'] };

            await doClick(findButton(getSaveCell(), '🗑'));

            expect(deletedFixture).toEqual(fixture.id);
            expect(beforeReloadDivisionCalled).toEqual(false);
            expect(divisionReloaded).toEqual(false);
            expect(context.container.textContent).toContain(
                'Could not save fixture details',
            );
            expect(context.container.textContent).toContain('SOME ERROR');
        });

        it('can close error dialog from deletion failure', async () => {
            await renderComponent(
                props(fixture),
                homeAwayFixture(fixture).withTeam(anotherTeam).build(),
                account,
                [homeTeam, awayTeam, anotherTeam],
            );
            context.prompts.respondToConfirm(
                'Are you sure you want to delete this fixture?\n\nHOME vs AWAY',
                true,
            );
            apiResponse = { success: false, errors: ['SOME ERROR'] };
            await doClick(findButton(getSaveCell(), '🗑'));
            expect(context.container.textContent).toContain(
                'Could not save fixture details',
            );

            await doClick(findButton(context.container, 'Close'));

            expect(context.container.textContent).not.toContain(
                'Could not save fixture details',
            );
        });

        it('can delete qualifier', async () => {
            const fixture = divisionFixtureBuilder(date)
                .playing(homeTeam, awayTeam)
                .build();
            await renderComponent(
                props(fixture),
                homeAwayFixture(fixture, (f) => f.knockout())
                    .withTeam(anotherTeam)
                    .build(),
                account,
                [homeTeam, awayTeam, anotherTeam],
            );
            context.prompts.respondToConfirm(
                'Are you sure you want to delete this fixture?\n\nHOME vs AWAY',
                true,
            );

            await doClick(findButton(getSaveCell(), '🗑'));

            context.prompts.confirmWasShown(
                'Are you sure you want to delete this fixture?\n\nHOME vs AWAY',
            );
            expect(deletedFixture).toEqual(fixture.id);
            expect(beforeReloadDivisionCalled).toEqual(true);
            expect(divisionReloaded).toEqual(true);
        });

        it('cannot save when readonly', async () => {
            const fixture = divisionFixtureBuilder(date)
                .playing(homeTeam, awayTeam)
                .originalAwayTeamId('unset')
                .build();
            await renderComponent(
                props(fixture, { readOnly: true }),
                homeAwayFixture(fixture, (f) => f.originalAwayTeamId('unset'))
                    .withTeam(anotherTeam)
                    .build(),
                account,
                [homeTeam, awayTeam, anotherTeam],
            );

            const saveCell = context.container.querySelector('td:nth-child(6)');
            const deleteButton = findButton(saveCell, '💾');
            expect(deleteButton.disabled).toEqual(true);
        });

        it('cannot delete when readonly', async () => {
            await renderComponent(
                props(fixture, { readOnly: true }),
                homeAwayFixture(fixture).withTeam(anotherTeam).build(),
                account,
                [homeTeam, awayTeam, anotherTeam],
            );

            const saveCell = context.container.querySelector('td:nth-child(6)');
            const deleteButton = findButton(saveCell, '🗑');
            expect(deleteButton.disabled).toEqual(true);
        });

        it('cannot change away team when readonly', async () => {
            const fixture = divisionFixtureBuilder(date).build();
            await renderComponent(
                props(fixture, { readOnly: true }),
                homeAwayFixture(fixture).withTeam(anotherTeam).build(),
                account,
                [homeTeam, awayTeam, anotherTeam],
            );

            await doSelectOption(
                getAwayCell().querySelector('.dropdown-menu'),
                'ANOTHER TEAM',
            );

            expect(updatedFixtures).toBeNull();
        });

        it('does not shade non-favourite team when an admin', async () => {
            const fixture = divisionFixtureBuilder(date).build();
            await renderComponent(
                props(fixture),
                homeAwayFixture(fixture).favouritesEnabled(true).build(),
                account,
                [homeTeam],
                {
                    favouriteTeamIds: ['1234'],
                },
            );

            const row = context.container.querySelector('tr')!;
            expect(row.className).not.toContain('opacity-25');
        });
    });
});
