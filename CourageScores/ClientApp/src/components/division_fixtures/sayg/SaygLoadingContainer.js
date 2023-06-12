import React, {useEffect, useState} from "react";
import {useDependencies} from "../../../IocContainer";
import {useApp} from "../../../AppContainer";
import {Loading} from "../../common/Loading";
import {ErrorDisplay} from "../../common/ErrorDisplay";
import {ScoreAsYouGo} from "./ScoreAsYouGo";

import { createContext, useContext } from "react";
import {isEmpty} from "../../../helpers/collections";
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
                setSayg(defaultData);
                return;
            }

            const sayg = await saygApi.get(id);

            if (!sayg || !sayg.legs) {
                // TODO: fire an event for this error to be displayed in surrounding component
                setDataError('Data not found');
                return;
            }

            sayg.lastUpdated = sayg.updated;
            setSayg(sayg);
        } catch (e) {
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

    function updateSayg(newData) {
        const newSayg = Object.assign({}, sayg, newData);
        setSayg(newSayg);
        return newSayg;
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