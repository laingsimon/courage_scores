import {
    appProps,
    brandingProps,
    cleanUp, doChange, doClick,
    ErrorState, findButton,
    iocProps,
    renderApp,
    TestContext
} from "../../../helpers/tests";
import {IMasterDrawProps, MasterDraw} from "./MasterDraw";
import {renderDate} from "../../../helpers/rendering";
import {tournamentBuilder, tournamentMatchBuilder} from "../../../helpers/builders/tournaments";
import {ITournamentContainerProps, TournamentContainer} from "../TournamentContainer";
import {TournamentGameDto} from "../../../interfaces/models/dtos/Game/TournamentGameDto";

describe('MasterDraw', () => {
    let context: TestContext;
    let reportedError: ErrorState;
    let updatedTournament: TournamentGameDto;
    let editTournament: boolean;

    afterEach(() => {
        cleanUp(context);
    });

    beforeEach(() => {
        reportedError = new ErrorState();
        updatedTournament = null;
        editTournament = null;
    });

    async function setEditTournament(value: boolean) {
        editTournament = value;
    }

    async function setTournamentData(update: TournamentGameDto) {
        updatedTournament = update;
    }

    async function renderComponent(props: IMasterDrawProps, containerProps: ITournamentContainerProps) {
        context = await renderApp(
            iocProps(),
            brandingProps(),
            appProps({}, reportedError),
            (<TournamentContainer {...containerProps}>
                <MasterDraw {...props} />
            </TournamentContainer>));
    }

    describe('renders', () => {
        const defaultContainerProps: ITournamentContainerProps = {
            tournamentData: null,
            setEditTournament: null,
            setTournamentData: null,
        };

        it('matches', async () => {
            const match1 = tournamentMatchBuilder().sideA('A').sideB('B').build();
            const match2 = tournamentMatchBuilder().sideA('C').sideB('D').build();
            const matches = [match1, match2];

            await renderComponent({
                matches: matches,
                host: 'HOST',
                opponent: 'OPPONENT',
                gender: 'GENDER',
                date: '2023-05-06',
                notes: 'NOTES',
            }, defaultContainerProps);

            reportedError.verifyNoError();
            const table = context.container.querySelector('table.table');
            const rows = Array.from(table.querySelectorAll('tbody tr'));
            expect(rows.length).toEqual(2);
            expect(Array.from(rows[0].querySelectorAll('td')).map(td => td.textContent)).toEqual(['1', 'A', 'v', 'B']);
            expect(Array.from(rows[1].querySelectorAll('td')).map(td => td.textContent)).toEqual(['2', 'C', 'v', 'D']);
        });

        it('tournament properties', async () => {
            await renderComponent({
                matches: [],
                host: 'HOST',
                opponent: 'OPPONENT',
                gender: 'GENDER',
                date: '2023-05-06',
                notes: 'NOTES',
            }, defaultContainerProps);

            reportedError.verifyNoError();
            const tournamentProperties = context.container.querySelector('div.d-flex > div:nth-child(2)');
            expect(tournamentProperties.textContent).toContain('Gender: GENDER');
            expect(tournamentProperties.textContent).toContain('Date: ' + renderDate('2023-05-06'));
            expect(tournamentProperties.textContent).toContain('Notes: NOTES');
        });

        it('when no notes', async () => {
            await renderComponent({
                matches: [],
                host: 'HOST',
                opponent: 'OPPONENT',
                gender: 'GENDER',
                date: '2023-05-06',
                notes: '',
            }, defaultContainerProps);

            reportedError.verifyNoError();
            const tournamentProperties = context.container.querySelector('div.d-flex > div:nth-child(2)');
            expect(tournamentProperties.textContent).toContain('Gender: GENDER');
            expect(tournamentProperties.textContent).not.toContain('Notes:');
        });
    });

    describe('interactivity', () => {
        it('can edit tournament from heading', async () => {
            await renderComponent({
                matches: [],
                host: 'HOST',
                opponent: 'OPPONENT',
                gender: 'GENDER',
                date: '2023-05-06',
                notes: 'NOTES',
            }, {
                setEditTournament,
                tournamentData: null,
            });
            reportedError.verifyNoError();

            await doClick(context.container.querySelector('div[datatype="master-draw"] > h2'));

            reportedError.verifyNoError();
            expect(editTournament).toEqual(true);
        });

        it('can edit tournament from table of players', async () => {
            await renderComponent({
                matches: [],
                host: 'HOST',
                opponent: 'OPPONENT',
                gender: 'GENDER',
                date: '2023-05-06',
                notes: 'NOTES',
            }, {
                setEditTournament,
                tournamentData: null,
            });
            reportedError.verifyNoError();

            await doClick(context.container.querySelector('div[datatype="master-draw"] > div'));

            reportedError.verifyNoError();
            expect(editTournament).toEqual(true);
        });

        it('can close edit tournament dialog', async () => {
            await renderComponent({
                matches: [],
                host: 'HOST',
                opponent: 'OPPONENT',
                gender: 'GENDER',
                date: '2023-05-06',
                notes: 'NOTES',
            }, {
                setEditTournament,
                tournamentData: tournamentBuilder().build(),
                editTournament: true,
            });
            reportedError.verifyNoError();

            const dialog = context.container.querySelector('.modal-dialog');
            await doClick(findButton(dialog, 'Close'));

            reportedError.verifyNoError();
            expect(editTournament).toEqual(false);
        });

        it('can edit tournament details', async () => {
            await renderComponent({
                matches: [],
                host: 'HOST',
                opponent: 'OPPONENT',
                gender: 'GENDER',
                date: '2023-05-06',
                notes: 'NOTES',
            }, {
                setEditTournament,
                tournamentData: tournamentBuilder().build(),
                editTournament: true,
                setTournamentData,
            });
            reportedError.verifyNoError();

            const dialog = context.container.querySelector('.modal-dialog');
            await doChange(dialog, 'input[name="address"]', 'NEW ADDRESS', context.user);

            reportedError.verifyNoError();
            expect(updatedTournament.address).toEqual('NEW ADDRESS');
        });

        it('cannot edit tournament from heading when not permitted', async () => {
            await renderComponent({
                matches: [],
                host: 'HOST',
                opponent: 'OPPONENT',
                gender: 'GENDER',
                date: '2023-05-06',
                notes: 'NOTES',
            }, {
                setEditTournament: null,
                tournamentData: null,
            });
            reportedError.verifyNoError();

            await doClick(context.container.querySelector('div[datatype="master-draw"] > h2'));

            reportedError.verifyNoError();
            expect(editTournament).toEqual(null);
        });

        it('cannot edit tournament from table of players when not permitted', async () => {
            await renderComponent({
                matches: [],
                host: 'HOST',
                opponent: 'OPPONENT',
                gender: 'GENDER',
                date: '2023-05-06',
                notes: 'NOTES',
            }, {
                setEditTournament: null,
                tournamentData: null,
            });
            reportedError.verifyNoError();

            await doClick(context.container.querySelector('div[datatype="master-draw"] > div'));

            reportedError.verifyNoError();
            expect(editTournament).toEqual(null);
        });
    });
});