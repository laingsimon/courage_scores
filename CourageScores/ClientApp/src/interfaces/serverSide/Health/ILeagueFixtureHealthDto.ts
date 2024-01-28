// see CourageScores.Models.Dtos.Health.LeagueFixtureHealthDto
export interface ILeagueFixtureHealthDto {
    id: string;
    date?: string;
    homeTeamId?: string;
    homeTeam: string;
    homeTeamAddress?: string;
    awayTeamId?: string;
    awayTeam?: string;
    awayTeamAddress?: string;
}
