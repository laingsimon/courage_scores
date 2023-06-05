export function getRoundNameFromSides(round, sideLength, depth) {
    if (round.name) {
        return round.name;
    }
    if (sideLength === 2) {
        return 'Final';
    }
    if (sideLength === 4) {
        return 'Semi-Final';
    }
    if (sideLength === 8) {
        return 'Quarter-Final';
    }

    return `Round: ${depth}`;
}

export function getRoundNameFromMatches(matches, depth) {
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

export function hasScore(score) {
    return score !== null && score !== undefined;
}

/* istanbul ignore next */
export function sideSelection(side) {
    return {
        value: side.id,
        text: side.name
    };
}

