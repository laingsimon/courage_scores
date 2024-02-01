import {ISettings} from "../api/settings";
import {IParentHeight} from "../ParentHeight";
import {ILiveWebSocket} from "../LiveWebSocket";
import {IAccountApi} from "./apis/IAccountApi";
import {IErrorApi} from "./apis/IErrorApi";
import {IReportApi} from "./apis/IReportApi";
import {ISaygApi} from "./apis/ISaygApi";
import {ISeasonTemplateApi} from "./apis/ISeasonTemplateApi";
import {IDivisionApi} from "./apis/IDivisionApi";
import {IGameApi} from "./apis/IGameApi";
import {ILiveApi} from "./apis/ILiveApi";
import {INoteApi} from "./apis/INoteApi";
import {ISeasonApi} from "./apis/ISeasonApi";
import {IPlayerApi} from "./apis/IPlayerApi";
import {ITeamApi} from "./apis/ITeamApi";
import {ITournamentGameApi} from "./apis/ITournamentGameApi";
import {IDataApi} from "./apis/IDataApi";

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
}

