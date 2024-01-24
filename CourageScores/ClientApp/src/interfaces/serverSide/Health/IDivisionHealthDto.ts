import {IDivisionDateHealthDto} from './IDivisionDateHealthDto'
import {IDivisionTeamDto} from '../Division/IDivisionTeamDto'

// see CourageScores.Models.Dtos.Health.DivisionHealthDto
export interface IDivisionHealthDto {
    id?: string;
    name: string;
    dates?: IDivisionDateHealthDto[];
    teams?: IDivisionTeamDto[];
}
