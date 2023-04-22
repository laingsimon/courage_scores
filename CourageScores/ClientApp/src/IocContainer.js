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
import {SaygApi} from "./api/sayg";

const DependenciesContext = createContext({});

export function useDependencies() {
    return useContext(DependenciesContext);
}

export function IocContainer({ children, ...services }) {
    const settings = new Settings();
    const http = new Http(settings);
    const defaultServices = {
        settings: settings,
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
        reportApi: new ReportApi(http),
        saygApi: new SaygApi(http),
    }

    return (<DependenciesContext.Provider value={Object.assign({}, defaultServices, services)}>
        {children}
    </DependenciesContext.Provider>)
}