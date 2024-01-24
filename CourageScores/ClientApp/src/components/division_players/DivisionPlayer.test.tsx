import {
    api,
    appProps,
    brandingProps,
    cleanUp,
    doChange,
    doClick, ErrorState,
    findButton,
    iocProps,
    renderApp,
    TestContext
} from "../../helpers/tests";
import React from "react";
import {DivisionPlayer, IDivisionPlayerProps} from "./DivisionPlayer";
import {DivisionDataContainer, IDivisionDataContainerProps} from "../DivisionDataContainer";
import {createTemporaryId, EMPTY_ID} from "../../helpers/projection";
import {IEditTeamPlayerDto} from "../../interfaces/serverSide/Team/IEditTeamPlayerDto";
import {ITeamDto} from "../../interfaces/serverSide/Team/ITeamDto";
import {IUserDto} from "../../interfaces/serverSide/Identity/IUserDto";
import {IDivisionDto} from "../../interfaces/serverSide/IDivisionDto";
import {ISeasonDto} from "../../interfaces/serverSide/Season/ISeasonDto";
import {IDivisionPlayerDto} from "../../interfaces/serverSide/Division/IDivisionPlayerDto";
import {IClientActionResultDto} from "../../interfaces/IClientActionResultDto";
import {IPlayerApi} from "../../api/player";
import {divisionBuilder} from "../../helpers/builders/divisions";
import {seasonBuilder} from "../../helpers/builders/seasons";

describe('DivisionPlayer', () => {
    let context: TestContext;
    let reportedError: ErrorState;
    let teamsReloaded: boolean;
    let divisionReloaded: boolean;
    let deletedPlayer: { seasonId: string, teamId: string, playerId: string };
    let updatedPlayer: {seasonId: string, teamId: string, playerId: string, playerDetails: IEditTeamPlayerDto, lastUpdated: string};
    let apiResponse: IClientActionResultDto<ITeamDto>;
    const playerApi = api<IPlayerApi>({
        delete: async (seasonId: string, teamId: string, playerId: string): Promise<IClientActionResultDto<ITeamDto>> => {
            deletedPlayer = {seasonId, teamId, playerId};
            return apiResponse || {success: true} as any;
        },
        update: async (seasonId: string, teamId: string, playerId: string, playerDetails: IEditTeamPlayerDto, lastUpdated: string): Promise<IClientActionResultDto<ITeamDto>> => {
            updatedPlayer = {seasonId, teamId, playerId, playerDetails, lastUpdated};
            return apiResponse || {success: true} as any;
        }
    });

    afterEach(() => {
        cleanUp(context);
    });

    beforeEach(() => {
        reportedError = new ErrorState();
        teamsReloaded = false;
        divisionReloaded = false;
        deletedPlayer = null;
        updatedPlayer = null;
        apiResponse = null;
    });

    async function renderComponent(props: IDivisionPlayerProps, divisionData: IDivisionDataContainerProps, account?: IUserDto) {
        context = await renderApp(
            iocProps({playerApi}),
            brandingProps(),
            appProps({
                account,
                reloadTeams: async () => teamsReloaded = true,
                teams: [],
                divisions: [],
            }, reportedError),
            (<DivisionDataContainer {...divisionData} onReloadDivision={async () => {
                divisionReloaded = true;
                return null;
            }}>
                <DivisionPlayer {...props} />
            </DivisionDataContainer>),
            null,
            null,
            'tbody');
    }

    describe('when logged out', () => {
        const account: IUserDto = null;
        const division: IDivisionDto = divisionBuilder('DIVISION').build();
        const season: ISeasonDto = seasonBuilder('SEASON')
            .withDivision(division)
            .build();
        const player: IDivisionPlayerDto = {
            id: createTemporaryId(),
            rank: 1,
            name: 'NAME',
            team: 'TEAM',
            teamId: createTemporaryId(),
            singles: {
                matchesPlayed: 2,
                matchesWon: 3,
                matchesLost: 4,
            },
            points: 5,
            winPercentage: 6,
            oneEighties: 7,
            over100Checkouts: 8,
        };

        describe('renders', () => {
            it('with venue', async () => {
                await renderComponent({
                        player,
                        hideVenue: false
                    },
                    {id: division.id, season, name: division.name} as any,
                    account);

                expect(reportedError.hasError()).toEqual(false);
                const cells = Array.from(context.container.querySelectorAll('td'));
                expect(cells.length).toEqual(10);
                expect(cells.map(c => c.textContent)).toEqual([
                    '1',
                    'NAME',
                    'TEAM',
                    '2',
                    '3',
                    '4',
                    '5',
                    '6',
                    '7',
                    '8']);
            });

            it('captaincy marker', async () => {
                const captain = Object.assign({}, player);
                captain.captain = true;
                await renderComponent({
                        player: captain,
                        hideVenue: false
                    },
                    {id: division.id, season, name: division.name} as any,
                    account);

                expect(reportedError.hasError()).toEqual(false);
                const cells = Array.from(context.container.querySelectorAll('td'));
                expect(cells.length).toEqual(10);
                const nameCell = cells[1];
                expect(nameCell.textContent).toEqual('🤴 NAME');
            });

            it('without venue', async () => {
                await renderComponent({
                        player,
                        hideVenue: true
                    },
                    {id: division.id, season, name: division.name} as any,
                    account);

                expect(reportedError.hasError()).toEqual(false);
                const cells = Array.from(context.container.querySelectorAll('td'));
                expect(cells.length).toEqual(9);
                expect(cells.map(c => c.textContent)).toEqual([
                    '1',
                    'NAME',
                    '2',
                    '3',
                    '4',
                    '5',
                    '6',
                    '7',
                    '8']);
            });

            it('no action buttons', async () => {
                await renderComponent({
                        player,
                        hideVenue: false
                    },
                    {id: division.id, season, name: division.name} as any,
                    account);

                expect(reportedError.hasError()).toEqual(false);
                const cells = Array.from(context.container.querySelectorAll('td'));
                const playerLinkCell = cells[1];
                expect(playerLinkCell.querySelector('button')).toBeFalsy();
            });

            it('link to player details', async () => {
                await renderComponent({
                        player,
                        hideVenue: false
                    },
                    {id: division.id, season, name: division.name} as any,
                    account);

                expect(reportedError.hasError()).toEqual(false);
                const cells = Array.from(context.container.querySelectorAll('td'));
                const playerLinkCell = cells[1];
                const link = playerLinkCell.querySelector('a');
                expect(link).toBeTruthy();
                expect(link.href).toEqual(`http://localhost/division/${division.name}/player:${player.name}@${player.team}/${season.name}`);
            });

            it('link to team details', async () => {
                await renderComponent({
                        player,
                        hideVenue: false
                    },
                    {id: division.id, season, name: division.name} as any,
                    account);

                expect(reportedError.hasError()).toEqual(false);
                const cells = Array.from(context.container.querySelectorAll('td'));
                const teamLinkCell = cells[2];
                const link = teamLinkCell.querySelector('a');
                expect(link).toBeTruthy();
                expect(link.href).toEqual(`http://localhost/division/${division.name}/team:${player.team}/${season.name}`);
            });

            it('team name only if no team id', async () => {
                const noTeamPlayer = Object.assign({}, player);
                noTeamPlayer.teamId = EMPTY_ID;
                await renderComponent({
                        player: noTeamPlayer,
                        hideVenue: false
                    },
                    {id: division.id, season, name: division.name} as any,
                    account);

                expect(reportedError.hasError()).toEqual(false);
                const cells = Array.from(context.container.querySelectorAll('td'));
                const teamLinkCell = cells[2];
                const link = teamLinkCell.querySelector('a');
                expect(link).toBeFalsy();
                expect(teamLinkCell.textContent).toEqual(noTeamPlayer.team);
            });
        });
    });

    describe('when logged in', () => {
        const account: IUserDto = {
            name: '',
            givenName: '',
            emailAddress: '',
            access: {
                managePlayers: true,
            }
        };
        const division: IDivisionDto = divisionBuilder('DIVISION').build();
        const season: ISeasonDto = seasonBuilder('SEASON')
            .withDivision(division)
            .build();
        const player: IDivisionPlayerDto = {
            id: createTemporaryId(),
            rank: 1,
            name: 'NAME',
            team: 'TEAM',
            teamId: createTemporaryId(),
            singles: {
                matchesPlayed: 2,
                matchesWon: 3,
                matchesLost: 4,
            },
            points: 5,
            winPercentage: 6,
            oneEighties: 7,
            over100Checkouts: 8,
        };
        let confirm: string;
        let response: boolean = false;
        window.confirm = (message) => {
            confirm = message;
            return response
        };

        beforeEach(() => {
            confirm = null;
        });

        describe('interactivity', () => {
            it('can show edit player dialog', async () => {
                await renderComponent({
                        player,
                        hideVenue: false
                    },
                    {id: division.id, season, name: division.name} as any,
                    account);
                const nameCell = context.container.querySelector('td:nth-child(2)');
                expect(nameCell.textContent).toContain('NAME');

                await doClick(findButton(nameCell, '✏️'));

                const dialog = nameCell.querySelector('.modal-dialog');
                expect(dialog).toBeTruthy();
                expect(dialog.textContent).toContain('Edit player: NAME');
            });

            it('can close edit player dialog', async () => {
                await renderComponent({
                        player,
                        hideVenue: false
                    },
                    {id: division.id, season, name: division.name} as any,
                    account);
                const nameCell = context.container.querySelector('td:nth-child(2)');
                await doClick(findButton(nameCell, '✏️'));
                expect(nameCell.querySelector('.modal-dialog')).toBeTruthy();

                await doClick(findButton(nameCell.querySelector('.modal-dialog'), 'Cancel'));

                expect(nameCell.querySelector('.modal-dialog')).toBeFalsy();
            });

            it('prevents delete of player', async () => {
                await renderComponent({
                        player,
                        hideVenue: false
                    },
                    {id: division.id, season, name: division.name} as any,
                    account);
                const nameCell = context.container.querySelector('td:nth-child(2)');
                response = false;

                await doClick(findButton(nameCell, '🗑️'));

                expect(confirm).toEqual('Are you sure you want to delete NAME?');
                expect(deletedPlayer).toBeNull();
                expect(divisionReloaded).toEqual(false);
                expect(teamsReloaded).toEqual(false);
            });

            it('can delete player', async () => {
                await renderComponent({
                        player,
                        hideVenue: false
                    },
                    {id: division.id, season, name: division.name} as any,
                    account);
                const nameCell = context.container.querySelector('td:nth-child(2)');
                response = true;

                await doClick(findButton(nameCell, '🗑️'));

                expect(confirm).toEqual('Are you sure you want to delete NAME?');
                expect(deletedPlayer).not.toBeNull();
                expect(divisionReloaded).toEqual(true);
                expect(teamsReloaded).toEqual(true);
            });

            it('can handle error when deleting player', async () => {
                await renderComponent({
                        player,
                        hideVenue: false
                    },
                    {id: division.id, season, name: division.name} as any,
                    account);
                const nameCell = context.container.querySelector('td:nth-child(2)');
                response = true;
                apiResponse = { success: false, errors: [ 'SOME ERROR' ] } as any;

                await doClick(findButton(nameCell, '🗑️'));

                expect(deletedPlayer).not.toBeNull();
                expect(divisionReloaded).toEqual(false);
                expect(teamsReloaded).toEqual(false);
                expect(context.container.textContent).toContain('Could not delete player');
                expect(context.container.textContent).toContain('SOME ERROR');
            });

            it('can close error dialog after delete failure', async () => {
                await renderComponent({
                        player,
                        hideVenue: false
                    },
                    {id: division.id, season, name: division.name} as any,
                    account);
                const nameCell = context.container.querySelector('td:nth-child(2)');
                response = true;
                apiResponse = { success: false, errors: [ 'SOME ERROR' ] } as any;
                await doClick(findButton(nameCell, '🗑️'));
                expect(context.container.textContent).toContain('Could not delete player');

                await doClick(findButton(context.container, 'Close'));

                expect(context.container.textContent).not.toContain('Could not delete player');
            });

            it('can save player details', async () => {
                await renderComponent({
                        player,
                        hideVenue: false
                    },
                    {id: division.id, season, name: division.name} as any,
                    account);
                const nameCell = context.container.querySelector('td:nth-child(2)');
                await doClick(findButton(nameCell, '✏️'));
                const dialog = nameCell.querySelector('.modal-dialog');
                await doChange(dialog, 'input[name="name"]', 'NEW NAME', context.user);

                await doClick(findButton(dialog, 'Save player'));

                expect(reportedError.hasError()).toEqual(false);
                expect(updatedPlayer).not.toBeNull();
                expect(updatedPlayer.playerDetails.name).toEqual('NEW NAME');
                expect(divisionReloaded).toEqual(true);
                expect(teamsReloaded).toEqual(true);
            });

            it('shows error if player details cannot be saved', async () => {
                await renderComponent({
                        player,
                        hideVenue: false
                    },
                    {id: division.id, season, name: division.name} as any,
                    account);
                const nameCell = context.container.querySelector('td:nth-child(2)');
                await doClick(findButton(nameCell, '✏️'));
                const dialog = nameCell.querySelector('.modal-dialog');
                await doChange(dialog, 'input[name="name"]', 'NEW NAME', context.user);
                apiResponse = {success: false} as any;

                await doClick(findButton(dialog, 'Save player'));

                expect(reportedError.hasError()).toEqual(false);
                expect(updatedPlayer).not.toBeNull();
                expect(nameCell.textContent).toContain('Could not save player details');
                expect(divisionReloaded).toEqual(false);
                expect(teamsReloaded).toEqual(false);
            });
        });
    });
});