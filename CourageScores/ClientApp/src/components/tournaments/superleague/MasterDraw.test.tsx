import { act, fireEvent } from '@testing-library/react';
import {
    api,
    appProps,
    brandingProps,
    cleanUp,
    doChange,
    doClick,
    doSelectOption,
    ErrorState,
    findButton,
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
import { TournamentPlayerDto } from '../../../interfaces/models/dtos/Game/TournamentPlayerDto';
import { TournamentSideDto } from '../../../interfaces/models/dtos/Game/TournamentSideDto';
import { TournamentMatchDto } from '../../../interfaces/models/dtos/Game/TournamentMatchDto';

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

    const tournamentApi = api<ITournamentGameApi>({
        async update(): Promise<IClientActionResultDto<TournamentGameDto>> {
            return {
                success: true,
            };
        },
        async addSayg(): Promise<IClientActionResultDto<TournamentGameDto>> {
            return {
                success: true,
            };
        },
        async deleteSayg(
            id: string,
            matchId: string,
        ): Promise<IClientActionResultDto<TournamentGameDto>> {
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
        async upsert(
            data: UpdateRecordedScoreAsYouGoDto,
        ): Promise<IClientActionResultDto<RecordedScoreAsYouGoDto>> {
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
    });

    async function setTournamentData(
        updated: TournamentGameDto,
        save?: boolean,
    ) {
        updatedTournament = { updated, save };
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
    ) {
        context = await renderApp(
            iocProps({ tournamentApi, saygApi, playerApi }),
            brandingProps(),
            appProps(
                {
                    account,
                    teams: teams || [],
                    seasons: season ? [season] : undefined,
                },
                reportedError,
            ),
            <TournamentContainer
                {...(containerProps ??
                    new tournamentContainerPropsBuilder().build())}>
                <MasterDraw {...props} />
            </TournamentContainer>,
        );

        reportedError.verifyNoError();
    }

    function getNewMatchRow() {
        return context.container.querySelector('table tbody tr:last-child')!;
    }

    function getDialog() {
        return context.container.querySelector('.modal-dialog');
    }

    async function change(selector: string, text: string, container?: Element) {
        await doChange(
            container ?? context.container,
            selector,
            text,
            context.user,
        );
    }

    async function select(
        selector: string,
        value: string,
        container?: Element,
    ) {
        await doSelectOption(
            (container ?? context.container).querySelector(selector),
            value,
        );
    }

    function equatableSide(
        name: string,
        ...players: TournamentPlayerDto[]
    ): TournamentSideDto {
        return {
            id: expect.any(String),
            name: name,
            players: players,
        };
    }

    function equatableMatch(
        sideA: TournamentSideDto,
        sideB: TournamentSideDto,
    ): TournamentMatchDto {
        return {
            id: expect.any(String),
            sideA,
            sideB,
        };
    }

    function editButton(container: Element | null) {
        return findButton(container!, '✏️');
    }

    function find(selector: string) {
        return context.container.querySelector(selector);
    }

    describe('renders', () => {
        const season = seasonBuilder('SEASON').build();
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
                                .withMatch((m) => m.sideA('A').sideB('B'))
                                .withMatch((m) => m.sideA('C').sideB('D')),
                        )
                        .build(),
                    readOnly: true,
                }),
            );

            const table = find('table.table')!;
            const rows = Array.from(table.querySelectorAll('tbody tr'));
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

            const properties = find('div.d-flex > div:nth-child(2)')!;
            const date = renderDate('2023-05-06');
            expect(properties.textContent).toContain('Gender: GENDER');
            expect(properties.textContent).toContain(`Date: ${date}`);
            expect(properties.textContent).toContain('Notes: Board 1');
        });

        it('when no type', async () => {
            await renderComponent(
                props({
                    tournamentData: tournament.type(undefined!).build(),
                    readOnly: true,
                }),
            );

            const properties = find('div.d-flex > div:nth-child(2)')!;
            expect(properties.textContent).toContain('Gender: GENDER');
            expect(properties.textContent).not.toContain('Notes:');
        });

        it('already playing player in collapsed drop-down with their name only', async () => {
            const player = playerBuilder('PLAYER').build();
            const team = teamBuilder('HOST')
                .forSeason(season, null, [player])
                .build();
            const containerProps = new tournamentContainerPropsBuilder()
                .withAlreadyPlaying({
                    [player.id]: tournamentBuilder().type('BOARD 2').build(),
                })
                .build();
            await renderComponent(
                props({
                    tournamentData: tournament
                        .round((r) =>
                            r.withMatch((m) =>
                                m
                                    .sideA('PLAYER', undefined, player)
                                    .sideB('SIDE B', undefined),
                            ),
                        )
                        .build(),
                }),
                user({}),
                containerProps,
                [team],
            );

            const masterDraw = find('div.d-flex > div:nth-child(1)')!;
            const homeSide = masterDraw.querySelector(
                'table tbody tr:first-child td:nth-child(2)',
            )!;
            const toggle = homeSide.querySelector('.dropdown-toggle')!;
            expect(toggle.textContent).toContain('PLAYER');
        });
    });

    describe('interactivity', () => {
        const season = seasonBuilder('SEASON').build();
        const division = divisionBuilder('DIVISION').build();
        const playerA = playerBuilder('PLAYER A').build();
        const playerB = playerBuilder('PLAYER B').build();
        const playerC = playerBuilder('PLAYER C').build();
        const playerD = playerBuilder('PLAYER D').build();
        const teamA = teamBuilder('HOST')
            .forSeason(season, division, [playerA, playerC])
            .build();
        const teamB = teamBuilder('OPPONENT')
            .forSeason(season, division, [playerB, playerD])
            .build();
        const teamC = teamBuilder('ANOTHER TEAM').forSeason(season).build();
        let tournament: ITournamentBuilder;
        const canRecordSayg = user({
            recordScoresAsYouGo: true,
            showDebugOptions: true,
        });
        const removeMatchMsg = 'Are you sure you want to remove this match?';
        const deleteSaygMsg =
            'Are you sure you want to delete the sayg data for this match?';
        const clearScoreMsg =
            'Clear match score (to allow scores to be re-recorded?)';
        const masterDrawSelector = 'div[datatype="master-draw"]';

        function getSideAvBTournament(saygId?: string, matchId?: string) {
            return tournament
                .round((r) =>
                    r.withMatch(
                        (m) => m.sideA('SIDE A').sideB('SIDE B').saygId(saygId),
                        matchId,
                    ),
                )
                .build();
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

        async function render(
            tournament: ITournamentBuilder,
            account?: UserDto,
        ) {
            await renderComponent(
                props({ tournamentData: tournament.build() }),
                account ?? user({}),
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
            async function inlineUpdateTournament(
                update: TournamentGameDto,
                save?: boolean,
            ) {
                Object.assign(updatableTournamentData, update);
                await setTournamentData(update, save);
            }

            await renderComponent(
                props({
                    tournamentData: updatableTournamentData,
                    setTournamentData: inlineUpdateTournament,
                }),
            );

            await change('input[name="type"]', 'NEW TYPE');
            act(() => {
                fireEvent.blur(find('input[name="type"]')!, {});
            });

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

            await select(
                'td:nth-child(2) .dropdown-menu',
                'PLAYER A',
                getNewMatchRow(),
            );

            expect(updatedTournament).toBeNull();
        });

        it('does not save tournament when only opponent player set', async () => {
            await render(tournament);

            await select(
                'td:nth-child(4) .dropdown-menu',
                'PLAYER B',
                getNewMatchRow(),
            );

            expect(updatedTournament).toBeNull();
        });

        it('can add host player', async () => {
            await render(tournament, user({ managePlayers: true }));
            setPlayerCreatedCallbackForTeam(teamA);

            await select(
                'td:nth-child(2) .dropdown-menu',
                '➕ New Player/s',
                getNewMatchRow(),
            );
            await change('textarea', 'NEW PLAYER', getDialog()!);
            await doClick(findButton(getDialog()!, 'Add players'));
            await select(
                'td:nth-child(2) .dropdown-menu',
                'NEW PLAYER',
                getNewMatchRow(),
            );

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

            await select(
                'td:nth-child(4) .dropdown-menu',
                '➕ New Player/s',
                getNewMatchRow(),
            );
            await change('textarea', 'NEW PLAYER', getDialog()!);
            await doClick(findButton(getDialog()!, 'Add players'));
            await select(
                'td:nth-child(4) .dropdown-menu',
                'NEW PLAYER',
                getNewMatchRow(),
            );

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
            await select(
                'td:nth-child(2) .dropdown-menu',
                '➕ New Player/s',
                getNewMatchRow(),
            );

            await doClick(findButton(getDialog()!, 'Cancel'));

            expect(getDialog()).toBeFalsy();
        });

        it('shows message when player cannot be found', async () => {
            await render(
                tournament.round((r) =>
                    r.withMatch((m) =>
                        m
                            .sideA(playerD.name, undefined, playerD)
                            .sideB(playerB.name, undefined, playerB),
                    ),
                ),
                user({ managePlayers: true }),
            );

            const firstMatchRow = find('table tbody tr:first-child')!;
            await doClick(
                editButton(firstMatchRow.querySelector('td:nth-child(2)')),
            );

            context.prompts.alertWasShown(
                `Unable to find player PLAYER D (id: ${playerD.id}) in team HOST`,
            );
            expect(updatedTournament).toBeNull();
        });

        it('can edit host player', async () => {
            await render(
                tournament.round((r) =>
                    r.withMatch((m) =>
                        m
                            .sideA(playerA.name, undefined, playerA)
                            .sideB(playerB.name, undefined, playerB),
                    ),
                ),
                user({ managePlayers: true }),
            );

            const match = find('table tbody tr:first-child')!;
            await doClick(editButton(match.querySelector('td:nth-child(2)')));
            await change('input[name="name"]', 'UPDATED PLAYER', getDialog()!);
            await doClick(findButton(getDialog()!, 'Save player'));

            expect(updatedPlayer).toEqual({
                seasonId: season.id,
                teamId: teamA.id,
                player: {
                    name: 'UPDATED PLAYER',
                },
                playerId: playerA.id,
            });
            expect(updatedTournament!.save).toEqual(true);
            expect(updatedTournament!.updated.round?.matches).toEqual([
                equatableMatch(
                    equatableSide('UPDATED PLAYER', playerA),
                    equatableSide('PLAYER B', playerB),
                ),
            ]);
        });

        it('can edit opponent player', async () => {
            await render(
                tournament.round((r) =>
                    r.withMatch((m) =>
                        m
                            .sideA(playerA.name, undefined, playerA)
                            .sideB(playerB.name, undefined, playerB),
                    ),
                ),
                user({ managePlayers: true }),
            );

            const match = find('table tbody tr:first-child')!;
            await doClick(editButton(match.querySelector('td:nth-child(4)')));
            await change('input[name="name"]', 'UPDATED PLAYER', getDialog()!);
            await doClick(findButton(getDialog()!, 'Save player'));

            expect(updatedPlayer).toEqual({
                seasonId: season.id,
                teamId: teamB.id,
                player: {
                    name: 'UPDATED PLAYER',
                },
                playerId: playerB.id,
            });
            expect(updatedTournament!.save).toEqual(true);
            expect(updatedTournament!.updated.round?.matches).toEqual([
                equatableMatch(
                    equatableSide('PLAYER A', playerA),
                    equatableSide('UPDATED PLAYER', playerB),
                ),
            ]);
        });

        it('can close edit player dialog', async () => {
            await render(
                tournament.round((r) =>
                    r.withMatch((m) =>
                        m
                            .sideA(playerA.name, undefined, playerA)
                            .sideB(playerB.name, undefined, playerB),
                    ),
                ),
                user({ managePlayers: true }),
            );

            const match = find('table tbody tr:first-child')!;
            await doClick(editButton(match.querySelector('td:nth-child(2)')));
            await change('input[name="name"]', 'UPDATED PLAYER', getDialog()!);
            await doClick(findButton(getDialog()!, 'Cancel'));

            expect(getDialog()).toBeFalsy();
        });

        it('reports error if team cannot be found', async () => {
            await render(
                tournament.host('TEAM A '),
                user({ managePlayers: true }),
            );
            await select(
                'td:nth-child(2) .dropdown-menu',
                '➕ New Player/s',
                getNewMatchRow(),
            );

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

            await select(
                'td:nth-child(2) .dropdown-menu',
                'PLAYER A',
                getNewMatchRow(),
            );
            await select(
                'td:nth-child(4) .dropdown-menu',
                'PLAYER B',
                getNewMatchRow(),
            );

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
            await render(
                tournament.round((r) =>
                    r.withMatch((m) =>
                        m
                            .sideA('PLAYER A', undefined, playerA)
                            .sideB('PLAYER B', undefined, playerB),
                    ),
                ),
            );

            await select(
                'td:nth-child(2) .dropdown-menu',
                'PLAYER C',
                find('table tbody tr:first-child')!,
            );

            expect(updatedTournament!.save).toEqual(true);
            expect(updatedTournament!.updated.round?.matches).toEqual([
                equatableMatch(
                    equatableSide('PLAYER C', playerC),
                    equatableSide('PLAYER B', playerB),
                ),
            ]);
        });

        it('saves tournament when sideB changed for existing match', async () => {
            await render(
                tournament.round((r) =>
                    r.withMatch((m) =>
                        m
                            .sideA('PLAYER A', undefined, playerA)
                            .sideB('PLAYER B', undefined, playerB),
                    ),
                ),
            );

            await select(
                'td:nth-child(4) .dropdown-menu',
                'PLAYER D',
                find('table tbody tr:first-child')!,
            );

            expect(updatedTournament!.save).toEqual(true);
            expect(updatedTournament!.updated.round?.matches).toEqual([
                equatableMatch(
                    equatableSide('PLAYER A', playerA),
                    equatableSide('PLAYER D', playerD),
                ),
            ]);
        });

        it('cannot change host when match exists', async () => {
            const tournamentData = getSideAvBTournament();
            await renderComponent(props({ tournamentData }), user({}));

            expect(find('[datatype="host"] .dropdown-menu')).toBeNull();
            expect(find('[datatype="opponent"] .dropdown-menu')).toBeNull();
        });

        it('can delete match when permitted', async () => {
            const tournamentData = getSideAvBTournament();
            await renderComponent(props({ tournamentData }), canRecordSayg);
            context.prompts.respondToConfirm(removeMatchMsg, true);

            await doClick(findButton(find(masterDrawSelector), '🗑️ 1'));

            expect(updatedTournament?.save).toEqual(true);
            expect(updatedTournament?.updated.round?.matches).toEqual([]);
            expect(updatedTournament?.updated.round?.matchOptions).toEqual([]);
        });

        it('does not delete match when cancelled', async () => {
            const tournamentData = getSideAvBTournament();
            await renderComponent(props({ tournamentData }), canRecordSayg);
            context.prompts.respondToConfirm(removeMatchMsg, false);

            await doClick(findButton(find(masterDrawSelector), '🗑️ 1'));

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
            const tournamentData = getSideAvBTournament();

            await renderComponent(
                props({ tournamentData: tournamentData }),
                canRecordSayg,
                new tournamentContainerPropsBuilder({
                    tournamentData,
                }).build(),
            );

            await doClick(findButton(find(masterDrawSelector), START_SCORING));

            expect(getDialog()).toBeTruthy();
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
            );
            await doClick(findButton(find(masterDrawSelector), START_SCORING));
            context.prompts.respondToConfirm(deleteSaygMsg, true);
            context.prompts.respondToConfirm(clearScoreMsg, true);

            await doClick(findButton(getDialog(), 'Delete sayg'));

            expect(saygDeleted).toEqual({
                id: tournamentData.id,
                matchId: matchId,
            });
        });

        it('cannot select a player that is already playing in another tournament', async () => {
            const containerProps = new tournamentContainerPropsBuilder()
                .withAlreadyPlaying({
                    [playerA.id]: tournamentBuilder().type('BOARD 2').build(),
                })
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

            const masterDraw = find('div.d-flex > div:nth-child(1)')!;
            const home = masterDraw.querySelector(
                'table tbody tr:first-child td:nth-child(2)',
            )!;
            await doClick(home.querySelector('.dropdown-toggle')!);

            const options = Array.from(home.querySelectorAll('.dropdown-item'));
            const optionText = options.map((o) => o.textContent);
            expect(optionText).toContain('🚫 PLAYER A (playing on BOARD 2)');
        });
    });

    describe('sayg', () => {
        const season = seasonBuilder('SEASON').build();
        const division = divisionBuilder('DIVISION').build();
        const playerA = playerBuilder('PLAYER A').build();
        const playerB = playerBuilder('PLAYER B').build();
        const account = user({
            recordScoresAsYouGo: true,
        });
        const masterDrawSelector = 'div[datatype="master-draw"]';
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

        it('does not patch in 180s', async () => {
            const tournamentData = tournament
                .round((r) =>
                    r.withMatch((m) =>
                        m
                            .sideA('SIDE A', undefined, playerA)
                            .sideB('SIDE B', undefined, playerB)
                            .saygId(createTemporaryId()),
                    ),
                )
                .build();
            await renderComponent(props({ tournamentData }), account);
            await doClick(findButton(find(masterDrawSelector), START_SCORING));
            reportedError.verifyNoError();

            await keyPad(context, ['1', '8', '0', ENTER_SCORE_BUTTON]);

            expect(patchedData).toEqual([]);
        });

        it('does not patch in hi-checks', async () => {
            const saygId = createTemporaryId();
            const tournamentData = tournament
                .round((r) =>
                    r.withMatch((m) =>
                        m
                            .sideA('SIDE A', undefined, playerA)
                            .sideB('SIDE B', undefined, playerB)
                            .saygId(saygId),
                    ),
                )
                .build();
            await renderComponent(
                props({
                    tournamentData: tournamentData,
                    patchData,
                }),
                account,
            );
            await doClick(findButton(find(masterDrawSelector), START_SCORING));
            reportedError.verifyNoError();

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
                .round((r) =>
                    r.withMatch((m) =>
                        m
                            .sideA('SIDE A', undefined, playerA)
                            .sideB('SIDE B', undefined, playerB)
                            .saygId(saygId),
                    ),
                )
                .build();
            await renderComponent(
                props({
                    tournamentData: tournamentData,
                    patchData,
                }),
                account,
            );
            await doClick(findButton(find(masterDrawSelector), START_SCORING));
            reportedError.verifyNoError();

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
