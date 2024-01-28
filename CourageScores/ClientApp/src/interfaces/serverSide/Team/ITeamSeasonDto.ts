import {ITeamPlayerDto} from './ITeamPlayerDto'

// see CourageScores.Models.Dtos.Team.TeamSeasonDto
export interface ITeamSeasonDto {
    seasonId?: string;
    players?: ITeamPlayerDto[];
    divisionId?: string;
    created?: string;
    author?: string;
    updated?: string;
    editor?: string;
    deleted?: string;
    remover?: string;
    id?: string;
}
