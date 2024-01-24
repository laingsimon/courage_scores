import {IPatchTournamentRoundDto} from './IPatchTournamentRoundDto'
import {ITournamentPlayerDto} from './ITournamentPlayerDto'
import {INotableTournamentPlayerDto} from './INotableTournamentPlayerDto'

// see CourageScores.Models.Dtos.Game.PatchTournamentDto
export interface IPatchTournamentDto {
    round?: IPatchTournamentRoundDto;
    additional180?: ITournamentPlayerDto;
    additionalOver100Checkout?: INotableTournamentPlayerDto;
}
