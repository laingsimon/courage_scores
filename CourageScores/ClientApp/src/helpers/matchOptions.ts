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

const NO_OF_LEGS_LEAGUE_SINGLES = 5;
const NO_OF_LEGS_LEAGUE_PAIRS = 3;
const NO_OF_LEGS_LEAGUE_TRIPLES = 3;
const NO_OF_LEGS_KNOCKOUT_SINGLES = 3;
const NO_OF_LEGS_KNOCKOUT_PAIRS = 3;
const NO_OF_LEGS_KNOCKOUT_TRIPLES = 0;

export function getMatchOptionsLookup(
    matchOptions: GameMatchOptionDto[],
    isKnockout?: boolean,
): IMatchOptionsLookup {
    return {
        playerCount: {
            0: elementAt(matchOptions, 0, (op) => op.playerCount) || 1,
            1: elementAt(matchOptions, 1, (op) => op.playerCount) || 1,
            2: elementAt(matchOptions, 2, (op) => op.playerCount) || 1,
            3: elementAt(matchOptions, 3, (op) => op.playerCount) || 1,
            4: elementAt(matchOptions, 4, (op) => op.playerCount) || 1,
            5: elementAt(matchOptions, 5, (op) => op.playerCount) || 2,
            6: elementAt(matchOptions, 6, (op) => op.playerCount) || 2,
            7:
                elementAt(matchOptions, 7, (op) => op.playerCount) ||
                (isKnockout ? 0 : 3),
        },
        startingScore: {
            0: elementAt(matchOptions, 0, (op) => op.startingScore) || 501,
            1: elementAt(matchOptions, 1, (op) => op.startingScore) || 501,
            2: elementAt(matchOptions, 2, (op) => op.startingScore) || 501,
            3: elementAt(matchOptions, 3, (op) => op.startingScore) || 501,
            4: elementAt(matchOptions, 4, (op) => op.startingScore) || 501,
            5: elementAt(matchOptions, 5, (op) => op.startingScore) || 501,
            6: elementAt(matchOptions, 6, (op) => op.startingScore) || 501,
            7:
                elementAt(matchOptions, 7, (op) => op.startingScore) ||
                (isKnockout ? 0 : 601),
        },
        numberOfLegs: {
            0:
                elementAt(matchOptions, 0, (op) => op.numberOfLegs) ||
                (isKnockout
                    ? NO_OF_LEGS_KNOCKOUT_SINGLES
                    : NO_OF_LEGS_LEAGUE_SINGLES),
            1:
                elementAt(matchOptions, 1, (op) => op.numberOfLegs) ||
                (isKnockout
                    ? NO_OF_LEGS_KNOCKOUT_SINGLES
                    : NO_OF_LEGS_LEAGUE_SINGLES),
            2:
                elementAt(matchOptions, 2, (op) => op.numberOfLegs) ||
                (isKnockout
                    ? NO_OF_LEGS_KNOCKOUT_SINGLES
                    : NO_OF_LEGS_LEAGUE_SINGLES),
            3:
                elementAt(matchOptions, 3, (op) => op.numberOfLegs) ||
                (isKnockout
                    ? NO_OF_LEGS_KNOCKOUT_SINGLES
                    : NO_OF_LEGS_LEAGUE_SINGLES),
            4:
                elementAt(matchOptions, 4, (op) => op.numberOfLegs) ||
                (isKnockout
                    ? NO_OF_LEGS_KNOCKOUT_SINGLES
                    : NO_OF_LEGS_LEAGUE_SINGLES),
            5:
                elementAt(matchOptions, 5, (op) => op.numberOfLegs) ||
                (isKnockout
                    ? NO_OF_LEGS_KNOCKOUT_PAIRS
                    : NO_OF_LEGS_LEAGUE_PAIRS),
            6:
                elementAt(matchOptions, 6, (op) => op.numberOfLegs) ||
                (isKnockout
                    ? NO_OF_LEGS_KNOCKOUT_PAIRS
                    : NO_OF_LEGS_LEAGUE_PAIRS),
            7:
                elementAt(matchOptions, 7, (op) => op.numberOfLegs) ||
                (isKnockout
                    ? NO_OF_LEGS_KNOCKOUT_TRIPLES
                    : NO_OF_LEGS_LEAGUE_TRIPLES),
        },
    };
}
