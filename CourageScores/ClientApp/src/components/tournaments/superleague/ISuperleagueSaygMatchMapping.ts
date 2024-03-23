import {TournamentMatchDto} from "../../../interfaces/models/dtos/Game/TournamentMatchDto";
import {ISuperleagueSayg} from "./ISuperleagueSayg";

export interface ISuperleagueSaygMatchMapping extends ISuperleagueSayg {
    match: TournamentMatchDto;
}