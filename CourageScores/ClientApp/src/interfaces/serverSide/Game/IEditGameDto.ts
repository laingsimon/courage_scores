// see CourageScores.Models.Dtos.Game.EditGameDto
export interface IEditGameDto {
    homeTeamId?: string;
    awayTeamId?: string;
    id?: string;
    address: string;
    date?: string;
    divisionId?: string;
    seasonId?: string;
    postponed?: boolean;
    isKnockout?: boolean;
    accoladesCount?: boolean;
    lastUpdated?: string;
}
