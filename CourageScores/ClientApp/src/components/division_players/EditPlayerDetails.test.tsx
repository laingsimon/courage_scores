import {
    cleanUp,
    doClick,
    doSelectOption,
    findButton,
    renderApp,
    doChange,
    TestContext,
    iocProps, brandingProps, appProps, ErrorState, api
} from "../../helpers/tests";
import {createTemporaryId} from "../../helpers/projection";
import {EditPlayerDetails, IEditPlayerDetailsProps} from "./EditPlayerDetails";
import {EditTeamPlayerDto} from "../../interfaces/models/dtos/Team/EditTeamPlayerDto";
import {DivisionDto} from "../../interfaces/models/dtos/DivisionDto";
import {TeamDto} from "../../interfaces/models/dtos/Team/TeamDto";
import {SeasonDto} from "../../interfaces/models/dtos/Season/SeasonDto";
import {TeamPlayerDto} from "../../interfaces/models/dtos/Team/TeamPlayerDto";
import {IClientActionResultDto} from "../common/IClientActionResultDto";
import {divisionBuilder} from "../../helpers/builders/divisions";
import {seasonBuilder} from "../../helpers/builders/seasons";
import {teamBuilder} from "../../helpers/builders/teams";
import {playerBuilder} from "../../helpers/builders/players";
import {IPlayerApi} from "../../interfaces/apis/IPlayerApi";
import {TeamSeasonDto} from "../../interfaces/models/dtos/Team/TeamSeasonDto";

describe('EditPlayerDetails', () => {
    let context: TestContext;
    let reportedError: ErrorState;
    let createdPlayers: {divisionId: string, seasonId: string, teamId: string, playerDetails: EditTeamPlayerDto}[];
    let updatedPlayer: {seasonId: string, teamId: string, playerId: string, playerDetails: EditTeamPlayerDto};
    let saved: {result: TeamDto, newPlayers: TeamPlayerDto[] | null};
    let change: {name: string, value: string};
    let canceled: boolean;
    let apiResponse: () => IClientActionResultDto<TeamDto>;
    let cumulativeCreatedPlayers: EditTeamPlayerDto[];

    const playerApi = api<IPlayerApi>({
        create: async (divisionId: string, seasonId: string, teamId: string, playerDetails: EditTeamPlayerDto): Promise<IClientActionResultDto<TeamDto>> => {
            createdPlayers.push({divisionId, seasonId, teamId, playerDetails});
            cumulativeCreatedPlayers.push(playerDetails);

            const teamPlayer: TeamPlayerDto = playerDetails as TeamPlayerDto;
            teamPlayer.id = createTemporaryId();

            return apiResponse ? apiResponse() : {
                success: true,
                result: {
                    id: teamId,
                    seasons: [{
                        seasonId: seasonId,
                        players: cumulativeCreatedPlayers as TeamPlayerDto[],
                    }],
                    name: '',
                    address: '',
                }
            };
        },
        update: async (seasonId: string, teamId: string, playerId: string, playerDetails: EditTeamPlayerDto): Promise<IClientActionResultDto<TeamDto>> => {
            updatedPlayer = {seasonId, teamId, playerId, playerDetails};
            return apiResponse ? apiResponse() : {success: true};
        }
    });

    async function onSaved(result: TeamDto, newPlayers: TeamPlayerDto[] | null) {
        saved = { result, newPlayers };
    }

    async function onChange(name: string, value: string) {
        change = {name, value};
    }

    async function onCancel() {
        canceled = true;
    }

    afterEach(() => {
        cleanUp(context);
    });

    beforeEach(() => {
        reportedError = new ErrorState();
        updatedPlayer = null;
        createdPlayers = [];
        apiResponse = null;
        saved = null;
        change = null;
        canceled = false;
        cumulativeCreatedPlayers = [];
    });

    async function renderComponent(props: IEditPlayerDetailsProps, teams: TeamDto[], divisions: DivisionDto[]) {
        context = await renderApp(
            iocProps({playerApi}),
            brandingProps(),
            appProps({
                teams: teams || [],
                divisions: divisions || []
            }, reportedError),
            (<EditPlayerDetails {...props} onSaved={onSaved} onChange={onChange} onCancel={onCancel}/>));
    }

    function findInput(name: string): HTMLInputElement {
        const input = context.container.querySelector(`input[name="${name}"]`) as HTMLInputElement;
        expect(input).toBeTruthy();
        return input;
    }

    function findNewTeamDropdown() {
        return context.container.querySelector('div[datatype="team-selection-team"] .dropdown-menu');
    }

    describe('renders', () => {
        const division: DivisionDto = divisionBuilder('DIVISION').build();
        const season: SeasonDto = seasonBuilder('SEASON')
            .withDivision(division)
            .build();
        const team: TeamDto = teamBuilder('TEAM')
            .forSeason(season, division)
            .build();

        it('existing player details', async () => {
            await renderComponent({
                player: playerBuilder('NAME').captain().email('EMAIL').build(),
                seasonId: season.id,
                team: team,
                gameId: null,
                newTeamId: null,
                divisionId: division.id,
                onCancel,
                onSaved,
                onChange,
            }, [team], [division]);

            reportedError.verifyNoError();
            expect(findInput('name').value).toEqual('NAME');
            expect(findInput('emailAddress').value).toEqual('EMAIL');
            expect(findInput('captain').checked).toEqual(true);
            expect(findNewTeamDropdown().querySelector('.dropdown-item.active')).toBeTruthy();
            expect(findNewTeamDropdown().querySelector('.dropdown-item.active').textContent).toEqual('TEAM');
        });

        it('new player details', async () => {
            await renderComponent({
                player: playerBuilder('NAME').noId().captain().email('EMAIL').build(),
                seasonId: season.id,
                team: team,
                gameId: null,
                newTeamId: null,
                divisionId: division.id,
                onCancel,
                onSaved,
                onChange,
            }, [team], [division]);

            reportedError.verifyNoError();
            expect(findInput('name').value).toEqual('NAME');
            expect(findInput('emailAddress').value).toEqual('EMAIL');
            expect(findInput('captain').checked).toEqual(true);
            expect(findNewTeamDropdown().querySelector('.dropdown-item.active')).toBeTruthy();
            expect(findNewTeamDropdown().querySelector('.dropdown-item.active').textContent).toEqual('TEAM');
        });

        it('new player details with no division id', async () => {
            await renderComponent({
                player: playerBuilder('NAME').noId().captain().email('EMAIL').build(),
                seasonId: season.id,
                team: team,
                gameId: null,
                newTeamId: null,
                divisionId: null,
                onCancel,
                onSaved,
                onChange,
            }, [team], [division]);

            reportedError.verifyNoError();
            expect(findInput('name').value).toEqual('NAME');
            expect(findInput('emailAddress').value).toEqual('EMAIL');
            expect(findInput('captain').checked).toEqual(true);
            expect(findNewTeamDropdown().querySelector('.dropdown-item.active')).toBeTruthy();
            expect(findNewTeamDropdown().querySelector('.dropdown-item.active').textContent).toEqual('TEAM');
        });

        it('excludes teams where not selected for current season', async () => {
            const differentSeasonTeam = teamBuilder('OTHER SEASON')
                .forSeason(createTemporaryId(), division)
                .build();

            await renderComponent({
                player: playerBuilder('NAME').noId().captain().email('EMAIL').build(),
                seasonId: season.id,
                team: team,
                gameId: null,
                newTeamId: null,
                divisionId: division.id,
                onCancel,
                onSaved,
                onChange,
            }, [team, differentSeasonTeam], [division]);

            const items = Array.from(findNewTeamDropdown().querySelectorAll('.dropdown-item'));
            expect(items.map(i => i.textContent)).toEqual([ 'Select team', 'TEAM' ]);
        });

        it('excludes teams where not deleted for current season', async () => {
            const differentSeasonTeam = teamBuilder('DELETED TEAM')
                .forSeason(season, division, null, true)
                .build();

            await renderComponent({
                player: playerBuilder('NAME').noId().captain().email('EMAIL').build(),
                seasonId: season.id,
                team: team,
                gameId: null,
                newTeamId: null,
                divisionId: division.id,
                onCancel,
                onSaved,
                onChange,
            }, [team, differentSeasonTeam], [division]);

            const items = Array.from(findNewTeamDropdown().querySelectorAll('.dropdown-item'));
            expect(items.map(i => i.textContent)).toEqual([ 'Select team', 'TEAM' ]);
        });

        it('multi-add for new player', async () => {
            await renderComponent({
                player: playerBuilder('NAME').noId().captain().email('EMAIL').build(),
                seasonId: season.id,
                team: team,
                gameId: null,
                newTeamId: null,
                divisionId: division.id,
                onCancel,
                onSaved,
                onChange,
            }, [team], [division]);
            reportedError.verifyNoError();

            const multiAdd = context.container.querySelector('input[name="multiple"]');
            expect(multiAdd).toBeTruthy();
        });

        it('without multi-add for existing player', async () => {
            await renderComponent({
                player: playerBuilder('NAME').captain().email('EMAIL').build(),
                seasonId: season.id,
                team: team,
                gameId: null,
                newTeamId: null,
                divisionId: division.id,
                onCancel,
                onSaved,
                onChange,
            }, [team], [division]);
            reportedError.verifyNoError();

            const multiAdd = context.container.querySelector('input[name="multiple"]');
            expect(multiAdd).toBeFalsy();
        });
    });

    describe('interactivity', () => {
        const division: DivisionDto = divisionBuilder('DIVISION').build();
        const otherDivision: DivisionDto = divisionBuilder('OTHER DIVISION').build();
        const season: SeasonDto = seasonBuilder('SEASON')
            .withDivision(division)
            .build();
        const team: TeamDto = teamBuilder('TEAM')
            .forSeason(season, division)
            .build();
        const otherTeam: TeamDto = teamBuilder('OTHER TEAM')
            .forSeason(season, division)
            .build();
        let alert: string;
        let response = false;
        window.confirm = () => {
            return response
        };
        window.alert = (message) => {
            alert = message
        };

        beforeEach(() => {
            alert = null;
        });

        it('can change team for new player', async () => {
            await renderComponent({
                player: playerBuilder('NAME').noId().captain().email('EMAIL').build(),
                seasonId: season.id,
                team: team,
                gameId: null,
                newTeamId: null,
                divisionId: division.id,
                onCancel,
                onSaved,
                onChange,
            }, [team, otherTeam], [division, otherDivision]);
            reportedError.verifyNoError();
            expect(findNewTeamDropdown().querySelector('.dropdown-item.active')).toBeTruthy();

            await doSelectOption(findNewTeamDropdown(), 'OTHER TEAM');

            expect(change).not.toBeNull();
            expect(change.name).toEqual('teamId');
            expect(change.value).toEqual(otherTeam.id);
        });

        it('can change team for existing player', async () => {
            await renderComponent({
                player: playerBuilder('NAME').captain().email('EMAIL').build(),
                seasonId: season.id,
                team: team,
                gameId: null,
                newTeamId: null,
                divisionId: division.id,
                onCancel,
                onSaved,
                onChange,
            }, [team, otherTeam], [division, otherDivision]);
            reportedError.verifyNoError();
            expect(findNewTeamDropdown().querySelector('.dropdown-item.active')).toBeTruthy();

            await doSelectOption(findNewTeamDropdown(), 'OTHER TEAM');

            expect(change).not.toBeNull();
            expect(change.name).toEqual('newTeamId');
            expect(change.value).toEqual(otherTeam.id);
        });

        it('can change to multi-add for new player', async () => {
            await renderComponent({
                player: playerBuilder('NAME').noId().captain().email('EMAIL').build(),
                seasonId: season.id,
                team: team,
                gameId: null,
                newTeamId: null,
                divisionId: division.id,
                onCancel,
                onSaved,
                onChange,
            }, [team, otherTeam], [division, otherDivision]);
            reportedError.verifyNoError();

            await doClick(context.container, 'input[name="multiple"]');

            const name = context.container.querySelector('textarea');
            expect(name.value).toEqual('NAME');
            expect(context.container.querySelector('input[name="captain"]')).toBeFalsy();
            expect(context.container.querySelector('input[name="emailAddress"]')).toBeFalsy();
        });

        it('can change back to single-add for new player', async () => {
            await renderComponent({
                player: playerBuilder('NAME').noId().captain().email('EMAIL').build(),
                seasonId: season.id,
                team: team,
                gameId: null,
                newTeamId: null,
                divisionId: division.id,
                onCancel,
                onSaved,
                onChange,
            }, [team, otherTeam], [division, otherDivision]);
            reportedError.verifyNoError();
            await doClick(context.container, 'input[name="multiple"]');
            await doChange(context.container, 'textarea', 'NAME 1\nNAME 2', context.user);

            await doClick(context.container, 'input[name="multiple"]');

            expect(change.name).toEqual('name');
            expect(change.value).toEqual('');
            expect(context.container.querySelector('input[name="captain"]')).toBeTruthy();
            expect(context.container.querySelector('input[name="emailAddress"]')).toBeTruthy();
        });

        it('can change captaincy', async () => {
            await renderComponent({
                player: playerBuilder('NAME').captain().email('EMAIL').build(),
                seasonId: season.id,
                team: team,
                gameId: null,
                newTeamId: null,
                divisionId: division.id,
                onCancel,
                onSaved,
                onChange,
            }, [team, otherTeam], [division, otherDivision]);
            reportedError.verifyNoError();

            await doClick(findInput('captain'));

            expect(change).not.toBeNull();
            expect(change.name).toEqual('captain');
            expect(change.value).toEqual(false);
        });

        it('requires team to be selected', async () => {
            await renderComponent({
                player: playerBuilder('NAME').noId().captain().email('EMAIL').build(),
                seasonId: season.id,
                team: null,
                gameId: null,
                newTeamId: null,
                divisionId: division.id,
                onCancel,
                onSaved,
                onChange,
            }, [team, otherTeam], [division, otherDivision]);
            reportedError.verifyNoError();

            await doClick(findButton(context.container, 'Add player'));

            expect(alert).toEqual('Please select a team');
        });

        it('requires name to be entered', async () => {
            await renderComponent({
                player: playerBuilder('').noId().captain().email('EMAIL').build(),
                seasonId: season.id,
                team: team,
                gameId: null,
                newTeamId: null,
                divisionId: division.id,
                onCancel,
                onSaved,
                onChange,
            }, [team, otherTeam], [division, otherDivision]);
            reportedError.verifyNoError();

            await doClick(findButton(context.container, 'Add player'));

            expect(alert).toEqual('Please enter a name');
        });

        it('creates new player', async () => {
            await renderComponent({
                player: playerBuilder('NAME').noId().captain().email('EMAIL').build(),
                seasonId: season.id,
                team: team,
                gameId: null,
                newTeamId: null,
                divisionId: division.id,
                onCancel,
                onSaved,
                onChange,
            }, [team, otherTeam], [division, otherDivision]);
            reportedError.verifyNoError();

            await doClick(findButton(context.container, 'Add player'));

            expect(createdPlayers.length).toEqual(1);
            const createdPlayer = createdPlayers[0];
            expect(createdPlayer.seasonId).toEqual(season.id);
            expect(createdPlayer.teamId).toEqual(team.id);
            expect(createdPlayer.playerDetails.name).toEqual('NAME');
            expect(createdPlayer.playerDetails.emailAddress).toEqual('EMAIL');
            expect(createdPlayer.playerDetails.captain).toEqual(true);
            expect(createdPlayer.playerDetails.newTeamId).toEqual(null);
        });

        it('identifies new player', async () => {
            await renderComponent({
                player: playerBuilder('NAME').noId().captain().email('EMAIL').build(),
                seasonId: season.id,
                team: team,
                gameId: null,
                newTeamId: null,
                divisionId: division.id,
                onCancel,
                onSaved,
                onChange,
            }, [team, otherTeam], [division, otherDivision]);
            reportedError.verifyNoError();

            await doClick(findButton(context.container, 'Add player'));

            reportedError.verifyNoError();
            expect(saved).not.toBeNull();
            expect(saved.newPlayers).toEqual([{
                name: 'NAME',
                captain: true,
                emailAddress: 'EMAIL',
                id: expect.any(String),
                newTeamId: null,
            }]);
        });

        it('identifies new player ignoring deleted team seasons', async () => {
            const deletedPlayer = playerBuilder('NAME').build();
            const teamWithDeletedSeason: TeamDto = teamBuilder('TEAM WITH DELETED SEASON')
                .forSeason(season, division, [deletedPlayer], true)
                .forSeason(season, division)
                .build();
            await renderComponent({
                player: playerBuilder('NAME').noId().captain().email('EMAIL').build(),
                seasonId: season.id,
                team: teamWithDeletedSeason,
                gameId: null,
                newTeamId: null,
                divisionId: division.id,
                onCancel,
                onSaved,
                onChange,
            }, [teamWithDeletedSeason, otherTeam], [division, otherDivision]);
            reportedError.verifyNoError();
            apiResponse = () => {
                return {
                    success: true,
                    result: {
                        id: teamWithDeletedSeason.id,
                        seasons: teamWithDeletedSeason.seasons.map((ts: TeamSeasonDto) => {
                            if (ts.deleted) {
                                return ts;
                            }

                            const newTeamSeason: TeamSeasonDto = Object.assign({}, ts);
                            cumulativeCreatedPlayers.forEach((p: EditTeamPlayerDto) => {
                                return newTeamSeason.players = ts.players.concat(p as TeamPlayerDto);
                            });
                            return newTeamSeason;
                        }),
                        name: teamWithDeletedSeason.name,
                        address: teamWithDeletedSeason.address,
                    }
                };
            };

            await doClick(findButton(context.container, 'Add player'));

            reportedError.verifyNoError();
            expect(saved).not.toBeNull();
            expect(saved.newPlayers).toEqual([{
                name: 'NAME',
                captain: true,
                emailAddress: 'EMAIL',
                id: expect.any(String),
                newTeamId: null,
            }]);
            expect(saved.newPlayers[0].id).not.toEqual(deletedPlayer.id);
        });

        it('creates multiple players', async () => {
            await renderComponent({
                player: playerBuilder('NAME 1\nNAME 2').noId().build(),
                seasonId: season.id,
                team: team,
                gameId: null,
                newTeamId: null,
                divisionId: division.id,
                onCancel,
                onSaved,
                onChange,
            }, [team, otherTeam], [division, otherDivision]);
            reportedError.verifyNoError();
            await doClick(context.container, 'input[name="multiple"]');

            await doClick(findButton(context.container, 'Add players'));

            expect(createdPlayers.length).toEqual(2);
            const createdPlayer1 = createdPlayers[0];
            const createdPlayer2 = createdPlayers[1];
            expect(createdPlayer1.seasonId).toEqual(season.id);
            expect(createdPlayer1.teamId).toEqual(team.id);
            expect(createdPlayer1.playerDetails.name).toEqual('NAME 1');
            expect(createdPlayer1.playerDetails.newTeamId).toEqual(null);
            expect(createdPlayer1.playerDetails.captain).toEqual(false);
            expect(createdPlayer2.seasonId).toEqual(season.id);
            expect(createdPlayer2.teamId).toEqual(team.id);
            expect(createdPlayer2.playerDetails.name).toEqual('NAME 2');
            expect(createdPlayer2.playerDetails.newTeamId).toEqual(null);
            expect(createdPlayer2.playerDetails.captain).toEqual(false);
        });

        it('identifies created players', async () => {
            await renderComponent({
                player: playerBuilder('NAME 1\nNAME 2').noId().build(),
                seasonId: season.id,
                team: team,
                gameId: null,
                newTeamId: null,
                divisionId: division.id,
                onCancel,
                onSaved,
                onChange,
            }, [team, otherTeam], [division, otherDivision]);
            reportedError.verifyNoError();
            await doClick(context.container, 'input[name="multiple"]');

            await doClick(findButton(context.container, 'Add players'));

            reportedError.verifyNoError();
            expect(saved).not.toBeNull();
            expect(saved.newPlayers).toEqual([{
                id: expect.any(String),
                captain: false,
                name: 'NAME 1',
                newTeamId: null,
                emailAddress: null,
            }, {
                id: expect.any(String),
                captain: false,
                name: 'NAME 2',
                newTeamId: null,
                emailAddress: null,
            }])
        });

        it('updates existing player', async () => {
            const playerId = createTemporaryId();
            await renderComponent({
                player: playerBuilder('NAME', playerId).captain().email('EMAIL').build(),
                seasonId: season.id,
                team: team,
                gameId: null,
                newTeamId: otherTeam.id,
                divisionId: division.id,
                onCancel,
                onSaved,
                onChange,
            }, [team, otherTeam], [division, otherDivision]);
            reportedError.verifyNoError();

            await doClick(findButton(context.container, 'Save player'));

            reportedError.verifyNoError();
            expect(updatedPlayer).not.toBeNull();
            expect(updatedPlayer.playerId).toEqual(playerId);
            expect(updatedPlayer.seasonId).toEqual(season.id);
            expect(updatedPlayer.teamId).toEqual(team.id);
            expect(updatedPlayer.playerDetails.gameId).toBeFalsy();
            expect(updatedPlayer.playerDetails.name).toEqual('NAME');
            expect(updatedPlayer.playerDetails.emailAddress).toEqual('EMAIL');
            expect(updatedPlayer.playerDetails.captain).toEqual(true);
            expect(updatedPlayer.playerDetails.newTeamId).toEqual(otherTeam.id);
            expect(saved).not.toBeNull();
            expect(saved.newPlayers).toBeNull();
        });

        it('updates existing player in given game', async () => {
            const playerId = createTemporaryId();
            const gameId = createTemporaryId();
            await renderComponent({
                player: playerBuilder('NAME', playerId).captain().email('EMAIL').build(),
                seasonId: season.id,
                team: team,
                gameId: gameId,
                newTeamId: otherTeam.id,
                divisionId: division.id,
                onCancel,
                onSaved,
                onChange,
            }, [team, otherTeam], [division, otherDivision]);
            reportedError.verifyNoError();

            await doClick(findButton(context.container, 'Save player'));

            reportedError.verifyNoError();
            expect(updatedPlayer).not.toBeNull();
            expect(updatedPlayer.playerId).toEqual(playerId);
            expect(updatedPlayer.seasonId).toEqual(season.id);
            expect(updatedPlayer.teamId).toEqual(team.id);
            expect(updatedPlayer.playerDetails.gameId).toEqual(gameId);
            expect(updatedPlayer.playerDetails.name).toEqual('NAME');
            expect(updatedPlayer.playerDetails.emailAddress).toEqual('EMAIL');
            expect(updatedPlayer.playerDetails.captain).toEqual(true);
            expect(updatedPlayer.playerDetails.newTeamId).toEqual(otherTeam.id);
            expect(saved).not.toBeNull();
            expect(saved.newPlayers).toBeNull();
        });

        it('handles errors during save', async () => {
            await renderComponent({
                player: playerBuilder('NAME').captain().email('EMAIL').build(),
                seasonId: season.id,
                team: team,
                gameId: null,
                newTeamId: otherTeam.id,
                divisionId: division.id,
                onCancel,
                onSaved,
                onChange,
            }, [team, otherTeam], [division, otherDivision]);
            reportedError.verifyNoError();
            apiResponse = () => { return { success: false } };

            await doClick(findButton(context.container, 'Save player'));

            expect(saved).toBeNull();
            expect(context.container.textContent).toContain('Could not save player details');
        });

        it('can close error dialog after save failure', async () => {
            await renderComponent({
                player: playerBuilder('NAME').captain().email('EMAIL').build(),
                seasonId: season.id,
                team: team,
                gameId: null,
                newTeamId: otherTeam.id,
                divisionId: division.id,
                onCancel,
                onSaved,
                onChange,
            }, [team, otherTeam], [division, otherDivision]);
            reportedError.verifyNoError();
            apiResponse = () => { return { success: false } };
            await doClick(findButton(context.container, 'Save player'));
            expect(context.container.textContent).toContain('Could not save player details');

            await doClick(findButton(context.container, 'Close'));

            expect(context.container.textContent).not.toContain('Could not save player details');
        });

        it('can cancel editing', async () => {
            await renderComponent({
                player: playerBuilder('NAME').captain().email('EMAIL').build(),
                seasonId: season.id,
                team: team,
                gameId: null,
                newTeamId: otherTeam.id,
                divisionId: division.id,
                onCancel,
                onSaved,
                onChange,
            }, [team, otherTeam], [division, otherDivision]);
            reportedError.verifyNoError();
            apiResponse = () => { return { success: false } };

            await doClick(findButton(context.container, 'Cancel'));

            expect(canceled).toEqual(true);
        });
    });
});