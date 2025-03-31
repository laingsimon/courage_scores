import React, {createContext, useContext, useEffect, useState} from "react";
import {useDependencies} from "../components/common/IocContainer";
import {useApp} from "../components/common/AppContainer";
import {ILive} from "./ILive";
import {ILiveOptions} from "./ILiveOptions";
import {ISubscriptionRequest} from "./ISubscriptionRequest";
import {UntypedPromise} from "../interfaces/UntypedPromise";
import {hasAccess} from "../helpers/conditions";
import {isEmpty} from "../helpers/collections";

const LiveContext = createContext({});

export function useLive(): ILive {
    return useContext(LiveContext) as ILive;
}

export interface ILiveContainerProps {
    children?: React.ReactNode;
    /* eslint-disable @typescript-eslint/no-explicit-any */
    onDataUpdate?(data: any): UntypedPromise;
    liveOptions: ILiveOptions;
}

export function LiveContainer({children, onDataUpdate, liveOptions}: ILiveContainerProps) {
    const {webSocket} = useDependencies();
    const {onError, account} = useApp();
    const canConnect: boolean = hasAccess(account, access => access.useWebSockets);
    const [pendingSubscriptions, setPendingSubscriptions] = useState<ISubscriptionRequest[]>([]);
    const [subscribing, setSubscribing] = useState<boolean>(false);

    useEffect(() => {
        if (liveOptions && liveOptions.subscribeAtStartup) {
            setPendingSubscriptions(liveOptions.subscribeAtStartup);
        }
    },
    // eslint-disable-next-line
    [account]);

    useEffect(() => {
        if (isEmpty(pendingSubscriptions) || subscribing) {
            return;
        }

        const nextPendingSubscription = pendingSubscriptions[0];
        setSubscribing(true);
        setPendingSubscriptions(pendingSubscriptions.filter((_, index) => index > 0));

        // noinspection JSIgnoredPromiseFromCall
        enableLiveUpdates(true, nextPendingSubscription);
    }, [account, pendingSubscriptions, subscribing]);

    async function enableLiveUpdates(enabled: boolean, request: ISubscriptionRequest) {
        try {
            if (enabled && !webSocket.subscriptions[request.id] && canConnect) {
                await webSocket.subscribe(request, onDataUpdate, onError);
            } else if (!enabled) {
                await webSocket.unsubscribe(request.id);
            }
        } finally {
            setSubscribing(false);
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