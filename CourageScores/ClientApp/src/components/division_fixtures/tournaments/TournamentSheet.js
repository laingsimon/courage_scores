import {max, sortBy} from "../../../Utilities";
import React from "react";

export function TournamentSheet({ sides }) {
    const maxSideSize = max(sides, current => current.players ? current.players.length : 0);

    function repeat(count) {
        const items = [];

        for (let index = 0; index < count; index++) {
            items.push(index);
        }

        return items;
    }

    function getRoundName(matches, depth) {
        if (matches === 1) {
            return 'Final';
        }
        if (matches === 2) {
            return 'Semi-Final';
        }
        if (matches === 3 || matches === 4) {
            return 'Quarter-Final';
        }

        return `Round: ${depth + 1}`;
    }

    function renderWinner() {
        return (<div key="winner" className="d-flex flex-column m-2 flex-grow-1">
            <div className="mb-5">
                <div className="text-center fw-bold text-secondary">180s</div>
                <div className="outline-dark outline-dashed min-width-200 min-height-100"></div>
            </div>
            <div className="text-center fw-bold text-primary">Venue winner{maxSideSize > 1 ? 's' : ''}</div>
            <div className="outline-dark m-2 min-width-150 min-height-50">
                {repeat(maxSideSize - 1).map(playerIndex => renderPlayerSplit(playerIndex, true))}
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

    function renderPlayerSplit(playerIndex, excludeScore) {
        return (<div key={playerIndex} className={`my-5 border-1 border-dashed border-secondary border-bottom-0 opacity-100 text-center position-relative${excludeScore ? '' : ' margin-right-50'}`}>
            <span className="position-absolute light-background left-10 px-1 top-negative-15 text-secondary">and</span>
        </div>);
    }

    function renderRound(noOfMatches, byes, depth) {
        return (<div key={depth} className="d-flex flex-column m-2 flex-grow-1">
            <div className="text-center fw-bold">{getRoundName(noOfMatches + byes, depth)}</div>
            {repeat(noOfMatches).map(index => (<div key={index} className="outline-dark m-2 min-width-150 min-height-50 position-relative">
                {repeat((maxSideSize * 2) - 1).map(playerIndex => {
                    if (playerIndex === (maxSideSize / 2) || maxSideSize === 1) {
                        return renderVersus(playerIndex);
                    }

                    return renderPlayerSplit(playerIndex);
                })}
                <div className="position-absolute right-0 top-0 bottom-0 width-50 no-border border-dashed border-primary border-left-1"></div>
            </div>))}
            {byes ? (<div className="outline-dark m-2 min-width-150 min-height-50 bg-light-warning outline-dashed opacity-50">
                <span className="float-end px-2 small">Bye</span>
                {repeat(maxSideSize - 1).map(playerIndex => renderPlayerSplit(playerIndex, true))}
            </div>) : null}
        </div>);
    }

    function renderPrintModeRound(sideCount) {
        let matches = sideCount;

        const rounds = [];

        for (let depth = 0; depth < 10; depth++) {
            if (matches === 1) {
                rounds.push(renderWinner());
                break;
            }

            let iterationByes = matches % 2;
            let iterationMatches = Math.floor(matches / 2);

            rounds.push(renderRound(iterationMatches, iterationByes, depth));
            matches = iterationMatches + iterationByes;
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
