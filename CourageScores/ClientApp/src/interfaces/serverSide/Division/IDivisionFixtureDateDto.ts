import {IDivisionFixtureDto} from './IDivisionFixtureDto'
import {IDivisionTournamentFixtureDetailsDto} from './IDivisionTournamentFixtureDetailsDto'
import {IFixtureDateNoteDto} from '../IFixtureDateNoteDto'

// see CourageScores.Models.Dtos.Division.DivisionFixtureDateDto
export interface IDivisionFixtureDateDto {
    date?: string;
    fixtures?: IDivisionFixtureDto[];
    tournamentFixtures?: IDivisionTournamentFixtureDetailsDto[];
    notes?: IFixtureDateNoteDto[];
}
