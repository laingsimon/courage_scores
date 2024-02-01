import {
    appProps,
    brandingProps,
    cleanUp,
    doChange,
    doClick, ErrorState,
    findButton,
    iocProps,
    renderApp, TestContext
} from "../../../helpers/tests";
import {createTemporaryId} from "../../../helpers/projection";
import {toMap} from "../../../helpers/collections";
import {ITournamentContainerProps, TournamentContainer} from "./TournamentContainer";
import {ITournamentSideProps, TournamentSide} from "./TournamentSide";
import {TeamDto} from "../../../interfaces/models/dtos/Team/TeamDto";
import {TournamentSideDto} from "../../../interfaces/models/dtos/Game/TournamentSideDto";
import {SeasonDto} from "../../../interfaces/models/dtos/Season/SeasonDto";
import {DivisionDto} from "../../../interfaces/models/dtos/DivisionDto";
import {TournamentGameDto} from "../../../interfaces/models/dtos/Game/TournamentGameDto";
import {seasonBuilder} from "../../../helpers/builders/seasons";
import {divisionBuilder} from "../../../helpers/builders/divisions";
import {teamBuilder} from "../../../helpers/builders/teams";
import {sideBuilder, tournamentBuilder} from "../../../helpers/builders/tournaments";

describe('TournamentSide', () => {
    let context: TestContext;
    let reportedError: ErrorState;
    let updatedData: TournamentSideDto;
    let removed: boolean;

    afterEach(() => {
        cleanUp(context);
    });

    beforeEach(() => {
        reportedError = new ErrorState();
        updatedData = null;
        removed = false;
    });

    async function onChange(newData: TournamentSideDto) {
        updatedData = newData;
    }

    async function onRemove() {
        removed = true;
    }

    async function renderComponent(containerProps: ITournamentContainerProps, props: ITournamentSideProps, teams?: TeamDto[]) {
        context = await renderApp(
            iocProps(),
            brandingProps(),
            appProps({
                teams: toMap(teams || []),
                account: {
                    access: {},
                },
            }, reportedError),
            (<TournamentContainer {...containerProps}>
                <TournamentSide {...props} />
            </TournamentContainer>));
    }

    describe('renders', () => {
        const season: SeasonDto = seasonBuilder('SEASON').build();
        const division: DivisionDto = divisionBuilder('DIVISION').build();
        const team: TeamDto = teamBuilder('TEAM').build();

        it('single player (with not found division id) side', async () => {
            await renderComponent({season, tournamentData: null}, {
                side: sideBuilder('SIDE NAME')
                    .withPlayer('PLAYER', null, division.id)
                    .build(),
                winner: null,
                readOnly: false,
                onChange,
                onRemove,
            }, [team]);

            expect(reportedError.hasError()).toEqual(false);
            const sideName = context.container.querySelector('strong');
            const sideLink = sideName.querySelector('a');
            expect(sideLink).toBeFalsy();
            expect(sideName.textContent).toEqual('SIDE NAME');
            const teamName = context.container.querySelector('div[data-name="team-name"]');
            expect(teamName).toBeFalsy();
            const players = Array.from(context.container.querySelectorAll('ol li'));
            expect(players.map(p => p.textContent)).toEqual(['PLAYER']);
        });

        it('single player (with found division id) side', async () => {
            await renderComponent({season, tournamentData: null}, {
                side: sideBuilder('SIDE NAME')
                    .withPlayer('PLAYER', null, division.id)
                    .build(),
                winner: null,
                readOnly: false,
                onChange,
                onRemove,
            }, [team]);

            expect(reportedError.hasError()).toEqual(false);
            const sideName = context.container.querySelector('strong');
            expect(sideName.textContent).toEqual('SIDE NAME');
            const teamName = context.container.querySelector('div[data-name="team-name"]');
            expect(teamName).toBeFalsy();
            const players = Array.from(context.container.querySelectorAll('ol li'));
            expect(players.map(p => p.textContent)).toEqual(['PLAYER']);
        });

        it('single player (without division id) side', async () => {
            await renderComponent({season, tournamentData: null}, {
                side: sideBuilder('SIDE NAME')
                    .withPlayer('PLAYER')
                    .build(),
                winner: null,
                readOnly: false,
                onChange,
                onRemove,
            }, [team]);

            expect(reportedError.hasError()).toEqual(false);
            const sideName = context.container.querySelector('strong');
            expect(sideName.textContent).toEqual('SIDE NAME');
            const teamName = context.container.querySelector('div[data-name="team-name"]');
            expect(teamName).toBeFalsy();
            const players = Array.from(context.container.querySelectorAll('ol li'));
            expect(players.map(p => p.textContent)).toEqual(['PLAYER']);
        });

        it('multi player side', async () => {
            const side = sideBuilder('SIDE NAME')
                .withPlayer('PLAYER 1', null, division.id)
                .withPlayer('PLAYER 2', null, division.id)
                .build();

            await renderComponent({season, tournamentData: null}, {
                side: side,
                winner: null,
                readOnly: false,
                onChange,
                onRemove,
            }, [team]);

            expect(reportedError.hasError()).toEqual(false);
            const sideName = context.container.querySelector('strong');
            expect(sideName.textContent).toEqual('SIDE NAME');
            const teamName = context.container.querySelector('div[data-name="team-name"]');
            expect(teamName).toBeFalsy();
            const players = Array.from(context.container.querySelectorAll('ol li'));
            expect(players.map(p => p.textContent)).toEqual(['PLAYER 1', 'PLAYER 2']);
        });

        it('no-show multi player side', async () => {
            const side = sideBuilder('SIDE NAME')
                .withPlayer('PLAYER 1', null, division.id)
                .withPlayer('PLAYER 2', null, division.id)
                .noShow()
                .build();

            await renderComponent({season, tournamentData: null}, {
                side: side,
                winner: null,
                readOnly: false,
                onChange,
                onRemove,
            }, [team]);

            expect(reportedError.hasError()).toEqual(false);
            const sideName = context.container.querySelector('strong');
            expect(sideName.textContent).toEqual('SIDE NAME');
            const teamName = context.container.querySelector('div[data-name="team-name"]');
            expect(teamName).toBeFalsy();
            const players = Array.from(context.container.querySelectorAll('ol li'));
            expect(players.map(p => p.textContent)).toEqual(['PLAYER 1', 'PLAYER 2']);
            expect(players.map(p => p.className)).toEqual(['text-decoration-line-through', 'text-decoration-line-through']);
        });

        it('team (with different side name) side', async () => {
            await renderComponent({season, tournamentData: null}, {
                side: sideBuilder('SIDE NAME')
                    .teamId(team.id)
                    .build(),
                winner: null,
                readOnly: false,
                onChange,
                onRemove,
            }, [team]);

            expect(reportedError.hasError()).toEqual(false);
            const sideName = context.container.querySelector('strong');
            expect(sideName.textContent).toEqual('SIDE NAME');
            const players = context.container.querySelector('ol');
            expect(players).toBeFalsy();
        });

        it('team (with not-found division and different side name) side', async () => {
            await renderComponent({season, tournamentData: null}, {
                side: sideBuilder('SIDE NAME')
                    .teamId(team.id)
                    .build(),
                winner: null,
                readOnly: false,
                onChange,
                onRemove,
            }, [team]);

            expect(reportedError.hasError()).toEqual(false);
            const sideName = context.container.querySelector('strong');
            expect(sideName.textContent).toEqual('SIDE NAME');
            const players = context.container.querySelector('ol');
            expect(players).toBeFalsy();
        });

        it('no-show team (with different side name) side', async () => {
            const side = sideBuilder('SIDE NAME')
                .teamId(team.id)
                .noShow()
                .build();

            await renderComponent({season, tournamentData: null}, {
                side: side,
                winner: null,
                readOnly: false,
                onChange,
                onRemove,
            }, [team]);

            expect(reportedError.hasError()).toEqual(false);
            const sideName = context.container.querySelector('strong');
            expect(sideName.textContent).toEqual('SIDE NAME');
            expect(sideName.className).toContain('text-decoration-line-through');
            const players = context.container.querySelector('ol');
            expect(players).toBeFalsy();
        });

        it('team (with same side name) side', async () => {
            await renderComponent({season, tournamentData: null}, {
                side: sideBuilder(team.name)
                    .teamId(team.id)
                    .build(),
                winner: null,
                readOnly: false,
                onChange,
                onRemove,
            }, [team]);

            expect(reportedError.hasError()).toEqual(false);
            const sideName = context.container.querySelector('strong');
            expect(sideName.textContent).toEqual(team.name);
            const teamName = context.container.querySelector('div[data-name="team-name"]');
            expect(teamName).toBeFalsy();
            const players = context.container.querySelector('ol');
            expect(players).toBeFalsy();
        });

        it('no-show team (with same side name) side', async () => {
            await renderComponent({season, tournamentData: null}, {
                side: sideBuilder(team.name)
                    .teamId(team.id)
                    .noShow()
                    .build(),
                winner: null,
                readOnly: false,
                onChange,
                onRemove,
            }, [team]);

            expect(reportedError.hasError()).toEqual(false);
            const sideName = context.container.querySelector('strong');
            expect(sideName.textContent).toEqual(team.name);
            expect(sideName.className).toContain('text-decoration-line-through');
            const teamName = context.container.querySelector('div[data-name="team-name"]');
            expect(teamName).toBeFalsy();
            const players = context.container.querySelector('ol');
            expect(players).toBeFalsy();
        });

        it('team (with missing team data) side', async () => {
            const missingTeam = teamBuilder('MISSING').build();
            await renderComponent({season, tournamentData: null}, {
                side: sideBuilder(team.name)
                    .teamId(missingTeam.id)
                    .build(),
                winner: null,
                readOnly: false,
                onChange,
                onRemove,
            }, [team]);

            expect(reportedError.hasError()).toEqual(false);
            const sideName = context.container.querySelector('strong');
            const sideLink = sideName.querySelector('a');
            expect(sideLink).toBeFalsy();
            expect(sideName.textContent).toEqual(team.name);
            const teamName = context.container.querySelector('div[data-name="team-name"]');
            expect(teamName).toBeFalsy();
            const players = context.container.querySelector('ol');
            expect(players).toBeFalsy();
        });
    });

    describe('interactivity', () => {
        const season: SeasonDto = seasonBuilder('SEASON').build();
        const team: TeamDto = teamBuilder('TEAM').build();

        it('can edit side', async () => {
            const tournamentData: TournamentGameDto = tournamentBuilder().build();
            await renderComponent({season, tournamentData}, {
                side: sideBuilder('SIDE NAME')
                    .teamId(team.id)
                    .build(),
                winner: null,
                readOnly: false,
                onChange,
                onRemove,
            }, [team]);

            await doClick(findButton(context.container, '✏️'));

            expect(reportedError.hasError()).toEqual(false);
            const dialog = context.container.querySelector('.modal-dialog');
            expect(dialog).toBeTruthy();
        });

        it('cannot edit side when readonly', async () => {
            await renderComponent({season, tournamentData: null}, {
                side: sideBuilder('SIDE NAME')
                    .teamId(team.id)
                    .build(),
                winner: null,
                readOnly: true,
                onChange,
                onRemove,
            }, [team]);

            expect(context.container.querySelector('button')).toBeFalsy();
        });

        it('can apply side changes', async () => {
            const sideId = createTemporaryId();
            const tournamentData: TournamentGameDto = tournamentBuilder().build();
            await renderComponent({season, tournamentData}, {
                side: sideBuilder('SIDE NAME', sideId)
                    .teamId(team.id)
                    .build(),
                winner: null,
                readOnly: false,
                onChange,
                onRemove,
            }, [team]);

            await doClick(findButton(context.container, '✏️'));
            const dialog = context.container.querySelector('.modal-dialog');
            await doChange(dialog, 'input[name="name"]', 'NEW NAME', context.user);
            await doClick(findButton(dialog, 'Save'));

            expect(reportedError.hasError()).toEqual(false);
            expect(updatedData).toEqual({
                id: sideId,
                teamId: team.id,
                name: 'NEW NAME',
                players: [],
            });
            expect(context.container.querySelector('.modal-dialog')).toBeFalsy();
        });

        it('can close edit side dialog', async () => {
            const tournamentData: TournamentGameDto = tournamentBuilder().build();
            await renderComponent({season, tournamentData}, {
                side: sideBuilder('SIDE NAME')
                    .teamId(team.id)
                    .build(),
                winner: null,
                readOnly: false,
                onChange,
                onRemove,
            }, [team]);

            await doClick(findButton(context.container, '✏️'));
            const dialog = context.container.querySelector('.modal-dialog');
            await doClick(findButton(dialog, 'Close'));

            expect(reportedError.hasError()).toEqual(false);
            expect(context.container.querySelector('.modal-dialog')).toBeFalsy();
        });

        it('can delete side', async () => {
            const tournamentData: TournamentGameDto = tournamentBuilder().build();
            await renderComponent({season, tournamentData}, {
                side: sideBuilder('SIDE NAME')
                    .teamId(team.id)
                    .build(),
                winner: null,
                readOnly: false,
                onChange,
                onRemove,
            }, [team]);
            window.confirm = () => true;

            await doClick(findButton(context.container, '✏️'));
            const dialog = context.container.querySelector('.modal-dialog');
            await doClick(findButton(dialog, 'Delete side'));

            expect(reportedError.hasError()).toEqual(false);
            expect(removed).toEqual(true);
            expect(context.container.querySelector('.modal-dialog')).toBeFalsy();
        });
    });
});