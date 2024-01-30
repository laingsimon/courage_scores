import {count, sum} from "./collections";
import {ILegThrowDto} from "../interfaces/models/dtos/Game/Sayg/ILegThrowDto";
import {IScoreAsYouGoDto} from "../interfaces/models/dtos/Game/Sayg/IScoreAsYouGoDto";
import {ILegDto} from "../interfaces/models/dtos/Game/Sayg/ILegDto";
import {ILegCompetitorScoreDto} from "../interfaces/models/dtos/Game/Sayg/ILegCompetitorScoreDto";
import {ISuperleagueSayg} from "../interfaces/ISuperleagueSayg";

export function playerOverallAverage(saygData: IScoreAsYouGoDto | null | undefined, sideName: string): number | null {
    if (!saygData || !saygData.legs) {
        return null;
    }

    const metrics = Object.keys(saygData.legs).map((legIndex: string) => {
        const leg: ILegDto = saygData.legs![legIndex];
        const side = leg[sideName];

        return {
            score: sum(side.throws, (thr: ILegThrowDto) => thr.bust ? 0 : thr.score),
            noOfDarts: sum(side.throws, (thr: ILegThrowDto) => thr.noOfDarts),
        };
    });

    return sum(metrics, m => m.score) / sum(metrics, m => m.noOfDarts);
}

export function countMatch100(saygData: IScoreAsYouGoDto | null | undefined, accumulatorName: string): number | null {
    return countMatchThrowsBetween(saygData, accumulatorName, 100, 140);
}

export function countMatch140(saygData: IScoreAsYouGoDto | null | undefined, accumulatorName: string): number | null {
    return countMatchThrowsBetween(saygData, accumulatorName, 140, 180);
}

export function countMatch180(saygData: IScoreAsYouGoDto | null | undefined, accumulatorName: string): number | null {
    return countMatchThrowsBetween(saygData, accumulatorName, 180);
}

export function matchTons(saygData: IScoreAsYouGoDto | null | undefined, accumulatorName: string): number {
    return (countMatch100(saygData, accumulatorName) || 0) + (countMatch140(saygData, accumulatorName) || 0) + ((countMatch180(saygData, accumulatorName) || 0) * 2);
}

export function getNoOfLegs(saygData: IScoreAsYouGoDto | null | undefined): number | null {
    if (!saygData) {
        return null;
    }

    return Object.keys(saygData.legs || {})
        .map((legKey: string): ILegDto => saygData.legs![legKey])
        .filter((leg: ILegDto): number => {
            return leg.home!.noOfDarts || (leg.away ? leg.away.noOfDarts : 0);
        })
        .length;
}

export function sumOverThrows(saygData: IScoreAsYouGoDto | null | undefined, accumulatorName: string, prop: string, includeBust?: boolean): number | null {
    if (!saygData) {
        return null;
    }

    return sum(Object.keys(saygData.legs || {})
        .map((legKey: string): ILegDto => saygData.legs![legKey])
        .flatMap((leg: ILegDto) => (leg)[accumulatorName].throws)
        .map((thr: ILegThrowDto) => includeBust || !thr.bust ? thr[prop] : 0));
}

export function maxNoOfThrowsAllMatches(saygMatches: ISuperleagueSayg[]) {
    let throws: number = 0;

    for (let index = 0; index < saygMatches.length; index++) {
        const saygData: IScoreAsYouGoDto = saygMatches[index].saygData;

        if (!saygData || !saygData.legs) {
            continue;
        }

        for (const legsKey in saygData.legs) {
            const leg: ILegDto = saygData.legs[legsKey];

            throws = Math.max(throws, leg.home!.throws!.length);
            throws = Math.max(throws, leg.away!.throws!.length);
        }
    }

    return throws;
}

export function getMatchWinner(saygData: IScoreAsYouGoDto) {
    let homeScore = 0;
    let awayScore = 0;

    for (let legIndex in saygData.legs) {
        const leg: ILegDto = saygData.legs[legIndex];
        const startingScore = leg.startingScore;
        const homeWinner = sum(leg.home!.throws!, (thr: ILegThrowDto) => thr.bust ? 0 : thr.score) === startingScore;
        const awayWinner = leg.away ? sum(leg.away.throws!, (thr: ILegThrowDto) => thr.bust ? 0 : thr.score) === startingScore : false;

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

export function isLegWinner(leg: ILegDto, accumulatorName: string): boolean {
    const accumulator = leg[accumulatorName];
    const winnerByScore = sum(accumulator.throws, (thr: ILegThrowDto) => thr.bust ? 0 : thr.score) === leg.startingScore;
    return leg.winner === accumulatorName || winnerByScore;
}

export function legsWon(saygMatches: ISuperleagueSayg[], accumulatorName: string): number {
    return sum(saygMatches, (map: ISuperleagueSayg) => {
        const saygData: IScoreAsYouGoDto = map.saygData;
        if (!saygData || !saygData.legs) {
            return 0;
        }

        // no of legs won in this match
        return count(
            Object.keys(saygData.legs).map((key: string) => saygData.legs[key]),
            (leg: ILegDto) => isLegWinner(leg, accumulatorName));
    });
}

export function countLegThrowsBetween(leg: ILegDto, accumulatorName: string, lowerInclusive: number, upperExclusive?: number): number {
    const accumulator: ILegCompetitorScoreDto = leg[accumulatorName] || {};
    const throws = accumulator.throws || [];
    return count(throws, thr => !thr.bust && thr.score >= lowerInclusive && (!upperExclusive || thr.score < upperExclusive));
}

export function legTons(leg: ILegDto, accumulatorName: string): number {
    return countLegThrowsBetween(leg, accumulatorName, 100, 140)
        + countLegThrowsBetween(leg, accumulatorName, 140, 180)
        + (countLegThrowsBetween(leg, accumulatorName, 180) * 2);
}

export function legTonsSplit(leg: ILegDto, accumulatorName: string): string {
    const oneEighties = countLegThrowsBetween(leg, accumulatorName, 180);
    const tons = countLegThrowsBetween(leg, accumulatorName, 100, 140)
        + countLegThrowsBetween(leg, accumulatorName, 140, 180)
        + (oneEighties);

    if (oneEighties === 0) {
        return `${tons}`;
    }

    return `${tons}+${oneEighties}`;
}

export function legActualDarts(leg: ILegDto, accumulatorName: string): number {
    const accumulator: ILegCompetitorScoreDto = leg[accumulatorName];
    if (!accumulator || !accumulator.throws) {
        return 0;
    }

    return sum(accumulator.throws, (thr: ILegThrowDto) => thr.noOfDarts);
}

export function legGameShot(leg: ILegDto, accumulatorName: string): number | null {
    const accumulator: ILegCompetitorScoreDto = leg[accumulatorName];
    if (!accumulator || !accumulator.throws) {
        return null;
    }

    const lastThrow = accumulator.throws[accumulator.throws.length - 1];
    return isLegWinner(leg, accumulatorName) && lastThrow ? lastThrow.score : null;
}

export function legScoreLeft(leg: ILegDto, accumulatorName: string): number | null {
    const accumulator: ILegCompetitorScoreDto = leg[accumulatorName];
    if (!accumulator || !accumulator.throws) {
        return null;
    }

    return isLegWinner(leg, accumulatorName)
        ? null
        : leg.startingScore - sum(accumulator.throws, thr => thr.bust ? 0 : thr.score);
}

function countMatchThrowsBetween(saygData: IScoreAsYouGoDto | null | undefined, accumulatorName: string, lowerInclusive: number, upperExclusive?: number): number | null {
    if (!saygData || !saygData.legs) {
        return null;
    }

    return sum(Object.keys(saygData.legs).map((legIndex: string) => {
        const leg: ILegDto = saygData.legs![legIndex];
        const accumulator: ILegCompetitorScoreDto = leg[accumulatorName];

        return count(
            accumulator.throws!,
            (thr: ILegThrowDto) => !thr.bust && thr.score >= lowerInclusive && (!upperExclusive || thr.score < upperExclusive));
    }));
}
