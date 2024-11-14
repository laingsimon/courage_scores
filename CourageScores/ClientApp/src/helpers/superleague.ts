import {count, sum} from "./collections";
import {LegThrowDto} from "../interfaces/models/dtos/Game/Sayg/LegThrowDto";
import {ScoreAsYouGoDto} from "../interfaces/models/dtos/Game/Sayg/ScoreAsYouGoDto";
import {LegDto} from "../interfaces/models/dtos/Game/Sayg/LegDto";
import {LegCompetitorScoreDto} from "../interfaces/models/dtos/Game/Sayg/LegCompetitorScoreDto";
import {ISuperleagueSayg} from "../components/tournaments/superleague/ISuperleagueSayg";
import {getScoreFromThrows} from "./sayg";

export function playerOverallAverage(saygData: ScoreAsYouGoDto | null | undefined, sideName: string): number | null {
    if (!saygData || !saygData.legs) {
        return null;
    }

    const metrics = Object.keys(saygData.legs).map((legIndex: string) => {
        const leg: LegDto = saygData.legs![legIndex];
        const side = leg[sideName];

        return {
            score: getScoreFromThrows(leg.startingScore, side.throws),
            noOfDarts: sum(side.throws, (thr: LegThrowDto) => thr.noOfDarts),
        };
    });

    return sum(metrics, m => m.score) / sum(metrics, m => m.noOfDarts);
}

export function countMatch100(saygData: ScoreAsYouGoDto | null | undefined, accumulatorName: string): number | null {
    return countMatchThrowsBetween(saygData, accumulatorName, 100, 140);
}

export function countMatch140(saygData: ScoreAsYouGoDto | null | undefined, accumulatorName: string): number | null {
    return countMatchThrowsBetween(saygData, accumulatorName, 140, 180);
}

export function countMatch180(saygData: ScoreAsYouGoDto | null | undefined, accumulatorName: string): number | null {
    return countMatchThrowsBetween(saygData, accumulatorName, 180);
}

export function matchTons(saygData: ScoreAsYouGoDto | null | undefined, accumulatorName: string): number {
    return (countMatch100(saygData, accumulatorName) || 0) + (countMatch140(saygData, accumulatorName) || 0) + ((countMatch180(saygData, accumulatorName) || 0) * 2);
}

export function getNoOfLegs(saygData: ScoreAsYouGoDto | null | undefined): number | null {
    if (!saygData) {
        return null;
    }

    return Object.keys(saygData.legs || {})
        .map((legKey: string): LegDto => saygData.legs![legKey])
        .filter((leg: LegDto): number => {
            return leg.home!.noOfDarts || (leg.away ? leg.away.noOfDarts : 0);
        })
        .length;
}

export function sumOverThrows(saygData: ScoreAsYouGoDto | null | undefined, accumulatorName: string, prop: string): number | null {
    if (!saygData) {
        return null;
    }

    return sum(Object.keys(saygData.legs || {})
        .map((legKey: string): LegDto => saygData.legs![legKey])
        .flatMap((leg: LegDto) => (leg)[accumulatorName].throws)
        .map((thr: LegThrowDto) => thr[prop]));
}

export function maxNoOfThrowsAllMatches(saygMatches: ISuperleagueSayg[]) {
    let throws: number = 0;

    for (const saygMatch of saygMatches) {
        const saygData = saygMatch.saygData;
        if (!saygData || !saygData.legs) {
            continue;
        }

        for (const legsKey in saygData.legs) {
            const leg: LegDto = saygData.legs[legsKey];
            throws = Math.max(throws, leg.home!.throws!.length);
            throws = Math.max(throws, leg.away!.throws!.length);
        }
    }

    return throws;
}

export function getMatchWinner(saygData: ScoreAsYouGoDto) {
    let homeScore = 0;
    let awayScore = 0;

    for (const legIndex in saygData.legs) {
        const leg: LegDto = saygData.legs[legIndex];
        const homeWinner = isLegWinner(leg, 'home');
        const awayWinner = leg.away ? isLegWinner(leg, 'away') : false;

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

export function isLegWinner(leg: LegDto, accumulatorName: string): boolean {
    const accumulator = leg[accumulatorName];
    return getScoreFromThrows(leg.startingScore, accumulator.throws) === leg.startingScore;
}

export function legsWon(saygMatches: ISuperleagueSayg[], accumulatorName: string): number {
    return sum(saygMatches, (map: ISuperleagueSayg) => {
        const saygData: ScoreAsYouGoDto = map.saygData;
        if (!saygData || !saygData.legs) {
            return 0;
        }

        // no of legs won in this match
        return count(
            Object.keys(saygData.legs).map((key: string) => saygData.legs[key]),
            (leg: LegDto) => isLegWinner(leg, accumulatorName));
    });
}

export function countLegThrowsBetween(leg: LegDto, accumulatorName: string, lowerInclusive: number, upperExclusive?: number): number {
    const accumulator: LegCompetitorScoreDto = leg[accumulatorName] || {};
    const throws = accumulator.throws || [];
    return count(throws, thr => thr.score >= lowerInclusive && (!upperExclusive || thr.score < upperExclusive));
}

export function legTons(leg: LegDto, accumulatorName: string): number {
    return countLegThrowsBetween(leg, accumulatorName, 100, 140)
        + countLegThrowsBetween(leg, accumulatorName, 140, 180)
        + (countLegThrowsBetween(leg, accumulatorName, 180) * 2);
}

export function legTonsSplit(leg: LegDto, accumulatorName: string): string {
    const oneEighties = countLegThrowsBetween(leg, accumulatorName, 180);
    const tons = countLegThrowsBetween(leg, accumulatorName, 100, 140)
        + countLegThrowsBetween(leg, accumulatorName, 140, 180)
        + (oneEighties);

    if (oneEighties === 0) {
        return `${tons}`;
    }

    return `${tons}+${oneEighties}`;
}

export function legActualDarts(leg: LegDto, accumulatorName: string): number {
    const accumulator: LegCompetitorScoreDto = leg[accumulatorName];
    if (!accumulator || !accumulator.throws) {
        return 0;
    }

    return sum(accumulator.throws, (thr: LegThrowDto) => thr.noOfDarts);
}

export function legGameShot(leg: LegDto, accumulatorName: string): number | null {
    const accumulator: LegCompetitorScoreDto = leg[accumulatorName];
    if (!accumulator || !accumulator.throws) {
        return null;
    }

    const lastThrow = accumulator.throws[accumulator.throws.length - 1];
    return isLegWinner(leg, accumulatorName) && lastThrow ? lastThrow.score : null;
}

export function legScoreLeft(leg: LegDto, accumulatorName: string): number | null {
    const accumulator: LegCompetitorScoreDto = leg[accumulatorName];
    if (!accumulator || !accumulator.throws) {
        return null;
    }

    return isLegWinner(leg, accumulatorName)
        ? null
        : leg.startingScore - getScoreFromThrows(leg.startingScore, accumulator.throws);
}

function countMatchThrowsBetween(saygData: ScoreAsYouGoDto | null | undefined, accumulatorName: string, lowerInclusive: number, upperExclusive?: number): number | null {
    if (!saygData || !saygData.legs) {
        return null;
    }

    return sum(Object.keys(saygData.legs).map((legIndex: string) => {
        const leg: LegDto = saygData.legs![legIndex];
        const accumulator: LegCompetitorScoreDto = leg[accumulatorName];

        return count(
            accumulator.throws!,
            (thr: LegThrowDto) => thr.score >= lowerInclusive && (!upperExclusive || thr.score < upperExclusive));
    }));
}
