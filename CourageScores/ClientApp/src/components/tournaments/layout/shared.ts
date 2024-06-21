import {repeat} from "../../../helpers/projection";

export interface IMnemonicAccumulator {
    next(): string;
}

export function getPrefixIncrementingMnemonicCalculator(prefix: string): IMnemonicAccumulator {
    let index: number = 0;
    return {
        next(): string {
            return prefix + (++index);
        }
    };
}

export function getRoundName(matches: number, firstFullRoundNumberOfSides: number): string {
    switch (matches) {
        case 4:
            return 'Quarter-Final';
        case 2:
            return 'Semi-Final';
        case 1:
            return 'Final';
        default:
            // const matchesInFirstFullRound: number = firstFullRoundNumberOfSides / 2;
            const totalNumberOfFullRounds: number = Math.log2(firstFullRoundNumberOfSides);
            const numberOfNonFinalRounds: number = totalNumberOfFullRounds - 3;
            const matchesPerNonFinalRound: number[] = repeat(numberOfNonFinalRounds, index => {
                return Math.pow(2, (numberOfNonFinalRounds - index - 1) + 3);
            });

            const roundIndexForNumberOfMatches = matchesPerNonFinalRound.indexOf(matches);
            return `Round ${roundIndexForNumberOfMatches + 1}`;
    }
}
