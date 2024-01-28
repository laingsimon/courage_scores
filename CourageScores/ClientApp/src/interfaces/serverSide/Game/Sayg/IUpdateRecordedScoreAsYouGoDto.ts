import {ILegDto} from './ILegDto'

// see CourageScores.Models.Dtos.Game.Sayg.UpdateRecordedScoreAsYouGoDto
export interface IUpdateRecordedScoreAsYouGoDto {
    lastUpdated?: string;
    yourName: string;
    opponentName?: string;
    numberOfLegs?: number;
    startingScore?: number;
    homeScore?: number;
    awayScore?: number;
    tournamentMatchId?: string;
    legs?: { [key: number]: ILegDto };
    created?: string;
    author?: string;
    updated?: string;
    editor?: string;
    deleted?: string;
    remover?: string;
    id?: string;
}
