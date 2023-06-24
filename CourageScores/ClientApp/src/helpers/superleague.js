import {count, sum} from "./collections";

export function getPlayerOverallAverage(saygData, sideName) {
    const metrics = Object.keys(saygData.legs).map(legIndex => {
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
    return Object.keys(saygData.legs)
        .map(legKey => saygData.legs[legKey])
        .filter(leg => {
            return leg.home.noOfDarts || leg.away.noOfDarts;
        })
        .length;
}

