import {
    api,
    appProps,
    brandingProps,
    cleanUp,
    ErrorState,
    iocProps,
    noop,
    renderApp,
    TestContext,
} from '../../helpers/tests';
import {
    DivisionDataContainer,
    IDivisionDataContainerProps,
} from '../league/DivisionDataContainer';
import { EditTournamentGameDto } from '../../interfaces/models/dtos/Game/EditTournamentGameDto';
import { IClientActionResultDto } from '../common/IClientActionResultDto';
import { TournamentGameDto } from '../../interfaces/models/dtos/Game/TournamentGameDto';
import { ITournamentGameApi } from '../../interfaces/apis/ITournamentGameApi';
import {
    INewTournamentFixtureProps,
    NewTournamentFixture,
} from './NewTournamentFixture';
import {
    divisionBuilder,
    fixtureDateBuilder,
} from '../../helpers/builders/divisions';
import { seasonBuilder } from '../../helpers/builders/seasons';
import { DivisionDto } from '../../interfaces/models/dtos/DivisionDto';
import { tournamentBuilder } from '../../helpers/builders/tournaments';
import { renderDate } from '../../helpers/rendering';
import { SeasonDto } from '../../interfaces/models/dtos/Season/SeasonDto';
import { DivisionFixtureDateDto } from '../../interfaces/models/dtos/Division/DivisionFixtureDateDto';

describe('NewTournamentFixture', () => {
    let context: TestContext;
    let reportedError: ErrorState;
    let tournamentChanged: boolean;
    let savedTournament: {
        data: EditTournamentGameDto;
        lastUpdated?: string;
    } | null;
    let apiResponse: IClientActionResultDto<TournamentGameDto> | null;

    const tournamentApi = api<ITournamentGameApi>({
        update: async (data: EditTournamentGameDto, lastUpdated?: string) => {
            savedTournament = { data, lastUpdated };
            return apiResponse || { success: true };
        },
    });

    async function onTournamentChanged() {
        tournamentChanged = true;
    }

    function divisionData(
        division: DivisionDto,
        season: SeasonDto,
        ...fixtures: DivisionFixtureDateDto[]
    ): IDivisionDataContainerProps {
        return {
            id: division.id,
            name: division.name,
            season: season,
            onReloadDivision: noop,
            setDivisionData: noop,
            fixtures,
        };
    }

    function props(
        date: string,
        ...tournamentFixtures: TournamentGameDto[]
    ): INewTournamentFixtureProps {
        return {
            date,
            onTournamentChanged,
            tournamentFixtures,
            allowCopySidesFrom: true,
        };
    }

    afterEach(async () => {
        await cleanUp(context);
    });

    beforeEach(() => {
        reportedError = new ErrorState();
        tournamentChanged = false;
        savedTournament = null;
        apiResponse = null;
    });

    async function renderComponent(
        props: INewTournamentFixtureProps,
        divisionData: IDivisionDataContainerProps,
        divisions: DivisionDto[],
    ) {
        context = await renderApp(
            iocProps({ tournamentApi }),
            brandingProps(),
            appProps({ divisions }, reportedError),
            <DivisionDataContainer {...divisionData}>
                <NewTournamentFixture {...props} />
            </DivisionDataContainer>,
            undefined,
            undefined,
            'tbody',
        );
    }

    describe('renders', () => {
        const division1 = divisionBuilder('DIVISION 1').build();
        const division2 = divisionBuilder('DIVISION 2').build();
        const season = seasonBuilder('SEASON').build();
        const proposedFixture1 = tournamentBuilder()
            .address('ADDRESS 1')
            .proposed()
            .build();
        const proposedFixture2 = tournamentBuilder()
            .address('ADDRESS 2')
            .proposed()
            .build();

        it('renders all divisions - and cross-division option - in drop down', async () => {
            await renderComponent(
                props('2024-09-02'),
                divisionData(division1, season),
                [division1, division2],
            );

            const divisionDropDown = context.required(
                '.division-dropdown .dropdown-menu',
            );
            const options = divisionDropDown
                .all('.dropdown-item')
                .map((o) => o.text());
            expect(options).toEqual([
                'Cross-divisional',
                'DIVISION 1',
                'DIVISION 2',
            ]);
        });

        it('renders all addresses in drop down', async () => {
            await renderComponent(
                props('2024-09-02', proposedFixture1, proposedFixture2),
                divisionData(division1, season),
                [division1, division2],
            );

            const addressMenu = context.required(
                '.address-dropdown .dropdown-menu',
            );
            const options = addressMenu
                .all('.dropdown-item')
                .map((o) => o.text());
            expect(options).toEqual([
                '➕ Enter address',
                'ADDRESS 1',
                'ADDRESS 2',
            ]);
        });

        it('renders all tournament types in dropdown', async () => {
            const otherDate = fixtureDateBuilder('2024-08-29')
                .withTournament((t) => t.type('SINGLES').winner('WINNER'))
                .build();
            await renderComponent(
                props('2024-09-02', proposedFixture1, proposedFixture2),
                divisionData(division1, season, otherDate),
                [division1, division2],
            );

            const copySidesFromDropDown = context.required(
                '.copy-sides-from-dropdown .dropdown-menu',
            );
            const options = copySidesFromDropDown
                .all('.dropdown-item')
                .map((o) => o.text());
            expect(options).toEqual([
                '-',
                `SINGLES - ${renderDate('2024-08-29')}`,
            ]);
        });

        it('renders notes from tournament dates if different types of tournament', async () => {
            const otherDate = fixtureDateBuilder('2024-08-29')
                .withTournament((t) => t.type('SINGLES').winner('WINNER'))
                .withTournament((t) => t.type('').winner('WINNER'))
                .withNote((n) => n.note('SINGLES'))
                .build();
            await renderComponent(
                props('2024-09-02', proposedFixture1, proposedFixture2),
                divisionData(division1, season, otherDate),
                [division1, division2],
            );

            const copySidesFromDropDown = context.required(
                '.copy-sides-from-dropdown .dropdown-menu',
            );
            const options = copySidesFromDropDown
                .all('.dropdown-item')
                .map((o) => o.text());
            expect(options).toEqual([
                '-',
                `SINGLES - ${renderDate('2024-08-29')}`,
            ]);
        });

        it('renders other tournaments when there are no unique types or notes', async () => {
            const otherDate = fixtureDateBuilder('2024-08-29')
                .withTournament((t) => t.type('SINGLES').winner('WINNER'))
                .withTournament((t) => t.type('').winner('WINNER'))
                .build();
            await renderComponent(
                props('2024-09-02', proposedFixture1, proposedFixture2),
                divisionData(division1, season, otherDate),
                [division1, division2],
            );

            const copySidesFromDropDown = context.required(
                '.copy-sides-from-dropdown .dropdown-menu',
            );
            const options = copySidesFromDropDown
                .all('.dropdown-item')
                .map((o) => o.text());
            expect(options).toEqual(['-', renderDate('2024-08-29')]);
        });

        it('highlights addresses that are already in use', async () => {
            const fixture2 = tournamentBuilder()
                .address('ADDRESS 2') // in use
                .build();
            await renderComponent(
                props('2024-09-02', proposedFixture1, fixture2),
                divisionData(division1, season),
                [division1, division2],
            );

            const addressMenu = context.required(
                '.address-dropdown .dropdown-menu',
            );
            const options = addressMenu
                .all('.dropdown-item')
                .map((o) => o.text());
            expect(options).toEqual([
                '➕ Enter address',
                'ADDRESS 1',
                '⚠ ADDRESS 2 (Already in use)',
            ]);
        });
    });

    describe('interactivity', () => {
        const division1 = divisionBuilder('DIVISION 1').build();
        const division2 = divisionBuilder('DIVISION 2').build();
        const season = seasonBuilder('SEASON')
            .starting('2024-09-02')
            .ending('2024-09-07')
            .build();
        const proposedFixture1 = tournamentBuilder()
            .address('ADDRESS 1')
            .proposed()
            .build();

        it('prevents save when no address selected', async () => {
            await renderComponent(
                props('2024-09-02', proposedFixture1),
                divisionData(division1, season),
                [division1, division2],
            );
            const saveButton = context.button('➕');

            expect(saveButton.enabled()).toEqual(false);
        });

        it('creates a cross-divisional tournament', async () => {
            await renderComponent(
                props('2024-09-02', proposedFixture1),
                divisionData(division1, season),
                [division1, division2],
            );
            const saveButton = context.button('➕');
            const divisionDropDown = context.required(
                '.division-dropdown .dropdown-menu',
            );
            const addressDropDown = context.required(
                '.address-dropdown .dropdown-menu',
            );

            await divisionDropDown.select('Cross-divisional');
            await addressDropDown.select('ADDRESS 1');
            await saveButton.click();

            expect(savedTournament).toEqual({
                data: {
                    date: '2024-09-02',
                    address: 'ADDRESS 1',
                    id: expect.any(String),
                    seasonId: season.id,
                    sides: [],
                    singleRound: false,
                },
            });
            expect(tournamentChanged).toEqual(true);
        });

        it('creates a divisional tournament', async () => {
            await renderComponent(
                props('2024-09-02', proposedFixture1),
                divisionData(division1, season),
                [division1, division2],
            );
            const saveButton = context.button('➕');
            const divisionDropDown = context.required(
                '.division-dropdown .dropdown-menu',
            );
            const addressDropDown = context.required(
                '.address-dropdown .dropdown-menu',
            );

            await divisionDropDown.select('DIVISION 1');
            await addressDropDown.select('ADDRESS 1');
            await saveButton.click();

            expect(savedTournament).toEqual({
                data: {
                    date: '2024-09-02',
                    divisionId: division1.id,
                    address: 'ADDRESS 1',
                    id: expect.any(String),
                    seasonId: season.id,
                    sides: [],
                    singleRound: false,
                },
            });
            expect(tournamentChanged).toEqual(true);
        });

        it('creates a superleague tournament', async () => {
            const superleagueDivision = divisionBuilder('SUPERLEAGUE DIVISION')
                .superleague()
                .build();

            await renderComponent(
                props('2024-09-02', proposedFixture1),
                divisionData(superleagueDivision, season),
                [superleagueDivision, division2],
            );
            const saveButton = context.button('➕');
            const divisionDropDown = context.required(
                '.division-dropdown .dropdown-menu',
            );
            const addressDropDown = context.required(
                '.address-dropdown .dropdown-menu',
            );

            await divisionDropDown.select('SUPERLEAGUE DIVISION');
            await addressDropDown.select('ADDRESS 1');
            await saveButton.click();

            expect(savedTournament).toEqual({
                data: {
                    date: '2024-09-02',
                    divisionId: superleagueDivision.id,
                    address: 'ADDRESS 1',
                    id: expect.any(String),
                    seasonId: season.id,
                    sides: [],
                    singleRound: true,
                    bestOf: 7,
                },
            });
            expect(tournamentChanged).toEqual(true);
        });

        it('creates a divisional tournament for an in-use address', async () => {
            const fixture1 = tournamentBuilder().address('ADDRESS 1').build();
            await renderComponent(
                props('2024-09-02', fixture1),
                divisionData(division1, season),
                [division1, division2],
            );
            const saveButton = context.button('➕');
            const divisionDropDown = context.required(
                '.division-dropdown .dropdown-menu',
            );
            const addressDropDown = context.required(
                '.address-dropdown .dropdown-menu',
            );

            await divisionDropDown.select('DIVISION 1');
            await addressDropDown.select('⚠ ADDRESS 1 (Already in use)');
            await saveButton.click();

            expect(savedTournament).toEqual({
                data: {
                    date: '2024-09-02',
                    divisionId: division1.id,
                    address: 'ADDRESS 1',
                    id: expect.any(String),
                    seasonId: season.id,
                    sides: [],
                    singleRound: false,
                },
            });
            expect(tournamentChanged).toEqual(true);
        });

        it('creates a divisional tournament copying winners from another date', async () => {
            const otherDate = fixtureDateBuilder('2024-08-29')
                .withTournament((b) => b.type('SINGLES').winner('WINNER'))
                .build();
            await renderComponent(
                props('2024-09-02', proposedFixture1),
                divisionData(division1, season, otherDate),
                [division1, division2],
            );
            const saveButton = context.button('➕');
            const divisionDropDown = context.required(
                '.division-dropdown .dropdown-menu',
            );
            const addressDropDown = context.required(
                '.address-dropdown .dropdown-menu',
            );
            const copySidesFromDropDown = context.required(
                '.copy-sides-from-dropdown .dropdown-menu',
            );

            await divisionDropDown.select('DIVISION 1');
            await addressDropDown.select('ADDRESS 1');
            await copySidesFromDropDown.select(
                `SINGLES - ${renderDate('2024-08-29')}`,
            );
            await saveButton.click();

            expect(savedTournament).toEqual({
                data: {
                    date: '2024-09-02',
                    divisionId: division1.id,
                    address: 'ADDRESS 1',
                    id: expect.any(String),
                    seasonId: season.id,
                    sides: [
                        {
                            id: expect.any(String),
                            name: 'WINNER',
                        },
                    ],
                    type: 'SINGLES final',
                    singleRound: false,
                },
            });
            expect(tournamentChanged).toEqual(true);
        });

        it('displays an error if save is unsuccessful', async () => {
            await renderComponent(
                props('2024-09-02', proposedFixture1),
                divisionData(division1, season),
                [division1, division2],
            );
            const saveButton = context.button('➕');
            const divisionDropDown = context.required(
                '.division-dropdown .dropdown-menu',
            );
            const addressDropDown = context.required(
                '.address-dropdown .dropdown-menu',
            );
            apiResponse = { success: false, errors: ['SOME ERROR'] };

            await divisionDropDown.select('DIVISION 1');
            await addressDropDown.select('ADDRESS 1');
            await saveButton.click();

            expect(context.html()).toContain('SOME ERROR');
        });

        it('prompts if date is before season starts', async () => {
            await renderComponent(
                props('2024-09-01', proposedFixture1),
                divisionData(division1, season),
                [division1, division2],
            );
            const saveButton = context.button('➕');
            const divisionDropDown = context.required(
                '.division-dropdown .dropdown-menu',
            );
            const addressDropDown = context.required(
                '.address-dropdown .dropdown-menu',
            );
            apiResponse = { success: false, errors: ['SOME ERROR'] };
            context.prompts.respondToConfirm(
                'Tournament is outside of the dates for the season.\nYou will need to change the start/end date for the season to be able to see the fixture in the list.\n\nContinue?',
                true,
            );

            await divisionDropDown.select('DIVISION 1');
            await addressDropDown.select('ADDRESS 1');
            await saveButton.click();

            context.prompts.confirmWasShown(
                'Tournament is outside of the dates for the season.\nYou will need to change the start/end date for the season to be able to see the fixture in the list.\n\nContinue?',
            );
        });

        it('prompts if date is after season ends', async () => {
            await renderComponent(
                props('2024-09-08', proposedFixture1),
                divisionData(division1, season),
                [division1, division2],
            );
            const saveButton = context.button('➕');
            const divisionDropDown = context.required(
                '.division-dropdown .dropdown-menu',
            );
            const addressDropDown = context.required(
                '.address-dropdown .dropdown-menu',
            );
            apiResponse = { success: false, errors: ['SOME ERROR'] };
            context.prompts.respondToConfirm(
                'Tournament is outside of the dates for the season.\nYou will need to change the start/end date for the season to be able to see the fixture in the list.\n\nContinue?',
                true,
            );

            await divisionDropDown.select('DIVISION 1');
            await addressDropDown.select('ADDRESS 1');
            await saveButton.click();

            context.prompts.confirmWasShown(
                'Tournament is outside of the dates for the season.\nYou will need to change the start/end date for the season to be able to see the fixture in the list.\n\nContinue?',
            );
        });

        it('does not create fixture if outside of season dates', async () => {
            await renderComponent(
                props('2024-09-01', proposedFixture1),
                divisionData(division1, season),
                [division1, division2],
            );
            const saveButton = context.button('➕');
            const divisionDropDown = context.required(
                '.division-dropdown .dropdown-menu',
            );
            const addressDropDown = context.required(
                '.address-dropdown .dropdown-menu',
            );
            context.prompts.respondToConfirm(
                'Tournament is outside of the dates for the season.\nYou will need to change the start/end date for the season to be able to see the fixture in the list.\n\nContinue?',
                false,
            );

            await divisionDropDown.select('DIVISION 1');
            await addressDropDown.select('ADDRESS 1');
            await saveButton.click();

            context.prompts.confirmWasShown(
                'Tournament is outside of the dates for the season.\nYou will need to change the start/end date for the season to be able to see the fixture in the list.\n\nContinue?',
            );
            expect(savedTournament).toBeNull();
        });

        it('can close the error dialog if save was unsuccessful', async () => {
            await renderComponent(
                props('2024-09-02', proposedFixture1),
                divisionData(division1, season),
                [division1, division2],
            );
            const divisionDropDown = context.required(
                '.division-dropdown .dropdown-menu',
            );
            const addressDropDown = context.required(
                '.address-dropdown .dropdown-menu',
            );
            apiResponse = { success: false, errors: ['SOME ERROR'] };
            await divisionDropDown.select('DIVISION 1');
            await addressDropDown.select('ADDRESS 1');
            await context.button('➕').click();

            await context.button('Close').click();

            expect(context.html()).not.toContain('SOME ERROR');
        });

        it('clears the selected address after successful creation', async () => {
            await renderComponent(
                props('2024-09-02', proposedFixture1),
                divisionData(division1, season),
                [division1, division2],
            );
            const saveButton = context.button('➕');
            const divisionDropDown = context.required(
                '.division-dropdown .dropdown-menu',
            );
            const addressDropDown = context.required(
                '.address-dropdown .dropdown-menu',
            );

            await divisionDropDown.select('DIVISION 1');
            await addressDropDown.select('ADDRESS 1');
            await saveButton.click();

            expect(addressDropDown.all('.active')).toEqual([]);
        });

        it('can enter a custom address', async () => {
            await renderComponent(
                props('2024-09-02', proposedFixture1),
                divisionData(division1, season),
                [division1, division2],
            );
            const addressDropDown = context.required(
                '.address-dropdown .dropdown-menu',
            );

            await addressDropDown.select('➕ Enter address');
            await context.input('address').change('CUSTOM');
            await context.button('Use address').click();

            const addresses = context
                .required('.address-dropdown .dropdown-menu')
                .all('.dropdown-item')
                .map((i) => i.text());
            expect(addresses).toEqual(['➕ CUSTOM', 'ADDRESS 1']);
        });

        it('can cancel editing a custom address', async () => {
            await renderComponent(
                props('2024-09-02', proposedFixture1),
                divisionData(division1, season),
                [division1, division2],
            );
            const addressDropDown = context.required(
                '.address-dropdown .dropdown-menu',
            );

            await addressDropDown.select('➕ Enter address');
            await context.input('address').change('CUSTOM');
            await context.button('Close').click();

            const addresses = context
                .required('.address-dropdown .dropdown-menu')
                .all('.dropdown-item')
                .map((i) => i.text());
            expect(addresses).toEqual(['➕ Enter address', 'ADDRESS 1']);
        });

        it('can change custom address', async () => {
            await renderComponent(
                props('2024-09-02', proposedFixture1),
                divisionData(division1, season),
                [division1, division2],
            );
            await context
                .required('.address-dropdown .dropdown-menu')
                .select('➕ Enter address');
            await context.input('address').change('CUSTOM');
            await context.button('Use address').click();

            await context
                .required('.address-dropdown .dropdown-menu')
                .select('➕ CUSTOM');
            await context.input('address').change('NEW CUSTOM');
            await context.button('Use address').click();

            const addresses = context
                .required('.address-dropdown .dropdown-menu')
                .all('.dropdown-item')
                .map((i) => i.text());
            expect(addresses).toEqual(['➕ NEW CUSTOM', 'ADDRESS 1']);
        });

        it('can create a tournament with a custom address', async () => {
            await renderComponent(
                props('2024-09-02', proposedFixture1),
                divisionData(division1, season),
                [division1, division2],
            );
            const addressDropDown = context.required(
                '.address-dropdown .dropdown-menu',
            );
            const divisionDropDown = context.required(
                '.division-dropdown .dropdown-menu',
            );
            const saveButton = context.button('➕');

            await divisionDropDown.select('DIVISION 1');
            await addressDropDown.select('➕ Enter address');
            await context.input('address').change('CUSTOM');
            await context.button('Use address').click();
            await saveButton.click();

            expect(savedTournament).toEqual({
                data: {
                    date: '2024-09-02',
                    divisionId: division1.id,
                    address: 'CUSTOM',
                    id: expect.any(String),
                    seasonId: season.id,
                    sides: [],
                    singleRound: false,
                },
            });
            expect(tournamentChanged).toEqual(true);
        });
    });
});
