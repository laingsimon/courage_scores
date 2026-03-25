import {
    appProps,
    brandingProps,
    cleanUp,
    iocProps,
    renderApp,
    TestContext,
} from '../../helpers/tests';
import { renderDate } from '../../helpers/rendering';
import { FilterFixtures } from './FilterFixtures';
import {
    DivisionDataContainer,
    IDivisionDataContainerProps,
} from '../league/DivisionDataContainer';
import { teamBuilder } from '../../helpers/builders/teams';
import { IInitialisedFilters } from './filters';
import { DivisionDataDto } from '../../interfaces/models/dtos/Division/DivisionDataDto';
import { IPreferenceData } from '../common/PreferencesContainer';
import { UntypedPromise } from '../../interfaces/UntypedPromise';

describe('FilterFixtures', () => {
    let context: TestContext;

    afterEach(async () => {
        await cleanUp(context);
    });

    async function onReloadDivision(
        _?: boolean,
    ): Promise<DivisionDataDto | null> {
        return null;
    }

    async function setDivisionData(_?: DivisionDataDto): UntypedPromise {
        return null;
    }

    async function renderComponent(
        filter: IInitialisedFilters,
        divisionData: IDivisionDataContainerProps,
        initialPreferences?: IPreferenceData,
    ) {
        context = await renderApp(
            iocProps(),
            brandingProps(),
            appProps(),
            <DivisionDataContainer {...divisionData}>
                <FilterFixtures />
            </DivisionDataContainer>,
            '/fixtures',
            `/fixtures?${new URLSearchParams(filter as Record<string, string>).toString()}`,
            undefined,
            initialPreferences,
        );
    }

    function getFilterOptionLink(filterType: string, text: string): string {
        const filterDropDown = context.required(
            `[datatype="${filterType}"] .dropdown-menu`,
        );
        const items = filterDropDown.all('.dropdown-item');
        const item = items.find((i) => i.text() === text)!;
        const link = item.element().childNodes[0] as HTMLAnchorElement;
        expect(link).toBeTruthy();
        return link.href;
    }

    describe('type', () => {
        it('when selected', async () => {
            await renderComponent(
                { type: 'league' },
                {
                    name: 'DIVISION',
                    teams: [],
                    onReloadDivision,
                    setDivisionData,
                },
            );

            const dropDown = context.required('.btn-group:nth-child(1)');
            expect(dropDown.optional('.dropdown-item.active')).toBeTruthy();
            expect(dropDown.optional('.dropdown-item.active')!.text()).toEqual(
                'League fixtures',
            );
        });

        it('when unrecognised', async () => {
            await renderComponent(
                { type: 'foo' },
                {
                    name: 'DIVISION',
                    teams: [],
                    onReloadDivision,
                    setDivisionData,
                },
            );

            const dropDown = context.required('.btn-group:nth-child(1)');
            expect(dropDown.optional('.dropdown-item.active')).toBeFalsy();
        });

        it('when unselected', async () => {
            await renderComponent(
                {},
                {
                    name: 'DIVISION',
                    teams: [],
                    onReloadDivision,
                    setDivisionData,
                },
            );

            const dropDown = context.required(`[datatype="type-filter"]`);
            expect(dropDown.optional('.dropdown-item.active')).toBeTruthy();
            expect(dropDown.optional('.dropdown-item.active')!.text()).toEqual(
                'All fixtures',
            );
        });

        it('changes url to include filter', async () => {
            await renderComponent(
                { division: 'DIVISION' },
                {
                    name: 'DIVISION',
                    onReloadDivision,
                    setDivisionData,
                    teams: [],
                    favouritesEnabled: true,
                },
                {},
            );

            expect(
                getFilterOptionLink('type-filter', 'League fixtures'),
            ).toEqual(
                'http://localhost/fixtures?division=DIVISION&type=league',
            );
        });

        it('changes url to exclude filter', async () => {
            await renderComponent(
                { type: 'league', division: 'DIVISION' },
                {
                    name: 'DIVISION',
                    onReloadDivision,
                    setDivisionData,
                    teams: [],
                    favouritesEnabled: true,
                },
                {},
            );

            expect(getFilterOptionLink('type-filter', 'All fixtures')).toEqual(
                'http://localhost/fixtures?division=DIVISION',
            );
        });
    });

    describe('date', () => {
        it('when selected', async () => {
            await renderComponent(
                { date: 'past' },
                {
                    name: 'DIVISION',
                    teams: [],
                    onReloadDivision,
                    setDivisionData,
                },
            );

            const dropDown = context.required('.btn-group:nth-child(2)');
            expect(dropDown.optional('.dropdown-item.active')).toBeTruthy();
            expect(dropDown.optional('.dropdown-item.active')!.text()).toEqual(
                'Past dates',
            );
        });

        it('when specific 3-part date', async () => {
            const date = '2023-01-01';
            const expectedDate = renderDate(date);
            await renderComponent(
                { date },
                {
                    name: 'DIVISION',
                    teams: [],
                    onReloadDivision,
                    setDivisionData,
                },
            );

            const dropDown = context.required('.btn-group:nth-child(2)');
            expect(dropDown.optional('.dropdown-item.active')).toBeTruthy();
            expect(dropDown.optional('.dropdown-item.active')!.text()).toEqual(
                expectedDate,
            );
        });

        it('when unrecognised', async () => {
            await renderComponent(
                { date: 'foo' },
                {
                    name: 'DIVISION',
                    teams: [],
                    onReloadDivision,
                    setDivisionData,
                },
            );

            const dropDown = context.required('.btn-group:nth-child(2)');
            expect(dropDown.optional('.dropdown-item.active')).toBeTruthy();
            expect(dropDown.optional('.dropdown-item.active')!.text()).toEqual(
                'foo',
            );
        });

        it('when unselected', async () => {
            await renderComponent(
                {},
                {
                    name: 'DIVISION',
                    teams: [],
                    onReloadDivision,
                    setDivisionData,
                },
            );

            const dropDown = context.required(`[datatype="date-filter"]`);
            expect(dropDown.optional('.dropdown-item.active')).toBeTruthy();
            expect(dropDown.optional('.dropdown-item.active')!.text()).toEqual(
                'All dates',
            );
        });

        it('changes url to include filter', async () => {
            await renderComponent(
                { division: 'DIVISION' },
                {
                    name: 'DIVISION',
                    onReloadDivision,
                    setDivisionData,
                    teams: [],
                    favouritesEnabled: true,
                },
                {},
            );

            expect(getFilterOptionLink('date-filter', 'Future dates')).toEqual(
                'http://localhost/fixtures?division=DIVISION&date=future',
            );
        });

        it('changes url to exclude filter', async () => {
            await renderComponent(
                { date: '2023-01-01', division: 'DIVISION' },
                {
                    name: 'DIVISION',
                    onReloadDivision,
                    setDivisionData,
                    teams: [],
                    favouritesEnabled: true,
                },
                {},
            );

            expect(getFilterOptionLink('date-filter', 'All dates')).toEqual(
                'http://localhost/fixtures?division=DIVISION',
            );
        });
    });

    describe('team', () => {
        it('when selected', async () => {
            const team = teamBuilder('TEAM').build();
            await renderComponent(
                { team: 'TEAM' },
                {
                    name: 'DIVISION',
                    teams: [team],
                    onReloadDivision,
                    setDivisionData,
                },
            );

            const dropDown = context.required('.btn-group:nth-child(3)');
            expect(dropDown.optional('.dropdown-item.active')).toBeTruthy();
            expect(dropDown.optional('.dropdown-item.active')!.text()).toEqual(
                'TEAM',
            );
        });

        it('when unrecognised', async () => {
            const team = teamBuilder('TEAM').build();
            await renderComponent(
                { team: '1234' },
                {
                    name: 'DIVISION',
                    teams: [team],
                    onReloadDivision,
                    setDivisionData,
                },
            );

            const dropDown = context.required('.btn-group:nth-child(3)');
            expect(dropDown.optional('.dropdown-item.active')).toBeFalsy();
        });

        it('when unselected', async () => {
            await renderComponent(
                {},
                {
                    name: 'DIVISION',
                    teams: [],
                    onReloadDivision,
                    setDivisionData,
                },
            );

            const dropDown = context.required(`[datatype="team-filter"]`);
            expect(dropDown.optional('.dropdown-item.active')).toBeTruthy();
            expect(dropDown.optional('.dropdown-item.active')!.text()).toEqual(
                'All teams',
            );
        });

        it('changes url to include filter', async () => {
            const team = teamBuilder('TEAM').build();
            await renderComponent(
                { division: 'DIVISION' },
                {
                    name: 'DIVISION',
                    onReloadDivision,
                    setDivisionData,
                    teams: [team],
                    favouritesEnabled: true,
                },
                {},
            );

            expect(getFilterOptionLink('team-filter', 'TEAM')).toEqual(
                'http://localhost/fixtures?division=DIVISION&team=team',
            );
        });

        it('changes url to exclude filter', async () => {
            await renderComponent(
                { team: 'TEAM', division: 'DIVISION' },
                {
                    name: 'DIVISION',
                    onReloadDivision,
                    setDivisionData,
                    teams: [],
                    favouritesEnabled: true,
                },
                {},
            );

            expect(getFilterOptionLink('team-filter', 'All teams')).toEqual(
                'http://localhost/fixtures?division=DIVISION',
            );
        });
    });

    describe('clear filters', () => {
        it('clears filters', async () => {
            await renderComponent(
                { team: 'TEAM', division: 'DIVISION' },
                {
                    name: 'DIVISION',
                    onReloadDivision,
                    setDivisionData,
                    teams: [],
                    favouritesEnabled: true,
                },
                {},
            );
            const button = context
                .required('a[title="Clear all filters"]')
                .element<HTMLAnchorElement>();

            expect(button.href).toEqual(
                'http://localhost/fixtures?division=DIVISION',
            );
        });

        it('does not show button if no filters', async () => {
            await renderComponent(
                {},
                {
                    name: 'DIVISION',
                    onReloadDivision,
                    setDivisionData,
                    teams: [],
                    favouritesEnabled: true,
                },
                {},
            );

            expect(context.html()).not.toContain('➖');
        });
    });

    describe('favourites', () => {
        it('shows button when there are favourites and feature is enabled', async () => {
            await renderComponent(
                { team: 'TEAM' },
                {
                    name: 'DIVISION',
                    onReloadDivision,
                    setDivisionData,
                    teams: [],
                    favouritesEnabled: true,
                },
                {
                    favouriteTeamIds: ['1234'],
                },
            );

            const buttons = context.all('button.btn-outline-danger');
            expect(buttons.length).toEqual(1);
            expect(buttons[0].text()).toEqual('🌟');
        });

        it('does not show button when favourites are not enabled', async () => {
            await renderComponent(
                { team: 'TEAM' },
                {
                    name: 'DIVISION',
                    onReloadDivision,
                    setDivisionData,
                    teams: [],
                    favouritesEnabled: false,
                },
                {
                    favouriteTeamIds: ['1234'],
                },
            );

            const buttons = context.all('button.btn-outline-danger');
            expect(buttons.length).toEqual(0);
        });

        it('does show button when there are no favourites', async () => {
            await renderComponent(
                { team: 'TEAM' },
                {
                    name: 'DIVISION',
                    onReloadDivision,
                    setDivisionData,
                    teams: [],
                    favouritesEnabled: true,
                },
                {
                    favouriteTeamIds: [],
                },
            );

            const buttons = context.all('button.btn-outline-danger');
            expect(buttons.length).toEqual(0);
        });

        it('does not clear favourites when confirmation is cancelled', async () => {
            await renderComponent(
                { team: 'TEAM' },
                {
                    name: 'DIVISION',
                    onReloadDivision,
                    setDivisionData,
                    teams: [],
                    favouritesEnabled: true,
                },
                {
                    favouriteTeamIds: ['1234'],
                    someOtherPreference: 'FOO',
                },
            );
            context.prompts.respondToConfirm(
                'Are you sure you want to clear your favourites?',
                false,
            );

            await context.button('🌟').click();

            context.prompts.confirmWasShown(
                'Are you sure you want to clear your favourites?',
            );
            expect(context.cookies!.get('preferences')).toEqual({
                favouriteTeamIds: ['1234'],
                someOtherPreference: 'FOO',
            });
        });

        it('clears favourites when confirmation is accepted', async () => {
            await renderComponent(
                { team: 'TEAM' },
                {
                    name: 'DIVISION',
                    onReloadDivision,
                    setDivisionData,
                    teams: [],
                    favouritesEnabled: true,
                },
                {
                    favouriteTeamIds: ['1234'],
                    someOtherPreference: 'FOO',
                },
            );
            context.prompts.respondToConfirm(
                'Are you sure you want to clear your favourites?',
                true,
            );

            await context.button('🌟').click();

            expect(context.cookies!.get('preferences')).toEqual({
                someOtherPreference: 'FOO',
            });
        });
    });
});
