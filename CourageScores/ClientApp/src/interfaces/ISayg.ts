import {IRecordedScoreAsYouGoDto} from "./serverSide/Game/Sayg/IRecordedScoreAsYouGoDto";
import {ILegDisplayOptions} from "./ILegDisplayOptions";

export interface IBaseSayg {
    matchStatisticsOnly?: boolean;
    lastLegDisplayOptions?: ILegDisplayOptions;
}

export interface ISayg extends IBaseSayg {
    sayg: IRecordedScoreAsYouGoDto;
    setSayg: (newData: IRecordedScoreAsYouGoDto) => Promise<IRecordedScoreAsYouGoDto>;
    saveDataAndGetId: (useData?: IRecordedScoreAsYouGoDto) => Promise<string>;
}