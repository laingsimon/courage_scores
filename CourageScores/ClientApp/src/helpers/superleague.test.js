// noinspection JSUnresolvedReference

import React from "react";
import {
    countLegThrowsBetween,
    countMatch100,
    countMatch140,
    countMatch180, getMatchWinner,
    getNoOfLegs, isLegWinner, legsWon,
    matchTons, maxNoOfThrowsAllMatches,
    playerOverallAverage, sumOfAllCheckouts,
    sumOfAllScores, legTons, legActualDarts, legGameShot, legScoreLeft
} from "./superleague";

describe('superleague', () => {
    describe('playerOverallAverage', () => {
        it('when null saygData should return null', () => {
            const result = playerOverallAverage(null, 'home');

            expect(result).toBeNull();
        });

        it('calculates correct average for home', () => {
            const saygData = {
                legs: {
                    '0': {
                        home: {
                            throws: [ {
                                score: 100,
                                noOfDarts: 3,
                                bust: false,
                            }, {
                                score: 150,
                                noOfDarts: 3,
                                bust: true,
                            } ]
                        }
                    },
                    '1': {
                        home: {
                            throws: [ {
                                score: 50,
                                bust: false,
                                noOfDarts: 2,
                            } ]
                        }
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
            const result = countMatch100({ legs: null }, 'home');

            expect(result).toBeNull();
        });

        it('should return count of scores greater-than-or-equal 100 and less than 140', () => {
            const saygData = {
                legs: {
                    '0': {
                        home: {
                            throws: [
                                /* valid */
                                { score: 100, bust: false },
                                { score: 139, bust: false },

                                /* invalid */
                                { score: 99, bust: false },
                                { score: 100, bust: true },
                                { score: 140, bust: false },
                            ]
                        }
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
            const result = countMatch140({ legs: null }, 'home');

            expect(result).toBeNull();
        });

        it('should return count of scores greater-than-or-equal 140 and less than 180', () => {
            const saygData = {
                legs: {
                    '0': {
                        home: {
                            throws: [
                                /* valid */
                                { score: 140, bust: false },
                                { score: 179, bust: false },

                                /* invalid */
                                { score: 139, bust: false },
                                { score: 140, bust: true },
                                { score: 180, bust: false },
                            ]
                        }
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
            const result = countMatch180({ legs: null }, 'home');

            expect(result).toBeNull();
        });

        it('should return count of scores greater-than-or-equal 140 and less than 180', () => {
            const saygData = {
                legs: {
                    '0': {
                        home: {
                            throws: [
                                /* valid */
                                { score: 180, bust: false },

                                /* invalid */
                                { score: 179, bust: false },
                                { score: 180, bust: true },
                            ]
                        }
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
            const result = matchTons({ legs: null }, 'home');

            expect(result).toEqual(0);
        });

        it('should return count of scores greater-than-or-equal 140 and less than 180', () => {
            const saygData = {
                legs: {
                    '0': {
                        home: {
                            throws: [
                                /* valid */
                                { score: 100, bust: false },
                                { score: 140, bust: false },
                                { score: 180, bust: false },
                            ]
                        }
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
            const result = getNoOfLegs({ legs: null });

            expect(result).toEqual(0);
        });

        it('should return no of legs with scores', () => {
            const saygData = {
                legs: {
                    '0': {
                        home: {
                            noOfDarts: 3,
                        },
                        away: {}
                    },
                    '1': {
                        home: {},
                        away: {
                            noOfDarts: 3,
                        }
                    },
                    '2': {
                        home: {},
                        away: {}
                    }
                }
            };

            const result = getNoOfLegs(saygData);

            expect(result).toEqual(2);
        });
    });

    describe('sumOfAllScores', () => {
        it('should return null given null data', () => {
            const result = sumOfAllScores(null, 'home');

            expect(result).toBeNull();
        });

        it('should return 0 given no legs', () => {
            const result = sumOfAllScores({ legs: null }, 'home');

            expect(result).toEqual(0);
        });

        it('should return sum of non bust scores for home', () => {
            const saygData = {
                legs: {
                    '0': {
                        home: {
                            throws: [
                                { score: 100, bust: true },
                                { score: 120, bust: false },
                            ]
                        }
                    },
                    '1': {
                        home: {
                            throws: [ { score: 50 } ]
                        }
                    }
                }
            };

            const result = sumOfAllScores(saygData, 'home');

            expect(result).toEqual(170);
        });
    });

    describe('sumOfAllCheckouts', () => {
        it('should return null when given null data', () => {
            const result = sumOfAllCheckouts(null, 'home');

            expect(result).toBeNull();
        });

        it('should return 0 when given no legs data', () => {
            const result = sumOfAllCheckouts({ legs: null }, 'home');

            expect(result).toEqual(0);
        });

        it('should return checkouts from winner', () => {
            const saygData = {
                legs: {
                    '0': {
                        home: {
                            throws: [
                                { score: 100 },
                                { score: 100 },
                                { score: 100 },
                                { score: 100 },
                                { score: 101 },
                            ]
                        },
                        startingScore: 501,
                    },
                    '1': {
                        home: {
                            throws: [
                                { score: 100 },
                                { score: 100 },
                                { score: 100 },
                                { score: 100 },
                                { score: 150 },
                                { score: 51 },
                            ]
                        },
                        startingScore: 601,
                    }
                }
            }

            const result = sumOfAllCheckouts(saygData, 'home');

            expect(result).toEqual(101 + 51);
        });

        it('should return 0 when not a checkout', () => {
            const saygData = {
                legs: {
                    '0': {
                        home: {
                            throws: [
                                { score: 100 },
                                { score: 100 },
                                { score: 100 },
                                { score: 100 },
                                { score: 30 },
                            ]
                        },
                        startingScore: 501,
                    },
                    '1': {
                        home: {
                            throws: [
                                { score: 100 },
                                { score: 100 },
                                { score: 100 },
                                { score: 100 },
                                { score: 150 },
                                { score: 25 },
                            ]
                        },
                        startingScore: 601,
                    }
                }
            }

            const result = sumOfAllCheckouts(saygData, 'home');

            expect(result).toEqual(0);
        });
    });

    describe('maxNoOfThrowsAllMatches', () => {
        it('should return 0 when no matches', () => {
            const result = maxNoOfThrowsAllMatches([]);

            expect(result).toEqual(0);
        });

        it('should return 0 when no sayg data', () => {
            const result = maxNoOfThrowsAllMatches([ {} ]);

            expect(result).toEqual(0);
        });

        it('should return 0 when no sayg legs', () => {
            const result = maxNoOfThrowsAllMatches([ { saygData: {} } ]);

            expect(result).toEqual(0);
        });

        it('should return home no of throws when greater than away', () => {
            const saygMatch = {
                match: {},
                saygData: {
                    legs: {
                        '0': {
                            home: {
                                throws: [ {}, {}, { bust: true } ]
                            },
                            away: {
                                throws: [ {}, {} ]
                            }
                        }
                    }
                }
            };

            const result = maxNoOfThrowsAllMatches([ saygMatch ]);

            expect(result).toEqual(3);
        });

        it('should return away no of throws when greater than home', () => {
            const saygMatch = {
                match: {},
                saygData: {
                    legs: {
                        '0': {
                            home: {
                                throws: [ {}, {}, {} ]
                            },
                            away: {
                                throws: [ {}, {}, {}, { bust: true } ]
                            }
                        }
                    }
                }
            };

            const result = maxNoOfThrowsAllMatches([ saygMatch ]);

            expect(result).toEqual(4);
        });
    });

    describe('getMatchWinner', () => {
        it('should return home when home checkout', () => {
            const saygData = {
                legs: {
                    '0': {
                        home: {
                            throws: [
                                { score: 100, bust: false },
                                { score: 100, bust: false },
                                { score: 100, bust: false },
                                { score: 100, bust: false },
                                { score: 50, bust: false },
                                { score: 51, bust: true },
                                { score: 51, bust: false },
                            ]
                        },
                        away: {
                            throws: [
                                { score: 100, bust: false },
                                { score: 100, bust: false },
                                { score: 100, bust: false },
                                { score: 100, bust: false },
                            ]
                        },
                        startingScore: 501,
                    }
                }
            };

            const result = getMatchWinner(saygData);

            expect(result).toEqual('home');
        });

        it('should return away when away checkout', () => {
            const saygData = {
                legs: {
                    '0': {
                        home: {
                            throws: [
                                { score: 100, bust: false },
                                { score: 100, bust: false },
                                { score: 100, bust: false },
                                { score: 100, bust: false },
                            ]
                        },
                        away: {
                            throws: [
                                { score: 100, bust: false },
                                { score: 100, bust: false },
                                { score: 100, bust: false },
                                { score: 100, bust: false },
                                { score: 50, bust: false },
                                { score: 51, bust: true },
                                { score: 51, bust: false },
                            ]
                        },
                        startingScore: 501,
                    }
                }
            };

            const result = getMatchWinner(saygData);

            expect(result).toEqual('away');
        });

        it('should return empty when no checkout', () => {
            const saygData = {
                legs: {
                    '0': {
                        home: {
                            throws: [
                                { score: 100, bust: false },
                                { score: 100, bust: false },
                                { score: 100, bust: false },
                                { score: 100, bust: false },
                            ]
                        },
                        away: {
                            throws: [
                                { score: 100, bust: false },
                                { score: 100, bust: false },
                                { score: 100, bust: false },
                                { score: 100, bust: false },
                            ]
                        },
                        startingScore: 501,
                    }
                }
            };

            const result = getMatchWinner(saygData);

            expect(result).toEqual('');
        });
    });

    describe('isLegWinner', () => {
        it('returns true if winner set to accumulator name', () => {
            const leg = {
                home: {
                    throws: [],
                },
                winner: 'home',
            }

            const result = isLegWinner(leg, 'home');

            expect(result).toEqual(true);
        });

        it('returns true if accumulator has checkout score', () => {
            const leg = {
                home: {
                    throws: [
                        { score: 100, bust: false },
                        { score: 100, bust: false },
                        { score: 100, bust: false },
                        { score: 100, bust: false },
                        { score: 100, bust: true },
                        { score: 101, bust: false },
                    ],
                },
                startingScore: 501,
            }

            const result = isLegWinner(leg, 'home');

            expect(result).toEqual(true);
        });

        it('returns false if accumulator not checked out', () => {
            const leg = {
                home: {
                    throws: [
                        { score: 100, bust: false },
                        { score: 100, bust: false },
                        { score: 100, bust: false },
                    ],
                },
                startingScore: 501,
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
            const result = legsWon([ { saygData: null } ], 'home');

            expect(result).toEqual(0);
        });

        it('should return 0 when no legs for data', () => {
            const result = legsWon([ { saygData: { legs: null } } ], 'home');

            expect(result).toEqual(0);
        });

        it('should return number of won legs for side', () => {
            const saygData = {
                legs: {
                    '0': {
                        home: {
                            throws: [],
                        },
                        winner: 'home',
                    },
                    '1': {
                        home: {
                            throws: [],
                        },
                        winner: 'home',
                    }
                }
            }

            const result = legsWon([ { saygData: saygData } ], 'home');

            expect(result).toEqual(2);
        });

        it('should return 0 if not won any legs', () => {
            const saygData = {
                legs: {
                    '0': {
                        home: {
                            throws: [],
                        },
                        winner: 'away',
                    },
                    '1': {
                        home: {
                            throws: [],
                        },
                        winner: 'away',
                    }
                }
            }

            const result = legsWon([ { saygData: saygData } ], 'home');

            expect(result).toEqual(0);
        });
    });

    describe('countLegThrowsBetween', () => {
        it('should return 0 when no accumulator', () => {
            const leg = {};

            const result = countLegThrowsBetween(leg, 'home', 100, 140);

            expect(result).toEqual(0);
        });

        it('should return 0 when no throws', () => {
            const leg = {
                home: {},
            };

            const result = countLegThrowsBetween(leg, 'home', 100, 140);

            expect(result).toEqual(0);
        });

        it('should return count of valid throws within range', () => {
            const leg = {
                home: {
                    throws: [
                        /* valid */
                        { score: 100, bust: false },
                        { score: 139, bust: false },

                        /* invalid */
                        { score: 99, bust: false },
                        { score: 100, bust: true },
                        { score: 140, bust: false },
                    ]
                },
            };

            const result = countLegThrowsBetween(leg, 'home', 100, 140);

            expect(result).toEqual(2);
        });
    });

    describe('legTons', () => {
        it('should return correctly', () => {
            const leg = {
                home: {
                    throws: [
                        /* valid */
                        { score: 100, bust: false },
                        { score: 140, bust: false },
                        { score: 180, bust: false },

                        /* invalid */
                        { score: 100, bust: true },
                        { score: 140, bust: true },
                        { score: 180, bust: true },
                    ]
                },
            };

            const result = legTons(leg, 'home');

            /* 180s count as 2 tons */
            expect(result).toEqual(2 + 2);
        });
    });

    describe('legActualDarts', () => {
        it('returns 0 if no accumulator', () => {
            const result = legActualDarts({}, 'home');

            expect(result).toEqual(0);
        });

        it('returns 0 if no throws', () => {
            const leg = {
                home: { throws: null },
            };

            const result = legActualDarts(leg, 'home');

            expect(result).toEqual(0);
        });

        it('returns no of darts', () => {
            const leg = {
                home: {
                    throws: [
                        { noOfDarts: 3 },
                        { noOfDarts: 3, bust: true },
                    ]
                },
            };

            const result = legActualDarts(leg, 'home');

            expect(result).toEqual(6);
        });
    });

    describe('legGameShot', () => {
        it('returns null if no accumulator', () => {
            const result = legGameShot({}, 'home');

            expect(result).toBeNull();
        });

        it('returns null if no throws', () => {
            const leg = {
                home: { throws: null },
            };

            const result = legGameShot(leg, 'home');

            expect(result).toBeNull();
        });

        it('returns null if not the winner of the leg', () => {
            const leg = {
                home: {
                    throws: [
                        { score: 100, bust: false },
                        { score: 100, bust: false },
                        { score: 100, bust: false },
                        { score: 50, bust: false },
                    ]
                },
                startingScore: 501,
            };

            const result = legGameShot(leg, 'home');

            expect(result).toBeNull();
        });

        it('returns last score if the winner of the leg', () => {
            const leg = {
                home: {
                    throws: [
                        { score: 100, bust: false },
                        { score: 100, bust: false },
                        { score: 100, bust: false },
                        { score: 100, bust: false },
                        { score: 101, bust: false },
                    ]
                },
                startingScore: 501,
            };

            const result = legGameShot(leg, 'home');

            expect(result).toEqual(101);
        });
    });

    describe('legScoreLeft', () => {
        it('returns null if no accumulator', () => {
            const result = legScoreLeft({}, 'home');

            expect(result).toBeNull();
        });

        it('returns null if no throws', () => {
            const leg = {
                home: { throws: null },
            };

            const result = legScoreLeft(leg, 'home');

            expect(result).toBeNull();
        });

        it('returns remaining score if not the winner of the leg', () => {
            const leg = {
                home: {
                    throws: [
                        { score: 100, bust: false },
                        { score: 100, bust: false },
                        { score: 100, bust: false },
                        { score: 75, bust: true },
                        { score: 50, bust: false },
                    ]
                },
                startingScore: 501,
            };

            const result = legScoreLeft(leg, 'home');

            expect(result).toEqual(151);
        });

        it('returns null if the winner of the leg', () => {
            const leg = {
                home: {
                    throws: [
                        { score: 100, bust: false },
                        { score: 100, bust: false },
                        { score: 100, bust: false },
                        { score: 100, bust: false },
                        { score: 101, bust: false },
                    ]
                },
                startingScore: 501,
            };

            const result = legScoreLeft(leg, 'home');

            expect(result).toBeNull();
        });
    });
});