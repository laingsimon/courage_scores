// see CourageScores.Models.Dtos.Division.DivisionDataFilter
export interface IDivisionDataFilter {
    date?: string;
    divisionId?: string;
    seasonId?: string;
    teamId?: string;
    excludeProposals?: boolean;
}
