import {sum} from "./collections";

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