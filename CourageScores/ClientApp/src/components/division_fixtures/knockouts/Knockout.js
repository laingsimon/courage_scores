import React, {useEffect, useState} from 'react';
import {useParams} from "react-router-dom";
import {Http} from "../../../api/http";
import {Settings} from "../../../api/settings";
import {SeasonApi} from "../../../api/season";
import {KnockoutApi} from "../../../api/knockout";
import {DivisionControls} from "../../DivisionControls";
import {TeamApi} from "../../../api/team";
import {KnockoutRound} from "./KnockoutRound";
import {KnockoutSide} from "./KnockoutSide";
import {ErrorDisplay} from "../../common/ErrorDisplay";
import {MultiPlayerSelection} from "../scores/MultiPlayerSelection";
import {nameSort} from "../../../Utilities";

export function Knockout({ account, apis }) {
    const { knockoutId } = useParams();
    const isAdmin = account && account.access && account.access.manageGames;
    const [ loading, setLoading ] = useState('init');
    const [error, setError] = useState(null);
    const [disabled, setDisabled] = useState(false);
    const [saving, setSaving] = useState(false);
    const [canSave, setCanSave] = useState(true);
    const [knockoutData, setKnockoutData] = useState(null);
    const [season, setSeason] = useState(null);
    const [seasons, setSeasons] = useState(null);
    const [teams, setTeams] = useState(null);
    const [saveError, setSaveError] = useState(null);
    const [allPlayers, setAllPlayers] = useState([]);

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
        const knockoutApi = new KnockoutApi(http);
        const seasonApi = new SeasonApi(http);
        const teamApi = new TeamApi(http);

        try {
            const knockoutData = await knockoutApi.get(knockoutId);

            if (!knockoutData) {
                setError('Knockout could not be found');
                return;
            }

            setKnockoutData(knockoutData);

            const seasonsResponse = await seasonApi.getAll();
            const season = seasonsResponse.filter(s => s.id === knockoutData.seasonId)[0];
            const teams = await teamApi.getAll();
            const allPlayers = knockoutData.sides
                ? knockoutData.sides.flatMap(side => side.players)
                : [];
            allPlayers.sort(nameSort);

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
        const newKnockoutData = Object.assign({}, knockoutData);
        newKnockoutData.round = newRound;
        setKnockoutData(newKnockoutData);
    }

    async function changeAddress(event) {
        const newKnockoutData = Object.assign({}, knockoutData);
        newKnockoutData.address = event.target.value;
        setKnockoutData(newKnockoutData);
    }

    async function sideChanged(newSide, sideIndex) {
        const newKnockoutData = Object.assign({}, knockoutData);
        if (sideIndex === undefined) {
            newKnockoutData.sides.push(newSide);
        } else {
            if (newSide.players.length > 0) {
                newKnockoutData.sides[sideIndex] = newSide;
                updateSideDataInRound(newKnockoutData.round, newSide);
            } else {
                // delete the side
                newKnockoutData.sides.splice(sideIndex, 1);
            }
        }
        setKnockoutData(newKnockoutData);
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

    async function saveKnockout() {
        if (saving) {
            return;
        }

        setSaving(true);

        try {

            const http = new Http(new Settings());
            const knockoutApi = new KnockoutApi(http);

            const response = await knockoutApi.update(knockoutData);
            if (!response.success) {
                setSaveError(response);
            }
        } finally {
            setSaving(false);
        }
    }

    function getOtherSides(sideIndex) {
        let index = 0;
        return knockoutData.sides.filter(_ => {
            return index++ !== sideIndex;
        });
    }

    function getWinningSide(round) {
        if (round && round.nextRound) {
            return getWinningSide(round.nextRound);
        }

        if (round && round.matches && round.matches.length === 1) {
            const match = round.matches[0];
            if (match.scoreA && match.scoreB && match.sideA && match.sideB) {
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
        const newKnockoutData = Object.assign({}, knockoutData);

        if (!newKnockoutData.oneEighties) {
            newKnockoutData.oneEighties = [];
        }

        newKnockoutData.oneEighties.push({
            id: player.id,
            name: player.name
        });

        setKnockoutData(newKnockoutData);

    }

    function addHiCheck(player, notes) {
        const newKnockoutData = Object.assign({}, knockoutData);

        if (!newKnockoutData.over100Checkouts) {
            newKnockoutData.over100Checkouts = [];
        }

        newKnockoutData.over100Checkouts.push({
            id: player.id,
            name: player.name,
            notes: notes
        });

        setKnockoutData(newKnockoutData);
    }

    function removeOneEightyScore(playerId, index) {
        const newKnockoutData = Object.assign({}, knockoutData);

        newKnockoutData.oneEighties.splice(index, 1);

        setKnockoutData(newKnockoutData);
    }

    function removeHiCheck(playerId, index) {
        const newKnockoutData = Object.assign({}, knockoutData);

        newKnockoutData.over100Checkouts.splice(index, 1);

        setKnockoutData(newKnockoutData);
    }

    if (loading !== 'ready') {
        return (<div className="light-background p-3 loading-background">
            <div className="mt-2 pt-4 h3">Loading...</div>
        </div>);
    }

    if (error) {
        return (<div className="light-background p-3">Error: {error}</div>);
    }

    let sideIndex = 0;
    const readOnly = !isAdmin || !canSave || disabled || saving;
    const hasStarted = knockoutData.round && knockoutData.round.matches && knockoutData.round.matches.length > 0;
    const winningSideId = hasStarted ? getWinningSide(knockoutData.round) : null;

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
                        <input className="form-control" disabled={saving} type="text" value={knockoutData.address} onChange={changeAddress} />
                    </div>)
                : (<p>At <strong>{knockoutData.address}</strong> on <strong>{new Date(knockoutData.date).toDateString()}</strong></p>)}
            <div>Sides:</div>
            <div className="my-1 d-flex flex-wrap">
                {knockoutData.sides.map(side => {
                    const thisSideIndex = sideIndex;
                    sideIndex++;
                    return (<KnockoutSide key={thisSideIndex} winner={winningSideId === side.id} readOnly={readOnly || hasStarted} seasonId={season.id} side={side} teams={teams} onChange={(newSide) => sideChanged(newSide, thisSideIndex)} otherSides={getOtherSides(thisSideIndex)} />); })}
                {readOnly || hasStarted ? null : (<KnockoutSide seasonId={season.id} side={null} teams={teams} onChange={sideChanged} otherSides={knockoutData.sides} />)}
            </div>
            {knockoutData.sides.length >= 2 ? (<KnockoutRound round={knockoutData.round || {}} sides={knockoutData.sides} onChange={onChange} readOnly={readOnly} depth={1} />) : null}
            {knockoutData.sides.length >= 2 ? (<table className="table">
                <tbody>
                <tr>
                    <td colSpan="2">
                        180s<br/>
                        <MultiPlayerSelection
                            disabled={disabled}
                            readOnly={saving}
                            allPlayers={allPlayers}
                            players={knockoutData.oneEighties || []}
                            onRemovePlayer={removeOneEightyScore}
                            onAddPlayer={add180}/>
                    </td>
                    <td colSpan="2">
                        100+ c/o<br/>
                        <MultiPlayerSelection
                            disabled={disabled}
                            readOnly={saving}
                            allPlayers={allPlayers}
                            players={knockoutData.over100Checkouts || []}
                            onRemovePlayer={removeHiCheck}
                            onAddPlayer={addHiCheck}
                            showNotes={true} />
                    </td>
                </tr>
                </tbody>
            </table>) : null}
            {isAdmin ? (<button className="btn btn-primary" onClick={saveKnockout}>
                {saving ? (<span className="spinner-border spinner-border-sm margin-right" role="status" aria-hidden="true"></span>) : null}
                Save
            </button>) : null}
        </div>
        {saveError ? (<ErrorDisplay {...saveError} onClose={() => setSaveError(null)} title="Could not save knockout details"/>) : null}
    </div>);
}
