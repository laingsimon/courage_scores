import React, {useEffect, useState} from 'react';
import {useParams} from "react-router-dom";
import {Http} from "../../../api/http";
import {Settings} from "../../../api/settings";
import {SeasonApi} from "../../../api/season";
import {TournamentApi} from "../../../api/tournament";
import {DivisionControls} from "../../DivisionControls";
import {TeamApi} from "../../../api/team";
import {TournamentRound} from "./TournamentRound";
import {TournamentSide} from "./TournamentSide";
import {ErrorDisplay} from "../../common/ErrorDisplay";
import {MultiPlayerSelection} from "../scores/MultiPlayerSelection";
import {nameSort} from "../../../Utilities";
import {Loading} from "../../common/Loading";
import {ShareButton} from "../../ShareButton";
import {DivisionApi} from "../../../api/division";

export function Tournament({ account, apis }) {
    const { tournamentId } = useParams();
    const isAdmin = account && account.access && account.access.manageGames;
    const [ loading, setLoading ] = useState('init');
    const [error, setError] = useState(null);
    const [disabled, setDisabled] = useState(false);
    const [saving, setSaving] = useState(false);
    const [canSave, setCanSave] = useState(true);
    const [tournamentData, setTournamentData] = useState(null);
    const [season, setSeason] = useState(null);
    const [seasons, setSeasons] = useState(null);
    const [teams, setTeams] = useState(null);
    const [saveError, setSaveError] = useState(null);
    const [allPlayers, setAllPlayers] = useState([]);
    const [alreadyPlaying, setAlreadyPlaying] = useState(null);

    useEffect(() => {
        const isAdmin = (account && account.access && account.access.manageScores);
        setDisabled(!isAdmin || false);
        setCanSave(isAdmin || false);
    }, [account]);

    useEffect(() => {
            if (loading !== 'init') {
                return;
            }

            setLoading('loading');
            loadFixtureData();
        },
        // eslint-disable-next-line
        [loading]);

    async function loadFixtureData() {
        const http = new Http(new Settings());
        const tournamentApi = new TournamentApi(http);
        const seasonApi = new SeasonApi(http);
        const teamApi = new TeamApi(http);
        const divisionApi = new DivisionApi(http);

        try {
            const tournamentData = await tournamentApi.get(tournamentId);

            if (!tournamentData) {
                setError('Tournament could not be found');
                return;
            }

            setTournamentData(tournamentData);

            const seasonsResponse = await seasonApi.getAll();
            const season = seasonsResponse.filter(s => s.id === tournamentData.seasonId)[0];
            const teams = await teamApi.getAll();
            const allPlayers = tournamentData.sides
                ? tournamentData.sides.flatMap(side => side.players)
                : [];
            const anyDivisionId = '00000000-0000-0000-0000-000000000000';
            const divisionData = await divisionApi.data(anyDivisionId, tournamentData.seasonId);
            const fixtureDate = divisionData.fixtures.filter(f => f.date === tournamentData.date)[0];
            const tournamentPlayerIds = fixtureDate ? fixtureDate.tournamentFixtures.filter(f => !f.proposed && f.id !== tournamentData.id).flatMap(f => f.players) : [];
            allPlayers.sort(nameSort);

            const tournamentPlayerMap = {};
            tournamentPlayerIds.forEach(id => tournamentPlayerMap[id] = {});

            setAlreadyPlaying(tournamentPlayerMap);
            setTeams(teams);
            setSeason(season);
            setSeasons(seasonsResponse);
            setAllPlayers(allPlayers);
        } catch (e) {
            setError(e.toString());
        } finally {
            setLoading('ready');
        }
    }

    async function onChange(newRound) {
        const newTournamentData = Object.assign({}, tournamentData);
        newTournamentData.round = newRound;
        setTournamentData(newTournamentData);
    }

    async function changeProperty(event) {
        const newTournamentData = Object.assign({}, tournamentData);
        newTournamentData[event.target.name] = event.target.value;
        setTournamentData(newTournamentData);
    }

    async function sideChanged(newSide, sideIndex) {
        const newTournamentData = Object.assign({}, tournamentData);
        if (sideIndex === undefined) {
            newTournamentData.sides.push(newSide);
        } else {
            if (newSide.players.length > 0 || newSide.teamId) {
                newTournamentData.sides[sideIndex] = newSide;
                updateSideDataInRound(newTournamentData.round, newSide);
            } else {
                // delete the side
                newTournamentData.sides.splice(sideIndex, 1);
            }
        }
        setTournamentData(newTournamentData);
    }

    function updateSideDataInRound(round, side) {
        if (!round) {
            return;
        }

        if (round.matches) {
            for (let index = 0; index < round.matches.length; index++) {
                const match = round.matches[index];
                if (match.sideA && match.sideA.id === side.id) {
                    match.sideA = side;
                } else if (match.sideB && match.sideB.id === side.id) {
                    match.sideB = side;
                }
            }
        }

        updateSideDataInRound(round.nextRound, side);
    }

    async function saveTournament() {
        if (saving) {
            return;
        }

        setSaving(true);

        try {

            const http = new Http(new Settings());
            const tournamentApi = new TournamentApi(http);

            const response = await tournamentApi.update(tournamentData);
            if (!response.success) {
                setSaveError(response);
            }
        } finally {
            setSaving(false);
        }
    }

    function getOtherSides(sideIndex) {
        let index = 0;
        return tournamentData.sides.filter(_ => {
            return index++ !== sideIndex;
        });
    }

    function getWinningSide(round) {
        if (round && round.nextRound) {
            return getWinningSide(round.nextRound);
        }

        if (round && round.matches && round.matches.length === 1) {
            const match = round.matches[0];
            if (match.scoreA !== null && match.scoreB !== null && match.sideA && match.sideB) {
                if (Number.parseInt(match.scoreA) > Number.parseInt(match.scoreB)) {
                    return match.sideA.id;
                } else if (Number.parseInt(match.scoreB) > Number.parseInt(match.scoreA)) {
                    return match.sideB.id;
                } else {
                    return null;
                }
            }

            return null;
        }
    }

    function add180(player) {
        const newTournamentData = Object.assign({}, tournamentData);

        if (!newTournamentData.oneEighties) {
            newTournamentData.oneEighties = [];
        }

        newTournamentData.oneEighties.push({
            id: player.id,
            name: player.name
        });

        setTournamentData(newTournamentData);

    }

    function addHiCheck(player, notes) {
        const newTournamentData = Object.assign({}, tournamentData);

        if (!newTournamentData.over100Checkouts) {
            newTournamentData.over100Checkouts = [];
        }

        newTournamentData.over100Checkouts.push({
            id: player.id,
            name: player.name,
            notes: notes
        });

        setTournamentData(newTournamentData);
    }

    function removeOneEightyScore(playerId, index) {
        const newTournamentData = Object.assign({}, tournamentData);

        newTournamentData.oneEighties.splice(index, 1);

        setTournamentData(newTournamentData);
    }

    function removeHiCheck(playerId, index) {
        const newTournamentData = Object.assign({}, tournamentData);

        newTournamentData.over100Checkouts.splice(index, 1);

        setTournamentData(newTournamentData);
    }

    if (loading !== 'ready') {
        return (<Loading />);
    }

    if (error) {
        return (<div className="light-background p-3">Error: {error}</div>);
    }

    let sideIndex = 0;
    const readOnly = !isAdmin || !canSave || disabled || saving;
    const hasStarted = tournamentData.round && tournamentData.round.matches && tournamentData.round.matches.length > 0;
    const winningSideId = hasStarted ? getWinningSide(tournamentData.round) : null;
    const playerCount = tournamentData.sides.reduce((curr, next) => curr + (next.players || []).length, 0);

    return (<div>
        <DivisionControls
            reloadAll={apis.reloadAll}
            seasons={seasons}
            account={account}
            originalSeasonData={{
                id: season.id,
                name: season.name,
                startDate: season.startDate.substring(0, 10),
                endDate: season.endDate.substring(0, 10),
            }}
            onReloadDivisionData={apis.reloadAll}
            overrideMode="fixtures" />
        <div className="light-background p-3">
            {isAdmin
                ? (<div className="input-group mb-3">
                        <div className="input-group-prepend">
                            <span className="input-group-text">Address</span>
                        </div>
                        <input className="form-control" disabled={saving} type="text" value={tournamentData.address} name="address" onChange={changeProperty} />
                    </div>)
                : (<p>
                    At <strong>{tournamentData.address}</strong> on <strong>{new Date(tournamentData.date).toDateString()}</strong>
                    <span className="margin-left">
                        <ShareButton text={`Courage League: ${tournamentData.address} on ${new Date(tournamentData.date).toDateString()}`} />
                    </span>
                </p>)}
            {isAdmin
                ? (<div className="form-group input-group mb-3">
                    <div className="input-group-prepend">
                            <span className="input-group-text">Type (optional)</span>
                        </div>
                    <input id="type-text" className="form-control" disabled={saving} value={tournamentData.type || ''} name="type" onChange={changeProperty} />
                </div>)
                : null}
            {isAdmin
                ? (<div className="form-group input-group mb-3 d-flex">
                    <label htmlFor="note-text" className="input-group-text">Notes</label>
                    <textarea id="note-text" className="form-control" disabled={saving} value={tournamentData.notes || ''} name="notes" onChange={changeProperty}></textarea>
                </div>)
                : tournamentData.notes
                    ? (<div className="alert alert-warning alert-dismissible fade show" role="alert">{tournamentData.notes}</div>)
                    : null}
            <div>Sides:</div>
            <div className="my-1 d-flex flex-wrap">
                {tournamentData.sides.map(side => {
                    const thisSideIndex = sideIndex;
                    sideIndex++;
                    return (<TournamentSide key={thisSideIndex} winner={winningSideId === side.id} readOnly={readOnly} seasonId={season.id} side={side} teams={teams} exceptPlayerIds={alreadyPlaying} onChange={(newSide) => sideChanged(newSide, thisSideIndex)} otherSides={getOtherSides(thisSideIndex)} />); })}
                {readOnly || hasStarted ? null : (<TournamentSide seasonId={season.id} side={null} teams={teams} exceptPlayerIds={alreadyPlaying} onChange={sideChanged} otherSides={tournamentData.sides} />)}
            </div>
            {tournamentData.sides.length >= 2 ? (<TournamentRound round={tournamentData.round || {}} sides={tournamentData.sides} onChange={onChange} readOnly={readOnly} depth={1} />) : null}
            {tournamentData.sides.length >= 2 && playerCount >= 1 ? (<table className="table">
                <tbody>
                <tr>
                    <td colSpan="2">
                        180s<br/>
                        <MultiPlayerSelection
                            disabled={disabled}
                            readOnly={saving}
                            allPlayers={allPlayers}
                            divisionId={tournamentData.divisionId}
                            seasonId={tournamentData.seasonId}
                            players={tournamentData.oneEighties || []}
                            onRemovePlayer={removeOneEightyScore}
                            onAddPlayer={add180}/>
                    </td>
                    <td colSpan="2">
                        100+ c/o<br/>
                        <MultiPlayerSelection
                            disabled={disabled}
                            readOnly={saving}
                            allPlayers={allPlayers}
                            divisionId={tournamentData.divisionId}
                            seasonId={tournamentData.seasonId}
                            players={tournamentData.over100Checkouts || []}
                            onRemovePlayer={removeHiCheck}
                            onAddPlayer={addHiCheck}
                            showNotes={true} />
                    </td>
                </tr>
                </tbody>
            </table>) : null}
            {isAdmin ? (<button className="btn btn-primary" onClick={saveTournament}>
                {saving ? (<span className="spinner-border spinner-border-sm margin-right" role="status" aria-hidden="true"></span>) : null}
                Save
            </button>) : null}
        </div>
        {saveError ? (<ErrorDisplay {...saveError} onClose={() => setSaveError(null)} title="Could not save tournament details"/>) : null}
    </div>);
}
