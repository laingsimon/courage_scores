import React, { createContext, useContext, useState } from 'react';
import { Http, IHttp } from '../../api/http.ts';
import { ISettings, Settings } from '../../api/settings.ts';
import { IParentHeight, ParentHeight } from '../layout/ParentHeight.ts';
import socketFactory from '../../api/socketFactory.ts';
import { IDependencies } from './IDependencies.ts';
import { ISubscriptions } from '../../live/ISubscriptions.ts';
import { AccountApi } from '../../interfaces/apis/IAccountApi.ts';
import { ErrorApi } from '../../interfaces/apis/IErrorApi.ts';
import { ReportApi } from '../../interfaces/apis/IReportApi.ts';
import { SaygApi } from '../../interfaces/apis/ISaygApi.ts';
import { SeasonTemplateApi } from '../../interfaces/apis/ISeasonTemplateApi.ts';
import { DivisionApi } from '../../interfaces/apis/IDivisionApi.ts';
import { GameApi } from '../../interfaces/apis/IGameApi.ts';
import { ILiveApi, LiveApi } from '../../interfaces/apis/ILiveApi.ts';
import { NoteApi } from '../../interfaces/apis/INoteApi.ts';
import { SeasonApi } from '../../interfaces/apis/ISeasonApi.ts';
import { PlayerApi } from '../../interfaces/apis/IPlayerApi.ts';
import { TeamApi } from '../../interfaces/apis/ITeamApi.ts';
import { TournamentGameApi } from '../../interfaces/apis/ITournamentGameApi.ts';
import { DataApi } from '../../interfaces/apis/IDataApi.ts';
import { IWebSocketContext } from '../../live/IWebSocketContext.ts';
import { MultiModeLiveWebSocket } from '../../live/MultiModeLiveWebSocket.ts';
import { WebSocketUpdateStrategy } from '../../live/WebSocketUpdateStrategy.ts';
import { PollingUpdateStrategy } from '../../live/PollingUpdateStrategy.ts';
import { WebSocketMode } from '../../live/WebSocketMode.ts';
import { FeatureApi } from '../../interfaces/apis/IFeatureApi.ts';
import { CookiesProvider } from 'react-cookie';
import { RemoteControlApi } from '../../interfaces/apis/IRemoteControlApi.ts';
import { QueryApi } from '../../interfaces/apis/IQueryApi.ts';

const DependenciesContext = createContext({});

export function useDependencies(): IDependencies {
    return useContext(DependenciesContext) as IDependencies;
}

export interface IIocContainerProps {
    children?: React.ReactNode;
    socketFactory?(setts: ISettings): WebSocket;
    overrideHttp?: IHttp;
    overrideParentHeight?: IParentHeight;
}

/* istanbul ignore next */
export function IocContainer({
    children,
    overrideHttp,
    overrideParentHeight,
    ...services
}: IIocContainerProps) {
    const [socketContext, setSocketContext] = useState<IWebSocketContext>({
        modes: [WebSocketMode.socket, WebSocketMode.polling],
    });
    const [subscriptions, setSubscriptions] = useState<ISubscriptions>({});
    const settings: ISettings = new Settings();
    const http: IHttp = overrideHttp || new Http(settings);
    const liveApi: ILiveApi =
        (services as IDependencies).liveApi || new LiveApi(http);
    const oneSecond: number = 1000;
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
        liveApi: liveApi,
        remoteControlApi: new RemoteControlApi(http),
        queryApi: new QueryApi(http),
        parentHeight: overrideParentHeight || new ParentHeight(25),
        webSocket: new MultiModeLiveWebSocket({
            socketContext,
            subscriptions,
            setSubscriptions: async (subs: ISubscriptions) =>
                setSubscriptions(subs),
            setSocketContext: async (context: IWebSocketContext) =>
                setSocketContext(context),
            webSocketStrategy: new WebSocketUpdateStrategy(() =>
                (services.socketFactory || socketFactory)(settings),
            ),
            pollingStrategy: new PollingUpdateStrategy(
                liveApi,
                oneSecond,
                10 * oneSecond,
            ),
        }),
        featureApi: new FeatureApi(http),
    };

    const dependencies = Object.assign({}, defaultServices, services);

    return (
        <DependenciesContext.Provider value={dependencies}>
            <CookiesProvider>{children}</CookiesProvider>
        </DependenciesContext.Provider>
    );
}
