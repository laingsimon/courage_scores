import {IDivisionDto} from '../IDivisionDto'

// see CourageScores.Models.Dtos.Division.DivisionDataSeasonDto
export interface IDivisionDataSeasonDto {
    id: string;
    name: string;
    startDate?: string;
    endDate?: string;
    divisions?: IDivisionDto[];
    updated?: string;
}
