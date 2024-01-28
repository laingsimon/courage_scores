import {IDivisionFixtureTeamDto} from './IDivisionFixtureTeamDto'
import {IOtherDivisionFixtureDto} from './IOtherDivisionFixtureDto'

// see CourageScores.Models.Dtos.Division.DivisionFixtureDto
export interface IDivisionFixtureDto {
    id: string;
    homeScore?: number;
    homeTeam: IDivisionFixtureTeamDto;
    awayScore?: number;
    awayTeam?: IDivisionFixtureTeamDto;
    proposal?: boolean;
    postponed?: boolean;
    isKnockout?: boolean;
    accoladesCount?: boolean;
    fixturesUsingAddress?: IOtherDivisionFixtureDto[];
}
