import {IPatchTournamentMatchDto} from './IPatchTournamentMatchDto'

// see CourageScores.Models.Dtos.Game.PatchTournamentRoundDto
export interface IPatchTournamentRoundDto {
    match?: IPatchTournamentMatchDto;
    nextRound?: IPatchTournamentRoundDto;
}
