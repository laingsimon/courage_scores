import {getRoundName} from "./shared";

describe('shared', () => {
    describe('getRoundName', () => {
        it('given 1 match', () => {
            const result = getRoundName(1, 2);

            expect(result).toEqual('Final');
        });

        it('given 2 matches', () => {
            const result = getRoundName(2, 4);

            expect(result).toEqual('Semi-Final');
        });

        it('given 4 matches', () => {
            const result = getRoundName(4, 8);

            expect(result).toEqual('Quarter-Final');
        });

        it('given 8 matches', () => {
            const result = getRoundName(8, 16);

            expect(result).toEqual('Round 1');
        });

        it('given 16 matches in first round', () => {
            const firstRound = getRoundName(16, 32);
            const secondRound = getRoundName(8, 32);

            expect(firstRound).toEqual('Round 1');
            expect(secondRound).toEqual('Round 2');
        });

        it('given 32 matches in first round', () => {
            const firstRound = getRoundName(32, 64);
            const secondRound = getRoundName(16, 64);
            const thirdRound = getRoundName(8, 64);

            expect(firstRound).toEqual('Round 1');
            expect(secondRound).toEqual('Round 2');
            expect(thirdRound).toEqual('Round 3');
        });
    });
});