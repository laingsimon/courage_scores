import { createContext, useContext } from "react";
import {Http} from "./api/http";
import {Settings} from "./api/settings";
import {TeamApi} from "./api/team";
import {TournamentApi} from "./api/tournament";
import {ErrorApi} from "./api/error";
import {DataApi} from "./api/data";
import {AccountApi} from "./api/account";
import {GameApi} from "./api/game";
import {NoteApi} from "./api/note";
import {PlayerApi} from "./api/player";
import {ReportApi} from "./api/report";
import {DivisionApi} from "./api/division";
import {SeasonApi} from "./api/season";

const http = new Http(new Settings());
const DependenciesContext = createContext({
    divisionApi: new DivisionApi(http),
    seasonApi: new SeasonApi(http),
    teamApi: new TeamApi(http),
    tournamentApi: new TournamentApi(http),
    errorApi: new ErrorApi(http),
    dataApi: new DataApi(http),
    accountApi: new AccountApi(http),
    gameApi: new GameApi(http),
    noteApi: new NoteApi(http),
    playerApi: new PlayerApi(http),
    reportApi: new ReportApi(http)
});

export function useDependencies() {
    return useContext(DependenciesContext);
}

export function IocContainer({ children, ...services }) {
    return (<DependenciesContext.Provider value={services}>
        {children}
    </DependenciesContext.Provider>)
}