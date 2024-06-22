import {ITournamentLayoutGenerationContext} from "../competition";
import {TournamentRoundDto} from "../../../interfaces/models/dtos/Game/TournamentRoundDto";
import {TournamentSideDto} from "../../../interfaces/models/dtos/Game/TournamentSideDto";

export interface ILayoutRequest {
    sides: TournamentSideDto[];
    context?: ITournamentLayoutGenerationContext;
    round?: TournamentRoundDto;
}