import {useTournament} from "./TournamentContainer";
import {repeat} from "../../../helpers/projection";
import {any, count, sortBy} from "../../../helpers/collections";
import {renderDate} from "../../../helpers/rendering";
import React, {useEffect, useState} from "react";
import {useApp} from "../../../AppContainer";
import {EmbedAwareLink} from "../../common/EmbedAwareLink";
import {ShareButton} from "../../common/ShareButton";
import {useBranding} from "../../../BrandingContainer";
import {RefreshControl} from "../RefreshControl";
import {ITournamentSideDto} from "../../../interfaces/models/dtos/Game/ITournamentSideDto";
import {ITournamentPlayerDto} from "../../../interfaces/models/dtos/Game/ITournamentPlayerDto";
import {ITournamentRoundDto} from "../../../interfaces/models/dtos/Game/ITournamentRoundDto";
import {ITournamentMatchDto} from "../../../interfaces/models/dtos/Game/ITournamentMatchDto";
import {IGameMatchOptionDto} from "../../../interfaces/models/dtos/Game/IGameMatchOptionDto";
import {ITeamPlayerDto} from "../../../interfaces/models/dtos/Team/ITeamPlayerDto";
import {
    getUnplayedLayoutData,
    ILayoutDataForMatch,
    ILayoutDataForRound,
    setRoundNames
} from "../../../helpers/tournaments";

export interface IPrintableSheetProps {
    printOnly: boolean;
}

interface IMovement {
    scrollLeft: number;
}

interface IWiggler {
    handle?: number;
    movements: IMovement[];
}

export function PrintableSheet({printOnly}: IPrintableSheetProps) {
    const {name} = useBranding();
    const {onError, teams, divisions} = useApp();
    const {tournamentData, season, division, matchOptionDefaults} = useTournament();
    const layoutData: ILayoutDataForRound[] = setRoundNames(tournamentData.round && any(tournamentData.round.matches)
        ? getPlayedLayoutData(tournamentData.sides, tournamentData.round, 1)
        : getUnplayedLayoutData(tournamentData.sides.length, 1));
    const [wiggle, setWiggle] = useState<boolean>(!printOnly);
    const winner = getWinner();

    useEffect(() => {
            if (!wiggle) {
                return;
            }

            setWiggle(false);
            setupWiggle();
        },
        // eslint-disable-next-line
        [wiggle]);

    function setupWiggle() {
        const wiggler: IWiggler = {
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
                /* istanbul ignore next */
                console.error(e);
                window.clearInterval(wiggler.handle);
                wiggler.handle = null;
            }
        }, 10);
    }

    function getWiggleMovements(): IMovement[] {
        const element = document.querySelector('div[datatype="rounds-and-players"]');
        if (!element) {
            /* istanbul ignore next */
            return [];
        }

        function movement(percentage: number): IMovement {
            return {scrollLeft: percentage * element.getBoundingClientRect().width};
        }

        function movements(lowerPercentage: number, upperPercentage: number, times: number): IMovement[] {
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
        ].flatMap((movements: IMovement[]) => movements);
    }

    function getLinkToSide(side: ITournamentSideDto) {
        if (side && side.teamId && division) {
            const team = teams[side.teamId];

            return (<EmbedAwareLink
                to={`/division/${division.name}/team:${team ? team.name : side.teamId}/${season.name}`}>{side.name}</EmbedAwareLink>);
        }

        const teamAndDivision = side && count(side.players || []) === 1
            ? findTeamAndDivisionForPlayer(side.players[0])
            : null;
        if (side && teamAndDivision && teamAndDivision.division) {
            return (<EmbedAwareLink
                to={`/division/${teamAndDivision.division.name}/player:${side.players[0].name}@${teamAndDivision.team.name}/${season.name}`}>{side.name}</EmbedAwareLink>);
        }

        return (<span>{(side || {}).name || (<>&nbsp;</>)}</span>);
    }

    function findTeamAndDivisionForPlayer(player: ITournamentPlayerDto) {
        const teamAndDivisionMapping = teams.map(t => {
            const teamSeason = t.seasons.filter(ts => ts.seasonId === season.id)[0];
            if (!teamSeason) {
                return null;
            }

            const hasPlayer = any(teamSeason.players, (p: ITeamPlayerDto) => p.id === player.id);
            return hasPlayer ? {team: t, divisionId: teamSeason.divisionId} : null;
        }).filter(a => a !== null)[0];

        if (!teamAndDivisionMapping) {
            return null;
        }

        if (teamAndDivisionMapping.divisionId) {
            const teamDivision = divisions.filter(d => d.id === teamAndDivisionMapping.divisionId)[0];
            return {
                team: teamAndDivisionMapping.team,
                division: teamDivision || division,
            };
        }

        return {
            team: teamAndDivisionMapping.team,
            division: division,
        };
    }

    function getPlayedLayoutData(sides: ITournamentSideDto[], round: ITournamentRoundDto, depth: number): ILayoutDataForRound[] {
        if (!round) {
            return [];
        }

        const winnersFromThisRound: ITournamentSideDto[] = [];
        const playedInThisRound: ITournamentSideDto[] = [];

        const layoutDataForRound: ILayoutDataForRound = {
            name: round.name,
            matches: round.matches.map((m: ITournamentMatchDto, index: number): ILayoutDataForMatch => {
                let winner = null;
                playedInThisRound.push(m.sideA);
                playedInThisRound.push(m.sideB);
                const matchOptions: IGameMatchOptionDto = round.matchOptions[index] || matchOptionDefaults;
                const numberOfLegs: number = matchOptions.numberOfLegs;

                if (m.scoreA > (numberOfLegs / 2.0)) {
                    winnersFromThisRound.push(m.sideA);
                    winner = 'sideA';
                } else if (m.scoreB > (numberOfLegs / 2.0)) {
                    winnersFromThisRound.push(m.sideB);
                    winner = 'sideB';
                }

                return {
                    sideA: {id: m.sideA.id, name: m.sideA.name, link: getLinkToSide(m.sideA)},
                    sideB: {id: m.sideB.id, name: m.sideB.name, link: getLinkToSide(m.sideB)},
                    scoreA: (m.scoreA ? m.scoreA.toString() : null) || '0',
                    scoreB: (m.scoreB ? m.scoreB.toString() : null) || '0',
                    bye: false,
                    winner: winner,
                    saygId: m.saygId,
                };
            }),
        };

        const byesFromThisRound: ILayoutDataForMatch[] = sides
            .filter((side: ITournamentSideDto) => !side.noShow)
            .filter((side: ITournamentSideDto) => !any(playedInThisRound, (s: ITournamentSideDto) => s.id === side.id))
            .map((side: ITournamentSideDto): ILayoutDataForMatch => {
                return {
                    sideA: {
                        id: side.id,
                        name: side.name,
                        link: getLinkToSide(side),
                    },
                    sideB: null,
                    scoreA: null,
                    scoreB: null,
                    bye: true,
                    winner: null,
                    saygId: null,
                };
            });

        layoutDataForRound.matches = layoutDataForRound.matches.concat(byesFromThisRound);

        if (!any(winnersFromThisRound)) {
            // partially played tournament... project the remaining rounds as unplayed...
            return [layoutDataForRound].concat(getUnplayedLayoutData(Math.ceil(playedInThisRound.length / 2), depth + 1));
        }

        return [layoutDataForRound].concat(getPlayedLayoutData(winnersFromThisRound.concat(byesFromThisRound.map((b: ILayoutDataForMatch) => b.sideA)), round.nextRound, depth + 1));
    }

    function render180s() {
        const oneEightyMap = {};
        const playerLookup = {};

        tournamentData.oneEighties.forEach(player => {
            if (oneEightyMap[player.id]) {
                oneEightyMap[player.id]++;
            } else {
                oneEightyMap[player.id] = 1;
            }

            if (!playerLookup[player.id]) {
                playerLookup[player.id] = player;
            }
        });

        return (<div data-accolades="180s" className="border-1 border-solid my-2 min-height-100 p-2 mb-5">
            <h5>180s</h5>
            {Object.keys(oneEightyMap).sort((aId, bId) => {
                if (oneEightyMap[aId] > oneEightyMap[bId]) {
                    return -1;
                }
                if (oneEightyMap[aId] < oneEightyMap[bId]) {
                    return 1;
                }

                return 0;
            }).map((id, index) => {
                const player = playerLookup[id];
                const teamAndDivision = findTeamAndDivisionForPlayer(player);

                if (teamAndDivision && teamAndDivision.division) {
                    return (<div key={index} className="p-1 no-wrap">
                        <EmbedAwareLink to={`/division/${teamAndDivision.division.name}/player:${player.name}@${teamAndDivision.team.name}/${season.name}`}>
                            {player.name}
                        </EmbedAwareLink> x {oneEightyMap[id]}
                    </div>);
                }

                return (<div key={id} className="p-1 no-wrap">
                    {player.name} x {oneEightyMap[id]}
                </div>);
            })}
        </div>);
    }

    function renderHiChecks() {
        return (<div data-accolades="hi-checks" className="border-1 border-solid my-2 min-height-100 p-2 mt-5">
            <h5>Hi-checks</h5>
            {tournamentData.over100Checkouts.map((player, index) => {
                const teamAndDivision = findTeamAndDivisionForPlayer(player);

                if (teamAndDivision && teamAndDivision.division) {
                    return (<div key={index} className="p-1 no-wrap">
                        <EmbedAwareLink to={`/division/${teamAndDivision.division.name}/player:${player.name}@${teamAndDivision.team.name}/${season.name}`}>
                            {player.name}
                        </EmbedAwareLink> ({player.notes})
                    </div>);
                }

                return (<div key={player.name} className="p-1 no-wrap">
                    {player.name} ({player.notes})
                </div>);
            })}
        </div>);
    }

    function getWinner() {
        if (!any(layoutData)) {
            return null;
        }

        const finalRound: ILayoutDataForRound = layoutData[layoutData.length - 1];
        if (!finalRound || count(finalRound.matches || []) !== 1) {
            return null;
        }

        const final: ILayoutDataForMatch = finalRound.matches[0];
        if (final && final.winner) {
            const winningSide = final[final.winner];
            return winningSide.link;
        }

        return null;
    }

    try {
        return (<div className={printOnly ? 'd-screen-none' : ''} datatype="printable-sheet">
            {winner ? null : (<div className="float-end">
                <RefreshControl id={tournamentData.id} />
            </div>)}
            <div datatype="heading" className="border-1 border-solid border-secondary p-3 text-center">
                {tournamentData.type || 'tournament'} at <strong>{tournamentData.address}</strong> on <strong>{renderDate(tournamentData.date)}</strong>
                {tournamentData.notes ? (<> - <strong>{tournamentData.notes}</strong></>) : null}
                <span className="d-print-none margin-left">
                    <ShareButton
                        text={`${name}: ${tournamentData.type} at ${tournamentData.address} on ${renderDate(tournamentData.date)}`}/>
                        <button className="btn btn-sm margin-left btn-outline-primary"
                                onClick={window.print}>🖨️</button>
                </span>
            </div>
            <div datatype="rounds-and-players"
                 className="d-flex flex-row align-items-center overflow-auto no-overflow-on-print">
                {layoutData.map((roundData: ILayoutDataForRound, index: number) => (
                    <div key={index} datatype={`round-${index}`} className="d-flex flex-column p-3">
                        {index === layoutData.length - 1 ? render180s() : null}
                        <h5 datatype="round-name">{roundData.name}</h5>
                        {roundData.matches.map((matchData: any, index: number) => (<div key={index} datatype="match"
                                                                           className={`p-0 border-solid border-1 m-1 ${matchData.bye ? 'opacity-50 position-relative' : ''}`}>
                            {matchData.bye ? (<div className="position-absolute-bottom-right">Bye</div>) : null}
                            <div datatype="sideA"
                                 className={`d-flex flex-row justify-content-between p-2 min-width-150 ${matchData.winner === 'sideA' ? 'bg-winner fw-bold' : ''}`}>
                                <div className="no-wrap pe-3" datatype="sideAname">{matchData.sideA.link || (
                                    <span>&nbsp;</span>)}</div>
                                <div datatype="scoreA">{matchData.scoreA || ''}</div>
                            </div>
                            {matchData.bye ? null : (<div className="text-center dotted-line-through">
                                <span className="px-3 bg-white position-relative">
                                    vs
                                    {matchData.saygId ? (<a href={`/live/match/${matchData.saygId}`} target="_blank" rel="noreferrer" className="margin-left no-underline">👁️</a>) : null}
                                </span>
                            </div>)}
                            {matchData.bye
                                ? null
                                : (<div datatype="sideB"
                                        className={`d-flex flex-row justify-content-between p-2 min-width-150 ${matchData.winner === 'sideB' ? 'bg-winner fw-bold' : ''}`}>
                                    <div className="no-wrap pe-3" datatype="sideBname">{matchData.sideB.link || (
                                        <span>&nbsp;</span>)}</div>
                                    <div datatype="scoreB">{matchData.scoreB || ''}</div>
                                </div>)}
                        </div>))}
                        {index === layoutData.length - 1 ? renderHiChecks() : null}
                    </div>))}
                {any(tournamentData.sides) ? (<div>
                    <h5>Venue winner</h5>
                    <div datatype="winner"
                         className="p-0 border-solid border-1 m-1 bg-winner fw-bold">
                        <div className="d-flex flex-row justify-content-between p-2 min-width-150">
                            <div className="no-wrap pe-3">
                                <span>{winner || <>&nbsp;</>}</span>
                            </div>
                        </div>
                    </div>
                </div>) : null}
                {any(tournamentData.sides) ? (<div datatype="playing" className="ms-5">
                    <h4>Playing</h4>
                    <ul className="list-group">
                        {tournamentData.sides.sort(sortBy('name')).map((side, index) => <li
                            key={side.id}
                            className={`list-group-item no-wrap${side.noShow ? ' text-decoration-line-through' : ''}`}>
                            {index + 1} - {getLinkToSide(side)}
                        </li>)}
                    </ul>
                </div>) : null}
            </div>
        </div>);
    } catch (e) {
        /* istanbul ignore next */
        onError(e);
    }
}