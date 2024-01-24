import {ITemplateDto} from './ITemplateDto'
import {IDivisionDataDto} from '../../Division/IDivisionDataDto'
import {IDivisionTeamDto} from '../../Division/IDivisionTeamDto'

// see CourageScores.Models.Dtos.Season.Creation.SeasonProposalDto
export interface ISeasonProposalDto {
    templateDto: ITemplateDto;
    divisions?: IDivisionDataDto[];
    designations?: { [key: string]: IDivisionTeamDto };
    errors?: string[];
    warnings?: string[];
    messages?: string[];
}
