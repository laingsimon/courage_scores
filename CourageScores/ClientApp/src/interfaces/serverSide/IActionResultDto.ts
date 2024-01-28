// see CourageScores.Models.Dtos.ActionResultDto`1
export interface IActionResultDto<ITDto> {
    result?: ITDto;
    success?: boolean;
    trace?: string[];
    messages?: string[];
    errors?: string[];
    warnings?: string[];
}
