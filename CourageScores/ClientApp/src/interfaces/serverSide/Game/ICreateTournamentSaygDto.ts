import {IGameMatchOptionDto} from './IGameMatchOptionDto'

// see CourageScores.Models.Dtos.Game.CreateTournamentSaygDto
export interface ICreateTournamentSaygDto {
    matchId?: string;
    matchOptions?: IGameMatchOptionDto;
}
