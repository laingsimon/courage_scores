import {ITournamentSideDto} from './ITournamentSideDto'

// see CourageScores.Models.Dtos.Game.TournamentMatchDto
export interface ITournamentMatchDto {
    sideA: ITournamentSideDto;
    sideB: ITournamentSideDto;
    scoreA?: number;
    scoreB?: number;
    saygId?: string;
    created?: string;
    author?: string;
    updated?: string;
    editor?: string;
    deleted?: string;
    remover?: string;
    id?: string;
}
