import {TournamentSideDto} from "../../../interfaces/models/dtos/Game/TournamentSideDto";
import {ILayoutDataForMatch, ILayoutDataForRound, ILayoutDataForSide} from "../layout";
import {repeat} from "../../../helpers/projection";
import {getPrefixIncrementingMnemonicCalculator, IMnemonicAccumulator} from "./shared";
import {any} from "../../../helpers/collections";

export function getUnplayedLayoutData(sides: TournamentSideDto[]): ILayoutDataForRound[] {
    if (sides.length <= 1) {
        return [];
    }

    const sideMnemonics: string[] = repeat(sides.length, getMnemonicForIndex);
    const log2NumberOfSides: number = Math.log2(sideMnemonics.length);
    const fullRoundCount: number = Math.floor(log2NumberOfSides);
    const preRoundTeams: number = sides.length - Math.pow(2, fullRoundCount);

    const remainingSides: string[] = sideMnemonics.filter(s => !!s); // copy the sides
    const matchMnemonics: IMnemonicAccumulator = getPrefixIncrementingMnemonicCalculator('M');
    const rounds: ILayoutDataForRound[] = producePreRoundMatches(preRoundTeams, remainingSides, matchMnemonics, sides);

    for (let roundIndex = 0; roundIndex < fullRoundCount; roundIndex++) {
        rounds.push(produceRound(rounds, remainingSides, matchMnemonics, sides, roundIndex === 0));
    }

    return rounds;
}

function produceMatchesFromRemainingSides(remainingSides: string[], matchMnemonics: IMnemonicAccumulator): ILayoutDataForMatch[] {
    const matches: ILayoutDataForMatch[] = [];
    while (remainingSides.length >= 2) {
        const sideA: string = remainingSides.shift();
        const sideB: string = remainingSides.shift();

        matches.push(match(sideA, sideB, matchMnemonics));
    }

    return matches;
}

function produceMatchesFromPreviousRoundWinners(previousRoundMatches: ILayoutDataForMatch[], remainingSides: string[],
                                                matchMnemonics: IMnemonicAccumulator, thisRoundMatches: number,
                                                showNumberOfSidesHint?: boolean, prioritisePossibleSides?: boolean): ILayoutDataForMatch[] {
    const matches: ILayoutDataForMatch[] = [];

    while (any(previousRoundMatches)) {
        const remainingSideLength: number = remainingSides.length + previousRoundMatches.length;
        const matchA: ILayoutDataForMatch = previousRoundMatches.shift();
        const matchB: ILayoutDataForMatch = prioritisePossibleSides ? null : previousRoundMatches.shift(); // could be null;
        const sideB: string = matchB
            ? `winner(${matchB.mnemonic})`
            : throwIfNull(remainingSides.shift(), `No remaining sides for match ${matchA.mnemonic} to be played against`);

        const numberOfSidesOnTheNight: number = showNumberOfSidesHint
            ? (thisRoundMatches * 2) + remainingSideLength
            : undefined;
        matches.push(prioritisePossibleSides
            ? match(sideB, `winner(${matchA.mnemonic})`, matchMnemonics, numberOfSidesOnTheNight)
            : match(`winner(${matchA.mnemonic})`, sideB, matchMnemonics, numberOfSidesOnTheNight));
    }

    return matches;
}

function produceRound(rounds: ILayoutDataForRound[], remainingSides: string[], matchMnemonics: IMnemonicAccumulator, sides: TournamentSideDto[], showNumberOfSidesHint?: boolean): ILayoutDataForRound {
    const previousRound: ILayoutDataForRound = any(rounds) ? rounds[rounds.length - 1] : null;
    const previousRoundMatches: ILayoutDataForMatch[] = previousRound
        ? previousRound.matches.filter(m => !!m) // copy the array as it will be mutated
        : [];

    const remainingSidesForThisRoundExceptRequiredToPlayOffAgainstPreviousRound: number = previousRound ? remainingSides.length - previousRound.matches.length : remainingSides.length;
    const remainingSidesExceptThoseRequiredForPreRound: string[] = remainingSides.filter((_, index) => index < remainingSidesForThisRoundExceptRequiredToPlayOffAgainstPreviousRound);
    const thisRoundMatches: ILayoutDataForMatch[] = !previousRound || previousRound.preRound
        ? produceMatchesFromRemainingSides(remainingSidesExceptThoseRequiredForPreRound, matchMnemonics)
        : [];
    const previousRoundWinnerMatches: ILayoutDataForMatch[] = produceMatchesFromPreviousRoundWinners(
        previousRoundMatches,
        remainingSides.filter((_, index) => index >= remainingSidesForThisRoundExceptRequiredToPlayOffAgainstPreviousRound),
        matchMnemonics,
        thisRoundMatches.length,
        showNumberOfSidesHint,
        previousRound && previousRound.preRound);

    return {
        matches: thisRoundMatches.concat(previousRoundWinnerMatches),
        name: null,
        possibleSides: sides,
        alreadySelectedSides: [],
        preRound: false,
    };
}

function producePreRoundMatches(preRoundTeams: number, remainingSides: string[], matchMnemonics: IMnemonicAccumulator, sides: TournamentSideDto[]): ILayoutDataForRound[] {
    if (preRoundTeams <= 0) {
        return [];
    }

    const round: ILayoutDataForRound = {
        matches: [],
        name: null,
        possibleSides: sides,
        alreadySelectedSides: [],
        preRound: true,
    };

    for (let preRoundTeamIndex = 0; preRoundTeamIndex < preRoundTeams; preRoundTeamIndex++) {
        const sideA: string = remainingSides.shift();
        const sideB: string = remainingSides.shift();
        const numberOfSidesOnTheNight = sides.length - preRoundTeamIndex;

        round.matches.push(match(sideA, sideB, matchMnemonics, numberOfSidesOnTheNight));
    }

    return [ round ];
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
        showMnemonic,
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
