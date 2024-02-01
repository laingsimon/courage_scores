import {TournamentMatchDto} from "./models/dtos/Game/TournamentMatchDto";
import {ISuperleagueSayg} from "./ISuperleagueSayg";

export interface ISuperleagueSaygMatchMapping extends ISuperleagueSayg {
    match: TournamentMatchDto;
}