import {count, sum} from "./collections";

export function getPlayerOverallAverage(saygData, sideName) {
    if (!saygData) {
        return null;
    }

    const metrics = Object.keys(saygData.legs || {}).map(legIndex => {
        const leg = saygData.legs[legIndex];
        const side = leg[sideName];

        return {
            score: sum(side.throws, thr => thr.score),
            noOfDarts: sum(side.throws, thr => thr.noOfDarts),
        };
    });

    return sum(metrics, m => m.score) / sum(metrics, m => m.noOfDarts);
}

export function countThrowsBetween(saygData, accumulatorName, lowerInclusive, upperExclusive) {
    if (!saygData || !saygData.legs) {
        return null;
    }

    return sum(Object.keys(saygData.legs).map(legIndex => {
        const leg = saygData.legs[legIndex];
        const accumulator = leg[accumulatorName];

        return count(
            accumulator.throws,
            thr => thr.score >= lowerInclusive && (!upperExclusive || thr.score < upperExclusive));
    }));
}

export function count100(saygData, accumulatorName) {
    return countThrowsBetween(saygData, accumulatorName, 100, 140);
}

export function count140(saygData, accumulatorName) {
    return countThrowsBetween(saygData, accumulatorName, 140, 180);
}

export function count180(saygData, accumulatorName) {
    return countThrowsBetween(saygData, accumulatorName, 180);
}

export function countTons(saygData, accumulatorName) {
    return count100(saygData, accumulatorName) + count140(saygData, accumulatorName) + (count180(saygData, accumulatorName) * 2);
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

export function sumOfAllCheckouts(saygData, accumulatorName) {
    if (!saygData) {
        return null;
    }

    return sum(Object.keys(saygData.legs || {})
        .map(legKey => saygData.legs[legKey])
        .map(leg => {
            const throws = leg[accumulatorName].throws;
            const lastThrow = throws[throws.length - 1];
            const startingScore = leg.startingScore;
            const winnerByScore = sum(throws, thr => thr.score) === startingScore;
            const winner = leg.winner === accumulatorName || winnerByScore;

            return lastThrow && winner
                ? lastThrow.score
                : 0;
        }));
}

export function getNoOfThrows(matches, saygDataMap) {
    let throws = 0;

    for (let index = 0; index < matches.length; index++) {
        const match = matches[index];
        const saygData = saygDataMap[match.saygId];

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

export function getSaygWinner(saygData) {
    let homeScore = 0;
    let awayScore = 0;

    for (let legIndex in saygData.legs) {
        const leg = saygData.legs[legIndex];
        const startingScore = leg.startingScore;
        const homeWinner = sum(leg.home.throws, thr => thr.score) === startingScore;
        const awayWinner = sum(leg.away.throws, thr => thr.score) === startingScore;
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