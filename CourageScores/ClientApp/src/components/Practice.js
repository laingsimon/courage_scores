import {ScoreAsYouGo} from "./division_fixtures/sayg/ScoreAsYouGo";
import React, {useEffect, useState} from "react";
import {any, createTemporaryId, valueChanged} from "../Utilities";
import {ShareButton} from "./ShareButton";
import {useLocation, useNavigate} from "react-router-dom";
import {useApp} from "../AppContainer";
import {useDependencies} from "../IocContainer";
import {ErrorDisplay} from "./common/ErrorDisplay";
import {Loading} from "./common/Loading";

export function Practice() {
    const initialYourName = 'you';
    const { onError, account } = useApp();
    const { saygApi } = useDependencies();
    const location = useLocation();
    const navigate = useNavigate();
    const [ sayg, setSayg ] = useState({
        yourName: initialYourName,
        opponentName: null,
        homeScore: 0,
        awayScore: 0,
        numberOfLegs: 3,
        startingScore: 501,
        legs: {},
        id: createTemporaryId(),
        loaded: false,
    });
    const [ dataError, setDataError ] = useState(null);
    const [ saveError, setSaveError ] = useState(null);
    const [ loading, setLoading ] = useState(false);
    const hasHash = location.hash && location.hash !== '#';

    useEffect(() => {
        try {
            if (!hasHash || dataError || loading) {
                return;
            }

            if (sayg && sayg.loaded) {
                // data already loaded
                return;
            }

            setLoading(true);
            // noinspection JSIgnoredPromiseFromCall
            loadData(location.hash.substring(1));
        } catch (e) {
            onError(e);
        }
    },
    // eslint-disable-next-line
    [ location, loading, onError ]);

    useEffect(() => {
        if (account && sayg.yourName === initialYourName && account.givenName && !sayg.loaded) {
            const newSayg = Object.assign({}, sayg);
            newSayg.yourName = account.givenName;
            setSayg(newSayg);
        }
    }, [ account, sayg ]);

    async function loadData(id) {
        try {
            const sayg = await saygApi.get(id);

            if (!sayg || !sayg.legs) {
                navigate('/practice');
                setDataError('Data not found');
                return;
            }

            sayg.loaded = true;
            setSayg(sayg);
        } catch (e) {
            setDataError(e.message);
        } finally {
            setLoading(false);
        }
    }

    async function saveDataAndGetId() {
        if (!sayg) {
            return '';
        }

        try {
            const response = await saygApi.upsert(sayg, sayg.updated);
            if (response.success) {
                setSayg(response.result);
                navigate(`/practice#${response.result.id}`);
                return '#' + response.result.id;
            }
            setSaveError(response);
        } catch (e) {
            onError(e);
        }

        return null;
    }

    function restart() {
        const newSayg = Object.assign({}, sayg);
        newSayg.legs = {};
        newSayg.homeScore = 0;
        newSayg.awayScore = 0;
        setSayg(newSayg);

        setSayg(newSayg);
    }

    function updateSayg(newData) {
        const newSayg = Object.assign({}, sayg, newData);
        setSayg(newSayg);
    }

    const canShow = sayg.loaded || !hasHash || dataError;

    if (!canShow) {
        return (<Loading />);
    }

    try {
        return (<div className="p-3 light-background">
            <div className="input-group my-3">
                <div className="input-group-prepend">
                    <span className="input-group-text">Number of legs</span>
                </div>
                <input type="number" className="form-control" name="numberOfLegs" value={sayg.numberOfLegs}
                       onChange={valueChanged(sayg, setSayg)}/>
                <div className="input-group-prepend">
                    <span className="input-group-text">Starting score</span>
                </div>
                <input type="number" className="form-control" name="startingScore" value={sayg.startingScore}
                       onChange={valueChanged(sayg, setSayg)}/>
                <ShareButton text="Practice" getHash={saveDataAndGetId} title="Practice"/>
            </div>
            <div className="input-group my-3">
                <div className="input-group-prepend">
                    <span className="input-group-text">Your name</span>
                </div>
                <input className="form-control" value={sayg.yourName} name="yourName"
                       onChange={valueChanged(sayg, setSayg)}/>
                <div className="input-group-prepend">
                    <span className="input-group-text">Opponent</span>
                </div>
                <input placeholder="Optional" className="form-control" name="opponentName"
                       value={sayg.opponentName || ''} onChange={valueChanged(sayg, setSayg)}/>
                <button className="btn btn-primary"
                        onClick={restart}>{any(Object.keys(sayg.legs)) ? 'Restart...' : 'Start...'}</button>
            </div>
            {dataError ? (<div className="p-3 border-danger border-1 border" data-name="data-error">
                <h3>⚠ Error with shared data</h3>
                <p>{dataError}</p>
                <button className="btn btn-primary" onClick={() => setDataError(null)}>Clear</button>
            </div>) : null}
            {saveError ? (
                <ErrorDisplay {...saveError} onClose={() => setSaveError(null)} title="Could not save data"/>) : null}
            {dataError == null ? (<ScoreAsYouGo
                startingScore={Number.parseInt(sayg.startingScore)}
                numberOfLegs={Number.parseInt(sayg.numberOfLegs)}
                onHiCheck={() => {
                }}
                on180={() => {
                }}
                onChange={updateSayg}
                homeScore={sayg.homeScore}
                awayScore={sayg.awayScore}
                away={sayg.opponentName}
                home={sayg.yourName}
                data={sayg}
                singlePlayer={!sayg.opponentName}
                onLegComplete={(homeScore, awayScore) => {
                    updateSayg({homeScore, awayScore});
                }}/>) : null}
        </div>);
    } catch (e) {
        /* istanbul ignore next */
        onError(e);
    }
}