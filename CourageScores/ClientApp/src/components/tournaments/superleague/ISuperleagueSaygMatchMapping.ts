import { TournamentMatchDto } from '../../../interfaces/models/dtos/Game/TournamentMatchDto.ts';
import { ISuperleagueSayg } from './ISuperleagueSayg.ts';

export interface ISuperleagueSaygMatchMapping extends ISuperleagueSayg {
    match: TournamentMatchDto;
}
