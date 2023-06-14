// noinspection JSUnresolvedFunction

import {cleanUp, renderApp} from "../../../helpers/tests";
import React from "react";
import {createTemporaryId, repeat} from "../../../helpers/projection";
import {TournamentSheet} from "./TournamentSheet";

describe('TournamentSheet', () => {
    let context;
    let reportedError;

    afterEach(() => {
        cleanUp(context);
    });

    async function renderComponent(sides) {
        reportedError = null;
        context = await renderApp(
            { },
            {
                onError: (err) => {
                    if (err.message) {
                        reportedError = {
                            message: err.message,
                            stack: err.stack
                        };
                    } else {
                        reportedError = err;
                    }
                },
            },
            (<TournamentSheet sides={sides} />));
    }

    function createSide(noOfPlayers, name) {
        return {
            id: createTemporaryId(),
            players: repeat(noOfPlayers).map(index => {
                return {
                    id: createTemporaryId(),
                    name: 'PLAYER ' + (index + 1),
                };
            }),
            name,
        };
    }

    function assertRoundNames(expectedRoundNames, singlePlayer) {
        const extraRoundNames = [
            '180s',
            singlePlayer ? 'Venue winner' : 'Venue winners',
            'Hi checks'
        ];
        const roundNames = Array.from(context.container.querySelectorAll('.text-center.fw-bold'));
        expect(roundNames.map(e => e.textContent)).toEqual(expectedRoundNames.concat(extraRoundNames));
    }

    function assertSideNames(sideNames) {
        const sides = Array.from(context.container.querySelectorAll('ul.float-end.list-group li'));
        expect(sides.map(e => e.textContent)).toEqual(sideNames.map((sideName, index) => `${index + 1} - ${sideName}`));
    }

    function assertMatches(matchSize) {
        const matches = Array.from(context.container.querySelectorAll('div[datatype="match"]'));

        const expectedAndsPerSide = repeat(matchSize - 1).map(_ => 'and');
        const expectedNotes = expectedAndsPerSide.concat(['vs']).concat(expectedAndsPerSide);

        matches.forEach(match => {
            const notes = Array.from(match.querySelectorAll('.text-secondary'));
            expect(notes.map(n => n.textContent)).toEqual(expectedNotes);
        });

        const winner = context.container.querySelector('div[datatype="winner"]');
        const notes = Array.from(winner.querySelectorAll('.text-secondary'));
        expect(notes.map(n => n.textContent)).toEqual(expectedAndsPerSide);
    }

    function assertByes(byes) {
        const rounds = Array.from(context.container.querySelectorAll('div[datatype="round"]'));
        expect(rounds.length).toEqual(byes.length);

        const foundByes = rounds.map((round) => {
            const bye = round.querySelector('div[datatype="bye"]');
            return !!bye;
        });

        expect(foundByes).toEqual(byes);
    }

    describe('renders', () => {
        it('given 2 sides with single players', async () => {
            const sides = [
                createSide(1, 'SIDE 1'),
                createSide(1, 'SIDE 2'),
            ];

            await renderComponent(sides);

            expect(reportedError).toBeNull();
            assertRoundNames(['Final'], true);
            assertSideNames([ 'SIDE 1', 'SIDE 2' ]);
            assertMatches(1);
            assertByes([ false ]);
        });

        it('given 2 sides', async () => {
            const sides = [
                createSide(2, 'SIDE 1'),
                createSide(2, 'SIDE 2'),
            ];

            await renderComponent(sides);

            expect(reportedError).toBeNull();
            assertRoundNames(['Final']);
            assertSideNames([ 'SIDE 1', 'SIDE 2' ]);
            assertMatches(2);
            assertByes([ false ]);
        });

        it('given 3 sides', async () => {
            const sides = [
                createSide(3, 'SIDE 1'),
                createSide(3, 'SIDE 2'),
                createSide(3, 'SIDE 3'),
            ];

            await renderComponent(sides);

            expect(reportedError).toBeNull();
            assertRoundNames(['Semi-Final', 'Final']);
            assertSideNames(['SIDE 1', 'SIDE 2', 'SIDE 3']);
            assertMatches(3);
            assertByes([ true, false ]);
        });

        it('given 4 sides', async () => {
            const sides = [
                createSide(4, 'SIDE 1'),
                createSide(4, 'SIDE 2'),
                createSide(4, 'SIDE 3'),
                createSide(4, 'SIDE 4'),
            ];

            await renderComponent(sides);

            expect(reportedError).toBeNull();
            assertRoundNames(['Semi-Final', 'Final']);
            assertSideNames([ 'SIDE 1', 'SIDE 2', 'SIDE 3', 'SIDE 4' ]);
            assertMatches(4);
            assertByes([ false, false ]);
        });

        it('given 5 sides', async () => {
            const sides = [
                createSide(5, 'SIDE 1'),
                createSide(5, 'SIDE 2'),
                createSide(5, 'SIDE 3'),
                createSide(5, 'SIDE 4'),
                createSide(5, 'SIDE 5'),
            ];

            await renderComponent(sides);

            expect(reportedError).toBeNull();
            assertRoundNames(['Quarter-Final', 'Semi-Final', 'Final']);
            assertSideNames([ 'SIDE 1', 'SIDE 2', 'SIDE 3', 'SIDE 4', 'SIDE 5' ]);
            assertMatches(5);
            assertByes([ true, true, false ]);
        });

        it('given 9 sides', async () => {
            const sides = [
                createSide(1, 'SIDE 1'),
                createSide(1, 'SIDE 2'),
                createSide(1, 'SIDE 3'),
                createSide(1, 'SIDE 4'),
                createSide(1, 'SIDE 5'),
                createSide(1, 'SIDE 6'),
                createSide(1, 'SIDE 7'),
                createSide(1, 'SIDE 8'),
                createSide(1, 'SIDE 9'),
            ];

            await renderComponent(sides);

            expect(reportedError).toBeNull();
            assertRoundNames(['Round: 1', 'Quarter-Final', 'Semi-Final', 'Final'], true);
            assertSideNames([ 'SIDE 1', 'SIDE 2', 'SIDE 3', 'SIDE 4', 'SIDE 5', 'SIDE 6', 'SIDE 7', 'SIDE 8', 'SIDE 9' ]);
            assertMatches(1);
            assertByes([ true, true, true, false ]);
        });
    });
});