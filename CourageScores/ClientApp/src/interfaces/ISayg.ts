import {ILegDisplayOptions} from "./ILegDisplayOptions";
import {IUpdateRecordedScoreAsYouGoDto} from "./serverSide/Game/Sayg/IUpdateRecordedScoreAsYouGoDto";
import {IScoreAsYouGoDto} from "./serverSide/Game/Sayg/IScoreAsYouGoDto";

export interface IBaseSayg {
    matchStatisticsOnly?: boolean;
    lastLegDisplayOptions?: ILegDisplayOptions;
}

export interface ISayg extends IBaseSayg {
    sayg: IUpdateRecordedScoreAsYouGoDto;
    setSayg: (newData: IUpdateRecordedScoreAsYouGoDto) => Promise<IUpdateRecordedScoreAsYouGoDto>;
    saveDataAndGetId: (useData?: IScoreAsYouGoDto) => Promise<string>;
}