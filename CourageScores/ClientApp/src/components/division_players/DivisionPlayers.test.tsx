import {appProps, brandingProps, cleanUp, ErrorState, iocProps, renderApp, TestContext} from "../../helpers/tests";
import {createTemporaryId} from "../../helpers/projection";
import {DivisionDataContainer, IDivisionDataContainerProps} from "../league/DivisionDataContainer";
import {DivisionPlayers, IDivisionPlayersProps} from "./DivisionPlayers";
import {seasonBuilder} from "../../helpers/builders/seasons";
import {UserDto} from "../../interfaces/models/dtos/Identity/UserDto";
import {SeasonDto} from "../../interfaces/models/dtos/Season/SeasonDto";
import {DivisionDataDto} from "../../interfaces/models/dtos/Division/DivisionDataDto";

describe('DivisionPlayers', () => {
    let context: TestContext;
    let reportedError: ErrorState;
    let account: UserDto;
    const playerApi = {};

    afterEach(() => {
        cleanUp(context);
    });

    beforeEach(() => {
        reportedError = new ErrorState();
    });

    async function renderComponent(divisionData: IDivisionDataContainerProps, props: IDivisionPlayersProps) {
        context = await renderApp(
            iocProps({playerApi}),
            brandingProps(),
            appProps({
                account: account,
                error: null,
            }, reportedError),
            (<DivisionDataContainer {...divisionData}>
                <DivisionPlayers {...props} />
            </DivisionDataContainer>));
    }

    function createDivisionData(divisionId: string): DivisionDataDto {
        const season: SeasonDto = seasonBuilder('A season')
            .starting('2022-02-03T00:00:00')
            .ending('2022-08-25T00:00:00')
            .build();
        return {
            id: divisionId,
            name: '',
            players: [{
                id: createTemporaryId(),
                name: 'A captain',
                rank: 1,
                captain: true,
                team: 'A team',
                teamId: createTemporaryId(),
                points: 2,
                winPercentage: 3,
                oneEighties: 4,
                over100Checkouts: 5,
                singles: {
                    matchesPlayed: 6,
                    matchesWon: 7,
                    matchesLost: 8
                }
            }, {
                id: createTemporaryId(),
                name: 'A player',
                rank: 11,
                captain: false,
                team: 'A team',
                teamId: createTemporaryId(),
                points: 12,
                winPercentage: 13,
                oneEighties: 14,
                over100Checkouts: 15,
                singles: {
                    matchesPlayed: 16,
                    matchesWon: 17,
                    matchesLost: 18
                }
            }],
            season: season
        };
    }

    async function onReloadDivision() {
        return null;
    }

    async function setDivisionData() {
    }

    function assertPlayer(tr: HTMLTableRowElement, values: string[]) {
        expect(Array.from(tr.querySelectorAll('td')).map(td => td.textContent)).toEqual(values);
    }

    describe('when logged out', () => {
        beforeEach(() => {
            account = null;
        });

        it('renders players with heading and venue', async () => {
            const divisionId = createTemporaryId();
            const divisionData = createDivisionData(divisionId);

            await renderComponent(
                {...divisionData, onReloadDivision, setDivisionData},
                {hideVenue: undefined, hideHeading: undefined});

            reportedError.verifyNoError();
            const playersRows = Array.from(context.container.querySelectorAll('.content-background table.table tbody tr')) as HTMLTableRowElement[];
            expect(playersRows.length).toEqual(2);
            assertPlayer(playersRows[0], ['1', '🤴 A captain', 'A team', '6', '7', '8', '2', '3', '4', '5']);
            assertPlayer(playersRows[1], ['11', 'A player', 'A team', '16', '17', '18', '12', '13', '14', '15']);
            const heading = context.container.querySelector('.content-background > div > p');
            expect(heading).toBeTruthy();
            expect(heading.textContent).toEqual('Only players that have played a singles match will appear here');
        });

        it('excludes players who have not played a singles match', async () => {
            const divisionId = createTemporaryId();
            const divisionData = createDivisionData(divisionId);
            const captain = divisionData.players.filter(p => p.name === 'A captain')[0];
            captain.singles.matchesPlayed = 0;
            captain.singles.matchesWon = 0;
            captain.singles.matchesLost = 0;

            await renderComponent(
                {...divisionData, onReloadDivision, setDivisionData},
                {hideVenue: undefined, hideHeading: undefined});

            reportedError.verifyNoError();
            const playersRows = Array.from(context.container.querySelectorAll('.content-background table.table tbody tr')) as HTMLTableRowElement[];
            expect(playersRows.length).toEqual(1);
            assertPlayer(playersRows[0], ['11', 'A player', 'A team', '16', '17', '18', '12', '13', '14', '15']);
        });

        it('without heading', async () => {
            const divisionId = createTemporaryId();
            const divisionData = createDivisionData(divisionId);

            await renderComponent(
                {...divisionData, onReloadDivision, setDivisionData},
                {hideVenue: undefined, hideHeading: true});

            reportedError.verifyNoError();
            const playersRows = Array.from(context.container.querySelectorAll('.content-background table.table tbody tr')) as HTMLTableRowElement[]
            expect(playersRows.length).toEqual(2);
            const heading = context.container.querySelector('.content-background > div > p');
            expect(heading).toBeFalsy();
        });

        it('without venue', async () => {
            const divisionId = createTemporaryId();
            const divisionData = createDivisionData(divisionId);

            await renderComponent(
                {...divisionData, onReloadDivision, setDivisionData},
                {hideVenue: true, hideHeading: undefined});

            reportedError.verifyNoError();
            const playersRows = Array.from(context.container.querySelectorAll('.content-background table.table tbody tr')) as HTMLTableRowElement[]
            expect(playersRows.length).toEqual(2);
            assertPlayer(playersRows[0], ['1', '🤴 A captain', '6', '7', '8', '2', '3', '4', '5']);
            assertPlayer(playersRows[1], ['11', 'A player', '16', '17', '18', '12', '13', '14', '15']);
            const heading = context.container.querySelector('.content-background > div > p');
            expect(heading).toBeTruthy();
        });
    });

    describe('when logged in', () => {
        beforeEach(() => {
            account = {
                name: '',
                emailAddress: '',
                givenName: '',
                access: {
                    managePlayers: true,
                },
            };
        });

        it('renders players with heading and venue', async () => {
            const divisionId = createTemporaryId();
            const divisionData = createDivisionData(divisionId);

            await renderComponent(
                {...divisionData, onReloadDivision, setDivisionData},
                {hideVenue: undefined, hideHeading: undefined});

            reportedError.verifyNoError();
            const playersRows = Array.from(context.container.querySelectorAll('.content-background table.table tbody tr')) as HTMLTableRowElement[]
            expect(playersRows.length).toEqual(2);
            assertPlayer(playersRows[0], ['1', '✏️🗑️🤴 A captain', 'A team', '6', '7', '8', '2', '3', '4', '5']);
            assertPlayer(playersRows[1], ['11', '✏️🗑️A player', 'A team', '16', '17', '18', '12', '13', '14', '15']);
            const heading = context.container.querySelector('.content-background > div > p');
            expect(heading).toBeTruthy();
            expect(heading.textContent).toEqual('Only players that have played a singles match will appear here');
        });

        it('includes players who have not played a singles match', async () => {
            const divisionId = createTemporaryId();
            const divisionData = createDivisionData(divisionId);
            const captain = divisionData.players.filter(p => p.name === 'A captain')[0];
            captain.singles.matchesPlayed = 0;
            captain.singles.matchesWon = 0;
            captain.singles.matchesLost = 0;

            await renderComponent(
                {...divisionData, onReloadDivision, setDivisionData},
                {hideVenue: undefined, hideHeading: undefined});

            reportedError.verifyNoError();
            const playersRows = Array.from(context.container.querySelectorAll('.content-background table.table tbody tr')) as HTMLTableRowElement[]
            expect(playersRows.length).toEqual(2);
            assertPlayer(playersRows[0], ['1', '✏️🗑️🤴 A captain', 'A team', '0', '0', '0', '2', '3', '4', '5']);
            assertPlayer(playersRows[1], ['11', '✏️🗑️A player', 'A team', '16', '17', '18', '12', '13', '14', '15']);
        });

        it('without heading', async () => {
            const divisionId = createTemporaryId();
            const divisionData = createDivisionData(divisionId);

            await renderComponent(
                {...divisionData, onReloadDivision, setDivisionData},
                {hideVenue: undefined, hideHeading: true});

            reportedError.verifyNoError();
            const playersRows = Array.from(context.container.querySelectorAll('.content-background table.table tbody tr')) as HTMLTableRowElement[]
            expect(playersRows.length).toEqual(2);
            const heading = context.container.querySelector('.content-background > div > p');
            expect(heading).toBeFalsy();
        });

        it('without venue', async () => {
            const divisionId = createTemporaryId();
            const divisionData = createDivisionData(divisionId);

            await renderComponent(
                {...divisionData, onReloadDivision, setDivisionData},
                {hideVenue: true, hideHeading: undefined});

            reportedError.verifyNoError();
            const playersRows = Array.from(context.container.querySelectorAll('.content-background table.table tbody tr')) as HTMLTableRowElement[]
            expect(playersRows.length).toEqual(2);
            assertPlayer(playersRows[0], ['1', '✏️🗑️🤴 A captain', '6', '7', '8', '2', '3', '4', '5']);
            assertPlayer(playersRows[1], ['11', '✏️🗑️A player', '16', '17', '18', '12', '13', '14', '15']);
            const heading = context.container.querySelector('.content-background > div > p');
            expect(heading).toBeTruthy();
        });
    });
});