import {valueChanged} from "../../helpers/events";
import React from "react";

export function EditMatchOptions({matchOptions, onMatchOptionsChanged, hideNumberOfPlayers}) {
    return (<div>
        {hideNumberOfPlayers ? null : (<div className="input-group my-3">
            <div className="input-group-prepend">
                <span className="input-group-text">No of players</span>
            </div>
            <input type="number" className="form-control" value={matchOptions.playerCount} name="playerCount"
                   onChange={valueChanged(matchOptions, onMatchOptionsChanged)}/>
        </div>)}
        <div className="input-group my-3">
            <div className="input-group-prepend">
                <span className="input-group-text">Starting score</span>
            </div>
            <input type="number" className="form-control" value={matchOptions.startingScore} name="startingScore"
                   onChange={valueChanged(matchOptions, onMatchOptionsChanged)}/>
        </div>
        <div className="input-group my-3">
            <div className="input-group-prepend">
                <span className="input-group-text">Number of legs</span>
            </div>
            <input type="number" className="form-control" value={matchOptions.numberOfLegs} name="numberOfLegs"
                   onChange={valueChanged(matchOptions, onMatchOptionsChanged)}/>
        </div>
    </div>)
}