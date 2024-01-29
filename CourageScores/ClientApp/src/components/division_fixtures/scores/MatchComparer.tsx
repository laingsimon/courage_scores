import {IGameMatchDto} from "../../../interfaces/dtos/Game/IGameMatchDto";
import {IGamePlayerDto} from "../../../interfaces/dtos/Game/IGamePlayerDto";

export function matchEquals(x?: IGameMatchDto, y?: IGameMatchDto): boolean {
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

function playersEqual(xPlayers?: IGamePlayerDto[], yPlayers?: IGamePlayerDto[]): boolean {
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
        const xPlayer: IGamePlayerDto = xPlayers[index];
        const yPlayer: IGamePlayerDto = yPlayers[index];

        if (xPlayer.id !== yPlayer.id) {
            return false;
        }
    }

    return true;
}