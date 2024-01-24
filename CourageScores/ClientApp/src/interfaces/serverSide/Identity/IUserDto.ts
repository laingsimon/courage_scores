import {IAccessDto} from './IAccessDto'

// see CourageScores.Models.Dtos.Identity.UserDto
export interface IUserDto {
    name: string;
    givenName: string;
    emailAddress: string;
    access?: IAccessDto;
    teamId?: string;
}
