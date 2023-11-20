import React, {useEffect, useState} from 'react';
import {useParams} from "react-router-dom";
import {DivisionControls} from "../../DivisionControls";
import {ErrorDisplay} from "../../common/ErrorDisplay";
import {any, distinct, sortBy} from "../../../helpers/collections";
import {propChanged, valueChanged} from "../../../helpers/events";
import {renderDate} from "../../../helpers/rendering";
import {Loading} from "../../common/Loading";
import {EditTournament} from "./EditTournament";
import {useDependencies} from "../../../IocContainer";
import {useApp} from "../../../AppContainer";
import {Dialog} from "../../common/Dialog";
import {EditPlayerDetails} from "../../division_players/EditPlayerDetails";
import {BootstrapDropdown} from "../../common/BootstrapDropdown";
import {EMPTY_ID} from "../../../helpers/projection";
import {TournamentContainer} from "./TournamentContainer";
import {SuperLeaguePrintout} from "./superleague/SuperLeaguePrintout";
import {ExportDataButton} from "../../common/ExportDataButton";
import {PrintableSheet} from "./PrintableSheet";
import {LoadingSpinnerSmall} from "../../common/LoadingSpinnerSmall";

export function Tournament() {
    const {tournamentId} = useParams();
    const {appLoading, account, seasons, onError, teams, reloadTeams, divisions} = useApp();
    const {divisionApi, tournamentApi, webSocket} = useDependencies();
    const canManageTournaments = account && account.access && account.access.manageTournaments;
    const canManagePlayers = account && account.access && account.access.managePlayers;
    const [loading, setLoading] = useState('init');
    const [disabled, setDisabled] = useState(false);
    const [saving, setSaving] = useState(false);
    const [patching, setPatching] = useState(false);
    const [canSave, setCanSave] = useState(true);
    const [tournamentData, setTournamentData] = useState(null);
    const [saveError, setSaveError] = useState(null);
    const [allPlayers, setAllPlayers] = useState([]);
    const [alreadyPlaying, setAlreadyPlaying] = useState(null);
    const [addPlayerDialogOpen, setAddPlayerDialogOpen] = useState(false);
    const [newPlayerDetails, setNewPlayerDetails] = useState({name: '', captain: false});
    const [warnBeforeSave, setWarnBeforeSave] = useState(null);
    const division = tournamentData && tournamentData.divisionId ? divisions.filter(d => d.id === tournamentData.divisionId)[0] : null;
    const genderOptions = [
        {text: <>&nbsp;</>, value: null},
        {text: 'Men', value: 'men'},
        {text: 'Women',value: 'women'}
    ];

    useEffect(() => {
        const isAdmin = (account && account.access && account.access.manageTournaments);
        setDisabled(!isAdmin || false);
        setCanSave(isAdmin || false);
    }, [account]);

    useEffect(() => {
            /* istanbul ignore next */
            if (loading !== 'init' || appLoading) {
                /* istanbul ignore next */
                return;
            }

            if (seasons.length) {
                setLoading('loading');
                // noinspection JSIgnoredPromiseFromCall
                loadFixtureData();
            } else {
                onError('No seasons found');
            }
        },
        // eslint-disable-next-line
        [appLoading, loading, seasons]);

    async function loadFixtureData() {
        try {
            const tournamentData = await tournamentApi.get(tournamentId);

            if (!tournamentData) {
                onError('Tournament could not be found');
                return;
            }

            updateTournamentData(tournamentData);

            const tournamentPlayerMap = {};
            if (canManageTournaments) {
                const divisionData = await divisionApi.data(EMPTY_ID, tournamentData.seasonId);
                const fixtureDate = divisionData.fixtures.filter(f => f.date === tournamentData.date)[0];
                const tournamentPlayerIds = fixtureDate ? fixtureDate.tournamentFixtures.filter(f => !f.proposed && f.id !== tournamentData.id).flatMap(f => f.players) : [];
                tournamentPlayerIds.forEach(id => tournamentPlayerMap[id] = {});
            }
            setAlreadyPlaying(tournamentPlayerMap);
        } catch (e) {
            /* istanbul ignore next */
            onError(e);
        } finally {
            setLoading('ready');
        }
    }

    function getMatchOptionDefaults(tournamentData) {
        return {
            startingScore: 501,
            numberOfLegs: tournamentData.bestOf || 5,
        };
    }

    function getAllPlayers(tournamentData) {
        const selectedTournamentPlayers = tournamentData.sides
            ? tournamentData.sides.filter(s => !s.noShow).flatMap(side => side.players)
            : [];

        if (any(selectedTournamentPlayers)) {
            return selectedTournamentPlayers.sort(sortBy('name'));
        }

        const selectedTournamentTeams = tournamentData.sides
            ? tournamentData.sides.filter(s => !s.noShow).map(side => side.teamId)
            : [];

        const players = teams
            .filter(t => any(selectedTournamentTeams, id => id === t.id))
            .map(t => {
                return {
                    teamSeason: t.seasons.filter(ts => ts.seasonId === tournamentData.seasonId)[0],
                    divisionId: t.divisionId
                };
            })
            .filter(mapping => mapping.teamSeason)
            .flatMap(mapping => mapping.teamSeason.players.map(p => {
                return Object.assign({}, p, {divisionId: mapping.divisionId});
            }));

        return players.sort(sortBy('name'));
    }

    async function saveTournament(preventLoading) {
        /* istanbul ignore next */
        if (saving || patching) {
            /* istanbul ignore next */
            return;
        }

        // if any matches exist, but have not been added, add them?
        if (warnBeforeSave) {
            window.alert(warnBeforeSave);
            return;
        }

        if (preventLoading !== true) {
            setSaving(true);
        }

        try {
            const response = await tournamentApi.update(tournamentData, tournamentData.updated);
            if (!response.success) {
                setSaveError(response);
            } else {
                updateTournamentData(response.result);
                await publishLiveUpdate(response.result);
                return response.result;
            }
        } finally {
            if (preventLoading !== true) {
                setSaving(false);
            }
        }
    }

    async function applyPatch(patch, nestInRound) {
        /* istanbul ignore next */
        if (saving || patching) {
            /* istanbul ignore next */
            return;
        }

        setPatching(true);

        try {
            const response = await tournamentApi.patch(tournamentId, nestInRound ? {round: patch} : patch);
            if (!response.success) {
                setSaveError(response);
            } else {
                updateTournamentData(response.result);
                await publishLiveUpdate(response.result);
            }
        } finally {
            setPatching(false);
        }
    }

    async function publishLiveUpdate(data) {
        if (canSave) {
            await webSocket.publish(tournamentId, data);
        }
    }

    function renderCreatePlayerDialog(season) {
        return (<Dialog title={`Add a player...`}>
            <EditPlayerDetails
                id={null}
                player={newPlayerDetails}
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
        setNewPlayerDetails({name: '', captain: false});
    }

    function getExportTables() {
        let saygDataIds = [];
        let teamIds = [];
        let round = tournamentData.round;
        while (round) {
            saygDataIds = saygDataIds.concat(round.matches.map(m => m.saygId).filter(id => id));
            round = round.nextRound;
        }

        const exportRequest = {
            tournamentGame: [tournamentId],
            season: [tournamentData.seasonId],
        };

        if (tournamentData.divisionId) {
            exportRequest.division = [tournamentData.divisionId];
        }

        for (let i = 0; i < tournamentData.sides.length; i++) {
            const side = tournamentData.sides[i];

            if (side.teamId) {
                teamIds = teamIds.concat([side.teamId]);
            } else if (any(side.players || [])) {
                // get the team ids for the players
                // find the teamId for each player
                teamIds = teamIds.concat(side.players.map(getTeamIdForPlayer));
            }
        }

        if (any(saygDataIds)) {
            exportRequest.recordedScoreAsYouGo = saygDataIds;
        }

        teamIds = distinct(teamIds.filter(id => id));
        if (any(teamIds)) {
            exportRequest.team = teamIds;
        }

        return exportRequest;
    }

    function getTeamIdForPlayer(player) {
        const teamToSeasonMaps = teams.map(t => {
            return {teamSeason: t.seasons.filter(ts => ts.seasonId === tournamentData.seasonId)[0], team: t}
        });
        const teamsWithPlayer = teamToSeasonMaps.filter(map => map.teamSeason && any(map.teamSeason.players, p => p.id === player.id));

        if (any(teamsWithPlayer)) {
            return teamsWithPlayer[0].team.id
        }

        return null;
    }

    function updateTournamentData(newData) {
        setTournamentData(newData);
        setAllPlayers(getAllPlayers(newData));
    }

    if (loading !== 'ready') {
        return (<Loading/>);
    }

    try {
        const season = tournamentData ? seasons[tournamentData.seasonId] : {id: EMPTY_ID, name: 'Not found'};
        if (!season) {
            // noinspection ExceptionCaughtLocallyJS
            throw new Error('Could not find the season for this tournament');
        }

        const liveOptions = {
            publish: canSave,
            canSubscribe: false,
            subscribeAtStartup: [],
        };

        return (<div>
            <DivisionControls
                originalSeasonData={season}
                originalDivisionData={division}
                overrideMode="fixtures"/>
            {tournamentData ? (<div className="content-background p-3">
                {canManageTournaments ? (<h4 className="pb-2 d-print-none">
                    <span>Edit tournament: </span>
                    <span className="me-4">{renderDate(tournamentData.date)}</span>
                    <button className="btn btn-sm margin-left btn-outline-primary margin-right"
                            onClick={window.print}>🖨️
                    </button>
                    <ExportDataButton tables={getExportTables()}/>
                </h4>) : null}
                {canManageTournaments
                    ? (<div className="input-group mb-1 d-print-none">
                        <div className="input-group-prepend">
                            <label htmlFor="address" className="input-group-text width-75">Address</label>
                        </div>
                        <input id="address" className="form-control" disabled={saving} type="text" value={tournamentData.address}
                               name="address" onChange={valueChanged(tournamentData, setTournamentData)} />
                    </div>)
                    : null}
                {canManageTournaments
                    ? (<div className="form-group input-group mb-1 d-print-none">
                        <div className="input-group-prepend">
                            <label htmlFor="type" className="input-group-text width-75">Type</label>
                        </div>
                        <input id="type" className="form-control" disabled={saving}
                               value={tournamentData.type || ''} name="type"
                               onChange={valueChanged(tournamentData, setTournamentData)}
                               placeholder="Optional type for the tournament" />

                        <div className="form-check form-switch my-1 ms-2">
                            <input disabled={saving} type="checkbox" className="form-check-input margin-left" name="singleRound"
                                   id="singleRound"
                                   checked={tournamentData.singleRound}
                                   onChange={valueChanged(tournamentData, setTournamentData)} />
                            <label className="form-check-label" htmlFor="singleRound">Super league</label>
                        </div>
                    </div>)
                    : null}
                {canManageTournaments
                    ? (<div className="form-group input-group mb-1 d-print-none">
                        <label htmlFor="note-text" className="input-group-text width-75">Notes</label>
                        <textarea id="note-text" className="form-control" disabled={saving}
                                  value={tournamentData.notes || ''} name="notes"
                                  onChange={valueChanged(tournamentData, setTournamentData)}
                                  placeholder="Notes for the tournament">
                        </textarea>
                    </div>)
                    : null}
                {canManageTournaments
                    ? (<div className="form-group input-group mb-3 d-print-none" datatype="tournament-options">
                        <label className="input-group-text width-75">Options</label>
                        <div className="form-control">
                            <div className="form-check form-switch margin-right my-1">
                                <input disabled={saving} type="checkbox" className="form-check-input"
                                       name="accoladesCount" id="accoladesCount"
                                       checked={tournamentData.accoladesCount}
                                       onChange={valueChanged(tournamentData, setTournamentData)}/>
                                <label className="form-check-label" htmlFor="accoladesCount">Include 180s and Hi-checks
                                    in players table?</label>
                            </div>

                            <div className="input-group mb-1" datatype="tournament-division">
                                <label className="input-group-text">Division</label>
                                <BootstrapDropdown
                                    value={tournamentData.divisionId}
                                    onChange={propChanged(tournamentData, setTournamentData, 'divisionId')}
                                    options={[{value: null, text: 'All divisions'}].concat(divisions.map(d => {
                                        return {value: d.id, text: d.name}
                                    }))}
                                    disabled={saving} className="margin-right" />

                                <label htmlFor="bestOf" className="input-group-text">Best of</label>
                                <input disabled={saving} className="form-control no-spinner width-50 d-inline"
                                       id="bestOf" type="number" min="3" value={tournamentData.bestOf || ''}
                                       name="bestOf" onChange={valueChanged(tournamentData, setTournamentData, '')}
                                       placeholder="Number of legs" />
                            </div>

                            {tournamentData.singleRound
                                ? (<>
                                    <div className="input-group mb-1" datatype="superleague-host">
                                        <label htmlFor="host" className="input-group-text">Host</label>
                                        <input id="host" className="form-control margin-right" disabled={saving}
                                               value={tournamentData.host || ''} name="host"
                                               onChange={valueChanged(tournamentData, setTournamentData)}
                                               placeholder="Host name" />

                                        <label htmlFor="opponent" className="input-group-text">vs</label>
                                        <input id="opponent" className="form-control" disabled={saving}
                                               value={tournamentData.opponent || ''} name="opponent"
                                               onChange={valueChanged(tournamentData, setTournamentData)}
                                               placeholder="Opponent name" />
                                    </div>

                                    <div className="input-group mb-1" datatype="superleague-gender">
                                        <label htmlFor="gender" className="input-group-text width-75">Gender</label>
                                        <BootstrapDropdown
                                            value={tournamentData.gender}
                                            onChange={propChanged(tournamentData, setTournamentData, 'gender')}
                                            options={genderOptions}
                                            disabled={saving}/>
                                    </div></>)
                                : null}
                        </div>
                    </div>)
                    : null}
                <TournamentContainer
                    tournamentData={tournamentData}
                    setTournamentData={updateTournamentData}
                    season={season}
                    division={division}
                    alreadyPlaying={alreadyPlaying}
                    allPlayers={allPlayers}
                    saveTournament={saveTournament}
                    setWarnBeforeSave={setWarnBeforeSave}
                    matchOptionDefaults={getMatchOptionDefaults(tournamentData)}
                    liveOptions={liveOptions}>
                    {canSave ? (<EditTournament disabled={disabled} canSave={canSave} saving={saving}
                                                applyPatch={applyPatch}/>) : null}
                    {tournamentData.singleRound && !canSave ? (<SuperLeaguePrintout division={division}/>) : null}
                    {tournamentData.singleRound && canSave ? (
                        <div className="d-screen-none"><SuperLeaguePrintout division={division}/></div>) : null}
                    {!tournamentData.singleRound ? (<PrintableSheet printOnly={canSave}/>) : null}
                </TournamentContainer>
                {canManageTournaments ? (
                    <button className="btn btn-primary d-print-none margin-right" onClick={saveTournament}>
                        {saving ? (<LoadingSpinnerSmall/>) : null}
                        Save
                    </button>) : null}
                {canManagePlayers ? (
                    <button className="btn btn-primary d-print-none" onClick={() => setAddPlayerDialogOpen(true)}>Add
                        player</button>) : null}
            </div>) : (<div>Tournament not found</div>)}
            {saveError ? (<ErrorDisplay {...saveError} onClose={() => setSaveError(null)}
                                        title="Could not save tournament details"/>) : null}
            {addPlayerDialogOpen ? renderCreatePlayerDialog(season) : null}
        </div>);
    } catch (e) {
        /* istanbul ignore next */
        onError(e);
    }
}
