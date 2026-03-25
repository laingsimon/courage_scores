import {
    api,
    appProps,
    brandingProps,
    cleanUp,
    ErrorState,
    iocProps,
    renderApp,
    TestContext,
} from '../../helpers/tests';
import { DivisionPlayer, IDivisionPlayerProps } from './DivisionPlayer';
import {
    DivisionDataContainer,
    IDivisionDataContainerProps,
} from '../league/DivisionDataContainer';
import { createTemporaryId, EMPTY_ID } from '../../helpers/projection';
import { EditTeamPlayerDto } from '../../interfaces/models/dtos/Team/EditTeamPlayerDto';
import { TeamDto } from '../../interfaces/models/dtos/Team/TeamDto';
import { UserDto } from '../../interfaces/models/dtos/Identity/UserDto';
import { DivisionDto } from '../../interfaces/models/dtos/DivisionDto';
import { SeasonDto } from '../../interfaces/models/dtos/Season/SeasonDto';
import { DivisionPlayerDto } from '../../interfaces/models/dtos/Division/DivisionPlayerDto';
import { IClientActionResultDto } from '../common/IClientActionResultDto';
import { divisionBuilder } from '../../helpers/builders/divisions';
import { seasonBuilder } from '../../helpers/builders/seasons';
import { IPlayerApi } from '../../interfaces/apis/IPlayerApi';
import { IPreferenceData } from '../common/PreferencesContainer';

describe('DivisionPlayer', () => {
    let context: TestContext;
    let reportedError: ErrorState;
    let teamsReloaded: boolean;
    let divisionReloaded: boolean;
    let deletedPlayer: {
        seasonId: string;
        teamId: string;
        playerId: string;
    } | null;
    let updatedPlayer: {
        seasonId: string;
        teamId: string;
        playerId: string;
        playerDetails: EditTeamPlayerDto;
    } | null;
    let apiResponse: IClientActionResultDto<TeamDto> | null;
    const playerApi = api<IPlayerApi>({
        delete: async (
            seasonId: string,
            teamId: string,
            playerId: string,
        ): Promise<IClientActionResultDto<TeamDto>> => {
            deletedPlayer = { seasonId, teamId, playerId };
            return apiResponse || { success: true };
        },
        update: async (
            seasonId: string,
            teamId: string,
            playerId: string,
            playerDetails: EditTeamPlayerDto,
        ): Promise<IClientActionResultDto<TeamDto>> => {
            updatedPlayer = { seasonId, teamId, playerId, playerDetails };
            return apiResponse || { success: true };
        },
    });

    async function onReloadDivision() {
        return null;
    }

    async function setDivisionData() {}

    afterEach(async () => {
        await cleanUp(context);
    });

    beforeEach(() => {
        reportedError = new ErrorState();
        teamsReloaded = false;
        divisionReloaded = false;
        deletedPlayer = null;
        updatedPlayer = null;
        apiResponse = null;
    });

    async function renderComponent(
        props: IDivisionPlayerProps,
        divisionData: IDivisionDataContainerProps,
        account?: UserDto,
        preferenceData?: IPreferenceData,
    ) {
        context = await renderApp(
            iocProps({ playerApi }),
            brandingProps(),
            appProps(
                {
                    account,
                    reloadTeams: async () => (teamsReloaded = true),
                    teams: [],
                    divisions: [],
                },
                reportedError,
            ),
            <DivisionDataContainer
                {...divisionData}
                onReloadDivision={async () => {
                    divisionReloaded = true;
                    return null;
                }}>
                <DivisionPlayer {...props} />
            </DivisionDataContainer>,
            undefined,
            undefined,
            'tbody',
            preferenceData,
        );
    }

    describe('when logged out', () => {
        const account: UserDto | undefined = undefined;
        const division: DivisionDto = divisionBuilder('DIVISION').build();
        const season: SeasonDto = seasonBuilder('SEASON')
            .withDivision(division)
            .build();
        const player: DivisionPlayerDto = {
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
                await renderComponent(
                    {
                        player,
                        hideVenue: false,
                    },
                    {
                        id: division.id,
                        season,
                        name: division.name,
                        setDivisionData,
                        onReloadDivision,
                    },
                    account,
                );

                reportedError.verifyNoError();
                const cells = context.all('td');
                expect(cells.length).toEqual(10);
                expect(cells.map((c) => c.text())).toEqual([
                    '1',
                    'NAME',
                    'TEAM',
                    '2',
                    '3',
                    '4',
                    '5',
                    '6',
                    '7',
                    '8',
                ]);
            });

            it('captaincy marker', async () => {
                const captain = Object.assign({}, player);
                captain.captain = true;
                await renderComponent(
                    {
                        player: captain,
                        hideVenue: false,
                    },
                    {
                        id: division.id,
                        season,
                        name: division.name,
                        setDivisionData,
                        onReloadDivision,
                    },
                    account,
                );

                reportedError.verifyNoError();
                const cells = context.all('td');
                expect(cells.length).toEqual(10);
                const nameCell = cells[1];
                expect(nameCell.text()).toEqual('🤴 NAME');
            });

            it('without venue', async () => {
                await renderComponent(
                    {
                        player,
                        hideVenue: true,
                    },
                    {
                        id: division.id,
                        season,
                        name: division.name,
                        setDivisionData,
                        onReloadDivision,
                    },
                    account,
                );

                reportedError.verifyNoError();
                const cells = context.all('td');
                expect(cells.length).toEqual(9);
                expect(cells.map((c) => c.text())).toEqual([
                    '1',
                    'NAME',
                    '2',
                    '3',
                    '4',
                    '5',
                    '6',
                    '7',
                    '8',
                ]);
            });

            it('no action buttons', async () => {
                await renderComponent(
                    {
                        player,
                        hideVenue: false,
                    },
                    {
                        id: division.id,
                        season,
                        name: division.name,
                        setDivisionData,
                        onReloadDivision,
                    },
                    account,
                );

                reportedError.verifyNoError();
                const cells = context.all('td');
                const playerLinkCell = cells[1];
                expect(playerLinkCell.optional('button')).toBeFalsy();
            });

            it('link to player details', async () => {
                await renderComponent(
                    {
                        player,
                        hideVenue: false,
                    },
                    {
                        id: division.id,
                        season,
                        name: division.name,
                        setDivisionData,
                        onReloadDivision,
                    },
                    account,
                );

                reportedError.verifyNoError();
                const cells = context.all('td');
                const playerLinkCell = cells[1];
                const link = playerLinkCell
                    .required('a')
                    .element<HTMLAnchorElement>();
                expect(link.href).toEqual(
                    `http://localhost/division/${division.name}/player:${player.name}@${player.team}/${season.name}`,
                );
            });

            it('link to team details', async () => {
                await renderComponent(
                    {
                        player,
                        hideVenue: false,
                    },
                    {
                        id: division.id,
                        season,
                        name: division.name,
                        setDivisionData,
                        onReloadDivision,
                    },
                    account,
                );

                reportedError.verifyNoError();
                const cells = context.all('td');
                const teamLinkCell = cells[2];
                const link = teamLinkCell
                    .required('a')
                    .element<HTMLAnchorElement>();
                expect(link.href).toEqual(
                    `http://localhost/division/${division.name}/team:${player.team}/${season.name}`,
                );
            });

            it('team name only if no team id', async () => {
                const noTeamPlayer = Object.assign({}, player);
                noTeamPlayer.teamId = EMPTY_ID;
                await renderComponent(
                    {
                        player: noTeamPlayer,
                        hideVenue: false,
                    },
                    {
                        id: division.id,
                        season,
                        name: division.name,
                        setDivisionData,
                        onReloadDivision,
                    },
                    account,
                );

                reportedError.verifyNoError();
                const cells = context.all('td');
                const teamLinkCell = cells[2];
                expect(teamLinkCell.optional('a')).toBeFalsy();
                expect(teamLinkCell.text()).toEqual(noTeamPlayer.team);
            });

            it('when team is a favourite', async () => {
                await renderComponent(
                    {
                        player,
                        hideVenue: false,
                    },
                    {
                        id: division.id,
                        season,
                        name: division.name,
                        setDivisionData,
                        onReloadDivision,
                        favouritesEnabled: true,
                    },
                    account,
                    {
                        favouriteTeamIds: [player.teamId!],
                    },
                );

                reportedError.verifyNoError();
                expect(context.required('tr').className()).not.toContain(
                    'opacity-25',
                );
            });

            it('when team is not a favourite', async () => {
                await renderComponent(
                    {
                        player,
                        hideVenue: false,
                    },
                    {
                        id: division.id,
                        season,
                        name: division.name,
                        setDivisionData,
                        onReloadDivision,
                        favouritesEnabled: true,
                    },
                    account,
                    {
                        favouriteTeamIds: ['1234'],
                    },
                );

                reportedError.verifyNoError();
                expect(context.required('tr').className()).toContain(
                    'opacity-25',
                );
            });

            it('when no favourites are defined', async () => {
                await renderComponent(
                    {
                        player,
                        hideVenue: false,
                    },
                    {
                        id: division.id,
                        season,
                        name: division.name,
                        setDivisionData,
                        onReloadDivision,
                        favouritesEnabled: true,
                    },
                    account,
                    {
                        favouriteTeamIds: [],
                    },
                );

                reportedError.verifyNoError();
                expect(context.required('tr').className()).not.toContain(
                    'opacity-25',
                );
            });
        });
    });

    describe('when logged in', () => {
        const account: UserDto = {
            name: '',
            givenName: '',
            emailAddress: '',
            access: {
                managePlayers: true,
            },
        };
        const division: DivisionDto = divisionBuilder('DIVISION').build();
        const season: SeasonDto = seasonBuilder('SEASON')
            .withDivision(division)
            .build();
        const player: DivisionPlayerDto = {
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

        describe('interactivity', () => {
            it('can show edit player dialog', async () => {
                await renderComponent(
                    {
                        player,
                        hideVenue: false,
                    },
                    {
                        id: division.id,
                        season,
                        name: division.name,
                        setDivisionData,
                        onReloadDivision,
                    },
                    account,
                );
                const nameCell = context.required('td:nth-child(2)');
                expect(nameCell.text()).toContain('NAME');

                await nameCell.button('✏️').click();

                const dialog = nameCell.required('.modal-dialog');
                expect(dialog.text()).toContain('Edit player: NAME');
            });

            it('can close edit player dialog', async () => {
                await renderComponent(
                    {
                        player,
                        hideVenue: false,
                    },
                    {
                        id: division.id,
                        season,
                        name: division.name,
                        setDivisionData,
                        onReloadDivision,
                    },
                    account,
                );
                const nameCell = context.required('td:nth-child(2)');
                await nameCell.button('✏️').click();
                expect(nameCell.optional('.modal-dialog')).toBeTruthy();

                await nameCell
                    .required('.modal-dialog')
                    .button('Cancel')
                    .click();

                expect(nameCell.optional('.modal-dialog')).toBeFalsy();
            });

            it('prevents delete of player', async () => {
                await renderComponent(
                    {
                        player,
                        hideVenue: false,
                    },
                    {
                        id: division.id,
                        season,
                        name: division.name,
                        setDivisionData,
                        onReloadDivision,
                    },
                    account,
                );
                const nameCell = context.required('td:nth-child(2)');
                context.prompts.respondToConfirm(
                    'Are you sure you want to delete NAME?',
                    false,
                );

                await nameCell.button('🗑️').click();

                context.prompts.confirmWasShown(
                    'Are you sure you want to delete NAME?',
                );
                expect(deletedPlayer).toBeNull();
                expect(divisionReloaded).toEqual(false);
                expect(teamsReloaded).toEqual(false);
            });

            it('can delete player', async () => {
                await renderComponent(
                    {
                        player,
                        hideVenue: false,
                    },
                    {
                        id: division.id,
                        season,
                        name: division.name,
                        setDivisionData,
                        onReloadDivision,
                    },
                    account,
                );
                const nameCell = context.required('td:nth-child(2)');
                context.prompts.respondToConfirm(
                    'Are you sure you want to delete NAME?',
                    true,
                );

                await nameCell.button('🗑️').click();

                context.prompts.confirmWasShown(
                    'Are you sure you want to delete NAME?',
                );
                expect(deletedPlayer).not.toBeNull();
                expect(divisionReloaded).toEqual(true);
                expect(teamsReloaded).toEqual(true);
            });

            it('can handle error when deleting player', async () => {
                await renderComponent(
                    {
                        player,
                        hideVenue: false,
                    },
                    {
                        id: division.id,
                        season,
                        name: division.name,
                        setDivisionData,
                        onReloadDivision,
                    },
                    account,
                );
                const nameCell = context.required('td:nth-child(2)');
                context.prompts.respondToConfirm(
                    'Are you sure you want to delete NAME?',
                    true,
                );
                apiResponse = { success: false, errors: ['SOME ERROR'] };

                await nameCell.button('🗑️').click();

                expect(deletedPlayer).not.toBeNull();
                expect(divisionReloaded).toEqual(false);
                expect(teamsReloaded).toEqual(false);
                expect(context.text()).toContain('Could not delete player');
                expect(context.text()).toContain('SOME ERROR');
            });

            it('can close error dialog after delete failure', async () => {
                await renderComponent(
                    {
                        player,
                        hideVenue: false,
                    },
                    {
                        id: division.id,
                        season,
                        name: division.name,
                        setDivisionData,
                        onReloadDivision,
                    },
                    account,
                );
                const nameCell = context.required('td:nth-child(2)');
                context.prompts.respondToConfirm(
                    'Are you sure you want to delete NAME?',
                    true,
                );
                apiResponse = { success: false, errors: ['SOME ERROR'] };
                await nameCell.button('🗑️').click();
                expect(context.text()).toContain('Could not delete player');

                await context.button('Close').click();

                expect(context.text()).not.toContain('Could not delete player');
            });

            it('can save player details', async () => {
                await renderComponent(
                    {
                        player,
                        hideVenue: false,
                    },
                    {
                        id: division.id,
                        season,
                        name: division.name,
                        setDivisionData,
                        onReloadDivision,
                    },
                    account,
                );
                const nameCell = context.required('td:nth-child(2)');
                await nameCell.button('✏️').click();
                const dialog = nameCell.required('.modal-dialog');
                await dialog.input('name').change('NEW NAME');

                await dialog.button('Save player').click();

                reportedError.verifyNoError();
                expect(updatedPlayer).not.toBeNull();
                expect(updatedPlayer!.playerDetails.name).toEqual('NEW NAME');
                expect(divisionReloaded).toEqual(true);
                expect(teamsReloaded).toEqual(true);
            });

            it('shows error if player details cannot be saved', async () => {
                await renderComponent(
                    {
                        player,
                        hideVenue: false,
                    },
                    {
                        id: division.id,
                        season,
                        name: division.name,
                        setDivisionData,
                        onReloadDivision,
                    },
                    account,
                );
                const nameCell = context.required('td:nth-child(2)');
                await nameCell.button('✏️').click();
                const dialog = nameCell.required('.modal-dialog');
                await dialog.input('name').change('NEW NAME');
                apiResponse = { success: false };

                await dialog.button('Save player').click();

                reportedError.verifyNoError();
                expect(updatedPlayer).not.toBeNull();
                expect(nameCell.text()).toContain(
                    'Could not save player details',
                );
                expect(divisionReloaded).toEqual(false);
                expect(teamsReloaded).toEqual(false);
            });
        });

        describe('renders', () => {
            it('when team is not a favourite and an admin', async () => {
                await renderComponent(
                    {
                        player,
                        hideVenue: false,
                    },
                    {
                        id: division.id,
                        season,
                        name: division.name,
                        setDivisionData,
                        onReloadDivision,
                        favouritesEnabled: true,
                    },
                    account,
                    {
                        favouriteTeamIds: ['1234'],
                    },
                );

                reportedError.verifyNoError();
                expect(context.required('tr').className()).not.toContain(
                    'opacity-25',
                );
            });
        });
    });
});
