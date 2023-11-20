import React, {createContext, useContext, useEffect, useState} from "react";
import {useDependencies} from "../../../IocContainer";
import {useApp} from "../../../AppContainer";
import {Loading} from "../../common/Loading";
import {ErrorDisplay} from "../../common/ErrorDisplay";
import {ScoreAsYouGo} from "./ScoreAsYouGo";
import {isEmpty} from "../../../helpers/collections";
import {LiveContainer} from "../LiveContainer";

const SaygContext = createContext({});

export function useSayg() {
    return useContext(SaygContext);
}

export function SaygLoadingContainer({ children, id, defaultData, autoSave, on180, onHiCheck, onScoreChange, onSaved,
                                         onLoadError, matchStatisticsOnly, lastLegDisplayOptions, liveOptions }) {
    const [sayg, setSayg] = useState(defaultData);
    const [saveError, setSaveError] = useState(null);
    const [loading, setLoading] = useState(false);
    const {saygApi, webSocket} = useDependencies();
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
        const newSayg = await updateSayg(newData);

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

    async function updateSayg(newData) {
        const newSayg = Object.assign({}, sayg, newData);
        setSayg(newSayg);
        if (liveOptions.publish) {
            await webSocket.publish(id, newSayg);
        }
        return newSayg;
    }

    if (loading) {
        return (<Loading/>);
    }

    const saygProps = {
        sayg,
        setSayg: updateSayg,
        saveDataAndGetId,
        matchStatisticsOnly,
        lastLegDisplayOptions,
    };

    try {
        return (<LiveContainer liveOptions={liveOptions} onDataUpdate={setSayg}>
            <SaygContext.Provider value={saygProps}>
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
                            const sayg = await updateSayg({homeScore, awayScore});
                            if (autoSave) {
                                await saveDataAndGetId(sayg);
                            }
                            if (onScoreChange) {
                                await onScoreChange(homeScore, awayScore);
                            }
                        }}/>
                </div>) : null}
            </SaygContext.Provider>
        </LiveContainer>);
    } catch (e) {
        /* istanbul ignore next */
        onError(e);
    }
}
