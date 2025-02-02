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
} from "../../helpers/tests";
import {EditSide, IEditSideProps, ISaveSideOptions} from "./EditSide";
import {ITournamentContainerProps, TournamentContainer} from "./TournamentContainer";
import {createTemporaryId} from "../../helpers/projection";
import {EditTeamPlayerDto} from "../../interfaces/models/dtos/Team/EditTeamPlayerDto";
import {IClientActionResultDto} from "../common/IClientActionResultDto";
import {TeamDto} from "../../interfaces/models/dtos/Team/TeamDto";
import {TeamPlayerDto} from "../../interfaces/models/dtos/Team/TeamPlayerDto";
import {TournamentSideDto} from "../../interfaces/models/dtos/Game/TournamentSideDto";
import {UserDto} from "../../interfaces/models/dtos/Identity/UserDto";
import {DivisionDto} from "../../interfaces/models/dtos/DivisionDto";
import {TournamentGameDto} from "../../interfaces/models/dtos/Game/TournamentGameDto";
import {SeasonDto} from "../../interfaces/models/dtos/Season/SeasonDto";
import {playerBuilder} from "../../helpers/builders/players";
import {divisionBuilder} from "../../helpers/builders/divisions";
import {ITournamentSideBuilder, sideBuilder, tournamentBuilder} from "../../helpers/builders/tournaments";
import {seasonBuilder} from "../../helpers/builders/seasons";
import {teamBuilder} from "../../helpers/builders/teams";
import {IPlayerApi} from "../../interfaces/apis/IPlayerApi";
import {ITournamentPlayerMap} from "./Tournament";
import {
    DivisionTournamentFixtureDetailsDto
} from "../../interfaces/models/dtos/Division/DivisionTournamentFixtureDetailsDto";

describe('EditSide', () => {
    let context: TestContext;
    let reportedError: ErrorState;
    let updatedData: TournamentSideDto | null;
    let closed: boolean;
    let applied: boolean;
    let deleted: boolean;
    let teamsReloaded: boolean;
    let applyOptions: ISaveSideOptions | null;
    let createdPlayer: {
        divisionId: string,
        seasonId: string,
        teamId: string,
        playerDetails: EditTeamPlayerDto,
    } | null;
    let preventScroll: boolean;
    let divisions: DivisionDto[];
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
                        divisionId: divisionId,
                        players: [playerDetailsAsTeamPlayer],
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
        updatedData = null;
        closed = false;
        applied = false;
        deleted = false;
        applyOptions = null;
        teamsReloaded = false;
        createdPlayer = null;
        preventScroll = false;
        divisions = [];
    });

    async function onChange(newData: TournamentSideDto) {
        updatedData = newData;
    }

    async function onClose() {
        closed = true;
    }

    async function onApply(options: ISaveSideOptions) {
        applyOptions = options;
        applied = true;
    }

    async function onDelete() {
        deleted = true;
    }

    async function reloadTeams() {
        teamsReloaded = true;
    }

    function setPreventScroll(_: boolean) {
    }

    async function renderComponent(containerProps: ITournamentContainerProps, props: IEditSideProps, teams?: TeamDto[], account?: UserDto) {
        context = await renderApp(
            iocProps({playerApi}),
            brandingProps(),
            appProps({
                teams: teams || [],
                account: (account || { access: {} }),
                reloadTeams,
                divisions
            }, reportedError),
            (<TournamentContainer {...containerProps}>
                <EditSide {...props} />
            </TournamentContainer>));
    }

    function alreadyPlaying(player: TeamPlayerDto, tournament: DivisionTournamentFixtureDetailsDto): ITournamentPlayerMap {
        const playing: ITournamentPlayerMap = {};
        playing[player.id] = tournament;
        return playing;
    }

    function user(managePlayers?: boolean): UserDto {
        return {
            name: '',
            emailAddress: '',
            givenName: '',
            access: {
                managePlayers,
            },
        };
    }

    function props(side: TournamentSideDto): IEditSideProps {
        return {
            side,
            onChange,
            onClose,
            onApply,
            onDelete,
        };
    }

    function containerProps(tournamentData: TournamentGameDto, season: SeasonDto): ITournamentContainerProps {
        return {
            tournamentData,
            season,
            alreadyPlaying: {},
            preventScroll,
            setPreventScroll,
        };
    }

    describe('renders', () => {
        const player: TeamPlayerDto = playerBuilder('PLAYER').build();
        const anotherPlayer: TeamPlayerDto = playerBuilder('ANOTHER PLAYER').build();
        const division: DivisionDto = divisionBuilder('DIVISION').build();
        const tournamentData: TournamentGameDto = tournamentBuilder()
            .forDivision(division)
            .withSide((s: ITournamentSideBuilder) => s.name('ANOTHER SIDE').withPlayer(anotherPlayer))
            .build();
        const anotherTournament: TournamentGameDto = tournamentBuilder()
            .type('ANOTHER TOURNAMENT')
            .address('ANOTHER ADDRESS')
            .build();
        const season: SeasonDto = seasonBuilder('SEASON').build();
        const team: TeamDto = teamBuilder('TEAM')
            .forSeason(season, tournamentData.divisionId, [ player ])
            .build();
        const anotherTeam: TeamDto = teamBuilder('ANOTHER TEAM')
            .forSeason(season, tournamentData.divisionId, [ anotherPlayer ])
            .build();
        const sideWithPlayer: TournamentSideDto = sideBuilder('SIDE NAME')
            .withPlayer(player)
            .build();
        const teamSide: TournamentSideDto = sideBuilder('SIDE NAME')
            .teamId(team.id)
            .build();

        it('new side', async () => {
            await renderComponent(containerProps(tournamentData, season), props(sideBuilder().build()));

            reportedError.verifyNoError();
            const nameInput = context.container.querySelector('input[name="name"]') as HTMLInputElement;
            expect(nameInput.value).toEqual('');
        });

        it('side with players', async () => {
            await renderComponent({
                tournamentData,
                season,
                alreadyPlaying: {},
                preventScroll,
                setPreventScroll
            }, props(sideWithPlayer), [team]);

            reportedError.verifyNoError();
            const nameInput = context.container.querySelector('input[name="name"]') as HTMLInputElement;
            expect(nameInput.value).toEqual('SIDE NAME');
            expect(context.container.querySelector('.dropdown-menu')).toBeNull();
            expect(context.container.querySelector('ol.list-group')).not.toBeNull();
            expect(context.container.querySelector('ol.list-group li.list-group-item.active')!.textContent).toEqual('PLAYER');
        });

        it('excludes players from deleted team seasons', async () => {
            const deletedPlayer: TeamPlayerDto = playerBuilder('DELETED PLAYER').build();
            const deletedTeam: TeamDto = teamBuilder('DELETED TEAM')
                .forSeason(season, tournamentData.divisionId, [ deletedPlayer ], true)
                .build();

            await renderComponent(containerProps(tournamentData, season), props(sideWithPlayer), [deletedTeam, team]);

            reportedError.verifyNoError();
            const nameInput = context.container.querySelector('input[name="name"]') as HTMLInputElement;
            expect(nameInput.value).toEqual('SIDE NAME');
            expect(context.container.querySelector('.dropdown-menu')).toBeNull();
            expect(context.container.querySelector('ol.list-group')).not.toBeNull();
            expect(context.container.querySelector('ol.list-group')!.textContent).not.toContain('DELETED PLAYER');
        });

        it('players filtered by player name', async () => {
            await renderComponent(containerProps(tournamentData, season), props(sideWithPlayer), [team, anotherTeam]);

            await doChange(context.container, 'input[name="playerFilter"]', 'ANOTHER player', context.user);

            expect(context.container.querySelector('ol.list-group')).not.toBeNull();
            const playerItems = Array.from(context.container.querySelectorAll('ol.list-group li.list-group-item'));
            expect(playerItems.map(li => li.textContent)).toEqual(['ANOTHER PLAYER (🚫 Selected in "ANOTHER SIDE")']);
        });

        it('players filtered by team name', async () => {
            await renderComponent(containerProps(tournamentData, season), props(sideWithPlayer), [team, anotherTeam]);

            await doChange(context.container, 'input[name="playerFilter"]', 'ANOTHER team', context.user);

            expect(context.container.querySelector('ol.list-group')).not.toBeNull();
            const playerItems = Array.from(context.container.querySelectorAll('ol.list-group li.list-group-item'));
            expect(playerItems.map(li => li.textContent)).toEqual(['ANOTHER PLAYER (🚫 Selected in "ANOTHER SIDE")']);
        });

        it('players with common name with their team name', async () => {
            const playerWithSameNameInDifferentTeam: TeamPlayerDto = playerBuilder(player.name).build();
            const differentTeam: TeamDto = teamBuilder('DIFFERENT TEAM')
                .forSeason(season, tournamentData.divisionId, [ playerWithSameNameInDifferentTeam ])
                .build();

            await renderComponent(containerProps(tournamentData, season), props(sideWithPlayer), [team, anotherTeam, differentTeam]);

            expect(context.container.querySelector('ol.list-group')).not.toBeNull();
            const playerItems = Array.from(context.container.querySelectorAll('ol.list-group li.list-group-item'));
            expect(playerItems.map(li => li.textContent)).toEqual([
                'ANOTHER PLAYER (🚫 Selected in "ANOTHER SIDE")',
                'PLAYER [TEAM]',
                'PLAYER [DIFFERENT TEAM]']);
        });

        it('side with teamId', async () => {
            const emptyTournamentData: TournamentGameDto = tournamentBuilder()
                .forDivision(division)
                .build();

            await renderComponent(containerProps(emptyTournamentData, season), props(teamSide), [team]);

            reportedError.verifyNoError();
            const nameInput = context.container.querySelector('input[name="name"]') as HTMLInputElement;
            expect(nameInput.value).toEqual('SIDE NAME');
            expect(context.container.querySelector('.dropdown-menu .active')).not.toBeNull();
            expect(context.container.querySelector('.dropdown-menu .active')!.textContent).toEqual('TEAM');
        });

        it('side which did not show', async () => {
            const side: TournamentSideDto = sideBuilder('SIDE NAME')
                .teamId(team.id)
                .noShow()
                .build();

            await renderComponent(containerProps(tournamentData, season), props(side), [team]);

            reportedError.verifyNoError();
            const noShowInput = context.container.querySelector('input[name="noShow"]') as HTMLInputElement;
            expect(noShowInput.checked).toEqual(true);
        });

        it('side which did show', async () => {
            await renderComponent({
                tournamentData,
                season,
                alreadyPlaying: {},
                preventScroll,
                setPreventScroll
            }, props(sideWithPlayer), [team]);

            reportedError.verifyNoError();
            const noShowInput = context.container.querySelector('input[name="noShow"]') as HTMLInputElement;
            expect(noShowInput.checked).toEqual(false);
        });

        it('when team is not registered to season', async () => {
            const teamNotInSeason: TeamDto = teamBuilder('NOT IN SEASON TEAM')
                .forSeason(
                    seasonBuilder('ANOTHER SEASON').build(),
                    tournamentData.divisionId,
                    [playerBuilder('NOT IN SEASON PLAYER').build()])
                .build();
            const side: TournamentSideDto = sideBuilder('SIDE NAME')
                .teamId(teamNotInSeason.id)
                .build();

            await renderComponent(containerProps(tournamentData, season), props(side), [teamNotInSeason]);

            reportedError.verifyNoError();
            const playerItems = Array.from(context.container.querySelectorAll('.list-group .list-group-item'));
            expect(playerItems.map(li => li.textContent)).not.toContain('NOT IN SEASON PLAYER');
            const dropdownItems = Array.from(context.container.querySelectorAll('.dropdown-menu .dropdown-item'));
            expect(dropdownItems.map(i => i.textContent)).not.toContain('NOT IN SEASON TEAM');
        });

        it('when team is deleted from season', async () => {
            const deletedTeam: TeamDto = teamBuilder('DELETED TEAM')
                .forSeason(
                    season,
                    tournamentData.divisionId,
                    [playerBuilder('DELETED PLAYER').build()],
                    true)
                .build();
            const side: TournamentSideDto = sideBuilder('SIDE NAME')
                .teamId(deletedTeam.id)
                .build();

            await renderComponent(containerProps(tournamentData, season), props(side), [deletedTeam]);

            reportedError.verifyNoError();
            const playerItems = Array.from(context.container.querySelectorAll('.list-group .list-group-item'));
            expect(playerItems.map(li => li.textContent)).not.toContain('DELETED PLAYER');
            const dropdownItems = Array.from(context.container.querySelectorAll('.dropdown-menu .dropdown-item'));
            expect(dropdownItems.map(i => i.textContent)).not.toContain('DELETED TEAM');
        });

        it('excludes players from another division when for a division', async () => {
            const otherDivisionTeam: TeamDto = teamBuilder('OTHER DIVISION TEAM')
                .forSeason(
                    season,
                    divisionBuilder('ANOTHER DIVISION').build(),
                    [playerBuilder('OTHER DIVISION PLAYER').build()])
                .build();

            await renderComponent({
                tournamentData,
                season,
                alreadyPlaying: alreadyPlaying(player, anotherTournament),
                preventScroll,
                setPreventScroll
            }, props(sideWithPlayer), [otherDivisionTeam, team]);

            reportedError.verifyNoError();
            const playerItems = Array.from(context.container.querySelectorAll('.list-group .list-group-item'));
            expect(playerItems.map(li => li.textContent)).not.toContain('OTHER DIVISION PLAYER');
        });

        it('includes players from another division when cross-divisional', async () => {
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
                alreadyPlaying: alreadyPlaying(player, anotherTournament),
                preventScroll,
                setPreventScroll,
            }, props(sideWithPlayer), [otherDivisionTeam, team]);

            reportedError.verifyNoError();
            const playerItems = Array.from(context.container.querySelectorAll('.list-group .list-group-item'));
            expect(playerItems.map(li => li.textContent)).toContain('OTHER DIVISION PLAYER');
        });

        it('warning about players that are selected in another tournament', async () => {
            await renderComponent({
                tournamentData,
                season,
                alreadyPlaying: alreadyPlaying(player, anotherTournament),
                preventScroll,
                setPreventScroll,
            }, props(sideWithPlayer), [team]);

            reportedError.verifyNoError();
            const playerItems = Array.from(context.container.querySelectorAll('.list-group .list-group-item'));
            expect(playerItems.map(li => li.textContent)).toContain('PLAYER (⚠ Playing in ANOTHER TOURNAMENT)');
        });

        it('unselectable players when selected in another side', async () => {
            await renderComponent(containerProps(tournamentData, season), props(sideWithPlayer), [anotherTeam]);

            reportedError.verifyNoError();
            const playerItems = Array.from(context.container.querySelectorAll('.list-group .list-group-item'));
            expect(playerItems.map(li => li.textContent)).toContain('ANOTHER PLAYER (🚫 Selected in "ANOTHER SIDE")');
        });

        it('selectable players when selected in this side', async () => {
            await renderComponent(containerProps(tournamentData, season), props(tournamentData.sides![0]), [anotherTeam]);

            reportedError.verifyNoError();
            const playerItems = Array.from(context.container.querySelectorAll('.list-group .list-group-item'));
            expect(playerItems.map(li => li.textContent)).toContain('ANOTHER PLAYER');
        });

        it('delete button when side exists', async () => {
            await renderComponent(containerProps(tournamentData, season), props(teamSide), [team]);

            reportedError.verifyNoError();
            expect(context.container.querySelector('.btn-danger')).toBeTruthy();
            expect(context.container.querySelector('.btn-danger')!.textContent).toEqual('Delete side');
        });

        it('no delete button when side is new', async () => {
            const side: TournamentSideDto = sideBuilder('SIDE NAME').noId().build();

            await renderComponent(containerProps(tournamentData, season), props(side), [team]);

            reportedError.verifyNoError();
            expect(context.container.querySelector('.btn-danger')).toBeFalsy();
        });

        it('add player button when permitted and new side', async () => {
            const side: TournamentSideDto = sideBuilder('SIDE NAME')
                .noId()
                .build();

            await renderComponent(containerProps(tournamentData, season), props(side), [team], user(true));

            reportedError.verifyNoError();
            const buttons = Array.from(context.container.querySelectorAll('.btn'));
            const buttonText = buttons.map(btn => btn.textContent);
            expect(buttonText).toContain('Add player/s');
        });

        it('add player button when permitted and editing side', async () => {
            await renderComponent(containerProps(tournamentData, season), props(sideWithPlayer), [team], user(true));

            reportedError.verifyNoError();
            const buttons = Array.from(context.container.querySelectorAll('.btn'));
            const buttonText = buttons.map(btn => btn.textContent);
            expect(buttonText).toContain('Add player/s');
        });

        it('no add player button when not permitted', async () => {
            await renderComponent(containerProps(tournamentData, season), props(teamSide), [team], user(false));

            reportedError.verifyNoError();
            const buttons = Array.from(context.container.querySelectorAll('.btn'));
            const buttonText = buttons.map(btn => btn.textContent);
            expect(buttonText).not.toContain('Add player');
        });

        it('no add player button when permitted and team side', async () => {
            await renderComponent(containerProps(tournamentData, season), props(teamSide), [team], user(false));

            reportedError.verifyNoError();
            const buttons = Array.from(context.container.querySelectorAll('.btn'));
            const buttonText = buttons.map(btn => btn.textContent);
            expect(buttonText).not.toContain('Add player');
        });
    });

    describe('interactivity', () => {
        const player: TeamPlayerDto = playerBuilder('PLAYER').build();
        const anotherPlayer: TeamPlayerDto = playerBuilder('ANOTHER PLAYER').build();
        const division: DivisionDto = divisionBuilder('DIVISION').build();
        const tournamentData: TournamentGameDto = tournamentBuilder()
            .forDivision(division)
            .withSide((s: ITournamentSideBuilder) => s.name('ANOTHER SIDE').withPlayer(anotherPlayer))
            .build();
        const anotherTournament: TournamentGameDto = tournamentBuilder()
            .type('ANOTHER TOURNAMENT')
            .address('ANOTHER ADDRESS')
            .build();
        const season: SeasonDto = seasonBuilder('SEASON').build();
        const team: TeamDto = teamBuilder('TEAM')
            .forSeason(season, division.id, [ player, anotherPlayer ])
            .build();
        const teamSide: TournamentSideDto = sideBuilder('SIDE NAME')
            .teamId(team.id)
            .build();
        const sideWithPlayer: TournamentSideDto = sideBuilder('SIDE NAME')
            .withPlayer(player)
            .build();
        const otherDivisionTournament: TournamentGameDto = tournamentBuilder()
            .forDivision(divisionBuilder('DIVISION').build())
            .build();

        it('can change side name', async () => {
            await renderComponent(containerProps(tournamentData, season), props(sideWithPlayer), [team]);

            await doChange(context.container, 'input[name="name"]', 'NEW NAME', context.user);

            reportedError.verifyNoError();
            expect(updatedData).toEqual({
                id: expect.any(String),
                name: 'NEW NAME',
                players: expect.any(Array),
            });
        });

        it('can change noShow', async () => {
            await renderComponent(containerProps(tournamentData, season), props(sideWithPlayer), [team]);

            await doClick(context.container, 'input[name="noShow"]');

            reportedError.verifyNoError();
            expect(updatedData).toEqual({
                id: expect.any(String),
                name: 'SIDE NAME',
                noShow: true,
                players: expect.any(Array),
            });
        });

        it('can change team id', async () => {
            const side: TournamentSideDto = sideBuilder().build();
            const anotherTeam: TeamDto = teamBuilder('ANOTHER TEAM')
                .forSeason(season, division.id)
                .build();
            const teamTournamentData: TournamentGameDto = tournamentBuilder()
                .forDivision(division)
                .withSide((s: ITournamentSideBuilder) => s.name('ANOTHER SIDE').teamId(anotherTeam.id))
                .build();
            await renderComponent(containerProps(teamTournamentData, season), props(side), [team, anotherTeam]);

            await doSelectOption(context.container.querySelector('.dropdown-menu'), 'TEAM');

            reportedError.verifyNoError();
            expect(updatedData).toEqual({
                id: side.id,
                players: [],
                name: 'TEAM',
                teamId: team.id,
            });
        });

        it('can unset team id', async () => {
            const anotherTeam: TeamDto = teamBuilder('ANOTHER TEAM')
                .forSeason(season, division.id)
                .build();
            const teamTournamentData: TournamentGameDto = tournamentBuilder()
                .forDivision(division)
                .withSide((s: ITournamentSideBuilder) => s.name('ANOTHER SIDE').teamId(anotherTeam.id))
                .build();
            await renderComponent(containerProps(teamTournamentData, season), props(teamSide), [team, anotherTeam]);

            await doSelectOption(context.container.querySelector('.dropdown-menu'), 'Select team');

            reportedError.verifyNoError();
            expect(updatedData).toEqual({
                id: expect.any(String),
                name: 'SIDE NAME',
                players: [],
            });
        });

        it('can select player', async () => {
            const side: TournamentSideDto = sideBuilder('').build();
            await renderComponent(containerProps(tournamentData, season), props(side), [team]);
            const players = Array.from(context.container.querySelectorAll('.list-group .list-group-item'));

            await doClick(players.filter(p => p.textContent === 'PLAYER')[0]);

            reportedError.verifyNoError();
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
            const side: TournamentSideDto = sideBuilder().build();
            await renderComponent(containerProps(tournamentData, season), props(side), [team]);
            const players = Array.from(context.container.querySelectorAll('.list-group .list-group-item'));

            await doClick(players.filter(p => p.textContent === 'PLAYER')[0]);

            reportedError.verifyNoError();
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
            const side: TournamentSideDto = sideBuilder('OTHER NAME').build();
            await renderComponent(containerProps(tournamentData, season), props(side), [team]);
            const players = Array.from(context.container.querySelectorAll('.list-group .list-group-item'));

            await doClick(players.filter(p => p.textContent === 'PLAYER')[0]);

            reportedError.verifyNoError();
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
            const sideWithPlayerName: TournamentSideDto = sideBuilder('PLAYER')
                .withPlayer(player)
                .build();
            const noSidesTournamentData: TournamentGameDto = tournamentBuilder()
                .forDivision(tournamentData.divisionId)
                .build();
            await renderComponent(containerProps(noSidesTournamentData, season), props(sideWithPlayerName), [team]);
            const players = Array.from(context.container.querySelectorAll('.list-group .list-group-item'));

            await doClick(players.filter(p => p.textContent === 'ANOTHER PLAYER')[0]);

            reportedError.verifyNoError();
            expect(updatedData).toEqual({
                id: expect.any(String),
                name: 'ANOTHER PLAYER, PLAYER',
                players: [{
                    id: anotherPlayer.id,
                    name: 'ANOTHER PLAYER',
                }, {
                    id: player.id,
                    name: 'PLAYER',
                }],
            });
        });

        it('can select another player and team name does not change', async () => {
            const noSidesTournamentData: TournamentGameDto = tournamentBuilder()
                .forDivision(tournamentData.divisionId)
                .build();
            await renderComponent(containerProps(noSidesTournamentData, season), props(sideWithPlayer), [team]);
            const players = Array.from(context.container.querySelectorAll('.list-group .list-group-item'));

            await doClick(players.filter(p => p.textContent === 'ANOTHER PLAYER')[0]);

            reportedError.verifyNoError();
            expect(updatedData).toEqual({
                id: expect.any(String),
                name: 'SIDE NAME',
                players: [{
                    id: player.id,
                    name: 'PLAYER',
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
            await renderComponent(containerProps(noSidesTournamentData, season), props(side), [team]);
            const players = Array.from(context.container.querySelectorAll('.list-group .list-group-item'));

            await doClick(players.filter(p => p.textContent === 'ANOTHER PLAYER')[0]);

            reportedError.verifyNoError();
            expect(updatedData).toEqual({
                id: expect.any(String),
                name: 'PLAYER',
                players: [player],
            });
        });

        it('can delete side', async () => {
            await renderComponent(containerProps(tournamentData, season), props(sideWithPlayer), [team]);
            context.prompts.respondToConfirm('Are you sure you want to remove SIDE NAME?', true);

            await doClick(findButton(context.container, 'Delete side'));

            reportedError.verifyNoError();
            context.prompts.confirmWasShown('Are you sure you want to remove SIDE NAME?');
            expect(deleted).toEqual(true);
        });

        it('does not delete side when rejected', async () => {
            await renderComponent(containerProps(tournamentData, season), props(sideWithPlayer), [team]);
            context.prompts.respondToConfirm('Are you sure you want to remove SIDE NAME?', false);

            await doClick(findButton(context.container, 'Delete side'));

            reportedError.verifyNoError();
            context.prompts.confirmWasShown('Are you sure you want to remove SIDE NAME?');
            expect(deleted).toEqual(false);
        });

        it('cannot save side if no name', async () => {
            const side: TournamentSideDto = sideBuilder('').teamId(team.id).build();
            await renderComponent(containerProps(tournamentData, season), props(side), [team]);

            await doClick(findButton(context.container, 'Save'));

            reportedError.verifyNoError();
            context.prompts.alertWasShown('Please enter a name for this side');
            expect(applied).toEqual(false);
        });

        it('can save side when no teamId and no players', async () => {
            const side: TournamentSideDto = sideBuilder('NAME').build();
            await renderComponent(containerProps(tournamentData, season), props(side), [team]);

            await doClick(findButton(context.container, 'Save'));

            reportedError.verifyNoError();
            expect(applied).toEqual(true);
        });

        it('can save side', async () => {
            await renderComponent(containerProps(tournamentData, season), props(sideWithPlayer), [team]);

            await doClick(findButton(context.container, 'Save'));

            reportedError.verifyNoError();
            expect(applied).toEqual(true);
            expect(applyOptions).toEqual({
                addAsIndividuals: false
            });
        });

        it('can close', async () => {
            await renderComponent(containerProps(tournamentData, season), props(sideWithPlayer), [team]);

            await doClick(findButton(context.container, 'Close'));

            reportedError.verifyNoError();
            expect(closed).toEqual(true);
            expect(applied).toEqual(false);
        });

        it('can select players that are selected in another tournament', async () => {
            const side: TournamentSideDto = sideBuilder('SIDE NAME').build();
            await renderComponent({
                tournamentData,
                season,
                alreadyPlaying: alreadyPlaying(player, anotherTournament),
                preventScroll,
                setPreventScroll,
            }, props(side), [team]);
            reportedError.verifyNoError();
            const playerItems = Array.from(context.container.querySelectorAll('.list-group .list-group-item'));
            const playerItem = playerItems.filter(li => li.textContent === 'PLAYER (⚠ Playing in ANOTHER TOURNAMENT)')[0];
            expect(playerItem.className).not.toContain('disabled');

            await doClick(playerItem);

            reportedError.verifyNoError();
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
            await renderComponent(containerProps(tournamentData, season), props(side), [team]);
            reportedError.verifyNoError();
            const playerItems = Array.from(context.container.querySelectorAll('.list-group .list-group-item'));
            const playerItem = playerItems.filter(li => li.textContent === 'ANOTHER PLAYER (🚫 Selected in "ANOTHER SIDE")')[0];
            expect(playerItem.className).toContain('disabled');

            await doClick(playerItem);

            reportedError.verifyNoError();
            expect(updatedData).toBeNull();
        });

        it('can open add player dialog', async () => {
            await renderComponent({
                tournamentData,
                season,
                alreadyPlaying: {},
                preventScroll,
                setPreventScroll,
            }, props(sideWithPlayer), [team], user(true));

            await doClick(findButton(context.container, 'Add player/s'));

            const headingForDialog = Array.from(context.container.querySelectorAll('h5')).filter(h5 => h5.textContent === 'Add a player...')[0];
            expect(headingForDialog).toBeTruthy();
            expect(headingForDialog.closest('.modal-dialog')).toBeTruthy();
        });

        it('can close add player dialog', async () => {
            await renderComponent(containerProps(tournamentData, season), props(sideWithPlayer), [team], user(true));
            await doClick(findButton(context.container, 'Add player/s'));
            const headingForDialog = Array.from(context.container.querySelectorAll('h5')).filter(h5 => h5.textContent === 'Add a player...')[0];
            const dialog = headingForDialog.closest('.modal-dialog');

            await doClick(findButton(dialog, 'Cancel'));

            expect(Array.from(context.container.querySelectorAll('h5')).filter(h5 => h5.textContent === 'Add a player...').length).toEqual(0);
        });

        it('can add player', async () => {
            await renderComponent(containerProps(tournamentData, season), props(sideWithPlayer), [team], user(true));
            await doClick(findButton(context.container, 'Add player/s'));
            const headingForDialog = Array.from(context.container.querySelectorAll('h5')).filter(h5 => h5.textContent === 'Add a player...')[0];
            const dialog = headingForDialog.closest('.modal-dialog')!;

            await doChange(dialog, 'input[name="name"]', 'NAME', context.user);
            await doSelectOption(dialog.querySelector('div[datatype="team-selection-team"] .dropdown-menu'), team.name);
            await doClick(findButton(dialog, 'Add player'));

            expect(createdPlayer).not.toBeNull();
            expect(updatedData!.players).toEqual([player, {
                name: 'NAME',
                id: expect.any(String),
                divisionId: division.id,
            }]);
        });

        it('can add player to multi-division tournament', async () => {
            const multiDivisionTournament: TournamentGameDto = tournamentBuilder()
                .withSide((s: ITournamentSideBuilder) => s.name('ANOTHER SIDE').withPlayer(anotherPlayer))
                .build();
            divisions = [ division ];
            await renderComponent(containerProps(multiDivisionTournament, season), props(sideWithPlayer), [team], user(true));
            await doClick(findButton(context.container, 'Add player/s'));
            const headingForDialog = Array.from(context.container.querySelectorAll('h5')).filter(h5 => h5.textContent === 'Add a player...')[0];
            const dialog = headingForDialog.closest('.modal-dialog')!;

            await doChange(dialog, 'input[name="name"]', 'NAME', context.user);
            await doSelectOption(dialog.querySelector('div[datatype="team-selection-team"] .dropdown-menu'), team.name);
            await doClick(findButton(dialog, 'Add player'));

            expect(createdPlayer).not.toBeNull();
            expect(updatedData!.players).toEqual([player, {
                name: 'NAME',
                id: expect.any(String),
                divisionId: division.id,
            }]);
        });

        it('selects newly created player', async () => {
            await renderComponent(containerProps(tournamentData, season), props(sideWithPlayer), [team], user(true));
            await doClick(findButton(context.container, 'Add player/s'));
            const headingForDialog = Array.from(context.container.querySelectorAll('h5')).filter(h5 => h5.textContent === 'Add a player...')[0];
            const dialog = headingForDialog.closest('.modal-dialog')!;

            await doChange(dialog, 'input[name="name"]', 'NAME', context.user);
            await doSelectOption(dialog.querySelector('.dropdown-menu'), team.name);
            await doClick(findButton(dialog, 'Add player'));

            reportedError.verifyNoError();
            expect(updatedData).toEqual({
                id: sideWithPlayer.id,
                name: 'SIDE NAME',
                players: [player, {
                    id: expect.any(String),
                    name: 'NAME',
                    divisionId: tournamentData.divisionId,
                }]
            });
        });

        it('reloads teams after player added', async () => {
            await renderComponent(containerProps(tournamentData, season), props(sideWithPlayer), [team], user(true));
            await doClick(findButton(context.container, 'Add player/s'));
            const headingForDialog = Array.from(context.container.querySelectorAll('h5')).filter(h5 => h5.textContent === 'Add a player...')[0];
            const dialog = headingForDialog.closest('.modal-dialog')!;

            await doChange(dialog, 'input[name="name"]', 'NAME', context.user);
            await doSelectOption(dialog.querySelector('.dropdown-menu'), team.name);
            await doClick(findButton(dialog, 'Add player'));

            expect(teamsReloaded).toEqual(true);
        });

        it('closes dialog after adding a player', async () => {
            await renderComponent(containerProps(tournamentData, season), props(sideWithPlayer), [team], user(true));
            await doClick(findButton(context.container, 'Add player/s'));
            const headingForDialog = Array.from(context.container.querySelectorAll('h5')).filter(h5 => h5.textContent === 'Add a player...')[0];
            const dialog = headingForDialog.closest('.modal-dialog')!;

            await doChange(dialog, 'input[name="name"]', 'NAME', context.user);
            await doSelectOption(dialog.querySelector('.dropdown-menu'), team.name);
            await doClick(findButton(dialog, 'Add player'));

            expect(Array.from(context.container.querySelectorAll('h5')).filter(h5 => h5.textContent === 'Add a player...').length).toEqual(0);
        });

        it('can select team when no other sides', async () => {
            await renderComponent({
                tournamentData: otherDivisionTournament,
                season,
                alreadyPlaying: alreadyPlaying(player, anotherTournament),
                preventScroll,
                setPreventScroll,
            }, props(teamSide), [team]);

            expect(context.container.querySelector('.dropdown-menu')).toBeTruthy();
        });

        it('can select players when no other sides', async () => {
            await renderComponent({
                tournamentData: otherDivisionTournament,
                season,
                alreadyPlaying: alreadyPlaying(player, anotherTournament),
                preventScroll,
                setPreventScroll,
            }, props(sideWithPlayer), [team]);

            expect(context.container.querySelector('.list-group')).toBeTruthy();
        });

        it('can select team when other sides are teams', async () => {
            const tournamentData: TournamentGameDto = tournamentBuilder()
                .forDivision(divisionBuilder('DIVISION').build())
                .withSide((s: ITournamentSideBuilder) => s.name('TEAM').teamId(team.id))
                .build();

            await renderComponent({
                tournamentData,
                season,
                alreadyPlaying: alreadyPlaying(player, anotherTournament),
                preventScroll,
                setPreventScroll,
            }, props(teamSide), [team]);

            expect(context.container.querySelector('.dropdown-menu')).toBeTruthy();
        });

        it('can select players when other sides are players', async () => {
            const tournamentData: TournamentGameDto = tournamentBuilder()
                .forDivision(divisionBuilder('DIVISION').build())
                .withSide((s: ITournamentSideBuilder) => s.name('PLAYER').withPlayer(player))
                .build();

            await renderComponent({
                tournamentData,
                season,
                alreadyPlaying: alreadyPlaying(player, anotherTournament),
                preventScroll,
                setPreventScroll,
            }, props(sideWithPlayer), [team]);

            expect(context.container.querySelector('.list-group')).toBeTruthy();
        });

        it('cannot select team when other sides are players', async () => {
            const tournamentData: TournamentGameDto = tournamentBuilder()
                .forDivision(divisionBuilder('DIVISION').build())
                .withSide((s: ITournamentSideBuilder) => s.name('PLAYER').withPlayer(player))
                .build();

            await renderComponent({
                tournamentData,
                season,
                alreadyPlaying: alreadyPlaying(player, anotherTournament),
                preventScroll,
                setPreventScroll,
            }, props(sideWithPlayer), [team]);

            expect(context.container.querySelector('.dropdown-menu')).toBeFalsy();
        });

        it('cannot select team when other sides are teams', async () => {
            const tournamentData: TournamentGameDto = tournamentBuilder()
                .forDivision(divisionBuilder('DIVISION').build())
                .withSide((s: ITournamentSideBuilder) => s.name('TEAM').teamId(team.id))
                .build();

            await renderComponent({
                tournamentData,
                season,
                alreadyPlaying: alreadyPlaying(player, anotherTournament),
                preventScroll,
                setPreventScroll,
            }, props(sideWithPlayer), [team]);

            expect(context.container.querySelector('.list-group')).toBeFalsy();
        });
    });
});