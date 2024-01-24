// see CourageScores.Models.Dtos.Data.ImportDataRequestDto
export interface IImportDataRequestDto {
    zip?: string;
    purgeData?: boolean;
    tables?: string[];
    password?: string;
    dryRun?: boolean;
}
