import {ITournamentSideDto} from './ITournamentSideDto'
import {ITournamentRoundDto} from './ITournamentRoundDto'
import {ITournamentPlayerDto} from './ITournamentPlayerDto'
import {INotableTournamentPlayerDto} from './INotableTournamentPlayerDto'

// see CourageScores.Models.Dtos.Game.TournamentGameDto
export interface ITournamentGameDto {
    date?: string;
    seasonId?: string;
    divisionId?: string;
    sides?: ITournamentSideDto[];
    round?: ITournamentRoundDto;
    address: string;
    oneEighties?: ITournamentPlayerDto[];
    over100Checkouts?: INotableTournamentPlayerDto[];
    notes?: string;
    type?: string;
    accoladesCount?: boolean;
    bestOf?: number;
    singleRound?: boolean;
    host?: string;
    opponent?: string;
    gender?: string;
    created?: string;
    author?: string;
    updated?: string;
    editor?: string;
    deleted?: string;
    remover?: string;
    id: string;
}
