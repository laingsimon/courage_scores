import React, {createContext, useContext, useEffect} from "react";
import {useDependencies} from "../components/common/IocContainer";
import {useApp} from "../components/common/AppContainer";
import {ILive} from "./ILive";
import {ILiveOptions} from "./ILiveOptions";
import {ISubscriptionRequest} from "./ISubscriptionRequest";

const LiveContext = createContext({});

export function useLive(): ILive {
    return useContext(LiveContext) as ILive;
}

export interface ILiveContainerProps {
    children?: React.ReactNode;
    onDataUpdate?(data: any): Promise<any>;
    liveOptions: ILiveOptions;
}

export function LiveContainer({children, onDataUpdate, liveOptions}: ILiveContainerProps) {
    const {webSocket} = useDependencies();
    const {onError, account} = useApp();
    const canConnect: boolean = account && account.access && account.access.useWebSockets;

    useEffect(() => {
        if (liveOptions && liveOptions.subscribeAtStartup) {
            for (let request of liveOptions.subscribeAtStartup) {
                // noinspection JSIgnoredPromiseFromCall
                enableLiveUpdates(true, request);
            }
        }
    },
    // eslint-disable-next-line
    [account]);

    async function enableLiveUpdates(enabled: boolean, request: ISubscriptionRequest) {
        if (enabled && !webSocket.subscriptions[request.id] && canConnect) {
            await webSocket.subscribe(request, onDataUpdate, onError);
        } else if (!enabled) {
            await webSocket.unsubscribe(request.id);
        }
    }

    const props: ILive = {
        enableLiveUpdates,
        liveOptions,
        subscriptions: webSocket.subscriptions,
    };

    return (<LiveContext.Provider value={props}>
        {children}
    </LiveContext.Provider>)
}