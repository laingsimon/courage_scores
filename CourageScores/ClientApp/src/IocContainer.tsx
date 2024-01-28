import React, {createContext, useContext, useState} from "react";
import {Http, IHttp} from "./api/http";
import {ISettings, Settings} from "./api/settings";
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
import {IParentHeight, ParentHeight} from "./ParentHeight";
import {TemplateApi} from "./api/template";
import socketFactory from "./api/socketFactory";
import {LiveWebSocket} from "./LiveWebSocket";
import {LiveApi} from "./api/live";
import {IDependencies} from "./interfaces/IDependencies";
import {ISubscriptions} from "./interfaces/ISubscriptions";

const DependenciesContext = createContext({});

export function useDependencies(): IDependencies {
    return useContext(DependenciesContext) as IDependencies;
}

export interface IIocContainerProps {
    children?: React.ReactNode,
    socketFactory?: (setts: ISettings) => WebSocket,
    overrideHttp?: IHttp;
    overrideParentHeight?: IParentHeight;
}

/* istanbul ignore next */
export function IocContainer({children, overrideHttp, overrideParentHeight, ...services} : IIocContainerProps) {
    const [socket, setSocket] = useState<WebSocket | null>(null);
    const [subscriptions, setSubscriptions] = useState<ISubscriptions>({});
    const settings: ISettings = new Settings();
    const http: IHttp = overrideHttp || new Http(settings);
    const defaultServices: IDependencies = {
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
        templateApi: new TemplateApi(http),
        liveApi: new LiveApi(http),
        parentHeight: overrideParentHeight || new ParentHeight(25),
        webSocket: new LiveWebSocket({
            socket,
            subscriptions,
            setSubscriptions: async (subs: ISubscriptions) => setSubscriptions(subs),
            setSocket: async (socket: WebSocket) => setSocket(socket),
            createSocket: () => (services.socketFactory || socketFactory)(settings),
        }),
    };

    return (<DependenciesContext.Provider value={Object.assign({}, defaultServices, services)}>
        {children}
    </DependenciesContext.Provider>)
}