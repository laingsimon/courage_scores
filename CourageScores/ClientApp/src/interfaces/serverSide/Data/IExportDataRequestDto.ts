// see CourageScores.Models.Dtos.Data.ExportDataRequestDto
export interface IExportDataRequestDto {
    password?: string;
    includeDeletedEntries?: boolean;
    tables?: { [key: string]: string[] };
}
