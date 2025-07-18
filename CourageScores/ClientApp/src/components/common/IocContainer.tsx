import React, { createContext, useContext, useState } from 'react';
import { Http, IHttp } from '../../api/http';
import { ISettings, Settings } from '../../api/settings';
import { IParentHeight, ParentHeight } from '../layout/ParentHeight';
import socketFactory from '../../api/socketFactory';
import { IDependencies } from './IDependencies';
import { ISubscriptions } from '../../live/ISubscriptions';
import { AccountApi } from '../../interfaces/apis/IAccountApi';
import { ErrorApi } from '../../interfaces/apis/IErrorApi';
import { ReportApi } from '../../interfaces/apis/IReportApi';
import { SaygApi } from '../../interfaces/apis/ISaygApi';
import { SeasonTemplateApi } from '../../interfaces/apis/ISeasonTemplateApi';
import { DivisionApi } from '../../interfaces/apis/IDivisionApi';
import { GameApi } from '../../interfaces/apis/IGameApi';
import { ILiveApi, LiveApi } from '../../interfaces/apis/ILiveApi';
import { NoteApi } from '../../interfaces/apis/INoteApi';
import { SeasonApi } from '../../interfaces/apis/ISeasonApi';
import { PlayerApi } from '../../interfaces/apis/IPlayerApi';
import { TeamApi } from '../../interfaces/apis/ITeamApi';
import { TournamentGameApi } from '../../interfaces/apis/ITournamentGameApi';
import { DataApi } from '../../interfaces/apis/IDataApi';
import { IWebSocketContext } from '../../live/IWebSocketContext';
import { MultiModeLiveWebSocket } from '../../live/MultiModeLiveWebSocket';
import { WebSocketUpdateStrategy } from '../../live/WebSocketUpdateStrategy';
import { PollingUpdateStrategy } from '../../live/PollingUpdateStrategy';
import { WebSocketMode } from '../../live/WebSocketMode';
import { FeatureApi } from '../../interfaces/apis/IFeatureApi';
import { CookiesProvider } from 'react-cookie';

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
