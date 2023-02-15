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

    function renderWinner() {
        return (<div className="d-flex flex-column m-2 flex-grow-1">
            <div className="mb-5">
                <div className="text-center fw-bold text-secondary">180s</div>
                <div className="outline-dark outline-dashed min-width-200 min-height-100"></div>
            </div>
            <div className="text-center fw-bold text-primary">Venue winner</div>
            <div className="outline-dark m-2 min-width-150 min-height-50">
                {repeat(maxSideSize - 1).map(renderPlayerSplit)}
            </div>
            <div className="mt-5">
                <div className="text-center fw-bold text-secondary">Hi checks</div>
                <div className="outline-dark outline-dashed min-width-200 min-height-100"></div>
            </div>
        </div>);
    }

    function renderVersus(playerIndex) {
        return (<div key={playerIndex} className="my-5 border-dark border-1 border-solid border-bottom-0 opacity-100 text-center position-relative">
            <span className="position-absolute light-background left-10 px-1 top-negative-15 text-secondary">vs</span>
        </div>);
    }

    function renderPlayerSplit(playerIndex) {
        return (<div key={playerIndex} className="my-5 border-1 border-dashed border-secondary border-bottom-0 opacity-100 text-center position-relative">
            <span className="position-absolute light-background left-10 px-1 top-negative-15 text-secondary">and</span>
        </div>);
    }

    function renderRound(noOfMatches, byes, depth) {
        return (<div key={depth} className="d-flex flex-column m-2 flex-grow-1">
            <div className="text-center fw-bold">{getRoundName(noOfMatches + byes, depth)}</div>
            {repeat(noOfMatches).map(index => (<div key={index} className="outline-dark m-2 min-width-150 min-height-50">
                {repeat((maxSideSize * 2) - 1).map(playerIndex => {
                    if (playerIndex === (maxSideSize / 2) || maxSideSize === 1) {
                        return renderVersus(playerIndex);
                    }

                    return renderPlayerSplit(playerIndex);
                })}
            </div>))}
            {byes ? (<div className="outline-dark m-2 min-width-150 min-height-50 bg-light-warning outline-dashed">
                <span className="float-end px-2 small">Bye</span>
                {repeat(maxSideSize - 1).map(renderPlayerSplit)}
            </div>) : null}
        </div>);
    }

    function renderPrintModeRound(sideCount) {
        let noOfMatches = sideCount;
        let byes = 0;

        const rounds = [];

        for (let depth = 0; depth < 10; depth++) {
            byes = (noOfMatches + byes) % 2;
            noOfMatches = Math.floor((noOfMatches + byes) / 2);

            if (noOfMatches === 1) {
                noOfMatches+= byes;
                byes = 0;
            }

            if (noOfMatches + byes < 2) {
                rounds.push(renderWinner());
                break;
            }

            rounds.push(renderRound(noOfMatches, byes, depth));
        }

        return rounds;
    }

    let index = 0;

    return (<div className="d-screen-none">
        <div className="d-flex flex-row m-2 align-items-center justify-content-stretch">
            {renderPrintModeRound(sides.length)}
            <ul className="float-end list-group">{sides
                .sort(sortBy('name'))
                .map(s => (<li className="list-group-item outline-dark" key={s.id}>{++index} - {s.name}</li>))}</ul>
        </div>
    </div>);
}
