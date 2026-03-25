import {
    api,
    appProps,
    brandingProps,
    cleanUp,
    IBrowserWindow,
    iocProps,
    noop,
    renderApp,
    TestContext,
} from '../../helpers/tests';
import {
    ITournamentDetailsProps,
    TournamentDetails,
} from './TournamentDetails';
import { tournamentBuilder } from '../../helpers/builders/tournaments';
import { divisionBuilder } from '../../helpers/builders/divisions';
import { createTemporaryId } from '../../helpers/projection';
import { teamBuilder } from '../../helpers/builders/teams';
import { playerBuilder } from '../../helpers/builders/players';
import { ExportDataRequestDto } from '../../interfaces/models/dtos/Data/ExportDataRequestDto';
import { IDataApi } from '../../interfaces/apis/IDataApi';
import { DivisionDto } from '../../interfaces/models/dtos/DivisionDto';
import { SeasonDto } from '../../interfaces/models/dtos/Season/SeasonDto';
import { seasonBuilder } from '../../helpers/builders/seasons';
import { UserDto } from '../../interfaces/models/dtos/Identity/UserDto';
import { TournamentGameDto } from '../../interfaces/models/dtos/Game/TournamentGameDto';
import { IAppContainerProps } from '../common/AppContainer';

describe('TournamentDetails', () => {
    let context: TestContext;
    let exportRequest: ExportDataRequestDto | null;
    let updatedTournamentData: TournamentGameDto | null;

    const dataApi = api<IDataApi>({
        export: async (request: ExportDataRequestDto) => {
            exportRequest = request;
            return { success: true, result: { zip: 'content' } };
        },
    });

    beforeEach(() => {
        exportRequest = null;
        updatedTournamentData = null;
    });

    afterEach(async () => {
        await cleanUp(context);
    });

    async function renderComponent(
        props: ITournamentDetailsProps,
        appProps: IAppContainerProps,
    ) {
        context = await renderApp(
            iocProps({
                dataApi,
            }),
            brandingProps(),
            appProps,
            <TournamentDetails {...props} />,
        );
    }

    async function setTournamentData(data: TournamentGameDto) {
        if (updatedTournamentData == null) {
            updatedTournamentData = data;
        } else {
            updatedTournamentData = Object.assign(
                {},
                updatedTournamentData,
                data,
            );
        }
    }

    const division: DivisionDto = divisionBuilder('DIVISION').build();
    const season: SeasonDto = seasonBuilder('SEASON')
        .starting('2023-01-02T00:00:00')
        .ending('2023-05-02T00:00:00')
        .withDivision(division)
        .build();

    describe('renders', () => {
        const account: UserDto = {
            name: '',
            emailAddress: '',
            givenName: '',
            access: {
                manageTournaments: true,
                managePlayers: true,
                recordScoresAsYouGo: true,
            },
        };

        it('tournament without any sides', async () => {
            const tournamentData = tournamentBuilder()
                .forSeason(season)
                .forDivision(division)
                .date('2023-01-02T00:00:00')
                .address('ADDRESS')
                .type('TYPE')
                .notes('NOTES')
                .accoladesCount()
                .build();

            await renderComponent(
                { tournamentData, setTournamentData },
                appProps({
                    account,
                    seasons: [season],
                    teams: [],
                    divisions: [division],
                }),
            );

            const address = context.required('div[datatype="address"]');
            expect(address.text()).toContain('Address');
            expect(address.required('input').value()).toEqual('ADDRESS');
            const type = context.required('div[datatype="type"]');
            expect(type.text()).toContain('Type');
            expect(type.required('input').value()).toEqual('TYPE');
            const notes = context.required('div[datatype="notes"]');
            expect(notes.text()).toContain('Notes');
            expect(notes.required('textarea').value()).toEqual('NOTES');
            const accoladesCount = context.required(
                'div[datatype="accolades-count"]',
            );
            expect(accoladesCount.text()).toContain(
                'Include 180s and Hi-checks in players table?',
            );
            expect(
                accoladesCount.required('input').element<HTMLInputElement>()
                    .checked,
            ).toEqual(true);
            const divisionAndBestOf = context.required(
                'div[datatype="tournament-division"]',
            );
            expect(divisionAndBestOf.text()).toContain('Division');
            expect(
                divisionAndBestOf.required('.dropdown-item.active').text(),
            ).toEqual('DIVISION');
        });
    });

    describe('interactivity', () => {
        const account: UserDto = {
            name: '',
            emailAddress: '',
            givenName: '',
            access: {
                manageTournaments: true,
                managePlayers: true,
                recordScoresAsYouGo: true,
            },
        };
        const canExportAccount: UserDto = {
            name: '',
            emailAddress: '',
            givenName: '',
            access: {
                manageTournaments: true,
                managePlayers: true,
                recordScoresAsYouGo: true,
                exportData: true,
            },
        };

        it('can update accolades count', async () => {
            const tournamentData = tournamentBuilder()
                .forSeason(season)
                .forDivision(division)
                .date('2023-01-02T00:00:00')
                .address('ADDRESS')
                .type('TYPE')
                .notes('NOTES')
                .accoladesCount()
                .updated('2023-07-01T00:00:00')
                .build();
            await renderComponent(
                { tournamentData, setTournamentData },
                appProps({
                    account,
                    seasons: [season],
                    teams: [],
                    divisions: [division],
                }),
            );

            await context.input('accoladesCount').click();

            expect(updatedTournamentData!.accoladesCount).toEqual(false);
        });

        it('can update division', async () => {
            const tournamentData = tournamentBuilder()
                .forSeason(season)
                .forDivision(division)
                .date('2023-01-02T00:00:00')
                .address('ADDRESS')
                .type('TYPE')
                .notes('NOTES')
                .accoladesCount()
                .singleRound()
                .updated('2023-07-01T00:00:00')
                .build();
            await renderComponent(
                { tournamentData, setTournamentData },
                appProps({
                    account,
                    seasons: [season],
                    teams: [],
                    divisions: [division],
                }),
            );

            await context
                .required('div[datatype="tournament-division"] .dropdown-menu')
                .select('All divisions');

            expect(updatedTournamentData!.divisionId).toEqual(undefined);
        });

        it('can update notes', async () => {
            const tournamentData = tournamentBuilder()
                .forSeason(season)
                .forDivision(division)
                .date('2023-01-02T00:00:00')
                .address('ADDRESS')
                .type('TYPE')
                .notes('NOTES')
                .accoladesCount()
                .updated('2023-07-01T00:00:00')
                .build();
            await renderComponent(
                { tournamentData, setTournamentData },
                appProps({
                    account,
                    seasons: [season],
                    teams: [],
                    divisions: [division],
                }),
            );

            await context
                .required('div[datatype="notes"]')
                .required('textarea')
                .change('NEW NOTES');

            expect(updatedTournamentData!.notes).toEqual('NEW NOTES');
        });

        it('can update details', async () => {
            const tournamentData = tournamentBuilder()
                .forSeason(season)
                .forDivision(division)
                .date('2023-01-02T00:00:00')
                .address('ADDRESS')
                .type('TYPE')
                .notes('NOTES')
                .accoladesCount()
                .singleRound()
                .updated('2023-07-01T00:00:00')
                .build();
            await renderComponent(
                { tournamentData, setTournamentData },
                appProps({
                    account,
                    seasons: [season],
                    teams: [],
                    divisions: [division],
                }),
            );

            await context
                .required('div[datatype="type"]')
                .required('input')
                .change('NEW TYPE');

            expect(updatedTournamentData!.type).toEqual('NEW TYPE');
        });

        it('can update address', async () => {
            const tournamentData = tournamentBuilder()
                .forSeason(season)
                .forDivision(division)
                .date('2023-01-02T00:00:00')
                .address('ADDRESS')
                .type('TYPE')
                .notes('NOTES')
                .accoladesCount()
                .singleRound()
                .updated('2023-07-01T00:00:00')
                .build();
            await renderComponent(
                { tournamentData, setTournamentData },
                appProps({
                    account,
                    seasons: [season],
                    teams: [],
                    divisions: [division],
                }),
            );

            await context
                .required('div[datatype="address"]')
                .required('input')
                .change('NEW ADDRESS');

            expect(updatedTournamentData!.address).toEqual('NEW ADDRESS');
        });

        it('can export tournament and sayg data with no round', async () => {
            const tournamentData = tournamentBuilder()
                .forSeason(season)
                .forDivision(division)
                .date('2023-01-02T00:00:00')
                .address('ADDRESS')
                .type('TYPE')
                .notes('NOTES')
                .accoladesCount()
                .build();
            await renderComponent(
                { tournamentData, setTournamentData },
                appProps({
                    account: canExportAccount,
                    seasons: [season],
                    teams: [],
                    divisions: [division],
                }),
            );
            (window as IBrowserWindow).open = noop;

            await context.button('🛒').click();

            expect(exportRequest).toEqual({
                password: '',
                includeDeletedEntries: false,
                tables: {
                    tournamentGame: [tournamentData.id],
                    division: [tournamentData.divisionId],
                    season: [tournamentData.seasonId],
                },
            });
            // NOTE: requestedScoreAsYouGo should NOT be present, to prevent export of ALL records
        });

        it('can export tournament and sayg data with round', async () => {
            const saygId = createTemporaryId();
            const tournamentData = tournamentBuilder()
                .forSeason(season)
                .forDivision(division)
                .date('2023-01-02T00:00:00')
                .address('ADDRESS')
                .type('TYPE')
                .notes('NOTES')
                .accoladesCount()
                .round((r) =>
                    r
                        .withMatch((m) =>
                            m.saygId(saygId).sideA('A').sideB('B'),
                        )
                        .withMatchOption((o) => o.numberOfLegs(3)),
                )
                .build();
            await renderComponent(
                { tournamentData, setTournamentData },
                appProps({
                    account: canExportAccount,
                    seasons: [season],
                    teams: [],
                    divisions: [division],
                }),
            );
            (window as IBrowserWindow).open = noop;

            await context.button('🛒').click();

            expect(exportRequest).toEqual({
                password: '',
                includeDeletedEntries: false,
                tables: {
                    tournamentGame: [tournamentData.id],
                    recordedScoreAsYouGo: [saygId],
                    division: [tournamentData.divisionId],
                    season: [tournamentData.seasonId],
                },
            });
        });

        it('can export tournament and sayg data with sub rounds', async () => {
            const saygId1 = createTemporaryId();
            const saygId2 = createTemporaryId();
            const tournamentData = tournamentBuilder()
                .forSeason(season)
                .forDivision(division)
                .date('2023-01-02T00:00:00')
                .address('ADDRESS')
                .type('TYPE')
                .notes('NOTES')
                .accoladesCount()
                .round((r) =>
                    r
                        .withMatch((m) =>
                            m.saygId(saygId1).sideA('A').sideB('B'),
                        )
                        .withMatchOption((o) => o.numberOfLegs(3))
                        .round((r) =>
                            r
                                .withMatch((m) =>
                                    m.saygId(saygId2).sideA('A').sideB('B'),
                                )
                                .withMatchOption((o) => o.numberOfLegs(3)),
                        ),
                )
                .build();
            await renderComponent(
                { tournamentData, setTournamentData },
                appProps({
                    account: canExportAccount,
                    seasons: [season],
                    teams: [],
                    divisions: [division],
                }),
            );
            (window as IBrowserWindow).open = noop;

            await context.button('🛒').click();

            expect(exportRequest).toEqual({
                password: '',
                includeDeletedEntries: false,
                tables: {
                    tournamentGame: [tournamentData.id],
                    recordedScoreAsYouGo: [saygId1, saygId2],
                    division: [tournamentData.divisionId],
                    season: [tournamentData.seasonId],
                },
            });
        });

        it('can export tournament data for cross-divisional tournament', async () => {
            const tournamentData = tournamentBuilder()
                .forSeason(season)
                .date('2023-01-02T00:00:00')
                .address('ADDRESS')
                .type('TYPE')
                .notes('NOTES')
                .accoladesCount()
                .build();
            await renderComponent(
                { tournamentData, setTournamentData },
                appProps({
                    account: canExportAccount,
                    seasons: [season],
                    teams: [],
                    divisions: [division],
                }),
            );
            (window as IBrowserWindow).open = noop;

            await context.button('🛒').click();

            expect(exportRequest).toEqual({
                password: '',
                includeDeletedEntries: false,
                tables: {
                    tournamentGame: [tournamentData.id],
                    season: [tournamentData.seasonId],
                },
            });
        });

        it('can export tournament data and team data for team sides', async () => {
            const team = teamBuilder('TEAM').build();
            const tournamentData = tournamentBuilder()
                .forSeason(season)
                .date('2023-01-02T00:00:00')
                .withSide((s) => s.teamId(team.id))
                .address('ADDRESS')
                .type('TYPE')
                .notes('NOTES')
                .accoladesCount()
                .build();
            await renderComponent(
                { tournamentData, setTournamentData },
                appProps({
                    account: canExportAccount,
                    seasons: [season],
                    teams: [],
                    divisions: [division],
                }),
            );
            (window as IBrowserWindow).open = noop;

            await context.button('🛒').click();

            expect(exportRequest).toEqual({
                password: '',
                includeDeletedEntries: false,
                tables: {
                    tournamentGame: [tournamentData.id],
                    season: [tournamentData.seasonId],
                    team: [team.id],
                },
            });
        });

        it('can export tournament data and team data for sides with players', async () => {
            const playerId = createTemporaryId();
            const team = teamBuilder('TEAM')
                .forSeason(season, null, [
                    playerBuilder('PLAYER', playerId).build(),
                ])
                .build();
            const tournamentData = tournamentBuilder()
                .forSeason(season)
                .date('2023-01-02T00:00:00')
                .withSide((s) => s.withPlayer(undefined, playerId))
                .address('ADDRESS')
                .type('TYPE')
                .notes('NOTES')
                .accoladesCount()
                .build();
            await renderComponent(
                { tournamentData, setTournamentData },
                appProps({
                    account: canExportAccount,
                    seasons: [season],
                    teams: [team],
                    divisions: [division],
                }),
            );
            (window as IBrowserWindow).open = noop;

            await context.button('🛒').click();

            expect(exportRequest).toEqual({
                password: '',
                includeDeletedEntries: false,
                tables: {
                    tournamentGame: [tournamentData.id],
                    season: [tournamentData.seasonId],
                    team: [team.id],
                },
            });
        });

        it('can export tournament data excluding player ids for teams from deleted team seasons', async () => {
            const playerId = createTemporaryId();
            const team = teamBuilder('TEAM')
                .forSeason(
                    season,
                    null,
                    [playerBuilder('PLAYER', playerId).build()],
                    true,
                )
                .build();
            const tournamentData = tournamentBuilder()
                .forSeason(season)
                .date('2023-01-02T00:00:00')
                .withSide((s) => s.withPlayer(undefined, playerId))
                .address('ADDRESS')
                .type('TYPE')
                .notes('NOTES')
                .accoladesCount()
                .build();
            await renderComponent(
                { tournamentData, setTournamentData },
                appProps({
                    account: canExportAccount,
                    seasons: [season],
                    teams: [team],
                    divisions: [division],
                }),
            );
            (window as IBrowserWindow).open = noop;

            await context.button('🛒').click();

            expect(exportRequest).toEqual({
                password: '',
                includeDeletedEntries: false,
                tables: {
                    tournamentGame: [tournamentData.id],
                    season: [tournamentData.seasonId],
                },
            });
        });

        it('can export tournament data where teamId for player cannot be found', async () => {
            const player = playerBuilder('PLAYER').build();
            const team = teamBuilder('TEAM')
                .forSeason(season, null, [])
                .build();
            const tournamentData = tournamentBuilder()
                .forSeason(season)
                .date('2023-01-02T00:00:00')
                .withSide((s) => s.withPlayer(undefined, player.id))
                .address('ADDRESS')
                .type('TYPE')
                .notes('NOTES')
                .accoladesCount()
                .build();
            await renderComponent(
                { tournamentData, setTournamentData },
                appProps({
                    account: canExportAccount,
                    seasons: [season],
                    teams: [team],
                    divisions: [division],
                }),
            );
            (window as IBrowserWindow).open = noop;

            await context.button('🛒').click();

            // no teamId's could be identified, player's team could not be found, so it should be excluded from the request
            expect(exportRequest).toEqual({
                password: '',
                includeDeletedEntries: false,
                tables: {
                    tournamentGame: [tournamentData.id],
                    season: [tournamentData.seasonId],
                },
            });
        });
    });
});
