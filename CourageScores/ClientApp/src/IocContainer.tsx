import React, {createContext, useContext, useState} from "react";
import {Http, IHttp} from "./api/http";
import {ISettings, Settings} from "./api/settings";
import {IParentHeight, ParentHeight} from "./ParentHeight";
import socketFactory from "./api/socketFactory";
import {LiveWebSocket} from "./LiveWebSocket";
import {IDependencies} from "./interfaces/IDependencies";
import {ISubscriptions} from "./interfaces/ISubscriptions";
import {AccountApi} from "./interfaces/apis/AccountApi";
import {ErrorApi} from "./interfaces/apis/ErrorApi";
import {ReportApi} from "./interfaces/apis/ReportApi";
import {SaygApi} from "./interfaces/apis/SaygApi";
import {SeasonTemplateApi} from "./interfaces/apis/SeasonTemplateApi";
import {DivisionApi} from "./interfaces/apis/DivisionApi";
import {GameApi} from "./interfaces/apis/GameApi";
import {LiveApi} from "./interfaces/apis/LiveApi";
import {NoteApi} from "./interfaces/apis/NoteApi";
import {SeasonApi} from "./interfaces/apis/SeasonApi";
import {PlayerApi} from "./interfaces/apis/PlayerApi";
import {TeamApi} from "./interfaces/apis/TeamApi";
import {TournamentGameApi} from "./interfaces/apis/TournamentGameApi";
import {DataApi} from "./interfaces/apis/DataApi";

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
        tournamentApi: new TournamentGameApi(http),
        errorApi: new ErrorApi(http),
        dataApi: new DataApi(http),
        accountApi: new AccountApi(http),
        gameApi: new GameApi(http),
        noteApi: new NoteApi(http),
        playerApi: new PlayerApi(http),
        reportApi: new ReportApi(http),
        saygApi: new SaygApi(http),
        templateApi: new SeasonTemplateApi(http),
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