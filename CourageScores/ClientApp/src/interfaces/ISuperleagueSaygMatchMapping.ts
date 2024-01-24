import {ITournamentMatchDto} from "./serverSide/Game/ITournamentMatchDto";
import {ISuperleagueSayg} from "./ISuperleagueSayg";

export interface ISuperleagueSaygMatchMapping extends ISuperleagueSayg {
    match: ITournamentMatchDto;
}