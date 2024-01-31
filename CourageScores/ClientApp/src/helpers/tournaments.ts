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

export function getRoundNameFromMatches(matches: number, depth: number) {
    if (matches === 1) {
        return 'Final';
    }
    if (matches === 2) {
        return 'Semi-Final';
    }
    if (matches === 3 || matches === 4) {
        return 'Quarter-Final';
    }

    return `Round: ${depth + 1}`;
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

