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

    async function onWebSocketMessage(message) {
        const socket = message.currentTarget;
        if (message.type !== 'message') {
            console.log(`Unhandled message: ${JSON.stringify(message)}`);
            return;
        }

        const jsonData = JSON.parse(message.data);
        switch (jsonData.type) {
            case 'Update': {
                await onDataUpdate(jsonData.data);
                break;
            }
            case 'Marco': {
                // send back polo
                socket.send(JSON.stringify({
                    type: 'polo',
                }));
                break;
            }
            case 'Polo': {
                // nothing to do
                break;
            }
            case 'Error': {
                console.error(jsonData);
                if (jsonData.message) {
                    onError(jsonData.message);
                }
                break;
            }
            default: {
                console.log(`Unhandled message: ${message.data}`);
                // other message types might be: ping, alert, close, etc.
                break;
            }
        }
    }

    async function enableLiveUpdates(enabled) {
        if (enabled && !webSocket && id) {
            const newSocket = await liveApi.createSocket(id);
            newSocket.onmessage = onWebSocketMessage;
            newSocket.onclose = () => {
                console.error('Socket closed server-side');
            };

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