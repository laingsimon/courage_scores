import {ILegDisplayOptions} from "./ILegDisplayOptions";
import {UpdateRecordedScoreAsYouGoDto} from "../../interfaces/models/dtos/Game/Sayg/UpdateRecordedScoreAsYouGoDto";
import {ScoreAsYouGoDto} from "../../interfaces/models/dtos/Game/Sayg/ScoreAsYouGoDto";
import {IEditThrow} from "./SaygLoadingContainer";

export interface IBaseSayg {
    matchStatisticsOnly?: boolean;
    lastLegDisplayOptions?: ILegDisplayOptions;
}

export interface ISayg extends IBaseSayg {
    sayg: UpdateRecordedScoreAsYouGoDto;
    setSayg(newData: UpdateRecordedScoreAsYouGoDto): Promise<UpdateRecordedScoreAsYouGoDto>;
    saveDataAndGetId(useData?: ScoreAsYouGoDto): Promise<string>;
    editScore?: IEditThrow;
    setEditScore(edit: IEditThrow): Promise<any>;
}