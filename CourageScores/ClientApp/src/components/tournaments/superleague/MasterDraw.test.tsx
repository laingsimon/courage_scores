import {
    api,
    appProps,
    brandingProps,
    cleanUp, doClick,
    ErrorState, findButton,
    iocProps,
    renderApp,
    TestContext
} from "../../../helpers/tests";
import {IMasterDrawProps, MasterDraw} from "./MasterDraw";
import {renderDate} from "../../../helpers/rendering";
import {
    ITournamentMatchBuilder,
    ITournamentRoundBuilder,
    tournamentBuilder,
    tournamentMatchBuilder
} from "../../../helpers/builders/tournaments";
import {ITournamentContainerProps, TournamentContainer} from "../TournamentContainer";
import {UserDto} from "../../../interfaces/models/dtos/Identity/UserDto";
import {TournamentGameDto} from "../../../interfaces/models/dtos/Game/TournamentGameDto";
import {ITournamentGameApi} from "../../../interfaces/apis/ITournamentGameApi";
import {EditTournamentGameDto} from "../../../interfaces/models/dtos/Game/EditTournamentGameDto";
import {IClientActionResultDto} from "../../common/IClientActionResultDto";
import {CreateTournamentSaygDto} from "../../../interfaces/models/dtos/Game/CreateTournamentSaygDto";
import {createTemporaryId} from "../../../helpers/projection";
import {ISaygApi} from "../../../interfaces/apis/ISaygApi";
import {RecordedScoreAsYouGoDto} from "../../../interfaces/models/dtos/Game/Sayg/RecordedScoreAsYouGoDto";
import {saygBuilder} from "../../../helpers/builders/sayg";
import {START_SCORING} from "../tournaments";
import {tournamentContainerPropsBuilder} from "../tournamentContainerPropsBuilder";

describe('MasterDraw', () => {
    let context: TestContext;
    let reportedError: ErrorState;
    let editTournament: string | null;
    let saygDeleted: { id: string, matchId: string } | null;

    const tournamentApi = api<ITournamentGameApi>({
        async update(_: EditTournamentGameDto): Promise<IClientActionResultDto<TournamentGameDto>> {
            return {
                success: true,
            };
        },
        async addSayg(_: string, __: CreateTournamentSaygDto): Promise<IClientActionResultDto<TournamentGameDto>> {
            return {
                success: true,
            };
        },
        async deleteSayg(id: string, matchId: string): Promise<IClientActionResultDto<TournamentGameDto>> {
            saygDeleted = { id, matchId };
            return {
                success: true,
                result: tournamentBuilder()
                    .round((r: ITournamentRoundBuilder) => r
                        .withMatch((m: ITournamentMatchBuilder) => m))
                    .build(),
            }
        }
    });
    const saygApi = api<ISaygApi>({
        async get(id: string): Promise<RecordedScoreAsYouGoDto | null> {
            return saygBuilder(id).build();
        }
    });

    afterEach(async () => {
        await cleanUp(context);
    });

    beforeEach(() => {
        reportedError = new ErrorState();
        editTournament = null;
        saygDeleted = null;
    });

    async function setEditTournament(value: string) {
        editTournament = value;
    }

    async function renderComponent(props: IMasterDrawProps, containerProps: ITournamentContainerProps, account?: UserDto) {
        context = await renderApp(
            iocProps({tournamentApi, saygApi}),
            brandingProps(),
            appProps({ account }, reportedError),
            (<TournamentContainer {...containerProps}>
                <MasterDraw {...props} />
            </TournamentContainer>));

        reportedError.verifyNoError();
    }

    describe('renders', () => {
        const containerProps = new tournamentContainerPropsBuilder({ setEditTournament });

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
                type: 'TYPE',
            }, containerProps.build());

            const table = context.container.querySelector('table.table')!;
            const rows = Array.from(table.querySelectorAll('tbody tr'));
            expect(rows.length).toEqual(2);
            expect(Array.from(rows[0].querySelectorAll('td')).map(td => td.textContent)).toEqual(['1', 'A', 'v', 'B', '']);
            expect(Array.from(rows[1].querySelectorAll('td')).map(td => td.textContent)).toEqual(['2', 'C', 'v', 'D', '']);
        });

        it('tournament properties', async () => {
            await renderComponent({
                matches: [],
                host: 'HOST',
                opponent: 'OPPONENT',
                gender: 'GENDER',
                date: '2023-05-06',
                type: 'Board 1',
            }, containerProps.build());

            const tournamentProperties = context.container.querySelector('div.d-flex > div:nth-child(2)')!;
            expect(tournamentProperties.textContent).toContain('Gender: GENDER');
            expect(tournamentProperties.textContent).toContain('Date: ' + renderDate('2023-05-06'));
            expect(tournamentProperties.textContent).toContain('Notes: Board 1');
        });

        it('when no notes', async () => {
            await renderComponent({
                matches: [],
                host: 'HOST',
                opponent: 'OPPONENT',
                gender: 'GENDER',
                date: '2023-05-06',
                type: '',
            }, containerProps.build());

            const tournamentProperties = context.container.querySelector('div.d-flex > div:nth-child(2)')!;
            expect(tournamentProperties.textContent).toContain('Gender: GENDER');
            expect(tournamentProperties.textContent).not.toContain('Notes:');
        });
    });

    describe('interactivity', () => {
        const containerProps = new tournamentContainerPropsBuilder({ setEditTournament })

        it('can edit tournament from heading', async () => {
            await renderComponent({
                matches: [],
                host: 'HOST',
                opponent: 'OPPONENT',
                gender: 'GENDER',
                date: '2023-05-06',
                type: 'TYPE',
            }, containerProps.build());

            await doClick(context.container.querySelector('div[datatype="master-draw"] > h2')!);

            reportedError.verifyNoError();
            expect(editTournament).toEqual('matches');
        });

        it('can edit tournament from table of players header', async () => {
            await renderComponent({
                matches: [],
                host: 'HOST',
                opponent: 'OPPONENT',
                gender: 'GENDER',
                date: '2023-05-06',
                type: 'TYPE',
            }, containerProps.build());

            await doClick(context.container.querySelector('div[datatype="master-draw"] thead tr:first-child')!);

            reportedError.verifyNoError();
            expect(editTournament).toEqual('matches');
        });

        it('can edit tournament from table of players row (player number)', async () => {
            const match = tournamentMatchBuilder()
                .sideA('SIDE A')
                .sideB('SIDE B')
                .build();
            await renderComponent({
                matches: [match],
                host: 'HOST',
                opponent: 'OPPONENT',
                gender: 'GENDER',
                date: '2023-05-06',
                type: 'TYPE',
            }, containerProps.build());

            await doClick(context.container.querySelector('div[datatype="master-draw"] tbody td:nth-child(1)')!);

            reportedError.verifyNoError();
            expect(editTournament).toEqual('matches');
        });

        it('can edit tournament from table of players row (side A)', async () => {
            const match = tournamentMatchBuilder()
                .sideA('SIDE A')
                .sideB('SIDE B')
                .build();
            await renderComponent({
                matches: [match],
                host: 'HOST',
                opponent: 'OPPONENT',
                gender: 'GENDER',
                date: '2023-05-06',
                type: 'TYPE',
            }, containerProps.build());

            await doClick(context.container.querySelector('div[datatype="master-draw"] tbody tr:first-child td:nth-child(2)')!);

            reportedError.verifyNoError();
            expect(editTournament).toEqual('matches');
        });

        it('can edit tournament from table of players row (vs)', async () => {
            const match = tournamentMatchBuilder()
                .sideA('SIDE A')
                .sideB('SIDE B')
                .build();
            await renderComponent({
                matches: [match],
                host: 'HOST',
                opponent: 'OPPONENT',
                gender: 'GENDER',
                date: '2023-05-06',
                type: 'TYPE',
            }, containerProps.build());

            await doClick(context.container.querySelector('div[datatype="master-draw"] tbody tr:first-child td:nth-child(3)')!);

            reportedError.verifyNoError();
            expect(editTournament).toEqual('matches');
        });

        it('can edit tournament from table of players row (side B)', async () => {
            const match = tournamentMatchBuilder()
                .sideA('SIDE A')
                .sideB('SIDE B')
                .build();
            await renderComponent({
                matches: [match],
                host: 'HOST',
                opponent: 'OPPONENT',
                gender: 'GENDER',
                date: '2023-05-06',
                type: 'TYPE',
            }, containerProps.build());

            await doClick(context.container.querySelector('div[datatype="master-draw"] tbody tr:first-child td:nth-child(4)')!);

            reportedError.verifyNoError();
            expect(editTournament).toEqual('matches');
        });

        it('can edit tournament from table of players footer', async () => {
            await renderComponent({
                matches: [],
                host: 'HOST',
                opponent: 'OPPONENT',
                gender: 'GENDER',
                date: '2023-05-06',
                type: 'TYPE',
            }, containerProps.build());

            await doClick(context.container.querySelector('div[datatype="master-draw"] tfoot td')!);

            reportedError.verifyNoError();
            expect(editTournament).toEqual('matches');
        });

        it('can edit tournament from tournament details', async () => {
            await renderComponent({
                matches: [],
                host: 'HOST',
                opponent: 'OPPONENT',
                gender: 'GENDER',
                date: '2023-05-06',
                type: 'TYPE',
            }, containerProps.build());

            await doClick(context.container.querySelector('div[datatype="details"]')!);

            reportedError.verifyNoError();
            expect(editTournament).toEqual('details');
        });

        it('cannot edit tournament from heading when not permitted', async () => {
            const readonlyContainerProps = containerProps.withTournament(tournamentBuilder().singleRound().build()).build();
            readonlyContainerProps.setEditTournament = undefined;
            await renderComponent({
                matches: [],
                host: 'HOST',
                opponent: 'OPPONENT',
                gender: 'GENDER',
                date: '2023-05-06',
                type: 'TYPE',
            }, readonlyContainerProps);

            await doClick(context.container.querySelector('div[datatype="master-draw"] > h2')!);

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
                type: 'TYPE',
            }, containerProps.build());

            await doClick(context.container.querySelector('div[datatype="master-draw"] > div')!);

            reportedError.verifyNoError();
            // TODO: This test might not be working correctly, i'd expect `editTournament` to be set, as `setEditTournament` is provided
            expect(editTournament).toEqual(null);
        });

        it('can open sayg dialog when permitted', async () => {
            const match = tournamentMatchBuilder()
                .sideA('SIDE A')
                .sideB('SIDE B')
                .build();
            const account: UserDto = {
                name: '',
                givenName: '',
                emailAddress: '',
                access: {
                    recordScoresAsYouGo: true,
                },
            }
            await renderComponent({
                matches: [match],
                host: 'HOST',
                opponent: 'OPPONENT',
                gender: 'GENDER',
                date: '2023-05-06',
                type: 'TYPE',
            }, containerProps
                .withTournament(tournamentBuilder().singleRound().build()).build(), account);

            await doClick(findButton(context.container.querySelector('div[datatype="master-draw"]'), START_SCORING));

            reportedError.verifyNoError();
            const dialog = context.container.querySelector('.modal-dialog');
            expect(dialog).toBeTruthy();
        });

        it('can delete sayg from match', async () => {
            const saygId = createTemporaryId();
            const tournamentId = createTemporaryId();
            const match = tournamentMatchBuilder()
                .sideA('SIDE A')
                .sideB('SIDE B')
                .saygId(saygId)
                .build();
            const account: UserDto = {
                name: '',
                givenName: '',
                emailAddress: '',
                access: {
                    recordScoresAsYouGo: true,
                    showDebugOptions: true,
                },
            }
            await renderComponent({
                matches: [match],
                host: 'HOST',
                opponent: 'OPPONENT',
                gender: 'GENDER',
                date: '2023-05-06',
                type: 'TYPE',
            }, containerProps
                .withTournament(tournamentBuilder(tournamentId)
                    .round((r: ITournamentRoundBuilder) => r.withMatch(match))
                    .singleRound()
                    .build())
                .build(), account);
            await doClick(findButton(context.container.querySelector('div[datatype="master-draw"]'), START_SCORING));
            reportedError.verifyNoError();
            const dialog = context.container.querySelector('.modal-dialog');
            context.prompts.respondToConfirm('Are you sure you want to delete the sayg data for this match?', true);
            context.prompts.respondToConfirm('Clear match score (to allow scores to be re-recorded?)', true);

            await doClick(findButton(dialog, 'Delete sayg'));

            reportedError.verifyNoError();
            expect(saygDeleted).toEqual({
                id: tournamentId,
                matchId: match.id,
            })
        });
    });
});