import {ILayoutEngine} from "./ILayoutEngine";
import {TournamentSideDto} from "../../../interfaces/models/dtos/Game/TournamentSideDto";
import {ILayoutDataForMatch, ILayoutDataForRound, ILayoutDataForSide} from "../layout";
import {repeat} from "../../../helpers/projection";
import {getPrefixIncrementingMnemonicCalculator, IMnemonicGenerator} from "./MnemonicGenerators";
import {any, skip, take} from "../../../helpers/collections";
import {ILayoutRequest} from "./ILayoutRequest";

export class UnplayedEngine implements ILayoutEngine {
    calculate(request: ILayoutRequest): ILayoutDataForRound[] {
        const matchMnemonics: IMnemonicGenerator = getPrefixIncrementingMnemonicCalculator('M');
        const sideMnemonics: string[] = repeat(request.sides.length, this.getMnemonicForIndex);
        const log2NumberOfSides: number = Math.log2(sideMnemonics.length);
        const fullRoundCount: number = Math.floor(log2NumberOfSides);
        const firstFullRoundNumberOfSides: number = Math.pow(2, fullRoundCount);
        const preRoundTeams: number = request.sides.length - firstFullRoundNumberOfSides;

        const remainingSides: string[] = sideMnemonics.filter(s => !!s); // copy the sides
        const preRound: ILayoutDataForRound = this.producePreRound(matchMnemonics, preRoundTeams, remainingSides, request.sides);
        let previousRound: ILayoutDataForRound = preRound;

        const subsequentRounds: ILayoutDataForRound[] = repeat(fullRoundCount).map(roundIndex => {
            const round: ILayoutDataForRound = this.produceRound(matchMnemonics, previousRound, remainingSides, request.sides, roundIndex === 0 ? firstFullRoundNumberOfSides : null);
            previousRound = round;
            return round;
        });

        return preRound
            ? [preRound].concat(subsequentRounds)
            : subsequentRounds;
    }

    private produceMatchesFromRemainingSides(matchMnemonics: IMnemonicGenerator, remainingSides: string[]): ILayoutDataForMatch[] {
        return repeat(remainingSides.length / 2).map(_ => {
            const sideA: string = remainingSides.shift();
            const sideB: string = remainingSides.shift();

            return this.match(matchMnemonics, sideA, sideB);
        });
    }

    private produceMatchesFromPreviousRoundWinners(matchMnemonics: IMnemonicGenerator, previousRoundMatches: ILayoutDataForMatch[],
                                                   remainingSides: string[], firstFullRoundNumberOfSides: number,
                                                   showNumberOfSidesHint?: boolean, prioritisePossibleSides?: boolean): ILayoutDataForMatch[] {
        const matches: ILayoutDataForMatch[] = [];
        let currentNumberOfSidesOnTheNight: number = firstFullRoundNumberOfSides - (Math.floor(previousRoundMatches.length / 2));

        while (any(previousRoundMatches)) {
            const matchA: ILayoutDataForMatch = previousRoundMatches.shift();

            const matchB: ILayoutDataForMatch = prioritisePossibleSides && any(remainingSides) ? null : previousRoundMatches.shift(); // could be null;
            const sideB: string = matchB
                ? `winner(${matchB.mnemonic})`
                : this.throwIfNull(remainingSides.shift(), `No remaining sides for match ${matchA.mnemonic} to be played against`);

            const numberOfSidesOnTheNight: number = showNumberOfSidesHint
                ? currentNumberOfSidesOnTheNight++
                : undefined;

            matches.push(!matchB
                ? this.match(matchMnemonics, sideB, `winner(${matchA.mnemonic})`, numberOfSidesOnTheNight)
                : this.match(matchMnemonics, `winner(${matchA.mnemonic})`, sideB, numberOfSidesOnTheNight));
        }

        return matches;
    }

    private produceRound(matchMnemonics: IMnemonicGenerator, previousRound: ILayoutDataForRound, remainingSides: string[],
                         sides: TournamentSideDto[], firstFullRoundNumberOfSides: number): ILayoutDataForRound {
        const previousRoundMatches: ILayoutDataForMatch[] = previousRound
            ? previousRound.matches.filter(m => !!m) // copy the array as it will be mutated
            : [];

        const remainingSidesForThisRoundExceptRequiredToPlayOffAgainstPreviousRound: number = previousRound ? Math.max(remainingSides.length - previousRound.matches.length, 0) : remainingSides.length;
        const remainingSidesExceptThoseRequiredForPreRound: string[] = take(remainingSides, remainingSidesForThisRoundExceptRequiredToPlayOffAgainstPreviousRound);
        const thisRoundMatches: ILayoutDataForMatch[] = !previousRound || previousRound.preRound
            ? this.produceMatchesFromRemainingSides(matchMnemonics, remainingSidesExceptThoseRequiredForPreRound)
            : [];
        const previousRoundWinnerMatches: ILayoutDataForMatch[] = this.produceMatchesFromPreviousRoundWinners(
            matchMnemonics,
            previousRoundMatches,
            skip(remainingSides, remainingSidesForThisRoundExceptRequiredToPlayOffAgainstPreviousRound),
            firstFullRoundNumberOfSides,
            !!firstFullRoundNumberOfSides,
            previousRound && previousRound.preRound);

        return {
            matches: thisRoundMatches.concat(previousRoundWinnerMatches),
            name: this.getRoundName(thisRoundMatches.length + previousRoundWinnerMatches.length, firstFullRoundNumberOfSides),
            possibleSides: sides,
            alreadySelectedSides: [],
            preRound: false,
        };
    }

    private producePreRound(matchMnemonics: IMnemonicGenerator, preRoundTeams: number, remainingSides: string[], sides: TournamentSideDto[]): ILayoutDataForRound {
        if (preRoundTeams <= 0) {
            return null;
        }

        return {
            matches: repeat(preRoundTeams).map(preRoundTeamIndex => {
                const sideA: string = remainingSides.shift();
                const sideB: string = remainingSides.shift();
                const numberOfSidesOnTheNight: number = sides.length - preRoundTeamIndex;

                return this.match(matchMnemonics, sideA, sideB, numberOfSidesOnTheNight);
            }),
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

    private match(matchMnemonics: IMnemonicGenerator, sideA: string, sideB: string, numberOfSidesOnTheNight?: number): ILayoutDataForMatch {
        return {
            sideA: this.side(sideA),
            sideB: this.side(sideB, !!numberOfSidesOnTheNight),
            scoreA: null,
            scoreB: null,
            mnemonic: matchMnemonics.next(),
            numberOfSidesOnTheNight,
        }
    }

    private getMnemonicForIndex(ordinal: number): string {
        const mnemonics: string = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        return mnemonics[ordinal];
    }

    private getRoundName(matches: number, firstFullRoundNumberOfSides: number): string {
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
}