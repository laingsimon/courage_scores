import {ITournamentSideDto} from '../Game/ITournamentSideDto'

// see CourageScores.Models.Dtos.Division.DivisionTournamentFixtureDetailsDto
export interface IDivisionTournamentFixtureDetailsDto {
    id?: string;
    address: string;
    notes?: string;
    date?: string;
    seasonId?: string;
    type?: string;
    winningSide?: ITournamentSideDto;
    proposed?: boolean;
    players?: string[];
    sides?: ITournamentSideDto[];
}
