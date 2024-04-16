import {ISettings} from "../../api/settings";
import {IParentHeight} from "../layout/ParentHeight";
import {ILiveWebSocket} from "../../live/ILiveWebSocket";
import {IAccountApi} from "../../interfaces/apis/IAccountApi";
import {IErrorApi} from "../../interfaces/apis/IErrorApi";
import {IReportApi} from "../../interfaces/apis/IReportApi";
import {ISaygApi} from "../../interfaces/apis/ISaygApi";
import {ISeasonTemplateApi} from "../../interfaces/apis/ISeasonTemplateApi";
import {IDivisionApi} from "../../interfaces/apis/IDivisionApi";
import {IGameApi} from "../../interfaces/apis/IGameApi";
import {ILiveApi} from "../../interfaces/apis/ILiveApi";
import {INoteApi} from "../../interfaces/apis/INoteApi";
import {ISeasonApi} from "../../interfaces/apis/ISeasonApi";
import {IPlayerApi} from "../../interfaces/apis/IPlayerApi";
import {ITeamApi} from "../../interfaces/apis/ITeamApi";
import {ITournamentGameApi} from "../../interfaces/apis/ITournamentGameApi";
import {IDataApi} from "../../interfaces/apis/IDataApi";
import {IFeatureApi} from "../../interfaces/apis/IFeatureApi";

export interface IDependencies {
    divisionApi: IDivisionApi;
    accountApi: IAccountApi;
    seasonApi: ISeasonApi;
    teamApi: ITeamApi;
    errorApi: IErrorApi;
    settings: ISettings;
    parentHeight: IParentHeight;
    tournamentApi: ITournamentGameApi;
    dataApi: IDataApi;
    gameApi: IGameApi;
    noteApi: INoteApi;
    playerApi: IPlayerApi;
    reportApi: IReportApi;
    saygApi: ISaygApi;
    templateApi: ISeasonTemplateApi;
    liveApi: ILiveApi;
    webSocket: ILiveWebSocket;
    featureApi: IFeatureApi;
}

