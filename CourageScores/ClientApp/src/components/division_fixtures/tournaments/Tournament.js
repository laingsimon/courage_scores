import React, {useEffect, useState} from 'react';
import {useParams} from "react-router-dom";
import {DivisionControls} from "../../DivisionControls";
import {ErrorDisplay} from "../../common/ErrorDisplay";
import {any, propChanged, renderDate, sortBy, valueChanged} from "../../../Utilities";
import {Loading} from "../../common/Loading";
import {ShareButton} from "../../ShareButton";
import {TournamentSheet} from "./TournamentSheet";
import {EditTournament} from "./EditTournament";
import {useDependencies} from "../../../IocContainer";
import {useApp} from "../../../AppContainer";
import {Dialog} from "../../common/Dialog";
import {EditPlayerDetails} from "../../division_players/EditPlayerDetails";
import {BootstrapDropdown} from "../../common/BootstrapDropdown";

export function Tournament() {
    const { tournamentId } = useParams();
    const { appLoading, account, seasons, onError, teams, reloadTeams, divisions } = useApp();
    const { divisionApi, tournamentApi } = useDependencies();
    const canManageGames = account && account.access && account.access.manageGames;
    const canManagePlayers = account && account.access && account.access.managePlayers;
    const [loading, setLoading] = useState('init');
    const [disabled, setDisabled] = useState(false);
    const [saving, setSaving] = useState(false);
    const [canSave, setCanSave] = useState(true);
    const [tournamentData, setTournamentData] = useState(null);
    const [season, setSeason] = useState(null);
    const [saveError, setSaveError] = useState(null);
    const [allPlayers, setAllPlayers] = useState([]);
    const [alreadyPlaying, setAlreadyPlaying] = useState(null);
    const [ addPlayerDialogOpen, setAddPlayerDialogOpen ] = useState(false);
    const [ newPlayerDetails, setNewPlayerDetails ] = useState(null);
    const division = tournamentData && tournamentData.divisionId ? divisions.filter(d => d.id === tournamentData.divisionId)[0] : null;

    useEffect(() => {
        const isAdmin = (account && account.access && account.access.manageScores);
        setDisabled(!isAdmin || false);
        setCanSave(isAdmin || false);
    }, [account]);

    useEffect(() => {
            if (loading !== 'init') {
                return;
            }

            if (!appLoading && seasons.length) {
                setLoading('loading');
                // noinspection JSIgnoredPromiseFromCall
                loadFixtureData();
            }
        },
        // eslint-disable-next-line
        [ appLoading, loading, seasons ]);

    async function loadFixtureData() {
        try {
            const tournamentData = await tournamentApi.get(tournamentId);

            if (!tournamentData) {
                onError('Tournament could not be found');
                return;
            }

            setTournamentData(tournamentData);

            const season = seasons[tournamentData.seasonId];
            if (!season) {
                // noinspection ExceptionCaughtLocallyJS
                throw new Error('Could not find the season for this tournament');
            }

            const allPlayers = getAllPlayers(tournamentData, teams);
            const anyDivisionId = '00000000-0000-0000-0000-000000000000';
            const divisionData = await divisionApi.data(anyDivisionId, tournamentData.seasonId);
            const fixtureDate = divisionData.fixtures.filter(f => f.date === tournamentData.date)[0];
            const tournamentPlayerIds = fixtureDate ? fixtureDate.tournamentFixtures.filter(f => !f.proposed && f.id !== tournamentData.id).flatMap(f => f.players) : [];
            allPlayers.sort(sortBy('name'));

            const tournamentPlayerMap = {};
            tournamentPlayerIds.forEach(id => tournamentPlayerMap[id] = {});

            setAlreadyPlaying(tournamentPlayerMap);
            setSeason(season);
            setAllPlayers(allPlayers);
        } catch (e) {
            onError(e);
        } finally {
            setLoading('ready');
        }
    }

    function getAllPlayers(tournamentData) {
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

    function renderCreatePlayerDialog() {
        return (<Dialog title={`Add a player...`}>
            <EditPlayerDetails
                id={null}
                {...newPlayerDetails}
                seasonId={season.id}
                divisionId={tournamentData.divisionId}
                onChange={propChanged(newPlayerDetails, setNewPlayerDetails)}
                onCancel={() => setAddPlayerDialogOpen(false)}
                onSaved={reloadPlayers}
            />
        </Dialog>);
    }

    async function reloadPlayers() {
        await reloadTeams();
        setAddPlayerDialogOpen(false);
    }

    if (loading !== 'ready') {
        return (<Loading />);
    }

    try {
        return (<div>
            <DivisionControls
                originalSeasonData={{
                    id: season.id,
                    name: season.name,
                    startDate: season.startDate.substring(0, 10),
                    endDate: season.endDate.substring(0, 10),
                    divisions: season.divisions
                }}
                originalDivisionData={division
                    ? {
                        id: division.id,
                        name: division.name
                    }
                    : null}
                overrideMode="fixtures"/>
            <div className="light-background p-3">
                {canManageGames
                    ? (<div className="input-group mb-3">
                        <div className="input-group-prepend">
                            <span className="input-group-text">Address</span>
                        </div>
                        <input className="form-control" disabled={saving} type="text" value={tournamentData.address}
                               name="address" onChange={valueChanged(tournamentData, setTournamentData)}/>
                    </div>)
                    : (<p>
                        At <strong>{tournamentData.address}</strong> on <strong>{renderDate(tournamentData.date)}</strong>
                        <span className="margin-left">
                        <ShareButton
                            text={`Courage League: ${tournamentData.address} on ${renderDate(tournamentData.date)}`}/>
                    </span>
                    </p>)}
                {canManageGames
                    ? (<div className="form-group input-group mb-3 d-print-none">
                        <div className="input-group-prepend">
                            <span className="input-group-text">Type (optional)</span>
                        </div>
                        <input id="type-text" className="form-control" disabled={saving}
                               value={tournamentData.type || ''} name="type"
                               onChange={valueChanged(tournamentData, setTournamentData)}/>
                    </div>)
                    : null}
                {canManageGames
                    ? (<div className="form-group input-group mb-3 d-flex">
                        <label htmlFor="note-text" className="input-group-text">Notes</label>
                        <textarea id="note-text" className="form-control" disabled={saving}
                                  value={tournamentData.notes || ''} name="notes"
                                  onChange={valueChanged(tournamentData, setTournamentData)}></textarea>
                    </div>)
                    : tournamentData.notes
                        ? (<div className="alert alert-warning alert-dismissible fade show"
                                role="alert">{tournamentData.notes}</div>)
                        : null}
                {canManageGames
                    ? (<div className="form-group input-group mb-3 d-flex">
                        <div className="form-check form-switch margin-right">
                            <input disabled={saving} type="checkbox" className="form-check-input" name="accoladesQualify" id="accoladesQualify"
                                   checked={tournamentData.accoladesQualify} onChange={valueChanged(tournamentData, setTournamentData)} />
                            <label className="form-check-label" htmlFor="accoladesQualify">Include 180s and Hi-checks in players table?</label>
                        </div>

                        <span className="margin-right">Division:</span>
                        <BootstrapDropdown
                            value={tournamentData.divisionId}
                            onChange={propChanged(tournamentData, setTournamentData, 'divisionId')}
                            options={[ { value: null, text: 'All divisions' } ].concat(divisions.map(d => { return { value: d.id, text: d.name } }))}
                            disabled={saving} />
                    </div>)
                    : null}
                <EditTournament
                    tournamentData={tournamentData}
                    disabled={disabled}
                    saving={saving}
                    allPlayers={allPlayers}
                    season={season}
                    alreadyPlaying={alreadyPlaying}
                    canSave={canSave}
                    setTournamentData={setTournamentData}/>
                <TournamentSheet sides={tournamentData.sides}/>
                {canManageGames ? (<button className="btn btn-primary d-print-none margin-right" onClick={saveTournament}>
                    {saving ? (<span className="spinner-border spinner-border-sm margin-right" role="status"
                                     aria-hidden="true"></span>) : null}
                    Save
                </button>) : null}
                {canManagePlayers ? (<button className="btn btn-primary d-print-none" onClick={() => setAddPlayerDialogOpen(true)}>Add player</button>) : null}
            </div>
            {saveError ? (<ErrorDisplay {...saveError} onClose={() => setSaveError(null)}
                                        title="Could not save tournament details"/>) : null}
            {addPlayerDialogOpen ? renderCreatePlayerDialog() : null}
        </div>);
    } catch (e) {
        onError(e);
    }
}
