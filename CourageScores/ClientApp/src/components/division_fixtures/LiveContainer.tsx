import React, {createContext, useContext, useEffect} from "react";
import {useDependencies} from "../../IocContainer";
import {useApp} from "../../AppContainer";
import {ILive} from "../../interfaces/ILive";
import {ILiveOptions} from "../../interfaces/ILiveOptions";

const LiveContext = createContext({});

export function useLive(): ILive {
    return useContext(LiveContext) as ILive;
}

export interface ILiveContainerProps {
    children?: React.ReactNode;
    onDataUpdate?: (data: any) => Promise<any>;
    liveOptions: ILiveOptions;
}

export function LiveContainer({children, onDataUpdate, liveOptions}: ILiveContainerProps) {
    const {webSocket} = useDependencies();
    const {onError, account} = useApp();
    const canConnect: boolean = account && account.access.useWebSockets;

    useEffect(() => {
        if (liveOptions && liveOptions.subscribeAtStartup) {
            liveOptions.subscribeAtStartup.forEach(id => {
                // noinspection JSIgnoredPromiseFromCall
                enableLiveUpdates(true, id);
            });
        }
    },
    // eslint-disable-next-line
    [liveOptions]);

    async function enableLiveUpdates(enabled: boolean, id: string) {
        if (enabled && !webSocket.subscriptions[id] && canConnect) {
            webSocket.subscribe(id, onDataUpdate, onError);
        } else if (!enabled) {
            await webSocket.unsubscribe(id);
        }
    }

    const props: ILive = {
        enableLiveUpdates,
        liveOptions,
        subscriptions: webSocket.subscriptions,
        connected: webSocket.isConnected(),
    };

    return (<LiveContext.Provider value={props}>
        {children}
    </LiveContext.Provider>)
}