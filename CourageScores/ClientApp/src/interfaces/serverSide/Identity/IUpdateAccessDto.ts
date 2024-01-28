import {IAccessDto} from './IAccessDto'

// see CourageScores.Models.Dtos.Identity.UpdateAccessDto
export interface IUpdateAccessDto {
    emailAddress: string;
    access?: IAccessDto;
}
