import {IDivisionTemplateDto} from './IDivisionTemplateDto'
import {ISeasonHealthCheckResultDto} from '../../Health/ISeasonHealthCheckResultDto'

// see CourageScores.Models.Dtos.Season.Creation.TemplateDto
export interface ITemplateDto {
    name: string;
    divisions?: IDivisionTemplateDto[];
    sharedAddresses?: string[][];
    templateHealth?: ISeasonHealthCheckResultDto;
    description?: string;
    created?: string;
    author?: string;
    updated?: string;
    editor?: string;
    deleted?: string;
    remover?: string;
    id: string;
}
