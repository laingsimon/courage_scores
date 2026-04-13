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
    sumOverThrows,
} from './superleague';
import { ScoreAsYouGoDto } from '../interfaces/models/dtos/Game/Sayg/ScoreAsYouGoDto';
import { LegDto } from '../interfaces/models/dtos/Game/Sayg/LegDto';
import { ISuperleagueSayg } from '../components/tournaments/superleague/ISuperleagueSayg';
import { LegThrowDto } from '../interfaces/models/dtos/Game/Sayg/LegThrowDto';
import { LegCompetitorScoreDto } from '../interfaces/models/dtos/Game/Sayg/LegCompetitorScoreDto';
import { sum } from './collections';
import { getScoreFromThrows } from './sayg';

describe('superleague', () => {
    const ton: LegThrowDto = thr(100);
    const bust: LegThrowDto = thr(0);
    const nullThrows: LegCompetitorScoreDto = {
        throws: null!,
        noOfDarts: 0,
        score: 0,
    };

    function thr(score: number, noOfDarts: number = 3): LegThrowDto {
        return {
            score,
            noOfDarts,
        };
    }

    function score(...throws: LegThrowDto[]): LegCompetitorScoreDto {
        return {
            noOfDarts: sum(throws, (thr: LegThrowDto) => thr.noOfDarts || 0),
            throws: throws,
            score: getScoreFromThrows(501, throws),
        };
    }

    function leg(h: LegCompetitorScoreDto, a?: LegCompetitorScoreDto): LegDto {
        return {
            home: h,
            away: a || {},
            startingScore: 501,
        };
    }

    describe('playerOverallAverage', () => {
        it('when null saygData should return null', () => {
            expect(playerOverallAverage(null, 'home')).toBeNull();
        });

        it('calculates correct average for home', () => {
            const saygData: ScoreAsYouGoDto = {
                legs: {
                    0: leg(score(ton, bust)),
                    1: leg(score(thr(50, 2))),
                },
            };

            expect(playerOverallAverage(saygData, 'home')).toEqual(
                (100 + 50) / (3 + 3 + 2),
            );
        });
    });

    describe('countMatch100', () => {
        it('should return null when null data', () => {
            expect(countMatch100(null, 'home')).toBeNull();
        });

        it('should return 0 when no legs', () => {
            expect(countMatch100({ legs: {} }, 'home')).toEqual(0);
        });

        it('should return count of scores greater-than-or-equal 100 and less than 140', () => {
            const saygData: ScoreAsYouGoDto = {
                legs: {
                    0: leg(
                        score(
                            /* valid */
                            ton,
                            thr(139),

                            /* invalid */
                            thr(99),
                            bust,
                            thr(140),
                        ),
                    ),
                },
            };

            expect(countMatch100(saygData, 'home')).toEqual(2);
        });
    });

    describe('countMatch140', () => {
        it('should return null when null data', () => {
            expect(countMatch140(null, 'home')).toBeNull();
        });

        it('should return 0 when no legs', () => {
            expect(countMatch140({ legs: {} }, 'home')).toEqual(0);
        });

        it('should return count of scores greater-than-or-equal 140 and less than 180', () => {
            const saygData: ScoreAsYouGoDto = {
                legs: {
                    0: leg(
                        score(
                            /* valid */
                            thr(140),
                            thr(179),

                            /* invalid */
                            thr(139),
                            bust,
                            thr(180),
                        ),
                    ),
                },
            };

            expect(countMatch140(saygData, 'home')).toEqual(2);
        });
    });

    describe('countMatch180', () => {
        it('should return null when null data', () => {
            expect(countMatch180(null, 'home')).toBeNull();
        });

        it('should return 0 when no legs', () => {
            expect(countMatch180({ legs: {} }, 'home')).toEqual(0);
        });

        it('should return count of scores greater-than-or-equal 140 and less than 180', () => {
            const saygData: ScoreAsYouGoDto = {
                legs: {
                    0: leg(
                        score(
                            /* valid */
                            thr(180),

                            /* invalid */
                            thr(179),
                            bust,
                        ),
                    ),
                },
            };

            expect(countMatch180(saygData, 'home')).toEqual(1);
        });
    });

    describe('matchTons', () => {
        it('should return 0 when null data', () => {
            expect(matchTons(null, 'home')).toEqual(0);
        });

        it('should return 0 when no legs', () => {
            expect(matchTons({ legs: {} }, 'home')).toEqual(0);
        });

        it('should return count of scores greater-than-or-equal 140 and less than 180', () => {
            const saygData: ScoreAsYouGoDto = {
                legs: {
                    0: leg(score(ton, thr(140), thr(180))),
                },
            };

            /* 100 + 140 + 180 (which counts for 2) */
            expect(matchTons(saygData, 'home')).toEqual(1 + 1 + 2);
        });
    });

    describe('getNoOfLegs', () => {
        it('should return null if null data', () => {
            expect(getNoOfLegs(null)).toBeNull();
        });

        it('should return 0 if no legs data', () => {
            expect(getNoOfLegs({ legs: {} })).toEqual(0);
        });

        it('should return no of legs with scores', () => {
            const saygData: ScoreAsYouGoDto = {
                legs: {
                    0: leg(score(thr(0)), score()),
                    1: leg(score(), score(thr(0))),
                    2: leg(score(), score()),
                },
            };

            expect(getNoOfLegs(saygData)).toEqual(2);
        });
    });

    describe('sumOverThrows', () => {
        it('should return null given null data', () => {
            expect(sumOverThrows(null, 'home', 'noOfDarts')).toBeNull();
        });

        it('should return 0 given no legs', () => {
            expect(sumOverThrows({ legs: {} }, 'home', 'noOfDarts')).toEqual(0);
        });

        it('should return 0 given no prop', () => {
            expect(sumOverThrows({ legs: {} }, 'home', 'unknown')).toEqual(0);
        });

        it('should return sum of props', () => {
            const legs: { [key: number]: LegDto } = {
                0: leg(score(thr(0, 1), thr(0, 2), thr(0))),
            };

            expect(sumOverThrows({ legs: legs }, 'home', 'noOfDarts')).toEqual(
                6,
            );
        });
    });

    describe('maxNoOfThrowsAllMatches', () => {
        it('should return 0 when no matches', () => {
            expect(maxNoOfThrowsAllMatches([])).toEqual(0);
        });

        it('should return 0 when no sayg data', () => {
            expect(maxNoOfThrowsAllMatches([{}])).toEqual(0);
        });

        it('should return 0 when no sayg legs', () => {
            const saygMatch: ISuperleagueSayg = { saygData: { legs: {} } };

            expect(maxNoOfThrowsAllMatches([saygMatch])).toEqual(0);
        });

        it('should return home no of throws when greater than away', () => {
            const saygMatch: ISuperleagueSayg = {
                saygData: {
                    legs: {
                        0: leg(
                            score(thr(0), thr(0), bust),
                            score(thr(0), thr(0)),
                        ),
                    },
                },
            };

            expect(maxNoOfThrowsAllMatches([saygMatch])).toEqual(3);
        });

        it('should return away no of throws when greater than home', () => {
            const saygMatch: ISuperleagueSayg = {
                saygData: {
                    legs: {
                        0: leg(
                            score(thr(0), thr(0), thr(0)),
                            score(thr(0), thr(0), thr(0), bust),
                        ),
                    },
                },
            };

            expect(maxNoOfThrowsAllMatches([saygMatch])).toEqual(4);
        });
    });

    describe('getMatchWinner', () => {
        it('should return home when home checkout', () => {
            const saygData: ScoreAsYouGoDto = {
                legs: {
                    0: leg(
                        score(ton, ton, ton, ton, thr(50), bust, thr(51)),
                        score(ton, ton, ton, ton),
                    ),
                },
            };

            expect(getMatchWinner(saygData)).toEqual('home');
        });

        it('should return away when away checkout', () => {
            const saygData: ScoreAsYouGoDto = {
                legs: {
                    0: leg(
                        score(ton, ton, ton, ton),
                        score(ton, ton, ton, ton, thr(50), bust, thr(51)),
                    ),
                },
            };

            expect(getMatchWinner(saygData)).toEqual('away');
        });

        it('should return empty when no checkout', () => {
            const saygData: ScoreAsYouGoDto = {
                legs: {
                    0: leg(
                        score(ton, ton, ton, ton),
                        score(ton, ton, ton, ton),
                    ),
                },
            };

            expect(getMatchWinner(saygData)).toEqual('');
        });
    });

    describe('isLegWinner', () => {
        it('returns true if accumulator has checkout score', () => {
            const l: LegDto = leg(score(ton, ton, ton, ton, bust, thr(101)));

            expect(isLegWinner(l, 'home')).toEqual(true);
        });

        it('returns false if accumulator not checked out', () => {
            const l: LegDto = leg(score(ton, ton, ton));

            expect(isLegWinner(l, 'home')).toEqual(false);
        });
    });

    describe('legsWon', () => {
        it('should return 0 when no matches', () => {
            expect(legsWon([], 'home')).toEqual(0);
        });

        it('should return 0 when no data for matches', () => {
            expect(legsWon([{}], 'home')).toEqual(0);
        });

        it('should return 0 when no legs for data', () => {
            const saygData: ScoreAsYouGoDto = { legs: null! };

            expect(legsWon([{ saygData }], 'home')).toEqual(0);
        });

        it('should return number of won legs for side', () => {
            const saygData: ScoreAsYouGoDto = {
                legs: {
                    0: leg(score(thr(501)), {}),
                    1: leg(score(thr(501)), {}),
                },
            };

            expect(legsWon([{ saygData: saygData }], 'home')).toEqual(2);
        });

        it('should return 0 if not won any legs', () => {
            const saygData: ScoreAsYouGoDto = {
                legs: {
                    0: leg(score(thr(0)), {}),
                    1: leg(score(thr(0)), {}),
                },
            };

            expect(legsWon([{ saygData: saygData }], 'home')).toEqual(0);
        });
    });

    describe('countLegThrowsBetween', () => {
        it('should return 0 when no accumulator', () => {
            const result = countLegThrowsBetween(
                leg(score()),
                'away',
                100,
                140,
            );

            expect(result).toEqual(0);
        });

        it('should return 0 when no throws', () => {
            const result = countLegThrowsBetween(
                leg(score()),
                'home',
                100,
                140,
            );

            expect(result).toEqual(0);
        });

        it('should return count of valid throws within range', () => {
            const l: LegDto = leg(
                score(
                    /* valid */
                    ton,
                    thr(139),

                    /* invalid */
                    thr(99),
                    bust,
                    thr(140),
                ),
            );

            expect(countLegThrowsBetween(l, 'home', 100, 140)).toEqual(2);
        });
    });

    describe('legTons', () => {
        it('should return correctly', () => {
            const l: LegDto = leg(
                score(
                    /* valid */
                    ton,
                    thr(140),
                    thr(180),

                    /* invalid */
                    bust,
                ),
            );

            /* 180s count as 2 tons */
            expect(legTons(l, 'home')).toEqual(2 + 2);
        });
    });

    describe('legTonsSplit', () => {
        it('should return 100s+180s', () => {
            const l: LegDto = leg(
                score(
                    /* valid */
                    ton,
                    thr(140),
                    thr(180),

                    /* invalid */
                    bust,
                ),
            );

            /* 100-180s (inclusive) '+' no-of-180s */
            expect(legTonsSplit(l, 'home')).toEqual('3+1');
        });

        it('should return 100s when no 180s', () => {
            const l: LegDto = leg(
                score(
                    /* valid */
                    ton,
                    thr(140),

                    /* invalid */
                    bust,
                ),
            );

            /* 100-180s (inclusive) */
            expect(legTonsSplit(l, 'home')).toEqual('2');
        });
    });

    describe('legActualDarts', () => {
        it('returns 0 if no accumulator', () => {
            expect(legActualDarts(leg(score()), 'away')).toEqual(0);
        });

        it('returns 0 if no throws', () => {
            expect(legActualDarts(leg(nullThrows), 'home')).toEqual(0);
        });

        it('returns no of darts', () => {
            expect(legActualDarts(leg(score(thr(0), bust)), 'home')).toEqual(6);
        });
    });

    describe('legGameShot', () => {
        it('returns null if no accumulator', () => {
            expect(legGameShot(leg(score()), 'home')).toBeNull();
        });

        it('returns null if no throws', () => {
            expect(legGameShot(leg(nullThrows), 'home')).toBeNull();
        });

        it('returns null if not the winner of the leg', () => {
            const l = leg(score(ton, ton, ton, thr(50)));

            expect(legGameShot(l, 'home')).toBeNull();
        });

        it('returns last score if the winner of the leg', () => {
            const l = leg(score(ton, ton, ton, ton, thr(101)));

            expect(legGameShot(l, 'home')).toEqual(101);
        });
    });

    describe('legScoreLeft', () => {
        it('returns null if no accumulator', () => {
            expect(legScoreLeft(leg(score()), 'away')).toBeNull();
        });

        it('returns null if no throws', () => {
            expect(legScoreLeft(leg(nullThrows), 'home')).toBeNull();
        });

        it('returns remaining score if not the winner of the leg', () => {
            const l = leg(score(ton, ton, ton, bust, thr(50)));

            expect(legScoreLeft(l, 'home')).toEqual(151);
        });

        it('returns null if the winner of the leg', () => {
            const l = leg(score(ton, ton, ton, ton, thr(101)));

            expect(legScoreLeft(l, 'home')).toBeNull();
        });
    });
});
