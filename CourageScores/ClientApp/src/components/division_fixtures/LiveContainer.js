import {createContext, useContext, useEffect} from "react";
import {useDependencies} from "../../IocContainer";
import {useApp} from "../../AppContainer";

const LiveContext = createContext({});

export function useLive() {
    return useContext(LiveContext);
}

export function LiveContainer({children, onDataUpdate, liveOptions}) {
    const {webSocket} = useDependencies();
    const {onError} = useApp();

    useEffect(() => {
        if (liveOptions && liveOptions.subscribeAtStartup) {
            enableLiveUpdates(true);
        }
    },
    // eslint-disable-next-line
    [liveOptions]);

    function enableLiveUpdates(enabled, id) {
        if (enabled && !webSocket.subscriptions[id]) {
            webSocket.subscribe(id, onDataUpdate, onError);
        } else if (!enabled) {
            webSocket.unsubscribe(id);
        }
    }

    const props = {
        enableLiveUpdates,
        liveOptions,
        subscriptions: webSocket.subscriptions,
        connected: !!webSocket.socket,
    };

    return (<LiveContext.Provider value={props}>
        {children}
    </LiveContext.Provider>)
}