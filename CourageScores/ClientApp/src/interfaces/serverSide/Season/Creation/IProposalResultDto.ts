import {ITeamDto} from '../../Team/ITeamDto'
import {ITemplateDto} from './ITemplateDto'
import {ISeasonDto} from '../ISeasonDto'
import {IDivisionDataDto} from '../../Division/IDivisionDataDto'
import {ISeasonHealthCheckResultDto} from '../../Health/ISeasonHealthCheckResultDto'

// see CourageScores.Models.Dtos.Season.Creation.ProposalResultDto
export interface IProposalResultDto {
    placeholderMappings?: { [key: string]: ITeamDto };
    template?: ITemplateDto;
    season?: ISeasonDto;
    divisions?: IDivisionDataDto[];
    proposalHealth?: ISeasonHealthCheckResultDto;
}
