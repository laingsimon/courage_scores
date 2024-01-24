import {ILegDto} from './ILegDto'

// see CourageScores.Models.Dtos.Game.Sayg.ScoreAsYouGoDto
export interface IScoreAsYouGoDto {
    legs?: { [key: number]: ILegDto };
}
