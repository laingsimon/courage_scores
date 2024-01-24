import {ITeamSeasonDto} from './ITeamSeasonDto'

// see CourageScores.Models.Dtos.Team.TeamDto
export interface ITeamDto {
    name: string;
    address: string;
    seasons?: ITeamSeasonDto[];
    created?: string;
    author?: string;
    updated?: string;
    editor?: string;
    deleted?: string;
    remover?: string;
    id?: string;
}
