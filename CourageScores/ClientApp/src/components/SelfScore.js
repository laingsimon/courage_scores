import {ScoreAsYouGo} from "./division_fixtures/sayg/ScoreAsYouGo";
import React, {useState} from "react";
import {stateChanged} from "../Utilities";

export function SelfScore() {
    const [ startingScore, setStartingScore ] = useState('501');
    const [ numberOfLegs, setNumberOfLegs ] = useState('3');
    const [ homeScore, setHomeScore ] = useState(0);
    const [ data, setData ] = useState(null);

    function restart() {
        setData({
            legs: {}
        });
        setHomeScore(0);
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
            <button className="btn btn-primary" onClick={restart}>{homeScore > 0 ? 'Restart...' : 'Start...'}</button>
        </div>
        {data != null ? (<ScoreAsYouGo
            startingScore={Number.parseInt(startingScore)}
            numberOfLegs={Number.parseInt(numberOfLegs)}
            onHiCheck={() => {}}
            on180={() => {}}
            onChange={(newData) => setData(newData)}
            homeScore={homeScore}
            awayScore={0}
            away="No-one"
            home="You"
            data={data}
            singlePlayer={true}
            onLegComplete={(homeScore, _) => {
                setHomeScore(homeScore);
            }} />) : null}
    </div>)
}