import {
    api,
    appProps,
    brandingProps,
    cleanUp, doChange,
    doClick, doSelectOption,
    ErrorState,
    findButton,
    iocProps, noop,
    renderApp, TestContext
} from "../../helpers/tests";
import {DivisionDataContainer, IDivisionDataContainerProps} from "../league/DivisionDataContainer";
import {EditTournamentGameDto} from "../../interfaces/models/dtos/Game/EditTournamentGameDto";
import {IClientActionResultDto} from "../common/IClientActionResultDto";
import {TournamentGameDto} from "../../interfaces/models/dtos/Game/TournamentGameDto";
import {ITournamentGameApi} from "../../interfaces/apis/ITournamentGameApi";
import {INewTournamentFixtureProps, NewTournamentFixture} from "./NewTournamentFixture";
import {divisionBuilder, fixtureDateBuilder, INoteBuilder} from "../../helpers/builders/divisions";
import {seasonBuilder} from "../../helpers/builders/seasons";
import {DivisionDto} from "../../interfaces/models/dtos/DivisionDto";
import {ITournamentBuilder, tournamentBuilder} from "../../helpers/builders/tournaments";
import {renderDate} from "../../helpers/rendering";
import {SeasonDto} from "../../interfaces/models/dtos/Season/SeasonDto";
import {DivisionFixtureDateDto} from "../../interfaces/models/dtos/Division/DivisionFixtureDateDto";

describe('NewTournamentFixture', () => {
    let context: TestContext;
    let reportedError: ErrorState;
    let tournamentChanged: boolean;
    let savedTournament: { data: EditTournamentGameDto, lastUpdated?: string } | null;
    let apiResponse: IClientActionResultDto<TournamentGameDto> | null;

    const tournamentApi = api<ITournamentGameApi>({
        update: async (data: EditTournamentGameDto, lastUpdated?: string) => {
            savedTournament = {data, lastUpdated};
            return apiResponse || {success: true};
        },
    });

    async function onTournamentChanged() {
        tournamentChanged = true;
    }

    function divisionData(division: DivisionDto, season: SeasonDto, ...fixtures: DivisionFixtureDateDto[]): IDivisionDataContainerProps {
        return {
            id: division.id,
            name: division.name,
            season: season,
            onReloadDivision: noop,
            setDivisionData: noop,
            fixtures,
        };
    }

    function props(date: string, ...tournamentFixtures: TournamentGameDto[]): INewTournamentFixtureProps {
        return {
            date,
            onTournamentChanged,
            tournamentFixtures,
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

    async function renderComponent(props: INewTournamentFixtureProps, divisionData: IDivisionDataContainerProps, divisions: DivisionDto[]) {
        context = await renderApp(
            iocProps({tournamentApi}),
            brandingProps(),
            appProps({ divisions }, reportedError),
            (<DivisionDataContainer {...divisionData}>
                <NewTournamentFixture {...props} />
            </DivisionDataContainer>),
            undefined,
            undefined,
            'tbody');
    }

    describe('renders', () => {
        const division1 = divisionBuilder('DIVISION 1').build();
        const division2 = divisionBuilder('DIVISION 2').build();
        const season = seasonBuilder('SEASON').build();
        const proposedFixture1 = tournamentBuilder().address('ADDRESS 1').proposed().build();
        const proposedFixture2 = tournamentBuilder().address('ADDRESS 2').proposed().build();

        it('renders all divisions - and cross-division option - in drop down', async () => {
            await renderComponent(
                props('2024-09-02'),
                divisionData(division1, season),
                [ division1, division2 ]);

            const divisionDropDown: Element = context.container.querySelector('.division-dropdown .dropdown-menu')!;
            const options = Array.from(divisionDropDown.querySelectorAll('.dropdown-item')).map(o => o.textContent);
            expect(options).toEqual(['Cross-divisional', 'DIVISION 1', 'DIVISION 2']);
        });

        it('renders all addresses in drop down', async () => {
            await renderComponent(
                props('2024-09-02', proposedFixture1, proposedFixture2),
                divisionData(division1, season),
                [ division1, division2 ]);

            const divisionDropDown: Element = context.container.querySelector('.address-dropdown .dropdown-menu')!;
            const options = Array.from(divisionDropDown.querySelectorAll('.dropdown-item')).map(o => o.textContent);
            expect(options).toEqual(['➕ Enter address', 'ADDRESS 1', 'ADDRESS 2']);
        });

        it('renders all tournament types in dropdown', async () => {
            const otherDate = fixtureDateBuilder('2024-08-29')
                .withTournament((t: ITournamentBuilder) => t
                    .type('SINGLES')
                    .winner('WINNER'))
                .build();
            await renderComponent(
                props('2024-09-02', proposedFixture1, proposedFixture2),
                divisionData(division1, season, otherDate),
                [ division1, division2 ]);

            const copySidesFromDropDown: Element = context.container.querySelector('.copy-sides-from-dropdown .dropdown-menu')!;
            const options = Array.from(copySidesFromDropDown.querySelectorAll('.dropdown-item')).map(o => o.textContent);
            expect(options).toEqual([ '-', `SINGLES - ${renderDate('2024-08-29')}`]);
        });

        it('renders notes from tournament dates if different types of tournament', async () => {
            const otherDate = fixtureDateBuilder('2024-08-29')
                .withTournament((t: ITournamentBuilder) => t
                    .type('SINGLES')
                    .winner('WINNER'))
                .withTournament((t: ITournamentBuilder) => t
                    .type('')
                    .winner('WINNER'))
                .withNote((n: INoteBuilder) => n.note('SINGLES'))
                .build();
            await renderComponent(
                props('2024-09-02', proposedFixture1, proposedFixture2),
                divisionData(division1, season, otherDate),
                [ division1, division2 ]);

            const copySidesFromDropDown: Element = context.container.querySelector('.copy-sides-from-dropdown .dropdown-menu')!;
            const options = Array.from(copySidesFromDropDown.querySelectorAll('.dropdown-item')).map(o => o.textContent);
            expect(options).toEqual([ '-', `SINGLES - ${renderDate('2024-08-29')}`]);
        });

        it('renders other tournaments when there are no unique types or notes', async () => {
            const otherDate = fixtureDateBuilder('2024-08-29')
                .withTournament((t: ITournamentBuilder) => t
                    .type('SINGLES')
                    .winner('WINNER'))
                .withTournament((t: ITournamentBuilder) => t
                    .type('')
                    .winner('WINNER'))
                .build();
            await renderComponent(
                props('2024-09-02', proposedFixture1, proposedFixture2),
                divisionData(division1, season, otherDate),
                [ division1, division2 ]);

            const copySidesFromDropDown: Element = context.container.querySelector('.copy-sides-from-dropdown .dropdown-menu')!;
            const options = Array.from(copySidesFromDropDown.querySelectorAll('.dropdown-item')).map(o => o.textContent);
            expect(options).toEqual([ '-', renderDate('2024-08-29') ]);
        });

        it('highlights addresses that are already in use', async () => {
            const fixture2 = tournamentBuilder()
                .address('ADDRESS 2') // in use
                .build();
            await renderComponent(
                props('2024-09-02', proposedFixture1, fixture2),
                divisionData(division1, season),
                [ division1, division2 ]);

            const addressDropDown: Element = context.container.querySelector('.address-dropdown .dropdown-menu')!;
            const options = Array.from(addressDropDown.querySelectorAll('.dropdown-item')).map(o => o.textContent);
            expect(options).toEqual(['➕ Enter address', 'ADDRESS 1', '⚠ ADDRESS 2 (Already in use)']);
        });
    });

    describe('interactivity', () => {
        const division1 = divisionBuilder('DIVISION 1').build();
        const division2 = divisionBuilder('DIVISION 2').build();
        const season = seasonBuilder('SEASON').starting('2024-09-02').ending('2024-09-07').build();
        const proposedFixture1 = tournamentBuilder().address('ADDRESS 1').proposed().build();

        it('prevents save when no address selected', async () => {
            await renderComponent(
                props('2024-09-02', proposedFixture1),
                divisionData(division1, season),
                [ division1, division2 ]);
            const saveButton = findButton(context.container, '➕');

            expect(saveButton.disabled).toEqual(true);
        });

        it('creates a cross-divisional tournament', async () => {
            await renderComponent(
                props('2024-09-02', proposedFixture1),
                divisionData(division1, season),
                [ division1, division2 ]);
            const saveButton = findButton(context.container, '➕');
            const divisionDropDown: Element = context.container.querySelector('.division-dropdown .dropdown-menu')!;
            const addressDropDown: Element = context.container.querySelector('.address-dropdown .dropdown-menu')!;

            await doSelectOption(divisionDropDown, 'Cross-divisional');
            await doSelectOption(addressDropDown, 'ADDRESS 1');
            await doClick(saveButton);

            expect(savedTournament).toEqual({
                data: {
                    date: '2024-09-02',
                    address: 'ADDRESS 1',
                    id: expect.any(String),
                    seasonId: season.id,
                    sides: [],
                    singleRound: false,
                }
            });
            expect(tournamentChanged).toEqual(true);
        });

        it('creates a divisional tournament', async () => {
            await renderComponent(
                props('2024-09-02', proposedFixture1),
                divisionData(division1, season),
                [ division1, division2 ]);
            const saveButton = findButton(context.container, '➕');
            const divisionDropDown: Element = context.container.querySelector('.division-dropdown .dropdown-menu')!;
            const addressDropDown: Element = context.container.querySelector('.address-dropdown .dropdown-menu')!;

            await doSelectOption(divisionDropDown, 'DIVISION 1');
            await doSelectOption(addressDropDown, 'ADDRESS 1');
            await doClick(saveButton);

            expect(savedTournament).toEqual({
                data: {
                    date: '2024-09-02',
                    divisionId: division1.id,
                    address: 'ADDRESS 1',
                    id: expect.any(String),
                    seasonId: season.id,
                    sides: [],
                    singleRound: false,
                }
            });
            expect(tournamentChanged).toEqual(true);
        });

        it('creates a superleague tournament', async () => {
            const superleagueDivision = divisionBuilder('SUPERLEAGUE DIVISION').superleague().build();

            await renderComponent(
                props('2024-09-02', proposedFixture1),
                divisionData(superleagueDivision, season),
                [ superleagueDivision, division2 ]);
            const saveButton = findButton(context.container, '➕');
            const divisionDropDown: Element = context.container.querySelector('.division-dropdown .dropdown-menu')!;
            const addressDropDown: Element = context.container.querySelector('.address-dropdown .dropdown-menu')!;

            await doSelectOption(divisionDropDown, 'SUPERLEAGUE DIVISION');
            await doSelectOption(addressDropDown, 'ADDRESS 1');
            await doClick(saveButton);

            expect(savedTournament).toEqual({
                data: {
                    date: '2024-09-02',
                    divisionId: superleagueDivision.id,
                    address: 'ADDRESS 1',
                    id: expect.any(String),
                    seasonId: season.id,
                    sides: [],
                    singleRound: true,
                }
            });
            expect(tournamentChanged).toEqual(true);
        });

        it('creates a divisional tournament for an in-use address', async () => {
            const fixture1 = tournamentBuilder()
                .address('ADDRESS 1')
                .build();
            await renderComponent(
                props('2024-09-02', fixture1),
                divisionData(division1, season),
                [ division1, division2 ]);
            const saveButton = findButton(context.container, '➕');
            const divisionDropDown: Element = context.container.querySelector('.division-dropdown .dropdown-menu')!;
            const addressDropDown: Element = context.container.querySelector('.address-dropdown .dropdown-menu')!;

            await doSelectOption(divisionDropDown, 'DIVISION 1');
            await doSelectOption(addressDropDown, '⚠ ADDRESS 1 (Already in use)');
            await doClick(saveButton);

            expect(savedTournament).toEqual({
                data: {
                    date: '2024-09-02',
                    divisionId: division1.id,
                    address: 'ADDRESS 1',
                    id: expect.any(String),
                    seasonId: season.id,
                    sides: [],
                    singleRound: false,
                }
            });
            expect(tournamentChanged).toEqual(true);
        });

        it('creates a divisional tournament copying winners from another date', async () => {
            const tournament = tournamentBuilder()
                .type('SINGLES')
                .winner('WINNER')
                .build();
            const otherDate = fixtureDateBuilder('2024-08-29')
                .withTournament(tournament)
                .build();
            await renderComponent(
                props('2024-09-02', proposedFixture1),
                divisionData(division1, season, otherDate),
                [ division1, division2 ]);
            const saveButton = findButton(context.container, '➕');
            const divisionDropDown: Element = context.container.querySelector('.division-dropdown .dropdown-menu')!;
            const addressDropDown: Element = context.container.querySelector('.address-dropdown .dropdown-menu')!;
            const copySidesFromDropDown: Element = context.container.querySelector('.copy-sides-from-dropdown .dropdown-menu')!;

            await doSelectOption(divisionDropDown, 'DIVISION 1');
            await doSelectOption(addressDropDown, 'ADDRESS 1');
            await doSelectOption(copySidesFromDropDown, `SINGLES - ${renderDate('2024-08-29')}`);
            await doClick(saveButton);

            expect(savedTournament).toEqual({
                data: {
                    date: '2024-09-02',
                    divisionId: division1.id,
                    address: 'ADDRESS 1',
                    id: expect.any(String),
                    seasonId: season.id,
                    sides: [ tournament.winningSide ],
                    type: 'SINGLES final',
                    singleRound: false,
                }
            });
            expect(tournamentChanged).toEqual(true);
        });

        it('displays an error if save is unsuccessful', async () => {
            await renderComponent(
                props('2024-09-02', proposedFixture1),
                divisionData(division1, season),
                [ division1, division2 ]);
            const saveButton = findButton(context.container, '➕');
            const divisionDropDown: Element = context.container.querySelector('.division-dropdown .dropdown-menu')!;
            const addressDropDown: Element = context.container.querySelector('.address-dropdown .dropdown-menu')!;
            apiResponse = { success: false, errors: [ 'SOME ERROR' ] };

            await doSelectOption(divisionDropDown, 'DIVISION 1');
            await doSelectOption(addressDropDown, 'ADDRESS 1');
            await doClick(saveButton);

            expect(context.container.innerHTML).toContain('SOME ERROR');
        });

        it('prompts if date is before season starts', async () => {
            await renderComponent(
                props('2024-09-01', proposedFixture1),
                divisionData(division1, season),
                [ division1, division2 ]);
            const saveButton = findButton(context.container, '➕');
            const divisionDropDown: Element = context.container.querySelector('.division-dropdown .dropdown-menu')!;
            const addressDropDown: Element = context.container.querySelector('.address-dropdown .dropdown-menu')!;
            apiResponse = { success: false, errors: [ 'SOME ERROR' ] };
            context.prompts.respondToConfirm('Tournament is outside of the dates for the season.\nYou will need to change the start/end date for the season to be able to see the fixture in the list.\n\nContinue?', true);

            await doSelectOption(divisionDropDown, 'DIVISION 1');
            await doSelectOption(addressDropDown, 'ADDRESS 1');
            await doClick(saveButton);

            context.prompts.confirmWasShown('Tournament is outside of the dates for the season.\nYou will need to change the start/end date for the season to be able to see the fixture in the list.\n\nContinue?');
        });

        it('prompts if date is after season ends', async () => {
            await renderComponent(
                props('2024-09-08', proposedFixture1),
                divisionData(division1, season),
                [ division1, division2 ]);
            const saveButton = findButton(context.container, '➕');
            const divisionDropDown: Element = context.container.querySelector('.division-dropdown .dropdown-menu')!;
            const addressDropDown: Element = context.container.querySelector('.address-dropdown .dropdown-menu')!;
            apiResponse = { success: false, errors: [ 'SOME ERROR' ] };
            context.prompts.respondToConfirm('Tournament is outside of the dates for the season.\nYou will need to change the start/end date for the season to be able to see the fixture in the list.\n\nContinue?', true);

            await doSelectOption(divisionDropDown, 'DIVISION 1');
            await doSelectOption(addressDropDown, 'ADDRESS 1');
            await doClick(saveButton);

            context.prompts.confirmWasShown('Tournament is outside of the dates for the season.\nYou will need to change the start/end date for the season to be able to see the fixture in the list.\n\nContinue?');
        });

        it('does not create fixture if outside of season dates', async () => {
            await renderComponent(
                props('2024-09-01', proposedFixture1),
                divisionData(division1, season),
                [ division1, division2 ]);
            const saveButton = findButton(context.container, '➕');
            const divisionDropDown: Element = context.container.querySelector('.division-dropdown .dropdown-menu')!;
            const addressDropDown: Element = context.container.querySelector('.address-dropdown .dropdown-menu')!;
            context.prompts.respondToConfirm('Tournament is outside of the dates for the season.\nYou will need to change the start/end date for the season to be able to see the fixture in the list.\n\nContinue?', false);

            await doSelectOption(divisionDropDown, 'DIVISION 1');
            await doSelectOption(addressDropDown, 'ADDRESS 1');
            await doClick(saveButton);

            context.prompts.confirmWasShown('Tournament is outside of the dates for the season.\nYou will need to change the start/end date for the season to be able to see the fixture in the list.\n\nContinue?');
            expect(savedTournament).toBeNull();
        });

        it('can close the error dialog if save was unsuccessful', async () => {
            await renderComponent(
                props('2024-09-02', proposedFixture1),
                divisionData(division1, season),
                [ division1, division2 ]);
            const divisionDropDown: Element = context.container.querySelector('.division-dropdown .dropdown-menu')!;
            const addressDropDown: Element = context.container.querySelector('.address-dropdown .dropdown-menu')!;
            apiResponse = { success: false, errors: [ 'SOME ERROR' ] };
            await doSelectOption(divisionDropDown, 'DIVISION 1');
            await doSelectOption(addressDropDown, 'ADDRESS 1');
            await doClick(findButton(context.container, '➕'));

            await doClick(findButton(context.container, 'Close'));

            expect(context.container.innerHTML).not.toContain('SOME ERROR');
        });

        it('clears the selected address after successful creation', async () => {
            await renderComponent(
                props('2024-09-02', proposedFixture1),
                divisionData(division1, season),
                [ division1, division2 ]);
            const saveButton = findButton(context.container, '➕');
            const divisionDropDown: Element = context.container.querySelector('.division-dropdown .dropdown-menu')!;
            const addressDropDown: Element = context.container.querySelector('.address-dropdown .dropdown-menu')!;

            await doSelectOption(divisionDropDown, 'DIVISION 1');
            await doSelectOption(addressDropDown, 'ADDRESS 1');
            await doClick(saveButton);

            const selectedAddresses = Array.from(addressDropDown.querySelectorAll('.active'));
            expect(selectedAddresses).toEqual([]);
        });

        it('can enter a custom address', async () => {
            await renderComponent(
                props('2024-09-02', proposedFixture1),
                divisionData(division1, season),
                [ division1, division2 ]);
            const addressDropDown: Element = context.container.querySelector('.address-dropdown .dropdown-menu')!;

            await doSelectOption(addressDropDown, '➕ Enter address');
            await doChange(context.container, 'input[name="address"]', 'CUSTOM', context.user);
            await doClick(findButton(context.container, 'Use address'));

            const addresses = Array.from(context.container.querySelectorAll('.address-dropdown .dropdown-menu .dropdown-item')).map(i => i.textContent);
            expect(addresses).toEqual(['➕ CUSTOM', 'ADDRESS 1']);
        });

        it('can cancel editing a custom address', async () => {
            await renderComponent(
                props('2024-09-02', proposedFixture1),
                divisionData(division1, season),
                [ division1, division2 ]);
            const addressDropDown: Element = context.container.querySelector('.address-dropdown .dropdown-menu')!;

            await doSelectOption(addressDropDown, '➕ Enter address');
            await doChange(context.container, 'input[name="address"]', 'CUSTOM', context.user);
            await doClick(findButton(context.container, 'Close'));

            const addresses = Array.from(context.container.querySelectorAll('.address-dropdown .dropdown-menu .dropdown-item')).map(i => i.textContent);
            expect(addresses).toEqual(['➕ Enter address', 'ADDRESS 1']);
        });

        it('can change custom address', async () => {
            await renderComponent(
                props('2024-09-02', proposedFixture1),
                divisionData(division1, season),
                [ division1, division2 ]);
            await doSelectOption(context.container.querySelector('.address-dropdown .dropdown-menu'), '➕ Enter address');
            await doChange(context.container, 'input[name="address"]', 'CUSTOM', context.user);
            await doClick(findButton(context.container, 'Use address'));

            await doSelectOption(context.container.querySelector('.address-dropdown .dropdown-menu'), '➕ CUSTOM');
            await doChange(context.container, 'input[name="address"]', 'NEW CUSTOM', context.user);
            await doClick(findButton(context.container, 'Use address'));

            const addresses = Array.from(context.container.querySelectorAll('.address-dropdown .dropdown-menu .dropdown-item')).map(i => i.textContent);
            expect(addresses).toEqual(['➕ NEW CUSTOM', 'ADDRESS 1']);
        });

        it('can create a tournament with a custom address', async () => {
            await renderComponent(
                props('2024-09-02', proposedFixture1),
                divisionData(division1, season),
                [ division1, division2 ]);
            const addressDropDown: Element = context.container.querySelector('.address-dropdown .dropdown-menu')!;
            const divisionDropDown: Element = context.container.querySelector('.division-dropdown .dropdown-menu')!;
            const saveButton = findButton(context.container, '➕');

            await doSelectOption(divisionDropDown, 'DIVISION 1');
            await doSelectOption(addressDropDown, '➕ Enter address');
            await doChange(context.container, 'input[name="address"]', 'CUSTOM', context.user);
            await doClick(findButton(context.container, 'Use address'));
            await doClick(saveButton);

            expect(savedTournament).toEqual({
                data: {
                    date: '2024-09-02',
                    divisionId: division1.id,
                    address: 'CUSTOM',
                    id: expect.any(String),
                    seasonId: season.id,
                    sides: [ ],
                    singleRound: false,
                }
            });
            expect(tournamentChanged).toEqual(true);
        });
    });
});