import {
    api,
    appProps,
    brandingProps,
    cleanUp,
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

describe('NewTournamentFixture', () => {
    let context: TestContext;
    let reportedError: ErrorState;
    let tournamentChanged: boolean;
    let savedTournament: { data: EditTournamentGameDto, lastUpdated?: string };
    let apiResponse: IClientActionResultDto<TournamentGameDto>;

    const tournamentApi = api<ITournamentGameApi>({
        update: async (data: EditTournamentGameDto, lastUpdated?: string) => {
            savedTournament = {data, lastUpdated};
            return apiResponse || {success: true};
        },
    });

    async function onTournamentChanged() {
        tournamentChanged = true;
    }

    afterEach(() => {
        cleanUp(context);
    });

    beforeEach(() => {
        reportedError = new ErrorState();
        tournamentChanged = null;
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
            null,
            null,
            'tbody');
    }

    describe('renders', () => {
        const division1 = divisionBuilder('DIVISION 1')
            .build();
        const division2 = divisionBuilder('DIVISION 2')
            .build();
        const season = seasonBuilder('SEASON').build();

        it('renders all divisions - and cross-division option - in drop down', async () => {
            await renderComponent({
                date: '2024-09-02',
                onTournamentChanged,
                tournamentFixtures: [],
            }, {
                id: division1.id,
                name: division1.name,
                season: season,
                onReloadDivision: noop,
                setDivisionData: noop,
            },
            [ division1, division2 ]);

            const divisionDropDown: Element = context.container.querySelector('.division-dropdown .dropdown-menu');
            const options = Array.from(divisionDropDown.querySelectorAll('.dropdown-item')).map(o => o.textContent);
            expect(options).toEqual(['Cross-divisional', 'DIVISION 1', 'DIVISION 2']);
        });

        it('renders all addresses in drop down', async () => {
            const fixture1 = tournamentBuilder()
                .address('ADDRESS 1')
                .proposed()
                .build();
            const fixture2 = tournamentBuilder()
                .address('ADDRESS 2')
                .proposed()
                .build();
            await renderComponent({
                    date: '2024-09-02',
                    onTournamentChanged,
                    tournamentFixtures: [ fixture1, fixture2 ],
                }, {
                    id: division1.id,
                    name: division1.name,
                    season: season,
                    onReloadDivision: noop,
                    setDivisionData: noop,
                },
                [ division1, division2 ]);

            const divisionDropDown: Element = context.container.querySelector('.address-dropdown .dropdown-menu');
            const options = Array.from(divisionDropDown.querySelectorAll('.dropdown-item')).map(o => o.textContent);
            expect(options).toEqual(['ADDRESS 1', 'ADDRESS 2']);
        });

        it('renders all tournament types in dropdown', async () => {
            const fixture1 = tournamentBuilder()
                .address('ADDRESS 1')
                .proposed()
                .build();
            const fixture2 = tournamentBuilder()
                .address('ADDRESS 2')
                .proposed()
                .build();
            const otherDate = fixtureDateBuilder('2024-08-29')
                .withTournament((t: ITournamentBuilder) => t
                    .type('SINGLES')
                    .winner('WINNER'))
                .build();
            await renderComponent({
                    date: '2024-09-02',
                    onTournamentChanged,
                    tournamentFixtures: [ fixture1, fixture2 ],
                }, {
                    id: division1.id,
                    name: division1.name,
                    season: season,
                    onReloadDivision: noop,
                    setDivisionData: noop,
                    fixtures: [ otherDate ]
                },
                [ division1, division2 ]);

            const copySidesFromDropDown: Element = context.container.querySelector('.copy-sides-from-dropdown .dropdown-menu');
            const options = Array.from(copySidesFromDropDown.querySelectorAll('.dropdown-item')).map(o => o.textContent);
            expect(options).toEqual([ '-', `SINGLES - ${renderDate('2024-08-29')}`]);
        });

        it('renders notes from tournament dates if different types of tournament', async () => {
            const fixture1 = tournamentBuilder()
                .address('ADDRESS 1')
                .proposed()
                .build();
            const fixture2 = tournamentBuilder()
                .address('ADDRESS 2')
                .proposed()
                .build();
            const otherDate = fixtureDateBuilder('2024-08-29')
                .withTournament((t: ITournamentBuilder) => t
                    .type('SINGLES')
                    .winner('WINNER'))
                .withTournament((t: ITournamentBuilder) => t
                    .type('')
                    .winner('WINNER'))
                .withNote((n: INoteBuilder) => n.note('SINGLES'))
                .build();
            await renderComponent({
                    date: '2024-09-02',
                    onTournamentChanged,
                    tournamentFixtures: [ fixture1, fixture2 ],
                }, {
                    id: division1.id,
                    name: division1.name,
                    season: season,
                    onReloadDivision: noop,
                    setDivisionData: noop,
                    fixtures: [ otherDate ]
                },
                [ division1, division2 ]);

            const copySidesFromDropDown: Element = context.container.querySelector('.copy-sides-from-dropdown .dropdown-menu');
            const options = Array.from(copySidesFromDropDown.querySelectorAll('.dropdown-item')).map(o => o.textContent);
            expect(options).toEqual([ '-', `SINGLES - ${renderDate('2024-08-29')}`]);
        });

        it('renders other tournaments when there are no unique types or notes', async () => {
            const fixture1 = tournamentBuilder()
                .address('ADDRESS 1')
                .proposed()
                .build();
            const fixture2 = tournamentBuilder()
                .address('ADDRESS 2')
                .proposed()
                .build();
            const otherDate = fixtureDateBuilder('2024-08-29')
                .withTournament((t: ITournamentBuilder) => t
                    .type('SINGLES')
                    .winner('WINNER'))
                .withTournament((t: ITournamentBuilder) => t
                    .type('')
                    .winner('WINNER'))
                .build();
            await renderComponent({
                    date: '2024-09-02',
                    onTournamentChanged,
                    tournamentFixtures: [ fixture1, fixture2 ],
                }, {
                    id: division1.id,
                    name: division1.name,
                    season: season,
                    onReloadDivision: noop,
                    setDivisionData: noop,
                    fixtures: [ otherDate ]
                },
                [ division1, division2 ]);

            const copySidesFromDropDown: Element = context.container.querySelector('.copy-sides-from-dropdown .dropdown-menu');
            const options = Array.from(copySidesFromDropDown.querySelectorAll('.dropdown-item')).map(o => o.textContent);
            expect(options).toEqual([ '-', renderDate('2024-08-29') ]);
        });

        it('highlights addresses that are already in use', async () => {
            const fixture1 = tournamentBuilder()
                .address('ADDRESS 1')
                .proposed()
                .build();
            const fixture2 = tournamentBuilder()
                .address('ADDRESS 2') // in use
                .build();
            await renderComponent({
                    date: '2024-09-02',
                    onTournamentChanged,
                    tournamentFixtures: [ fixture1, fixture2 ],
                }, {
                    id: division1.id,
                    name: division1.name,
                    season: season,
                    onReloadDivision: noop,
                    setDivisionData: noop,
                },
                [ division1, division2 ]);

            const addressDropDown: Element = context.container.querySelector('.address-dropdown .dropdown-menu');
            const options = Array.from(addressDropDown.querySelectorAll('.dropdown-item')).map(o => o.textContent);
            expect(options).toEqual(['ADDRESS 1', '⚠ ADDRESS 2 (Already in use)']);
        });
    });

    describe('interactivity', () => {
        const division1 = divisionBuilder('DIVISION 1')
            .build();
        const division2 = divisionBuilder('DIVISION 2')
            .build();
        const season = seasonBuilder('SEASON').build();

        it('prevents save when no address selected', async () => {
            const fixture1 = tournamentBuilder()
                .address('ADDRESS 1')
                .proposed()
                .build();
            await renderComponent({
                    date: '2024-09-02',
                    onTournamentChanged,
                    tournamentFixtures: [ fixture1 ],
                }, {
                    id: division1.id,
                    name: division1.name,
                    season: season,
                    onReloadDivision: noop,
                    setDivisionData: noop,
                },
                [ division1, division2 ]);
            const saveButton = findButton(context.container, '➕');

            expect(saveButton.disabled).toEqual(true);
        });

        it('creates a cross-divisional tournament', async () => {
            const fixture1 = tournamentBuilder()
                .address('ADDRESS 1')
                .proposed()
                .build();
            await renderComponent({
                    date: '2024-09-02',
                    onTournamentChanged,
                    tournamentFixtures: [ fixture1 ],
                }, {
                    id: division1.id,
                    name: division1.name,
                    season: season,
                    onReloadDivision: noop,
                    setDivisionData: noop,
                },
                [ division1, division2 ]);
            const saveButton = findButton(context.container, '➕');
            const divisionDropDown: Element = context.container.querySelector('.division-dropdown .dropdown-menu');
            const addressDropDown: Element = context.container.querySelector('.address-dropdown .dropdown-menu');

            await doSelectOption(divisionDropDown, 'Cross-divisional');
            await doSelectOption(addressDropDown, 'ADDRESS 1');
            await doClick(saveButton);

            expect(savedTournament).toEqual({
                data: {
                    date: '2024-09-02',
                    divisionId: null,
                    address: 'ADDRESS 1',
                    id: expect.any(String),
                    seasonId: season.id,
                    sides: [],
                    type: null,
                }
            });
            expect(tournamentChanged).toEqual(true);
        });

        it('creates a divisional tournament', async () => {
            const fixture1 = tournamentBuilder()
                .address('ADDRESS 1')
                .proposed()
                .build();
            await renderComponent({
                    date: '2024-09-02',
                    onTournamentChanged,
                    tournamentFixtures: [ fixture1 ],
                }, {
                    id: division1.id,
                    name: division1.name,
                    season: season,
                    onReloadDivision: noop,
                    setDivisionData: noop,
                },
                [ division1, division2 ]);
            const saveButton = findButton(context.container, '➕');
            const divisionDropDown: Element = context.container.querySelector('.division-dropdown .dropdown-menu');
            const addressDropDown: Element = context.container.querySelector('.address-dropdown .dropdown-menu');

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
                    type: null,
                }
            });
            expect(tournamentChanged).toEqual(true);
        });

        it('creates a divisional tournament for an in-use address', async () => {
            const fixture1 = tournamentBuilder()
                .address('ADDRESS 1')
                .build();
            await renderComponent({
                    date: '2024-09-02',
                    onTournamentChanged,
                    tournamentFixtures: [ fixture1 ],
                }, {
                    id: division1.id,
                    name: division1.name,
                    season: season,
                    onReloadDivision: noop,
                    setDivisionData: noop,
                },
                [ division1, division2 ]);
            const saveButton = findButton(context.container, '➕');
            const divisionDropDown: Element = context.container.querySelector('.division-dropdown .dropdown-menu');
            const addressDropDown: Element = context.container.querySelector('.address-dropdown .dropdown-menu');

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
                    type: null,
                }
            });
            expect(tournamentChanged).toEqual(true);
        });

        it('creates a divisional tournament copying winners from another date', async () => {
            const fixture1 = tournamentBuilder()
                .address('ADDRESS 1')
                .proposed()
                .build();
            const tournament = tournamentBuilder()
                .type('SINGLES')
                .winner('WINNER')
                .build();
            const otherDate = fixtureDateBuilder('2024-08-29')
                .withTournament(tournament)
                .build();
            await renderComponent({
                    date: '2024-09-02',
                    onTournamentChanged,
                    tournamentFixtures: [ fixture1 ],
                }, {
                    id: division1.id,
                    name: division1.name,
                    season: season,
                    onReloadDivision: noop,
                    setDivisionData: noop,
                    fixtures: [ otherDate ],
                },
                [ division1, division2 ]);
            const saveButton = findButton(context.container, '➕');
            const divisionDropDown: Element = context.container.querySelector('.division-dropdown .dropdown-menu');
            const addressDropDown: Element = context.container.querySelector('.address-dropdown .dropdown-menu');
            const copySidesFromDropDown: Element = context.container.querySelector('.copy-sides-from-dropdown .dropdown-menu');

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
                }
            });
            expect(tournamentChanged).toEqual(true);
        });

        it('displays an error if save is unsuccessful', async () => {
            const fixture1 = tournamentBuilder()
                .address('ADDRESS 1')
                .proposed()
                .build();
            await renderComponent({
                    date: '2024-09-02',
                    onTournamentChanged,
                    tournamentFixtures: [ fixture1 ],
                }, {
                    id: division1.id,
                    name: division1.name,
                    season: season,
                    onReloadDivision: noop,
                    setDivisionData: noop,
                },
                [ division1, division2 ]);
            const saveButton = findButton(context.container, '➕');
            const divisionDropDown: Element = context.container.querySelector('.division-dropdown .dropdown-menu');
            const addressDropDown: Element = context.container.querySelector('.address-dropdown .dropdown-menu');
            apiResponse = { success: false, errors: [ 'SOME ERROR' ] };

            await doSelectOption(divisionDropDown, 'DIVISION 1');
            await doSelectOption(addressDropDown, 'ADDRESS 1');
            await doClick(saveButton);

            expect(context.container.innerHTML).toContain('SOME ERROR');
        });

        it('can close the error dialog if save was unsuccessful', async () => {
            const fixture1 = tournamentBuilder()
                .address('ADDRESS 1')
                .proposed()
                .build();
            await renderComponent({
                    date: '2024-09-02',
                    onTournamentChanged,
                    tournamentFixtures: [ fixture1 ],
                }, {
                    id: division1.id,
                    name: division1.name,
                    season: season,
                    onReloadDivision: noop,
                    setDivisionData: noop,
                },
                [ division1, division2 ]);
            const divisionDropDown: Element = context.container.querySelector('.division-dropdown .dropdown-menu');
            const addressDropDown: Element = context.container.querySelector('.address-dropdown .dropdown-menu');
            apiResponse = { success: false, errors: [ 'SOME ERROR' ] };
            await doSelectOption(divisionDropDown, 'DIVISION 1');
            await doSelectOption(addressDropDown, 'ADDRESS 1');
            await doClick(findButton(context.container, '➕'));

            await doClick(findButton(context.container, 'Close'));

            expect(context.container.innerHTML).not.toContain('SOME ERROR');
        });

        it('clears the selected address after successful creation', async () => {
            const fixture1 = tournamentBuilder()
                .address('ADDRESS 1')
                .proposed()
                .build();
            await renderComponent({
                    date: '2024-09-02',
                    onTournamentChanged,
                    tournamentFixtures: [ fixture1 ],
                }, {
                    id: division1.id,
                    name: division1.name,
                    season: season,
                    onReloadDivision: noop,
                    setDivisionData: noop,
                },
                [ division1, division2 ]);
            const saveButton = findButton(context.container, '➕');
            const divisionDropDown: Element = context.container.querySelector('.division-dropdown .dropdown-menu');
            const addressDropDown: Element = context.container.querySelector('.address-dropdown .dropdown-menu');

            await doSelectOption(divisionDropDown, 'DIVISION 1');
            await doSelectOption(addressDropDown, 'ADDRESS 1');
            await doClick(saveButton);

            const selectedAddresses = Array.from(addressDropDown.querySelectorAll('.active'));
            expect(selectedAddresses).toEqual([]);
        });
    });
});