﻿import {act, fireEvent} from "@testing-library/react";
import {
    api,
    appProps,
    brandingProps,
    cleanUp, doChange, doClick, doSelectOption,
    ErrorState, findButton,
    iocProps, noop,
    renderApp,
    TestContext
} from "../../../helpers/tests";
import {IMasterDrawProps, MasterDraw} from "./MasterDraw";
import {renderDate} from "../../../helpers/rendering";
import {ITournamentBuilder, tournamentBuilder} from "../../../helpers/builders/tournaments";
import {ITournamentContainerProps, TournamentContainer} from "../TournamentContainer";
import {UserDto} from "../../../interfaces/models/dtos/Identity/UserDto";
import {TournamentGameDto} from "../../../interfaces/models/dtos/Game/TournamentGameDto";
import {ITournamentGameApi} from "../../../interfaces/apis/ITournamentGameApi";
import {EditTournamentGameDto} from "../../../interfaces/models/dtos/Game/EditTournamentGameDto";
import {IClientActionResultDto} from "../../common/IClientActionResultDto";
import {CreateTournamentSaygDto} from "../../../interfaces/models/dtos/Game/CreateTournamentSaygDto";
import {createTemporaryId} from "../../../helpers/projection";
import {ISaygApi} from "../../../interfaces/apis/ISaygApi";
import {RecordedScoreAsYouGoDto} from "../../../interfaces/models/dtos/Game/Sayg/RecordedScoreAsYouGoDto";
import {saygBuilder} from "../../../helpers/builders/sayg";
import {START_SCORING} from "../tournaments";
import {AccessDto} from "../../../interfaces/models/dtos/Identity/AccessDto";
import {tournamentContainerPropsBuilder} from "../tournamentContainerPropsBuilder";
import {teamBuilder} from "../../../helpers/builders/teams";
import {TeamDto} from "../../../interfaces/models/dtos/Team/TeamDto";
import {seasonBuilder} from "../../../helpers/builders/seasons";
import {SeasonDto} from "../../../interfaces/models/dtos/Season/SeasonDto";
import {playerBuilder} from "../../../helpers/builders/players";
import {divisionBuilder} from "../../../helpers/builders/divisions";
import {IPlayerApi} from "../../../interfaces/apis/IPlayerApi";
import {EditTeamPlayerDto} from "../../../interfaces/models/dtos/Team/EditTeamPlayerDto";
import {matchOptionsBuilder} from "../../../helpers/builders/games";
import {PatchTournamentDto} from "../../../interfaces/models/dtos/Game/PatchTournamentDto";
import {PatchTournamentRoundDto} from "../../../interfaces/models/dtos/Game/PatchTournamentRoundDto";
import {ENTER_SCORE_BUTTON} from "../../../helpers/constants";
import {checkoutWith, enterScores, keyPad} from "../../../helpers/sayg";
import {UpdateRecordedScoreAsYouGoDto} from "../../../interfaces/models/dtos/Game/Sayg/UpdateRecordedScoreAsYouGoDto";

describe('MasterDraw', () => {
    let context: TestContext;
    let reportedError: ErrorState;
    let saygDeleted: { id: string, matchId: string } | null;
    let updatedTournament: { updated: TournamentGameDto, save?: boolean } | null = null;
    let createdPlayer: { divisionId: string, seasonId: string, teamId: string, player: EditTeamPlayerDto } | null = null;
    let updatedPlayer: { seasonId: string, teamId: string, playerId: string, player: EditTeamPlayerDto } | null = null;
    let playerCreatedCallback: (() => void) | null = null;
    let patchedData: { patch: PatchTournamentDto | PatchTournamentRoundDto, nestInRound?: boolean, saygId?: string }[] = [];

    const tournamentApi = api<ITournamentGameApi>({
        async update(_: EditTournamentGameDto): Promise<IClientActionResultDto<TournamentGameDto>> {
            return {
                success: true,
            };
        },
        async addSayg(_: string, __: CreateTournamentSaygDto): Promise<IClientActionResultDto<TournamentGameDto>> {
            return {
                success: true,
            };
        },
        async deleteSayg(id: string, matchId: string): Promise<IClientActionResultDto<TournamentGameDto>> {
            saygDeleted = { id, matchId };
            return {
                success: true,
                result: tournamentBuilder()
                    .round(r => r.withMatch())
                    .build(),
            }
        }
    });
    const saygApi = api<ISaygApi>({
        async get(id: string): Promise<RecordedScoreAsYouGoDto | null> {
            return saygBuilder(id).yourName('HOME').opponentName('AWAY').numberOfLegs(3).startingScore(501).build();
        },
        async upsert(data: UpdateRecordedScoreAsYouGoDto): Promise<IClientActionResultDto<RecordedScoreAsYouGoDto>> {
            return {
                success: true,
                result: Object.assign({ yourName: data.yourName!, id: data.id! }, data),
            }
        }
    });
    const playerApi = api<IPlayerApi>({
        async create(divisionId: string, seasonId: string, teamId: string, player: EditTeamPlayerDto): Promise<IClientActionResultDto<TeamDto>> {
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
                    seasons: [{
                        seasonId: seasonId,
                        players: [],
                    }]
                }
            };
        },
        async update(seasonId: string, teamId: string, playerId: string, player: EditTeamPlayerDto): Promise<IClientActionResultDto<TeamDto>> {
            updatedPlayer = { seasonId, teamId, playerId, player };
            return {
                success: true,
                result: {
                    id: teamId,
                    address: 'unknown',
                    name: 'unknown',
                    seasons: [{
                        seasonId: seasonId,
                        players: [],
                    }]
                }
            };
        }
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

    async function setTournamentData(updated: TournamentGameDto, save?: boolean) {
        updatedTournament = { updated, save };
    }

    async function patchData(patch: PatchTournamentDto | PatchTournamentRoundDto, nestInRound?: boolean, saygId?: string): Promise<boolean> {
        patchedData.push({ patch, nestInRound, saygId });
        return true;
    }

    function user(access: AccessDto): UserDto {
        return {
            name: '',
            givenName: '',
            emailAddress: '',
            access,
        }
    }

    function props(template: Partial<IMasterDrawProps>): IMasterDrawProps {
        const x: Partial<IMasterDrawProps> = {
            setTournamentData,
            patchData: noop
        };

        return Object.assign({}, template, x) as IMasterDrawProps;
    }

    async function renderComponent(props: IMasterDrawProps, account?: UserDto, containerProps?: ITournamentContainerProps, teams?: TeamDto[], season?: SeasonDto) {
        context = await renderApp(
            iocProps({tournamentApi, saygApi, playerApi}),
            brandingProps(),
            appProps({ account, teams: teams || [], seasons: season ? [season] : undefined }, reportedError),
            (<TournamentContainer {...(containerProps ?? new tournamentContainerPropsBuilder().build())}>
                <MasterDraw {...props} />
            </TournamentContainer>));

        reportedError.verifyNoError();
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
            await renderComponent({
                tournamentData: tournament.round(r => r
                    .withMatch(m => m.sideA('A').sideB('B'))
                    .withMatch(m => m.sideA('C').sideB('D'))).build(),
                readOnly: true,
                setTournamentData,
                patchData: noop
            });

            const table = context.container.querySelector('table.table')!;
            const rows = Array.from(table.querySelectorAll('tbody tr'));
            expect(rows.length).toEqual(2);
            expect(Array.from(rows[0].querySelectorAll('td')).map(td => td.textContent)).toEqual(['1', 'A', 'v', 'B', '']);
            expect(Array.from(rows[1].querySelectorAll('td')).map(td => td.textContent)).toEqual(['2', 'C', 'v', 'D', '']);
        });

        it('tournament properties', async () => {
            await renderComponent({
                tournamentData: tournament.type('Board 1').build(),
                readOnly: true,
                setTournamentData,
                patchData: noop
            });

            const tournamentProperties = context.container.querySelector('div.d-flex > div:nth-child(2)')!;
            expect(tournamentProperties.textContent).toContain('Gender: GENDER');
            expect(tournamentProperties.textContent).toContain('Date: ' + renderDate('2023-05-06'));
            expect(tournamentProperties.textContent).toContain('Notes: Board 1');
        });

        it('when no type', async () => {
            await renderComponent({
                tournamentData: tournament.type(undefined!).build(),
                readOnly: true,
                setTournamentData,
                patchData: noop
            });

            const tournamentProperties = context.container.querySelector('div.d-flex > div:nth-child(2)')!;
            expect(tournamentProperties.textContent).toContain('Gender: GENDER');
            expect(tournamentProperties.textContent).not.toContain('Notes:');
        });

        it('already playing player in collapsed drop-down with their name only', async () => {
            const player = playerBuilder('PLAYER').build();
            const team: TeamDto = teamBuilder('HOST').forSeason(season, null, [player]).build();
            const containerProps = new tournamentContainerPropsBuilder()
                .withAlreadyPlaying({
                    [player.id]: tournamentBuilder().type('BOARD 2').build(),
                })
                .build();
            await renderComponent({
                tournamentData: tournament
                    .round(r => r
                        .withMatch(m => m
                            .sideA('PLAYER', undefined, player)
                            .sideB('SIDE B', undefined)))
                    .build(),
                setTournamentData,
                patchData: noop
            }, user({ }), containerProps, [team]);

            const masterDraw = context.container.querySelector('div.d-flex > div:nth-child(1)')!;
            const firstMatch = masterDraw.querySelector('table tbody tr:first-child')!;
            const homeSide = firstMatch.querySelector('td:nth-child(2)')!;
            const homeDropdownToggle = homeSide.querySelector('.dropdown-toggle')!;
            expect(homeDropdownToggle.textContent).toContain('PLAYER');
        });
    });

    describe('interactivity', () => {
        const season = seasonBuilder('SEASON').build();
        const division = divisionBuilder('DIVISION').build();
        const playerA = playerBuilder('PLAYER A').build();
        const playerB = playerBuilder('PLAYER B').build();
        const playerC = playerBuilder('PLAYER C').build();
        const teamA = teamBuilder('HOST')
            .forSeason(season, division, [playerA])
            .build();
        const teamB = teamBuilder('OPPONENT')
            .forSeason(season, division, [playerB])
            .build();
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

        it('can change type from printable sheet', async () => {
            await renderComponent(props({ tournamentData: tournament.build() }));

            await doChange(context.container, 'input[name="type"]', 'NEW TYPE', context.user);

            reportedError.verifyNoError();
            expect(updatedTournament).not.toBeNull();
            expect(updatedTournament?.save).not.toEqual(true);
            expect(updatedTournament?.updated.type).toEqual('NEW TYPE');
        });

        it('saves type when caret leaves input', async () => {
            const updatableTournamentData = tournament.build();
            async function inlineUpdateTournament(update: TournamentGameDto, save?: boolean) {
                Object.assign(updatableTournamentData, update);
                await setTournamentData(update, save);
            }

            await renderComponent({
                tournamentData: updatableTournamentData,
                setTournamentData: inlineUpdateTournament,
                patchData: noop
            });

            await doChange(context.container, 'input[name="type"]', 'NEW TYPE', context.user);
            const input = context.container.querySelector('input[name="type"]')!;
            act(() => {
                fireEvent.blur(input, {});
            });

            reportedError.verifyNoError();
            expect(updatedTournament).not.toBeNull();
            expect(updatedTournament?.save).toEqual(true);
            expect(updatedTournament?.updated.type).toEqual('NEW TYPE');
        });

        it('can change gender from printable sheet', async () => {
            await renderComponent(props({ tournamentData: tournament.build() }));

            await doSelectOption(context.container.querySelector('[datatype="gender"] .dropdown-menu'), 'Men');

            reportedError.verifyNoError();
            expect(updatedTournament).not.toBeNull();
            expect(updatedTournament?.save).toEqual(true);
            expect(updatedTournament?.updated.gender).toEqual('men');
        });

        it('can change host from printable sheet', async () => {
            const teamC = teamBuilder('ANOTHER TEAM').forSeason(season).build();
            await renderComponent(props({ tournamentData: tournament.build() }), user({}), undefined, [ teamA, teamB, teamC ], season);

            await doSelectOption(context.container.querySelector('[datatype="host"] .dropdown-menu'), teamC.name);

            reportedError.verifyNoError();
            expect(updatedTournament).not.toBeNull();
            expect(updatedTournament?.save).toEqual(true);
            expect(updatedTournament?.updated.host).toEqual(teamC.name);
        });

        it('can change opponent from printable sheet', async () => {
            const teamC = teamBuilder('ANOTHER TEAM').forSeason(season).build();
            await renderComponent(props({ tournamentData: tournament.build() }), user({}), undefined, [ teamA, teamB, teamC ], season);

            await doSelectOption(context.container.querySelector('[datatype="opponent"] .dropdown-menu'), teamC.name);

            reportedError.verifyNoError();
            expect(updatedTournament).not.toBeNull();
            expect(updatedTournament?.save).toEqual(true);
            expect(updatedTournament?.updated.opponent).toEqual(teamC.name);
        });

        it('does not save tournament when only host player set', async () => {
            await renderComponent(props({ tournamentData: tournament.build() }), user({}), undefined, [teamA, teamB], season);

            const newMatchRow = context.container.querySelector('table tbody tr:last-child')!;
            await doSelectOption(newMatchRow.querySelector('td:nth-child(2) .dropdown-menu'), 'PLAYER A');

            reportedError.verifyNoError();
            expect(updatedTournament).toBeNull();
        });

        it('does not save tournament when only opponent player set', async () => {
            await renderComponent(props({ tournamentData: tournament.build() }), user({}), undefined, [teamA, teamB], season);

            const newMatchRow = context.container.querySelector('table tbody tr:last-child')!;
            await doSelectOption(newMatchRow.querySelector('td:nth-child(4) .dropdown-menu'), 'PLAYER B');

            reportedError.verifyNoError();
            expect(updatedTournament).toBeNull();
        });

        it('can add host player', async () => {
            await renderComponent(props({ tournamentData: tournament.build() }), user({ managePlayers: true }), undefined, [teamA, teamB], season);
            playerCreatedCallback = () => {
                const teamSeason = teamA.seasons!.find(ts => ts.seasonId === season.id)!;
                teamSeason.players!.push({
                    id: createTemporaryId(),
                    name: 'NEW PLAYER',
                });
            }

            const newMatchRow = context.container.querySelector('table tbody tr:last-child')!;
            await doSelectOption(newMatchRow.querySelector('td:nth-child(2) .dropdown-menu'), '➕ New Player/s');
            await doChange(context.container.querySelector('.modal-dialog')!, 'textarea', 'NEW PLAYER', context.user);
            await doClick(findButton(context.container.querySelector('.modal-dialog')!, 'Add players'));
            await doSelectOption(newMatchRow.querySelector('td:nth-child(2) .dropdown-menu'), 'NEW PLAYER');

            reportedError.verifyNoError();
            expect(createdPlayer).toEqual({
                seasonId: season.id,
                divisionId: division.id,
                teamId: teamA.id,
                player: {
                    name: 'NEW PLAYER',
                    captain: false,
                }
            });
        });

        it('can add opponent player', async () => {
            await renderComponent(props({ tournamentData: tournament.build() }), user({ managePlayers: true }), undefined, [teamA, teamB], season);
            playerCreatedCallback = () => {
                const teamSeason = teamB.seasons!.find(ts => ts.seasonId === season.id)!;
                teamSeason.players!.push({
                    id: createTemporaryId(),
                    name: 'NEW PLAYER',
                });
            }

            const newMatchRow = context.container.querySelector('table tbody tr:last-child')!;
            await doSelectOption(newMatchRow.querySelector('td:nth-child(4) .dropdown-menu'), '➕ New Player/s');
            await doChange(context.container.querySelector('.modal-dialog')!, 'textarea', 'NEW PLAYER', context.user);
            await doClick(findButton(context.container.querySelector('.modal-dialog')!, 'Add players'));
            await doSelectOption(newMatchRow.querySelector('td:nth-child(4) .dropdown-menu'), 'NEW PLAYER');

            reportedError.verifyNoError();
            expect(createdPlayer).toEqual({
                seasonId: season.id,
                divisionId: division.id,
                teamId: teamB.id,
                player: {
                    name: 'NEW PLAYER',
                    captain: false,
                }
            });
        });

        it('can close add player dialog', async () => {
            await renderComponent(props({ tournamentData: tournament.build() }), user({ managePlayers: true }), undefined, [teamA, teamB], season);
            const newMatchRow = context.container.querySelector('table tbody tr:last-child')!;
            await doSelectOption(newMatchRow.querySelector('td:nth-child(2) .dropdown-menu'), '➕ New Player/s');

            await doClick(findButton(context.container.querySelector('.modal-dialog')!, 'Cancel'));

            reportedError.verifyNoError();
            expect(context.container.querySelector('.modal-dialog')).toBeFalsy();
        });

        it('shows message when player cannot be found', async () => {
            await renderComponent({
                tournamentData: tournament
                    .round(r => r
                        .withMatch(m => m
                            .sideA(playerC.name, undefined, playerC)
                            .sideB(playerB.name, undefined, playerB)))
                    .build(),
                setTournamentData,
                patchData: noop
            }, user({ managePlayers: true }), undefined, [teamA, teamB], season);

            const firstMatchRow = context.container.querySelector('table tbody tr:first-child')!;
            await doClick(findButton(firstMatchRow.querySelector('td:nth-child(2)'), '✏️'));

            reportedError.verifyNoError();
            context.prompts.alertWasShown(`Unable to find player PLAYER C (id: ${playerC.id}) in team HOST`);
            expect(updatedTournament).toBeNull();
        });

        it('can edit host player', async () => {
            await renderComponent({
                tournamentData: tournament
                    .round(r => r
                        .withMatch(m => m
                            .sideA(playerA.name, undefined, playerA)
                            .sideB(playerB.name, undefined, playerB)))
                    .build(),
                setTournamentData,
                patchData: noop
            }, user({ managePlayers: true }), undefined, [teamA, teamB], season);

            const firstMatchRow = context.container.querySelector('table tbody tr:first-child')!;
            await doClick(findButton(firstMatchRow.querySelector('td:nth-child(2)'), '✏️'));
            await doChange(context.container.querySelector('.modal-dialog')!, 'input[name="name"]', 'UPDATED PLAYER', context.user);
            await doClick(findButton(context.container.querySelector('.modal-dialog')!, 'Save player'));

            reportedError.verifyNoError();
            expect(updatedPlayer).toEqual({
                seasonId: season.id,
                teamId: teamA.id,
                player: {
                    name: 'UPDATED PLAYER',
                },
                playerId: playerA.id
            });
            expect(updatedTournament).not.toBeNull();
            expect(updatedTournament?.save).toEqual(true);
            expect(updatedTournament?.updated.round?.matches).toEqual([{
                id: expect.any(String),
                sideA: {
                    id: expect.any(String),
                    name: 'UPDATED PLAYER',
                    players: [playerA],
                },
                sideB: {
                    id: expect.any(String),
                    name: 'PLAYER B',
                    players: [playerB],
                },
            }]);
        });

        it('can edit opponent player', async () => {
            await renderComponent({
                tournamentData: tournament
                    .round(r => r
                        .withMatch(m => m
                            .sideA(playerA.name, undefined, playerA)
                            .sideB(playerB.name, undefined, playerB)))
                    .build(),
                setTournamentData,
                patchData: noop
            }, user({ managePlayers: true }), undefined, [teamA, teamB], season);

            const firstMatchRow = context.container.querySelector('table tbody tr:first-child')!;
            await doClick(findButton(firstMatchRow.querySelector('td:nth-child(4)'), '✏️'));
            await doChange(context.container.querySelector('.modal-dialog')!, 'input[name="name"]', 'UPDATED PLAYER', context.user);
            await doClick(findButton(context.container.querySelector('.modal-dialog')!, 'Save player'));

            reportedError.verifyNoError();
            expect(updatedPlayer).toEqual({
                seasonId: season.id,
                teamId: teamB.id,
                player: {
                    name: 'UPDATED PLAYER',
                },
                playerId: playerB.id
            });
            expect(updatedTournament).not.toBeNull();
            expect(updatedTournament?.save).toEqual(true);
            expect(updatedTournament?.updated.round?.matches).toEqual([{
                id: expect.any(String),
                sideA: {
                    id: expect.any(String),
                    name: 'PLAYER A',
                    players: [playerA],
                },
                sideB: {
                    id: expect.any(String),
                    name: 'UPDATED PLAYER',
                    players: [playerB],
                },
            }]);
        });

        it('can close edit player dialog', async () => {
            await renderComponent({
                tournamentData: tournament
                    .round(r => r
                        .withMatch(m => m
                            .sideA(playerA.name, undefined, playerA)
                            .sideB(playerB.name, undefined, playerB)))
                    .build(),
                setTournamentData,
                patchData: noop
            }, user({ managePlayers: true }), undefined, [teamA, teamB], season);

            const firstMatchRow = context.container.querySelector('table tbody tr:first-child')!;
            await doClick(findButton(firstMatchRow.querySelector('td:nth-child(2)'), '✏️'));
            await doChange(context.container.querySelector('.modal-dialog')!, 'input[name="name"]', 'UPDATED PLAYER', context.user);
            await doClick(findButton(context.container.querySelector('.modal-dialog')!, 'Cancel'));

            reportedError.verifyNoError();
            expect(context.container.querySelector('.modal-dialog')).toBeFalsy();
        });

        it('reports error if team cannot be found', async () => {
            const teamA = teamBuilder('TEAM A ').forSeason(season, division).build();
            await renderComponent(props({ tournamentData: tournament.build() }), user({ managePlayers: true }), undefined, [teamA, teamB], season);
            const newMatchRow = context.container.querySelector('table tbody tr:last-child')!;
            await doSelectOption(newMatchRow.querySelector('td:nth-child(2) .dropdown-menu'), '➕ New Player/s');

            expect(context.container.querySelector('.modal-dialog')).toBeFalsy();
            reportedError.verifyErrorEquals('Unable to find team with name \'HOST\'');
        });

        it('saves tournament when both players are set', async () => {
            const matchOptionDefaults = matchOptionsBuilder().numberOfLegs(7).build();
            const tournamentProps = new tournamentContainerPropsBuilder()
                .withMatchOptionDefaults(matchOptionDefaults)
                .build();
            await renderComponent(props({ tournamentData: tournament.build() }), user({}), tournamentProps, [teamA, teamB], season);

            const newMatchRow = context.container.querySelector('table tbody tr:last-child')!;
            await doSelectOption(newMatchRow.querySelector('td:nth-child(2) .dropdown-menu'), 'PLAYER A');
            await doSelectOption(newMatchRow.querySelector('td:nth-child(4) .dropdown-menu'), 'PLAYER B');

            reportedError.verifyNoError();
            expect(updatedTournament).not.toBeNull();
            expect(updatedTournament?.save).toEqual(true);
            expect(updatedTournament?.updated.round?.matches).toEqual([{
                id: expect.any(String),
                sideA: {
                    id: expect.any(String),
                    name: 'PLAYER A',
                    players: [playerA],
                },
                sideB: {
                    id: expect.any(String),
                    name: 'PLAYER B',
                    players: [playerB],
                },
            }]);
            expect(updatedTournament?.updated.round?.matchOptions).toEqual([{
                numberOfLegs: 7,
            }]);
        });

        it('saves tournament when sideA changed for existing match', async () => {
            const teamA = teamBuilder('HOST').forSeason(season, undefined, [playerA, playerC]).build();
            await renderComponent({
                tournamentData: tournament
                    .round(r => r
                        .withMatch(m => m
                            .sideA('PLAYER A', undefined, playerA)
                            .sideB('PLAYER B', undefined, playerB)))
                    .build(),
                setTournamentData,
                patchData: noop
            }, user({}), undefined, [teamA, teamB], season);

            const newMatchRow = context.container.querySelector('table tbody tr:first-child')!;
            await doSelectOption(newMatchRow.querySelector('td:nth-child(2) .dropdown-menu'), 'PLAYER C');

            reportedError.verifyNoError();
            expect(updatedTournament).not.toBeNull();
            expect(updatedTournament?.save).toEqual(true);
            expect(updatedTournament?.updated.round?.matches).toEqual([{
                id: expect.any(String),
                sideA: {
                    id: expect.any(String),
                    name: 'PLAYER C',
                    players: [playerC],
                },
                sideB: {
                    id: expect.any(String),
                    name: 'PLAYER B',
                    players: [playerB],
                },
            }]);
        });

        it('saves tournament when sideB changed for existing match', async () => {
            const playerD = playerBuilder('PLAYER D').build();
            const teamB = teamBuilder('OPPONENT').forSeason(season, undefined, [playerB, playerD]).build();
            await renderComponent({
                tournamentData: tournament
                    .round(r => r
                        .withMatch(m => m
                            .sideA('PLAYER A', undefined, playerA)
                            .sideB('PLAYER B', undefined, playerB)))
                    .build(),
                setTournamentData,
                patchData: noop
            }, user({}), undefined, [teamA, teamB], season);

            const newMatchRow = context.container.querySelector('table tbody tr:first-child')!;
            await doSelectOption(newMatchRow.querySelector('td:nth-child(4) .dropdown-menu'), 'PLAYER D');

            reportedError.verifyNoError();
            expect(updatedTournament).not.toBeNull();
            expect(updatedTournament?.save).toEqual(true);
            expect(updatedTournament?.updated.round?.matches).toEqual([{
                id: expect.any(String),
                sideA: {
                    id: expect.any(String),
                    name: 'PLAYER A',
                    players: [playerA],
                },
                sideB: {
                    id: expect.any(String),
                    name: 'PLAYER D',
                    players: [playerD],
                },
            }]);
        });

        it('cannot change host when match exists', async () => {
            const tournamentData = tournament.round(r => r
                .withMatch(m => m.sideA('SIDE A').sideB('SIDE B'))).build();
            const account = user({});

            await renderComponent(props({ tournamentData }), account);

            expect(context.container.querySelector('[datatype="host"] .dropdown-menu')).toBeNull();
            expect(context.container.querySelector('[datatype="opponent"] .dropdown-menu')).toBeNull();
            reportedError.verifyNoError();
        });

        it('can delete match when permitted', async () => {
            const tournamentData = tournament
                .round(r => r
                    .withMatch(m => m.sideA('SIDE A').sideB('SIDE B'))
                    .withMatchOption())
                .build();
            const account = user({
                recordScoresAsYouGo: true,
            });

            await renderComponent(props({ tournamentData }), account);
            context.prompts.respondToConfirm('Are you sure you want to remove this match?', true);

            await doClick(findButton(context.container.querySelector('div[datatype="master-draw"]'), '🗑️ 1'));

            reportedError.verifyNoError();
            expect(updatedTournament?.save).toEqual(true);
            expect(updatedTournament?.updated.round?.matches).toEqual([]);
            expect(updatedTournament?.updated.round?.matchOptions).toEqual([]);
        });

        it('does not delete match when cancelled', async () => {
            const tournamentData = tournament.round(r => r
                .withMatch(m => m.sideA('SIDE A').sideB('SIDE B'))).build();
            const account = user({
                recordScoresAsYouGo: true,
            });

            await renderComponent(props({ tournamentData }), account);
            context.prompts.respondToConfirm('Are you sure you want to remove this match?', false);

            await doClick(findButton(context.container.querySelector('div[datatype="master-draw"]'), '🗑️ 1'));

            reportedError.verifyNoError();
            expect(updatedTournament).toEqual(null);
        });

        it('cannot not delete match when not permitted', async () => {
            const tournamentData = tournament.round(r => r
                .withMatch(m => m.sideA('SIDE A').sideB('SIDE B'))).build();
            const account = user({
                recordScoresAsYouGo: true,
            });

            await renderComponent(props({ tournamentData, readOnly: true }), account);

            expect(context.container.innerHTML).not.toContain('🗑️');
        });

        it('can open sayg dialog when permitted', async () => {
            const tournamentData = tournament.round(r => r
                .withMatch(m => m.sideA('SIDE A').sideB('SIDE B'))).build();
            const account = user({
                recordScoresAsYouGo: true,
            });
            const containerProps = new tournamentContainerPropsBuilder({ tournamentData });

            await renderComponent(props({ tournamentData: tournament.build() }), account, containerProps.build());

            await doClick(findButton(context.container.querySelector('div[datatype="master-draw"]'), START_SCORING));

            reportedError.verifyNoError();
            const dialog = context.container.querySelector('.modal-dialog');
            expect(dialog).toBeTruthy();
        });

        it('can delete sayg from match', async () => {
            const saygId = createTemporaryId();
            const matchId = createTemporaryId();
            const tournamentData = tournament.round(r => r
                .withMatch(m => m.sideA('SIDE A').sideB('SIDE B').saygId(saygId), matchId)).build();
            const account = user({
                recordScoresAsYouGo: true,
                showDebugOptions: true,
            });
            const containerProps = new tournamentContainerPropsBuilder({ tournamentData });

            await renderComponent(props({ tournamentData: tournament.build() }), account, containerProps.build());
            await doClick(findButton(context.container.querySelector('div[datatype="master-draw"]'), START_SCORING));
            reportedError.verifyNoError();
            const dialog = context.container.querySelector('.modal-dialog');
            context.prompts.respondToConfirm('Are you sure you want to delete the sayg data for this match?', true);
            context.prompts.respondToConfirm('Clear match score (to allow scores to be re-recorded?)', true);

            await doClick(findButton(dialog, 'Delete sayg'));

            reportedError.verifyNoError();
            expect(saygDeleted).toEqual({
                id: tournamentData.id,
                matchId: matchId,
            })
        });

        it('cannot select a player that is already playing in another tournament', async () => {
            const containerProps = new tournamentContainerPropsBuilder()
                .withAlreadyPlaying({
                    [playerA.id]: tournamentBuilder().type('BOARD 2').build(),
                })
                .build();
            await renderComponent({
                tournamentData: tournament
                    .round(r => r
                        .withMatch(m => m
                            .sideA('PLAYER', undefined, playerA)
                            .sideB('SIDE B', undefined)))
                    .build(),
                setTournamentData,
                patchData: noop
            }, user({ }), containerProps, [teamA]);

            const masterDraw = context.container.querySelector('div.d-flex > div:nth-child(1)')!;
            const firstMatch = masterDraw.querySelector('table tbody tr:first-child')!;
            const homeSide = firstMatch.querySelector('td:nth-child(2)')!;
            await doClick(homeSide.querySelector('.dropdown-toggle')!);

            const options = Array.from(homeSide.querySelectorAll('.dropdown-item'));
            const optionText = options.map(o => o.textContent);
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
            const tournamentData = tournament.round(r => r
                .withMatch(m => m
                    .sideA('SIDE A', undefined, playerA)
                    .sideB('SIDE B', undefined, playerB)
                    .saygId(createTemporaryId())
                )).build();
            await renderComponent(props({ tournamentData }), account);
            await doClick(findButton(context.container.querySelector('div[datatype="master-draw"]'), START_SCORING));
            reportedError.verifyNoError();

            await keyPad(context, [ '1', '8', '0', ENTER_SCORE_BUTTON ]);

            reportedError.verifyNoError();
            expect(patchedData).toEqual([]);
        });

        it('does not patch in hi-checks', async () => {
            const saygId = createTemporaryId();
            const tournamentData = tournament.round(r => r
                .withMatch(m => m
                    .sideA('SIDE A', undefined, playerA)
                    .sideB('SIDE B', undefined, playerB)
                    .saygId(saygId))).build();
            await renderComponent({
                tournamentData: tournamentData,
                setTournamentData,
                patchData
            }, account);
            await doClick(findButton(context.container.querySelector('div[datatype="master-draw"]'), START_SCORING));
            reportedError.verifyNoError();

            await enterScores(
                context,
                [100, 100, 100, 100, 101],
                [100, 100, 100, 100]);
            await checkoutWith(context, '2');

            reportedError.verifyNoError();
            expect(patchedData).toEqual([{
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
            }]);
        });

        it('records regular checkout with a patch', async () => {
            const saygId = createTemporaryId();
            const tournamentData = tournament.round(r => r
                .withMatch(m => m
                    .sideA('SIDE A', undefined, playerA)
                    .sideB('SIDE B', undefined, playerB)
                    .saygId(saygId)
                )).build();
            await renderComponent({
                tournamentData: tournamentData,
                setTournamentData,
                patchData
            }, account);
            await doClick(findButton(context.container.querySelector('div[datatype="master-draw"]'), START_SCORING));
            reportedError.verifyNoError();

            await enterScores(
                context,
                [100, 100, 100, 130, 71],
                [100, 100, 100, 100]);
            await checkoutWith(context, '2');

            reportedError.verifyNoError();
            expect(patchedData).toEqual([{
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
            }]);
        });
    });
});