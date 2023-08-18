// noinspection JSUnresolvedReference

import {getRoundNameFromMatches, getRoundNameFromSides, hasScore} from "./tournaments";
import {distinct} from "./collections";

describe('tournaments', () => {
    describe('getRoundNameFromSides', () => {
        it('returns round name if exists', () => {
            const round = {
                name: 'ROUND',
            };

            const name = getRoundNameFromSides(round, 2, 1);

            expect(name).toEqual('ROUND');
        });

        it('returns Final if 2 sides', () => {
            const round = {
                name: null,
            };

            const name = getRoundNameFromSides(round, 2, 1);

            expect(name).toEqual('Final');
        });

        it('returns Semi-Final if 4 sides', () => {
            const round = {
                name: null,
            };

            const name = getRoundNameFromSides(round, 4, 1);

            expect(name).toEqual('Semi-Final');
        });

        it('returns Quarter-Final if 6,7 or 8 sides', () => {
            const round = {
                name: null,
            };

            expect(getRoundNameFromSides(round, 6, 1)).toEqual('Quarter-Final');
            expect(getRoundNameFromSides(round, 7, 1)).toEqual('Quarter-Final');
            expect(getRoundNameFromSides(round, 8, 1)).toEqual('Quarter-Final');
        });

        it('returns depth if unimportant number of sides', () => {
            const round = {
                name: null,
            };

            const names = [
                getRoundNameFromSides(round, 1, 1),
                getRoundNameFromSides(round, 3, 1),
                getRoundNameFromSides(round, 5, 1),
                getRoundNameFromSides(round, 9, 1),
                getRoundNameFromSides(round, 0, 1),
                getRoundNameFromSides(round, 10, 1),
            ];

            expect(distinct(names)).toEqual(['Round: 1']);
        });
    });

    describe('getRoundNameFromMatches', () => {
        it('returns Final if 1 match', () => {
            const name = getRoundNameFromMatches(1, 1);

            expect(name).toEqual('Final');
        });

        it('returns Semi-Final if 2 matches', () => {
            const name = getRoundNameFromMatches(2, 1);

            expect(name).toEqual('Semi-Final');
        });

        it('returns Quarter-Final if 3 or 4 matches', () => {
            const name3 = getRoundNameFromMatches(3, 1);
            const name4 = getRoundNameFromMatches(4, 1);

            expect(distinct([name3, name4])).toEqual(['Quarter-Final']);
        });

        it('returns depth if unimportant number of matches', () => {
            const names = [
                getRoundNameFromMatches(0, 1),
                getRoundNameFromMatches(5, 1),
                getRoundNameFromMatches(6, 1),
                getRoundNameFromMatches(7, 1),
            ];

            expect(distinct(names)).toEqual(['Round: 2']);
        });
    });

    describe('hasScore', () => {
        it('returns true if there is a score', () => {
            expect(hasScore(0)).toEqual(true);
            expect(hasScore(1)).toEqual(true);
        });

        it('returns false if there is a null score', () => {
            expect(hasScore(null)).toEqual(false);
        });

        it('returns false if there is an undefined score', () => {
            expect(hasScore(undefined)).toEqual(false);
        });
    });
});