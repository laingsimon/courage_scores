import {IGameTeamDto} from '../Game/IGameTeamDto'

// see CourageScores.Models.Dtos.Division.OtherDivisionFixtureDto
export interface IOtherDivisionFixtureDto {
    id: string;
    divisionId?: string;
    home?: IGameTeamDto;
    away?: IGameTeamDto;
}
