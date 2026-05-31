import { ITournamentLayoutGenerationContext } from '../competition.ts';
import { TournamentRoundDto } from '../../../interfaces/models/dtos/Game/TournamentRoundDto.ts';
import { TournamentSideDto } from '../../../interfaces/models/dtos/Game/TournamentSideDto.ts';

export interface ILayoutRequest {
    sides: TournamentSideDto[];
    context?: ITournamentLayoutGenerationContext;
    round?: TournamentRoundDto;
}
