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
    const numberOfRounds: number = Math.ceil(log2NumberOfSides);
    const preRoundTeams: number = sides.length - Math.pow(2, fullRoundCount);
    console.debug({
        sides: sides.length,
        fullRoundCount,
        numberOfRounds,
        preRoundTeams,
    });

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

function produceMatchesFromPreviousRoundWinners(previousRoundMatches: ILayoutDataForMatch[], remainingSides: string[], matchMnemonics: IMnemonicAccumulator, showNumberOfSidesHint?: boolean): ILayoutDataForMatch[] {
    const matches: ILayoutDataForMatch[] = [];

    while (any(previousRoundMatches)) {
        const remainingSideLength = remainingSides.length + previousRoundMatches.length;
        const matchA: ILayoutDataForMatch = previousRoundMatches.shift();
        const matchB: ILayoutDataForMatch = previousRoundMatches.shift(); // could be null;
        const sideB: string = matchB
            ? `winner(${matchB.mnemonic})`
            : throwIfNull(remainingSides.pop(), `No remaining sides for match ${matchA.mnemonic} to be played against`);

        matches.push(match(`winner(${matchA.mnemonic})`, sideB, matchMnemonics, showNumberOfSidesHint ? remainingSideLength : null));
    }

    return matches;
}

function produceRound(rounds: ILayoutDataForRound[], remainingSides: string[], matchMnemonics: IMnemonicAccumulator, sides: TournamentSideDto[], showNumberOfSidesHint?: boolean): ILayoutDataForRound {
    const previousRound: ILayoutDataForRound = any(rounds) ? rounds[rounds.length - 1] : null;
    const previousRoundMatches: ILayoutDataForMatch[] = previousRound
        ? previousRound.matches.filter(m => !!m) // copy the array as it will be mutated
        : [];

    const previousRoundWinnerMatches: ILayoutDataForMatch[] = produceMatchesFromPreviousRoundWinners(previousRoundMatches, remainingSides, matchMnemonics, showNumberOfSidesHint);
    const thisRoundMatches: ILayoutDataForMatch[] = produceMatchesFromRemainingSides(remainingSides, matchMnemonics);

    return {
        matches: thisRoundMatches.concat(previousRoundWinnerMatches),
        name: null,
        possibleSides: sides,
        alreadySelectedSides: [],
    };
}

function producePreRoundMatches(preRoundTeams: number, remainingSides: string[], matchMnemonics: IMnemonicAccumulator, sides: TournamentSideDto[]): ILayoutDataForRound[] {
    if (preRoundTeams <= 0) {
        return [];
    }

    const round: ILayoutDataForRound = {
        matches: [],
        name: '',
        possibleSides: sides,
        alreadySelectedSides: [],
    };

    for (let preRoundTeamIndex = 0; preRoundTeamIndex < preRoundTeams; preRoundTeamIndex++) {
        const sideA: string = remainingSides.shift();
        const sideB: string = remainingSides.shift();
        const numberOfSidesOnTheNight = sides.length - preRoundTeamIndex;

        console.debug({
            sideA,
            sideB,
            numberOfSidesOnTheNight,
        });

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
