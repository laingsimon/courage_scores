import React, {useEffect, useState} from "react";
import {useDependencies} from "../../../IocContainer";
import {useApp} from "../../../AppContainer";
import {Loading} from "../../common/Loading";
import {ErrorDisplay} from "../../common/ErrorDisplay";
import {ScoreAsYouGo} from "./ScoreAsYouGo";

import { createContext, useContext } from "react";
const SaygContext = createContext({});

export function useSayg() {
    return useContext(SaygContext);
}

export function SaygLoadingContainer({ children, id, defaultData, autoSave, on180, onHiCheck, onScoreChange, onSaved }) {
    const [ sayg, setSayg ] = useState(defaultData);
    const [ dataError, setDataError ] = useState(null);
    const [ saveError, setSaveError ] = useState(null);
    const [ loading, setLoading ] = useState(false);
    const { saygApi } = useDependencies();
    const { onError } = useApp();

    useEffect(() => {
        if (dataError || loading) {
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
                defaultData.loaded = true;
                setSayg(defaultData);
                return;
            }

            const sayg = await saygApi.get(id);

            if (!sayg || !sayg.legs) {
                setDataError('Data not found');
                return;
            }

            sayg.loaded = true;
            sayg.lastUpdated = sayg.updated;
            setSayg(sayg);
        } catch (e) {
            setDataError(e.message);
        } finally {
            setLoading(false);
        }
    }

    async function saveDataAndGetId() {
        try {
            const response = await saygApi.upsert(sayg);
            if (response.success) {
                response.result.loaded = true;
                response.result.lastUpdated = response.result.updated;
                setSayg(response.result);

                if (onSaved) {
                    await onSaved(response.result);
                }

                return response.result.id;
            } else {
                setSaveError(response);
            }
        } catch (e) {
            onError(e);
        }

        return null;
    }

    function updateSayg(newData) {
        const newSayg = Object.assign({}, sayg, newData);
        setSayg(newSayg);
    }

    if (loading) {
        return (<Loading />);
    }

    const saygProps = {
        sayg,
        setSayg,
        saveDataAndGetId,
    };

    try {
        return (<SaygContext.Provider value={saygProps}>
            {dataError ? (<div className="p-3 border-danger border-1 border" data-name="data-error">
                <h3>⚠ Error with shared data</h3>
                <p>{dataError}</p>
                <button className="btn btn-primary" onClick={() => setDataError(null)}>Clear</button>
            </div>) : null}
            {saveError ? (
                <ErrorDisplay {...saveError} onClose={() => setSaveError(null)} title="Could not save data"/>) : null}
            {dataError == null && sayg ? (<div className="p-3 light-background">
                {children}
                <ScoreAsYouGo
                    startingScore={Number.parseInt(sayg.startingScore)}
                    numberOfLegs={Number.parseInt(sayg.numberOfLegs)}
                    onHiCheck={onHiCheck}
                    on180={on180}
                    onChange={updateSayg}
                    homeScore={sayg.homeScore}
                    awayScore={sayg.awayScore}
                    away={sayg.opponentName}
                    home={sayg.yourName}
                    data={sayg}
                    singlePlayer={!sayg.opponentName}
                    onLegComplete={async (homeScore, awayScore) => {
                        updateSayg({homeScore, awayScore});
                        if (autoSave) {
                            await saveDataAndGetId();
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