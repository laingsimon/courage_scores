import {ScoreAsYouGo} from "./division_fixtures/sayg/ScoreAsYouGo";
import React, {useEffect, useState} from "react";
import {stateChanged} from "../Utilities";
import {ShareButton} from "./ShareButton";
import {useLocation} from "react-router-dom";
import {useApp} from "../AppContainer";

export function Practice() {
    const initialYourName = 'you';
    const { onError } = useApp();
    const [ startingScore, setStartingScore ] = useState(501);
    const [ numberOfLegs, setNumberOfLegs ] = useState(3);
    const [ homeScore, setHomeScore ] = useState(0);
    const [ awayScore, setAwayScore ] = useState(0);
    const [ data, setData ] = useState(null);
    const { account } = useApp();
    const [ yourName, setYourName ] = useState(initialYourName);
    const [ opponentName, setOpponentName ] = useState('');
    const [ dataError, setDataError ] = useState(null);
    const location = useLocation();

    useEffect(() => {
        try {
            const hash = location.hash;
            if (hash === '' || hash === '#') {
                return;
            }

            const shareData = deserialiseSharedData(hash.substring(1));
            if (!shareData) {
                return;
            }

            setStartingScore(shareData.startingScore);
            setNumberOfLegs(shareData.numberOfLegs);
            setHomeScore(shareData.homeScore);
            setAwayScore(shareData.awayScore);
            setData(shareData.data);
            setYourName(shareData.yourName);
            setOpponentName(shareData.opponentName);
        } catch (e) {
            onError(e);
        }
    },
    [ location, onError ]);

    useEffect(() => {
        if (account && yourName === initialYourName && account.givenName) {
            setYourName(account.givenName);
        }
    }, [ account, yourName ]);

    function deserialiseSharedData(base64) {
        let jsonData;
        try {
            jsonData = atob(base64);
        } catch (e) {
            setDataError(e.message);
            return null;
        }

        let shareData;
        try {
            shareData = JSON.parse(jsonData);
        } catch (e) {
            setDataError(e.message);
            return null;
        }

        if (shareData.startingScore && shareData.numberOfLegs && shareData.data) {
            return shareData;
        }

        setDataError('Invalid share data');
        return null;
    }

    function createSharableHash() {
        if (!data) {
            return '';
        }

        const shareData = {
            startingScore,
            numberOfLegs,
            homeScore,
            awayScore,
            data,
            yourName,
            opponentName
        };

        return '#' + btoa(JSON.stringify(shareData));
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
            <ShareButton text="Practice" getHash={createSharableHash} title="Practice" />
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