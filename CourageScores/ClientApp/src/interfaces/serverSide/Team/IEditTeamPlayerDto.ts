// see CourageScores.Models.Dtos.Team.EditTeamPlayerDto
export interface IEditTeamPlayerDto {
    name: string;
    captain?: boolean;
    gameId?: string;
    emailAddress?: string;
    newTeamId?: string;
    lastUpdated?: string;
}
