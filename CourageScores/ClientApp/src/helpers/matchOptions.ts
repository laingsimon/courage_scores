import { elementAt } from './collections.ts';
import { GameMatchOptionDto } from '../interfaces/models/dtos/Game/GameMatchOptionDto.ts';

export interface IMultiMatchOptions {
    [legIndex: number]: number;
}

export interface IMatchOptionsLookup {
    playerCount: IMultiMatchOptions;
    startingScore: IMultiMatchOptions;
    numberOfLegs: IMultiMatchOptions;
}

/* istanbul ignore next */
export function getMatchDefaults() {
    return {
        homePlayers: [],
        awayPlayers: [],
    };
}

export function getMatchOptionDefaults(
    legIndex: number,
    matchOptions: IMatchOptionsLookup,
): GameMatchOptionDto {
    return {
        playerCount: matchOptions.playerCount[legIndex],
        startingScore: matchOptions.startingScore[legIndex],
        numberOfLegs: matchOptions.numberOfLegs[legIndex],
    };
}

export interface MatchDefaults {
    singlesBestOf: number;
    pairsBestOf: number;
    triplesBestOf: number;
    singlesStartingScore: number;
    pairsStartingScore: number;
    triplesStartingScore: number;
}

export const LEAGUE_MATCH_DEFAULTS: MatchDefaults = {
    singlesBestOf: 5,
    pairsBestOf: 3,
    triplesBestOf: 3,
    singlesStartingScore: 501,
    pairsStartingScore: 501,
    triplesStartingScore: 601,
};

export const KNOCKOUT_MATCH_DEFAULTS: MatchDefaults = {
    singlesBestOf: 3,
    pairsBestOf: 3,
    triplesBestOf: 0,
    singlesStartingScore: 501,
    pairsStartingScore: 501,
    triplesStartingScore: 0,
};

export function getMatchOptionsLookup(
    matchOptions: GameMatchOptionDto[],
    matchDefaults: MatchDefaults,
): IMatchOptionsLookup {
    return {
        playerCount: {
            0: elementAt(matchOptions, 0, (op) => op.playerCount) || 1,
            1: elementAt(matchOptions, 1, (op) => op.playerCount) || 1,
            2: elementAt(matchOptions, 2, (op) => op.playerCount) || 1,
            3: elementAt(matchOptions, 3, (op) => op.playerCount) || 1,
            4: elementAt(matchOptions, 4, (op) => op.playerCount) || 1,
            5:
                elementAt(matchOptions, 5, (op) => op.playerCount) ||
                (matchDefaults.pairsStartingScore > 0 ? 2 : 0),
            6:
                elementAt(matchOptions, 6, (op) => op.playerCount) ||
                (matchDefaults.pairsStartingScore > 0 ? 2 : 0),
            7:
                elementAt(matchOptions, 7, (op) => op.playerCount) ||
                (matchDefaults.triplesStartingScore > 0 ? 3 : 0),
        },
        startingScore: {
            0:
                elementAt(matchOptions, 0, (op) => op.startingScore) ||
                matchDefaults.singlesStartingScore,
            1:
                elementAt(matchOptions, 1, (op) => op.startingScore) ||
                matchDefaults.singlesStartingScore,
            2:
                elementAt(matchOptions, 2, (op) => op.startingScore) ||
                matchDefaults.singlesStartingScore,
            3:
                elementAt(matchOptions, 3, (op) => op.startingScore) ||
                matchDefaults.singlesStartingScore,
            4:
                elementAt(matchOptions, 4, (op) => op.startingScore) ||
                matchDefaults.singlesStartingScore,
            5:
                elementAt(matchOptions, 5, (op) => op.startingScore) ||
                matchDefaults.pairsStartingScore,
            6:
                elementAt(matchOptions, 6, (op) => op.startingScore) ||
                matchDefaults.pairsStartingScore,
            7:
                elementAt(matchOptions, 7, (op) => op.startingScore) ||
                matchDefaults.triplesStartingScore,
        },
        numberOfLegs: {
            0:
                elementAt(matchOptions, 0, (op) => op.numberOfLegs) ||
                matchDefaults.singlesBestOf,
            1:
                elementAt(matchOptions, 1, (op) => op.numberOfLegs) ||
                matchDefaults.singlesBestOf,
            2:
                elementAt(matchOptions, 2, (op) => op.numberOfLegs) ||
                matchDefaults.singlesBestOf,
            3:
                elementAt(matchOptions, 3, (op) => op.numberOfLegs) ||
                matchDefaults.singlesBestOf,
            4:
                elementAt(matchOptions, 4, (op) => op.numberOfLegs) ||
                matchDefaults.singlesBestOf,
            5:
                elementAt(matchOptions, 5, (op) => op.numberOfLegs) ||
                matchDefaults.pairsBestOf,
            6:
                elementAt(matchOptions, 6, (op) => op.numberOfLegs) ||
                matchDefaults.pairsBestOf,
            7:
                elementAt(matchOptions, 7, (op) => op.numberOfLegs) ||
                matchDefaults.triplesBestOf,
        },
    };
}
