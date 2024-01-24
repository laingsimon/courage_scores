import {IGameTeamDto} from './IGameTeamDto'
import {IGameMatchDto} from './IGameMatchDto'
import {IGamePlayerDto} from './IGamePlayerDto'
import {INotablePlayerDto} from './INotablePlayerDto'
import {IGameMatchOptionDto} from './IGameMatchOptionDto'

// see CourageScores.Models.Dtos.Game.GameDto
export interface IGameDto {
    home: IGameTeamDto;
    away: IGameTeamDto;
    matches?: IGameMatchDto[];
    homeSubmission?: IGameDto;
    awaySubmission?: IGameDto;
    resultsPublished?: boolean;
    oneEighties?: IGamePlayerDto[];
    over100Checkouts?: INotablePlayerDto[];
    matchOptions?: IGameMatchOptionDto[];
    divisionId?: string;
    seasonId?: string;
    date?: string;
    address: string;
    postponed?: boolean;
    isKnockout?: boolean;
    accoladesCount?: boolean;
    created?: string;
    author?: string;
    updated?: string;
    editor?: string;
    deleted?: string;
    remover?: string;
    id?: string;
}
