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

describe('superleague', () => {
    describe('playerOverallAverage', () => {
        it('when null saygData should return null', () => {
            const result = playerOverallAverage(null, 'home');

            expect(result).toBeNull();
        });

        it('calculates correct average for home', () => {
            const saygData: ScoreAsYouGoDto = {
                legs: {
                    0: {
                        home: {
                            throws: [{
                                score: 100,
                                noOfDarts: 3,
                                bust: false,
                            }, {
                                score: 150,
                                noOfDarts: 3,
                                bust: true,
                            }],
                            noOfDarts: 0,
                            bust: true,
                            score: 250,
                        },
                        startingScore: 501,
                        isLastLeg: false,
                        away: null,
                    },
                    1: {
                        home: {
                            throws: [{
                                score: 50,
                                bust: false,
                                noOfDarts: 2,
                            }],
                            noOfDarts: 0,
                            bust: false,
                            score: 50,
                        },
                        startingScore: 501,
                        isLastLeg: false,
                        away: null,
                    }
                }
            };

            const result = playerOverallAverage(saygData, 'home');

            const totalScore = 100 + 50; // bust score is ignored
            const totalDarts = 3 + 3 + 2; // bust darts are included
            expect(result).toEqual(totalScore / totalDarts);
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
                    0: {
                        home: {
                            throws: [
                                /* valid */
                                {score: 100, bust: false, noOfDarts: 0},
                                {score: 139, bust: false, noOfDarts: 0},

                                /* invalid */
                                {score: 99, bust: false, noOfDarts: 0},
                                {score: 100, bust: true, noOfDarts: 0},
                                {score: 140, bust: false, noOfDarts: 0},
                            ],
                            noOfDarts: 0,
                            score: 0,
                            bust: false,
                        },
                        away: null,
                        startingScore: 501,
                        isLastLeg: false,
                    }
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
                    0: {
                        home: {
                            throws: [
                                /* valid */
                                {score: 140, bust: false, noOfDarts: 0},
                                {score: 179, bust: false, noOfDarts: 0},

                                /* invalid */
                                {score: 139, bust: false, noOfDarts: 0},
                                {score: 140, bust: true, noOfDarts: 0},
                                {score: 180, bust: false, noOfDarts: 0},
                            ],
                            noOfDarts: 0,
                            score: 0,
                            bust: false,
                        },
                        away: null,
                        startingScore: 501,
                        isLastLeg: false,
                    }
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
                    0: {
                        home: {
                            throws: [
                                /* valid */
                                {score: 180, bust: false, noOfDarts: 0},

                                /* invalid */
                                {score: 179, bust: false, noOfDarts: 0},
                                {score: 180, bust: true, noOfDarts: 0},
                            ],
                            noOfDarts: 0,
                            score: 0,
                            bust: false,
                        },
                        startingScore: 501,
                        isLastLeg: false,
                        away: null,
                    }
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
                    0: {
                        home: {
                            throws: [
                                /* valid */
                                {score: 100, bust: false, noOfDarts: 0},
                                {score: 140, bust: false, noOfDarts: 0},
                                {score: 180, bust: false, noOfDarts: 0},
                            ],
                            noOfDarts: 0,
                            score: 0,
                            bust: false,
                        },
                        startingScore: 0,
                        isLastLeg: false,
                        away: null,
                    }
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
                    0: {
                        home: {
                            noOfDarts: 3,
                            throws: [],
                            score: 0,
                            bust: false,
                        },
                        away: {
                            noOfDarts: 0,
                            throws: [],
                            score: 0,
                            bust: false,
                        },
                        startingScore: 501,
                        isLastLeg: false,
                    },
                    1: {
                        home: {
                            noOfDarts: 0,
                            throws: [],
                            score: 0,
                            bust: false,
                        },
                        away: {
                            noOfDarts: 3,
                            throws: [],
                            score: 0,
                            bust: false,
                        },
                        startingScore: 501,
                        isLastLeg: false,
                    },
                    2: {
                        home: {
                            noOfDarts: 0,
                            throws: [],
                            score: 0,
                            bust: false,
                        },
                        away: {
                            noOfDarts: 0,
                            throws: [],
                            score: 0,
                            bust: false,
                        },
                        startingScore: 501,
                        isLastLeg: false,
                    },
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
                0: {
                    home: {
                        throws: [{
                            noOfDarts: 1,
                            bust: false,
                            score: 0,
                        }, {
                            noOfDarts: 2,
                            bust: false,
                            score: 0,
                        }, {
                            noOfDarts: 3,
                            bust: false,
                            score: 0,
                        }],
                        noOfDarts: 0,
                        score: 0,
                        bust: false,
                    },
                    away: null,
                    startingScore: 501,
                    isLastLeg: false,
                }
            };
            const result = sumOverThrows({legs: legs}, 'home', 'noOfDarts', false);

            expect(result).toEqual(6);
        });

        it('should return sum of non-bust props', () => {
            const legs: { [key: number]: LegDto } = {
                0: {
                    home: {
                        throws: [{
                            noOfDarts: 1,
                            bust: false,
                            score: 0,
                        }, {
                            noOfDarts: 2,
                            bust: true,
                            score: 0,
                        }, {
                            noOfDarts: 3,
                            bust: false,
                            score: 0,
                        }],
                        noOfDarts: 0,
                        bust: false,
                        score: 0,
                    },
                    away: null,
                    startingScore: 501,
                    isLastLeg: false,
                }
            };
            const result = sumOverThrows({legs: legs}, 'home', 'noOfDarts', false);

            expect(result).toEqual(4);
        });

        it('should return sum of bust and non-bust props', () => {
            const legs: { [key: number]: LegDto } = {
                0: {
                    home: {
                        throws: [{
                            noOfDarts: 1,
                            bust: false,
                            score: 0,
                        }, {
                            noOfDarts: 2,
                            bust: true,
                            score: 0,
                        }, {
                            noOfDarts: 3,
                            bust: false,
                            score: 0,
                        }],
                        noOfDarts: 0,
                        bust: false,
                        score: 0,
                    },
                    away: null,
                    startingScore: 501,
                    isLastLeg: false,
                }
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
                        0: {
                            home: {
                                throws: [
                                    {bust: false, score: 0, noOfDarts: 0},
                                    {bust: false, score: 0, noOfDarts: 0},
                                    {bust: true, score: 0, noOfDarts: 0}
                                ],
                                noOfDarts: 0,
                                bust: false,
                                score: 0,
                            },
                            away: {
                                throws: [
                                    {bust: false, score: 0, noOfDarts: 0},
                                    {bust: false, score: 0, noOfDarts: 0}
                                ],
                                noOfDarts: 0,
                                bust: false,
                                score: 0,
                            },
                            startingScore: 501,
                            isLastLeg: false,
                        }
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
                        0: {
                            home: {
                                throws: [
                                    {score: 0, noOfDarts: 0, bust: false},
                                    {score: 0, noOfDarts: 0, bust: false},
                                    {score: 0, noOfDarts: 0, bust: false}],
                                noOfDarts: 0,
                                bust: false,
                                score: 0,
                            },
                            away: {
                                throws: [
                                    {score: 0, noOfDarts: 0, bust: false},
                                    {score: 0, noOfDarts: 0, bust: false},
                                    {score: 0, noOfDarts: 0, bust: false},
                                    {score: 0, noOfDarts: 0, bust: true}],
                                noOfDarts: 0,
                                bust: false,
                                score: 0,
                            },
                            startingScore: 501,
                            isLastLeg: false,
                        }
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
                    0: {
                        home: {
                            throws: [
                                {score: 100, bust: false, noOfDarts: 0},
                                {score: 100, bust: false, noOfDarts: 0},
                                {score: 100, bust: false, noOfDarts: 0},
                                {score: 100, bust: false, noOfDarts: 0},
                                {score: 50, bust: false, noOfDarts: 0},
                                {score: 51, bust: true, noOfDarts: 0},
                                {score: 51, bust: false, noOfDarts: 0},
                            ],
                            noOfDarts: 0,
                            bust: false,
                            score: 0,
                        },
                        away: {
                            throws: [
                                {score: 100, bust: false, noOfDarts: 0},
                                {score: 100, bust: false, noOfDarts: 0},
                                {score: 100, bust: false, noOfDarts: 0},
                                {score: 100, bust: false, noOfDarts: 0},
                            ],
                            noOfDarts: 0,
                            bust: false,
                            score: 0,
                        },
                        startingScore: 501,
                        isLastLeg: false,
                    }
                }
            };

            const result = getMatchWinner(saygData);

            expect(result).toEqual('home');
        });

        it('should return away when away checkout', () => {
            const saygData: ScoreAsYouGoDto = {
                legs: {
                    0: {
                        home: {
                            throws: [
                                {score: 100, bust: false, noOfDarts: 0},
                                {score: 100, bust: false, noOfDarts: 0},
                                {score: 100, bust: false, noOfDarts: 0},
                                {score: 100, bust: false, noOfDarts: 0},
                            ],
                            noOfDarts: 0,
                            bust: false,
                            score: 0,
                        },
                        away: {
                            throws: [
                                {score: 100, bust: false, noOfDarts: 0},
                                {score: 100, bust: false, noOfDarts: 0},
                                {score: 100, bust: false, noOfDarts: 0},
                                {score: 100, bust: false, noOfDarts: 0},
                                {score: 50, bust: false, noOfDarts: 0},
                                {score: 51, bust: true, noOfDarts: 0},
                                {score: 51, bust: false, noOfDarts: 0},
                            ],
                            noOfDarts: 0,
                            bust: false,
                            score: 0,
                        },
                        startingScore: 501,
                        isLastLeg: false,
                    }
                }
            };

            const result = getMatchWinner(saygData);

            expect(result).toEqual('away');
        });

        it('should return empty when no checkout', () => {
            const saygData: ScoreAsYouGoDto = {
                legs: {
                    0: {
                        home: {
                            throws: [
                                {score: 100, bust: false, noOfDarts: 0},
                                {score: 100, bust: false, noOfDarts: 0},
                                {score: 100, bust: false, noOfDarts: 0},
                                {score: 100, bust: false, noOfDarts: 0},
                            ],
                            noOfDarts: 0,
                            bust: false,
                            score: 0,
                        },
                        away: {
                            throws: [
                                {score: 100, bust: false, noOfDarts: 0},
                                {score: 100, bust: false, noOfDarts: 0},
                                {score: 100, bust: false, noOfDarts: 0},
                                {score: 100, bust: false, noOfDarts: 0},
                            ],
                            noOfDarts: 0,
                            bust: false,
                            score: 0,
                        },
                        startingScore: 501,
                        isLastLeg: false,
                    }
                }
            };

            const result = getMatchWinner(saygData);

            expect(result).toEqual('');
        });
    });

    describe('isLegWinner', () => {
        it('returns true if winner set to accumulator name', () => {
            const leg: LegDto = {
                home: {
                    throws: [],
                    noOfDarts: 0,
                    bust: false,
                    score: 0,
                },
                away: null,
                winner: 'home',
                startingScore: 501,
                isLastLeg: false,
            }

            const result = isLegWinner(leg, 'home');

            expect(result).toEqual(true);
        });

        it('returns true if accumulator has checkout score', () => {
            const leg: LegDto = {
                home: {
                    throws: [
                        {score: 100, bust: false, noOfDarts: 0},
                        {score: 100, bust: false, noOfDarts: 0},
                        {score: 100, bust: false, noOfDarts: 0},
                        {score: 100, bust: false, noOfDarts: 0},
                        {score: 100, bust: true, noOfDarts: 0},
                        {score: 101, bust: false, noOfDarts: 0},
                    ],
                    noOfDarts: 0,
                    bust: false,
                    score: 0,
                },
                away: null,
                startingScore: 501,
                isLastLeg: false,
            }

            const result = isLegWinner(leg, 'home');

            expect(result).toEqual(true);
        });

        it('returns false if accumulator not checked out', () => {
            const leg: LegDto = {
                home: {
                    throws: [
                        {score: 100, bust: false, noOfDarts: 0},
                        {score: 100, bust: false, noOfDarts: 0},
                        {score: 100, bust: false, noOfDarts: 0},
                    ],
                    noOfDarts: 0,
                    bust: false,
                    score: 0,
                },
                away: null,
                startingScore: 501,
                isLastLeg: false,
            }

            const result = isLegWinner(leg, 'home');

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
                    0: {
                        home: {
                            throws: [],
                            noOfDarts: 0,
                            bust: false,
                            score: 0,
                        },
                        startingScore: 501,
                        winner: 'home',
                        isLastLeg: false,
                        away: null,
                    },
                    1: {
                        home: {
                            throws: [],
                            noOfDarts: 0,
                            bust: false,
                            score: 0,
                        },
                        startingScore: 501,
                        winner: 'home',
                        isLastLeg: false,
                        away: null,
                    }
                }
            }

            const result = legsWon([{saygData: saygData}], 'home');

            expect(result).toEqual(2);
        });

        it('should return 0 if not won any legs', () => {
            const saygData: ScoreAsYouGoDto = {
                legs: {
                    0: {
                        home: {
                            throws: [],
                            noOfDarts: 1,
                            bust: false,
                            score: 0,
                        },
                        startingScore: 501,
                        winner: 'away',
                        isLastLeg: false,
                        away: null,
                    },
                    1: {
                        home: {
                            throws: [],
                            noOfDarts: 1,
                            bust: false,
                            score: 0,
                        },
                        startingScore: 501,
                        winner: 'away',
                        isLastLeg: false,
                        away: null,
                    }
                }
            }

            const result = legsWon([{saygData: saygData}], 'home');

            expect(result).toEqual(0);
        });
    });

    describe('countLegThrowsBetween', () => {
        it('should return 0 when no accumulator', () => {
            const leg: LegDto = {
                home: {
                    throws: [],
                    noOfDarts: 0,
                    bust: false,
                    score: 0,
                },
                away: null,
                startingScore: 501,
                isLastLeg: false,
            };

            const result = countLegThrowsBetween(leg, 'away', 100, 140);

            expect(result).toEqual(0);
        });

        it('should return 0 when no throws', () => {
            const leg: LegDto = {
                home: {
                    throws: [],
                    noOfDarts: 0,
                    bust: false,
                    score: 0,
                },
                away: null,
                startingScore: 501,
                isLastLeg: false,
            };

            const result = countLegThrowsBetween(leg, 'away', 100, 140);

            expect(result).toEqual(0);
        });

        it('should return count of valid throws within range', () => {
            const leg: LegDto = {
                home: {
                    throws: [
                        /* valid */
                        {score: 100, bust: false, noOfDarts: 0},
                        {score: 139, bust: false, noOfDarts: 0},

                        /* invalid */
                        {score: 99, bust: false, noOfDarts: 0},
                        {score: 100, bust: true, noOfDarts: 0},
                        {score: 140, bust: false, noOfDarts: 0},
                    ],
                    noOfDarts: 1,
                    bust: false,
                    score: 0,
                },
                away: null,
                startingScore: 501,
                isLastLeg: false,
            };

            const result = countLegThrowsBetween(leg, 'home', 100, 140);

            expect(result).toEqual(2);
        });
    });

    describe('legTons', () => {
        it('should return correctly', () => {
            const leg: LegDto = {
                home: {
                    throws: [
                        /* valid */
                        {score: 100, bust: false, noOfDarts: 0},
                        {score: 140, bust: false, noOfDarts: 0},
                        {score: 180, bust: false, noOfDarts: 0},

                        /* invalid */
                        {score: 100, bust: true, noOfDarts: 0},
                        {score: 140, bust: true, noOfDarts: 0},
                        {score: 180, bust: true, noOfDarts: 0},
                    ],
                    noOfDarts: 1,
                    bust: false,
                    score: 0,
                },
                away: null,
                startingScore: 501,
                isLastLeg: false,
            };

            const result = legTons(leg, 'home');

            /* 180s count as 2 tons */
            expect(result).toEqual(2 + 2);
        });
    });

    describe('legTonsSplit', () => {
        it('should return 100s+180s', () => {
            const leg: LegDto = {
                home: {
                    throws: [
                        /* valid */
                        {score: 100, bust: false, noOfDarts: 0},
                        {score: 140, bust: false, noOfDarts: 0},
                        {score: 180, bust: false, noOfDarts: 0},

                        /* invalid */
                        {score: 100, bust: true, noOfDarts: 0},
                        {score: 140, bust: true, noOfDarts: 0},
                        {score: 180, bust: true, noOfDarts: 0},
                    ],
                    noOfDarts: 1,
                    bust: false,
                    score: 0,
                },
                away: null,
                startingScore: 501,
                isLastLeg: false,
            };

            const result = legTonsSplit(leg, 'home');

            /* 100-180s (inclusive) '+' no-of-180s */
            expect(result).toEqual('3+1');
        });

        it('should return 100s when no 180s', () => {
            const leg: LegDto = {
                home: {
                    throws: [
                        /* valid */
                        {score: 100, bust: false, noOfDarts: 0},
                        {score: 140, bust: false, noOfDarts: 0},

                        /* invalid */
                        {score: 100, bust: true, noOfDarts: 0},
                        {score: 140, bust: true, noOfDarts: 0},
                        {score: 180, bust: true, noOfDarts: 0},
                    ],
                    noOfDarts: 1,
                    bust: false,
                    score: 0,
                },
                away: null,
                startingScore: 501,
                isLastLeg: false,
            };

            const result = legTonsSplit(leg, 'home');

            /* 100-180s (inclusive) */
            expect(result).toEqual('2');
        });
    });

    describe('legActualDarts', () => {
        it('returns 0 if no accumulator', () => {
            const leg: LegDto = {
                home: {
                    throws: [],
                    noOfDarts: 0,
                    bust: false,
                    score: 0,
                },
                startingScore: 501,
                isLastLeg: false,
                away: null,
            };
            const result = legActualDarts(leg, 'away');

            expect(result).toEqual(0);
        });

        it('returns 0 if no throws', () => {
            const leg: LegDto = {
                home: {
                    throws: null!,
                    noOfDarts: 0,
                    bust: false,
                    score: 0,
                },
                away: null,
                startingScore: 501,
                isLastLeg: false,
            };

            const result = legActualDarts(leg, 'home');

            expect(result).toEqual(0);
        });

        it('returns no of darts', () => {
            const leg: LegDto = {
                home: {
                    throws: [
                        {noOfDarts: 3, score: 0, bust: false},
                        {noOfDarts: 3, bust: true, score: 0},
                    ],
                    noOfDarts: 1,
                    bust: false,
                    score: 0,
                },
                away: null,
                startingScore: 501,
                isLastLeg: false,
            };

            const result = legActualDarts(leg, 'home');

            expect(result).toEqual(6);
        });
    });

    describe('legGameShot', () => {
        it('returns null if no accumulator', () => {
            const leg: LegDto = {
                home: {
                    throws: [],
                    noOfDarts: 0,
                    bust: false,
                    score: 0,
                },
                away: null,
                startingScore: 501,
                isLastLeg: false,
            };
            const result = legGameShot(leg, 'home');

            expect(result).toBeNull();
        });

        it('returns null if no throws', () => {
            const leg: LegDto = {
                home: {
                    throws: null!,
                    noOfDarts: 0,
                    bust: false,
                    score: 0,
                },
                away: null,
                startingScore: 501,
                isLastLeg: false,
            };

            const result = legGameShot(leg, 'home');

            expect(result).toBeNull();
        });

        it('returns null if not the winner of the leg', () => {
            const leg: LegDto = {
                home: {
                    throws: [
                        {score: 100, bust: false, noOfDarts: 0},
                        {score: 100, bust: false, noOfDarts: 0},
                        {score: 100, bust: false, noOfDarts: 0},
                        {score: 50, bust: false, noOfDarts: 0},
                    ],
                    noOfDarts: 1,
                    bust: false,
                    score: 0,
                },
                away: null,
                startingScore: 501,
                isLastLeg: false,
            };

            const result = legGameShot(leg, 'home');

            expect(result).toBeNull();
        });

        it('returns last score if the winner of the leg', () => {
            const leg: LegDto = {
                home: {
                    throws: [
                        {score: 100, bust: false, noOfDarts: 0},
                        {score: 100, bust: false, noOfDarts: 0},
                        {score: 100, bust: false, noOfDarts: 0},
                        {score: 100, bust: false, noOfDarts: 0},
                        {score: 101, bust: false, noOfDarts: 0},
                    ],
                    noOfDarts: 1,
                    bust: false,
                    score: 0,
                },
                away: null,
                startingScore: 501,
                isLastLeg: false,
            };

            const result = legGameShot(leg, 'home');

            expect(result).toEqual(101);
        });
    });

    describe('legScoreLeft', () => {
        it('returns null if no accumulator', () => {
            const leg: LegDto = {
                home: {
                    throws: [],
                    noOfDarts: 0,
                    bust: false,
                    score: 0,
                },
                away: null,
                startingScore: 501,
                isLastLeg: false,
            };
            const result = legScoreLeft(leg, 'away');

            expect(result).toBeNull();
        });

        it('returns null if no throws', () => {
            const leg: LegDto = {
                home: {
                    throws: null!,
                    noOfDarts: 0,
                    bust: false,
                    score: 0,
                },
                away: null,
                startingScore: 501,
                isLastLeg: false,
            };

            const result = legScoreLeft(leg, 'home');

            expect(result).toBeNull();
        });

        it('returns remaining score if not the winner of the leg', () => {
            const leg: LegDto = {
                home: {
                    throws: [
                        {score: 100, bust: false, noOfDarts: 0},
                        {score: 100, bust: false, noOfDarts: 0},
                        {score: 100, bust: false, noOfDarts: 0},
                        {score: 75, bust: true, noOfDarts: 0},
                        {score: 50, bust: false, noOfDarts: 0},
                    ],
                    noOfDarts: 1,
                    bust: false,
                    score: 0,
                },
                away: null,
                startingScore: 501,
                isLastLeg: false,
            };

            const result = legScoreLeft(leg, 'home');

            expect(result).toEqual(151);
        });

        it('returns null if the winner of the leg', () => {
            const leg: LegDto = {
                home: {
                    throws: [
                        {score: 100, bust: false, noOfDarts: 0},
                        {score: 100, bust: false, noOfDarts: 0},
                        {score: 100, bust: false, noOfDarts: 0},
                        {score: 100, bust: false, noOfDarts: 0},
                        {score: 101, bust: false, noOfDarts: 0},
                    ],
                    noOfDarts: 1,
                    bust: false,
                    score: 0,
                },
                away: null,
                startingScore: 501,
                isLastLeg: false,
            };

            const result = legScoreLeft(leg, 'home');

            expect(result).toBeNull();
        });
    });
});