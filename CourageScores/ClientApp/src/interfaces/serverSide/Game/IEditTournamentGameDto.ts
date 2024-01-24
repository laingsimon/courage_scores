import {ITournamentSideDto} from './ITournamentSideDto'
import {ITournamentRoundDto} from './ITournamentRoundDto'
import {IRecordTournamentScoresPlayerDto} from './IRecordTournamentScoresPlayerDto'
import {ITournamentOver100CheckoutDto} from './ITournamentOver100CheckoutDto'

// see CourageScores.Models.Dtos.Game.EditTournamentGameDto
export interface IEditTournamentGameDto {
    id?: string;
    address?: string;
    date?: string;
    notes?: string;
    type?: string;
    bestOf?: number;
    singleRound?: boolean;
    host?: string;
    opponent?: string;
    gender?: string;
    sides?: ITournamentSideDto[];
    round?: ITournamentRoundDto;
    accoladesCount?: boolean;
    divisionId?: string;
    seasonId?: string;
    oneEighties?: IRecordTournamentScoresPlayerDto[];
    over100Checkouts?: ITournamentOver100CheckoutDto[];
    lastUpdated?: string;
}
