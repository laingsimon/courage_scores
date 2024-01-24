import {IRecordScoresGamePlayerDto} from './IRecordScoresGamePlayerDto'
import {IScoreAsYouGoDto} from './Sayg/IScoreAsYouGoDto'

// see CourageScores.Models.Dtos.Game.RecordScoresDto+RecordScoresGameMatchDto
export interface IRecordScoresGameMatchDto {
    homePlayers?: IRecordScoresGamePlayerDto[];
    homeScore?: number;
    awayPlayers?: IRecordScoresGamePlayerDto[];
    awayScore?: number;
    sayg?: IScoreAsYouGoDto;
}
