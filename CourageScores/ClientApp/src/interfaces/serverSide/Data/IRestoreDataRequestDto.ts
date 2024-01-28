// see CourageScores.Models.Dtos.Data.RestoreDataRequestDto
export interface IRestoreDataRequestDto {
    requestToken?: string;
    identity?: string;
    zip?: string;
    purgeData?: boolean;
    tables?: string[];
    password?: string;
    dryRun?: boolean;
}
