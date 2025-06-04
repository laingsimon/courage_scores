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
    renderApp,
    TestContext,
    user,
} from '../../helpers/tests';
import { EditSide, IEditSideProps, ISaveSideOptions } from './EditSide';
import {
    ITournamentContainerProps,
    TournamentContainer,
} from './TournamentContainer';
import { createTemporaryId } from '../../helpers/projection';
import { EditTeamPlayerDto } from '../../interfaces/models/dtos/Team/EditTeamPlayerDto';
import { IClientActionResultDto } from '../common/IClientActionResultDto';
import { TeamDto } from '../../interfaces/models/dtos/Team/TeamDto';
import { TeamPlayerDto } from '../../interfaces/models/dtos/Team/TeamPlayerDto';
import { TournamentSideDto } from '../../interfaces/models/dtos/Game/TournamentSideDto';
import { UserDto } from '../../interfaces/models/dtos/Identity/UserDto';
import { DivisionDto } from '../../interfaces/models/dtos/DivisionDto';
import { TournamentGameDto } from '../../interfaces/models/dtos/Game/TournamentGameDto';
import { SeasonDto } from '../../interfaces/models/dtos/Season/SeasonDto';
import { playerBuilder } from '../../helpers/builders/players';
import { divisionBuilder } from '../../helpers/builders/divisions';
import {
    sideBuilder,
    tournamentBuilder,
} from '../../helpers/builders/tournaments';
import { seasonBuilder } from '../../helpers/builders/seasons';
import { teamBuilder } from '../../helpers/builders/teams';
import { IPlayerApi } from '../../interfaces/apis/IPlayerApi';
import { ITournamentPlayerMap } from './Tournament';
import { tournamentContainerPropsBuilder } from './tournamentContainerPropsBuilder';
import { TournamentPlayerDto } from '../../interfaces/models/dtos/Game/TournamentPlayerDto';

describe('EditSide', () => {
    const player: TeamPlayerDto = playerBuilder('PLAYER').build();
    const anotherPlayer = playerBuilder('ANOTHER PLAYER').build();
    const division: DivisionDto = divisionBuilder('DIVISION').build();
    const season: SeasonDto = seasonBuilder('SEASON').build();
    const tournamentData: TournamentGameDto = tournamentBuilder()
        .forDivision(division)
        .withSide((s) => s.name('ANOTHER SIDE').withPlayer(anotherPlayer))
        .build();
    const anotherTournament: TournamentGameDto = tournamentBuilder()
        .type('ANOTHER TOURNAMENT')
        .address('ANOTHER ADDRESS')
        .build();
    const sideWithPlayer: TournamentSideDto = sideBuilder('SIDE NAME')
        .withPlayer(player)
        .build();
    const containerProps = new tournamentContainerPropsBuilder({
        tournamentData,
        season,
        alreadyPlaying: {},
    });
    let context: TestContext;
    let reportedError: ErrorState;
    let updatedData: TournamentSideDto | null;
    let closed: boolean;
    let applied: boolean;
    let deleted: boolean;
    let teamsReloaded: boolean;
    let applyOptions: ISaveSideOptions | null;
    let createdPlayer: {
        divisionId: string;
        seasonId: string;
        teamId: string;
        playerDetails: EditTeamPlayerDto;
    } | null;
    let divisions: DivisionDto[];
    const playerApi = api<IPlayerApi>({
        create: async (
            divisionId: string,
            seasonId: string,
            teamId: string,
            playerDetails: EditTeamPlayerDto,
        ): Promise<IClientActionResultDto<TeamDto>> => {
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
                    seasons: [
                        {
                            seasonId: seasonId,
                            divisionId: divisionId,
                            players: [playerDetailsAsTeamPlayer],
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
        updatedData = null;
        closed = false;
        applied = false;
        deleted = false;
        applyOptions = null;
        teamsReloaded = false;
        createdPlayer = null;
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

    async function renderComponent(
        containerProps: ITournamentContainerProps,
        props: IEditSideProps,
        teams?: TeamDto[],
        account?: UserDto,
    ) {
        context = await renderApp(
            iocProps({ playerApi }),
            brandingProps(),
            appProps(
                {
                    teams: teams || [],
                    account: account || user({}),
                    reloadTeams,
                    divisions,
                },
                reportedError,
            ),
            <TournamentContainer {...containerProps}>
                <EditSide {...props} />
            </TournamentContainer>,
        );

        reportedError.verifyNoError();
    }

    function alreadyPlaying(player: TeamPlayerDto): ITournamentPlayerMap {
        const playing: ITournamentPlayerMap = {};
        playing[player.id] = anotherTournament;
        return playing;
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

    function nameInput() {
        return context.container.querySelector(
            'input[name="name"]',
        ) as HTMLInputElement;
    }

    function teamDropdown() {
        return context.container.querySelector('.dropdown-menu');
    }

    function teamOptions(activeOnly?: boolean) {
        return Array.from(
            context.container.querySelectorAll(
                `.dropdown-menu .dropdown-item${activeOnly ? '.active' : ''}`,
            ),
        );
    }

    function findDialog(heading: string) {
        const headings = context.container.querySelectorAll('h5');
        const headingForDialog = Array.from(headings).filter(
            (h5) => h5.textContent === heading,
        )[0];
        return headingForDialog?.closest('.modal-dialog')!;
    }

    function playerItems(activeOnly?: boolean) {
        return Array.from(
            context.container.querySelectorAll(
                `.list-group .list-group-item${activeOnly ? '.active' : ''}`,
            ),
        );
    }

    function playerNames(activeOnly?: boolean) {
        return playerItems(activeOnly).map((pi) => pi.textContent);
    }

    function noShowCheckbox() {
        return context.container.querySelector(
            'input[name="noShow"]',
        ) as HTMLInputElement;
    }

    function findButtons() {
        return Array.from(context.container.querySelectorAll('.btn')).map(
            (b) => b.textContent,
        );
    }

    function newPlayer(name: string, divisionId?: string) {
        return {
            id: expect.any(String),
            name: name,
            divisionId: divisionId,
        };
    }

    function equatablePlayer(player: TeamPlayerDto) {
        return {
            id: player.id,
            name: player.name,
        };
    }

    function equatableUpdate(
        name: string,
        players?: TournamentPlayerDto[],
        data?: Partial<TournamentSideDto>,
    ): TournamentSideDto {
        return {
            id: expect.any(String),
            name: name,
            players: players ?? expect.any(Array),
            ...data,
        };
    }

    describe('renders', () => {
        const team: TeamDto = teamBuilder('TEAM')
            .forSeason(season, tournamentData.divisionId, [player])
            .build();
        const anotherTeam: TeamDto = teamBuilder('ANOTHER TEAM')
            .forSeason(season, tournamentData.divisionId, [anotherPlayer])
            .build();
        const teamSide = sideBuilder('SIDE NAME').teamId(team.id).build();

        it('new side', async () => {
            await renderComponent(
                containerProps.build(),
                props(sideBuilder().build()),
            );

            expect(nameInput().value).toEqual('');
        });

        it('side with players', async () => {
            await renderComponent(
                containerProps.withAlreadyPlaying({}).build(),
                props(sideWithPlayer),
                [team],
            );

            expect(nameInput().value).toEqual('SIDE NAME');
            expect(teamDropdown()).toBeNull();
            expect(playerNames(true)).toEqual(['PLAYER']);
        });

        it('excludes players from deleted team seasons', async () => {
            const deletedPlayer = playerBuilder('DELETED PLAYER').build();
            const deletedTeam = teamBuilder('DELETED TEAM')
                .forSeason(
                    season,
                    tournamentData.divisionId,
                    [deletedPlayer],
                    true,
                )
                .build();

            await renderComponent(
                containerProps.build(),
                props(sideWithPlayer),
                [deletedTeam, team],
            );

            expect(nameInput().value).toEqual('SIDE NAME');
            expect(teamDropdown()).toBeNull();
            expect(playerNames()).not.toContain('DELETED PLAYER');
        });

        it('players filtered by player name', async () => {
            await renderComponent(
                containerProps.build(),
                props(sideWithPlayer),
                [team, anotherTeam],
            );

            await doChange(
                context.container,
                'input[name="playerFilter"]',
                'ANOTHER player',
                context.user,
            );

            expect(playerNames()).toEqual([
                'ANOTHER PLAYER (🚫 Selected in "ANOTHER SIDE")',
            ]);
        });

        it('players filtered by team name', async () => {
            await renderComponent(
                containerProps.build(),
                props(sideWithPlayer),
                [team, anotherTeam],
            );

            await doChange(
                context.container,
                'input[name="playerFilter"]',
                'ANOTHER team',
                context.user,
            );

            expect(playerNames()).toEqual([
                'ANOTHER PLAYER (🚫 Selected in "ANOTHER SIDE")',
            ]);
        });

        it('players with common name with their team name', async () => {
            const playerWithSameNameInDifferentTeam = playerBuilder(
                player.name,
            ).build();
            const differentTeam = teamBuilder('DIFFERENT TEAM')
                .forSeason(season, tournamentData.divisionId, [
                    playerWithSameNameInDifferentTeam,
                ])
                .build();

            await renderComponent(
                containerProps.build(),
                props(sideWithPlayer),
                [team, anotherTeam, differentTeam],
            );

            expect(playerNames()).toEqual([
                'ANOTHER PLAYER (🚫 Selected in "ANOTHER SIDE")',
                'PLAYER [TEAM]',
                'PLAYER [DIFFERENT TEAM]',
            ]);
        });

        it('side with teamId', async () => {
            const emptyTournamentData = tournamentBuilder()
                .forDivision(division)
                .build();

            await renderComponent(
                containerProps.withTournament(emptyTournamentData).build(),
                props(teamSide),
                [team],
            );

            expect(nameInput().value).toEqual('SIDE NAME');
            expect(teamOptions(true).map((t) => t.textContent)).toEqual([
                'TEAM',
            ]);
        });

        it('side which did not show', async () => {
            const side = sideBuilder('SIDE NAME')
                .teamId(team.id)
                .noShow()
                .build();

            await renderComponent(containerProps.build(), props(side), [team]);

            expect(noShowCheckbox().checked).toEqual(true);
        });

        it('side which did show', async () => {
            await renderComponent(
                containerProps.withAlreadyPlaying({}).build(),
                props(sideWithPlayer),
                [team],
            );

            expect(noShowCheckbox().checked).toEqual(false);
        });

        it('when team is not registered to season', async () => {
            const teamNotInSeason = teamBuilder('NOT IN SEASON TEAM')
                .forSeason(
                    seasonBuilder('ANOTHER SEASON').build(),
                    tournamentData.divisionId,
                    [playerBuilder('NOT IN SEASON PLAYER').build()],
                )
                .build();
            const side = sideBuilder('SIDE NAME')
                .teamId(teamNotInSeason.id)
                .build();

            await renderComponent(containerProps.build(), props(side), [
                teamNotInSeason,
            ]);

            expect(playerNames()).not.toContain('NOT IN SEASON PLAYER');
            expect(teamOptions().map((i) => i.textContent)).not.toContain(
                'NOT IN SEASON TEAM',
            );
        });

        it('when team is deleted from season', async () => {
            const deletedTeam = teamBuilder('DELETED TEAM')
                .forSeason(
                    season,
                    tournamentData.divisionId,
                    [playerBuilder('DELETED PLAYER').build()],
                    true,
                )
                .build();
            const side = sideBuilder('SIDE NAME')
                .teamId(deletedTeam.id)
                .build();

            await renderComponent(containerProps.build(), props(side), [
                deletedTeam,
            ]);

            expect(playerNames()).not.toContain('DELETED PLAYER');
            expect(teamOptions().map((i) => i.textContent)).not.toContain(
                'DELETED TEAM',
            );
        });

        it('excludes players from another division when for a division', async () => {
            const otherDivisionTeam = teamBuilder('OTHER DIVISION TEAM')
                .forSeason(
                    season,
                    divisionBuilder('ANOTHER DIVISION').build(),
                    [playerBuilder('OTHER DIVISION PLAYER').build()],
                )
                .build();

            await renderComponent(
                containerProps
                    .withAlreadyPlaying(alreadyPlaying(player))
                    .build(),
                props(sideWithPlayer),
                [otherDivisionTeam, team],
            );

            expect(playerNames()).not.toContain('OTHER DIVISION PLAYER');
        });

        it('includes players from another division when cross-divisional', async () => {
            const otherDivisionTeam = teamBuilder('OTHER DIVISION TEAM')
                .forSeason(
                    season,
                    divisionBuilder('ANOTHER DIVISION').build(),
                    [playerBuilder('OTHER DIVISION PLAYER').build()],
                )
                .build();
            const crossDivisionalTournamentData = tournamentBuilder().build();

            await renderComponent(
                containerProps
                    .withTournament(crossDivisionalTournamentData)
                    .withAlreadyPlaying(alreadyPlaying(player))
                    .build(),
                props(sideWithPlayer),
                [otherDivisionTeam, team],
            );

            expect(playerNames()).toContain('OTHER DIVISION PLAYER');
        });

        it('warning about players that are selected in another tournament', async () => {
            await renderComponent(
                containerProps
                    .withAlreadyPlaying(alreadyPlaying(player))
                    .build(),
                props(sideWithPlayer),
                [team],
            );

            expect(playerNames()).toContain(
                'PLAYER (⚠ Playing in ANOTHER TOURNAMENT)',
            );
        });

        it('unselectable players when selected in another side', async () => {
            await renderComponent(
                containerProps.build(),
                props(sideWithPlayer),
                [anotherTeam],
            );

            expect(playerNames()).toContain(
                'ANOTHER PLAYER (🚫 Selected in "ANOTHER SIDE")',
            );
        });

        it('selectable players when selected in this side', async () => {
            await renderComponent(
                containerProps.build(),
                props(tournamentData.sides![0]),
                [anotherTeam],
            );

            expect(playerNames()).toContain('ANOTHER PLAYER');
        });

        it('delete button when side exists', async () => {
            await renderComponent(containerProps.build(), props(teamSide), [
                team,
            ]);

            expect(findButtons()).toContain('Delete side');
        });

        it('no delete button when side is new', async () => {
            const side = sideBuilder('SIDE NAME').noId().build();

            await renderComponent(containerProps.build(), props(side), [team]);

            expect(findButtons()).not.toContain('Delete side');
        });

        it('add player button when permitted and new side', async () => {
            const side = sideBuilder('SIDE NAME').noId().build();

            await renderComponent(
                containerProps.build(),
                props(side),
                [team],
                user({ managePlayers: true }),
            );

            expect(findButtons()).toContain('New player/s');
        });

        it('add player button when permitted and editing side', async () => {
            await renderComponent(
                containerProps.build(),
                props(sideWithPlayer),
                [team],
                user({ managePlayers: true }),
            );

            expect(findButtons()).toContain('New player/s');
        });

        it('no add player button when not permitted', async () => {
            await renderComponent(
                containerProps.build(),
                props(teamSide),
                [team],
                user({}),
            );

            expect(findButtons()).not.toContain('Add player');
        });

        it('no add player button when permitted and team side', async () => {
            await renderComponent(
                containerProps.build(),
                props(teamSide),
                [team],
                user({}),
            );

            expect(findButtons()).not.toContain('Add player');
        });
    });

    describe('interactivity', () => {
        const team: TeamDto = teamBuilder('TEAM')
            .forSeason(season, division.id, [player, anotherPlayer])
            .build();
        const teamSide = sideBuilder('SIDE NAME').teamId(team.id).build();
        const otherDivisionTournament: TournamentGameDto = tournamentBuilder()
            .forDivision(divisionBuilder('DIVISION').build())
            .build();
        const singlesTournament: TournamentGameDto = tournamentBuilder()
            .forDivision(divisionBuilder('DIVISION').build())
            .withSide((s) => s.name('PLAYER').withPlayer(player))
            .build();
        const teamTournament: TournamentGameDto = tournamentBuilder()
            .forDivision(divisionBuilder('DIVISION').build())
            .withSide((s) => s.name('TEAM').teamId(team.id))
            .build();
        const noSidesTournamentData: TournamentGameDto = tournamentBuilder()
            .forDivision(tournamentData.divisionId)
            .build();

        it('can change side name', async () => {
            await renderComponent(
                containerProps.build(),
                props(sideWithPlayer),
                [team],
            );

            await doChange(
                context.container,
                'input[name="name"]',
                'NEW NAME',
                context.user,
            );

            reportedError.verifyNoError();
            expect(updatedData).toEqual(equatableUpdate('NEW NAME'));
        });

        it('can change noShow', async () => {
            await renderComponent(
                containerProps.build(),
                props(sideWithPlayer),
                [team],
            );

            await doClick(context.container, 'input[name="noShow"]');

            reportedError.verifyNoError();
            expect(updatedData).toEqual(
                equatableUpdate('SIDE NAME', undefined, {
                    noShow: true,
                }),
            );
        });

        it('can change team id', async () => {
            const side: TournamentSideDto = sideBuilder().build();
            const anotherTeam: TeamDto = teamBuilder('ANOTHER TEAM')
                .forSeason(season, division.id)
                .build();
            const teamTournamentData: TournamentGameDto = tournamentBuilder()
                .forDivision(division)
                .withSide((s) => s.name('ANOTHER SIDE').teamId(anotherTeam.id))
                .build();
            await renderComponent(
                containerProps.withTournament(teamTournamentData).build(),
                props(side),
                [team, anotherTeam],
            );

            await doSelectOption(teamDropdown(), 'TEAM');

            reportedError.verifyNoError();
            expect(updatedData).toEqual(
                equatableUpdate('TEAM', [], { id: side.id, teamId: team.id }),
            );
        });

        it('can unset team id', async () => {
            const anotherTeam: TeamDto = teamBuilder('ANOTHER TEAM')
                .forSeason(season, division.id)
                .build();
            const teamTournamentData: TournamentGameDto = tournamentBuilder()
                .forDivision(division)
                .withSide((s) => s.name('ANOTHER SIDE').teamId(anotherTeam.id))
                .build();
            await renderComponent(
                containerProps.withTournament(teamTournamentData).build(),
                props(teamSide),
                [team, anotherTeam],
            );

            await doSelectOption(teamDropdown(), 'Select team');

            reportedError.verifyNoError();
            expect(updatedData).toEqual(equatableUpdate('SIDE NAME', []));
        });

        it('can select player', async () => {
            const side: TournamentSideDto = sideBuilder('').build();
            await renderComponent(containerProps.build(), props(side), [team]);
            const players = playerItems();

            await doClick(players.filter((p) => p.textContent === 'PLAYER')[0]);

            reportedError.verifyNoError();
            expect(updatedData).toEqual(
                equatableUpdate('PLAYER', [equatablePlayer(player)]),
            );
        });

        it('sets side name to player name when player selected for new side', async () => {
            const side: TournamentSideDto = sideBuilder().build();
            await renderComponent(containerProps.build(), props(side), [team]);
            const players = playerItems();

            await doClick(players.filter((p) => p.textContent === 'PLAYER')[0]);

            reportedError.verifyNoError();
            expect(updatedData).toEqual(
                equatableUpdate('PLAYER', [equatablePlayer(player)]),
            );
        });

        it('can select player and team name does not change', async () => {
            const side = sideBuilder('OTHER NAME').build();
            await renderComponent(containerProps.build(), props(side), [team]);
            const players = playerItems();

            await doClick(players.filter((p) => p.textContent === 'PLAYER')[0]);

            reportedError.verifyNoError();
            expect(updatedData).toEqual(
                equatableUpdate('OTHER NAME', [equatablePlayer(player)]),
            );
        });

        it('can select another player', async () => {
            const sideWithPlayerName = sideBuilder('PLAYER')
                .withPlayer(player)
                .build();
            await renderComponent(
                containerProps.withTournament(noSidesTournamentData).build(),
                props(sideWithPlayerName),
                [team],
            );
            const players = playerItems();

            await doClick(
                players.filter((p) => p.textContent === 'ANOTHER PLAYER')[0],
            );

            reportedError.verifyNoError();
            expect(updatedData).toEqual(
                equatableUpdate('ANOTHER PLAYER, PLAYER', [
                    equatablePlayer(anotherPlayer),
                    equatablePlayer(player),
                ]),
            );
        });

        it('can select another player and team name does not change', async () => {
            await renderComponent(
                containerProps.withTournament(noSidesTournamentData).build(),
                props(sideWithPlayer),
                [team],
            );
            const players = playerItems();

            await doClick(
                players.filter((p) => p.textContent === 'ANOTHER PLAYER')[0],
            );

            reportedError.verifyNoError();
            expect(updatedData).toEqual(
                equatableUpdate('SIDE NAME', [
                    equatablePlayer(player),
                    equatablePlayer(anotherPlayer),
                ]),
            );
        });

        it('can deselect player', async () => {
            const side = sideBuilder('ANOTHER PLAYER, PLAYER')
                .withPlayer(player)
                .withPlayer(anotherPlayer)
                .build();
            await renderComponent(
                containerProps.withTournament(noSidesTournamentData).build(),
                props(side),
                [team],
            );
            const players = playerItems();

            await doClick(
                players.filter((p) => p.textContent === 'ANOTHER PLAYER')[0],
            );

            reportedError.verifyNoError();
            expect(updatedData).toEqual(equatableUpdate('PLAYER', [player]));
        });

        it('can delete side', async () => {
            await renderComponent(
                containerProps.build(),
                props(sideWithPlayer),
                [team],
            );
            context.prompts.respondToConfirm(
                'Are you sure you want to remove SIDE NAME?',
                true,
            );

            await doClick(findButton(context.container, 'Delete side'));

            reportedError.verifyNoError();
            context.prompts.confirmWasShown(
                'Are you sure you want to remove SIDE NAME?',
            );
            expect(deleted).toEqual(true);
        });

        it('does not delete side when rejected', async () => {
            await renderComponent(
                containerProps.build(),
                props(sideWithPlayer),
                [team],
            );
            context.prompts.respondToConfirm(
                'Are you sure you want to remove SIDE NAME?',
                false,
            );

            await doClick(findButton(context.container, 'Delete side'));

            reportedError.verifyNoError();
            context.prompts.confirmWasShown(
                'Are you sure you want to remove SIDE NAME?',
            );
            expect(deleted).toEqual(false);
        });

        it('cannot save side if no name', async () => {
            const side = sideBuilder('').teamId(team.id).build();
            await renderComponent(containerProps.build(), props(side), [team]);

            await doClick(findButton(context.container, 'Update'));

            reportedError.verifyNoError();
            context.prompts.alertWasShown('Please enter a name for this side');
            expect(applied).toEqual(false);
        });

        it('can save side when no teamId and no players', async () => {
            const side: TournamentSideDto = sideBuilder('NAME').build();
            await renderComponent(containerProps.build(), props(side), [team]);

            await doClick(findButton(context.container, 'Update'));

            reportedError.verifyNoError();
            expect(applied).toEqual(true);
        });

        it('can save side', async () => {
            await renderComponent(
                containerProps.build(),
                props(sideWithPlayer),
                [team],
            );

            await doClick(findButton(context.container, 'Update'));

            reportedError.verifyNoError();
            expect(applied).toEqual(true);
            expect(applyOptions).toEqual({
                addAsIndividuals: false,
            });
        });

        it('can close', async () => {
            await renderComponent(
                containerProps.build(),
                props(sideWithPlayer),
                [team],
            );

            await doClick(findButton(context.container, 'Close'));

            reportedError.verifyNoError();
            expect(closed).toEqual(true);
            expect(applied).toEqual(false);
        });

        it('can select players that are selected in another tournament', async () => {
            const side: TournamentSideDto = sideBuilder('SIDE NAME').build();
            await renderComponent(
                containerProps
                    .withAlreadyPlaying(alreadyPlaying(player))
                    .build(),
                props(side),
                [team],
            );
            const playerItem = playerItems().filter(
                (li) =>
                    li.textContent ===
                    'PLAYER (⚠ Playing in ANOTHER TOURNAMENT)',
            )[0];
            expect(playerItem.className).not.toContain('disabled');

            await doClick(playerItem);

            reportedError.verifyNoError();
            expect(updatedData).toEqual(
                equatableUpdate('SIDE NAME', [equatablePlayer(player)]),
            );
        });

        it('cannot select players that are selected in another side', async () => {
            const side: TournamentSideDto = sideBuilder('SIDE NAME').build();
            await renderComponent(containerProps.build(), props(side), [team]);
            const playerItem = playerItems().filter(
                (li) =>
                    li.textContent ===
                    'ANOTHER PLAYER (🚫 Selected in "ANOTHER SIDE")',
            )[0];
            expect(playerItem.className).toContain('disabled');

            await doClick(playerItem);

            reportedError.verifyNoError();
            expect(updatedData).toBeNull();
        });

        it('can open add player dialog', async () => {
            await renderComponent(
                containerProps.withAlreadyPlaying({}).build(),
                props(sideWithPlayer),
                [team],
                user({ managePlayers: true }),
            );

            await doClick(findButton(context.container, 'New player/s'));

            expect(findDialog('Add a player...')).toBeTruthy();
        });

        it('can close add player dialog', async () => {
            await renderComponent(
                containerProps.build(),
                props(sideWithPlayer),
                [team],
                user({ managePlayers: true }),
            );
            await doClick(findButton(context.container, 'New player/s'));

            await doClick(findButton(findDialog('Add a player...'), 'Cancel'));

            expect(findDialog('Add a player...')).toBeFalsy();
        });

        it('can add player', async () => {
            await renderComponent(
                containerProps.build(),
                props(sideWithPlayer),
                [team],
                user({ managePlayers: true }),
            );
            await doClick(findButton(context.container, 'New player/s'));
            const dialog = findDialog('Add a player...');

            await doChange(dialog, 'input[name="name"]', 'NAME', context.user);
            await doSelectOption(teamDropdown(), team.name);
            await doClick(findButton(dialog, 'Add player'));

            expect(createdPlayer).not.toBeNull();
            expect(updatedData!.players).toEqual([
                player,
                newPlayer('NAME', division.id),
            ]);
        });

        it('can add player to multi-division tournament', async () => {
            const multiDivisionTournament: TournamentGameDto =
                tournamentBuilder()
                    .withSide((s) =>
                        s.name('ANOTHER SIDE').withPlayer(anotherPlayer),
                    )
                    .build();
            divisions = [division];
            await renderComponent(
                containerProps.withTournament(multiDivisionTournament).build(),
                props(sideWithPlayer),
                [team],
                user({ managePlayers: true }),
            );
            await doClick(findButton(context.container, 'New player/s'));
            const dialog = findDialog('Add a player...');

            await doChange(dialog, 'input[name="name"]', 'NAME', context.user);
            await doSelectOption(teamDropdown(), team.name);
            await doClick(findButton(dialog, 'Add player'));

            expect(createdPlayer).not.toBeNull();
            expect(updatedData!.players).toEqual([
                player,
                newPlayer('NAME', division.id),
            ]);
        });

        it('selects newly created player', async () => {
            await renderComponent(
                containerProps.build(),
                props(sideWithPlayer),
                [team],
                user({ managePlayers: true }),
            );
            await doClick(findButton(context.container, 'New player/s'));
            const dialog = findDialog('Add a player...');

            await doChange(dialog, 'input[name="name"]', 'NAME', context.user);
            await doSelectOption(teamDropdown(), team.name);
            await doClick(findButton(dialog, 'Add player'));

            reportedError.verifyNoError();
            expect(updatedData).toEqual(
                equatableUpdate(
                    'SIDE NAME',
                    [player, newPlayer('NAME', tournamentData.divisionId)],
                    { id: sideWithPlayer.id },
                ),
            );
        });

        it('reloads teams after player added', async () => {
            await renderComponent(
                containerProps.build(),
                props(sideWithPlayer),
                [team],
                user({ managePlayers: true }),
            );
            await doClick(findButton(context.container, 'New player/s'));
            const dialog = findDialog('Add a player...');

            await doChange(dialog, 'input[name="name"]', 'NAME', context.user);
            await doSelectOption(teamDropdown(), team.name);
            await doClick(findButton(dialog, 'Add player'));

            expect(teamsReloaded).toEqual(true);
        });

        it('closes dialog after adding a player', async () => {
            await renderComponent(
                containerProps.build(),
                props(sideWithPlayer),
                [team],
                user({ managePlayers: true }),
            );
            await doClick(findButton(context.container, 'New player/s'));
            const dialog = findDialog('Add a player...');

            await doChange(dialog, 'input[name="name"]', 'NAME', context.user);
            await doSelectOption(teamDropdown(), team.name);
            await doClick(findButton(dialog, 'Add player'));

            expect(findDialog('Add a player...')).toBeFalsy();
        });

        it('can select team when no other sides', async () => {
            await renderComponent(
                containerProps
                    .withTournament(otherDivisionTournament)
                    .withAlreadyPlaying(alreadyPlaying(player))
                    .build(),
                props(teamSide),
                [team],
            );

            expect(teamDropdown()).toBeTruthy();
        });

        it('can select players when no other sides', async () => {
            await renderComponent(
                containerProps
                    .withTournament(otherDivisionTournament)
                    .withAlreadyPlaying(alreadyPlaying(player))
                    .build(),
                props(sideWithPlayer),
                [team],
            );

            expect(context.container.querySelector('.list-group')).toBeTruthy();
        });

        it('can select team when other sides are teams', async () => {
            await renderComponent(
                containerProps
                    .withTournament(teamTournament)
                    .withAlreadyPlaying(alreadyPlaying(player))
                    .build(),
                props(teamSide),
                [team],
            );

            expect(teamDropdown()).toBeTruthy();
        });

        it('can select players when other sides are players', async () => {
            await renderComponent(
                containerProps
                    .withTournament(singlesTournament)
                    .withAlreadyPlaying(alreadyPlaying(player))
                    .build(),
                props(sideWithPlayer),
                [team],
            );

            expect(context.container.querySelector('.list-group')).toBeTruthy();
        });

        it('cannot select team when other sides are players', async () => {
            await renderComponent(
                containerProps
                    .withTournament(singlesTournament)
                    .withAlreadyPlaying(alreadyPlaying(player))
                    .build(),
                props(sideWithPlayer),
                [team],
            );

            expect(teamDropdown()).toBeFalsy();
        });

        it('cannot select team when other sides are teams', async () => {
            await renderComponent(
                containerProps
                    .withTournament(teamTournament)
                    .withAlreadyPlaying(alreadyPlaying(player))
                    .build(),
                props(sideWithPlayer),
                [team],
            );

            expect(context.container.querySelector('.list-group')).toBeFalsy();
        });
    });
});
