import {ILeagueFixtureHealthDto} from './ILeagueFixtureHealthDto'

// see CourageScores.Models.Dtos.Health.DivisionDateHealthDto
export interface IDivisionDateHealthDto {
    date?: string;
    fixtures?: ILeagueFixtureHealthDto[];
}
