import {ILegCompetitorScoreDto} from './ILegCompetitorScoreDto'
import {ILegPlayerSequenceDto} from './ILegPlayerSequenceDto'

// see CourageScores.Models.Dtos.Game.Sayg.LegDto
export interface ILegDto {
    startingScore?: number;
    winner?: string;
    home: ILegCompetitorScoreDto;
    away: ILegCompetitorScoreDto;
    playerSequence?: ILegPlayerSequenceDto[];
    currentThrow?: string;
    isLastLeg?: boolean;
}
