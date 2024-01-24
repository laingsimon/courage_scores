import {ILegThrowDto} from './ILegThrowDto'

// see CourageScores.Models.Dtos.Game.Sayg.LegCompetitorScoreDto
export interface ILegCompetitorScoreDto {
    bust?: boolean;
    noOfDarts?: number;
    score?: number;
    throws?: ILegThrowDto[];
}
