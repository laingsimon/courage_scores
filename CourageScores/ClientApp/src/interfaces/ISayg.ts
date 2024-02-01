import {ILegDisplayOptions} from "./ILegDisplayOptions";
import {UpdateRecordedScoreAsYouGoDto} from "./models/dtos/Game/Sayg/UpdateRecordedScoreAsYouGoDto";
import {ScoreAsYouGoDto} from "./models/dtos/Game/Sayg/ScoreAsYouGoDto";

export interface IBaseSayg {
    matchStatisticsOnly?: boolean;
    lastLegDisplayOptions?: ILegDisplayOptions;
}

export interface ISayg extends IBaseSayg {
    sayg: UpdateRecordedScoreAsYouGoDto;
    setSayg: (newData: UpdateRecordedScoreAsYouGoDto) => Promise<UpdateRecordedScoreAsYouGoDto>;
    saveDataAndGetId: (useData?: ScoreAsYouGoDto) => Promise<string>;
}