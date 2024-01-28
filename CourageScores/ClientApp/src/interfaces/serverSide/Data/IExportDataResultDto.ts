// see CourageScores.Models.Dtos.Data.ExportDataResultDto
export interface IExportDataResultDto {
    tables?: { [key: string]: number };
    zip?: string;
}
