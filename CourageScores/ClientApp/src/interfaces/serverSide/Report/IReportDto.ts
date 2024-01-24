import {IReportRowDto} from './IReportRowDto'

// see CourageScores.Models.Dtos.Report.ReportDto
export interface IReportDto {
    name: string;
    description: string;
    rows?: IReportRowDto[];
    valueHeading?: string;
    thisDivisionOnly?: boolean;
}
