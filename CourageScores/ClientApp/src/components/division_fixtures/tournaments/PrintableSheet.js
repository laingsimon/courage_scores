import {useTournament} from "./TournamentContainer";
import {repeat} from "../../../helpers/projection";
import {any, sortBy} from "../../../helpers/collections";
import {renderDate} from "../../../helpers/rendering";
import React, {useEffect, useState} from "react";
import {useApp} from "../../../AppContainer";

export function PrintableSheet({ printOnly }) {
    const { onError } = useApp();
    const { tournamentData } = useTournament();
    const layoutData = setRoundNames(tournamentData.round && any(tournamentData.round.matches)
        ? getPlayedLayoutData(tournamentData.sides, tournamentData.round, 1)
        : getUnplayedLayoutData(tournamentData.sides.length, 1));
    const [ wiggle, setWiggle ] = useState(!printOnly);

    useEffect(() => {
        if (!wiggle) {
            return;
        }

        setWiggle(false);
        setupWiggle();
    },
    // eslint-disable-next-line
    [ wiggle ]);

    function setupWiggle() {
        const wiggler = {
            handle: null,
            movements: getWiggleMovements(),
        };

        wiggler.handle = window.setInterval(() => {
            try {
                if (!any(wiggler.movements)) {
                    window.clearInterval(wiggler.handle);
                    wiggler.handle = null;
                    return;
                }

                const element = document.querySelector('div[datatype="rounds-and-players"]');
                if (!element) {
                    window.clearInterval(wiggler.handle);
                    wiggler.handle = null;
                    return;
                }

                const movement = wiggler.movements.shift();
                element.scrollLeft = movement.scrollLeft;
            } catch (e) {
                console.error(e);
                window.clearInterval(wiggler.handle);
                wiggler.handle = null;
            }
        }, 10);
    }

    function getWiggleMovements() {
        const element = document.querySelector('div[datatype="rounds-and-players"]');
        if (!element) {
            return [];
        }

        function movement(percentage) {
            return { scrollLeft: percentage * element.getBoundingClientRect().width };
        }

        function movements(lowerPercentage, upperPercentage, times) {
            const singleMovement = (upperPercentage - lowerPercentage) / times;
            return repeat(times + 1, index => movement(lowerPercentage + (index * singleMovement)));
        }

        return [
            movements(0.0, 0.05, 10),
            movements(0.05, 0.1, 10),
            movements(0.1, 0.2, 5),
            movements(0.2, 0.3, 5),
            movements(0.3, 0.35, 10),
            movements(0.35, 0.3, 10),
            movements(0.3, 0.2, 5),
            movements(0.2, 0.1, 5),
            movements(0.1, 0.05, 10),
            movements(0.05, 0.0, 10),
        ].flatMap(movements => movements);
    }

    function setRoundNames(layoutData) {
        const layoutDataCopy = layoutData.filter(_ => true);
        const newLayoutData = [];
        let unnamedRoundNumber = layoutDataCopy.length - 3;

        while (any(layoutDataCopy)) {
            const lastRound = layoutDataCopy.pop();
            let roundName = null;
            switch (newLayoutData.length) {
                case 0:
                    roundName = 'Final';
                    break;
                case 1:
                    roundName = 'Semi-Final';
                    break;
                case 2:
                    roundName = 'Quarter-Final';
                    break;
                default:
                    roundName = `Round ${unnamedRoundNumber--}`;
                    break;
            }

            lastRound.name = lastRound.name || roundName;
            newLayoutData.unshift(lastRound);
        }

        return newLayoutData;
    }

    function getPlayedLayoutData(sides, round, depth) {
        if (!round) {
            return [];
        }

        const winnersFromThisRound = [];
        const losersFromThis = [];

        const layoutDataForRound = {
            name: round.name,
            matches: round.matches.map(m => {
                let winner = null;
                if (m.scoreA > m.scoreB) {
                    winnersFromThisRound.push(m.sideA);
                    losersFromThis.push(m.sideB);
                    winner = 'sideA';
                } else if (m.scoreB > m.scoreA) {
                    winnersFromThisRound.push(m.sideB);
                    losersFromThis.push(m.sideA);
                    winner = 'sideB';
                }

                return {
                    sideA: { name: m.sideA.name },
                    sideB: { name: m.sideB.name },
                    scoreA: m.scoreA || '0',
                    scoreB: m.scoreB || '0',
                    bye: false,
                    winner: winner,
                };
            }),
        };

        const byesFromThisRound = sides
            .filter(side => !any(winnersFromThisRound, s => s.id === side.id) && !any(losersFromThis, s => s.id === side.id))
            .map(side => {
                return {
                    sideA: { name: side.name },
                    sideB: null,
                    scoreA: null,
                    scoreB: null,
                    bye: true,
                    winner: null,
                };
            });

        return [ layoutDataForRound ].concat(getPlayedLayoutData(winnersFromThisRound.concat(byesFromThisRound), round.nextRound, depth + 1));
    }

    function getUnplayedLayoutData(sideLength, depth) {
        if (sideLength <= 1) {
            return [];
        }

        const hasBye = sideLength % 2 !== 0;
        const layoutDataForRound = {
            name: null,
            matches: repeat(Math.floor(sideLength / 2), _ => {
                return {
                    sideA: { name: null },
                    sideB: { name: null },
                    scoreA: null,
                    scoreB: null,
                    bye: false,
                    winner: null,
                };
            }),
        };
        if (hasBye) {
            layoutDataForRound.matches.push({
                sideA: { name: null },
                sideB: { name: null },
                scoreA: null,
                scoreB: null,
                bye: true,
                winner: null,
            });
        }

        return [ layoutDataForRound ].concat(getUnplayedLayoutData(Math.floor(sideLength / 2) + (hasBye ? 1 : 0), depth + 1));
    }

    function render180s() {
        const oneEightyMap = {};
        tournamentData.oneEighties.forEach(player => {
            if (oneEightyMap[player.name]) {
                oneEightyMap[player.name]++;
            } else {
                oneEightyMap[player.name] = 1;
            }
        });

        return (<div data-accolades="180s" className="border-1 border-solid my-2 min-height-100 p-2 mb-5">
            <h5>180s</h5>
            {Object.keys(oneEightyMap).sort((a, b) => {
                if (oneEightyMap[a] > oneEightyMap[b]) {
                    return -1;
                }
                if (oneEightyMap[a] < oneEightyMap[b]) {
                    return 1;
                }

                return 0;
            }).map(name => <div key={name} className="p-1 no-wrap">{name} x {oneEightyMap[name]}</div>)}
        </div>);
    }

    function renderHiChecks() {
        return (<div data-accolades="hi-checks" className="border-1 border-solid my-2 min-height-100 p-2 mt-5">
            <h5>Hi-checks</h5>
            {tournamentData.over100Checkouts.map(player => <div key={player.name} className="p-1 no-wrap">{player.name} ({player.notes})</div>)}
        </div>);
    }

    function getWinner() {
        if (!any(layoutData)) {
            return null;
        }

        const final = layoutData[layoutData.length - 1].matches[0];
        if (final && final.winner) {
            return final[final.winner].name;
        }

        return null;
    }

    try {
        return (<div className={printOnly ? 'd-screen-none' : ''} datatype="printable-sheet">
            <div datatype="heading" className="border-1 border-solid border-secondary p-3 text-center">
                {tournamentData.type} at <strong>{tournamentData.address}</strong> on <strong>{renderDate(tournamentData.date)}</strong> - <strong>{tournamentData.notes}</strong>
            </div>
            <div datatype="rounds-and-players" className="d-flex flex-row align-items-center overflow-auto no-overflow-on-print">
                {layoutData.map((roundData, index) => (
                    <div key={index} datatype={`round-${index}`} className="d-flex flex-column p-3">
                        {index === layoutData.length - 1 ? render180s() : null}
                        <h5 datatype="round-name">{roundData.name}</h5>
                        {roundData.matches.map((matchData, index) => (<div key={index} datatype="match"
                                                                           className={`p-0 border-solid border-1 m-1 ${matchData.bye ? 'opacity-50 position-relative' : ''}`}>
                            {matchData.bye ? (<div className="position-absolute-bottom-right">Bye</div>) : null}
                            <div datatype="sideA"
                                 className={`d-flex flex-row justify-content-between p-2 min-width-150 ${matchData.winner === 'sideA' ? 'bg-winner fw-bold' : ''}`}>
                                <div className="no-wrap pe-3" datatype="sideAname">{matchData.sideA.name || (
                                    <span>&nbsp;</span>)}</div>
                                <div datatype="scoreA">{matchData.scoreA || ''}</div>
                            </div>
                            {matchData.bye ? null : (<div className="text-center dotted-line-through">
                                <span className="px-3 bg-white position-relative">vs</span>
                            </div>)}
                            {matchData.bye ? null : (<div datatype="sideB"
                                 className={`d-flex flex-row justify-content-between p-2 min-width-150 ${matchData.winner === 'sideB' ? 'bg-winner fw-bold' : ''}`}>
                                <div className="no-wrap pe-3" datatype="sideBname">{matchData.sideB.name || (
                                    <span>&nbsp;</span>)}</div>
                                <div datatype="scoreB">{matchData.scoreB || ''}</div>
                            </div>)}
                        </div>))}
                        {index === layoutData.length - 1 ? renderHiChecks() : null}
                    </div>))}
                <div>
                    <h5>Venue winner</h5>
                    <div datatype="winner"
                         className="p-0 border-solid border-1 m-1 bg-winner fw-bold">
                        <div className="d-flex flex-row justify-content-between p-2 min-width-150">
                            <div className="no-wrap pe-3">
                                <span>{getWinner() || <>&nbsp;</>}</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div datatype="playing" className="ms-5">
                    <h4>Playing</h4>
                    <ul className="list-group">
                        {tournamentData.sides.sort(sortBy('name')).map((side, index) => <li key={side.id}
                                                                                            className={`list-group-item no-wrap${side.noShow ? ' text-decoration-line-through' : ''}`}>
                            {index + 1} - {side.name}
                        </li>)}
                    </ul>
                </div>
            </div>
        </div>);
    } catch (e) {
        onError(e);
    }
}