import {TournamentSideDto} from "../../../interfaces/models/dtos/Game/TournamentSideDto";
import {ILayoutDataForMatch, ILayoutDataForRound, ILayoutDataForSide} from "../layout";
import {repeat} from "../../../helpers/projection";
import {getPrefixIncrementingMnemonicCalculator, IMnemonicAccumulator} from "./shared";
import {any, skip, take} from "../../../helpers/collections";

export function getUnplayedLayoutData(sides: TournamentSideDto[]): ILayoutDataForRound[] {
    if (sides.length <= 1) {
        return [];
    }

    const sideMnemonics: string[] = repeat(sides.length, getMnemonicForIndex);
    const log2NumberOfSides: number = Math.log2(sideMnemonics.length);
    const fullRoundCount: number = Math.floor(log2NumberOfSides);
    const firstFullRoundNumberOfSides: number = Math.pow(2, fullRoundCount);
    const preRoundTeams: number = sides.length - firstFullRoundNumberOfSides;

    const remainingSides: string[] = sideMnemonics.filter(s => !!s); // copy the sides
    const matchMnemonics: IMnemonicAccumulator = getPrefixIncrementingMnemonicCalculator('M');
    const preRound: ILayoutDataForRound = producePreRound(preRoundTeams, remainingSides, matchMnemonics, sides);
    let previousRound: ILayoutDataForRound = preRound;

    const subsequentRounds: ILayoutDataForRound[] = repeat(fullRoundCount).map(roundIndex => {
        const round: ILayoutDataForRound = produceRound(previousRound, remainingSides, matchMnemonics, sides, roundIndex === 0 ? firstFullRoundNumberOfSides : null);
        previousRound = round;
        return round;
    });

    return preRound
        ? [preRound].concat(subsequentRounds)
        : subsequentRounds;

}

function produceMatchesFromRemainingSides(remainingSides: string[], matchMnemonics: IMnemonicAccumulator): ILayoutDataForMatch[] {
    return repeat(remainingSides.length / 2).map(_ => {
        const sideA: string = remainingSides.shift();
        const sideB: string = remainingSides.shift();

        return match(sideA, sideB, matchMnemonics);
    });
}

function produceMatchesFromPreviousRoundWinners(previousRoundMatches: ILayoutDataForMatch[], remainingSides: string[],
                                                matchMnemonics: IMnemonicAccumulator, firstFullRoundNumberOfSides: number,
                                                showNumberOfSidesHint?: boolean, prioritisePossibleSides?: boolean): ILayoutDataForMatch[] {
    const matches: ILayoutDataForMatch[] = [];
    let currentNumberOfSidesOnTheNight: number = firstFullRoundNumberOfSides - (Math.floor(previousRoundMatches.length / 2));

    while (any(previousRoundMatches)) {
        const matchA: ILayoutDataForMatch = previousRoundMatches.shift();

        const matchB: ILayoutDataForMatch = prioritisePossibleSides && any(remainingSides) ? null : previousRoundMatches.shift(); // could be null;
        const sideB: string = matchB
            ? `winner(${matchB.mnemonic})`
            : throwIfNull(remainingSides.shift(), `No remaining sides for match ${matchA.mnemonic} to be played against`);

        const numberOfSidesOnTheNight: number = showNumberOfSidesHint
            ? currentNumberOfSidesOnTheNight++
            : undefined;

        matches.push(!matchB
            ? match(sideB, `winner(${matchA.mnemonic})`, matchMnemonics, numberOfSidesOnTheNight)
            : match(`winner(${matchA.mnemonic})`, sideB, matchMnemonics, numberOfSidesOnTheNight));
    }

    return matches;
}

function produceRound(previousRound: ILayoutDataForRound, remainingSides: string[], matchMnemonics: IMnemonicAccumulator,
                      sides: TournamentSideDto[], firstFullRoundNumberOfSides: number): ILayoutDataForRound {
    const previousRoundMatches: ILayoutDataForMatch[] = previousRound
        ? previousRound.matches.filter(m => !!m) // copy the array as it will be mutated
        : [];

    const remainingSidesForThisRoundExceptRequiredToPlayOffAgainstPreviousRound: number = previousRound ? Math.max(remainingSides.length - previousRound.matches.length, 0) : remainingSides.length;
    const remainingSidesExceptThoseRequiredForPreRound: string[] = take(remainingSides, remainingSidesForThisRoundExceptRequiredToPlayOffAgainstPreviousRound);
    const thisRoundMatches: ILayoutDataForMatch[] = !previousRound || previousRound.preRound
        ? produceMatchesFromRemainingSides(remainingSidesExceptThoseRequiredForPreRound, matchMnemonics)
        : [];
    const previousRoundWinnerMatches: ILayoutDataForMatch[] = produceMatchesFromPreviousRoundWinners(
        previousRoundMatches,
        skip(remainingSides, remainingSidesForThisRoundExceptRequiredToPlayOffAgainstPreviousRound),
        matchMnemonics,
        firstFullRoundNumberOfSides,
        !!firstFullRoundNumberOfSides,
        previousRound && previousRound.preRound);

    return {
        matches: thisRoundMatches.concat(previousRoundWinnerMatches),
        name: null,
        possibleSides: sides,
        alreadySelectedSides: [],
        preRound: false,
    };
}

function producePreRound(preRoundTeams: number, remainingSides: string[], matchMnemonics: IMnemonicAccumulator, sides: TournamentSideDto[]): ILayoutDataForRound {
    if (preRoundTeams <= 0) {
        return null;
    }

    return {
        matches: repeat(preRoundTeams).map(preRoundTeamIndex => {
            const sideA: string = remainingSides.shift();
            const sideB: string = remainingSides.shift();
            const numberOfSidesOnTheNight = sides.length - preRoundTeamIndex;

            return match(sideA, sideB, matchMnemonics, numberOfSidesOnTheNight);
        }),
        name: null,
        possibleSides: sides,
        alreadySelectedSides: [],
        preRound: true,
    };
}

function throwIfNull<T>(value: T, message: string): T {
    if (!value) {
        throw new Error(message);
    }

    return value;
}

function side(mnemonic: string, showMnemonic?: boolean): ILayoutDataForSide {
    return {
        id: null,
        name: null,
        link: null,
        mnemonic,
        showMnemonic: showMnemonic,
    };
}

function match(sideA: string, sideB: string, matchMnemonics: IMnemonicAccumulator, numberOfSidesOnTheNight?: number): ILayoutDataForMatch {
    return {
        sideA: side(sideA),
        sideB: side(sideB),
        scoreA: null,
        scoreB: null,
        mnemonic: matchMnemonics.next(),
        numberOfSidesOnTheNight,
    }
}

function getMnemonicForIndex(ordinal: number): string {
    const mnemonics: string = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    return mnemonics[ordinal];
}
