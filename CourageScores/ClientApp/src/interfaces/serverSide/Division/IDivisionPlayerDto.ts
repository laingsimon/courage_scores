import {IPlayerPerformanceDto} from './IPlayerPerformanceDto'

// see CourageScores.Models.Dtos.Division.DivisionPlayerDto
export interface IDivisionPlayerDto {
    id: string;
    teamId?: string;
    name: string;
    team: string;
    points?: number;
    winPercentage?: number;
    oneEighties?: number;
    over100Checkouts?: number;
    captain?: boolean;
    fixtures?: { [key: string]: string };
    singles?: IPlayerPerformanceDto;
    pairs?: IPlayerPerformanceDto;
    triples?: IPlayerPerformanceDto;
    updated?: string;
    rank?: number;
}
