import {createContext, useContext, useEffect} from "react";
import {useDependencies} from "../../IocContainer";
import {useApp} from "../../AppContainer";

const LiveContext = createContext({});

export function useLive() {
    return useContext(LiveContext);
}

export function LiveContainer({children, id, onDataUpdate, webSocket, setWebSocket, enabledAtStartup, permitted}) {
    const {liveApi} = useDependencies();
    const {onError} = useApp();

    useEffect(() => {
        if (enabledAtStartup) {
            // noinspection JSIgnoredPromiseFromCall
            enableLiveUpdates(true);
        }
    },
    // eslint-disable-next-line
    [enabledAtStartup]);

    async function enableLiveUpdates(enabled) {
        if (enabled && !webSocket && id) {
            const newSocket = await liveApi.createSocket(id);
            newSocket.updateHandler = onDataUpdate;
            newSocket.errorHandler = onError;

            newSocket.send(JSON.stringify({
                type: 'marco',
            }));

            setWebSocket(newSocket);
        } else if (!enabled && webSocket) {
            webSocket.close();
            setWebSocket(null);
        }
    }

    const props = {
        isEnabled: !!webSocket,
        enableLiveUpdates,
        permitted,
    };

    return (<LiveContext.Provider value={props}>
        {children}
    </LiveContext.Provider>)
}