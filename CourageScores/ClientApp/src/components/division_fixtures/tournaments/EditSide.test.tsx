import {
    api,
    appProps,
    brandingProps,
    cleanUp,
    doChange,
    doClick,
    doSelectOption, ErrorState,
    findButton,
    iocProps,
    renderApp, TestContext
} from "../../../helpers/tests";
import React from "react";
import {toMap} from "../../../helpers/collections";
import {EditSide, IEditSideProps} from "./EditSide";
import {ITournamentContainerProps, TournamentContainer} from "./TournamentContainer";
import {createTemporaryId} from "../../../helpers/projection";
import {EditTeamPlayerDto} from "../../../interfaces/models/dtos/Team/EditTeamPlayerDto";
import {IClientActionResultDto} from "../../../interfaces/IClientActionResultDto";
import {TeamDto} from "../../../interfaces/models/dtos/Team/TeamDto";
import {TeamPlayerDto} from "../../../interfaces/models/dtos/Team/TeamPlayerDto";
import {TournamentSideDto} from "../../../interfaces/models/dtos/Game/TournamentSideDto";
import {UserDto} from "../../../interfaces/models/dtos/Identity/UserDto";
import {DivisionDto} from "../../../interfaces/models/dtos/DivisionDto";
import {TournamentGameDto} from "../../../interfaces/models/dtos/Game/TournamentGameDto";
import {SeasonDto} from "../../../interfaces/models/dtos/Season/SeasonDto";
import {playerBuilder} from "../../../helpers/builders/players";
import {divisionBuilder} from "../../../helpers/builders/divisions";
import {ITournamentSideBuilder, sideBuilder, tournamentBuilder} from "../../../helpers/builders/tournaments";
import {seasonBuilder} from "../../../helpers/builders/seasons";
import {teamBuilder} from "../../../helpers/builders/teams";
import {IPlayerApi} from "../../../interfaces/apis/IPlayerApi";

describe('EditSide', () => {
    let context: TestContext;
    let reportedError: ErrorState;
    let updatedData: TournamentSideDto;
    let closed: boolean;
    let applied: boolean;
    let deleted: boolean;
    let teamsReloaded: boolean;
    let createdPlayer: {
        divisionId: string,
        seasonId: string,
        teamId: string,
        playerDetails: EditTeamPlayerDto,
    };
    const playerApi = api<IPlayerApi>({
        create: async (divisionId: string, seasonId: string, teamId: string, playerDetails: EditTeamPlayerDto): Promise<IClientActionResultDto<TeamDto>> => {
            createdPlayer = {
                divisionId,
                seasonId,
                teamId,
                playerDetails,
            };
            const playerDetailsAsTeamPlayer = playerDetails as TeamPlayerDto;
            playerDetailsAsTeamPlayer.id = createTemporaryId();
            return {
                success: true,
                result: {
                    id: teamId,
                    name: '',
                    address: '',
                    seasons: [{
                        seasonId: seasonId,
                        players: [playerDetailsAsTeamPlayer],
                    }]
                }
            };
        }
    });

    afterEach(() => {
        cleanUp(context);
    });

    beforeEach(() => {
        reportedError = new ErrorState();
        updatedData = null;
        closed = false;
        applied = false;
        deleted = false;
        teamsReloaded = false;
        createdPlayer = null;
    });

    async function onChange(newData: TournamentSideDto) {
        updatedData = newData;
    }

    async function onClose() {
        closed = true;
    }

    async function onApply() {
        applied = true;
    }

    async function onDelete() {
        deleted = true;
    }

    async function reloadTeams() {
        teamsReloaded = true;
    }

    async function renderComponent(containerProps: ITournamentContainerProps, props: IEditSideProps, teams?: TeamDto[], account?: UserDto) {
        context = await renderApp(
            iocProps({playerApi}),
            brandingProps(),
            appProps({
                teams: toMap(teams || []),
                account: (account || { access: {} }),
                reloadTeams,
            }, reportedError),
            (<TournamentContainer {...containerProps}>
                <EditSide {...props} />
            </TournamentContainer>));
    }

    function alreadyPlaying(player: TeamPlayerDto): { [playerId: string]: TeamPlayerDto } {
        const playing: { [playerId: string]: TeamPlayerDto } = {};
        playing[player.id] = player;
        return playing;
    }

    describe('renders', () => {
        const player: TeamPlayerDto = playerBuilder('PLAYER').build();
        const anotherPlayer: TeamPlayerDto = playerBuilder('ANOTHER PLAYER').build();
        const division: DivisionDto = divisionBuilder('DIVISION').build();
        const tournamentData: TournamentGameDto = tournamentBuilder()
            .forDivision(division)
            .withSide((s: ITournamentSideBuilder) => s.name('ANOTHER SIDE').withPlayer(anotherPlayer))
            .build();
        const season: SeasonDto = seasonBuilder('SEASON').build();
        const team: TeamDto = teamBuilder('TEAM')
            .forSeason(season, tournamentData.divisionId, [ player, anotherPlayer ])
            .build();

        it('new side', async () => {
            const side: TournamentSideDto = sideBuilder().build();

            await renderComponent({
                tournamentData,
                season,
                alreadyPlaying: {}
            }, { side, onChange, onClose, onApply, onDelete }, null);

            expect(reportedError.hasError()).toEqual(false);
            const nameInput = context.container.querySelector('input[name="name"]') as HTMLInputElement;
            expect(nameInput.value).toEqual('');
            expect(context.container.querySelector('.dropdown-menu')).not.toBeNull();
            expect(context.container.querySelector('ol.list-group')).not.toBeNull();
        });

        it('side with players', async () => {
            const side: TournamentSideDto = sideBuilder('SIDE NAME')
                .withPlayer(player)
                .build();

            await renderComponent({
                tournamentData,
                season,
                alreadyPlaying: {}
            }, { side, onChange, onClose, onApply, onDelete }, [team]);

            expect(reportedError.hasError()).toEqual(false);
            const nameInput = context.container.querySelector('input[name="name"]') as HTMLInputElement;
            expect(nameInput.value).toEqual('SIDE NAME');
            expect(context.container.querySelector('.dropdown-menu')).toBeNull();
            expect(context.container.querySelector('ol.list-group')).not.toBeNull();
            expect(context.container.querySelector('ol.list-group li.list-group-item.active').textContent).toEqual('PLAYER');
        });

        it('filtered players', async () => {
            const side: TournamentSideDto = sideBuilder('SIDE NAME')
                .withPlayer(player)
                .build();
            await renderComponent({
                tournamentData,
                season,
                alreadyPlaying: {}
            }, { side, onChange, onClose, onApply, onDelete }, [team]);

            await doChange(context.container, 'input[name="playerFilter"]', 'ANOTHER', context.user);

            expect(context.container.querySelector('ol.list-group')).not.toBeNull();
            const playerItems = Array.from(context.container.querySelectorAll('ol.list-group li.list-group-item'));
            expect(playerItems.map(li => li.textContent)).toEqual(['ANOTHER PLAYER (🚫 Selected in another side)']);
        });

        it('players with common name with their team name', async () => {
            const side: TournamentSideDto = sideBuilder('SIDE NAME').build();
            const playerWithSameNameInDifferentTeam: TeamPlayerDto = playerBuilder(player.name).build();
            const anotherTeam: TeamDto = teamBuilder('ANOTHER TEAM')
                .forSeason(season, tournamentData.divisionId, [ playerWithSameNameInDifferentTeam ])
                .build();

            await renderComponent({
                tournamentData,
                season,
                alreadyPlaying: {}
            }, { side, onChange, onClose, onApply, onDelete }, [team, anotherTeam]);

            expect(context.container.querySelector('ol.list-group')).not.toBeNull();
            const playerItems = Array.from(context.container.querySelectorAll('ol.list-group li.list-group-item'));
            expect(playerItems.map(li => li.textContent)).toEqual([
                'ANOTHER PLAYER (🚫 Selected in another side)',
                'PLAYER [TEAM]',
                'PLAYER [ANOTHER TEAM]']);
        });

        it('side with teamId', async () => {
            const side: TournamentSideDto = sideBuilder('SIDE NAME')
                .teamId(team.id)
                .build();

            await renderComponent({
                tournamentData,
                season,
                alreadyPlaying: {}
            }, { side, onChange, onClose, onApply, onDelete }, [team]);

            expect(reportedError.hasError()).toEqual(false);
            const nameInput = context.container.querySelector('input[name="name"]') as HTMLInputElement;
            expect(nameInput.value).toEqual('SIDE NAME');
            expect(context.container.querySelector('.dropdown-menu .active')).not.toBeNull();
            expect(context.container.querySelector('.dropdown-menu .active').textContent).toEqual('TEAM');
            expect(context.container.querySelector('ol.list-group')).toBeNull();
        });

        it('side which did not show', async () => {
            const side: TournamentSideDto = sideBuilder('SIDE NAME')
                .teamId(team.id)
                .noShow()
                .build();

            await renderComponent({
                tournamentData,
                season,
                alreadyPlaying: {}
            }, { side, onChange, onClose, onApply, onDelete }, [team]);

            expect(reportedError.hasError()).toEqual(false);
            const noShowInput = context.container.querySelector('input[name="noShow"]') as HTMLInputElement;
            expect(noShowInput.checked).toEqual(true);
        });

        it('side which did show', async () => {
            const side: TournamentSideDto = sideBuilder('SIDE NAME')
                .teamId(team.id)
                .build();

            await renderComponent({
                tournamentData,
                season,
                alreadyPlaying: {}
            }, { side, onChange, onClose, onApply, onDelete }, [team]);

            expect(reportedError.hasError()).toEqual(false);
            const noShowInput = context.container.querySelector('input[name="noShow"]') as HTMLInputElement;
            expect(noShowInput.checked).toEqual(false);
        });

        it('when team is not registered to season', async () => {
            const teamNotInSeason: TeamDto = teamBuilder('TEAM')
                .forSeason(
                    seasonBuilder('ANOTHER SEASON').build(),
                    tournamentData.divisionId,
                    [playerBuilder('NOT IN SEASON PLAYER').build()])
                .build();
            const side: TournamentSideDto = sideBuilder('SIDE NAME')
                .teamId(teamNotInSeason.id)
                .build();

            await renderComponent({
                tournamentData,
                season,
                alreadyPlaying: {}
            }, { side, onChange, onClose, onApply, onDelete }, [teamNotInSeason]);

            expect(reportedError.hasError()).toEqual(false);
            const playerItems = Array.from(context.container.querySelectorAll('.list-group .list-group-item'));
            expect(playerItems.map(li => li.textContent)).not.toContain('NOT IN SEASON PLAYER');
        });

        it('excludes players from another division when for a division', async () => {
            const side: TournamentSideDto = sideBuilder('SIDE NAME').build();
            const otherDivisionTeam: TeamDto = teamBuilder('OTHER DIVISION TEAM')
                .forSeason(
                    season,
                    divisionBuilder('ANOTHER DIVISION').build(),
                    [playerBuilder('OTHER DIVISION PLAYER').build()])
                .build();

            await renderComponent({
                tournamentData,
                season,
                alreadyPlaying: alreadyPlaying(player),
            }, { side, onChange, onClose, onApply, onDelete }, [otherDivisionTeam, team]);

            expect(reportedError.hasError()).toEqual(false);
            const playerItems = Array.from(context.container.querySelectorAll('.list-group .list-group-item'));
            expect(playerItems.map(li => li.textContent)).not.toContain('OTHER DIVISION PLAYER');
        });

        it('includes players from another division when cross-divisional', async () => {
            const side: TournamentSideDto = sideBuilder('SIDE NAME').build();
            const otherDivisionTeam: TeamDto = teamBuilder('OTHER DIVISION TEAM')
                .forSeason(
                    season,
                    divisionBuilder('ANOTHER DIVISION').build(),
                    [playerBuilder('OTHER DIVISION PLAYER').build()])
                .build();
            const crossDivisionalTournamentData = tournamentBuilder().build();

            await renderComponent({
                tournamentData: crossDivisionalTournamentData,
                season,
                alreadyPlaying: alreadyPlaying(player),
            }, { side, onChange, onClose, onApply, onDelete }, [otherDivisionTeam, team]);

            expect(reportedError.hasError()).toEqual(false);
            const playerItems = Array.from(context.container.querySelectorAll('.list-group .list-group-item'));
            expect(playerItems.map(li => li.textContent)).toContain('OTHER DIVISION PLAYER');
        });

        it('warning about players that are selected in another tournament', async () => {
            const side: TournamentSideDto = sideBuilder('SIDE NAME').build();

            await renderComponent({
                tournamentData,
                season,
                alreadyPlaying: alreadyPlaying(player),
            }, { side, onChange, onClose, onApply, onDelete }, [team]);

            expect(reportedError.hasError()).toEqual(false);
            const playerItems = Array.from(context.container.querySelectorAll('.list-group .list-group-item'));
            expect(playerItems.map(li => li.textContent)).toContain('PLAYER (⚠ Playing in another tournament)');
        });

        it('unselectable players when selected in another side', async () => {
            const side: TournamentSideDto = sideBuilder('SIDE NAME').build();

            await renderComponent({
                tournamentData,
                season,
                alreadyPlaying: {},
            }, { side, onChange, onClose, onApply, onDelete }, [team]);

            expect(reportedError.hasError()).toEqual(false);
            const playerItems = Array.from(context.container.querySelectorAll('.list-group .list-group-item'));
            expect(playerItems.map(li => li.textContent)).toContain('ANOTHER PLAYER (🚫 Selected in another side)');
        });

        it('selectable players when selected in this side', async () => {
            await renderComponent({
                tournamentData,
                season,
                alreadyPlaying: {},
            }, { side: tournamentData.sides[0], onChange, onClose, onApply, onDelete }, [team]);

            expect(reportedError.hasError()).toEqual(false);
            const playerItems = Array.from(context.container.querySelectorAll('.list-group .list-group-item'));
            expect(playerItems.map(li => li.textContent)).toContain('ANOTHER PLAYER');
        });

        it('delete button when side exists', async () => {
            const side: TournamentSideDto = sideBuilder('SIDE NAME')
                .teamId(team.id)
                .build();

            await renderComponent({
                tournamentData,
                season,
                alreadyPlaying: {},
            }, { side, onChange, onClose, onApply, onDelete }, [team]);

            expect(reportedError.hasError()).toEqual(false);
            expect(context.container.querySelector('.btn-danger')).toBeTruthy();
            expect(context.container.querySelector('.btn-danger').textContent).toEqual('Delete side');
        });

        it('no delete button when side is new', async () => {
            const side: TournamentSideDto = sideBuilder('SIDE NAME').id(undefined).build();

            await renderComponent({
                tournamentData,
                season,
                alreadyPlaying: {},
            }, { side, onChange, onClose, onApply, onDelete }, [team]);

            expect(reportedError.hasError()).toEqual(false);
            expect(context.container.querySelector('.btn-danger')).toBeFalsy();
        });

        it('add player button when permitted and new side', async () => {
            const side: TournamentSideDto = sideBuilder('SIDE NAME')
                .id(undefined)
                .build();
            const account: UserDto = {
                name: '',
                emailAddress: '',
                givenName: '',
                access: { managePlayers: true },
            };

            await renderComponent({
                tournamentData,
                season,
                alreadyPlaying: {},
            }, { side, onChange, onClose, onApply, onDelete }, [team], account);

            expect(reportedError.hasError()).toEqual(false);
            const buttons = Array.from(context.container.querySelectorAll('.btn'));
            const buttonText = buttons.map(btn => btn.textContent);
            expect(buttonText).toContain('Add player/s');
        });

        it('add player button when permitted and editing side', async () => {
            const side: TournamentSideDto = sideBuilder('SIDE NAME').build();
            const account: UserDto = {
                emailAddress: '',
                name: '',
                givenName: '',
                access: { managePlayers: true },
            };

            await renderComponent({
                tournamentData,
                season,
                alreadyPlaying: {},
            }, { side, onChange, onClose, onApply, onDelete }, [team], account);

            expect(reportedError.hasError()).toEqual(false);
            const buttons = Array.from(context.container.querySelectorAll('.btn'));
            const buttonText = buttons.map(btn => btn.textContent);
            expect(buttonText).toContain('Add player/s');
        });

        it('no add player button when not permitted', async () => {
            const side: TournamentSideDto = sideBuilder('SIDE NAME')
                .teamId(team.id)
                .build();
            const account: UserDto = {
                name: '',
                emailAddress: '',
                givenName: '',
                access: { managePlayers: false },
            };

            await renderComponent({
                tournamentData,
                season,
                alreadyPlaying: {},
            }, { side, onChange, onClose, onApply, onDelete }, [team], account);

            expect(reportedError.hasError()).toEqual(false);
            const buttons = Array.from(context.container.querySelectorAll('.btn'));
            const buttonText = buttons.map(btn => btn.textContent);
            expect(buttonText).not.toContain('Add player');
        });

        it('no add player button when permitted and team side', async () => {
            const side: TournamentSideDto = sideBuilder('SIDE NAME')
                .teamId(team.id)
                .build();
            const account: UserDto = {
                name: '',
                emailAddress: '',
                givenName: '',
                access: { managePlayers: false },
            };

            await renderComponent({
                tournamentData,
                season,
                alreadyPlaying: {},
            }, { side, onChange, onClose, onApply, onDelete }, [team], account);

            expect(reportedError.hasError()).toEqual(false);
            const buttons = Array.from(context.container.querySelectorAll('.btn'));
            const buttonText = buttons.map(btn => btn.textContent);
            expect(buttonText).not.toContain('Add player');
        });
    });

    describe('interactivity', () => {
        const player: TeamPlayerDto = playerBuilder('PLAYER').build();
        const anotherPlayer: TeamPlayerDto = playerBuilder('ANOTHER PLAYER').build();
        const tournamentData: TournamentGameDto = tournamentBuilder()
            .forDivision(divisionBuilder('DIVISION').build())
            .withSide((s: ITournamentSideBuilder) => s.name('ANOTHER SIDE').withPlayer(anotherPlayer))
            .build();
        const season: SeasonDto = seasonBuilder('SEASON').build();
        const team: TeamDto = teamBuilder('TEAM')
            .forSeason(season, tournamentData.divisionId, [ player, anotherPlayer ])
            .build();

        it('can change side name', async () => {
            const side: TournamentSideDto = sideBuilder('SIDE NAME')
                .build();
            await renderComponent({
                tournamentData,
                season,
                alreadyPlaying: {},
            }, { side, onChange, onClose, onApply, onDelete }, [team]);

            await doChange(context.container, 'input[name="name"]', 'NEW NAME', context.user);

            expect(reportedError.hasError()).toEqual(false);
            expect(updatedData).toEqual({
                id: expect.any(String),
                name: 'NEW NAME',
                players: [],
            });
        });

        it('can change noShow', async () => {
            const side: TournamentSideDto = sideBuilder('SIDE NAME')
                .build();
            await renderComponent({
                tournamentData,
                season,
                alreadyPlaying: {},
            }, { side, onChange, onClose, onApply, onDelete }, [team]);

            await doClick(context.container, 'input[name="noShow"]');

            expect(reportedError.hasError()).toEqual(false);
            expect(updatedData).toEqual({
                id: expect.any(String),
                name: 'SIDE NAME',
                noShow: true,
                players: [],
            });
        });

        it('can change team id', async () => {
            const side: TournamentSideDto = sideBuilder().build();
            await renderComponent({
                tournamentData,
                season,
                alreadyPlaying: {},
            }, { side, onChange, onClose, onApply, onDelete }, [team]);

            await doSelectOption(context.container.querySelector('.dropdown-menu'), 'TEAM');

            expect(reportedError.hasError()).toEqual(false);
            expect(updatedData).toEqual({
                id: side.id,
                players: [],
                name: 'TEAM',
                teamId: team.id,
            });
        });

        it('can unset team id', async () => {
            const side: TournamentSideDto = sideBuilder('TEAM')
                .teamId(team.id)
                .build();
            await renderComponent({
                tournamentData,
                season,
                alreadyPlaying: {},
            }, { side, onChange, onClose, onApply, onDelete }, [team]);

            await doSelectOption(context.container.querySelector('.dropdown-menu'), 'Select team');

            expect(reportedError.hasError()).toEqual(false);
            expect(updatedData).toEqual({
                id: expect.any(String),
                name: 'TEAM',
                teamId: undefined,
                players: [],
            });
        });

        it('can select player', async () => {
            const side: TournamentSideDto = sideBuilder('')
                .build();
            await renderComponent({
                tournamentData,
                season,
                alreadyPlaying: {},
            }, { side, onChange, onClose, onApply, onDelete }, [team]);
            const players = Array.from(context.container.querySelectorAll('.list-group .list-group-item'));

            await doClick(players.filter(p => p.textContent === 'PLAYER')[0]);

            expect(reportedError.hasError()).toEqual(false);
            expect(updatedData).toEqual({
                id: expect.any(String),
                name: 'PLAYER',
                players: [{
                    id: player.id,
                    name: player.name,
                }],
            });
        });

        it('sets side name to player name when player selected for new side', async () => {
            const side: TournamentSideDto = sideBuilder(undefined)
                .build();
            await renderComponent({
                tournamentData,
                season,
                alreadyPlaying: {},
            }, { side, onChange, onClose, onApply, onDelete }, [team]);
            const players = Array.from(context.container.querySelectorAll('.list-group .list-group-item'));

            await doClick(players.filter(p => p.textContent === 'PLAYER')[0]);

            expect(reportedError.hasError()).toEqual(false);
            expect(updatedData).toEqual({
                id: expect.any(String),
                name: 'PLAYER',
                players: [{
                    id: player.id,
                    name: player.name,
                }],
            });
        });

        it('can select player and team name does not change', async () => {
            const side: TournamentSideDto = sideBuilder('OTHER NAME')
                .build();
            await renderComponent({
                tournamentData,
                season,
                alreadyPlaying: {},
            }, { side, onChange, onClose, onApply, onDelete }, [team]);
            const players = Array.from(context.container.querySelectorAll('.list-group .list-group-item'));

            await doClick(players.filter(p => p.textContent === 'PLAYER')[0]);

            expect(reportedError.hasError()).toEqual(false);
            expect(updatedData).toEqual({
                id: expect.any(String),
                name: 'OTHER NAME',
                players: [{
                    id: player.id,
                    name: player.name,
                }],
            });
        });

        it('can select another player', async () => {
            const side: TournamentSideDto = sideBuilder('PLAYER')
                .withPlayer(player)
                .build();
            const noSidesTournamentData: TournamentGameDto = tournamentBuilder()
                .forDivision(tournamentData.divisionId)
                .build();
            await renderComponent({
                tournamentData: noSidesTournamentData,
                season,
                alreadyPlaying: {},
            }, { side, onChange, onClose, onApply, onDelete }, [team]);
            const players = Array.from(context.container.querySelectorAll('.list-group .list-group-item'));

            await doClick(players.filter(p => p.textContent === 'ANOTHER PLAYER')[0]);

            expect(reportedError.hasError()).toEqual(false);
            expect(updatedData).toEqual({
                id: expect.any(String),
                name: 'ANOTHER PLAYER, PLAYER',
                players: [{
                    id: anotherPlayer.id,
                    name: 'ANOTHER PLAYER',
                }, {
                    id: player.id,
                    name: 'PLAYER',
                    team: null,
                }],
            });
        });

        it('can select another player and team name does not change', async () => {
            const side: TournamentSideDto = sideBuilder('SIDE NAME')
                .withPlayer(player)
                .build();
            const noSidesTournamentData: TournamentGameDto = tournamentBuilder()
                .forDivision(tournamentData.divisionId)
                .build();
            await renderComponent({
                tournamentData: noSidesTournamentData,
                season,
                alreadyPlaying: {},
            }, { side, onChange, onClose, onApply, onDelete }, [team]);
            const players = Array.from(context.container.querySelectorAll('.list-group .list-group-item'));

            await doClick(players.filter(p => p.textContent === 'ANOTHER PLAYER')[0]);

            expect(reportedError.hasError()).toEqual(false);
            expect(updatedData).toEqual({
                id: expect.any(String),
                name: 'SIDE NAME',
                players: [{
                    id: player.id,
                    name: 'PLAYER',
                    team: null,
                }, {
                    id: anotherPlayer.id,
                    name: 'ANOTHER PLAYER',
                }],
            });
        });

        it('can deselect player', async () => {
            const side: TournamentSideDto = sideBuilder('ANOTHER PLAYER, PLAYER')
                .withPlayer(player)
                .withPlayer(anotherPlayer)
                .build();
            const noSidesTournamentData: TournamentGameDto = tournamentBuilder()
                .forDivision(tournamentData.divisionId)
                .build();
            await renderComponent({
                tournamentData: noSidesTournamentData,
                season,
                alreadyPlaying: {},
            }, { side, onChange, onClose, onApply, onDelete }, [team]);
            const players = Array.from(context.container.querySelectorAll('.list-group .list-group-item'));

            await doClick(players.filter(p => p.textContent === 'ANOTHER PLAYER')[0]);

            expect(reportedError.hasError()).toEqual(false);
            expect(updatedData).toEqual({
                id: expect.any(String),
                name: 'PLAYER',
                players: [player],
            });
        });

        it('can delete side', async () => {
            const side: TournamentSideDto = sideBuilder('SIDE NAME').build();
            await renderComponent({
                tournamentData,
                season,
                alreadyPlaying: {},
            }, { side, onChange, onClose, onApply, onDelete }, [team]);
            let confirm: string;
            window.confirm = (msg) => {
                confirm = msg;
                return true;
            }

            await doClick(findButton(context.container, 'Delete side'));

            expect(reportedError.hasError()).toEqual(false);
            expect(confirm).toEqual('Are you sure you want to remove SIDE NAME?');
            expect(deleted).toEqual(true);
        });

        it('does not delete side when rejected', async () => {
            const side: TournamentSideDto = sideBuilder('SIDE NAME').build();
            await renderComponent({
                tournamentData,
                season,
                alreadyPlaying: {},
            }, { side, onChange, onClose, onApply, onDelete }, [team]);
            let confirm: string;
            window.confirm = (msg) => {
                confirm = msg;
                return false;
            }

            await doClick(findButton(context.container, 'Delete side'));

            expect(reportedError.hasError()).toEqual(false);
            expect(confirm).toEqual('Are you sure you want to remove SIDE NAME?');
            expect(deleted).toEqual(false);
        });

        it('cannot save side if no name', async () => {
            const side: TournamentSideDto = sideBuilder('')
                .teamId(team.id)
                .build();
            await renderComponent({
                tournamentData,
                season,
                alreadyPlaying: {},
            }, { side, onChange, onClose, onApply, onDelete }, [team]);
            let alert: string;
            window.alert = (msg) => {
                alert = msg;
            };

            await doClick(findButton(context.container, 'Save'));

            expect(reportedError.hasError()).toEqual(false);
            expect(alert).toEqual('Please enter a name for this side');
            expect(applied).toEqual(false);
        });

        it('cannot save side if no teamId and no players', async () => {
            const side: TournamentSideDto = sideBuilder('').build();
            await renderComponent({
                tournamentData,
                season,
                alreadyPlaying: {},
            }, { side, onChange, onClose, onApply, onDelete }, [team]);
            let alert: string;
            window.alert = (msg) => {
                alert = msg;
            };

            await doClick(findButton(context.container, 'Save'));

            expect(reportedError.hasError()).toEqual(false);
            expect(alert).toEqual('Select a team or some players');
            expect(applied).toEqual(false);
        });

        it('can save side', async () => {
            const side: TournamentSideDto = sideBuilder('SIDE NAME')
                .withPlayer(player)
                .build();
            await renderComponent({
                tournamentData,
                season,
                alreadyPlaying: {},
            }, { side, onChange, onClose, onApply, onDelete }, [team]);

            await doClick(findButton(context.container, 'Save'));

            expect(reportedError.hasError()).toEqual(false);
            expect(applied).toEqual(true);
        });

        it('can close', async () => {
            const side: TournamentSideDto = sideBuilder('')
                .withPlayer(player)
                .build();
            await renderComponent({
                tournamentData,
                season,
                alreadyPlaying: {},
            }, { side, onChange, onClose, onApply, onDelete }, [team]);

            await doClick(findButton(context.container, 'Close'));

            expect(reportedError.hasError()).toEqual(false);
            expect(closed).toEqual(true);
            expect(applied).toEqual(false);
        });

        it('can select players that are selected in another tournament', async () => {
            const side: TournamentSideDto = sideBuilder('SIDE NAME')
                .build();
            await renderComponent({
                tournamentData,
                season,
                alreadyPlaying: alreadyPlaying(player),
            }, { side, onChange, onClose, onApply, onDelete }, [team]);
            expect(reportedError.hasError()).toEqual(false);
            const playerItems = Array.from(context.container.querySelectorAll('.list-group .list-group-item'));
            const playerItem = playerItems.filter(li => li.textContent === 'PLAYER (⚠ Playing in another tournament)')[0];
            expect(playerItem).toBeTruthy();
            expect(playerItem.className).not.toContain('disabled');

            await doClick(playerItem);

            expect(reportedError.hasError()).toEqual(false);
            expect(updatedData).toEqual({
                id: expect.any(String),
                name: 'SIDE NAME',
                players: [{
                    id: player.id,
                    name: player.name,
                }],
            });
        });

        it('cannot select players that are selected in another side', async () => {
            const side: TournamentSideDto = sideBuilder('SIDE NAME').build();
            await renderComponent({
                tournamentData,
                season,
                alreadyPlaying: {},
            }, { side, onChange, onClose, onApply, onDelete }, [team]);
            expect(reportedError.hasError()).toEqual(false);
            const playerItems = Array.from(context.container.querySelectorAll('.list-group .list-group-item'));
            const playerItem = playerItems.filter(li => li.textContent === 'ANOTHER PLAYER (🚫 Selected in another side)')[0];
            expect(playerItem).toBeTruthy();
            expect(playerItem.className).toContain('disabled');

            await doClick(playerItem);

            expect(reportedError.hasError()).toEqual(false);
            expect(updatedData).toBeNull();
        });

        it('can open add player dialog', async () => {
            const side: TournamentSideDto = sideBuilder('SIDE NAME')
                .withPlayer(player)
                .build();
            const account: UserDto = {
                name: '',
                givenName: '',
                emailAddress: '',
                access: { managePlayers: true },
            };
            await renderComponent({
                tournamentData,
                season,
                alreadyPlaying: {},
            }, { side, onChange, onClose, onApply, onDelete }, [team], account);

            await doClick(findButton(context.container, 'Add player/s'));

            const headingForDialog = Array.from(context.container.querySelectorAll('h5')).filter(h5 => h5.textContent === 'Add a player...')[0];
            const dialog = headingForDialog.closest('.modal-dialog');
            expect(headingForDialog).toBeTruthy();
            expect(dialog).toBeTruthy();
        });

        it('can close add player dialog', async () => {
            const side: TournamentSideDto = sideBuilder('SIDE NAME')
                .withPlayer(player)
                .build();
            const account: UserDto = {
                name: '',
                givenName: '',
                emailAddress: '',
                access: { managePlayers: true },
            };
            await renderComponent({
                tournamentData,
                season,
                alreadyPlaying: {},
            }, { side, onChange, onClose, onApply, onDelete }, [team], account);
            await doClick(findButton(context.container, 'Add player/s'));
            const headingForDialog = Array.from(context.container.querySelectorAll('h5')).filter(h5 => h5.textContent === 'Add a player...')[0];
            const dialog = headingForDialog.closest('.modal-dialog');

            await doClick(findButton(dialog, 'Cancel'));

            expect(Array.from(context.container.querySelectorAll('h5')).filter(h5 => h5.textContent === 'Add a player...').length).toEqual(0);
        });

        it('can add player', async () => {
            const side: TournamentSideDto = sideBuilder('SIDE NAME')
                .withPlayer(player)
                .build();
            const account: UserDto = {
                name: '',
                givenName: '',
                emailAddress: '',
                access: { managePlayers: true },
            };
            await renderComponent({
                tournamentData,
                season,
                alreadyPlaying: {},
            }, { side, onChange, onClose, onApply, onDelete }, [team], account);
            await doClick(findButton(context.container, 'Add player/s'));
            const headingForDialog = Array.from(context.container.querySelectorAll('h5')).filter(h5 => h5.textContent === 'Add a player...')[0];
            const dialog = headingForDialog.closest('.modal-dialog');

            await doChange(dialog, 'input[name="name"]', 'NAME', context.user);
            await doClick(findButton(dialog.querySelector('.dropdown-menu'), team.name));
            await doClick(findButton(dialog, 'Add player'));

            expect(createdPlayer).not.toBeNull();
        });

        it('selects newly created player', async () => {
            const side: TournamentSideDto = sideBuilder('SIDE NAME')
                .withPlayer(player)
                .build();
            const account: UserDto = {
                name: '',
                givenName: '',
                emailAddress: '',
                access: { managePlayers: true },
            };
            await renderComponent({
                tournamentData,
                season,
                alreadyPlaying: {},
            }, { side, onChange, onClose, onApply, onDelete }, [team], account);
            await doClick(findButton(context.container, 'Add player/s'));
            const headingForDialog = Array.from(context.container.querySelectorAll('h5')).filter(h5 => h5.textContent === 'Add a player...')[0];
            const dialog = headingForDialog.closest('.modal-dialog');

            await doChange(dialog, 'input[name="name"]', 'NAME', context.user);
            await doClick(findButton(dialog.querySelector('.dropdown-menu'), team.name));
            await doClick(findButton(dialog, 'Add player'));

            expect(reportedError.hasError()).toEqual(false);
            expect(updatedData).toEqual({
                id: side.id,
                name: 'SIDE NAME',
                players: [player, {
                    id: expect.any(String),
                    name: 'NAME',
                    divisionId: tournamentData.divisionId,
                }]
            });
        });

        it('reloads teams after player added', async () => {
            const side: TournamentSideDto = sideBuilder('SIDE NAME')
                .withPlayer(player)
                .build();
            const account: UserDto = {
                name: '',
                givenName: '',
                emailAddress: '',
                access: { managePlayers: true },
            };
            await renderComponent({
                tournamentData,
                season,
                alreadyPlaying: {},
            }, { side, onChange, onClose, onApply, onDelete }, [team], account);
            await doClick(findButton(context.container, 'Add player/s'));
            const headingForDialog = Array.from(context.container.querySelectorAll('h5')).filter(h5 => h5.textContent === 'Add a player...')[0];
            const dialog = headingForDialog.closest('.modal-dialog');

            await doChange(dialog, 'input[name="name"]', 'NAME', context.user);
            await doClick(findButton(dialog.querySelector('.dropdown-menu'), team.name));
            await doClick(findButton(dialog, 'Add player'));

            expect(teamsReloaded).toEqual(true);
        });

        it('closes dialog after adding a player', async () => {
            const side: TournamentSideDto = sideBuilder('SIDE NAME')
                .withPlayer(player)
                .build();
            const account: UserDto = {
                name: '',
                givenName: '',
                emailAddress: '',
                access: { managePlayers: true },
            };
            await renderComponent({
                tournamentData,
                season,
                alreadyPlaying: {},
            }, { side, onChange, onClose, onApply, onDelete }, [team], account);
            await doClick(findButton(context.container, 'Add player/s'));
            const headingForDialog = Array.from(context.container.querySelectorAll('h5')).filter(h5 => h5.textContent === 'Add a player...')[0];
            const dialog = headingForDialog.closest('.modal-dialog');

            await doChange(dialog, 'input[name="name"]', 'NAME', context.user);
            await doClick(findButton(dialog.querySelector('.dropdown-menu'), team.name));
            await doClick(findButton(dialog, 'Add player'));

            expect(Array.from(context.container.querySelectorAll('h5')).filter(h5 => h5.textContent === 'Add a player...').length).toEqual(0);
        });
    });
});