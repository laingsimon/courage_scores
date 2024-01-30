import {ILegDisplayOptions} from "./ILegDisplayOptions";
import {IUpdateRecordedScoreAsYouGoDto} from "./models/dtos/Game/Sayg/IUpdateRecordedScoreAsYouGoDto";
import {IScoreAsYouGoDto} from "./models/dtos/Game/Sayg/IScoreAsYouGoDto";

export interface IBaseSayg {
    matchStatisticsOnly?: boolean;
    lastLegDisplayOptions?: ILegDisplayOptions;
}

export interface ISayg extends IBaseSayg {
    sayg: IUpdateRecordedScoreAsYouGoDto;
    setSayg: (newData: IUpdateRecordedScoreAsYouGoDto) => Promise<IUpdateRecordedScoreAsYouGoDto>;
    saveDataAndGetId: (useData?: IScoreAsYouGoDto) => Promise<string>;
}