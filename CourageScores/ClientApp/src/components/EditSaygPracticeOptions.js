import {valueChanged} from "../helpers/events";
import {ShareButton} from "./ShareButton";
import React from "react";
import {useSayg} from "./division_fixtures/sayg/SaygLoadingContainer";

export function EditSaygPracticeOptions() {
    const { sayg, setSayg, saveDataAndGetId } = useSayg();

    function restart() {
        const newSayg = Object.assign({}, sayg);
        newSayg.legs = {};
        newSayg.homeScore = 0;
        newSayg.awayScore = 0;
        setSayg(newSayg);
    }

    return (<><div className="input-group my-3">
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
        <ShareButton text="Practice" getHash={saveDataAndGetId} title="Practice" buttonText="Save" />
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
        <button className="btn btn-primary" onClick={restart}>Restart...</button>
    </div></>);
}