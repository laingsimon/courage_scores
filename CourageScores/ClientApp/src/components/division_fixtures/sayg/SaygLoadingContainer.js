import React, {createContext, useContext, useEffect, useState} from "react";
import {useDependencies} from "../../../IocContainer";
import {useApp} from "../../../AppContainer";
import {Loading} from "../../common/Loading";
import {ErrorDisplay} from "../../common/ErrorDisplay";
import {ScoreAsYouGo} from "./ScoreAsYouGo";
import {isEmpty} from "../../../helpers/collections";

const SaygContext = createContext({});

export function useSayg() {
    return useContext(SaygContext);
}

export function SaygLoadingContainer({ children, id, defaultData, autoSave, on180, onHiCheck, onScoreChange, onSaved,
                                         onLoadError, refreshAllowed, matchStatisticsOnly, lastLegDisplayOptions,
                                     enableLive }) {
    const [sayg, setSayg] = useState(defaultData);
    const [saveError, setSaveError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [webSocket, setWebSocket] = useState(null);
    const {saygApi} = useDependencies();
    const {onError} = useApp();

    useEffect(() => {
            if (loading) {
                return;
            }

            setLoading(true);
            // noinspection JSIgnoredPromiseFromCall
            loadData(id);
        },
        // eslint-disable-next-line
        []);

    async function loadData() {
        try {
            if (!id) {
                setSayg(defaultData);
                return;
            }

            const sayg = await saygApi.get(id);

            if (!sayg || !sayg.legs) {
                if (onLoadError) {
                    await onLoadError('Data not found');
                }
                return;
            }

            sayg.lastUpdated = sayg.updated;
            if (enableLive) {
                await enableLiveUpdates(true, sayg);
            }
            setSayg(sayg);
            return sayg;
        } catch (e) {
            /* istanbul ignore next */
            onError(e);
        } finally {
            setLoading(false);
        }
    }

    async function saveDataAndGetId(useData) {
        try {
            const response = await saygApi.upsert(useData || sayg);
            if (response.success) {
                response.result.lastUpdated = response.result.updated;
                setSayg(response.result);

                if (onSaved) {
                    await onSaved(response.result);
                }

                return '#' + response.result.id;
            } else {
                setSaveError(response);
            }
        } catch (e) {
            /* istanbul ignore next */
            onError(e);
        }

        return null;
    }

    async function onChange(newData) {
        const newSayg = updateSayg(newData);

        if (!autoSave) {
            return;
        }

        if (!newData.legs['0']) {
            return;
        }

        if (!sayg.legs['0'] || isEmpty(sayg.legs['0'].playerSequence || [])) {
            await saveDataAndGetId(newSayg);
        }
    }

    function onWebSocketMessage(message) {
        const socket = message.currentTarget;
        if (message.type !== 'message') {
            console.log(`Unhandled message: ${JSON.stringify(message)}`);
            return;
        }

        const jsonData = JSON.parse(message.data);
        switch (jsonData.type) {
            case 'Update': {
                setSayg(jsonData.data);
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

    async function enableLiveUpdates(enabled, overrideSayg) {
        const saygData = overrideSayg || sayg;

        if (enabled && !webSocket) {
            const newSocket = await saygApi.createSocket(saygData.id);
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

    function updateSayg(newData) {
        const newSayg = Object.assign({}, sayg, newData);
        setSayg(newSayg);
        if (webSocket) {
            webSocket.send(JSON.stringify({
                type: 'update',
                data: newSayg,
            }));
        }
        return newSayg;
    }

    if (loading) {
        return (<Loading/>);
    }

    const saygProps = {
        sayg,
        setSayg,
        saveDataAndGetId,
        refresh: loadData,
        refreshAllowed,
        matchStatisticsOnly,
        lastLegDisplayOptions,
        enableLiveUpdates,
        liveUpdatesEnabled: !!webSocket,
    };

    try {
        return (<SaygContext.Provider value={saygProps}>
            {saveError ? (
                <ErrorDisplay {...saveError} onClose={() => setSaveError(null)} title="Could not save data"/>) : null}
            {sayg ? (<div>
                {children}
                <ScoreAsYouGo
                    startingScore={Number.parseInt(sayg.startingScore)}
                    numberOfLegs={Number.parseInt(sayg.numberOfLegs)}
                    onHiCheck={onHiCheck}
                    on180={on180}
                    onChange={onChange}
                    homeScore={sayg.homeScore}
                    awayScore={sayg.awayScore}
                    away={sayg.opponentName}
                    home={sayg.yourName}
                    data={sayg}
                    singlePlayer={!sayg.opponentName}
                    onLegComplete={async (homeScore, awayScore) => {
                        const sayg = updateSayg({homeScore, awayScore});
                        if (autoSave) {
                            await saveDataAndGetId(sayg);
                        }
                        if (onScoreChange) {
                            await onScoreChange(homeScore, awayScore);
                        }
                    }}/>
            </div>) : null}
        </SaygContext.Provider>);
    } catch (e) {
        /* istanbul ignore next */
        onError(e);
    }
}
