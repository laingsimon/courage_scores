import {
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
import {EditTournament, IEditTournamentProps} from "./EditTournament";
import {ITournamentContainerProps, TournamentContainer} from "./TournamentContainer";
import {TournamentGameDto} from "../../interfaces/models/dtos/Game/TournamentGameDto";
import {UserDto} from "../../interfaces/models/dtos/Identity/UserDto";
import {TeamDto} from "../../interfaces/models/dtos/Team/TeamDto";
import {seasonBuilder} from "../../helpers/builders/seasons";
import {
    ITournamentMatchBuilder,
    ITournamentRoundBuilder,
    ITournamentSideBuilder, sideBuilder,
    tournamentBuilder
} from "../../helpers/builders/tournaments";
import {teamBuilder} from "../../helpers/builders/teams";
import {divisionBuilder} from "../../helpers/builders/divisions";
import {tournamentContainerPropsBuilder} from "./tournamentContainerPropsBuilder";
import {IMatchOptionsBuilder} from "../../helpers/builders/games";

describe('EditTournament', () => {
    let context: TestContext;
    let reportedError: ErrorState;
    let updatedData: TournamentGameDto | null;

    afterEach(async () => {
        await cleanUp(context);
    });

    async function setTournamentData(newData: TournamentGameDto) {
        updatedData = newData;
    }

    beforeEach(() => {
        reportedError = new ErrorState();
        updatedData = null;
    });

    async function renderComponent(containerProps: ITournamentContainerProps, props: IEditTournamentProps, account?: UserDto, teams?: TeamDto[]) {
        context = await renderApp(
            iocProps(),
            brandingProps(),
            appProps({
                account,
                teams: teams || [],
            }, reportedError),
            (<TournamentContainer {...containerProps}>
                <EditTournament {...props} />
            </TournamentContainer>));

        reportedError.verifyNoError();
    }

    describe('renders', () => {
        const account: UserDto | undefined = undefined;
        const season = seasonBuilder('SEASON').build();
        const containerProps = new tournamentContainerPropsBuilder({
            season,
            setTournamentData,
        });

        it('who is playing', async () => {
            const tournamentData = tournamentBuilder()
                .forSeason(season)
                .withSide((s: ITournamentSideBuilder) => s.name('SIDE 1'))
                .withSide((s: ITournamentSideBuilder) => s.name('ANOTHER SIDE'))
                .build();

            await renderComponent(containerProps.withTournament(tournamentData).withAlreadyPlaying({}).build(), {
                disabled: true,
                saving: false,
                canSave: false,
            }, account);

            const playing = context.container.querySelector('div > div > div:nth-child(1)')!;
            expect(playing.textContent).toEqual('Playing:');
            const sides = context.container.querySelector('div > div > div:nth-child(2)')!;
            const sideNames = Array.from(sides.querySelectorAll('div')).map(side => side.textContent);
            expect(sideNames).toEqual(['ANOTHER SIDE', 'SIDE 1']);
        });

        it('rounds, when 2 or more sides', async () => {
            const tournamentData = tournamentBuilder()
                .forSeason(season)
                .withSide((s: ITournamentSideBuilder) => s.name('SIDE 1'))
                .withSide((s: ITournamentSideBuilder) => s.name('ANOTHER SIDE'))
                .build();

            await renderComponent(containerProps.withTournament(tournamentData).withAllPlayers([]).withAlreadyPlaying({}).build(), {
                disabled: true,
                saving: false,
                canSave: false,
            }, account);

            const playing = context.container.querySelector('div > div > div:nth-child(1)')!;
            expect(playing.textContent).toEqual('Playing:');
            const rounds = context.container.querySelector('div > div > div:nth-child(3)')!;
            expect(rounds).toBeFalsy();
        });

        it('no rounds, when less than 2 sides', async () => {
            const tournamentData = tournamentBuilder()
                .forSeason(season)
                .withSide((s: ITournamentSideBuilder) => s.name('SIDE 1'))
                .build();

            await renderComponent(containerProps.withTournament(tournamentData).withAllPlayers([]).withAlreadyPlaying({}).build(), {
                disabled: true,
                saving: false,
                canSave: false,
            }, account);

            const playing = context.container.querySelector('div > div > div:nth-child(1)')!;
            expect(playing.textContent).toEqual('Playing:');
            const rounds = context.container.querySelector('div > div > div:nth-child(3)')!;
            expect(rounds).toBeFalsy();
        });

        it('accolades, when 2 or more sides with scores', async () => {
            const tournamentData = tournamentBuilder()
                .forSeason(season)
                .withSide((s: ITournamentSideBuilder) => s.name('SIDE 1'))
                .withSide((s: ITournamentSideBuilder) => s.name('ANOTHER SIDE'))
                .round((r: ITournamentRoundBuilder) => r.withMatch((m: ITournamentMatchBuilder) => m.sideA('SIDE 1', 1).sideB('ANOTHER SIDE', 2)))
                .build();

            await renderComponent(containerProps.withTournament(tournamentData).withAllPlayers([]).withAlreadyPlaying({}).build(), {
                disabled: true,
                saving: false,
                canSave: false,
            }, account);

            const playing = context.container.querySelector('div > div > div:nth-child(1)')!;
            expect(playing.textContent).toEqual('Playing:');
            const accolades = context.container.querySelector('div > div > table')!;
            expect(accolades).toBeTruthy();
        });

        it('no accolades, when less than 2 sides', async () => {
            const tournamentData = tournamentBuilder()
                .forSeason(season)
                .withSide((s: ITournamentSideBuilder) => s.name('SIDE 1'))
                .build();

            await renderComponent(containerProps.withTournament(tournamentData).withAllPlayers([]).withAlreadyPlaying({}).build(), {
                disabled: true,
                saving: false,
                canSave: false,
            }, account);

            const accolades = context.container.querySelector('div > div > table');
            expect(accolades).toBeFalsy();
        });

        it('winning side from first round', async () => {
            const side1 = sideBuilder('SIDE 1').build();
            const anotherSide = sideBuilder('ANOTHER SIDE').build();
            const tournamentData = tournamentBuilder()
                .round((r: ITournamentRoundBuilder) => r
                    .withMatch((m: ITournamentMatchBuilder) => m
                        .sideA(side1, 1)
                        .sideB(anotherSide, 2))
                    .withMatchOption((o: IMatchOptionsBuilder) => o.numberOfLegs(3)))
                .forSeason(season)
                .withSide(side1)
                .withSide(anotherSide)
                .build();

            await renderComponent(
                containerProps.withTournament(tournamentData).withAllPlayers([]).withAlreadyPlaying({}).build(), {
                disabled: true,
                saving: false,
                canSave: false,
            }, account);

            const playing = context.container.querySelector('div > div > div:nth-child(1)')!;
            expect(playing.textContent).toEqual('Playing:');
            const sides = context.container.querySelector('div > div > div:nth-child(3)')!;
            const winningSideCells = Array.from(sides.querySelectorAll('td.bg-winner'));
            expect(winningSideCells.length).toEqual(2);
            expect(winningSideCells.map(td => td.textContent).join(',')).toContain('2,ANOTHER SIDE');
        });

        it('winning side from second round', async () => {
            const side1 = sideBuilder('SIDE 1').build();
            const anotherSide = sideBuilder('ANOTHER SIDE').build();
            const tournamentData = tournamentBuilder()
                .round((r: ITournamentRoundBuilder) => r
                    .withMatch((m: ITournamentMatchBuilder) => m
                        .sideA(side1, 2)
                        .sideB(anotherSide, 1))
                    .withMatchOption((o: IMatchOptionsBuilder) => o.numberOfLegs(3))
                    .round((r: ITournamentRoundBuilder) => r
                        .withMatch((m: ITournamentMatchBuilder) => m
                            .sideA(side1, 2)
                            .sideB(anotherSide, 1))
                        .withMatchOption((o: IMatchOptionsBuilder) => o.numberOfLegs(3))))
                .forSeason(season)
                .withSide(side1)
                .withSide(anotherSide)
                .build();

            await renderComponent(containerProps.withTournament(tournamentData).withAllPlayers([]).withAlreadyPlaying({}).build(), {
                disabled: true,
                saving: false,
                canSave: false,
            }, account);

            const playing = context.container.querySelector('div > div > div:nth-child(1)')!;
            expect(playing.textContent).toEqual('Playing:');
            const sides = context.container.querySelector('div > div > div:nth-child(3)')!;
            const winningSideCells = Array.from(sides.querySelectorAll('td.bg-winner'));
            expect(winningSideCells.length).toEqual(2);
            expect(winningSideCells.map(td => td.textContent).join(',')).toContain('SIDE 1,2');
        });
    });

    describe('interactivity', () => {
        const account: UserDto = {
            emailAddress: '',
            name: '',
            givenName: '',
            access: {
                manageTournaments: true,
            }
        };
        const season = seasonBuilder('SEASON').build();
        const division = divisionBuilder('DIVISION').build();
        const team1 = teamBuilder('TEAM 1').forSeason(season, division).build();
        const containerProps = new tournamentContainerPropsBuilder({
            season,
            setTournamentData,
        });

        it('can add a side', async () => {
            const existingSide = sideBuilder('SIDE 1').teamId(team1.id).build();
            const tournamentData = tournamentBuilder()
                .forSeason(season)
                .withSide(existingSide)
                .build();
            await renderComponent(containerProps.withTournament(tournamentData).withAlreadyPlaying({}).withAllPlayers([]).build(), {
                disabled: false,
                saving: false,
                canSave: true,
            }, account, [team1]);
            const playing = context.container.querySelector('div > div > div:nth-child(1)')!;
            expect(playing.textContent).toEqual('Playing:');
            const sides = context.container.querySelector('div > div > div:nth-child(2)')!;

            await doClick(findButton(sides, '➕'));
            const dialog = sides.querySelector('.modal-dialog')!;
            expect(dialog).toBeTruthy();
            await doSelectOption(dialog.querySelector('.dropdown-menu'), 'TEAM 1');
            await doClick(findButton(dialog, 'Add'));

            reportedError.verifyNoError();
            expect(updatedData!.sides).toEqual([existingSide, {
                id: expect.any(String),
                name: 'TEAM 1',
                teamId: team1.id,
            }]);
        });

        it('trims whitespace from end of new side name', async () => {
            const existingSide = sideBuilder('SIDE 1').teamId(team1.id).build();
            const tournamentData = tournamentBuilder()
                .forSeason(season)
                .withSide(existingSide)
                .build();
            await renderComponent(containerProps.withTournament(tournamentData).withAlreadyPlaying({}).withAllPlayers([]).build(), {
                disabled: false,
                saving: false,
                canSave: true,
            }, account, [team1]);
            const playing = context.container.querySelector('div > div > div:nth-child(1)')!;
            expect(playing.textContent).toEqual('Playing:');
            const sides = context.container.querySelector('div > div > div:nth-child(2)')!;

            await doClick(findButton(sides, '➕'));
            const dialog = sides.querySelector('.modal-dialog')!;
            expect(dialog).toBeTruthy();
            await doSelectOption(dialog.querySelector('.dropdown-menu'), 'TEAM 1');
            await doChange(dialog, 'input[name="name"]', 'NAME   ', context.user);
            await doClick(findButton(dialog, 'Add'));

            reportedError.verifyNoError();
            expect(updatedData!.sides).toEqual([{
                id: expect.any(String),
                name: 'NAME',
                teamId: team1.id,
            }, existingSide]);
        });

        it('can close add a side dialog', async () => {
            const tournamentData = tournamentBuilder()
                .forSeason(season)
                .withSide((s: ITournamentSideBuilder) => s.name('SIDE 1'))
                .build();
            await renderComponent(containerProps.withTournament(tournamentData).withAlreadyPlaying({}).withAllPlayers([]).build(), {
                disabled: false,
                saving: false,
                canSave: true,
            }, account, [team1]);
            const playing = context.container.querySelector('div > div > div:nth-child(1)')!;
            expect(playing.textContent).toEqual('Playing:');
            const sides = context.container.querySelector('div > div > div:nth-child(2)')!;

            await doClick(findButton(sides, '➕'));
            const dialog = sides.querySelector('.modal-dialog')!;
            expect(dialog).toBeTruthy();
            await doClick(findButton(dialog, 'Close'));

            reportedError.verifyNoError();
            expect(sides.querySelector('.modal-dialog')).toBeFalsy();
        });

        it('can close edit side dialog', async () => {
            const side = sideBuilder('SIDE 1').build();
            const tournamentData = tournamentBuilder()
                .forSeason(season)
                .withSide(side)
                .build();
            await renderComponent(containerProps.withTournament(tournamentData).withAlreadyPlaying({}).withAllPlayers([]).build(), {
                disabled: false,
                saving: false,
                canSave: true,
            }, account, [team1]);
            const playing = context.container.querySelector('div > div > div:nth-child(1)')!;
            expect(playing.textContent).toEqual('Playing:');
            const sides = context.container.querySelector('div > div > div:nth-child(2)')!;
            const sideElement = sides.querySelector('div');

            await doClick(findButton(sideElement, '✏️'));
            const dialog = sides.querySelector('.modal-dialog');
            expect(dialog).toBeTruthy();
            await doClick(findButton(dialog, 'Close'));

            reportedError.verifyNoError();
            expect(sides.querySelector('.modal-dialog')).toBeFalsy();
        });

        it('can remove a side', async () => {
            const side = sideBuilder('SIDE 1').build();
            const tournamentData = tournamentBuilder()
                .forSeason(season)
                .withSide(side)
                .build();
            await renderComponent(containerProps.withTournament(tournamentData).withAlreadyPlaying({}).withAllPlayers([]).build(), {
                disabled: false,
                saving: false,
                canSave: true,
            }, account, [team1]);
            const playing = context.container.querySelector('div > div > div:nth-child(1)')!;
            expect(playing.textContent).toEqual('Playing:');
            const sides = context.container.querySelector('div > div > div:nth-child(2)')!;
            const sideElement = sides.querySelector('div');
            context.prompts.respondToConfirm('Are you sure you want to remove SIDE 1?', true);

            await doClick(findButton(sideElement, '✏️'));
            const dialog = sides.querySelector('.modal-dialog');
            expect(dialog).toBeTruthy();
            await doClick(findButton(dialog, 'Delete side'));

            reportedError.verifyNoError();
            expect(updatedData!.sides).toEqual([]);
        });

        it('trims whitespace from end of edited side name', async () => {
            const side = sideBuilder('SIDE 1').teamId(team1.id).build();
            const tournamentData = tournamentBuilder()
                .forSeason(season)
                .withSide(side)
                .build();
            await renderComponent(containerProps.withTournament(tournamentData).withAlreadyPlaying({}).withAllPlayers([]).build(), {
                disabled: false,
                saving: false,
                canSave: true,
            }, account, [team1]);
            const playing = context.container.querySelector('div > div > div:nth-child(1)')!;
            expect(playing.textContent).toEqual('Playing:');
            const sides = context.container.querySelector('div > div > div:nth-child(2)')!;
            const sideElement = sides.querySelector('div')!;

            await doClick(findButton(sideElement, '✏️'));
            const dialog = sides.querySelector('.modal-dialog')!;
            expect(dialog).toBeTruthy();
            await doChange(sideElement, 'input[name="name"]', 'NEW SIDE 1   ', context.user);
            await doClick(findButton(dialog, 'Update'));

            reportedError.verifyNoError();
            expect(updatedData!.sides![0]).toEqual({
                id: side.id,
                name: 'NEW SIDE 1',
                teamId: team1.id,
                players: []
            });
        });

        it('excludes no-show sides from match selection', async () => {
            const side1 = sideBuilder('SIDE 1').teamId(team1.id).build();
            const side2 = sideBuilder('SIDE 2 (no show)').teamId(team1.id).noShow().build();
            const tournamentData = tournamentBuilder()
                .forSeason(season)
                .withSide(side1)
                .withSide(side2)
                .build();

            await renderComponent(containerProps.withTournament(tournamentData).withAlreadyPlaying({}).withAllPlayers([]).build(), {
                disabled: false,
                saving: false,
                canSave: true,
            }, account, [team1]);

            const rounds = context.container.querySelector('div > div > div.mt-3:nth-child(3)')!;
            const round1SideA = rounds.querySelector('table tbody tr:first-child td:nth-child(1)')!;
            const sideOptions = Array.from(round1SideA.querySelectorAll('.dropdown-menu .dropdown-item'));
            expect(sideOptions.map(o => o.textContent)).toEqual(['SIDE 1']);
        });
    });
});