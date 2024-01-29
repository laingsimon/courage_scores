import {ITournamentMatchDto} from "./dtos/Game/ITournamentMatchDto";
import {ISuperleagueSayg} from "./ISuperleagueSayg";

export interface ISuperleagueSaygMatchMapping extends ISuperleagueSayg {
    match: ITournamentMatchDto;
}