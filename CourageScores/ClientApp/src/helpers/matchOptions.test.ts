// noinspection JSUnresolvedReference

import { getMatchOptionDefaults, getMatchOptionsLookup } from './matchOptions';
import { GameMatchOptionDto } from '../interfaces/models/dtos/Game/GameMatchOptionDto';

describe('matchOptions', () => {
    describe('getMatchOptionsDefaults', () => {
        it('returns matchOption properties correctly', () => {
            const matchOptions = getMatchOptionsLookup([], false);

            const result = getMatchOptionDefaults(1, matchOptions);

            expect(result.playerCount).toEqual(matchOptions.playerCount[1]);
            expect(result.startingScore).toEqual(matchOptions.startingScore[1]);
            expect(result.numberOfLegs).toEqual(matchOptions.numberOfLegs[1]);
        });
    });

    describe('getMatchOptionsLookup', () => {
        it('with match options, returns correctly for league fixture', () => {
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
            const result = getMatchOptionsLookup(matchOptions, false);

            expect(result).toBeTruthy();
            expect(result.playerCount[0]).toEqual(5);
            expect(result.startingScore[0]).toEqual(601);
            expect(result.numberOfLegs[0]).toEqual(7);
            expect(result.playerCount[5]).toEqual(5);
            expect(result.startingScore[5]).toEqual(601);
            expect(result.numberOfLegs[5]).toEqual(7);
            expect(result.playerCount[7]).toEqual(5);
            expect(result.startingScore[7]).toEqual(601);
            expect(result.numberOfLegs[7]).toEqual(7);
        });

        it('with match options, returns correctly for knockout fixture', () => {
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
            const result = getMatchOptionsLookup(matchOptions, true);

            expect(result).toBeTruthy();
            expect(result.playerCount[0]).toEqual(5);
            expect(result.startingScore[0]).toEqual(601);
            expect(result.numberOfLegs[0]).toEqual(7);
            expect(result.playerCount[5]).toEqual(5);
            expect(result.startingScore[5]).toEqual(601);
            expect(result.numberOfLegs[5]).toEqual(7);
            expect(result.playerCount[7]).toEqual(5);
            expect(result.startingScore[7]).toEqual(601);
            expect(result.numberOfLegs[7]).toEqual(7);
        });

        it('without match options, returns correctly for league fixture', () => {
            const matchOptions: GameMatchOptionDto[] = [];
            const result = getMatchOptionsLookup(matchOptions, false);

            expect(result).toBeTruthy();
            expect(result.playerCount[0]).toEqual(1);
            expect(result.startingScore[0]).toEqual(501);
            expect(result.numberOfLegs[0]).toEqual(5);
            expect(result.playerCount[5]).toEqual(2);
            expect(result.startingScore[5]).toEqual(501);
            expect(result.numberOfLegs[5]).toEqual(3);
            expect(result.playerCount[7]).toEqual(3);
            expect(result.startingScore[7]).toEqual(601);
            expect(result.numberOfLegs[7]).toEqual(3);
        });

        it('without match options, returns correctly for knockout fixture', () => {
            const matchOptions: GameMatchOptionDto[] = [];
            const result = getMatchOptionsLookup(matchOptions, true);

            expect(result).toBeTruthy();
            expect(result.playerCount[0]).toEqual(1);
            expect(result.startingScore[0]).toEqual(501);
            expect(result.numberOfLegs[0]).toEqual(3);
            expect(result.playerCount[5]).toEqual(2);
            expect(result.startingScore[5]).toEqual(501);
            expect(result.numberOfLegs[5]).toEqual(3);
            expect(result.playerCount[7]).toEqual(0);
            expect(result.startingScore[7]).toEqual(0);
            expect(result.numberOfLegs[7]).toEqual(0);
        });
    });
});
