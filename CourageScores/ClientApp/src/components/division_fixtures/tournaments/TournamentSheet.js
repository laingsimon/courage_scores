import {sortBy} from "../../../Utilities";
import React from "react";

export function TournamentSheet({ sides }) {
    const maxSideSize = sides.reduce((prev, current) => {
        if (current.players.length > prev) {
            return current.players.length;
        }

        return prev;
    }, 0);

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
                    <div className="mb-5">
                        <div className="text-center fw-bold text-secondary">180s</div>
                        <div className="outline-dark outline-dashed min-width-200 min-height-100"></div>
                    </div>
                    <div className="text-center fw-bold text-primary">Venue winner</div>
                    <div className="outline-dark m-2 min-width-150 min-height-50"></div>
                    <div className="mt-5">
                        <div className="text-center fw-bold text-secondary">Hi checks</div>
                        <div className="outline-dark outline-dashed min-width-200 min-height-100"></div>
                    </div>
                </div>
            </div>);
        }

        return (<div className="d-flex flex-row m-2 align-items-center">
            <div className="d-flex flex-column m-2">
                <div className="text-center fw-bold">{getRoundName(noOfMatches + byes, depth)}</div>
                {repeat(noOfMatches).map(index => (<div key={index} className="outline-dark m-2 min-width-150 min-height-50">
                    {repeat(maxSideSize - 1).map(playerIndex => (<hr key={playerIndex} className="my-5 border-dark border-bottom-0 opacity-100" />))}
                </div>))}
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
                .map(s => (<li className="list-group-item outline-dark" key={s.id}>{++index} - {s.name}</li>))}</ul>
        </div>
    </div>);
}