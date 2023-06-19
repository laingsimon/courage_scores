// noinspection JSUnresolvedFunction

import {cleanUp, renderApp} from "../../helpers/tests";
import React from "react";
import {createTemporaryId} from "../../helpers/projection";
import {DivisionDataContainer} from "../DivisionDataContainer";
import {DivisionPlayers} from "./DivisionPlayers";

describe('DivisionPlayers', () => {
    let context;
    let reportedError;
    let divisionReloaded = false;
    let account;
    const playerApi = {

    };

    afterEach(() => {
        cleanUp(context);
    });

    async function renderComponent(divisionData, props) {
        reportedError = null;
        divisionReloaded = false;
        context = await renderApp(
            { playerApi },
            {
                account: account,
                onError: (err) => {
                    reportedError = {
                        message: err.message,
                        stack: err.stack
                    };
                },
                error: null,
            },
            (<DivisionDataContainer {...divisionData}>
                <DivisionPlayers {...props} />
            </DivisionDataContainer>));
    }

    function createDivisionData(divisionId) {
        const season = {
            id: createTemporaryId(),
            name: 'A season',
            startDate: '2022-02-03T00:00:00',
            endDate: '2022-08-25T00:00:00',
            divisions: []
        };
        return {
            id: divisionId,
            players: [ {
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
            } ],
            season: season
        };
    }

    async function onReloadDivision() {
        divisionReloaded = true;
    }

    function assertPlayer(tr, values) {
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
                { ...divisionData, onReloadDivision: onReloadDivision },
                { hideVenue: undefined, hideHeading: undefined });

            expect(reportedError).toBeNull();
            const playersRows = context.container.querySelectorAll('.content-background table.table tbody tr');
            expect(playersRows.length).toEqual(2);
            assertPlayer(playersRows[0], [ '1', '🤴 A captain', 'A team', '6', '7', '8', '2', '3', '4', '5' ]);
            assertPlayer(playersRows[1], [ '11', 'A player', 'A team', '16', '17', '18', '12', '13', '14', '15' ]);
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
                { ...divisionData, onReloadDivision: onReloadDivision },
                { hideVenue: undefined, hideHeading: undefined });

            expect(reportedError).toBeNull();
            const playersRows = context.container.querySelectorAll('.content-background table.table tbody tr');
            expect(playersRows.length).toEqual(1);
            assertPlayer(playersRows[0], [ '11', 'A player', 'A team', '16', '17', '18', '12', '13', '14', '15' ]);
        });

        it('without heading', async () => {
            const divisionId = createTemporaryId();
            const divisionData = createDivisionData(divisionId);

            await renderComponent(
                { ...divisionData, onReloadDivision: onReloadDivision },
                { hideVenue: undefined, hideHeading: true });

            expect(reportedError).toBeNull();
            const playersRows = context.container.querySelectorAll('.content-background table.table tbody tr');
            expect(playersRows.length).toEqual(2);
            const heading = context.container.querySelector('.content-background > div > p');
            expect(heading).toBeFalsy();
        });

        it('without venue', async () => {
            const divisionId = createTemporaryId();
            const divisionData = createDivisionData(divisionId);

            await renderComponent(
                { ...divisionData, onReloadDivision: onReloadDivision },
                { hideVenue: true, hideHeading: undefined });

            expect(reportedError).toBeNull();
            const playersRows = context.container.querySelectorAll('.content-background table.table tbody tr');
            expect(playersRows.length).toEqual(2);
            assertPlayer(playersRows[0], [ '1', '🤴 A captain', '6', '7', '8', '2', '3', '4', '5' ]);
            assertPlayer(playersRows[1], [ '11', 'A player', '16', '17', '18', '12', '13', '14', '15' ]);
            const heading = context.container.querySelector('.content-background > div > p');
            expect(heading).toBeTruthy();
        });
    });

    describe('when logged in', () => {
        beforeEach(() => {
            account = { access: { managePlayers: true } };
        });

        it('renders players with heading and venue', async () => {
            const divisionId = createTemporaryId();
            const divisionData = createDivisionData(divisionId);

            await renderComponent(
                { ...divisionData, onReloadDivision: onReloadDivision },
                { hideVenue: undefined, hideHeading: undefined });

            expect(reportedError).toBeNull();
            const playersRows = context.container.querySelectorAll('.content-background table.table tbody tr');
            expect(playersRows.length).toEqual(2);
            assertPlayer(playersRows[0], [ '1', '✏️🗑️🤴 A captain', 'A team', '6', '7', '8', '2', '3', '4', '5' ]);
            assertPlayer(playersRows[1], [ '11', '✏️🗑️A player', 'A team', '16', '17', '18', '12', '13', '14', '15' ]);
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
                { ...divisionData, onReloadDivision: onReloadDivision },
                { hideVenue: undefined, hideHeading: undefined });

            expect(reportedError).toBeNull();
            const playersRows = context.container.querySelectorAll('.content-background table.table tbody tr');
            expect(playersRows.length).toEqual(2);
            assertPlayer(playersRows[0], [ '1', '✏️🗑️🤴 A captain', 'A team', '0', '0', '0', '2', '3', '4', '5' ]);
            assertPlayer(playersRows[1], [ '11', '✏️🗑️A player', 'A team', '16', '17', '18', '12', '13', '14', '15' ]);
        });

        it('without heading', async () => {
            const divisionId = createTemporaryId();
            const divisionData = createDivisionData(divisionId);

            await renderComponent(
                { ...divisionData, onReloadDivision: onReloadDivision },
                { hideVenue: undefined, hideHeading: true });

            expect(reportedError).toBeNull();
            const playersRows = context.container.querySelectorAll('.content-background table.table tbody tr');
            expect(playersRows.length).toEqual(2);
            const heading = context.container.querySelector('.content-background > div > p');
            expect(heading).toBeFalsy();
        });

        it('without venue', async () => {
            const divisionId = createTemporaryId();
            const divisionData = createDivisionData(divisionId);

            await renderComponent(
                { ...divisionData, onReloadDivision: onReloadDivision },
                { hideVenue: true, hideHeading: undefined });

            expect(reportedError).toBeNull();
            const playersRows = context.container.querySelectorAll('.content-background table.table tbody tr');
            expect(playersRows.length).toEqual(2);
            assertPlayer(playersRows[0], [ '1', '✏️🗑️🤴 A captain', '6', '7', '8', '2', '3', '4', '5' ]);
            assertPlayer(playersRows[1], [ '11', '✏️🗑️A player', '16', '17', '18', '12', '13', '14', '15' ]);
            const heading = context.container.querySelector('.content-background > div > p');
            expect(heading).toBeTruthy();
        });
    });
});