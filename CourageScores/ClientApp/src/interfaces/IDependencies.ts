import {ITeamApi} from "../api/team";
import {ISettings} from "../api/settings";
import {IParentHeight} from "../ParentHeight";
import {IDataApi} from "../api/data";
import {ILiveWebSocket} from "../LiveWebSocket";
import {IAccountApi} from "./apis/AccountApi";
import {IErrorApi} from "./apis/ErrorApi";
import {IReportApi} from "./apis/ReportApi";
import {ISaygApi} from "./apis/SaygApi";
import {ISeasonTemplateApi} from "./apis/SeasonTemplateApi";
import {IDivisionApi} from "./apis/DivisionApi";
import {IGameApi} from "./apis/GameApi";
import {ILiveApi} from "./apis/LiveApi";
import {INoteApi} from "./apis/NoteApi";
import {ISeasonApi} from "./apis/SeasonApi";
import {IPlayerApi} from "./apis/PlayerApi";
import {ITournamentGameApi} from "./apis/TournamentGameApi";

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

