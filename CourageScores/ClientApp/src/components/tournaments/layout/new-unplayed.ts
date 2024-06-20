import {TournamentSideDto} from "../../../interfaces/models/dtos/Game/TournamentSideDto";
import {ILayoutDataForRound} from "../layout";

export function getUnplayedLayoutData(sides: TournamentSideDto[]): ILayoutDataForRound[] {
    if (sides.length <= 1) {
        return [];
    }

    return [];
}

