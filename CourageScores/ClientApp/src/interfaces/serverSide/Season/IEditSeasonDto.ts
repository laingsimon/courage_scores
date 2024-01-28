// see CourageScores.Models.Dtos.Season.EditSeasonDto
export interface IEditSeasonDto {
    id?: string;
    startDate?: string;
    endDate?: string;
    name: string;
    copyTeamsFromSeasonId?: string;
    divisionIds?: string[];
    lastUpdated?: string;
}
