import {ITournamentSideDto} from './ITournamentSideDto'
import {ITournamentMatchDto} from './ITournamentMatchDto'
import {IGameMatchOptionDto} from './IGameMatchOptionDto'

// see CourageScores.Models.Dtos.Game.TournamentRoundDto
export interface ITournamentRoundDto {
    name?: string;
    sides?: ITournamentSideDto[];
    matches?: ITournamentMatchDto[];
    nextRound?: ITournamentRoundDto;
    matchOptions?: IGameMatchOptionDto[];
    created?: string;
    author?: string;
    updated?: string;
    editor?: string;
    deleted?: string;
    remover?: string;
    id?: string;
}
