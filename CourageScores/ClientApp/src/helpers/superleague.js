import {count, sum} from "./collections";

export function playerOverallAverage(saygData, sideName) {
    if (!saygData || !saygData.legs) {
        return null;
    }

    const metrics = Object.keys(saygData.legs).map(legIndex => {
        const leg = saygData.legs[legIndex];
        const side = leg[sideName];

        return {
            score: sum(side.throws, thr => thr.bust ? 0 : thr.score),
            noOfDarts: sum(side.throws, thr => thr.noOfDarts),
        };
    });

    return sum(metrics, m => m.score) / sum(metrics, m => m.noOfDarts);
}

export function countMatch100(saygData, accumulatorName) {
    return countMatchThrowsBetween(saygData, accumulatorName, 100, 140);
}

export function countMatch140(saygData, accumulatorName) {
    return countMatchThrowsBetween(saygData, accumulatorName, 140, 180);
}

export function countMatch180(saygData, accumulatorName) {
    return countMatchThrowsBetween(saygData, accumulatorName, 180);
}

export function matchTons(saygData, accumulatorName) {
    return countMatch100(saygData, accumulatorName) + countMatch140(saygData, accumulatorName) + (countMatch180(saygData, accumulatorName) * 2);
}

export function getNoOfLegs(saygData) {
    if (!saygData) {
        return null;
    }

    return Object.keys(saygData.legs || {})
        .map(legKey => saygData.legs[legKey])
        .filter(leg => {
            return leg.home.noOfDarts || leg.away.noOfDarts;
        })
        .length;
}

export function sumOfAllScores(saygData, accumulatorName) {
    if (!saygData) {
        return null;
    }

    return sum(Object.keys(saygData.legs || {})
        .map(legKey => saygData.legs[legKey])
        .flatMap(leg => leg[accumulatorName].throws)
        .map(thr => thr.bust ? 0 : thr.score));
}

export function sumOfAllActualDarts(saygData, accumulatorName) {
    if (!saygData) {
        return null;
    }

    return sum(Object.keys(saygData.legs || {})
        .map(legKey => saygData.legs[legKey])
        .flatMap(leg => leg[accumulatorName].throws)
        .map(thr => thr.noOfDarts));
}

export function maxNoOfThrowsAllMatches(saygMatches) {
    let throws = 0;

    for (let index = 0; index < saygMatches.length; index++) {
        const saygData = saygMatches[index].saygData;

        if (!saygData || !saygData.legs) {
            continue;
        }

        for (const legsKey in saygData.legs) {
            const leg = saygData.legs[legsKey];

            throws = Math.max(throws, leg.home.throws.length);
            throws = Math.max(throws, leg.away.throws.length);
        }
    }

    return throws;
}

export function getMatchWinner(saygData) {
    let homeScore = 0;
    let awayScore = 0;

    for (let legIndex in saygData.legs) {
        const leg = saygData.legs[legIndex];
        const startingScore = leg.startingScore;
        const homeWinner = sum(leg.home.throws, thr => thr.bust ? 0 : thr.score) === startingScore;
        const awayWinner = sum(leg.away.throws, thr => thr.bust ? 0 : thr.score) === startingScore;

        if (homeWinner) {
            homeScore++;
        } else if (awayWinner) {
            awayScore++;
        }
    }

    if (homeScore > awayScore) {
        return 'home';
    }
    if (awayScore > homeScore) {
        return 'away';
    }

    return '';
}

export function isLegWinner(leg, accumulatorName) {
    const accumulator = leg[accumulatorName];
    const winnerByScore = sum(accumulator.throws, thr => thr.bust ? 0 : thr.score) === leg.startingScore;
    return leg.winner === accumulatorName || winnerByScore;
}

export function legsWon(saygMatches, accumulatorName) {
    return sum(saygMatches, map => {
        const saygData = map.saygData;
        if (!saygData || !saygData.legs) {
            return 0;
        }

        // no of legs won in this match
        return count(
            Object.keys(saygData.legs).map(legKey => saygData.legs[legKey]),
            leg => isLegWinner(leg, accumulatorName));
    })
}

export function countLegThrowsBetween(leg, accumulatorName, lowerInclusive, upperExclusive) {
    const accumulator = leg[accumulatorName] || { };
    const throws = accumulator.throws || [];
    return count(throws, thr => !thr.bust && thr.score >= lowerInclusive && (!upperExclusive || thr.score < upperExclusive));
}

export function legTons(leg, accumulatorName) {
    return countLegThrowsBetween(leg, accumulatorName, 100, 140)
        + countLegThrowsBetween(leg, accumulatorName, 140, 180)
        + (countLegThrowsBetween(leg, accumulatorName, 180) * 2);
}

export function legTonsSplit(leg, accumulatorName) {
    const oneEighties = countLegThrowsBetween(leg, accumulatorName, 180);
    const tons = countLegThrowsBetween(leg, accumulatorName, 100, 140)
        + countLegThrowsBetween(leg, accumulatorName, 140, 180)
        + (oneEighties);

    return `${tons}+${oneEighties}`;
}

export function legActualDarts(leg, accumulatorName) {
    const accumulator = leg[accumulatorName];
    if (!accumulator || !accumulator.throws) {
        return 0;
    }

    return sum(accumulator.throws, thr => thr.noOfDarts);
}

export function legGameShot(leg, accumulatorName) {
    const accumulator = leg[accumulatorName];
    if (!accumulator || !accumulator.throws) {
        return null;
    }

    const lastThrow = accumulator.throws[accumulator.throws.length - 1];
    return isLegWinner(leg, accumulatorName) && lastThrow ? lastThrow.score : null;
}

export function legScoreLeft(leg, accumulatorName) {
    const accumulator = leg[accumulatorName];
    if (!accumulator || !accumulator.throws) {
        return null;
    }

    return isLegWinner(leg, accumulatorName)
        ? null
        : leg.startingScore - sum(accumulator.throws, thr => thr.bust ? 0 : thr.score);
}

function countMatchThrowsBetween(saygData, accumulatorName, lowerInclusive, upperExclusive) {
    if (!saygData || !saygData.legs) {
        return null;
    }

    return sum(Object.keys(saygData.legs).map(legIndex => {
        const leg = saygData.legs[legIndex];
        const accumulator = leg[accumulatorName];

        return count(
            accumulator.throws,
            thr => !thr.bust && thr.score >= lowerInclusive && (!upperExclusive || thr.score < upperExclusive));
    }));
}
