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

export function Knockout({ account, divisions, apis }) {
    const { knockoutId } = useParams();
    const isAdmin = account && account.access && account.access.manageGames;
    const [ loading, setLoading ] = useState('init');
    const [error, setError] = useState(null);
    const [disabled, setDisabled] = useState(false);
    const [saving, setSaving] = useState(false);
    const [canSave, setCanSave] = useState(true);
    const [knockoutData, setKnockoutData] = useState(null);
    const [season, setSeason] = useState(null);
    const [division, setDivision] = useState(null);
    const [seasons, setSeasons] = useState(null);
    const [teams, setTeams] = useState(null);
    const [saveError, setSaveError] = useState(null);

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

    useEffect(() => {
        if (!knockoutData || !divisions) {
            return;
        }

        const division = divisions[knockoutData.divisionId];
        if (division) {
            setDivision(division);
        }
    }, [ divisions, knockoutData ]);

    async function loadFixtureData() {
        const http = new Http(new Settings());
        const knockoutApi = new KnockoutApi(http);
        const seasonApi = new SeasonApi(http);
        const teamApi = new TeamApi(http);
        const knockoutData = await knockoutApi.get(knockoutId);

        try {
            if (!knockoutData) {
                setError('Knockout could not be found');
                return;
            }

            setKnockoutData(knockoutData);

            const seasonsResponse = await seasonApi.getAll();
            const season = seasonsResponse.filter(s => s.id === knockoutData.seasonId)[0];
            const teams = await teamApi.getForDivisionAndSeason(knockoutData.divisionId, knockoutData.seasonId);

            setTeams(teams);
            setSeason(season);
            setSeasons(seasonsResponse);
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

    async function sideChanged(newSide, sideIndex) {
        const newKnockoutData = Object.assign({}, knockoutData);
        if (sideIndex === undefined) {
            newKnockoutData.sides.push(newSide);
        } else {
            if (newSide.players.length > 0) {
                newKnockoutData.sides[sideIndex] = newSide;
            } else {
                newKnockoutData.sides.splice(sideIndex, 1);
            }
        }
        setKnockoutData(newKnockoutData);
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

        if (round.matches && round.matches.length === 1) {
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
    const winningSideId = getWinningSide(knockoutData.round);

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
            originalDivisionData={division}
            divisions={divisions}
            onReloadDivisionData={apis.reloadAll}
            overrideMode="fixtures" />
        <div className="light-background p-3">
            <p>At <strong>{knockoutData.address}</strong> on <strong>{new Date(knockoutData.date).toDateString()}</strong></p>
            <div>Sides:</div>
            <div className="my-1 d-flex flex-sm-wrap">
                {knockoutData.sides.map(side => {
                    const thisSideIndex = sideIndex;
                    sideIndex++;
                    return (<KnockoutSide key={thisSideIndex} winner={winningSideId === side.id} readOnly={readOnly || knockoutData.round} seasonId={season.id} side={side} teams={teams} onChange={(newSide) => sideChanged(newSide, thisSideIndex)} otherSides={getOtherSides(thisSideIndex)} />); })}
                {readOnly || knockoutData.round ? null : (<KnockoutSide seasonId={season.id} side={null} teams={teams} onChange={sideChanged} otherSides={knockoutData.sides} />)}
            </div>
            <KnockoutRound round={knockoutData.round || {}} sides={knockoutData.sides} onChange={onChange} readOnly={readOnly} depth={1} />
            <button className="btn btn-primary" onClick={saveKnockout}>
                {saving ? (<span className="spinner-border spinner-border-sm margin-right" role="status" aria-hidden="true"></span>) : null}
                Save
            </button>
        </div>
        {saveError ? (<ErrorDisplay {...saveError} onClose={() => setSaveError(null)} title="Could not save knockout details"/>) : null}
    </div>);
}