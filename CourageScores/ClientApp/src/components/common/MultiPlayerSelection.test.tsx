import {
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

    function getSelectedPlayers() {
        return Array.from(context.container.querySelectorAll('ol li'));
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
            const inputs = Array.from(
                context.container.querySelectorAll('input'),
            );
            const buttons = Array.from(
                context.container.querySelectorAll('button'),
            );
            expect(inputs.length).toEqual(0);
            expect(buttons.length).toEqual(1);
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
            const inputs = Array.from(
                context.container.querySelectorAll('input'),
            );
            const buttons = Array.from(
                context.container.querySelectorAll('button'),
            );
            expect(inputs.length).toEqual(0);
            expect(buttons.length).toEqual(0);
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
            const inputs = Array.from(
                context.container.querySelectorAll('input'),
            );
            const buttons = Array.from(
                context.container.querySelectorAll('button'),
            );
            expect(inputs.length).toEqual(0);
            expect(buttons.length).toEqual(0);
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
            const removePlayerButton = selectedPlayer.querySelector('button')!;
            expect(removePlayerButton).toBeTruthy();
            expect(removePlayerButton.textContent).toEqual('PLAYER 🗑');
            const addPlayerButton = context.container.querySelector(
                'ol > li:last-child > button',
            )!;
            expect(addPlayerButton).toBeTruthy();
            expect(addPlayerButton.textContent).toEqual('➕');
            const notesInput = context.container.querySelector(
                'ol > li:last-child > input',
            );
            expect(notesInput).toBeFalsy();
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
            const removePlayerButton = selectedPlayer.querySelector('button')!;
            expect(removePlayerButton).toBeTruthy();
            expect(removePlayerButton.textContent).toEqual('PLAYER (123) 🗑');
            const addPlayerButton = context.container.querySelector(
                'ol > li:last-child > button',
            )!;
            expect(addPlayerButton).toBeTruthy();
            expect(addPlayerButton.textContent).toEqual('➕');
            const notesInput = context.container.querySelector(
                'ol > li:last-child > input',
            );
            expect(notesInput).toBeTruthy();
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
            const dropdownToggle = context.container.querySelector(
                'button.dropdown-toggle',
            )!;
            expect(dropdownToggle).toBeTruthy();
            expect(dropdownToggle.textContent).toEqual('PLACEHOLDER');
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
            const selectedPlayerButton =
                selectedPlayer.querySelector('button')!;
            expect(selectedPlayerButton).toBeTruthy();
            expect(selectedPlayerButton.textContent).toEqual('PLAYER 🗑');
            expect(selectedPlayerButton.disabled).toBeTruthy();
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
            const selectedPlayerButton =
                selectedPlayer.querySelector('button')!;
            expect(selectedPlayerButton).toBeTruthy();
            expect(selectedPlayerButton.textContent).toEqual('PLAYER (123) 🗑');
            expect(selectedPlayerButton.disabled).toBeTruthy();
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
            const linkToPlayer = selectedPlayer.querySelector('a')!;
            expect(linkToPlayer).toBeTruthy();
            expect(linkToPlayer.href).toContain(
                `/division/${division.name}/player:${player.name}@TEAM_NAME/${season.name}`,
            );
            expect(linkToPlayer.textContent).toEqual('PLAYER');
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
            const linkToPlayer = selectedPlayer.querySelector('a')!;
            expect(linkToPlayer).toBeTruthy();
            expect(linkToPlayer.href).toContain(
                `/division/${division.name}/player:${player.id}/${season.name}`,
            );
            expect(linkToPlayer.textContent).toEqual('PLAYER');
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
            const linkToPlayer = selectedPlayer.querySelector('a')!;
            expect(linkToPlayer).toBeTruthy();
            expect(linkToPlayer.href).toContain(
                `/division/${division.name}/player:${player.id}/${season.name}`,
            );
            expect(linkToPlayer.textContent).toEqual('PLAYER');
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
            const linkToPlayer = selectedPlayer.querySelector('a')!;
            expect(linkToPlayer).toBeTruthy();
            expect(linkToPlayer.href).toContain(
                `/division/${division.name}/player:${player.id}/${season.name}`,
            );
            expect(linkToPlayer.textContent).toEqual('PLAYER');
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
            const linkToPlayer = selectedPlayer.querySelector('a')!;
            expect(linkToPlayer).toBeTruthy();
            expect(linkToPlayer.href).toContain(
                `/division/${division.name}/player:${player.id}/${season.name}`,
            );
            expect(linkToPlayer.textContent).toEqual('PLAYER (123)');
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
            const dropdown = context.container.querySelector(
                'ol > li:last-child div.btn-group',
            )!;
            expect(dropdown).toBeTruthy();
            expect(dropdown.className).toContain('DROPDOWN-CLASS-NAME');
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
            const notesInput = context.container.querySelector(
                'ol > li:last-child > input',
            )!;
            expect(notesInput).toBeTruthy();
            expect(notesInput.className).toContain('NOTES-CLASS-NAME');
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

            const button = findButton(selectedPlayer, 'PLAYER 🗑');

            expect(button.disabled).toEqual(true);
        });

        it('allows players to be added', async () => {
            await renderComponent({
                players: [],
                allPlayers: [player],
                onAddPlayer: onAddPlayer,
                onRemovePlayer: onRemovePlayer,
            });
            reportedError.verifyNoError();

            await doSelectOption(
                context.container.querySelector('.dropdown-menu'),
                'PLAYER',
            );
            await doClick(findButton(context.container, '➕'));

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
            await doClick(findButton(context.container, '➕'));

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

            await doSelectOption(
                context.container.querySelector('.dropdown-menu'),
                'PLAYER',
            );
            await doChange(
                context.container,
                'ol > li:last-child > input[type="number"]',
                '100',
                context.user,
            );
            await doClick(findButton(context.container, '➕'));

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

            await doSelectOption(
                context.container.querySelector('.dropdown-menu'),
                'PLAYER',
            );
            // notes not updated
            await doClick(findButton(context.container, '➕'));

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

            await doSelectOption(
                context.container.querySelector('.dropdown-menu'),
                'PLAYER',
            );
            await doChange(
                context.container,
                'ol > li:last-child > input[type="number"]',
                '.',
                context.user,
            );
            await doClick(findButton(context.container, '➕'));

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

            await doClick(findButton(selectedPlayer, 'PLAYER 🗑'));

            expect(removedPlayer).not.toBeNull();
            expect(removedPlayer?.id).toEqual(player.id);
        });
    });
});
