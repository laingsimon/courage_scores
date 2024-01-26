import {IDivisionDto} from '../IDivisionDto'

// see CourageScores.Models.Dtos.Season.SeasonDto
export interface ISeasonDto {
    startDate?: string;
    endDate?: string;
    divisions?: IDivisionDto[];
    name: string;
    isCurrent?: boolean;
    created?: string;
    author?: string;
    updated?: string;
    editor?: string;
    deleted?: string;
    remover?: string;
    id: string;
}
