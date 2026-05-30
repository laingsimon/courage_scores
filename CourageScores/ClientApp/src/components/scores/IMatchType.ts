import { TeamPlayerDto } from '../../interfaces/models/dtos/Team/TeamPlayerDto.ts';
import { GameMatchDto } from '../../interfaces/models/dtos/Game/GameMatchDto.ts';
import { GameMatchOptionDto } from '../../interfaces/models/dtos/Game/GameMatchOptionDto.ts';
import { ICreatePlayerFor } from './Score.ts';
import { UntypedPromise } from '../../interfaces/UntypedPromise.ts';

export interface IMatchType {
    matchOptions: GameMatchOptionDto;
    otherMatches: GameMatchDto[];
    setCreatePlayerFor(index: ICreatePlayerFor): UntypedPromise;
    homePlayers: TeamPlayerDto[];
    awayPlayers: TeamPlayerDto[];
}
