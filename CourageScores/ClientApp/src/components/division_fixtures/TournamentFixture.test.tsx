import {
    api,
    appProps,
    brandingProps,
    cleanUp,
    doClick,
    ErrorState,
    findButton,
    iocProps, noop,
    renderApp, TestContext
} from "../../helpers/tests";
import {createTemporaryId} from "../../helpers/projection";
import {toMap} from "../../helpers/collections";
import React from "react";
import {DivisionDataContainer, IDivisionDataContainerProps} from "../DivisionDataContainer";
import {ITournamentFixtureProps, TournamentFixture} from "./TournamentFixture";
import {IEditTournamentGameDto} from "../../interfaces/models/dtos/Game/IEditTournamentGameDto";
import {IClientActionResultDto} from "../../interfaces/IClientActionResultDto";
import {ITournamentGameDto} from "../../interfaces/models/dtos/Game/ITournamentGameDto";
import {IUserDto} from "../../interfaces/models/dtos/Identity/IUserDto";
import {ITeamDto} from "../../interfaces/models/dtos/Team/ITeamDto";
import {ISeasonDto} from "../../interfaces/models/dtos/Season/ISeasonDto";
import {IDivisionDto} from "../../interfaces/models/dtos/IDivisionDto";
import {IDivisionPlayerDto} from "../../interfaces/models/dtos/Division/IDivisionPlayerDto";
import {ITournamentPlayerDto} from "../../interfaces/models/dtos/Game/ITournamentPlayerDto";
import {ITournamentSideBuilder, sideBuilder, tournamentBuilder} from "../../helpers/builders/tournaments";
import {teamBuilder} from "../../helpers/builders/teams";
import {seasonBuilder} from "../../helpers/builders/seasons";
import {divisionBuilder} from "../../helpers/builders/divisions";
import {playerBuilder} from "../../helpers/builders/players";
import {ITournamentGameApi} from "../../interfaces/apis/ITournamentGameApi";

describe('TournamentFixture', () => {
    let context: TestContext;
    let reportedError: ErrorState;
    let tournamentChanged: boolean;
    let savedTournament: { data: IEditTournamentGameDto, lastUpdated?: string };
    let deletedId: string;
    let apiResponse: IClientActionResultDto<ITournamentGameDto>;

    const tournamentApi = api<ITournamentGameApi>({
        update: async (data: IEditTournamentGameDto, lastUpdated?: string) => {
            savedTournament = {data, lastUpdated};
            return apiResponse || {success: true};
        },
        delete: async (id: string) => {
            deletedId = id;
            return apiResponse || {success: true};
        }
    });

    async function onTournamentChanged() {
        tournamentChanged = true;
    }

    async function onReloadDivision() {
        return null;
    }

    afterEach(() => {
        cleanUp(context);
    });

    beforeEach(() => {
        reportedError = new ErrorState();
        tournamentChanged = null;
        savedTournament = null;
        deletedId = null;
        apiResponse = null;
    });

    async function renderComponent(props: ITournamentFixtureProps, divisionData: IDivisionDataContainerProps, account?: IUserDto, teams?: ITeamDto[]) {
        context = await renderApp(
            iocProps({tournamentApi}),
            brandingProps(),
            appProps({
                account,
                teams: toMap(teams || []),
            }, reportedError),
            (<DivisionDataContainer {...divisionData}>
                <TournamentFixture {...props} />
            </DivisionDataContainer>),
            null,
            null,
            'tbody');
    }

    describe('when logged out', () => {
        const season: ISeasonDto = seasonBuilder('SEASON').build();
        const division: IDivisionDto = divisionBuilder('DIVISION').build();
        const player: IDivisionPlayerDto = playerBuilder('PLAYER').build();
        const account = null;

        function assertPlayerDisplayWithPlayerLinks(playersCell: Element, ordinal: number, players: ITournamentPlayerDto[]) {
            const side = playersCell.querySelector(`div.px-3 > div:nth-child(${ordinal})`);
            expect(side).toBeTruthy();

            assertPlayersAndLinks(side, players);
        }

        function assertPlayerDisplayWithSideNameAndTeamLink(playersCell: Element, ordinal: number, sideName: string, teamId: string, players: ITournamentPlayerDto[]) {
            const side = playersCell.querySelector(`div.px-3 > div:nth-child(${ordinal})`);
            expect(side).toBeTruthy();

            assertSideNameAndLink(side, sideName, `http://localhost/division/${division.name}/team:${encodeURI(teamId)}/${season.name}`);
            assertPlayersAndLinks(side, players);
        }

        function assertSinglePlayerDisplay(playersCell: Element, ordinal: number, _: string, player: ITournamentPlayerDto) {
            const side = playersCell.querySelector(`div.px-3 > div:nth-child(${ordinal})`);
            expect(side).toBeTruthy();

            assertPlayersAndLinks(side, [player]);
        }

        function assertSideNameAndLink(side: Element, sideName: string, href: string) {
            const link = side.querySelector('a');
            expect(link).toBeTruthy();
            expect(link.textContent).toEqual(sideName);
            expect(link.href).toEqual(href);
        }

        function assertPlayersAndLinks(side: Element, players: ITournamentPlayerDto[]) {
            const links = Array.from(side.querySelectorAll('label a')) as HTMLAnchorElement[];
            expect(links.length).toEqual(players.length);
            players.forEach((player: { name: string }, index: number) => {
                const link = links[index];
                expect(link.textContent).toEqual(player.name);
                expect(link.href).toEqual(`http://localhost/division/${division.name}/player:${encodeURI(player.name)}/${season.name}`);
            });
        }

        it('renders unplayed tournament', async () => {
            const tournament = tournamentBuilder()
                .date('2023-05-06T00:00:00')
                .address('ADDRESS')
                .type('TYPE')
                .build();
            await renderComponent(
                {tournament, date: '2023-05-06T00:00:00', expanded: false, onTournamentChanged},
                {id: division.id, season, players: [player], onReloadDivision, name: '', setDivisionData: noop },
                account);

            expect(reportedError.hasError()).toEqual(false);
            const cells = Array.from(context.container.querySelectorAll('td'));
            const cellText = cells.map(td => td.textContent);
            expect(cellText).toEqual(['TYPE at ADDRESS']);
        });

        it('renders tournament won', async () => {
            const sideId = createTemporaryId();
            const tournament = tournamentBuilder()
                .date('2023-05-06T00:00:00')
                .address('ADDRESS')
                .type('TYPE')
                .withSide((s: ITournamentSideBuilder) => s.name('WINNER').id(sideId))
                .winner('WINNER', sideId)
                .build();
            await renderComponent(
                {tournament, date: '2023-05-06T00:00:00', expanded: false, onTournamentChanged},
                {id: division.id, season, players: [player], onReloadDivision, name: '', setDivisionData: noop},
                account);

            expect(reportedError.hasError()).toEqual(false);
            const cells = Array.from(context.container.querySelectorAll('td'));
            const cellText = cells.map(td => td.textContent);
            expect(cellText).toEqual(['TYPE at ADDRESS', 'Winner: WINNER']);
        });

        it('renders tournament won by team', async () => {
            const team = teamBuilder('TEAM').build();
            const sideId = createTemporaryId();
            const tournament = tournamentBuilder()
                .date('2023-05-06T00:00:00')
                .address('ADDRESS')
                .type('TYPE')
                .withSide((s: ITournamentSideBuilder) => s.name('WINNER').id(sideId).teamId(team.id))
                .winner('WINNER', sideId, team.id)
                .build();
            await renderComponent(
                {tournament, date: '2023-05-06T00:00:00', expanded: false, onTournamentChanged},
                {id: division.id, name: division.name, season, players: [player], onReloadDivision, setDivisionData: noop},
                account,
                [team]);

            expect(reportedError.hasError()).toEqual(false);
            const cells = Array.from(context.container.querySelectorAll('td'));
            const cellText = cells.map(td => td.textContent);
            expect(cellText).toEqual(['TYPE at ADDRESS', 'Winner: WINNER']);
            const linkToTeam = cells[1].querySelector('a');
            expect(linkToTeam).toBeTruthy();
            expect(linkToTeam.textContent).toEqual('WINNER');
            expect(linkToTeam.href).toEqual(`http://localhost/division/${division.name}/team:${encodeURI(team.name)}/${season.name}`);
        });

        it('renders tournament won by team (when team not found)', async () => {
            const team = teamBuilder('TEAM').build();
            const sideId = createTemporaryId();
            const tournament = tournamentBuilder()
                .date('2023-05-06T00:00:00')
                .address('ADDRESS')
                .type('TYPE')
                .withSide((s: ITournamentSideBuilder) => s.name('WINNER').id(sideId).teamId(team.id))
                .winner('WINNER', sideId)
                .build();
            await renderComponent(
                {tournament, date: '2023-05-06T00:00:00', expanded: false, onTournamentChanged},
                {id: division.id, name: division.name, season, players: [player], onReloadDivision, setDivisionData: noop},
                account,
                []);

            expect(reportedError.hasError()).toEqual(false);
            const cells = Array.from(context.container.querySelectorAll('td'));
            const cellText = cells.map(td => td.textContent);
            expect(cellText).toEqual(['TYPE at ADDRESS', 'Winner: WINNER']);
            const linkToTeam = cells[1].querySelector('a');
            expect(linkToTeam).toBeFalsy();
        });

        it('does not render proposed tournaments', async () => {
            const tournament = tournamentBuilder()
                .date('2023-05-06T00:00:00')
                .proposed()
                .address('ADDRESS')
                .type('TYPE')
                .build();
            await renderComponent(
                {tournament, date: '2023-05-06T00:00:00', expanded: false, onTournamentChanged},
                {id: division.id, season, players: [player], onReloadDivision, name: '', setDivisionData: noop},
                account);

            expect(reportedError.hasError()).toEqual(false);
            expect(context.container.innerHTML).toEqual('');
        });

        it('renders who is playing', async () => {
            const side1 = sideBuilder('SIDE 1').withPlayer('PLAYER 1').build();
            const side2 = sideBuilder('SIDE 2').withPlayer('PLAYER 2').withPlayer('PLAYER 3').teamId(createTemporaryId()).build();
            const side3 = sideBuilder('PLAYER 4, PLAYER 5').withPlayer('PLAYER 4').withPlayer('PLAYER 5').build();
            const side4 = sideBuilder('WITH DIFFERENT NAME TO PLAYER NAMES').withPlayer('PLAYER 6').withPlayer('PLAYER 7').build();
            const tournament = tournamentBuilder()
                .address('ADDRESS')
                .withSide(side1).withSide(side2).withSide(side3).withSide(side4)
                .type('TYPE')
                .build();
            await renderComponent(
                {tournament, date: '2023-05-06T00:00:00', expanded: true, onTournamentChanged},
                {
                    id: division.id,
                    name: division.name,
                    season,
                    players: side1.players.concat(side2.players).concat(side3.players).concat(side4.players) as IDivisionPlayerDto[],
                    onReloadDivision,
                    setDivisionData: noop,
                },
                account);

            expect(reportedError.hasError()).toEqual(false);
            const playersCell = context.container.querySelector('td:first-child');
            assertPlayerDisplayWithPlayerLinks(playersCell, 1, side3.players);
            assertSinglePlayerDisplay(playersCell, 2, side1.name, side1.players[0]);
            assertPlayerDisplayWithSideNameAndTeamLink(playersCell, 3, side2.name, side2.teamId, []);
            assertPlayerDisplayWithPlayerLinks(playersCell, 4, side4.players);
        });
    });

    describe('when logged in', () => {
        const season: ISeasonDto = seasonBuilder('SEASON').build();
        const division: IDivisionDto = divisionBuilder('DIVISION').build();
        const player: IDivisionPlayerDto = playerBuilder('PLAYER').build();
        const account: IUserDto = {
            name: '',
            givenName: '',
            emailAddress: '',
            access: {
                manageTournaments: true,
            }
        };

        it('renders proposed tournament', async () => {
            const tournament = tournamentBuilder()
                .date('2023-05-06T00:00:00')
                .address('ADDRESS')
                .type('TYPE')
                .proposed()
                .build();
            await renderComponent(
                {tournament, date: '2023-05-06T00:00:00', expanded: false, onTournamentChanged},
                {id: division.id, season, players: [player], onReloadDivision, name: '', setDivisionData: noop},
                account);

            expect(reportedError.hasError()).toEqual(false);
            const cells = Array.from(context.container.querySelectorAll('td'));
            const cellText = cells.map(td => td.textContent);
            expect(cellText).toEqual(['Tournament at ADDRESS', '➕']);
        });

        it('can add tournament', async () => {
            const tournament = tournamentBuilder()
                .date('2023-05-06T00:00:00')
                .proposed()
                .address('ADDRESS')
                .type('TYPE')
                .updated('2023-07-01T00:00:00')
                .build();
            await renderComponent(
                {tournament, date: '2023-05-06T00:00:00', expanded: false, onTournamentChanged},
                {id: division.id, season, players: [player], onReloadDivision, name: '', setDivisionData: noop},
                account);
            const adminCell = context.container.querySelector('td:nth-child(2)');

            await doClick(findButton(adminCell, '➕'));

            expect(reportedError.hasError()).toEqual(false);
            expect(savedTournament.data).toEqual({
                date: '2023-05-06T00:00:00',
                address: 'ADDRESS',
                divisionId: division.id,
                seasonId: season.id,
            });
            expect(tournamentChanged).toEqual(true);
        });

        it('handles error during add tournament', async () => {
            const tournament = tournamentBuilder()
                .date('2023-05-06T00:00:00')
                .proposed()
                .address('ADDRESS')
                .type('TYPE')
                .updated('2023-07-01T00:00:00')
                .build();
            await renderComponent(
                {tournament, date: '2023-05-06T00:00:00', expanded: false, onTournamentChanged},
                {id: division.id, season, players: [player], onReloadDivision, name: '', setDivisionData: noop},
                account);
            const adminCell = context.container.querySelector('td:nth-child(2)');
            apiResponse = {success: false, errors: ['SOME ERROR']};

            await doClick(findButton(adminCell, '➕'));

            expect(reportedError.hasError()).toEqual(false);
            expect(savedTournament).not.toBeNull();
            expect(tournamentChanged).toBeNull();
            expect(context.container.textContent).toContain('SOME ERROR');
            expect(context.container.textContent).toContain('Could not create tournament');
        });

        it('can close error dialog after creation failure', async () => {
            const tournament = tournamentBuilder()
                .date('2023-05-06T00:00:00')
                .proposed()
                .address('ADDRESS')
                .type('TYPE')
                .updated('2023-07-01T00:00:00')
                .build();
            await renderComponent(
                {tournament, date: '2023-05-06T00:00:00', expanded: false, onTournamentChanged},
                {id: division.id, season, players: [player], onReloadDivision, name: '', setDivisionData: noop},
                account);
            const adminCell = context.container.querySelector('td:nth-child(2)');
            apiResponse = {success: false, errors: ['SOME ERROR']};
            await doClick(findButton(adminCell, '➕'));
            expect(context.container.textContent).toContain('Could not create tournament');

            await doClick(findButton(adminCell, 'Close'));

            expect(context.container.textContent).not.toContain('Could not create tournament');
        });

        it('can delete tournament', async () => {
            const tournament = tournamentBuilder()
                .date('2023-05-06T00:00:00')
                .address('ADDRESS')
                .type('TYPE')
                .build();
            await renderComponent(
                {tournament, date: '2023-05-06T00:00:00', expanded: false, onTournamentChanged},
                {id: division.id, season, players: [player], onReloadDivision, name: '', setDivisionData: noop},
                account);
            const adminCell = context.container.querySelector('td:nth-child(2)');
            let confirm: string;
            window.confirm = (message) => {
                confirm = message;
                return true;
            };

            await doClick(findButton(adminCell, '🗑'));

            expect(confirm).toEqual('Are you sure you want to delete this tournament fixture?');
            expect(reportedError.hasError()).toEqual(false);
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
                {tournament, date: '2023-05-06T00:00:00', expanded: false, onTournamentChanged},
                {id: division.id, season, players: [player], onReloadDivision, name: '', setDivisionData: noop},
                account);
            const adminCell = context.container.querySelector('td:nth-child(2)');
            let confirm: string;
            window.confirm = (message) => {
                confirm = message;
                return false;
            };

            await doClick(findButton(adminCell, '🗑'));

            expect(confirm).toEqual('Are you sure you want to delete this tournament fixture?');
            expect(reportedError.hasError()).toEqual(false);
            expect(deletedId).toBeNull();
            expect(tournamentChanged).toEqual(null);
        });

        it('handles error during delete', async () => {
            const tournament = tournamentBuilder()
                .date('2023-05-06T00:00:00')
                .address('ADDRESS')
                .type('TYPE')
                .build();
            await renderComponent(
                {tournament, date: '2023-05-06T00:00:00', expanded: false, onTournamentChanged},
                {id: division.id, season, players: [player], onReloadDivision, name: '', setDivisionData: noop},
                account);
            const adminCell = context.container.querySelector('td:nth-child(2)');
            window.confirm = () => {
                return true;
            };
            apiResponse = {success: false, errors: ['SOME ERROR']};

            await doClick(findButton(adminCell, '🗑'));

            expect(reportedError.hasError()).toEqual(false);
            expect(tournamentChanged).toBeNull();
            expect(context.container.textContent).toContain('SOME ERROR');
            expect(context.container.textContent).toContain('Could not delete tournament');
        });

        it('can close error dialog after delete failure', async () => {
            const tournament = tournamentBuilder()
                .date('2023-05-06T00:00:00')
                .address('ADDRESS')
                .type('TYPE')
                .build();
            await renderComponent(
                {tournament, date: '2023-05-06T00:00:00', expanded: false, onTournamentChanged},
                {id: division.id, season, players: [player], onReloadDivision, name: '', setDivisionData: noop},
                account);
            const adminCell = context.container.querySelector('td:nth-child(2)');
            window.confirm = () => {
                return true;
            };
            apiResponse = {success: false, errors: ['SOME ERROR']};
            await doClick(findButton(adminCell, '🗑'));
            expect(context.container.textContent).toContain('Could not delete tournament');

            await doClick(findButton(adminCell, 'Close'));

            expect(context.container.textContent).not.toContain('Could not delete tournament');
        });
    });
});