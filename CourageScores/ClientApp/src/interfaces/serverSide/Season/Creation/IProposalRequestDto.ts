// see CourageScores.Models.Dtos.Season.Creation.ProposalRequestDto
export interface IProposalRequestDto {
    seasonId?: string;
    templateId?: string;
    placeholderMappings?: { [key: string]: string };
}
