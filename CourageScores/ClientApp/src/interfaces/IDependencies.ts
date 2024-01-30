﻿import {ISeasonApi} from "../api/season";
import {ITeamApi} from "../api/team";
import {ISettings} from "../api/settings";
import {IParentHeight} from "../ParentHeight";
import {ITournamentApi} from "../api/tournament";
import {IDataApi} from "../api/data";
import {INoteApi} from "../api/note";
import {IPlayerApi} from "../api/player";
import {ILiveApi} from "../api/live";
import {ILiveWebSocket} from "../LiveWebSocket";
import {IAccountApi} from "./apis/AccountApi";
import {IErrorApi} from "./apis/ErrorApi";
import {IReportApi} from "./apis/ReportApi";
import {ISaygApi} from "./apis/SaygApi";
import {ISeasonTemplateApi} from "./apis/SeasonTemplateApi";
import {IDivisionApi} from "./apis/DivisionApi";
import {IGameApi} from "./apis/GameApi";

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
    templateApi: ISeasonTemplateApi;
    liveApi: ILiveApi;
    webSocket: ILiveWebSocket;
}

