import {IDateTemplateDto} from './IDateTemplateDto'

// see CourageScores.Models.Dtos.Season.Creation.DivisionTemplateDto
export interface IDivisionTemplateDto {
    sharedAddresses?: string[][];
    dates?: IDateTemplateDto[];
}
