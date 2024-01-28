import {IReportDto} from './IReportDto'

// see CourageScores.Models.Dtos.Report.ReportCollectionDto
export interface IReportCollectionDto {
    reports?: IReportDto[];
    divisionId?: string;
    seasonId?: string;
    messages?: string[];
    created?: string;
}
