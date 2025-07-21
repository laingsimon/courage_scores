import { ILayoutEngine } from './ILayoutEngine';
import { TournamentSideDto } from '../../../interfaces/models/dtos/Game/TournamentSideDto';
import { repeat } from '../../../helpers/projection';
import {
    getPrefixDecrementingMnemonicCalculator,
    getPrefixIncrementingMnemonicCalculator,
    getSideMnemonicGenerator,
    IMnemonicGenerator,
} from './MnemonicGenerators';
import { any, batchValues, skip, take } from '../../../helpers/collections';
import { ILayoutRequest } from './ILayoutRequest';
import { ILayoutDataForRound } from './ILayoutDataForRound';
import { ILayoutDataForMatch } from './ILayoutDataForMatch';
import { ILayoutDataForSide } from './ILayoutDataForSide';

interface IRequestContext {
    matchMnemonics: IMnemonicGenerator;
    onTheNightMnemonics: IMnemonicGenerator;
    sides: TournamentSideDto[];
    firstFullRoundNumberOfSides: number;
}

export class UnplayedEngine implements ILayoutEngine {
    calculate(request: ILayoutRequest): ILayoutDataForRound[] {
        const sideMnemonicGenerator: IMnemonicGenerator =
            getSideMnemonicGenerator();
        const sideMnemonics: string[] = repeat(request.sides.length, () =>
            sideMnemonicGenerator.next(),
        );
        const log2NumberOfSides: number = Math.log2(sideMnemonics.length);
        const fullRoundCount: number = Math.floor(log2NumberOfSides);
        const firstFullRoundNumberOfSides: number = Math.pow(2, fullRoundCount);
        const preRoundTeams: number =
            request.sides.length - firstFullRoundNumberOfSides;
        const context: IRequestContext = {
            matchMnemonics: getPrefixIncrementingMnemonicCalculator('M'),
            onTheNightMnemonics: getPrefixDecrementingMnemonicCalculator(
                request.sides.length,
                '',
            ),
            sides: request.sides,
            firstFullRoundNumberOfSides,
        };

        const remainingSides: string[] = sideMnemonics.filter(
            (s: string) => !!s,
        ); // copy the sides
        const preRound: ILayoutDataForRound[] = this.producePreRound(
            context,
            preRoundTeams,
            remainingSides,
            request.sides,
        );
        let previousRound: ILayoutDataForRound = preRound[0];

        const subsequentRounds: ILayoutDataForRound[] = repeat(
            fullRoundCount,
        ).map(() => {
            const round: ILayoutDataForRound = this.produceRound(
                context,
                previousRound,
                remainingSides,
            );
            previousRound = round;
            return round;
        });

        return preRound.concat(subsequentRounds);
    }

    private producePreRound(
        context: IRequestContext,
        preRoundTeams: number,
        remainingSides: string[],
        sides: TournamentSideDto[],
    ): ILayoutDataForRound[] {
        if (preRoundTeams <= 0) {
            return [];
        }

        return [
            {
                matches: this.produceMatchesFromRemainingSides(
                    context,
                    remainingSides,
                    preRoundTeams,
                ),
                name: 'Preliminary',
                possibleSides: sides,
                alreadySelectedSides: [],
                preRound: true,
            },
        ];
    }

    private produceRound(
        context: IRequestContext,
        previousRound: ILayoutDataForRound,
        remainingSides: string[],
    ): ILayoutDataForRound {
        const previousRoundMatches: ILayoutDataForMatch[] = previousRound
            ? previousRound.matches.filter((m: ILayoutDataForMatch) => !!m) // copy the array as it will be mutated
            : [];

        const remainingSidesForThisRoundExceptRequiredToPlayOffAgainstPreviousRound: number =
            previousRound ? 0 : remainingSides.length;
        const remainingSidesExceptThoseRequiredForPreRound: string[] = take(
            remainingSides,
            remainingSidesForThisRoundExceptRequiredToPlayOffAgainstPreviousRound,
        );
        const thisRoundMatches: ILayoutDataForMatch[] =
            !previousRound || previousRound.preRound
                ? this.produceMatchesFromRemainingSides(
                      context,
                      remainingSidesExceptThoseRequiredForPreRound,
                      remainingSidesExceptThoseRequiredForPreRound.length / 2,
                  )
                : [];
        const previousRoundWinnerMatches: ILayoutDataForMatch[] =
            this.produceMatchesFromPreviousRoundWinners(
                context,
                previousRoundMatches,
                skip(
                    remainingSides,
                    remainingSidesForThisRoundExceptRequiredToPlayOffAgainstPreviousRound,
                ),
                any(remainingSides),
            );
        while (any(remainingSides)) {
            remainingSides.shift();
        }

        return {
            matches: thisRoundMatches.concat(previousRoundWinnerMatches),
            name: this.getRoundName(
                context,
                thisRoundMatches.length + previousRoundWinnerMatches.length,
            ),
            possibleSides: context.sides,
            alreadySelectedSides: [],
            preRound: false,
        };
    }

    private produceMatchesFromRemainingSides(
        context: IRequestContext,
        remainingSides: string[],
        count: number,
    ): ILayoutDataForMatch[] {
        return repeat(count).map(() => {
            const sideA: string | undefined = remainingSides.shift();
            const sideB: string | undefined = remainingSides.shift();
            const numberOfSidesOnTheNight: string =
                context.onTheNightMnemonics.next();

            return this.match(
                context,
                this.side(sideA!),
                this.side(sideB!),
                numberOfSidesOnTheNight,
            );
        });
    }

    private produceMatchesFromPreviousRoundWinners(
        context: IRequestContext,
        previousRoundMatches: ILayoutDataForMatch[],
        remainingSides: string[],
        showMnemonics: boolean,
    ): ILayoutDataForMatch[] {
        return Array.from(
            batchValues(
                remainingSides.concat(
                    previousRoundMatches.map((m) => `winner(${m.mnemonic})`),
                ),
                2,
            ),
        ).map((pair) => {
            const sideAMnemonic: string = pair[0];
            const sideBMnemonic: string | undefined = pair[1]; // could be, but shouldn't be, undefined

            const numberOfSidesOnTheNight: string =
                context.onTheNightMnemonics.next();
            const sideASide: ILayoutDataForSide = this.side(
                sideAMnemonic,
                (showMnemonics && sideAMnemonic.startsWith('winner')) ||
                    undefined,
            );
            const sideBSide: ILayoutDataForSide = this.side(
                sideBMnemonic,
                (showMnemonics && sideBMnemonic?.startsWith('winner')) ||
                    undefined,
            );

            return this.match(
                context,
                sideASide,
                sideBSide,
                numberOfSidesOnTheNight,
            );
        });
    }

    private side(mnemonic: string, showMnemonic?: boolean): ILayoutDataForSide {
        return {
            id: '',
            name: '',
            mnemonic,
            showMnemonic: showMnemonic,
        };
    }

    private match(
        context: IRequestContext,
        sideA: ILayoutDataForSide,
        sideB: ILayoutDataForSide,
        numberOfSidesOnTheNight?: string,
    ): ILayoutDataForMatch {
        return {
            sideA: sideA,
            sideB: sideB,
            scoreA: '',
            scoreB: '',
            mnemonic: context.matchMnemonics.next(),
            numberOfSidesOnTheNight,
        };
    }

    private getRoundName(context: IRequestContext, matches: number): string {
        switch (matches) {
            case 4:
                return 'Quarter-Final';
            case 2:
                return 'Semi-Final';
            case 1:
                return 'Final';
            default: {
                // const matchesInFirstFullRound: number = firstFullRoundNumberOfSides / 2;
                const totalNumberOfFullRounds: number = Math.log2(
                    context.firstFullRoundNumberOfSides,
                );
                const numberOfNonFinalRounds: number =
                    totalNumberOfFullRounds - 3;
                const matchesPerNonFinalRound: number[] = repeat(
                    numberOfNonFinalRounds,
                    (index) => {
                        return Math.pow(
                            2,
                            numberOfNonFinalRounds - index - 1 + 3,
                        );
                    },
                );

                const roundIndexForNumberOfMatches =
                    matchesPerNonFinalRound.indexOf(matches);
                return `Round ${roundIndexForNumberOfMatches + 1}`;
            }
        }
    }
}
