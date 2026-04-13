import {
    api,
    appProps,
    brandingProps,
    cleanUp,
    ErrorState,
    IComponent,
    iocProps,
    noop,
    renderApp,
    TestContext,
} from '../../helpers/tests';
import { createTemporaryId } from '../../helpers/projection';
import {
    DivisionDataContainer,
    IDivisionDataContainerProps,
} from '../league/DivisionDataContainer';
import {
    ITournamentFixtureProps,
    TournamentFixture,
} from './TournamentFixture';
import { IClientActionResultDto } from '../common/IClientActionResultDto';
import { TournamentGameDto } from '../../interfaces/models/dtos/Game/TournamentGameDto';
import { UserDto } from '../../interfaces/models/dtos/Identity/UserDto';
import { TeamDto } from '../../interfaces/models/dtos/Team/TeamDto';
import { SeasonDto } from '../../interfaces/models/dtos/Season/SeasonDto';
import { DivisionDto } from '../../interfaces/models/dtos/DivisionDto';
import { DivisionPlayerDto } from '../../interfaces/models/dtos/Division/DivisionPlayerDto';
import { TournamentPlayerDto } from '../../interfaces/models/dtos/Game/TournamentPlayerDto';
import {
    sideBuilder,
    tournamentBuilder,
} from '../../helpers/builders/tournaments';
import { teamBuilder } from '../../helpers/builders/teams';
import { seasonBuilder } from '../../helpers/builders/seasons';
import { divisionBuilder } from '../../helpers/builders/divisions';
import { playerBuilder } from '../../helpers/builders/players';
import { ITournamentGameApi } from '../../interfaces/apis/ITournamentGameApi';
import { IPreferenceData } from '../common/PreferencesContainer';

describe('TournamentFixture', () => {
    let context: TestContext;
    let reportedError: ErrorState;
    let tournamentChanged: boolean;
    let deletedId: string | null;
    let apiResponse: IClientActionResultDto<TournamentGameDto> | null;

    const tournamentApi = api<ITournamentGameApi>({
        delete: async (id: string) => {
            deletedId = id;
            return apiResponse || { success: true };
        },
    });

    async function onTournamentChanged() {
        tournamentChanged = true;
    }

    async function onReloadDivision() {
        return null;
    }

    afterEach(async () => {
        await cleanUp(context);
    });

    beforeEach(() => {
        reportedError = new ErrorState();
        tournamentChanged = false;
        deletedId = null;
        apiResponse = null;
    });

    async function renderComponent(
        props: ITournamentFixtureProps,
        divisionData: IDivisionDataContainerProps,
        account?: UserDto,
        teams?: TeamDto[],
        preferenceData?: IPreferenceData,
    ) {
        context = await renderApp(
            iocProps({ tournamentApi }),
            brandingProps(),
            appProps(
                {
                    account,
                    teams: teams || [],
                },
                reportedError,
            ),
            <DivisionDataContainer {...divisionData}>
                <TournamentFixture {...props} />
            </DivisionDataContainer>,
            undefined,
            undefined,
            'tbody',
            preferenceData,
        );
    }

    describe('when logged out', () => {
        const season: SeasonDto = seasonBuilder('SEASON').build();
        const division: DivisionDto = divisionBuilder('DIVISION').build();
        const player: DivisionPlayerDto = playerBuilder('PLAYER').build();
        const account: UserDto | undefined = undefined;

        function assertPlayerDisplayWithPlayerLinks(
            playersCell: IComponent,
            ordinal: number,
            players: TournamentPlayerDto[],
        ) {
            const side = playersCell.required(
                `div.px-3 > div:nth-child(${ordinal})`,
            );

            assertPlayersAndLinks(side, players);
        }

        function assertPlayerDisplayWithSideNameAndTeamLink(
            playersCell: IComponent,
            ordinal: number,
            sideName: string,
            teamId: string,
            players: TournamentPlayerDto[],
        ) {
            const side = playersCell.required(
                `div.px-3 > div:nth-child(${ordinal})`,
            );

            assertSideNameAndLink(
                side,
                sideName,
                `http://localhost/division/${division.name}/team:${encodeURI(teamId)}/${season.name}`,
            );
            assertPlayersAndLinks(side, players);
        }

        function assertSinglePlayerDisplay(
            playersCell: IComponent,
            ordinal: number,
            _: string,
            player: TournamentPlayerDto,
        ) {
            const side = playersCell.required(
                `div.px-3 > div:nth-child(${ordinal})`,
            );

            assertPlayersAndLinks(side, [player]);
        }

        function assertSideNameAndLink(
            side: IComponent,
            sideName: string,
            href: string,
        ) {
            const link = side.required('a');
            expect(link.text()).toEqual(sideName);
            expect(link.element<HTMLAnchorElement>().href).toEqual(href);
        }

        function assertPlayersAndLinks(
            side: IComponent,
            players: TournamentPlayerDto[],
        ) {
            const links = side.all('label a');
            expect(links.length).toEqual(players.length);
            players.forEach((player: { name: string }, index: number) => {
                const link = links[index];
                expect(link.text()).toEqual(player.name);
                expect(link.element<HTMLAnchorElement>().href).toEqual(
                    `http://localhost/division/${division.name}/player:${encodeURI(player.name)}/${season.name}`,
                );
            });
        }

        it('renders unplayed tournament', async () => {
            const tournament = tournamentBuilder()
                .date('2023-05-06T00:00:00')
                .address('ADDRESS')
                .type('TYPE')
                .build();
            await renderComponent(
                { tournament, expanded: false, onTournamentChanged },
                {
                    id: division.id,
                    season,
                    players: [player],
                    onReloadDivision,
                    name: '',
                    setDivisionData: noop,
                },
                account,
            );

            reportedError.verifyNoError();
            const cells = context.all('td');
            const cellText = cells.map((td) => td.text());
            expect(cellText).toEqual(['TYPE at ADDRESS']);
        });

        it('renders superleague tournament with opponent', async () => {
            const tournament = tournamentBuilder()
                .singleRound()
                .opponent('OPPONENT')
                .date('2023-05-06T00:00:00')
                .address('ADDRESS')
                .type('TYPE')
                .build();
            await renderComponent(
                { tournament, expanded: false, onTournamentChanged },
                {
                    id: division.id,
                    season,
                    players: [player],
                    onReloadDivision,
                    name: '',
                    setDivisionData: noop,
                },
                account,
            );

            reportedError.verifyNoError();
            const cells = context.all('td');
            const cellText = cells.map((td) => td.text());
            expect(cellText).toEqual(['TYPE atADDRESSvsOPPONENT']);
        });

        it('renders tournament won', async () => {
            const sideId = createTemporaryId();
            const tournament = tournamentBuilder()
                .date('2023-05-06T00:00:00')
                .address('ADDRESS')
                .type('TYPE')
                .withSide((s) => s.name('WINNER').id(sideId))
                .winner('WINNER', sideId)
                .build();
            await renderComponent(
                { tournament, expanded: false, onTournamentChanged },
                {
                    id: division.id,
                    season,
                    players: [player],
                    onReloadDivision,
                    name: '',
                    setDivisionData: noop,
                },
                account,
            );

            reportedError.verifyNoError();
            const cells = context.all('td');
            const cellText = cells.map((td) => td.text());
            expect(cellText).toEqual(['TYPE at ADDRESS', 'Winner: WINNER']);
        });

        it('renders tournament won by team', async () => {
            const team = teamBuilder('TEAM').build();
            const sideId = createTemporaryId();
            const tournament = tournamentBuilder()
                .date('2023-05-06T00:00:00')
                .address('ADDRESS')
                .type('TYPE')
                .withSide((s) => s.name('WINNER').id(sideId).teamId(team.id))
                .winner('WINNER', sideId, team.id)
                .build();
            await renderComponent(
                { tournament, expanded: false, onTournamentChanged },
                {
                    id: division.id,
                    name: division.name,
                    season,
                    players: [player],
                    onReloadDivision,
                    setDivisionData: noop,
                },
                account,
                [team],
            );

            reportedError.verifyNoError();
            const cells = context.all('td');
            const cellText = cells.map((td) => td.text());
            expect(cellText).toEqual(['TYPE at ADDRESS', 'Winner: WINNER']);
            const linkToTeam = cells[1].required('a');
            expect(linkToTeam.text()).toEqual('WINNER');
            expect(linkToTeam.element<HTMLAnchorElement>().href).toEqual(
                `http://localhost/division/${division.name}/team:${encodeURI(team.name)}/${season.name}`,
            );
        });

        it('renders tournament won by team (when team not found)', async () => {
            const team = teamBuilder('TEAM').build();
            const sideId = createTemporaryId();
            const tournament = tournamentBuilder()
                .date('2023-05-06T00:00:00')
                .address('ADDRESS')
                .type('TYPE')
                .withSide((s) => s.name('WINNER').id(sideId).teamId(team.id))
                .winner('WINNER', sideId)
                .build();
            await renderComponent(
                { tournament, expanded: false, onTournamentChanged },
                {
                    id: division.id,
                    name: division.name,
                    season,
                    players: [player],
                    onReloadDivision,
                    setDivisionData: noop,
                },
                account,
                [],
            );

            reportedError.verifyNoError();
            const cells = context.all('td');
            const cellText = cells.map((td) => td.text());
            expect(cellText).toEqual(['TYPE at ADDRESS', 'Winner: WINNER']);
            expect(cells[1].optional('a')).toBeFalsy();
        });

        it('renders who is playing', async () => {
            const tournament = tournamentBuilder()
                .address('ADDRESS')
                .withSide((b) => b.name('SIDE 1').withPlayer('PLAYER 1'))
                .withSide((b) =>
                    b
                        .name('SIDE 2')
                        .withPlayer('PLAYER 2')
                        .withPlayer('PLAYER 3')
                        .teamId(createTemporaryId()),
                )
                .withSide((b) =>
                    b
                        .name('PLAYER 4, PLAYER 5')
                        .withPlayer('PLAYER 4')
                        .withPlayer('PLAYER 5'),
                )
                .withSide((b) =>
                    b
                        .name('WITH DIFFERENT NAME TO PLAYER NAMES')
                        .withPlayer('PLAYER 6')
                        .withPlayer('PLAYER 7'),
                )
                .type('TYPE')
                .build();
            await renderComponent(
                { tournament, expanded: true, onTournamentChanged },
                {
                    id: division.id,
                    name: division.name,
                    season,
                    players: tournament.sides!.flatMap(
                        (s) => s.players!,
                    ) as DivisionPlayerDto[],
                    onReloadDivision,
                    setDivisionData: noop,
                },
                account,
            );

            reportedError.verifyNoError();
            const playersCell = context.required('td:first-child');
            assertPlayerDisplayWithPlayerLinks(
                playersCell,
                1,
                tournament.sides!.find((s) => s.name === 'PLAYER 4, PLAYER 5')
                    ?.players!,
            );
            assertSinglePlayerDisplay(
                playersCell,
                2,
                'SIDE 1',
                tournament.sides!.find((s) => s.name === 'SIDE 1')
                    ?.players![0]!,
            );
            assertPlayerDisplayWithSideNameAndTeamLink(
                playersCell,
                3,
                'SIDE 2',
                tournament.sides!.find((s) => s.name === 'SIDE 2')!.teamId!,
                [],
            );
            assertPlayerDisplayWithPlayerLinks(
                playersCell,
                4,
                tournament.sides!.find(
                    (s) => s.name === 'WITH DIFFERENT NAME TO PLAYER NAMES',
                )?.players!,
            );
        });

        it('renders who is playing for superleague tournaments', async () => {
            const side1 = sideBuilder('PLAYER 1').build();
            const side2 = sideBuilder('PLAYER 2').build();
            const side3 = sideBuilder('PLAYER 3').build();
            const side4 = sideBuilder('PLAYER 4').build();
            const tournament = tournamentBuilder()
                .address('ADDRESS')
                .withSide((b) => b.name('PLAYER 1'))
                .withSide((b) => b.name('PLAYER 2'))
                .withSide((b) => b.name('PLAYER 3'))
                .withSide((b) => b.name('PLAYER 4'))
                .withFirstRoundMatch(
                    (m) => m.sideA(side1, 2).sideB(side2, 4),
                    (m) => m.sideA(side3, 4).sideB(side4, 2),
                )
                .type('SUPERLEAGUE')
                .singleRound()
                .build();
            await renderComponent(
                { tournament, expanded: true, onTournamentChanged },
                {
                    id: division.id,
                    name: division.name,
                    season,
                    players: [],
                    onReloadDivision,
                    setDivisionData: noop,
                },
                account,
            );

            reportedError.verifyNoError();
            const playersCell = context.required('td:first-child');
            const superleaguePlayers = playersCell.required(
                'div[datatype="superleague-players"]',
            );
            expect(
                superleaguePlayers.required('a').element<HTMLAnchorElement>()
                    .href,
            ).toEqual(`http://localhost/tournament/${tournament.id}`);
            const matches = superleaguePlayers.all('a > div');
            expect(matches.length).toEqual(2);
            expect(matches[0].all('div').map((d) => d.text())).toEqual([
                'PLAYER 1',
                '2',
                '-',
                '4',
                'PLAYER 2',
            ]);
            expect(matches[1].all('div').map((d) => d.text())).toEqual([
                'PLAYER 3',
                '4',
                '-',
                '2',
                'PLAYER 4',
            ]);
        });

        it('shades team tournament if favourites defined and tournament does not have favourite team playing', async () => {
            const teamId = createTemporaryId();
            const tournament = tournamentBuilder()
                .address('ADDRESS')
                .withSide((b) => b.teamId(teamId).name('SIDE 1'))
                .type('TYPE')
                .build();
            await renderComponent(
                { tournament, expanded: true, onTournamentChanged },
                {
                    id: division.id,
                    name: division.name,
                    season,
                    players: [],
                    onReloadDivision,
                    setDivisionData: noop,
                    favouritesEnabled: true,
                },
                account,
                undefined,
                {
                    favouriteTeamIds: ['1234'],
                },
            );

            reportedError.verifyNoError();
            const tr = context.required('tr');
            expect(tr.className()).toContain('opacity-25');
        });

        it('does not shade non-team tournament if favourites defined and tournament does not have favourite team playing', async () => {
            const tournament = tournamentBuilder()
                .address('ADDRESS')
                .withSide((b) => b.name('SIDE 1'))
                .type('TYPE')
                .build();
            await renderComponent(
                { tournament, expanded: true, onTournamentChanged },
                {
                    id: division.id,
                    name: division.name,
                    season,
                    players: [],
                    onReloadDivision,
                    setDivisionData: noop,
                    favouritesEnabled: true,
                },
                account,
                undefined,
                {
                    favouriteTeamIds: ['1234'],
                },
            );

            reportedError.verifyNoError();
            const tr = context.required('tr');
            expect(tr.className()).not.toContain('opacity-25');
        });

        it('does not shade team tournament if favourites defined and tournament has favourite team playing', async () => {
            const teamId = createTemporaryId();
            const tournament = tournamentBuilder()
                .address('ADDRESS')
                .withSide((b) => b.teamId(teamId).name('SIDE 1'))
                .type('TYPE')
                .build();
            await renderComponent(
                { tournament, expanded: true, onTournamentChanged },
                {
                    id: division.id,
                    name: division.name,
                    season,
                    players: [],
                    onReloadDivision,
                    setDivisionData: noop,
                    favouritesEnabled: true,
                },
                account,
                undefined,
                {
                    favouriteTeamIds: [teamId],
                },
            );

            reportedError.verifyNoError();
            const tr = context.required('tr');
            expect(tr.className()).not.toContain('opacity-25');
        });

        it('does not shade team tournament if no favourites defined', async () => {
            const teamId = createTemporaryId();
            const tournament = tournamentBuilder()
                .address('ADDRESS')
                .withSide((b) => b.teamId(teamId).name('SIDE 1'))
                .type('TYPE')
                .build();
            await renderComponent(
                { tournament, expanded: true, onTournamentChanged },
                {
                    id: division.id,
                    name: division.name,
                    season,
                    players: [],
                    onReloadDivision,
                    setDivisionData: noop,
                    favouritesEnabled: true,
                },
                account,
                undefined,
                {
                    favouriteTeamIds: [],
                },
            );

            reportedError.verifyNoError();
            const tr = context.required('tr');
            expect(tr.className()).not.toContain('opacity-25');
        });
    });

    describe('when logged in', () => {
        const season: SeasonDto = seasonBuilder('SEASON').build();
        const division: DivisionDto = divisionBuilder('DIVISION').build();
        const player: DivisionPlayerDto = playerBuilder('PLAYER').build();
        const account: UserDto = {
            name: '',
            givenName: '',
            emailAddress: '',
            access: {
                manageTournaments: true,
            },
        };

        it('can delete tournament', async () => {
            const tournament = tournamentBuilder()
                .date('2023-05-06T00:00:00')
                .address('ADDRESS')
                .type('TYPE')
                .build();
            await renderComponent(
                { tournament, expanded: false, onTournamentChanged },
                {
                    id: division.id,
                    season,
                    players: [player],
                    onReloadDivision,
                    name: '',
                    setDivisionData: noop,
                },
                account,
            );
            const adminCell = context.required('td:nth-child(2)');
            context.prompts.respondToConfirm(
                'Are you sure you want to delete this tournament fixture?',
                true,
            );

            await adminCell.button('🗑').click();

            context.prompts.confirmWasShown(
                'Are you sure you want to delete this tournament fixture?',
            );
            reportedError.verifyNoError();
            expect(deletedId).toEqual(tournament.id);
            expect(tournamentChanged).toEqual(true);
        });

        it('does not delete tournament is confirmation rejected', async () => {
            const tournament = tournamentBuilder()
                .date('2023-05-06T00:00:00')
                .address('ADDRESS')
                .type('TYPE')
                .build();
            await renderComponent(
                { tournament, expanded: false, onTournamentChanged },
                {
                    id: division.id,
                    season,
                    players: [player],
                    onReloadDivision,
                    name: '',
                    setDivisionData: noop,
                },
                account,
            );
            const adminCell = context.required('td:nth-child(2)');
            context.prompts.respondToConfirm(
                'Are you sure you want to delete this tournament fixture?',
                false,
            );

            await adminCell.button('🗑').click();

            context.prompts.confirmWasShown(
                'Are you sure you want to delete this tournament fixture?',
            );
            reportedError.verifyNoError();
            expect(deletedId).toBeNull();
            expect(tournamentChanged).toEqual(false);
        });

        it('handles error during delete', async () => {
            const tournament = tournamentBuilder()
                .date('2023-05-06T00:00:00')
                .address('ADDRESS')
                .type('TYPE')
                .build();
            await renderComponent(
                { tournament, expanded: false, onTournamentChanged },
                {
                    id: division.id,
                    season,
                    players: [player],
                    onReloadDivision,
                    name: '',
                    setDivisionData: noop,
                },
                account,
            );
            const adminCell = context.required('td:nth-child(2)');
            context.prompts.respondToConfirm(
                'Are you sure you want to delete this tournament fixture?',
                true,
            );
            apiResponse = { success: false, errors: ['SOME ERROR'] };

            await adminCell.button('🗑').click();

            reportedError.verifyNoError();
            expect(tournamentChanged).toEqual(false);
            expect(context.text()).toContain('SOME ERROR');
            expect(context.text()).toContain('Could not delete tournament');
        });

        it('can close error dialog after delete failure', async () => {
            const tournament = tournamentBuilder()
                .date('2023-05-06T00:00:00')
                .address('ADDRESS')
                .type('TYPE')
                .build();
            await renderComponent(
                { tournament, expanded: false, onTournamentChanged },
                {
                    id: division.id,
                    season,
                    players: [player],
                    onReloadDivision,
                    name: '',
                    setDivisionData: noop,
                },
                account,
            );
            const adminCell = context.required('td:nth-child(2)');
            context.prompts.respondToConfirm(
                'Are you sure you want to delete this tournament fixture?',
                true,
            );
            apiResponse = { success: false, errors: ['SOME ERROR'] };
            await adminCell.button('🗑').click();
            expect(context.text()).toContain('Could not delete tournament');

            await adminCell.button('Close').click();

            expect(context.text()).not.toContain('Could not delete tournament');
        });

        it('does not shade team tournament if favourites defined and tournament does not have favourite team playing when an admin', async () => {
            const teamId = createTemporaryId();
            const tournament = tournamentBuilder()
                .address('ADDRESS')
                .withSide((b) => b.teamId(teamId).name('SIDE 1'))
                .type('TYPE')
                .build();
            await renderComponent(
                { tournament, expanded: true, onTournamentChanged },
                {
                    id: division.id,
                    name: division.name,
                    season,
                    players: [],
                    onReloadDivision,
                    setDivisionData: noop,
                    favouritesEnabled: true,
                },
                account,
                undefined,
                {
                    favouriteTeamIds: ['1234'],
                },
            );

            reportedError.verifyNoError();
            const tr = context.required('tr');
            expect(tr.className()).not.toContain('opacity-25');
        });
    });
});
