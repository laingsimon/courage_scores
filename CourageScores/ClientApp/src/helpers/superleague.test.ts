import {
    countLegThrowsBetween,
    countMatch100,
    countMatch140,
    countMatch180,
    getMatchWinner,
    getNoOfLegs,
    isLegWinner,
    legActualDarts,
    legGameShot,
    legScoreLeft,
    legsWon,
    legTons,
    legTonsSplit,
    matchTons,
    maxNoOfThrowsAllMatches,
    playerOverallAverage,
    sumOverThrows
} from "./superleague";
import {ScoreAsYouGoDto} from "../interfaces/models/dtos/Game/Sayg/ScoreAsYouGoDto";
import {LegDto} from "../interfaces/models/dtos/Game/Sayg/LegDto";
import {ISuperleagueSayg} from "../components/tournaments/superleague/ISuperleagueSayg";
import {LegThrowDto} from "../interfaces/models/dtos/Game/Sayg/LegThrowDto";
import {LegCompetitorScoreDto} from "../interfaces/models/dtos/Game/Sayg/LegCompetitorScoreDto";
import {sum} from "./collections";

describe('superleague', () => {
    const ton: LegThrowDto = thr(100);
    const nullThrows: LegCompetitorScoreDto = {
        throws: null!,
        noOfDarts: 0,
        score: 0,
    };

    function thr(score: number, bust: boolean = false, noOfDarts: number = 3): LegThrowDto {
        return {
            score,
            noOfDarts,
            bust,
        };
    }

    function score(...throws: LegThrowDto[]): LegCompetitorScoreDto {
        return {
            noOfDarts: sum(throws, thr => thr.noOfDarts),
            throws: throws,
            score: sum(throws, thr => thr.bust ? 0 : thr.score),
        };
    }

    function leg(homeThrows: LegCompetitorScoreDto, awayThrows?: LegCompetitorScoreDto, isLastLeg?: boolean, winner?: string): LegDto {
        return {
            home: homeThrows,
            away: awayThrows,
            startingScore: 501,
            isLastLeg,
            winner,
        };
    }

    describe('playerOverallAverage', () => {
        it('when null saygData should return null', () => {
            const result = playerOverallAverage(null, 'home');

            expect(result).toBeNull();
        });

        it('calculates correct average for home', () => {
            const saygData: ScoreAsYouGoDto = {
                legs: {
                    0: leg(score(ton, thr(150, true))),
                    1: leg(score(thr(50, false, 2)))
                }
            };

            const result = playerOverallAverage(saygData, 'home');

            expect(result).toEqual((100 + 50) / (3 + 3 + 2));
        });
    });

    describe('countMatch100', () => {
        it('should return null when null data', () => {
            const result = countMatch100(null, 'home');

            expect(result).toBeNull();
        });

        it('should return null when no legs', () => {
            const result = countMatch100({legs: null}, 'home');

            expect(result).toBeNull();
        });

        it('should return count of scores greater-than-or-equal 100 and less than 140', () => {
            const saygData: ScoreAsYouGoDto = {
                legs: {
                    0: leg(score(
                        /* valid */
                        ton, thr(139),

                        /* invalid */
                        thr(99), thr(100, true), thr(140))),
                }
            }

            const result = countMatch100(saygData, 'home');

            expect(result).toEqual(2);
        });
    });

    describe('countMatch140', () => {
        it('should return null when null data', () => {
            const result = countMatch140(null, 'home');

            expect(result).toBeNull();
        });

        it('should return null when no legs', () => {
            const result = countMatch140({legs: null}, 'home');

            expect(result).toBeNull();
        });

        it('should return count of scores greater-than-or-equal 140 and less than 180', () => {
            const saygData: ScoreAsYouGoDto = {
                legs: {
                    0: leg(score(
                        /* valid */
                        thr(140), thr(179),

                        /* invalid */
                        thr(139), thr(140, true), thr(180))),
                }
            }

            const result = countMatch140(saygData, 'home');

            expect(result).toEqual(2);
        });
    });

    describe('countMatch180', () => {
        it('should return null when null data', () => {
            const result = countMatch180(null, 'home');

            expect(result).toBeNull();
        });

        it('should return null when no legs', () => {
            const result = countMatch180({legs: null}, 'home');

            expect(result).toBeNull();
        });

        it('should return count of scores greater-than-or-equal 140 and less than 180', () => {
            const saygData: ScoreAsYouGoDto = {
                legs: {
                    0: leg(score(
                        /* valid */
                        thr(180),

                        /* invalid */
                        thr(179), thr(180, true))),
                }
            }

            const result = countMatch180(saygData, 'home');

            expect(result).toEqual(1);
        });
    });

    describe('matchTons', () => {
        it('should return 0 when null data', () => {
            const result = matchTons(null, 'home');

            expect(result).toEqual(0);
        });

        it('should return 0 when no legs', () => {
            const result = matchTons({legs: null}, 'home');

            expect(result).toEqual(0);
        });

        it('should return count of scores greater-than-or-equal 140 and less than 180', () => {
            const saygData: ScoreAsYouGoDto = {
                legs: {
                    0: leg(score(ton, thr(140), thr(180))),
                }
            }

            const result = matchTons(saygData, 'home');

            /* 100 + 140 + 180 (which counts for 2) */
            expect(result).toEqual(1 + 1 + 2);
        });
    });

    describe('getNoOfLegs', () => {
        it('should return null if null data', () => {
            const result = getNoOfLegs(null);

            expect(result).toBeNull();
        });

        it('should return 0 if no legs data', () => {
            const result = getNoOfLegs({legs: null});

            expect(result).toEqual(0);
        });

        it('should return no of legs with scores', () => {
            const saygData: ScoreAsYouGoDto = {
                legs: {
                    0: leg(score(thr(0)), score()),
                    1: leg(score(), score(thr(0))),
                    2: leg(score(), score()),
                }
            };

            const result = getNoOfLegs(saygData);

            expect(result).toEqual(2);
        });
    });

    describe('sumOverThrows', () => {
        it('should return null given null data', () => {
            const result = sumOverThrows(null, 'home', 'noOfDarts');

            expect(result).toBeNull();
        });

        it('should return 0 given no legs', () => {
            const result = sumOverThrows({legs: null}, 'home', 'noOfDarts');

            expect(result).toEqual(0);
        });

        it('should return 0 given no prop', () => {
            const result = sumOverThrows({legs: {}}, 'home', 'unknown');

            expect(result).toEqual(0);
        });

        it('should return sum of props', () => {
            const legs: { [key: number]: LegDto } = {
                0: leg(score(thr(0, false, 1), thr(0, false, 2), thr(0)))
            };
            const result = sumOverThrows({legs: legs}, 'home', 'noOfDarts', false);

            expect(result).toEqual(6);
        });

        it('should return sum of non-bust props', () => {
            const legs: { [key: number]: LegDto } = {
                0: leg(score(thr(0, false, 1), thr(0, true, 2), thr(0)))
            };
            const result = sumOverThrows({legs: legs}, 'home', 'noOfDarts', false);

            expect(result).toEqual(4);
        });

        it('should return sum of bust and non-bust props', () => {
            const legs: { [key: number]: LegDto } = {
                0: leg(score(thr(0, false, 1), thr(0, true, 2), thr(0)))
            };
            const result = sumOverThrows({legs: legs}, 'home', 'noOfDarts', true);

            expect(result).toEqual(6);
        });
    });

    describe('maxNoOfThrowsAllMatches', () => {
        it('should return 0 when no matches', () => {
            const result = maxNoOfThrowsAllMatches([]);

            expect(result).toEqual(0);
        });

        it('should return 0 when no sayg data', () => {
            const result = maxNoOfThrowsAllMatches([{}]);

            expect(result).toEqual(0);
        });

        it('should return 0 when no sayg legs', () => {
            const saygMatch: ISuperleagueSayg = {saygData: {legs:{}}}
            const result = maxNoOfThrowsAllMatches([saygMatch]);

            expect(result).toEqual(0);
        });

        it('should return home no of throws when greater than away', () => {
            const saygMatch: ISuperleagueSayg = {
                saygData: {
                    legs: {
                        0: leg(
                            score(thr(0), thr(0), thr(0, true)),
                            score(thr(0), thr(0)))
                    }
                }
            };

            const result = maxNoOfThrowsAllMatches([saygMatch]);

            expect(result).toEqual(3);
        });

        it('should return away no of throws when greater than home', () => {
            const saygMatch: ISuperleagueSayg = {
                saygData: {
                    legs: {
                        0: leg(
                            score(thr(0), thr(0), thr(0)),
                            score(thr(0), thr(0), thr(0), thr(0, true))),
                    }
                }
            };

            const result = maxNoOfThrowsAllMatches([saygMatch]);

            expect(result).toEqual(4);
        });
    });

    describe('getMatchWinner', () => {
        it('should return home when home checkout', () => {
            const saygData: ScoreAsYouGoDto = {
                legs: {
                    0: leg(
                        score(ton, ton, ton, ton, thr(50), thr(51, true), thr(51)),
                        score(ton, ton, ton, ton))
                }
            };

            const result = getMatchWinner(saygData);

            expect(result).toEqual('home');
        });

        it('should return away when away checkout', () => {
            const saygData: ScoreAsYouGoDto = {
                legs: {
                    0: leg(
                        score(ton, ton, ton, ton),
                        score(ton, ton, ton, ton, thr(50), thr(51, true), thr(51)))
                }
            };

            const result = getMatchWinner(saygData);

            expect(result).toEqual('away');
        });

        it('should return empty when no checkout', () => {
            const saygData: ScoreAsYouGoDto = {
                legs: {
                    0: leg(
                        score(ton, ton, ton, ton),
                        score(ton, ton, ton, ton))
                }
            };

            const result = getMatchWinner(saygData);

            expect(result).toEqual('');
        });
    });

    describe('isLegWinner', () => {
        it('returns true if winner set to accumulator name', () => {
            const l: LegDto = leg(score(), null, false, 'home');

            const result = isLegWinner(l, 'home');

            expect(result).toEqual(true);
        });

        it('returns true if accumulator has checkout score', () => {
            const l: LegDto = leg(score(ton, ton, ton, ton, thr(100, true), thr(101)));

            const result = isLegWinner(l, 'home');

            expect(result).toEqual(true);
        });

        it('returns false if accumulator not checked out', () => {
            const l: LegDto = leg(score(ton, ton, ton));

            const result = isLegWinner(l, 'home');

            expect(result).toEqual(false);
        });
    });

    describe('legsWon', () => {
        it('should return 0 when no matches', () => {
            const result = legsWon([], 'home');

            expect(result).toEqual(0);
        });

        it('should return 0 when no data for matches', () => {
            const result = legsWon([{saygData: null}], 'home');

            expect(result).toEqual(0);
        });

        it('should return 0 when no legs for data', () => {
            const saygData: ScoreAsYouGoDto = {legs: null!};
            const result = legsWon([{saygData}], 'home');

            expect(result).toEqual(0);
        });

        it('should return number of won legs for side', () => {
            const saygData: ScoreAsYouGoDto = {
                legs: {
                    0: leg(score(), null, false, 'home'),
                    1: leg(score(), null, false, 'home')
                }
            }

            const result = legsWon([{saygData: saygData}], 'home');

            expect(result).toEqual(2);
        });

        it('should return 0 if not won any legs', () => {
            const saygData: ScoreAsYouGoDto = {
                legs: {
                    0: leg(score(thr(0)), null, false, 'away'),
                    1: leg(score(thr(0)), null, false, 'away')
                }
            }

            const result = legsWon([{saygData: saygData}], 'home');

            expect(result).toEqual(0);
        });
    });

    describe('countLegThrowsBetween', () => {
        it('should return 0 when no accumulator', () => {
            const result = countLegThrowsBetween(leg(score()), 'away', 100, 140);

            expect(result).toEqual(0);
        });

        it('should return 0 when no throws', () => {
            const result = countLegThrowsBetween(leg(score()), 'home', 100, 140);

            expect(result).toEqual(0);
        });

        it('should return count of valid throws within range', () => {
            const l: LegDto = leg(score(
                /* valid */
                ton, thr(139),

                /* invalid */
                thr(99), thr(100, true), thr(140)));

            const result = countLegThrowsBetween(l, 'home', 100, 140);

            expect(result).toEqual(2);
        });
    });

    describe('legTons', () => {
        it('should return correctly', () => {
            const l: LegDto = leg(score(
                /* valid */
                ton, thr(140), thr(180),

                /* invalid */
                thr(100, true), thr(140, true), thr(180, true)));

            const result = legTons(l, 'home');

            /* 180s count as 2 tons */
            expect(result).toEqual(2 + 2);
        });
    });

    describe('legTonsSplit', () => {
        it('should return 100s+180s', () => {
            const l: LegDto = leg(score(
                /* valid */
                ton, thr(140), thr(180),

                /* invalid */
                thr(100, true), thr(140, true), thr(180, true)));

            const result = legTonsSplit(l, 'home');

            /* 100-180s (inclusive) '+' no-of-180s */
            expect(result).toEqual('3+1');
        });

        it('should return 100s when no 180s', () => {
            const l: LegDto = leg(score(
                /* valid */
                ton, thr(140),

                /* invalid */
                thr(100, true), thr(140, true), thr(180, true)));

            const result = legTonsSplit(l, 'home');

            /* 100-180s (inclusive) */
            expect(result).toEqual('2');
        });
    });

    describe('legActualDarts', () => {
        it('returns 0 if no accumulator', () => {
            const result = legActualDarts(leg(score()), 'away');

            expect(result).toEqual(0);
        });

        it('returns 0 if no throws', () => {
            const result = legActualDarts(leg(nullThrows), 'home');

            expect(result).toEqual(0);
        });

        it('returns no of darts', () => {
            const l: LegDto = leg(score(thr(0), thr(0, true)));

            const result = legActualDarts(l, 'home');

            expect(result).toEqual(6);
        });
    });

    describe('legGameShot', () => {
        it('returns null if no accumulator', () => {
            const result = legGameShot(leg(score()), 'home');

            expect(result).toBeNull();
        });

        it('returns null if no throws', () => {
            const result = legGameShot(leg(nullThrows), 'home');

            expect(result).toBeNull();
        });

        it('returns null if not the winner of the leg', () => {
            const l: LegDto = leg(score(ton, ton, ton, thr(50)));

            const result = legGameShot(l, 'home');

            expect(result).toBeNull();
        });

        it('returns last score if the winner of the leg', () => {
            const l: LegDto = leg(score(ton, ton, ton, ton, thr(101)));

            const result = legGameShot(l, 'home');

            expect(result).toEqual(101);
        });
    });

    describe('legScoreLeft', () => {
        it('returns null if no accumulator', () => {
            const result = legScoreLeft(leg(score()), 'away');

            expect(result).toBeNull();
        });

        it('returns null if no throws', () => {
            const result = legScoreLeft(leg(nullThrows), 'home');

            expect(result).toBeNull();
        });

        it('returns remaining score if not the winner of the leg', () => {
            const l: LegDto = leg(score(ton, ton, ton, thr(75, true), thr(50)));

            const result = legScoreLeft(l, 'home');

            expect(result).toEqual(151);
        });

        it('returns null if the winner of the leg', () => {
            const l: LegDto = leg(score(ton, ton, ton, ton, thr(101)));

            const result = legScoreLeft(l, 'home');

            expect(result).toBeNull();
        });
    });
});