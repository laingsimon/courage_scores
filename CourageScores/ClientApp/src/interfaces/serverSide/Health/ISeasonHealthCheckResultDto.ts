import {IHealthCheckResultDto} from './IHealthCheckResultDto'

// see CourageScores.Models.Dtos.Health.SeasonHealthCheckResultDto
export interface ISeasonHealthCheckResultDto {
    errors?: string[];
    warnings?: string[];
    messages?: string[];
    success?: boolean;
    checks?: { [key: string]: IHealthCheckResultDto };
}
