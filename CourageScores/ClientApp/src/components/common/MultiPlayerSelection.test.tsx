import {
    appProps,
    brandingProps,
    cleanUp,
    ErrorState,
    IComponent,
    iocProps,
    renderApp,
    TestContext,
} from '../../helpers/tests';
import {
    IMultiPlayerSelectionProps,
    MultiPlayerSelection,
} from './MultiPlayerSelection';
import { ISelectablePlayer } from './PlayerSelection';
import { TeamDto } from '../../interfaces/models/dtos/Team/TeamDto';
import { divisionBuilder } from '../../helpers/builders/divisions';
import { seasonBuilder } from '../../helpers/builders/seasons';
import { playerBuilder } from '../../helpers/builders/players';
import { teamBuilder } from '../../helpers/builders/teams';

describe('MultiPlayerSelection', () => {
    let context: TestContext;
    let reportedError: ErrorState;
    let addedPlayer: { player: ISelectablePlayer; score: number } | null;
    let removedPlayer: { id: string; index: number } | null;
    async function onAddPlayer(player: ISelectablePlayer, score: number) {
        addedPlayer = { player, score };
    }
    async function onRemovePlayer(id: string, index: number) {
        removedPlayer = { id, index };
    }

    afterEach(async () => {
        await cleanUp(context);
    });

    beforeEach(() => {
        reportedError = new ErrorState();
        addedPlayer = null;
        removedPlayer = null;
    });

    async function renderComponent(
        props: IMultiPlayerSelectionProps,
        allTeams?: TeamDto[],
    ) {
        context = await renderApp(
            iocProps(),
            brandingProps(),
            appProps(
                {
                    teams: allTeams,
                },
                reportedError,
            ),
            <MultiPlayerSelection {...props} />,
        );
    }

    function getSelectedPlayers(): IComponent[] {
        return context.all('ol li');
    }

    describe('renders', () => {
        const division = divisionBuilder('DIVISION').build();
        const season = seasonBuilder('SEASON').withDivision(division).build();
        const player = playerBuilder('PLAYER').score(123).build();

        it('readonly component', async () => {
            await renderComponent({
                readOnly: true,
                players: [player],
                allPlayers: [player],
                onAddPlayer: onAddPlayer,
                onRemovePlayer: onRemovePlayer,
            });

            reportedError.verifyNoError();
            expect(context.all('input').length).toEqual(0);
            expect(context.all('button').length).toEqual(1);
        });

        it('disabled component', async () => {
            await renderComponent({
                disabled: true,
                players: [player],
                allPlayers: [player],
                onAddPlayer: onAddPlayer,
                onRemovePlayer: onRemovePlayer,
            });

            reportedError.verifyNoError();
            expect(context.all('input').length).toEqual(0);
            expect(context.all('button').length).toEqual(0);
        });

        it('disabled and readonly component', async () => {
            await renderComponent({
                readOnly: true,
                disabled: true,
                players: [player],
                allPlayers: [player],
                onAddPlayer: onAddPlayer,
                onRemovePlayer: onRemovePlayer,
            });

            reportedError.verifyNoError();
            expect(context.all('input').length).toEqual(0);
            expect(context.all('button').length).toEqual(0);
        });

        it('editable component without notes', async () => {
            await renderComponent({
                players: [player],
                allPlayers: [player],
                onAddPlayer: onAddPlayer,
                onRemovePlayer: onRemovePlayer,
            });

            reportedError.verifyNoError();
            const selectedPlayers = getSelectedPlayers();
            expect(selectedPlayers.length).toEqual(1 + 1);
            const selectedPlayer = selectedPlayers[0];
            const removePlayerButton = selectedPlayer.required('button');
            expect(removePlayerButton.text()).toEqual('PLAYER 🗑');
            const addPlayerButton = context.required(
                'ol > li:last-child > button',
            );
            expect(addPlayerButton.text()).toEqual('➕');
            expect(context.optional('ol > li:last-child > input')).toBeFalsy();
        });

        it('editable component with notes', async () => {
            await renderComponent({
                players: [player],
                allPlayers: [player],
                showScore: true,
                onAddPlayer: onAddPlayer,
                onRemovePlayer: onRemovePlayer,
            });

            reportedError.verifyNoError();
            const selectedPlayers = getSelectedPlayers();
            expect(selectedPlayers.length).toEqual(1 + 1);
            const selectedPlayer = selectedPlayers[0];
            const removePlayerButton = selectedPlayer.required('button');
            expect(removePlayerButton.text()).toEqual('PLAYER (123) 🗑');
            const addPlayerButton = context.required(
                'ol > li:last-child > button',
            );
            expect(addPlayerButton.text()).toEqual('➕');
            expect(context.optional('ol > li:last-child > input')).toBeTruthy();
        });

        it('placeholder in dropdown', async () => {
            await renderComponent({
                players: [player],
                allPlayers: [player],
                placeholder: 'PLACEHOLDER',
                onAddPlayer: onAddPlayer,
                onRemovePlayer: onRemovePlayer,
            });

            reportedError.verifyNoError();
            const dropdownToggle = context.required('button.dropdown-toggle');
            expect(dropdownToggle.text()).toEqual('PLACEHOLDER');
        });

        it('readonly selected players', async () => {
            await renderComponent({
                readOnly: true,
                players: [player],
                allPlayers: [player],
                division: division,
                season: season,
                onAddPlayer: onAddPlayer,
                onRemovePlayer: onRemovePlayer,
            });

            reportedError.verifyNoError();
            const selectedPlayer = getSelectedPlayers()[0];
            expect(selectedPlayer).toBeTruthy();
            const selectedPlayerButton = selectedPlayer.required('button');
            expect(selectedPlayerButton.text()).toEqual('PLAYER 🗑');
            expect(selectedPlayerButton.enabled()).toEqual(false);
        });

        it('readonly selected placers with notes', async () => {
            await renderComponent({
                readOnly: true,
                players: [player],
                allPlayers: [player],
                showScore: true,
                division: division,
                season: season,
                onAddPlayer: onAddPlayer,
                onRemovePlayer: onRemovePlayer,
            });

            reportedError.verifyNoError();
            const selectedPlayer = getSelectedPlayers()[0];
            expect(selectedPlayer).toBeTruthy();
            const selectedPlayerButton = selectedPlayer.required('button');
            expect(selectedPlayerButton.text()).toEqual('PLAYER (123) 🗑');
            expect(selectedPlayerButton.enabled()).toEqual(false);
        });

        it('disabled selected players', async () => {
            await renderComponent(
                {
                    disabled: true,
                    players: [player],
                    allPlayers: [player],
                    division: division,
                    season: season,
                    onAddPlayer: onAddPlayer,
                    onRemovePlayer: onRemovePlayer,
                },
                [
                    teamBuilder('TEAM_NAME')
                        .forSeason(season, division, [player])
                        .build(),
                ],
            );

            reportedError.verifyNoError();
            const selectedPlayer = getSelectedPlayers()[0];
            expect(selectedPlayer).toBeTruthy();
            const linkToPlayer = selectedPlayer.required('a');
            expect(linkToPlayer.element<HTMLAnchorElement>().href).toContain(
                `/division/${division.name}/player:${player.name}@TEAM_NAME/${season.name}`,
            );
            expect(linkToPlayer.text()).toEqual('PLAYER');
        });

        it('disabled selected players link via id when team has deleted season', async () => {
            const team = teamBuilder('TEAM_NAME')
                .forSeason(season, division, [player], true)
                .build();
            await renderComponent(
                {
                    disabled: true,
                    players: [player],
                    allPlayers: [player],
                    division: division,
                    season: season,
                    onAddPlayer: onAddPlayer,
                    onRemovePlayer: onRemovePlayer,
                },
                [team],
            );

            reportedError.verifyNoError();
            const selectedPlayer = getSelectedPlayers()[0];
            expect(selectedPlayer).toBeTruthy();
            const linkToPlayer = selectedPlayer.required('a');
            expect(linkToPlayer.element<HTMLAnchorElement>().href).toContain(
                `/division/${division.name}/player:${player.id}/${season.name}`,
            );
            expect(linkToPlayer.text()).toEqual('PLAYER');
        });

        it('disabled selected players link via id when team has no matching season', async () => {
            const team = teamBuilder()
                .forSeason(seasonBuilder('ANOTHER SEASON').build(), division)
                .build();
            await renderComponent(
                {
                    disabled: true,
                    players: [player],
                    allPlayers: [player],
                    division: division,
                    season: season,
                    onAddPlayer: onAddPlayer,
                    onRemovePlayer: onRemovePlayer,
                },
                [team],
            );

            reportedError.verifyNoError();
            const selectedPlayer = getSelectedPlayers()[0];
            expect(selectedPlayer).toBeTruthy();
            const linkToPlayer = selectedPlayer.required('a');
            expect(linkToPlayer.element<HTMLAnchorElement>().href).toContain(
                `/division/${division.name}/player:${player.id}/${season.name}`,
            );
            expect(linkToPlayer.text()).toEqual('PLAYER');
        });

        it('disabled selected players link via id when player not found for team season', async () => {
            await renderComponent(
                {
                    disabled: true,
                    players: [player],
                    allPlayers: [player],
                    division: division,
                    season: season,
                    onAddPlayer: onAddPlayer,
                    onRemovePlayer: onRemovePlayer,
                },
                [teamBuilder().forSeason(season).build()],
            );

            reportedError.verifyNoError();
            const selectedPlayer = getSelectedPlayers()[0];
            expect(selectedPlayer).toBeTruthy();
            const linkToPlayer = selectedPlayer.required('a');
            expect(linkToPlayer.element<HTMLAnchorElement>().href).toContain(
                `/division/${division.name}/player:${player.id}/${season.name}`,
            );
            expect(linkToPlayer.text()).toEqual('PLAYER');
        });

        it('disabled selected placers with notes', async () => {
            await renderComponent(
                {
                    disabled: true,
                    players: [player],
                    allPlayers: [player],
                    showScore: true,
                    division: division,
                    season: season,
                    onAddPlayer: onAddPlayer,
                    onRemovePlayer: onRemovePlayer,
                },
                [],
            );

            reportedError.verifyNoError();
            const selectedPlayer = getSelectedPlayers()[0];
            expect(selectedPlayer).toBeTruthy();
            const linkToPlayer = selectedPlayer.required('a');
            expect(linkToPlayer.element<HTMLAnchorElement>().href).toContain(
                `/division/${division.name}/player:${player.id}/${season.name}`,
            );
            expect(linkToPlayer.text()).toEqual('PLAYER (123)');
        });

        it('dropdown with dropdownClassName', async () => {
            await renderComponent({
                players: [player],
                allPlayers: [player],
                dropdownClassName: 'DROPDOWN-CLASS-NAME',
                onAddPlayer: onAddPlayer,
                onRemovePlayer: onRemovePlayer,
            });

            reportedError.verifyNoError();
            const dropdown = context.required(
                'ol > li:last-child div.btn-group',
            );
            expect(dropdown.className()).toContain('DROPDOWN-CLASS-NAME');
        });

        it('component with notesClassName', async () => {
            await renderComponent({
                players: [player],
                allPlayers: [player],
                scoreClassName: 'NOTES-CLASS-NAME',
                showScore: true,
                onAddPlayer: onAddPlayer,
                onRemovePlayer: onRemovePlayer,
            });

            reportedError.verifyNoError();
            const notesInput = context.required('ol > li:last-child > input');
            expect(notesInput.className()).toContain('NOTES-CLASS-NAME');
        });
    });

    describe('interactivity', () => {
        const player: ISelectablePlayer = playerBuilder('PLAYER')
            .score(123)
            .build();

        it('does not permit removal of players when readonly', async () => {
            await renderComponent({
                readOnly: true,
                players: [player],
                allPlayers: [player],
                onAddPlayer: onAddPlayer,
                onRemovePlayer: onRemovePlayer,
            });
            reportedError.verifyNoError();
            const selectedPlayer = getSelectedPlayers()[0];
            expect(selectedPlayer).toBeTruthy();

            expect(selectedPlayer.button('PLAYER 🗑').enabled()).toEqual(false);
        });

        it('allows players to be added', async () => {
            await renderComponent({
                players: [],
                allPlayers: [player],
                onAddPlayer: onAddPlayer,
                onRemovePlayer: onRemovePlayer,
            });
            reportedError.verifyNoError();

            await context.required('.dropdown-menu').select('PLAYER');
            await context.button('➕').click();

            expect(addedPlayer).not.toBeNull();
            expect(addedPlayer?.player).toEqual(player);
            expect(addedPlayer?.score).toBeFalsy();
        });

        it('players not added when no player selected', async () => {
            await renderComponent({
                players: [],
                allPlayers: [player],
                onAddPlayer: onAddPlayer,
                onRemovePlayer: onRemovePlayer,
            });
            reportedError.verifyNoError();

            // no player selected
            await context.button('➕').click();

            expect(addedPlayer).toBeNull();
            context.prompts.alertWasShown('Ensure a player is selected first');
        });

        it('allows players to be added with notes', async () => {
            await renderComponent({
                players: [],
                allPlayers: [player],
                showScore: true,
                onAddPlayer: onAddPlayer,
                onRemovePlayer: onRemovePlayer,
            });
            reportedError.verifyNoError();

            await context.required('.dropdown-menu').select('PLAYER');
            await context
                .required('ol > li:last-child > input[type="number"]')
                .change('100');
            await context.button('➕').click();

            expect(addedPlayer).not.toBeNull();
            expect(addedPlayer?.player).toEqual(player);
            expect(addedPlayer?.score).toEqual(100);
        });

        it('players not added when notes are empty', async () => {
            await renderComponent({
                players: [],
                allPlayers: [player],
                showScore: true,
                onAddPlayer: onAddPlayer,
                onRemovePlayer: onRemovePlayer,
            });
            reportedError.verifyNoError();

            await context.required('.dropdown-menu').select('PLAYER');
            // notes not updated
            await context.button('➕').click();

            expect(addedPlayer).toBeNull();
            context.prompts.alertWasShown('Enter the score first');
        });

        it('players not added when notes are non numeric', async () => {
            await renderComponent({
                players: [],
                allPlayers: [player],
                showScore: true,
                onAddPlayer: onAddPlayer,
                onRemovePlayer: onRemovePlayer,
            });
            reportedError.verifyNoError();

            await context.required('.dropdown-menu').select('PLAYER');
            await context
                .required('ol > li:last-child > input[type="number"]')
                .change('.');
            await context.button('➕').click();

            expect(addedPlayer).toBeNull();
            context.prompts.alertWasShown('Enter the score first');
        });

        it('allows players to be removed', async () => {
            await renderComponent({
                players: [player],
                allPlayers: [player],
                showScore: false,
                onAddPlayer: onAddPlayer,
                onRemovePlayer: onRemovePlayer,
            });
            reportedError.verifyNoError();
            const selectedPlayer = getSelectedPlayers()[0];

            await selectedPlayer.button('PLAYER 🗑').click();

            expect(removedPlayer).not.toBeNull();
            expect(removedPlayer?.id).toEqual(player.id);
        });
    });
});
