import {IDivisionTemplateDto} from './IDivisionTemplateDto'

// see CourageScores.Models.Dtos.Season.Creation.SeasonProposalRequestDto
export interface ISeasonProposalRequestDto {
    seasonId?: string;
    templateId?: string;
    template?: IDivisionTemplateDto;
    skipDates?: string[];
    designations?: { [key: string]: string };
}
