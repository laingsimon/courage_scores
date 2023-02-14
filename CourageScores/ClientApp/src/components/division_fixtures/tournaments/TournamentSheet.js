import {sortBy} from "../../../Utilities";
import React from "react";

export function TournamentSheet({ sides }) {
    function repeat(count) {
        const items = [];

        for (let index = 0; index < count; index++) {
            items.push(index);
        }

        return items;
    }

    function getRoundName(sides, depth) {
        if (sides === 2) {
            return 'Final';
        }
        if (sides === 4) {
            return 'Semi-Final';
        }
        if (sides === 8) {
            return 'Quarter-Final';
        }

        return `Round: ${depth + 1}`;
    }

    function renderPrintModeRound(sideCount, depth) {
        let noOfMatches = Math.floor(sideCount / 2);
        let byes = sideCount % 2;

        if (noOfMatches === 1) {
            noOfMatches+= byes;
            byes = 0;
        }

        if (noOfMatches + byes < 2) {
            return (<div className="d-flex flex-row m-2 align-items-center">
                <div className="d-flex flex-column m-2">
                    <div className="text-center fw-bold">Venue winner</div>
                    <div className="outline-dark m-2 min-width-150 min-height-50"></div>
                </div>
            </div>);
        }

        return (<div className="d-flex flex-row m-2 align-items-center">
            <div className="d-flex flex-column m-2">
                <div className="text-center fw-bold">{getRoundName(noOfMatches + byes, depth)}</div>
                {repeat(noOfMatches).map(index => (<div key={index} className="outline-dark m-2 min-width-150 min-height-50"><hr /></div>))}
                {byes ? (<div className="outline-dark m-2 min-width-150 min-height-50 bg-light-warning outline-dashed">
                    <span className="float-end px-2 small">Bye</span>
                </div>) : null}
            </div>
            {renderPrintModeRound(noOfMatches + byes, depth + 1)}
        </div>);
    }

    let index = 0;

    return (<div className="d-screen-none">
        <div className="d-flex flex-row m-2 align-items-center">
            {renderPrintModeRound(sides.length, 0)}
            <ul className="float-end list-group">{sides
                .sort(sortBy('name'))
                .map(s => (<li className="list-group-item my-2 outline-dark py-2" key={s.id}>{++index} - {s.name}</li>))}</ul>
        </div>
    </div>);
}