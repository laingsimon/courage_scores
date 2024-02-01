import {GameMatchDto} from "../../../interfaces/models/dtos/Game/GameMatchDto";
import {GamePlayerDto} from "../../../interfaces/models/dtos/Game/GamePlayerDto";

export function matchEquals(x?: GameMatchDto, y?: GameMatchDto): boolean {
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

function playersEqual(xPlayers?: GamePlayerDto[], yPlayers?: GamePlayerDto[]): boolean {
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
        const xPlayer: GamePlayerDto = xPlayers[index];
        const yPlayer: GamePlayerDto = yPlayers[index];

        if (xPlayer.id !== yPlayer.id) {
            return false;
        }
    }

    return true;
}