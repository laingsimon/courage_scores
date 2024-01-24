import {IDivisionApi} from "../api/division";
import {IAccountApi} from "../api/account";
import {ISeasonApi} from "../api/season";
import {ITeamApi} from "../api/team";
import {IErrorApi} from "../api/error";
import {ISettings} from "../api/settings";
import {IParentHeight} from "../ParentHeight";
import {ITournamentApi} from "../api/tournament";
import {IDataApi} from "../api/data";
import {IGameApi} from "../api/game";
import {INoteApi} from "../api/note";
import {IPlayerApi} from "../api/player";
import {IReportApi} from "../api/report";
import {ISaygApi} from "../api/sayg";
import {ITemplateApi} from "../api/template";
import {ILiveApi} from "../api/live";
import {ILiveWebSocket} from "../LiveWebSocket";

export interface IDependencies {
    divisionApi: IDivisionApi;
    accountApi: IAccountApi;
    seasonApi: ISeasonApi;
    teamApi: ITeamApi;
    errorApi: IErrorApi;
    settings: ISettings;
    parentHeight: IParentHeight;
    tournamentApi: ITournamentApi;
    dataApi: IDataApi;
    gameApi: IGameApi;
    noteApi: INoteApi;
    playerApi: IPlayerApi;
    reportApi: IReportApi;
    saygApi: ISaygApi;
    templateApi: ITemplateApi;
    liveApi: ILiveApi;
    webSocket: ILiveWebSocket;
}

