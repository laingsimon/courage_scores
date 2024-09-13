import {
    api,
    appProps,
    brandingProps,
    cleanUp,
    doChange,
    doClick, doSelectOption, findButton,
    iocProps, noop,
    renderApp,
    TestContext
} from "../../helpers/tests";
import {ITournamentDetailsProps, TournamentDetails} from "./TournamentDetails";
import {
    ITournamentMatchBuilder,
    ITournamentRoundBuilder,
    ITournamentSideBuilder,
    tournamentBuilder
} from "../../helpers/builders/tournaments";
import {divisionBuilder} from "../../helpers/builders/divisions";
import {createTemporaryId} from "../../helpers/projection";
import {IMatchOptionsBuilder} from "../../helpers/builders/games";
import {teamBuilder} from "../../helpers/builders/teams";
import {playerBuilder} from "../../helpers/builders/players";
import {ExportDataRequestDto} from "../../interfaces/models/dtos/Data/ExportDataRequestDto";
import {IDataApi} from "../../interfaces/apis/IDataApi";
import {DivisionDto} from "../../interfaces/models/dtos/DivisionDto";
import {SeasonDto} from "../../interfaces/models/dtos/Season/SeasonDto";
import {seasonBuilder} from "../../helpers/builders/seasons";
import {UserDto} from "../../interfaces/models/dtos/Identity/UserDto";
import {TournamentGameDto} from "../../interfaces/models/dtos/Game/TournamentGameDto";
import {IAppContainerProps} from "../common/AppContainer";

describe('TournamentDetails', () => {
    let context: TestContext;
    let exportRequest: ExportDataRequestDto;
    let updatedTournamentData: TournamentGameDto;

    const dataApi = api<IDataApi>({
        export: async (request: ExportDataRequestDto) => {
            exportRequest = request;
            return {success: true, result: {zip: 'content'}};
        }
    });

    beforeEach(() => {
        exportRequest = null;
        updatedTournamentData = null;
    });

    afterEach(() => {
        cleanUp(context);
    });

    async function renderComponent(props: ITournamentDetailsProps, appProps: IAppContainerProps) {
        context = await renderApp(
            iocProps({
                dataApi
            }),
            brandingProps(),
            appProps,
            (<TournamentDetails {...props }/>));
    }

    async function setTournamentData(data: TournamentGameDto) {
        if (updatedTournamentData == null) {
            updatedTournamentData = data;
        } else {
            updatedTournamentData = Object.assign({}, updatedTournamentData, data);
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
            }
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

            await renderComponent({ tournamentData, setTournamentData }, appProps({
                account,
                seasons: [season],
                teams: [],
                divisions: [division],
            }));

            // address
            const address = context.container.querySelector('div[datatype="address"]');
            expect(address).toBeTruthy();
            expect(address.textContent).toContain('Address');
            expect(address.querySelector('input').value).toEqual('ADDRESS');
            // type
            const type = context.container.querySelector('div[datatype="type"]');
            expect(type).toBeTruthy();
            expect(type.textContent).toContain('Type');
            expect(type.querySelector('input').value).toEqual('TYPE');
            // notes
            const notes = context.container.querySelector('div[datatype="notes"]');
            expect(notes).toBeTruthy();
            expect(notes.textContent).toContain('Notes');
            expect(notes.querySelector('textarea').value).toEqual('NOTES');
            // accolades qualify
            const accoladesCount = context.container.querySelector('div[datatype="accolades-count"]');
            expect(accoladesCount).toBeTruthy();
            expect(accoladesCount.textContent).toContain('Include 180s and Hi-checks in players table?');
            expect(accoladesCount.querySelector('input').checked).toEqual(true);
            // division
            const divisionAndBestOf = context.container.querySelector('div[datatype="tournament-division"]');
            expect(divisionAndBestOf.textContent).toContain('Division');
            expect(divisionAndBestOf.querySelector('.dropdown-item.active').textContent).toEqual('DIVISION');
        });

        it('super league options when single round', async () => {
            const tournamentData = tournamentBuilder()
                .forSeason(season)
                .forDivision(division)
                .date('2023-01-02T00:00:00')
                .address('ADDRESS')
                .type('TYPE')
                .notes('NOTES')
                .host('HOST')
                .opponent('OPPONENT')
                .gender('men')
                .singleRound()
                .accoladesCount()
                .build();

            await renderComponent({ tournamentData, setTournamentData }, appProps({
                account,
                seasons: [season],
                teams: [],
                divisions: [division],
            }));

            const superLeagueOptions = context.container.querySelector('div[datatype="tournament-options"]');
            expect(superLeagueOptions).toBeTruthy();
            const hostInput = superLeagueOptions.querySelector('input[name="host"]') as HTMLInputElement;
            const opponentInput = superLeagueOptions.querySelector('input[name="opponent"]') as HTMLInputElement;
            expect(hostInput).toBeTruthy();
            expect(hostInput.value).toEqual('HOST');
            expect(opponentInput).toBeTruthy();
            expect(opponentInput.value).toEqual('OPPONENT');
            expect(superLeagueOptions.querySelector('div[datatype="superleague-gender"] .dropdown-menu .active').textContent).toEqual('Men');
        });

        it('no super league options when not single round', async () => {
            const tournamentData = tournamentBuilder()
                .forSeason(season)
                .forDivision(division)
                .date('2023-01-02T00:00:00')
                .address('ADDRESS')
                .type('TYPE')
                .notes('NOTES')
                .host('HOST')
                .opponent('OPPONENT')
                .gender('men')
                .accoladesCount()
                .build();

            await renderComponent({ tournamentData, setTournamentData }, appProps({
                account,
                seasons: [season],
                teams: [],
                divisions: [division],
            }));

            expect(context.container.querySelector('div[data-options-for="superleague"]')).toBeFalsy();
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
            }
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
            }
        };

        it('can update single round', async () => {
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
            await renderComponent({ tournamentData, setTournamentData }, appProps({
                account,
                seasons: [season],
                teams: [],
                divisions: [division],
            }));

            const accoladesCountAndDivision = context.container.querySelector('div:nth-child(3)');
            await doClick(accoladesCountAndDivision, 'input[type="checkbox"]');

            expect(updatedTournamentData.singleRound).toEqual(false);
        });

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
            await renderComponent({ tournamentData, setTournamentData }, appProps({
                account,
                seasons: [season],
                teams: [],
                divisions: [division],
            }));

            await doClick(context.container, 'input[name="accoladesCount"]');

            expect(updatedTournamentData.accoladesCount).toEqual(false);
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
            await renderComponent({ tournamentData, setTournamentData }, appProps({
                account,
                seasons: [season],
                teams: [],
                divisions: [division],
            }));

            await doSelectOption(context.container.querySelector('div[datatype="tournament-division"] .dropdown-menu'), 'All divisions');

            expect(updatedTournamentData.divisionId).toEqual(null);
        });

        it('can update gender', async () => {
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
            await renderComponent({ tournamentData, setTournamentData }, appProps({
                account,
                seasons: [season],
                teams: [],
                divisions: [division],
            }));

            const superLeagueOptions = context.container.querySelector('div[datatype="tournament-options"]');
            await doSelectOption(superLeagueOptions.querySelector('div[datatype="superleague-gender"] .dropdown-menu'), 'Women');

            expect(updatedTournamentData.gender).toEqual('women');
        });

        it('can update host', async () => {
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
            await renderComponent({ tournamentData, setTournamentData }, appProps({
                account,
                seasons: [season],
                teams: [],
                divisions: [division],
            }));

            const superLeagueOptions = context.container.querySelector('div[datatype="tournament-options"]');
            await doChange(superLeagueOptions, 'input[name="host"]', 'HOST', context.user);

            expect(updatedTournamentData.host).toEqual('HOST');
        });

        it('can update opponent', async () => {
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
            await renderComponent({ tournamentData, setTournamentData }, appProps({
                account,
                seasons: [season],
                teams: [],
                divisions: [division],
            }));

            const superLeagueOptions = context.container.querySelector('div[datatype="tournament-options"]');
            await doChange(superLeagueOptions, 'input[name="opponent"]', 'OPPONENT', context.user);

            expect(updatedTournamentData.opponent).toEqual('OPPONENT');
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
            await renderComponent({ tournamentData, setTournamentData }, appProps({
                account,
                seasons: [season],
                teams: [],
                divisions: [division],
            }));

            const notes = context.container.querySelector('div[datatype="notes"]');
            await doChange(notes, 'textarea', 'NEW NOTES', context.user);

            expect(updatedTournamentData.notes).toEqual('NEW NOTES');
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
            await renderComponent({ tournamentData, setTournamentData }, appProps({
                account,
                seasons: [season],
                teams: [],
                divisions: [division],
            }));

            const type = context.container.querySelector('div[datatype="type"]');
            await doChange(type, 'input', 'NEW TYPE', context.user);

            expect(updatedTournamentData.type).toEqual('NEW TYPE');
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
            await renderComponent({ tournamentData, setTournamentData }, appProps({
                account,
                seasons: [season],
                teams: [],
                divisions: [division],
            }));

            const address = context.container.querySelector('div[datatype="address"]');
            await doChange(address, 'input', 'NEW ADDRESS', context.user);

            expect(updatedTournamentData.address).toEqual('NEW ADDRESS');
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
            await renderComponent({ tournamentData, setTournamentData }, appProps({
                account: canExportAccount,
                seasons: [season],
                teams: [],
                divisions: [division],
            }));
            (window as any).open = noop;

            await doClick(findButton(context.container, '🛒'));

            expect(exportRequest).toEqual({
                password: '',
                includeDeletedEntries: false,
                tables: {
                    tournamentGame: [tournamentData.id],
                    division: [tournamentData.divisionId],
                    season: [tournamentData.seasonId],
                }
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
                .round((r: ITournamentRoundBuilder) => r
                    .withMatch((m: ITournamentMatchBuilder) => m
                        .saygId(saygId)
                        .sideA('A')
                        .sideB('B'))
                    .withMatchOption((o: IMatchOptionsBuilder) => o.numberOfLegs(3)))
                .build();
            await renderComponent({ tournamentData, setTournamentData }, appProps({
                account: canExportAccount,
                seasons: [season],
                teams: [],
                divisions: [division],
            }));
            (window as any).open = noop;

            await doClick(findButton(context.container, '🛒'));

            expect(exportRequest).toEqual({
                password: '',
                includeDeletedEntries: false,
                tables: {
                    tournamentGame: [tournamentData.id],
                    recordedScoreAsYouGo: [saygId],
                    division: [tournamentData.divisionId],
                    season: [tournamentData.seasonId],
                }
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
                .round((r: ITournamentRoundBuilder) => r
                    .withMatch((m: ITournamentMatchBuilder) => m
                        .saygId(saygId1)
                        .sideA('A')
                        .sideB('B'))
                    .withMatchOption((o: IMatchOptionsBuilder) => o.numberOfLegs(3))
                    .round((r: ITournamentRoundBuilder) => r
                        .withMatch((m: ITournamentMatchBuilder) => m
                            .saygId(saygId2)
                            .sideA('A')
                            .sideB('B'))
                        .withMatchOption((o: IMatchOptionsBuilder) => o.numberOfLegs(3))))
                .build();
            await renderComponent({ tournamentData, setTournamentData }, appProps({
                account: canExportAccount,
                seasons: [season],
                teams: [],
                divisions: [division],
            }));
            (window as any).open = noop;

            await doClick(findButton(context.container, '🛒'));

            expect(exportRequest).toEqual({
                password: '',
                includeDeletedEntries: false,
                tables: {
                    tournamentGame: [tournamentData.id],
                    recordedScoreAsYouGo: [saygId1, saygId2],
                    division: [tournamentData.divisionId],
                    season: [tournamentData.seasonId],
                }
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
            await renderComponent({ tournamentData, setTournamentData }, appProps({
                account: canExportAccount,
                seasons: [season],
                teams: [],
                divisions: [division],
            }));
            (window as any).open = noop;

            await doClick(findButton(context.container, '🛒'));

            expect(exportRequest).toEqual({
                password: '',
                includeDeletedEntries: false,
                tables: {
                    tournamentGame: [tournamentData.id],
                    season: [tournamentData.seasonId],
                }
            });
        });

        it('can export tournament data and team data for team sides', async () => {
            const team = teamBuilder('TEAM').build();
            const tournamentData = tournamentBuilder()
                .forSeason(season)
                .date('2023-01-02T00:00:00')
                .withSide((s: ITournamentSideBuilder) => s.teamId(team.id))
                .address('ADDRESS')
                .type('TYPE')
                .notes('NOTES')
                .accoladesCount()
                .build();
            await renderComponent({ tournamentData, setTournamentData }, appProps({
                account: canExportAccount,
                seasons: [season],
                teams: [],
                divisions: [division],
            }));
            (window as any).open = noop;

            await doClick(findButton(context.container, '🛒'));

            expect(exportRequest).toEqual({
                password: '',
                includeDeletedEntries: false,
                tables: {
                    tournamentGame: [tournamentData.id],
                    season: [tournamentData.seasonId],
                    team: [team.id],
                }
            });
        });

        it('can export tournament data and team data for sides with players', async () => {
            const playerId = createTemporaryId();
            const team = teamBuilder('TEAM')
                .forSeason(season, null, [playerBuilder('PLAYER', playerId).build()])
                .build();
            const tournamentData = tournamentBuilder()
                .forSeason(season)
                .date('2023-01-02T00:00:00')
                .withSide((s: ITournamentSideBuilder) => s.withPlayer(undefined, playerId))
                .address('ADDRESS')
                .type('TYPE')
                .notes('NOTES')
                .accoladesCount()
                .build();
            await renderComponent({ tournamentData, setTournamentData }, appProps({
                account: canExportAccount,
                seasons: [season],
                teams: [team],
                divisions: [division],
            }));
            (window as any).open = noop;

            await doClick(findButton(context.container, '🛒'));

            expect(exportRequest).toEqual({
                password: '',
                includeDeletedEntries: false,
                tables: {
                    tournamentGame: [tournamentData.id],
                    season: [tournamentData.seasonId],
                    team: [team.id],
                }
            });
        });

        it('can export tournament data excluding player ids for teams from deleted team seasons', async () => {
            const playerId = createTemporaryId();
            const team = teamBuilder('TEAM')
                .forSeason(season, null, [playerBuilder('PLAYER', playerId).build()], true)
                .build();
            const tournamentData = tournamentBuilder()
                .forSeason(season)
                .date('2023-01-02T00:00:00')
                .withSide((s: ITournamentSideBuilder) => s.withPlayer(undefined, playerId))
                .address('ADDRESS')
                .type('TYPE')
                .notes('NOTES')
                .accoladesCount()
                .build();
            await renderComponent({ tournamentData, setTournamentData }, appProps({
                account: canExportAccount,
                seasons: [season],
                teams: [team],
                divisions: [division],
            }));
            (window as any).open = noop;

            await doClick(findButton(context.container, '🛒'));

            expect(exportRequest).toEqual({
                password: '',
                includeDeletedEntries: false,
                tables: {
                    tournamentGame: [tournamentData.id],
                    season: [tournamentData.seasonId],
                }
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
                .withSide((s: ITournamentSideBuilder) => s.withPlayer(undefined, player.id))
                .address('ADDRESS')
                .type('TYPE')
                .notes('NOTES')
                .accoladesCount()
                .build();
            await renderComponent({ tournamentData, setTournamentData }, appProps({
                account: canExportAccount,
                seasons: [season],
                teams: [team],
                divisions: [division],
            }));
            (window as any).open = noop;

            await doClick(findButton(context.container, '🛒'));

            // no teamId's could be identified, player's team could not be found, so it should be excluded from the request
            expect(exportRequest).toEqual({
                password: '',
                includeDeletedEntries: false,
                tables: {
                    tournamentGame: [tournamentData.id],
                    season: [tournamentData.seasonId],
                }
            });
        });
    });
});