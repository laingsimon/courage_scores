import {IDataErrorDto} from './IDataErrorDto'
import {IDivisionTeamDto} from './IDivisionTeamDto'
import {IDivisionFixtureDateDto} from './IDivisionFixtureDateDto'
import {IDivisionPlayerDto} from './IDivisionPlayerDto'
import {IDivisionDataSeasonDto} from './IDivisionDataSeasonDto'

// see CourageScores.Models.Dtos.Division.DivisionDataDto
export interface IDivisionDataDto {
    id: string;
    name: string;
    updated?: string;
    dataErrors?: IDataErrorDto[];
    teams?: IDivisionTeamDto[];
    fixtures?: IDivisionFixtureDateDto[];
    players?: IDivisionPlayerDto[];
    season?: IDivisionDataSeasonDto;
}
