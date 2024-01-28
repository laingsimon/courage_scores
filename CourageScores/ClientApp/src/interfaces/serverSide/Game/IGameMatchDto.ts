import {IGamePlayerDto} from './IGamePlayerDto'
import {IScoreAsYouGoDto} from './Sayg/IScoreAsYouGoDto'

// see CourageScores.Models.Dtos.Game.GameMatchDto
export interface IGameMatchDto {
    homePlayers?: IGamePlayerDto[];
    awayPlayers?: IGamePlayerDto[];
    homeScore?: number;
    awayScore?: number;
    sayg?: IScoreAsYouGoDto;
    created?: string;
    author?: string;
    updated?: string;
    editor?: string;
    deleted?: string;
    remover?: string;
    id?: string;
}
