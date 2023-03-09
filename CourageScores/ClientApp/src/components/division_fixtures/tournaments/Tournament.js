import React, {useEffect, useState} from 'react';
import {useParams} from "react-router-dom";
import {DivisionControls} from "../../DivisionControls";
import {ErrorDisplay} from "../../common/ErrorDisplay";
import {any, sortBy, valueChanged} from "../../../Utilities";
import {Loading} from "../../common/Loading";
import {ShareButton} from "../../ShareButton";
import {TournamentSheet} from "./TournamentSheet";
import {EditTournament} from "./EditTournament";
import {useDependencies} from "../../../IocContainer";
import {useApp} from "../../../AppContainer";

export function Tournament() {
    const { tournamentId } = useParams();
    const {account, reloadAll, seasons} = useApp();
    const { divisionApi, teamApi, tournamentApi } = useDependencies();
    const isAdmin = account && account.access && account.access.manageGames;
    const [ loading, setLoading ] = useState('init');
    const [error, setError] = useState(null);
    const [disabled, setDisabled] = useState(false);
    const [saving, setSaving] = useState(false);
    const [canSave, setCanSave] = useState(true);
    const [tournamentData, setTournamentData] = useState(null);
    const [season, setSeason] = useState(null);
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
            // noinspection JSIgnoredPromiseFromCall
            loadFixtureData();
        },
        // eslint-disable-next-line
        [loading]);

    async function loadFixtureData() {
        try {
            const tournamentData = await tournamentApi.get(tournamentId);

            if (!tournamentData) {
                setError('Tournament could not be found');
                return;
            }

            setTournamentData(tournamentData);

            const season = seasons[tournamentData.seasonId];
            const teams = await teamApi.getAll();
            const allPlayers = getAllPlayers(tournamentData, teams);
            const anyDivisionId = '00000000-0000-0000-0000-000000000000';
            const divisionData = await divisionApi.data(anyDivisionId, tournamentData.seasonId);
            const fixtureDate = divisionData.fixtures.filter(f => f.date === tournamentData.date)[0];
            const tournamentPlayerIds = fixtureDate ? fixtureDate.tournamentFixtures.filter(f => !f.proposed && f.id !== tournamentData.id).flatMap(f => f.players) : [];
            allPlayers.sort(sortBy('name'));

            const tournamentPlayerMap = {};
            tournamentPlayerIds.forEach(id => tournamentPlayerMap[id] = {});

            setAlreadyPlaying(tournamentPlayerMap);
            setTeams(teams);
            setSeason(season);
            setAllPlayers(allPlayers);
        } catch (e) {
            setError(e.toString());
        } finally {
            setLoading('ready');
        }
    }

    function getAllPlayers(tournamentData, teams) {
        const selectedTournamentPlayers = tournamentData.sides
            ? tournamentData.sides.flatMap(side => side.players)
            : [];

        if (any(selectedTournamentPlayers)) {
            return selectedTournamentPlayers;
        }

        const selectedTournamentTeams = tournamentData.sides
            ? tournamentData.sides.map(side => side.teamId)
            : [];

        const players = teams
            .filter(t => any(selectedTournamentTeams, id => id === t.id))
            .map(t => {
                return { teamSeason: t.seasons.filter(ts => ts.seasonId === tournamentData.seasonId)[0], divisionId: t.divisionId };
            })
            .filter(mapping => mapping.teamSeason)
            .flatMap(mapping => mapping.teamSeason.players.map(p => {
                return Object.assign({}, p, { divisionId: mapping.divisionId });
            }));
        players.sort(sortBy('name'));

        return players;
    }

    async function saveTournament() {
        if (saving) {
            return;
        }

        setSaving(true);

        try {
            const response = await tournamentApi.update(tournamentData);
            if (!response.success) {
                setSaveError(response);
            }
        } finally {
            setSaving(false);
        }
    }

    if (loading !== 'ready') {
        return (<Loading />);
    }

    if (error) {
        return (<div className="light-background p-3">Error: {error}</div>);
    }

    return (<div>
        <DivisionControls
            seasons={seasons.map(a => a)}
            originalSeasonData={{
                id: season.id,
                name: season.name,
                startDate: season.startDate.substring(0, 10),
                endDate: season.endDate.substring(0, 10),
            }}
            onReloadDivisionData={reloadAll}
            overrideMode="fixtures" />
        <div className="light-background p-3">
            {isAdmin
                ? (<div className="input-group mb-3">
                        <div className="input-group-prepend">
                            <span className="input-group-text">Address</span>
                        </div>
                        <input className="form-control" disabled={saving} type="text" value={tournamentData.address} name="address" onChange={valueChanged(tournamentData, setTournamentData)} />
                    </div>)
                : (<p>
                    At <strong>{tournamentData.address}</strong> on <strong>{new Date(tournamentData.date).toDateString()}</strong>
                    <span className="margin-left">
                        <ShareButton text={`Courage League: ${tournamentData.address} on ${new Date(tournamentData.date).toDateString()}`} />
                    </span>
                </p>)}
            {isAdmin
                ? (<div className="form-group input-group mb-3 d-print-none">
                    <div className="input-group-prepend">
                            <span className="input-group-text">Type (optional)</span>
                        </div>
                    <input id="type-text" className="form-control" disabled={saving} value={tournamentData.type || ''} name="type" onChange={valueChanged(tournamentData, setTournamentData)} />
                </div>)
                : null}
            {isAdmin
                ? (<div className="form-group input-group mb-3 d-flex">
                    <label htmlFor="note-text" className="input-group-text">Notes</label>
                    <textarea id="note-text" className="form-control" disabled={saving} value={tournamentData.notes || ''} name="notes" onChange={valueChanged(tournamentData, setTournamentData)}></textarea>
                </div>)
                : tournamentData.notes
                    ? (<div className="alert alert-warning alert-dismissible fade show" role="alert">{tournamentData.notes}</div>)
                    : null}
            <EditTournament
                tournamentData={tournamentData}
                disabled={disabled}
                saving={saving}
                teams={teams}
                allPlayers={allPlayers}
                season={season}
                alreadyPlaying={alreadyPlaying}
                canSave={canSave}
                setTournamentData={setTournamentData} />
            <TournamentSheet sides={tournamentData.sides} />
            {isAdmin ? (<button className="btn btn-primary d-print-none" onClick={saveTournament}>
                {saving ? (<span className="spinner-border spinner-border-sm margin-right" role="status" aria-hidden="true"></span>) : null}
                Save
            </button>) : null}
        </div>
        {saveError ? (<ErrorDisplay {...saveError} onClose={() => setSaveError(null)} title="Could not save tournament details"/>) : null}
    </div>);
}
