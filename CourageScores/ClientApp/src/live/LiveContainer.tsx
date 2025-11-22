import React, { createContext, useContext, useEffect, useState } from 'react';
import { useDependencies } from '../components/common/IocContainer';
import { useApp } from '../components/common/AppContainer';
import { ILive } from './ILive';
import { ILiveOptions } from './ILiveOptions';
import { ISubscriptionRequest } from './ISubscriptionRequest';
import { UntypedPromise } from '../interfaces/UntypedPromise';
import { hasAccess } from '../helpers/conditions';
import { isEmpty } from '../helpers/collections';

const LiveContext = createContext({});

export function useLive(): ILive {
    return useContext(LiveContext) as ILive;
}

export interface ILiveContainerProps {
    children?: React.ReactNode;
    onDataUpdate?(data: object): UntypedPromise;
    liveOptions: ILiveOptions;
}

interface PendingRequest {
    enabled: boolean;
    request: ISubscriptionRequest;
}

export function LiveContainer({
    children,
    onDataUpdate,
    liveOptions,
}: ILiveContainerProps) {
    const { webSocket } = useDependencies();
    const { onError, account } = useApp();
    const canConnect: boolean = hasAccess(
        account,
        (access) => access.useWebSockets,
    );
    const [pending, setPending] = useState<PendingRequest[]>([]);
    const [subscribing, setSubscribing] = useState<boolean>(false);
    let threadSafePending = pending;

    useEffect(
        () => {
            if (liveOptions && liveOptions.subscribeAtStartup) {
                setPending(
                    liveOptions.subscribeAtStartup.map((s) => ({
                        enabled: true,
                        request: s,
                    })),
                );
            }
        },
        // eslint-disable-next-line
        [account],
    );

    useEffect(() => {
        if (isEmpty(pending) || subscribing) {
            return;
        }

        const nextPending = pending[0];

        // noinspection JSIgnoredPromiseFromCall
        enableLiveUpdates(nextPending.enabled, nextPending.request).then(() => {
            setPending(pending.filter((_, index) => index > 0));
            setSubscribing(false);
        });
    }, [account, pending, subscribing]);

    async function enableLiveUpdates(
        enabled: boolean,
        request: ISubscriptionRequest,
    ) {
        /* istanbul ignore next */
        if (subscribing) {
            /* istanbul ignore next */
            return;
        }

        setSubscribing(true);
        if (enabled && !webSocket.subscriptions[request.id] && canConnect) {
            await webSocket.subscribe(request, onDataUpdate, onError);
        } else if (!enabled) {
            await webSocket.unsubscribe(request.id);
        }
    }

    async function enqueueSubscription(
        enabled: boolean,
        request: ISubscriptionRequest,
    ) {
        const newPending = threadSafePending.concat([{ enabled, request }]);
        setPending(newPending);
        threadSafePending = newPending;
    }

    const props: ILive = {
        enableLiveUpdates: enqueueSubscription,
        liveOptions,
        subscriptions: webSocket.subscriptions,
    };

    return (
        <LiveContext.Provider value={props}>{children}</LiveContext.Provider>
    );
}
