import {
    api,
    appProps,
    brandingProps,
    cleanUp,
    ErrorState,
    IComponent,
    iocProps,
    noop,
    renderApp,
    TestContext,
    user,
} from '../../../helpers/tests';
import { IMasterDrawProps, MasterDraw } from './MasterDraw';
import { renderDate } from '../../../helpers/rendering';
import {
    ITournamentBuilder,
    ITournamentMatchBuilder,
    tournamentBuilder,
} from '../../../helpers/builders/tournaments';
import {
    ITournamentContainerProps,
    TournamentContainer,
} from '../TournamentContainer';
import { UserDto } from '../../../interfaces/models/dtos/Identity/UserDto';
import { TournamentGameDto } from '../../../interfaces/models/dtos/Game/TournamentGameDto';
import { ITournamentGameApi } from '../../../interfaces/apis/ITournamentGameApi';
import { IClientActionResultDto } from '../../common/IClientActionResultDto';
import { createTemporaryId } from '../../../helpers/projection';
import { ISaygApi } from '../../../interfaces/apis/ISaygApi';
import { RecordedScoreAsYouGoDto } from '../../../interfaces/models/dtos/Game/Sayg/RecordedScoreAsYouGoDto';
import { saygBuilder } from '../../../helpers/builders/sayg';
import { START_SCORING } from '../tournaments';
import { tournamentContainerPropsBuilder } from '../tournamentContainerPropsBuilder';
import { teamBuilder } from '../../../helpers/builders/teams';
import { TeamDto } from '../../../interfaces/models/dtos/Team/TeamDto';
import { seasonBuilder } from '../../../helpers/builders/seasons';
import { SeasonDto } from '../../../interfaces/models/dtos/Season/SeasonDto';
import { playerBuilder } from '../../../helpers/builders/players';
import { divisionBuilder } from '../../../helpers/builders/divisions';
import { IPlayerApi } from '../../../interfaces/apis/IPlayerApi';
import { EditTeamPlayerDto } from '../../../interfaces/models/dtos/Team/EditTeamPlayerDto';
import { matchOptionsBuilder } from '../../../helpers/builders/games';
import { PatchTournamentDto } from '../../../interfaces/models/dtos/Game/PatchTournamentDto';
import { PatchTournamentRoundDto } from '../../../interfaces/models/dtos/Game/PatchTournamentRoundDto';
import { ENTER_SCORE_BUTTON } from '../../../helpers/constants';
import { checkoutWith, enterScores, keyPad } from '../../../helpers/sayg';
import { UpdateRecordedScoreAsYouGoDto } from '../../../interfaces/models/dtos/Game/Sayg/UpdateRecordedScoreAsYouGoDto';
import { IBuilder } from '../../../helpers/builders/builders';
import {
    alreadyPlaying,
    editButton,
    equatableMatch,
    equatableSide,
    withName,
} from './MasterDraw.test.helpers';

const mockedUsedNavigate = jest.fn();

jest.mock('react-router', () => ({
    ...jest.requireActual('react-router'),
    useNavigate: () => mockedUsedNavigate,
}));

describe('MasterDraw', () => {
    let context: TestContext;
    let reportedError: ErrorState;
    let saygDeleted: { id: string; matchId: string } | null;
    let updatedTournament: {
        updated: TournamentGameDto;
        save?: boolean;
    } | null = null;
    let createdPlayer: {
        divisionId: string;
        seasonId: string;
        teamId: string;
        player: EditTeamPlayerDto;
    } | null = null;
    let updatedPlayer: {
        seasonId: string;
        teamId: string;
        playerId: string;
        player: EditTeamPlayerDto;
    } | null = null;
    let playerCreatedCallback: (() => void) | null = null;
    let patchedData: {
        patch: PatchTournamentDto | PatchTournamentRoundDto;
        nestInRound?: boolean;
        saygId?: string;
    }[] = [];
    const player = playerBuilder('PLAYER').build();
    const apiSuccess = { success: true };
    let newSaygResponse: (() => TournamentGameDto) | undefined;
    const season = seasonBuilder('SEASON').build();
    const division = divisionBuilder('DIVISION').build();

    const tournamentApi = api<ITournamentGameApi>({
        update: async () => apiSuccess,
        addSayg: async () => {
            return {
                success: true,
                result: newSaygResponse?.(),
            };
        },
        async deleteSayg(id: string, matchId: string) {
            saygDeleted = { id, matchId };
            return {
                success: true,
                result: tournamentBuilder()
                    .round((r) => r.withMatch())
                    .build(),
            };
        },
    });
    const saygApi = api<ISaygApi>({
        async get(id: string): Promise<RecordedScoreAsYouGoDto | null> {
            return saygBuilder(id)
                .yourName('HOME')
                .opponentName('AWAY')
                .numberOfLegs(3)
                .startingScore(501)
                .build();
        },
        async upsert(data: UpdateRecordedScoreAsYouGoDto) {
            return {
                success: true,
                result: Object.assign(
                    { yourName: data.yourName!, id: data.id! },
                    data,
                ),
            };
        },
    });
    const playerApi = api<IPlayerApi>({
        async create(
            divisionId: string,
            seasonId: string,
            teamId: string,
            player: EditTeamPlayerDto,
        ): Promise<IClientActionResultDto<TeamDto>> {
            createdPlayer = { divisionId, seasonId, teamId, player };
            if (playerCreatedCallback !== null) {
                playerCreatedCallback();
            }
            return {
                success: true,
                result: {
                    id: teamId,
                    address: 'unknown',
                    name: 'unknown',
                    seasons: [
                        {
                            seasonId: seasonId,
                            players: [],
                        },
                    ],
                },
            };
        },
        async update(
            seasonId: string,
            teamId: string,
            playerId: string,
            player: EditTeamPlayerDto,
        ): Promise<IClientActionResultDto<TeamDto>> {
            updatedPlayer = { seasonId, teamId, playerId, player };
            return {
                success: true,
                result: {
                    id: teamId,
                    address: 'unknown',
                    name: 'unknown',
                    seasons: [
                        {
                            seasonId: seasonId,
                            players: [],
                        },
                    ],
                },
            };
        },
    });

    afterEach(async () => {
        await cleanUp(context);
    });

    beforeEach(() => {
        reportedError = new ErrorState();
        saygDeleted = null;
        updatedTournament = null;
        playerCreatedCallback = null;
        createdPlayer = null;
        updatedPlayer = null;
        patchedData = [];
        newSaygResponse = undefined;
    });

    async function setTournamentData(u: TournamentGameDto, s?: boolean) {
        updatedTournament = { updated: u, save: s };
    }

    async function patchData(
        patch: PatchTournamentDto | PatchTournamentRoundDto,
        nestInRound?: boolean,
        saygId?: string,
    ): Promise<boolean> {
        patchedData.push({ patch, nestInRound, saygId });
        return true;
    }

    function props(template: Partial<IMasterDrawProps>): IMasterDrawProps {
        return {
            setTournamentData,
            patchData: noop,
            ...template,
        } as IMasterDrawProps;
    }

    async function renderComponent(
        props: IMasterDrawProps,
        account?: UserDto,
        containerProps?: ITournamentContainerProps,
        teams?: TeamDto[],
        season?: SeasonDto,
        path?: string,
    ) {
        context = await renderApp(
            iocProps({ tournamentApi, saygApi, playerApi }),
            brandingProps(),
            appProps(
                {
                    account,
                    teams: teams || [],
                    seasons: season ? [season] : undefined,
                    divisions: [],
                },
                reportedError,
            ),
            <TournamentContainer
                {...(containerProps ??
                    new tournamentContainerPropsBuilder().build())}>
                <MasterDraw {...props} />
            </TournamentContainer>,
            '/test',
            path ?? '/test',
        );

        reportedError.verifyNoError();
    }

    function getNewSinglesMatchRow() {
        return context.required(
            'table[data-type="singles"] tbody tr:last-child',
        );
    }

    function getNewPairsMatchRow() {
        return context.required('table[data-type="pairs"] tbody tr:last-child');
    }

    function getDialog() {
        return context.optional('.modal-dialog');
    }

    async function change(s: string, t: string, c?: IComponent) {
        await (c ?? context).required(s).change(t);
    }

    async function select(s: string, v: string, c?: IComponent) {
        await (c ?? context).required(s).select(v);
    }

    function withSides(a: string, b: string, saygId?: string) {
        return (m: ITournamentMatchBuilder) =>
            m
                .sideA(a, undefined, player)
                .sideB(b, undefined, player)
                .saygId(saygId);
    }

    describe('renders', () => {
        let tournament: ITournamentBuilder;

        beforeEach(() => {
            tournament = tournamentBuilder()
                .singleRound()
                .host('HOST')
                .opponent('OPPONENT')
                .gender('GENDER')
                .date('2025-05-06')
                .type('TYPE')
                .forSeason(season)
                .round();
        });

        it('matches', async () => {
            await renderComponent(
                props({
                    tournamentData: tournament
                        .round((r) =>
                            r
                                .withMatch(withSides('A', 'B'))
                                .withMatch(withSides('C', 'D')),
                        )
                        .build(),
                    readOnly: true,
                }),
            );

            const rows = Array.from(
                context.container.querySelectorAll('table.table tbody tr'),
            );
            expect(rows.length).toEqual(2);
            expect(
                Array.from(rows[0].querySelectorAll('td')).map(
                    (td) => td.textContent,
                ),
            ).toEqual(['1', 'A', 'v', 'B', '']);
            expect(
                Array.from(rows[1].querySelectorAll('td')).map(
                    (td) => td.textContent,
                ),
            ).toEqual(['2', 'C', 'v', 'D', '']);
        });

        it('tournament properties', async () => {
            await renderComponent(
                props({
                    tournamentData: tournament.type('Board 1').build(),
                    readOnly: true,
                }),
            );

            const properties = context.required(
                'div.d-flex > div:nth-child(2)',
            );
            const date = renderDate('2023-05-06');
            expect(properties.text()).toContain('Gender: GENDER');
            expect(properties.text()).toContain(`Date: ${date}`);
            expect(properties.text()).toContain('Notes: Board 1');
        });

        it('clickable date when logged in', async () => {
            await renderComponent(
                props({
                    tournamentData: tournament
                        .type('Board 1')
                        .forSeason(season)
                        .forDivision(division)
                        .build(),
                    readOnly: false,
                }),
                undefined,
                undefined,
                undefined,
                season,
            );

            const date = context.required(
                'div.d-flex > div:nth-child(2) > div a',
            );
            expect(date.text()).toEqual(renderDate('2023-05-06'));
            // division.id instead of name because divisions aren't provided in the app props
            expect(date.element<HTMLAnchorElement>().href).toEqual(
                `http://localhost/fixtures/${season.name}/?division=${division.id}&date=2025-05-06`,
            );
        });

        it('when no type', async () => {
            await renderComponent(
                props({
                    tournamentData: tournament.type(undefined!).build(),
                    readOnly: true,
                }),
            );

            const properties = context.required(
                'div.d-flex > div:nth-child(2)',
            );
            expect(properties.text()).toContain('Gender: GENDER');
            expect(properties.text()).not.toContain('Notes:');
        });

        it('already playing player in collapsed drop-down with their name only', async () => {
            const team = teamBuilder('HOST')
                .forSeason(season, null, [player])
                .build();
            const containerProps = new tournamentContainerPropsBuilder()
                .withAlreadyPlaying(alreadyPlaying('BOARD 2', player))
                .build();
            await renderComponent(
                props({
                    tournamentData: tournament
                        .round((r) =>
                            r.withMatch(withSides('PLAYER', 'SIDE B')),
                        )
                        .build(),
                }),
                user({}),
                containerProps,
                [team],
            );

            const masterDraw = context.required(
                'div.d-flex > div:nth-child(1)',
            );
            const homeSide = masterDraw.required(
                'table tbody tr:first-child td:nth-child(2)',
            );
            const toggle = homeSide.required('.dropdown-toggle');
            expect(toggle.text()).toContain('PLAYER');
        });
    });

    describe('interactivity', () => {
        const playerA = playerBuilder('PLAYER A').build();
        const playerB = playerBuilder('PLAYER B').build();
        const playerC = playerBuilder('PLAYER C').build();
        const playerD = playerBuilder('PLAYER D').build();
        const teamA = teamBuilder('HOST')
            .forSeason(season, division, [playerA, playerC, player])
            .build();
        const teamB = teamBuilder('OPPONENT')
            .forSeason(season, division, [playerB, playerD, player])
            .build();
        const teamC = teamBuilder('ANOTHER TEAM').forSeason(season).build();
        let tournament: ITournamentBuilder;
        const canRecordSayg = user({
            recordScoresAsYouGo: true,
            showDebugOptions: true,
            manageTournaments: true,
        });
        const removeMatchMsg = 'Are you sure you want to remove this match?';
        const deleteSaygMsg =
            'Are you sure you want to delete the sayg data for this match?';
        const clearScoreMsg =
            'Clear match score (to allow scores to be re-recorded?)';
        const masterDrawSelector = 'div[datatype="master-draw"]';

        function getSideAvBTournament(saygId?: string, matchId?: string) {
            const x = tournament
                .round((r) =>
                    r.withMatch(withSides('SIDE A', 'SIDE B', saygId), matchId),
                )
                .build();

            return { ...x, build: () => x };
        }

        function setPlayerCreatedCallbackForTeam(team: TeamDto) {
            playerCreatedCallback = () => {
                const teamSeason = team.seasons!.find(
                    (ts) => ts.seasonId === season.id,
                )!;
                teamSeason.players!.push({
                    id: createTemporaryId(),
                    name: 'NEW PLAYER',
                });
            };
        }

        async function render(t: IBuilder<TournamentGameDto>, a?: UserDto) {
            await renderComponent(
                props({ tournamentData: t.build() }),
                a ?? user({}),
                undefined,
                [teamA, teamB, teamC],
                season,
            );
        }

        beforeEach(() => {
            tournament = tournamentBuilder()
                .singleRound()
                .host('HOST')
                .opponent('OPPONENT')
                .gender('GENDER')
                .date('2025-05-06')
                .type('TYPE')
                .forSeason(season)
                .forDivision(division)
                .round();
        });

        it('can change type from printable sheet', async () => {
            await render(tournament);

            await change('input[name="type"]', 'NEW TYPE');

            expect(updatedTournament!.save).not.toEqual(true);
            expect(updatedTournament!.updated.type).toEqual('NEW TYPE');
        });

        it('saves type when caret leaves input', async () => {
            const updatableTournamentData = tournament.build();
            async function update(u: TournamentGameDto, s?: boolean) {
                Object.assign(updatableTournamentData, u);
                await setTournamentData(u, s);
            }

            await renderComponent(
                props({
                    tournamentData: updatableTournamentData,
                    setTournamentData: update,
                }),
            );

            await change('input[name="type"]', 'NEW TYPE');
            await context.required('input[name="type"]').blur();

            expect(updatedTournament!.save).toEqual(true);
            expect(updatedTournament!.updated.type).toEqual('NEW TYPE');
        });

        it('can change gender from printable sheet', async () => {
            await render(tournament);

            await select('[datatype="gender"] .dropdown-menu', 'Men');

            expect(updatedTournament!.save).toEqual(true);
            expect(updatedTournament!.updated.gender).toEqual('men');
        });

        it('can change host from printable sheet', async () => {
            await render(tournament);

            await select('[datatype="host"] .dropdown-menu', teamC.name);

            expect(updatedTournament!.save).toEqual(true);
            expect(updatedTournament!.updated.host).toEqual(teamC.name);
        });

        it('can change opponent from printable sheet', async () => {
            await render(tournament);

            await select('[datatype="opponent"] .dropdown-menu', teamC.name);

            expect(updatedTournament!.save).toEqual(true);
            expect(updatedTournament!.updated.opponent).toEqual(teamC.name);
        });

        it('does not save tournament when only host player set', async () => {
            await render(tournament);

            await getNewSinglesMatchRow()
                .required('td:nth-child(2) .dropdown-menu')
                .select('PLAYER A');

            expect(updatedTournament).toBeNull();
        });

        it('does not save tournament when only opponent player set', async () => {
            await render(tournament);

            await getNewSinglesMatchRow()
                .required('td:nth-child(4) .dropdown-menu')
                .select('PLAYER B');

            expect(updatedTournament).toBeNull();
        });

        it('can add host player', async () => {
            await render(tournament, user({ managePlayers: true }));
            setPlayerCreatedCallbackForTeam(teamA);

            await getNewSinglesMatchRow()
                .required('td:nth-child(2) .dropdown-menu')
                .select('➕ New Player/s');
            await getDialog()!.required('textarea').change('NEW PLAYER');
            await getDialog()!.button('Add players').click();
            await getNewSinglesMatchRow()
                .required('td:nth-child(2) .dropdown-menu')
                .select('NEW PLAYER');

            expect(createdPlayer).toEqual({
                seasonId: season.id,
                divisionId: division.id,
                teamId: teamA.id,
                player: {
                    name: 'NEW PLAYER',
                    captain: false,
                },
            });
        });

        it('can add opponent player', async () => {
            await render(tournament, user({ managePlayers: true }));
            setPlayerCreatedCallbackForTeam(teamB);

            await getNewSinglesMatchRow()
                .required('td:nth-child(4) .dropdown-menu')
                .select('➕ New Player/s');
            await getDialog()!.required('textarea').change('NEW PLAYER');
            await getDialog()!.button('Add players').click();
            await getNewSinglesMatchRow()
                .required('td:nth-child(4) .dropdown-menu')
                .select('NEW PLAYER');

            expect(createdPlayer).toEqual({
                seasonId: season.id,
                divisionId: division.id,
                teamId: teamB.id,
                player: {
                    name: 'NEW PLAYER',
                    captain: false,
                },
            });
        });

        it('can close add player dialog', async () => {
            await render(tournament, user({ managePlayers: true }));
            await getNewSinglesMatchRow()
                .required('td:nth-child(2) .dropdown-menu')
                .select('➕ New Player/s');

            await getDialog()!.button('Cancel').click();

            expect(getDialog()).toBeFalsy();
        });

        it('shows message when player cannot be found', async () => {
            const tournament = getSideAvBTournament();
            tournament.round!.matches![0].sideA!.players = [playerD];
            tournament.build = () => tournament;
            await render(tournament, user({ managePlayers: true }));

            await editButton(
                context.required('table tbody tr:first-child td:nth-child(2)'),
            ).click();

            context.prompts.alertWasShown(
                `Unable to find player PLAYER D (id: ${playerD.id}) in team HOST`,
            );
            expect(updatedTournament).toBeNull();
        });

        it('can edit host player', async () => {
            await render(getSideAvBTournament(), user({ managePlayers: true }));

            await editButton(
                context.required('table tbody tr:first-child td:nth-child(2)'),
            ).click();
            await getDialog()!.input('name').change('UPDATED PLAYER');
            await getDialog()!.button('Save player').click();

            expect(updatedPlayer).toEqual({
                seasonId: season.id,
                teamId: teamA.id,
                player: {
                    name: 'UPDATED PLAYER',
                    gender: '',
                },
                playerId: player.id,
            });
            expect(updatedTournament!.save).toEqual(true);
            expect(updatedTournament!.updated.round?.matches).toEqual([
                equatableMatch(
                    equatableSide(
                        'UPDATED PLAYER',
                        withName(player, 'UPDATED PLAYER'),
                    ),
                    equatableSide('SIDE B', player),
                ),
            ]);
        });

        it('can edit opponent player', async () => {
            await render(getSideAvBTournament(), user({ managePlayers: true }));

            await editButton(
                context.required('table tbody tr:first-child td:nth-child(4)'),
            ).click();
            await getDialog()!.input('name').change('UPDATED PLAYER');
            await getDialog()!.button('Save player').click();

            expect(updatedPlayer).toEqual({
                seasonId: season.id,
                teamId: teamB.id,
                player: {
                    name: 'UPDATED PLAYER',
                    gender: '',
                },
                playerId: player.id,
            });
            expect(updatedTournament!.save).toEqual(true);
            expect(updatedTournament!.updated.round?.matches).toEqual([
                equatableMatch(
                    equatableSide('SIDE A', player),
                    equatableSide(
                        'UPDATED PLAYER',
                        withName(player, 'UPDATED PLAYER'),
                    ),
                ),
            ]);
        });

        it('can close edit player dialog', async () => {
            await render(getSideAvBTournament(), user({ managePlayers: true }));

            await editButton(
                context.required('table tbody tr:first-child td:nth-child(2)'),
            ).click();
            await getDialog()!.input('name').change('UPDATED PLAYER');
            await getDialog()!.button('Cancel').click();

            expect(getDialog()).toBeFalsy();
        });

        it('reports error if team cannot be found', async () => {
            await render(
                tournament.host('TEAM A '),
                user({ managePlayers: true }),
            );
            await getNewSinglesMatchRow()
                .required('td:nth-child(2) .dropdown-menu')
                .select('➕ New Player/s');

            expect(getDialog()).toBeFalsy();
            reportedError.verifyErrorEquals(
                "Unable to find team with name 'TEAM A '",
            );
        });

        it('saves tournament when both players are set', async () => {
            const matchOptionDefaults = matchOptionsBuilder()
                .numberOfLegs(7)
                .build();
            const tournamentProps = new tournamentContainerPropsBuilder()
                .withMatchOptionDefaults(matchOptionDefaults)
                .build();
            await renderComponent(
                props({ tournamentData: tournament.build() }),
                user({}),
                tournamentProps,
                [teamA, teamB, teamC],
                season,
            );

            await getNewSinglesMatchRow()
                .required('td:nth-child(2) .dropdown-menu')
                .select('PLAYER A');
            await getNewSinglesMatchRow()
                .required('td:nth-child(4) .dropdown-menu')
                .select('PLAYER B');

            expect(updatedTournament!.save).toEqual(true);
            expect(updatedTournament!.updated.round?.matches).toEqual([
                equatableMatch(
                    equatableSide('PLAYER A', playerA),
                    equatableSide('PLAYER B', playerB),
                ),
            ]);
            expect(
                updatedTournament!.updated.round!.matchOptions![0].numberOfLegs,
            ).toEqual(7);
        });

        it('saves tournament when sideA changed for existing match', async () => {
            await render(getSideAvBTournament());

            await context
                .required('table tbody tr:first-child')
                .required('td:nth-child(2) .dropdown-menu')
                .select('PLAYER C');

            expect(updatedTournament!.save).toEqual(true);
            expect(updatedTournament!.updated.round?.matches).toEqual([
                equatableMatch(
                    equatableSide('PLAYER C', playerC),
                    equatableSide('SIDE B', player),
                ),
            ]);
        });

        it('saves tournament when sideB changed for existing match', async () => {
            await render(getSideAvBTournament());

            await context
                .required(
                    'table tbody tr:first-child td:nth-child(4) .dropdown-menu',
                )
                .select('PLAYER D');

            expect(updatedTournament!.save).toEqual(true);
            expect(updatedTournament!.updated.round?.matches).toEqual([
                equatableMatch(
                    equatableSide('SIDE A', player),
                    equatableSide('PLAYER D', playerD),
                ),
            ]);
        });

        it('saves tournament when all pairs players are set', async () => {
            const matchOptionDefaults = matchOptionsBuilder()
                .numberOfLegs(7)
                .build();
            const tournamentProps = new tournamentContainerPropsBuilder()
                .withMatchOptionDefaults(matchOptionDefaults)
                .build();
            await renderComponent(
                props({ tournamentData: tournament.build() }),
                user({}),
                tournamentProps,
                [teamA, teamB, teamC],
                season,
            );

            await getNewPairsMatchRow()
                .required(
                    'td:nth-child(2) [datatype="player-index-0"] .dropdown-menu',
                )
                .select('PLAYER A');
            await getNewPairsMatchRow()
                .required(
                    'td:nth-child(2) [datatype="player-index-1"] .dropdown-menu',
                )
                .select('PLAYER C');
            await getNewPairsMatchRow()
                .required(
                    'td:nth-child(4) [datatype="player-index-0"] .dropdown-menu',
                )
                .select('PLAYER B');
            await getNewPairsMatchRow()
                .required(
                    'td:nth-child(4) [datatype="player-index-1"] .dropdown-menu',
                )
                .select('PLAYER D');

            expect(updatedTournament!.save).toEqual(true);
            expect(updatedTournament!.updated.round?.matches).toEqual([
                equatableMatch(
                    equatableSide('PLAYER & PLAYER', playerA, playerC),
                    equatableSide('PLAYER & PLAYER', playerB, playerD),
                ),
            ]);
            expect(
                updatedTournament!.updated.round!.matchOptions![0].numberOfLegs,
            ).toEqual(5);
        });

        it('cannot change host when match exists', async () => {
            const tournamentData = getSideAvBTournament();
            await renderComponent(props({ tournamentData }), user({}));

            expect(
                context.optional('[datatype="host"] .dropdown-menu'),
            ).toBeFalsy();
            expect(
                context.optional('[datatype="opponent"] .dropdown-menu'),
            ).toBeFalsy();
        });

        it('can delete match when permitted', async () => {
            const tournamentData = getSideAvBTournament();
            await renderComponent(props({ tournamentData }), canRecordSayg);
            context.prompts.respondToConfirm(removeMatchMsg, true);

            await context.required(masterDrawSelector).button('🗑️ 1').click();

            expect(updatedTournament?.save).toEqual(true);
            expect(updatedTournament?.updated.round?.matches).toEqual([]);
            expect(updatedTournament?.updated.round?.matchOptions).toEqual([]);
        });

        it('does not delete match when cancelled', async () => {
            const tournamentData = getSideAvBTournament();
            await renderComponent(props({ tournamentData }), canRecordSayg);
            context.prompts.respondToConfirm(removeMatchMsg, false);

            await context.required(masterDrawSelector).button('🗑️ 1').click();

            expect(updatedTournament).toEqual(null);
        });

        it('cannot not delete match when not permitted', async () => {
            const tournamentData = getSideAvBTournament();
            await renderComponent(
                props({ tournamentData, readOnly: true }),
                canRecordSayg,
            );

            expect(context.container.innerHTML).not.toContain('🗑️');
        });

        it('can open sayg dialog when permitted', async () => {
            const saygId = createTemporaryId();
            const tournamentData = getSideAvBTournament();
            const match = tournamentData.round!.matches![0];
            newSaygResponse = () => getSideAvBTournament(saygId, match.id);
            await renderComponent(
                props({ tournamentData: tournamentData }),
                canRecordSayg,
                new tournamentContainerPropsBuilder({
                    tournamentData,
                }).build(),
            );

            await context
                .required(masterDrawSelector)
                .button(START_SCORING)
                .click();

            expect(mockedUsedNavigate).toHaveBeenCalledWith(`/test#${saygId}`);
        });

        it('can delete sayg from match', async () => {
            const saygId = createTemporaryId();
            const matchId = createTemporaryId();
            const tournamentData = getSideAvBTournament(saygId, matchId);
            const containerProps = new tournamentContainerPropsBuilder({
                tournamentData,
            });

            await renderComponent(
                props({ tournamentData: tournamentData }),
                canRecordSayg,
                containerProps.build(),
                undefined,
                undefined,
                `/test#${saygId}`,
            );
            await context
                .required(masterDrawSelector)
                .button(START_SCORING)
                .click();
            context.prompts.respondToConfirm(deleteSaygMsg, true);
            context.prompts.respondToConfirm(clearScoreMsg, true);

            await getDialog()!.button('Delete sayg').click();

            expect(saygDeleted).toEqual({
                id: tournamentData.id,
                matchId: matchId,
            });
        });

        it('cannot select a player that is already playing in another tournament', async () => {
            const containerProps = new tournamentContainerPropsBuilder()
                .withAlreadyPlaying(alreadyPlaying('BOARD 2', playerA))
                .build();
            await renderComponent(
                props({
                    tournamentData: tournament
                        .round((r) =>
                            r.withMatch((m) =>
                                m
                                    .sideA('PLAYER', undefined, playerA)
                                    .sideB('SIDE B', undefined),
                            ),
                        )
                        .build(),
                }),
                user({}),
                containerProps,
                [teamA],
            );

            const masterDraw = context.required(
                'div.d-flex > div:nth-child(1)',
            );
            const home = masterDraw.required(
                'table tbody tr:first-child td:nth-child(2)',
            );
            await home.required('.dropdown-toggle').click();

            const options = home.all('.dropdown-item');
            const optionText = options.map((o) => o.text());
            expect(optionText).toContain('🚫 PLAYER A (playing on BOARD 2)');
        });
    });

    describe('sayg', () => {
        const playerA = playerBuilder('PLAYER A').build();
        const playerB = playerBuilder('PLAYER B').build();
        const account = user({
            recordScoresAsYouGo: true,
            manageTournaments: true,
        });
        let tournament: ITournamentBuilder;

        beforeEach(() => {
            tournament = tournamentBuilder()
                .singleRound()
                .host('HOST')
                .opponent('OPPONENT')
                .gender('GENDER')
                .date('2025-05-06')
                .type('TYPE')
                .forSeason(season)
                .forDivision(division)
                .round();
        });

        function matchWithSayg(
            saygId: string,
        ): (m: ITournamentMatchBuilder) => ITournamentMatchBuilder {
            return (m) =>
                m
                    .sideA('SIDE A', undefined, playerA)
                    .sideB('SIDE B', undefined, playerB)
                    .saygId(saygId);
        }

        it('does not patch in 180s', async () => {
            const saygId = createTemporaryId();
            const tournamentData = tournament
                .round((r) => r.withMatch(matchWithSayg(saygId)))
                .build();
            await renderComponent(
                props({ tournamentData }),
                account,
                undefined,
                undefined,
                undefined,
                `/test/#${saygId}`,
            );

            await keyPad(context, ['1', '8', '0', ENTER_SCORE_BUTTON]);

            expect(patchedData).toEqual([]);
        });

        it('does not patch in hi-checks', async () => {
            const saygId = createTemporaryId();
            const tournamentData = tournament
                .round((r) => r.withMatch(matchWithSayg(saygId)))
                .build();
            await renderComponent(
                props({
                    tournamentData: tournamentData,
                    patchData,
                }),
                account,
                undefined,
                undefined,
                undefined,
                `/test#${saygId}`,
            );

            await enterScores(
                context,
                [100, 100, 100, 100, 101],
                [100, 100, 100, 100],
            );
            await checkoutWith(context, '2');

            expect(patchedData).toEqual([
                {
                    nestInRound: true,
                    patch: {
                        match: {
                            scoreA: 0,
                            scoreB: 1,
                            sideA: expect.any(String),
                            sideB: expect.any(String),
                        },
                    },
                    saygId: saygId,
                },
            ]);
        });

        it('records regular checkout with a patch', async () => {
            const saygId = createTemporaryId();
            const tournamentData = tournament
                .round((r) => r.withMatch(matchWithSayg(saygId)))
                .build();
            await renderComponent(
                props({
                    tournamentData: tournamentData,
                    patchData,
                }),
                account,
                undefined,
                undefined,
                undefined,
                `/test/#${saygId}`,
            );

            await enterScores(
                context,
                [100, 100, 100, 130, 71],
                [100, 100, 100, 100],
            );
            await checkoutWith(context, '2');

            expect(patchedData).toEqual([
                {
                    nestInRound: true,
                    patch: {
                        match: {
                            scoreA: 0,
                            scoreB: 1,
                            sideA: expect.any(String),
                            sideB: expect.any(String),
                        },
                    },
                    saygId: saygId,
                },
            ]);
        });
    });
});
