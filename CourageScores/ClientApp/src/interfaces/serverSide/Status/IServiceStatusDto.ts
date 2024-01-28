// see CourageScores.Models.Dtos.Status.ServiceStatusDto
export interface IServiceStatusDto {
    databaseAccess?: boolean;
    seasonStatus?: string;
    cachedEntries?: number;
    startTime?: string;
    upTime?: string;
    openSockets?: number;
}
