// see CourageScores.Models.Dtos.Team.EditTeamDto
export interface IEditTeamDto {
    id?: string;
    name: string;
    address: string;
    divisionId?: string;
    seasonId?: string;
    newDivisionId?: string;
    lastUpdated?: string;
}
