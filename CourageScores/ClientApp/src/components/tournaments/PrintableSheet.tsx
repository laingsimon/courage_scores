import {useTournament} from "./TournamentContainer";
import {repeat} from "../../helpers/projection";
import {any, count, IFrequency, groupAndSortByOccurrences, sortBy} from "../../helpers/collections";
import {renderDate} from "../../helpers/rendering";
import {useEffect, useState} from "react";
import {useApp} from "../common/AppContainer";
import {EmbedAwareLink} from "../common/EmbedAwareLink";
import {ShareButton} from "../common/ShareButton";
import {useBranding} from "../common/BrandingContainer";
import {RefreshControl} from "../common/RefreshControl";
import {TournamentSideDto} from "../../interfaces/models/dtos/Game/TournamentSideDto";
import {TournamentPlayerDto} from "../../interfaces/models/dtos/Game/TournamentPlayerDto";
import {TeamPlayerDto} from "../../interfaces/models/dtos/Team/TeamPlayerDto";
import {
    addSide,
    getPlayedLayoutData,
    getUnplayedLayoutData,
    ILayoutDataForMatch,
    ILayoutDataForRound, removeSide,
    setRoundNames, sideChanged
} from "../../helpers/tournaments";
import {NotableTournamentPlayerDto} from "../../interfaces/models/dtos/Game/NotableTournamentPlayerDto";
import {PrintableSheetMatch} from "./PrintableSheetMatch";
import {EditSide} from "./EditSide";
import {TeamSeasonDto} from "../../interfaces/models/dtos/Team/TeamSeasonDto";
import {TeamDto} from "../../interfaces/models/dtos/Team/TeamDto";
import {DivisionDto} from "../../interfaces/models/dtos/DivisionDto";
import {Dialog} from "../common/Dialog";
import {add180, addHiCheck, remove180, removeHiCheck} from "../common/Accolades";
import {MultiPlayerSelection} from "../common/MultiPlayerSelection";
import {TournamentDetails} from "./TournamentDetails";
import {TournamentGameDto} from "../../interfaces/models/dtos/Game/TournamentGameDto";

export interface IPrintableSheetProps {
    printOnly: boolean;
    editable?: boolean;
}

interface IMovement {
    scrollLeft: number;
}

interface IWiggler {
    handle?: number;
    movements: IMovement[];
}

export function PrintableSheet({printOnly, editable}: IPrintableSheetProps) {
    const {name} = useBranding();
    const {onError, teams, divisions} = useApp();
    const {tournamentData, season, division, matchOptionDefaults, setTournamentData, allPlayers, saving, editTournament, setEditTournament } = useTournament();
    const layoutData: ILayoutDataForRound[] = setRoundNames(tournamentData.round && any(tournamentData.round.matches)
        ? getPlayedLayoutData(tournamentData.sides, tournamentData.round, { matchOptionDefaults, getLinkToSide })
        : getUnplayedLayoutData(tournamentData.sides));
    const [wiggle, setWiggle] = useState<boolean>(!printOnly);
    const [editSide, setEditSide] = useState<TournamentSideDto>(null);
    const [newSide, setNewSide] = useState<TournamentSideDto>(null);
    const [editAccolades, setEditAccolades] = useState<string>(null);
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

    function renderEditSide() {
        return (<EditSide
            side={editSide}
            onChange={async (side: TournamentSideDto) => setEditSide(side)}
            onClose={async () => setEditSide(null)}
            onApply={async () => {
                const sideIndex: number = tournamentData.sides.map((side: TournamentSideDto, index: number) => side.id === editSide.id ? index : null).filter((index: number) => index !== null)[0];
                await setTournamentData(sideChanged(tournamentData, editSide, sideIndex));
                setEditSide(null);
            }}
            onDelete={async () => {
                await setTournamentData(removeSide(tournamentData, editSide));
                setEditSide(null);
            }}/>);
    }

    function renderEditNewSide() {
        return (<EditSide
            side={newSide}
            onChange={async (side: TournamentSideDto) => setNewSide(side)}
            onClose={async () => setNewSide(null)}
            onApply={async () => {
                await setTournamentData(addSide(tournamentData, newSide));
                setNewSide(null);
            }}/>);
    }

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

    function getLinkToSide(side: TournamentSideDto) {
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

    function findTeamAndDivisionForPlayer(player: TournamentPlayerDto): { team?: TeamDto, division?: DivisionDto } {
        const teamAndDivisionMapping = teams.map(t => {
            const teamSeason: TeamSeasonDto = t.seasons.filter((ts: TeamSeasonDto) => ts.seasonId === season.id && !ts.deleted)[0];
            if (!teamSeason) {
                return null;
            }

            const hasPlayer: boolean = any(teamSeason.players, (p: TeamPlayerDto) => p.id === player.id);
            return hasPlayer ? {team: t, divisionId: teamSeason.divisionId} : null;
        }).filter(a => a !== null)[0];

        if (!teamAndDivisionMapping) {
            return { };
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

    function render180s() {
        return (<div data-accolades="180s" className="border-1 border-solid my-2 min-height-100 p-2 mb-5" onClick={editable ? () => setEditAccolades('one-eighties') : null}>
            <h5>180s</h5>
            {groupAndSortByOccurrences(tournamentData.oneEighties, 'id').map((player: TournamentPlayerDto & IFrequency, index: number) => {
                const { team, division } = findTeamAndDivisionForPlayer(player);

                if (division && team) {
                    return (<div key={index} className="p-1 no-wrap">
                        <EmbedAwareLink to={`/division/${division.name}/player:${player.name}@${team.name}/${season.name}`}>
                            {player.name}
                        </EmbedAwareLink> x {player.occurrences}
                    </div>);
                }

                return (<div key={player.id} className="p-1 no-wrap">
                    {player.name} x {player.occurrences}
                </div>);
            })}
        </div>);
    }

    function renderEdit180s() {
        return <Dialog title="Edit 180s" onClose={async () => setEditAccolades(null)}>
            <MultiPlayerSelection
                allPlayers={allPlayers}
                division={division}
                season={season}
                players={tournamentData.oneEighties || []}
                onRemovePlayer={remove180(tournamentData, setTournamentData)}
                onAddPlayer={add180(tournamentData, setTournamentData)}/>
        </Dialog>
    }

    function renderHiChecks() {
        return (<div data-accolades="hi-checks" className="border-1 border-solid my-2 min-height-100 p-2 mt-5" onClick={editable ? () => setEditAccolades('hi-checks') : null}>
            <h5>Hi-checks</h5>
            {tournamentData.over100Checkouts.map((player: NotableTournamentPlayerDto, index: number) => {
                const { team, division } = findTeamAndDivisionForPlayer(player);

                if (division && team) {
                    return (<div key={index} className="p-1 no-wrap">
                        <EmbedAwareLink to={`/division/${division.name}/player:${player.name}@${team.name}/${season.name}`}>
                            {player.name}
                        </EmbedAwareLink> ({player.score})
                    </div>);
                }

                return (<div key={player.name} className="p-1 no-wrap">
                    {player.name} ({player.score})
                </div>);
            })}
        </div>);
    }

    function renderEditHiChecks() {
        return <Dialog title="Edit hi-hecks" onClose={async () => setEditAccolades(null)}>
            <MultiPlayerSelection
                allPlayers={allPlayers}
                division={division}
                season={season}
                players={tournamentData.over100Checkouts || []}
                onRemovePlayer={removeHiCheck(tournamentData, setTournamentData)}
                onAddPlayer={addHiCheck(tournamentData, setTournamentData)}
                showScore={true}/>
        </Dialog>
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

    function getPossibleSides(matchData: ILayoutDataForMatch, roundData: ILayoutDataForRound): TournamentSideDto[] {
        const sideAId: string = matchData.sideA ? matchData.sideA.id : null;
        const sideBId: string = matchData.sideB ? matchData.sideB.id : null;

        return roundData.possibleSides.filter((s: TournamentSideDto) =>
            s.id === sideAId ||
            s.id === sideBId ||
            !any(roundData.alreadySelectedSides, (alreadySelected: TournamentSideDto) => alreadySelected.id === s.id))
    }

    try {
        return (<div className={printOnly ? 'd-screen-none' : ''} datatype="printable-sheet">
            {winner ? null : (<div className="float-end">
                <RefreshControl id={tournamentData.id} />
            </div>)}
            <div datatype="heading" className="border-1 border-solid border-secondary p-3 text-center" onClick={setEditTournament ? async () => await setEditTournament(true) : null}>
                {tournamentData.type || 'tournament'} at <strong>{tournamentData.address}</strong> on <strong>{renderDate(tournamentData.date)}</strong>
                {tournamentData.notes ? (<> - <strong>{tournamentData.notes}</strong></>) : null}
                <span className="d-print-none margin-left">
                    <ShareButton text={`${name}: ${tournamentData.type} at ${tournamentData.address} on ${renderDate(tournamentData.date)}`}/>
                    <button className="btn btn-sm margin-left btn-outline-primary" onClick={window.print}>🖨️</button>
                </span>
            </div>
            <div datatype="rounds-and-players"
                 className="d-flex flex-row align-items-center justify-content-center overflow-auto no-overflow-on-print">
                {layoutData.map((roundData: ILayoutDataForRound, roundIndex: number) => (
                    <div key={roundIndex} datatype={`round-${roundIndex}`} className="d-flex flex-column p-3">
                        {roundIndex === layoutData.length - 1 ? render180s() : null}
                        <h5 datatype="round-name">{roundData.name}</h5>
                        {roundData.matches.map((matchData: ILayoutDataForMatch, matchIndex: number) => <PrintableSheetMatch
                            key={matchIndex}
                            matchData={matchData}
                            matchIndex={matchIndex}
                            roundIndex={roundIndex}
                            possibleSides={getPossibleSides(matchData, roundData)}
                            editable={editable} />)}
                        {roundIndex === layoutData.length - 1 ? renderHiChecks() : null}
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
                {!any(tournamentData.sides) && editable
                    ? (<div datatype="add-sides-hint" className="alert alert-warning m-3 d-print-none">
                        Add who's playing by clicking <span className="text-secondary" onClick={() => setNewSide({ id: null })}>Add a side</span> &rarr;
                    </div>)
                    : null}
                {any(tournamentData.sides) || editable ? (<div datatype="playing" className="ms-5">
                    <h4>Playing</h4>
                    <ul className="list-group">
                        {tournamentData.sides.sort(sortBy('name')).map((side: TournamentSideDto, index: number) => <li
                            key={side.id}
                            onClick={editable ? () => setEditSide(side) : null}
                            className={`list-group-item no-wrap${side.noShow ? ' text-decoration-line-through' : ''}`}>
                            {index + 1} - {editable ? side.name : getLinkToSide(side)}
                        </li>)}
                        {editable ? (<li datatype="add-side" className="list-group-item text-secondary opacity-50 d-print-none" onClick={() => setNewSide({ id: null })}>
                            Add a side
                        </li>) : null}
                    </ul>
                </div>) : null}
                {editSide ? renderEditSide() : null}
                {newSide ? renderEditNewSide() : null}
                {editAccolades === 'hi-checks' ? renderEditHiChecks() : null}
                {editAccolades === 'one-eighties' ? renderEdit180s() : null}
                {editTournament
                    ? (<Dialog onClose={async () => await setEditTournament(false)}>
                        <TournamentDetails
                        tournamentData={tournamentData}
                        disabled={saving}
                        setTournamentData={async (data: TournamentGameDto) => setTournamentData(data)} />
                        </Dialog>)
                    : null}
            </div>
        </div>);
    } catch (e) {
        /* istanbul ignore next */
        onError(e);
    }
}
