import {act, fireEvent} from "@testing-library/react";
import {
    api,
    appProps,
    brandingProps,
    cleanUp, doChange, doClick, doSelectOption,
    ErrorState, findButton,
    iocProps, noop,
    renderApp,
    TestContext
} from "../../../helpers/tests";
import {IMasterDrawProps, MasterDraw} from "./MasterDraw";
import {renderDate} from "../../../helpers/rendering";
import {
    ITournamentBuilder,
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
import {AccessDto} from "../../../interfaces/models/dtos/Identity/AccessDto";
import {tournamentContainerPropsBuilder} from "../tournamentContainerPropsBuilder";
import {teamBuilder} from "../../../helpers/builders/teams";
import {TeamDto} from "../../../interfaces/models/dtos/Team/TeamDto";
import {seasonBuilder} from "../../../helpers/builders/seasons";
import {SeasonDto} from "../../../interfaces/models/dtos/Season/SeasonDto";

describe('MasterDraw', () => {
    let context: TestContext;
    let reportedError: ErrorState;
    let saygDeleted: { id: string, matchId: string } | null;
    let updatedTournament: { updated: TournamentGameDto, save?: boolean } | null = null;

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
        saygDeleted = null;
        updatedTournament = null;
    });

    async function setTournamentData(updated: TournamentGameDto, save?: boolean) {
        updatedTournament = { updated, save };
    }

    function user(access: AccessDto): UserDto {
        return {
            name: '',
            givenName: '',
            emailAddress: '',
            access,
        }
    }

    async function renderComponent(props: IMasterDrawProps, account?: UserDto, containerProps?: ITournamentContainerProps, teams?: TeamDto[], season?: SeasonDto) {
        context = await renderApp(
            iocProps({tournamentApi, saygApi}),
            brandingProps(),
            appProps({ account, teams: teams || [], season }, reportedError),
            (<TournamentContainer {...(containerProps ?? new tournamentContainerPropsBuilder().build())}>
                <MasterDraw {...props} />
            </TournamentContainer>));

        reportedError.verifyNoError();
    }

    describe('renders', () => {
        const season = seasonBuilder('SEASON').build();
        let tournament: ITournamentBuilder;

        beforeEach(() => {
            tournament = tournamentBuilder()
                .singleRound()
                .host('HOST')
                .opponent('OPPONENT')
                .gender('GENDER')
                .date('2025-05-06')
                .type('TYPE')
                .forSeason(season)
                .round((r: ITournamentRoundBuilder) => r);
        });

        it('matches', async () => {
            const match1 = tournamentMatchBuilder().sideA('A').sideB('B').build();
            const match2 = tournamentMatchBuilder().sideA('C').sideB('D').build();
            await renderComponent({
                tournamentData: tournament.round((r: ITournamentRoundBuilder) => r.withMatch(match1).withMatch(match2)).build(),
                readOnly: true,
                setTournamentData: noop,
                patchData: noop
            });

            const table = context.container.querySelector('table.table')!;
            const rows = Array.from(table.querySelectorAll('tbody tr'));
            expect(rows.length).toEqual(2);
            expect(Array.from(rows[0].querySelectorAll('td')).map(td => td.textContent)).toEqual(['1', 'A', 'v', 'B', '']);
            expect(Array.from(rows[1].querySelectorAll('td')).map(td => td.textContent)).toEqual(['2', 'C', 'v', 'D', '']);
        });

        it('tournament properties', async () => {
            await renderComponent({
                tournamentData: tournament.type('Board 1').build(),
                readOnly: true,
                setTournamentData: noop,
                patchData: noop
            });

            const tournamentProperties = context.container.querySelector('div.d-flex > div:nth-child(2)')!;
            expect(tournamentProperties.textContent).toContain('Gender: GENDER');
            expect(tournamentProperties.textContent).toContain('Date: ' + renderDate('2023-05-06'));
            expect(tournamentProperties.textContent).toContain('Notes: Board 1');
        });

        it('when no notes', async () => {
            await renderComponent({
                tournamentData: tournament.type(undefined!).build(),
                readOnly: true,
                setTournamentData: noop,
                patchData: noop
            });

            const tournamentProperties = context.container.querySelector('div.d-flex > div:nth-child(2)')!;
            expect(tournamentProperties.textContent).toContain('Gender: GENDER');
            expect(tournamentProperties.textContent).not.toContain('Notes:');
        });
    });

    describe('interactivity', () => {
        const season = seasonBuilder('SEASON').build();
        let tournament: ITournamentBuilder;

        beforeEach(() => {
            tournament = tournamentBuilder()
                .singleRound()
                .host('HOST')
                .opponent('OPPONENT')
                .gender('GENDER')
                .date('2025-05-06')
                .type('TYPE')
                .forSeason(season)
                .round((r: ITournamentRoundBuilder) => r);
        });

        it('can change type from printable sheet', async () => {
            await renderComponent({
                tournamentData: tournament.build(),
                readOnly: false,
                setTournamentData,
                patchData: noop
            });

            await doChange(context.container, 'input[name="type"]', 'NEW TYPE', context.user);

            reportedError.verifyNoError();
            expect(updatedTournament).not.toBeNull();
            expect(updatedTournament?.save).not.toEqual(true);
            expect(updatedTournament?.updated.type).toEqual('NEW TYPE');
        });

        it('saves type when caret leaves input', async () => {
            const updatableTournableData = tournament.build();
            async function inlineUpdateTournament(update: TournamentGameDto, save?: boolean) {
                Object.assign(updatableTournableData, update);
                await setTournamentData(update, save);
            }

            await renderComponent({
                tournamentData: updatableTournableData,
                readOnly: false,
                setTournamentData: inlineUpdateTournament,
                patchData: noop
            });

            await doChange(context.container, 'input[name="type"]', 'NEW TYPE', context.user);
            const input = context.container.querySelector('input[name="type"]')!;
            act(() => {
                fireEvent.blur(input, {});
            });

            reportedError.verifyNoError();
            expect(updatedTournament).not.toBeNull();
            expect(updatedTournament?.save).toEqual(true);
            expect(updatedTournament?.updated.type).toEqual('NEW TYPE');
        });

        it('can change gender from printable sheet', async () => {
            await renderComponent({
                tournamentData: tournament.build(),
                readOnly: false,
                setTournamentData,
                patchData: noop
            });

            await doSelectOption(context.container.querySelector('[datatype="gender"] .dropdown-menu'), 'Men');

            reportedError.verifyNoError();
            expect(updatedTournament).not.toBeNull();
            expect(updatedTournament?.save).toEqual(true);
            expect(updatedTournament?.updated.gender).toEqual('men');
        });

        it('can change host from printable sheet', async () => {
            const hostTeam = teamBuilder('HOST').forSeason(season).build();
            const opponentTeam = teamBuilder('OPPONENT').forSeason(season).build();
            const anotherTeam = teamBuilder('ANOTHER TEAM').forSeason(season).build();
            await renderComponent({
                tournamentData: tournament.build(),
                readOnly: false,
                setTournamentData,
                patchData: noop
            }, user({}), undefined, [ hostTeam, opponentTeam, anotherTeam ], season);

            await doSelectOption(context.container.querySelector('[datatype="host"] .dropdown-menu'), 'ANOTHER TEAM');

            reportedError.verifyNoError();
            expect(updatedTournament).not.toBeNull();
            expect(updatedTournament?.save).toEqual(true);
            expect(updatedTournament?.updated.host).toEqual('ANOTHER TEAM');
        });

        it('can change opponent from printable sheet', async () => {
            const hostTeam = teamBuilder('HOST').forSeason(season).build();
            const opponentTeam = teamBuilder('OPPONENT').forSeason(season).build();
            const anotherTeam = teamBuilder('ANOTHER TEAM').forSeason(season).build();
            await renderComponent({
                tournamentData: tournament.build(),
                readOnly: false,
                setTournamentData,
                patchData: noop
            }, user({}), undefined, [ hostTeam, opponentTeam, anotherTeam ], season);

            await doSelectOption(context.container.querySelector('[datatype="opponent"] .dropdown-menu'), 'ANOTHER TEAM');

            reportedError.verifyNoError();
            expect(updatedTournament).not.toBeNull();
            expect(updatedTournament?.save).toEqual(true);
            expect(updatedTournament?.updated.opponent).toEqual('ANOTHER TEAM');
        });

        it('can open sayg dialog when permitted', async () => {
            const match = tournamentMatchBuilder()
                .sideA('SIDE A')
                .sideB('SIDE B')
                .build();
            const tournamentData = tournament.round((r: ITournamentRoundBuilder) => r.withMatch(match)).build();
            const account = user({
                recordScoresAsYouGo: true,
            });
            const containerProps = new tournamentContainerPropsBuilder({ tournamentData });

            await renderComponent({
                tournamentData: tournamentData,
                readOnly: false,
                setTournamentData: noop,
                patchData: noop
            }, account, containerProps.build());

            await doClick(findButton(context.container.querySelector('div[datatype="master-draw"]'), START_SCORING));

            reportedError.verifyNoError();
            const dialog = context.container.querySelector('.modal-dialog');
            expect(dialog).toBeTruthy();
        });

        it('can delete sayg from match', async () => {
            const saygId = createTemporaryId();
            const match = tournamentMatchBuilder()
                .sideA('SIDE A')
                .sideB('SIDE B')
                .saygId(saygId)
                .build();
            const tournamentData = tournament.round((r: ITournamentRoundBuilder) => r.withMatch(match)).build();
            const account = user({
                recordScoresAsYouGo: true,
                showDebugOptions: true,
            });
            const containerProps = new tournamentContainerPropsBuilder({ tournamentData });

            await renderComponent({
                tournamentData: tournamentData,
                readOnly: false,
                setTournamentData: noop,
                patchData: noop
            }, account, containerProps.build());
            await doClick(findButton(context.container.querySelector('div[datatype="master-draw"]'), START_SCORING));
            reportedError.verifyNoError();
            const dialog = context.container.querySelector('.modal-dialog');
            context.prompts.respondToConfirm('Are you sure you want to delete the sayg data for this match?', true);
            context.prompts.respondToConfirm('Clear match score (to allow scores to be re-recorded?)', true);

            await doClick(findButton(dialog, 'Delete sayg'));

            reportedError.verifyNoError();
            expect(saygDeleted).toEqual({
                id: tournamentData.id,
                matchId: match.id,
            })
        });
    });
});
