// noinspection JSUnresolvedReference

import {getMatchOptionDefaults, getMatchOptionsLookup} from "./matchOptions";

describe('matchOptions', () => {
    describe('getMatchOptionsDefaults', () => {
        it('returns matchOption properties correctly', () => {
            const matchOptions = getMatchOptionsLookup([]);

            const result = getMatchOptionDefaults(1, matchOptions);

            expect(result.playerCount).toEqual(matchOptions.playerCount['1']);
            expect(result.startingScore).toEqual(matchOptions.startingScore['1']);
            expect(result.numberOfLegs).toEqual(matchOptions.noOfLegs['1']);
        });
    });

    describe('getMatchOptionsLookup', () => {
        it('with match options, returns correctly', () => {
            const matchOption = {
                playerCount: 5,
                startingScore: 601,
                numberOfLegs: 7,
            };
            const matchOptions = [
                matchOption,
                matchOption,
                matchOption,
                matchOption,
                matchOption,
                matchOption,
                matchOption,
                matchOption,
            ];
            const result = getMatchOptionsLookup(matchOptions);

            expect(result).toBeTruthy();
            expect(result.playerCount['0']).toEqual(5);
            expect(result.startingScore['0']).toEqual(601);
            expect(result.noOfLegs['0']).toEqual(7);
            expect(result.playerCount['5']).toEqual(5);
            expect(result.startingScore['5']).toEqual(601);
            expect(result.noOfLegs['5']).toEqual(7);
            expect(result.playerCount['7']).toEqual(5);
            expect(result.startingScore['7']).toEqual(601);
            expect(result.noOfLegs['7']).toEqual(7);
        });

        it('with match options, returns correctly', () => {
            const matchOptions = [];
            const result = getMatchOptionsLookup(matchOptions);

            expect(result).toBeTruthy();
            expect(result.playerCount['0']).toEqual(1);
            expect(result.startingScore['0']).toEqual(501);
            expect(result.noOfLegs['0']).toEqual(5);
            expect(result.playerCount['5']).toEqual(2);
            expect(result.startingScore['5']).toEqual(501);
            expect(result.noOfLegs['5']).toEqual(3);
            expect(result.playerCount['7']).toEqual(3);
            expect(result.startingScore['7']).toEqual(601);
            expect(result.noOfLegs['7']).toEqual(3);
        });
    });
});