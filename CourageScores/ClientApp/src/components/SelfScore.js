import {ScoreAsYouGo} from "./division_fixtures/sayg/ScoreAsYouGo";
import React, {useState} from "react";
import {stateChanged} from "../Utilities";

export function SelfScore() {
    const [ startingScore, setStartingScore ] = useState('501');
    const [ numberOfLegs, setNumberOfLegs ] = useState('3');
    const [ homeScore, setHomeScore ] = useState(0);
    const [ awayScore, setAwayScore ] = useState(0);
    const [ data, setData ] = useState(null);
    const [ yourName, setYourName ] = useState('you');
    const [ opponentName, setOpponentName ] = useState('');

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
        {data != null ? (<ScoreAsYouGo
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