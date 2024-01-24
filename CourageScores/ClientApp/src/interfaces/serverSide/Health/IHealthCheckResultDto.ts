// see CourageScores.Models.Dtos.Health.HealthCheckResultDto
export interface IHealthCheckResultDto {
    errors?: string[];
    warnings?: string[];
    messages?: string[];
    success?: boolean;
}
