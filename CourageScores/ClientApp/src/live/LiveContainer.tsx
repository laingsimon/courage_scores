import React, { createContext, useContext, useEffect, useState } from 'react';
import { useDependencies } from '../components/common/IocContainer.tsx';
import { useApp } from '../components/common/AppContainer.tsx';
import { ILive } from './ILive.ts';
import { ILiveOptions } from './ILiveOptions.ts';
import { ISubscriptionRequest } from './ISubscriptionRequest.ts';
import { UntypedPromise } from '../interfaces/UntypedPromise.ts';
import { hasAccess } from '../helpers/conditions.ts';
import { isEmpty } from '../helpers/collections.ts';
import { DISCONNECTED } from './WebSocketUpdateStrategy.ts';
import { AccessOption } from '../interfaces/models/dtos/Identity/AccessOption.ts';

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
    const canConnect: boolean = hasAccess(account, AccessOption.useWebSockets);
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
            await webSocket.subscribe(request, onDataUpdate, (err) =>
                handleError(request, err),
            );
        } else if (!enabled) {
            await webSocket.unsubscribe(request.id);
        }
    }

    async function handleError(request: ISubscriptionRequest, error: any) {
        if (error === DISCONNECTED) {
            await handleDisconnected(request);
            return;
        }

        onError(error);
    }

    async function handleDisconnected(request: ISubscriptionRequest) {
        console.error(
            `Websocket disconnected for ${request.id} (${request.type})`,
        );
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
