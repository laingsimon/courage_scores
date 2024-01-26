import {IDivisionHealthDto} from './IDivisionHealthDto'

// see CourageScores.Models.Dtos.Health.SeasonHealthDto
export interface ISeasonHealthDto {
    id: string;
    name: string;
    startDate?: string;
    endDate?: string;
    divisions?: IDivisionHealthDto[];
}
