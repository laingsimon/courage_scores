import {ITournamentMatchDto} from "./models/dtos/Game/ITournamentMatchDto";
import {ISuperleagueSayg} from "./ISuperleagueSayg";

export interface ISuperleagueSaygMatchMapping extends ISuperleagueSayg {
    match: ITournamentMatchDto;
}