import {ILayoutEngine} from "./ILayoutEngine";
import {TournamentSideDto} from "../../../interfaces/models/dtos/Game/TournamentSideDto";
import {ILayoutDataForMatch, ILayoutDataForRound, ILayoutDataForSide} from "../layout";
import {repeat} from "../../../helpers/projection";
import {
    getPrefixDecrementingMnemonicCalculator,
    getPrefixIncrementingMnemonicCalculator,
    IMnemonicGenerator
} from "./MnemonicGenerators";
import {any, skip, take} from "../../../helpers/collections";
import {ILayoutRequest} from "./ILayoutRequest";

interface IRequestContext {
    matchMnemonics: IMnemonicGenerator;
    onTheNightMnemonics: IMnemonicGenerator;
    sides: TournamentSideDto[];
    firstFullRoundNumberOfSides: number;
}

export class UnplayedEngine implements ILayoutEngine {
    calculate(request: ILayoutRequest): ILayoutDataForRound[] {
        const sideMnemonics: string[] = repeat(request.sides.length, this.getMnemonicForIndex);
        const log2NumberOfSides: number = Math.log2(sideMnemonics.length);
        const fullRoundCount: number = Math.floor(log2NumberOfSides);
        const firstFullRoundNumberOfSides: number = Math.pow(2, fullRoundCount);
        const preRoundTeams: number = request.sides.length - firstFullRoundNumberOfSides;
        const context: IRequestContext = {
            matchMnemonics: getPrefixIncrementingMnemonicCalculator('M'),
            onTheNightMnemonics: getPrefixDecrementingMnemonicCalculator(request.sides.length,''),
            sides: request.sides,
            firstFullRoundNumberOfSides,
        };

        const remainingSides: string[] = sideMnemonics.filter((s: string) => !!s); // copy the sides
        const preRound: ILayoutDataForRound = this.producePreRound(context, preRoundTeams, remainingSides, request.sides);
        let previousRound: ILayoutDataForRound = preRound;

        const subsequentRounds: ILayoutDataForRound[] = repeat(fullRoundCount).map(_ => {
            const round: ILayoutDataForRound = this.produceRound(context, previousRound, remainingSides);
            previousRound = round;
            return round;
        });

        return preRound
            ? [preRound].concat(subsequentRounds)
            : subsequentRounds;
    }

    private produceMatchesFromRemainingSides(context: IRequestContext, remainingSides: string[], count: number): ILayoutDataForMatch[] {
        return repeat(count).map(_ => {
            const sideA: string = remainingSides.shift();
            const sideB: string = remainingSides.shift();
            const numberOfSidesOnTheNight: string = context.onTheNightMnemonics.next();

            return this.match(context, this.side(sideA), this.side(sideB), numberOfSidesOnTheNight);
        });
    }

    private produceMatchesFromPreviousRoundWinners(context: IRequestContext, previousRoundMatches: ILayoutDataForMatch[],
                                                   remainingSides: string[], prioritisePossibleSides?: boolean): ILayoutDataForMatch[] {
        const matches: ILayoutDataForMatch[] = [];

        while (any(previousRoundMatches)) {
            const matchA: ILayoutDataForMatch = previousRoundMatches.shift();

            const matchB: ILayoutDataForMatch = prioritisePossibleSides && any(remainingSides) ? null : previousRoundMatches.shift(); // could be null;
            const sideB: string = matchB
                ? `winner(${matchB.mnemonic})`
                : this.throwIfNull(remainingSides.shift(), `No remaining sides for match ${matchA.mnemonic} to be played against`);

            const numberOfSidesOnTheNight: string = context.onTheNightMnemonics.next();
            const bothSidesAreWinners: boolean = sideB.startsWith('winner') || undefined;
            const matchAWinnerSide: ILayoutDataForSide = this.side(`winner(${matchA.mnemonic})`, bothSidesAreWinners ? undefined : true);
            const sideBSide: ILayoutDataForSide = this.side(sideB);

            matches.push(!matchB
                ? this.match(context, sideBSide, matchAWinnerSide, numberOfSidesOnTheNight)
                : this.match(context, matchAWinnerSide, sideBSide, numberOfSidesOnTheNight));
        }

        return matches;
    }

    private produceRound(context: IRequestContext, previousRound: ILayoutDataForRound, remainingSides: string[]): ILayoutDataForRound {
        const previousRoundMatches: ILayoutDataForMatch[] = previousRound
            ? previousRound.matches.filter((m: ILayoutDataForMatch) => !!m) // copy the array as it will be mutated
            : [];

        const remainingSidesForThisRoundExceptRequiredToPlayOffAgainstPreviousRound: number = previousRound ? Math.max(remainingSides.length - previousRound.matches.length, 0) : remainingSides.length;
        const remainingSidesExceptThoseRequiredForPreRound: string[] = take(remainingSides, remainingSidesForThisRoundExceptRequiredToPlayOffAgainstPreviousRound);
        const thisRoundMatches: ILayoutDataForMatch[] = !previousRound || previousRound.preRound
            ? this.produceMatchesFromRemainingSides(context, remainingSidesExceptThoseRequiredForPreRound, remainingSidesExceptThoseRequiredForPreRound.length / 2)
            : [];
        const previousRoundWinnerMatches: ILayoutDataForMatch[] = this.produceMatchesFromPreviousRoundWinners(
            context,
            previousRoundMatches,
            skip(remainingSides, remainingSidesForThisRoundExceptRequiredToPlayOffAgainstPreviousRound),
            previousRound && previousRound.preRound);

        return {
            matches: thisRoundMatches.concat(previousRoundWinnerMatches),
            name: this.getRoundName(context, thisRoundMatches.length + previousRoundWinnerMatches.length),
            possibleSides: context.sides,
            alreadySelectedSides: [],
            preRound: false,
        };
    }

    private producePreRound(context: IRequestContext, preRoundTeams: number, remainingSides: string[], sides: TournamentSideDto[]): ILayoutDataForRound {
        if (preRoundTeams <= 0) {
            return null;
        }

        return {
            matches: this.produceMatchesFromRemainingSides(context, remainingSides, preRoundTeams),
            name: 'Preliminary',
            possibleSides: sides,
            alreadySelectedSides: [],
            preRound: true,
        };
    }

    private throwIfNull<T>(value: T, message: string): T {
        if (!value) {
            throw new Error(message);
        }

        return value;
    }

    private side(mnemonic: string, showMnemonic?: boolean): ILayoutDataForSide {
        return {
            id: null,
            name: null,
            link: null,
            mnemonic,
            showMnemonic: showMnemonic,
        };
    }

    private match(context: IRequestContext, sideA: ILayoutDataForSide, sideB: ILayoutDataForSide, numberOfSidesOnTheNight?: string): ILayoutDataForMatch {
        return {
            sideA: sideA,
            sideB: sideB,
            scoreA: null,
            scoreB: null,
            mnemonic: context.matchMnemonics.next(),
            numberOfSidesOnTheNight,
        }
    }

    private getMnemonicForIndex(ordinal: number): string {
        const mnemonics: string = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        return mnemonics[ordinal];
    }

    private getRoundName(context: IRequestContext, matches: number): string {
        switch (matches) {
            case 4:
                return 'Quarter-Final';
            case 2:
                return 'Semi-Final';
            case 1:
                return 'Final';
            default:
                // const matchesInFirstFullRound: number = firstFullRoundNumberOfSides / 2;
                const totalNumberOfFullRounds: number = Math.log2(context.firstFullRoundNumberOfSides);
                const numberOfNonFinalRounds: number = totalNumberOfFullRounds - 3;
                const matchesPerNonFinalRound: number[] = repeat(numberOfNonFinalRounds, index => {
                    return Math.pow(2, (numberOfNonFinalRounds - index - 1) + 3);
                });

                const roundIndexForNumberOfMatches = matchesPerNonFinalRound.indexOf(matches);
                return `Round ${roundIndexForNumberOfMatches + 1}`;
        }
    }
}