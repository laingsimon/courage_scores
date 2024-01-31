import {repeat} from "./projection";

export interface ILayoutDataForSide {
    id: string;
    name: string;
    link: JSX.Element;
}

export interface ILayoutDataForMatch {
    sideA: ILayoutDataForSide;
    sideB: ILayoutDataForSide;
    scoreA: string;
    scoreB: string;
    bye?: boolean;
    winner?: string;
    saygId?: string;
}

export interface ILayoutDataForRound {
    name: string;
    matches: ILayoutDataForMatch[];
}

export function getRoundNameFromSides(round: { name?: string | null }, sideLength: number, depth: number) {
    if (round.name) {
        return round.name;
    }
    if (sideLength === 2) {
        return 'Final';
    }
    if (sideLength === 4) {
        return 'Semi-Final';
    }
    if (sideLength >= 6 && sideLength <= 8) {
        return 'Quarter-Final';
    }

    return `Round: ${depth}`;
}

export function hasScore(score?: number | null) {
    return score !== null && score !== undefined;
}

/* istanbul ignore next */
export function sideSelection(side: { id: string, name: string}) {
    return {
        value: side.id,
        text: side.name
    };
}

export function getUnplayedLayoutData(noOfSides: number, depth: number): ILayoutDataForRound[] {
    if (noOfSides <= 1) {
        return [];
    }

    const hasBye: boolean = noOfSides % 2 !== 0;
    const layoutDataForRound: ILayoutDataForRound = {
        name: null,
        matches: repeat(Math.floor(noOfSides / 2), (_: number): ILayoutDataForMatch => {
            return {
                sideA: {id: null, name: null, link: null},
                sideB: {id: null, name: null, link: null},
                scoreA: null,
                scoreB: null,
                bye: false,
                winner: null,
                saygId: null,
            };
        }),
    };
    if (hasBye) {
        layoutDataForRound.matches.push({
            sideA: {id: null, name: null, link: null},
            sideB: {id: null, name: null, link: null},
            scoreA: null,
            scoreB: null,
            bye: true,
            winner: null,
            saygId: null,
        });
    }

    return [layoutDataForRound].concat(getUnplayedLayoutData(Math.floor(noOfSides / 2) + (hasBye ? 1 : 0), depth + 1));
}
