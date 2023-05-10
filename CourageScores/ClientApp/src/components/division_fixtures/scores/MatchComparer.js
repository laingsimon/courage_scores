export function matchEquals(x, y) {
    if (!x && !y) {
        return true;
    }

    if (!y || !x) {
        return false;
    }

    return x.homeScore === y.homeScore
        && x.awayScore === y.awayScore
        && playersEqual(x.homePlayers, y.homePlayers)
        && playersEqual(x.awayPlayers, y.awayPlayers);
}

function playersEqual(xPlayers, yPlayers) {
    if (!xPlayers && !yPlayers) {
        return true;
    }

    if (!xPlayers || !yPlayers) {
        return false;
    }

    if (xPlayers.length !== yPlayers.length) {
        return false;
    }

    for (let index = 0; index < xPlayers.length; index++) {
        const xPlayer = xPlayers[index];
        const yPlayer = yPlayers[index];

        if (xPlayer.id !== yPlayer.id) {
            return false;
        }
    }

    return true;
}