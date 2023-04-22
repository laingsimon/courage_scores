import {ScoreAsYouGo} from "./division_fixtures/sayg/ScoreAsYouGo";
import React, {useEffect, useState} from "react";
import {createTemporaryId, stateChanged} from "../Utilities";
import {ShareButton} from "./ShareButton";
import {useLocation} from "react-router-dom";
import {useApp} from "../AppContainer";
import {useDependencies} from "../IocContainer";
import {ErrorDisplay} from "./common/ErrorDisplay";

export function Practice() {
    const initialYourName = 'you';
    const { onError, account } = useApp();
    const { saygApi } = useDependencies();
    const location = useLocation();
    const [ startingScore, setStartingScore ] = useState(501);
    const [ numberOfLegs, setNumberOfLegs ] = useState(3);
    const [ homeScore, setHomeScore ] = useState(0);
    const [ awayScore, setAwayScore ] = useState(0);
    const [ sayg, setSayg ] = useState(null);
    const [ data, setData ] = useState(null);
    const [ yourName, setYourName ] = useState(initialYourName);
    const [ opponentName, setOpponentName ] = useState('');
    const [ dataError, setDataError ] = useState(null);
    const [ saveError, setSaveError ] = useState(null);
    const [ id, setId ] = useState(null);

    useEffect(() => {
        try {
            const hash = location.hash;
            if (hash === '' || hash === '#') {
                return;
            }

            if (id) {
                // loading data already
                return;
            }

            const dataId = hash.substring(1);
            setId(dataId);
            // noinspection JSIgnoredPromiseFromCall
            loadData(dataId);
        } catch (e) {
            onError(e);
        }
    },
    // eslint-disable-next-line
    [ location, onError ]);

    useEffect(() => {
        if (account && yourName === initialYourName && account.givenName) {
            setYourName(account.givenName);
        }
    }, [ account, yourName ]);

    async function loadData(id) {
        try {
            const sayg = await saygApi.get(id);

            if (!sayg) {
                return;
            }

            setSayg(sayg);
            setStartingScore(sayg.startingScore || startingScore);
            setNumberOfLegs(sayg.numberOfLegs || numberOfLegs);
            setHomeScore(sayg.homeScore || homeScore);
            setAwayScore(sayg.awayScore || awayScore);
            setData(sayg.data);
            setYourName(sayg.yourName || yourName);
            setOpponentName(sayg.opponentName || opponentName);
        } catch (e) {
            setDataError(e.message);
        }
    }

    async function saveDataAndGetId() {
        if (!data) {
            return '';
        }

        // TODO: update to store within a RecordedScoreAsYouGoDto/Model
        const shareData = {
            ...data,
            startingScore,
            numberOfLegs,
            homeScore,
            awayScore,
            yourName,
            opponentName,
            id: id || createTemporaryId(),
        };

        try {
            const response = await saygApi.upsert(shareData);
            if (response.success) {
                setId(response.result.id);
                return '#' + response.result.id;
            }
            setSaveError(response);
        } catch (e) {
            onError(e);
        }

        return null;
    }

    function restart() {
        setData({
            legs: {}
        });
        setHomeScore(0);
        setAwayScore(0);
    }

    function onOtherNameChange(event) {
        setOpponentName(event.target.value);
        setData(null);
        setHomeScore(0);
        setAwayScore(0);
    }

    return (<div className="p-3 light-background">
        <div className="input-group my-3">
            <div className="input-group-prepend">
                <span className="input-group-text">Number of legs</span>
            </div>
            <input type="number" className="form-control" value={numberOfLegs} onChange={stateChanged(setNumberOfLegs)} />
            <div className="input-group-prepend">
                <span className="input-group-text">Starting score</span>
            </div>
            <input type="number" className="form-control" value={startingScore} onChange={stateChanged(setStartingScore)} />
            <ShareButton text="Practice" getHash={saveDataAndGetId} title="Practice" />
        </div>
        <div className="input-group my-3">
            <div className="input-group-prepend">
                <span className="input-group-text">Your name</span>
            </div>
            <input className="form-control" value={yourName} onChange={stateChanged(setYourName)} />
            <div className="input-group-prepend">
                <span className="input-group-text">Opponent</span>
            </div>
            <input placeholder="Optional" className="form-control" value={opponentName} onChange={onOtherNameChange} />
            <button className="btn btn-primary" onClick={restart}>{homeScore > 0 ? 'Restart...' : 'Start...'}</button>
        </div>
        {dataError ? (<div className="p-3 border-danger border-1 border" data-name="data-error">
            <h3>⚠ Error with shared data</h3>
            <p>{dataError}</p>
            <button className="btn btn-primary" onClick={() => setDataError(null)}>Clear</button>
        </div>) : null}
        {saveError ? (<ErrorDisplay {...saveError} onClose={() => setSaveError(null)} title="Could not save data"/>) : null}
        {dataError == null && data != null ? (<ScoreAsYouGo
            startingScore={Number.parseInt(startingScore)}
            numberOfLegs={Number.parseInt(numberOfLegs)}
            onHiCheck={() => {}}
            on180={() => {}}
            onChange={(newData) => setData(newData)}
            homeScore={homeScore}
            awayScore={awayScore}
            away={opponentName}
            home={yourName}
            data={data}
            singlePlayer={opponentName === ''}
            onLegComplete={(homeScore, awayScore) => {
                setHomeScore(homeScore);
                setAwayScore(awayScore);
            }} />) : null}
    </div>)
}