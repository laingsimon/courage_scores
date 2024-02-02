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
import {BootstrapDropdown, IBootstrapDropdownItem} from "../../common/BootstrapDropdown";
import {EMPTY_ID} from "../../../helpers/projection";
import {TournamentContainer} from "./TournamentContainer";
import {SuperLeaguePrintout} from "./superleague/SuperLeaguePrintout";
import {ExportDataButton} from "../../common/ExportDataButton";
import {PrintableSheet} from "./PrintableSheet";
import {LoadingSpinnerSmall} from "../../common/LoadingSpinnerSmall";
import {TournamentGameDto} from "../../../interfaces/models/dtos/Game/TournamentGameDto";
import {IClientActionResultDto} from "../../../interfaces/IClientActionResultDto";
import {DivisionDataDto} from "../../../interfaces/models/dtos/Division/DivisionDataDto";
import {DivisionFixtureDateDto} from "../../../interfaces/models/dtos/Division/DivisionFixtureDateDto";
import {TournamentPlayerDto} from "../../../interfaces/models/dtos/Game/TournamentPlayerDto";
import {TournamentSideDto} from "../../../interfaces/models/dtos/Game/TournamentSideDto";
import {TeamDto} from "../../../interfaces/models/dtos/Team/TeamDto";
import {GameMatchOptionDto} from "../../../interfaces/models/dtos/Game/GameMatchOptionDto";
import {SeasonDto} from "../../../interfaces/models/dtos/Season/SeasonDto";
import {DivisionDto} from "../../../interfaces/models/dtos/DivisionDto";
import {EditTeamPlayerDto} from "../../../interfaces/models/dtos/Team/EditTeamPlayerDto";
import {ILiveOptions} from "../../../interfaces/ILiveOptions";
import {ISelectablePlayer} from "../../division_players/PlayerSelection";
import {PatchTournamentDto} from "../../../interfaces/models/dtos/Game/PatchTournamentDto";
import {PatchTournamentRoundDto} from "../../../interfaces/models/dtos/Game/PatchTournamentRoundDto";
import {TeamPlayerDto} from "../../../interfaces/models/dtos/Team/TeamPlayerDto";
import {TeamSeasonDto} from "../../../interfaces/models/dtos/Team/TeamSeasonDto";
import {TournamentMatchDto} from "../../../interfaces/models/dtos/Game/TournamentMatchDto";
import {DivisionDataFilter} from "../../../interfaces/models/dtos/Division/DivisionDataFilter";
import {EditTournamentGameDto} from "../../../interfaces/models/dtos/Game/EditTournamentGameDto";

export interface ITournamentPlayerMap {
    [id: string]: {};
}

export function Tournament() {
    const {tournamentId} = useParams();
    const {appLoading, account, seasons, onError, teams, reloadTeams, divisions} = useApp();
    const {divisionApi, tournamentApi, webSocket} = useDependencies();
    const canManageTournaments: boolean = account && account.access && account.access.manageTournaments;
    const canManagePlayers: boolean = account && account.access && account.access.managePlayers;
    const [loading, setLoading] = useState<string>('init');
    const [saving, setSaving] = useState<boolean>(false);
    const [patching, setPatching] = useState<boolean>(false);
    const [tournamentData, setTournamentData] = useState<TournamentGameDto | null>(null);
    const [saveError, setSaveError] = useState<IClientActionResultDto<TournamentGameDto> | null>(null);
    const [allPlayers, setAllPlayers] = useState<ISelectablePlayer[]>([]);
    const [alreadyPlaying, setAlreadyPlaying] = useState<ITournamentPlayerMap | null>(null);
    const [addPlayerDialogOpen, setAddPlayerDialogOpen] = useState<boolean>(false);
    const [newPlayerDetails, setNewPlayerDetails] = useState<EditTeamPlayerDto>({name: '', captain: false});
    const [warnBeforeSave, setWarnBeforeSave] = useState(null);
    const division: DivisionDto = tournamentData && tournamentData.divisionId ? divisions.filter(d => d.id === tournamentData.divisionId)[0] : null;
    const genderOptions: IBootstrapDropdownItem[] = [
        {text: <>&nbsp;</>, value: null},
        {text: 'Men', value: 'men'},
        {text: 'Women',value: 'women'}
    ];

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
            const tournamentData: TournamentGameDto = await tournamentApi.get(tournamentId);

            if (!tournamentData) {
                onError('Tournament could not be found');
                return;
            }

            await updateTournamentData(tournamentData);

            const tournamentPlayerMap: ITournamentPlayerMap = {};
            if (canManageTournaments) {
                const filter: DivisionDataFilter = {
                    seasonId: tournamentData.seasonId,
                };

                const divisionData: DivisionDataDto = await divisionApi.data(EMPTY_ID, filter);
                const fixtureDate: DivisionFixtureDateDto = divisionData.fixtures.filter(f => f.date === tournamentData.date)[0];
                const tournamentPlayerIds: string[] = fixtureDate ? fixtureDate.tournamentFixtures.filter(f => !f.proposed && f.id !== tournamentData.id).flatMap(f => f.players) : [];
                tournamentPlayerIds.forEach((id: string) => tournamentPlayerMap[id] = {});
            }
            setAlreadyPlaying(tournamentPlayerMap);
        } catch (e) {
            /* istanbul ignore next */
            onError(e);
        } finally {
            setLoading('ready');
        }
    }

    function getMatchOptionDefaults(tournamentData: TournamentGameDto): GameMatchOptionDto {
        return {
            startingScore: 501,
            numberOfLegs: tournamentData.bestOf || 5,
        };
    }

    function getAllPlayers(tournamentData: TournamentGameDto): ISelectablePlayer[] {
        const selectedTournamentPlayers: ISelectablePlayer[] = tournamentData.sides
            ? tournamentData.sides
                .filter((s: TournamentSideDto) => !s.noShow)
                .flatMap((side: TournamentSideDto) => side.players)
                .map((p: TournamentPlayerDto) => p as ISelectablePlayer)
            : [];

        if (any(selectedTournamentPlayers)) {
            return selectedTournamentPlayers.sort(sortBy('name'));
        }

        const selectedTournamentTeams: string[] = tournamentData.sides
            ? tournamentData.sides.filter((s: TournamentSideDto) => !s.noShow).map((side: TournamentSideDto) => side.teamId)
            : [];

        const players: ISelectablePlayer[] = teams
            .filter((t: TeamDto) => any(selectedTournamentTeams, (id: string) => id === t.id))
            .map((t: TeamDto) => t.seasons.filter((ts: TeamSeasonDto) => ts.seasonId === tournamentData.seasonId)[0])
            .filter((teamSeasonDto: TeamSeasonDto) => teamSeasonDto)
            .flatMap((teamSeason: TeamSeasonDto) => teamSeason.players.map((p: TeamPlayerDto) => p as ISelectablePlayer));

        return players.sort(sortBy('name'));
    }

    async function saveTournament(preventLoading?: boolean | React.MouseEvent): Promise<TournamentGameDto> {
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
            const update: EditTournamentGameDto = tournamentData;
            update.lastUpdated = tournamentData.updated;

            const response: IClientActionResultDto<TournamentGameDto> = await tournamentApi.update(update);
            if (!response.success) {
                setSaveError(response);
            } else {
                await updateTournamentData(response.result);
                await publishLiveUpdate(response.result);
                return response.result;
            }
        } finally {
            if (preventLoading !== true) {
                setSaving(false);
            }
        }
    }

    async function applyPatch(patch: PatchTournamentDto | PatchTournamentRoundDto, nestInRound: boolean) {
        /* istanbul ignore next */
        if (saving || patching) {
            /* istanbul ignore next */
            return;
        }

        setPatching(true);

        try {
            const response: IClientActionResultDto<TournamentGameDto> = await tournamentApi.patch(
                tournamentId,
                nestInRound ? ({round: patch} as PatchTournamentDto) : patch as PatchTournamentDto);

            if (!response.success) {
                setSaveError(response);
            } else {
                await updateTournamentData(response.result);
                await publishLiveUpdate(response.result);
            }
        } finally {
            setPatching(false);
        }
    }

    async function publishLiveUpdate(data: TournamentGameDto) {
        if (canManageTournaments) {
            await webSocket.publish(tournamentId, data);
        }
    }

    function renderCreatePlayerDialog(season: SeasonDto) {
        return (<Dialog title={`Add a player...`}>
            <EditPlayerDetails
                player={newPlayerDetails}
                seasonId={season.id}
                divisionId={tournamentData.divisionId}
                onChange={propChanged(newPlayerDetails, setNewPlayerDetails)}
                onCancel={async () => setAddPlayerDialogOpen(false)}
                onSaved={reloadPlayers}
            />
        </Dialog>);
    }

    async function reloadPlayers() {
        await reloadTeams();
        setAddPlayerDialogOpen(false);
        setNewPlayerDetails({name: '', captain: false});
    }

    function getExportTables(): { [key: string]: string[] } {
        let saygDataIds = [];
        let teamIds = [];
        let round = tournamentData.round;
        while (round) {
            saygDataIds = saygDataIds.concat(round.matches.map((m: TournamentMatchDto) => m.saygId).filter((id: string) => id));
            round = round.nextRound;
        }

        const exportRequest: { [key: string]: string[] } = {
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

    function getTeamIdForPlayer(player: TournamentPlayerDto) {
        const teamToSeasonMaps = teams.map((t: TeamDto) => {
            return {
                teamSeason: t.seasons.filter(ts => ts.seasonId === tournamentData.seasonId)[0],
                team: t,
            }
        });
        const teamsWithPlayer = teamToSeasonMaps.filter(map => map.teamSeason && any(map.teamSeason.players, (p: TeamPlayerDto) => p.id === player.id));

        if (any(teamsWithPlayer)) {
            return teamsWithPlayer[0].team.id
        }

        return null;
    }

    async function updateTournamentData(newData: TournamentGameDto) {
        setTournamentData(newData);
        setAllPlayers(getAllPlayers(newData));
    }

    if (loading !== 'ready') {
        return (<Loading/>);
    }

    try {
        const season: SeasonDto = tournamentData ? seasons[tournamentData.seasonId] : {id: EMPTY_ID, name: 'Not found'};
        if (!season) {
            // noinspection ExceptionCaughtLocallyJS
            throw new Error('Could not find the season for this tournament');
        }

        const liveOptions: ILiveOptions = {
            publish: canManageTournaments,
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
                    setWarnBeforeSave={async (warning: string) => setWarnBeforeSave(warning)}
                    matchOptionDefaults={getMatchOptionDefaults(tournamentData)}
                    liveOptions={liveOptions}>
                    {canManageTournaments ? (<EditTournament canSave={true} saving={saving} applyPatch={applyPatch}/>) : null}
                    {tournamentData.singleRound && !canManageTournaments ? (<SuperLeaguePrintout division={division}/>) : null}
                    {tournamentData.singleRound && canManageTournaments ? (
                        <div className="d-screen-none"><SuperLeaguePrintout division={division}/></div>) : null}
                    {!tournamentData.singleRound ? (<PrintableSheet printOnly={canManageTournaments}/>) : null}
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
            {saveError ? (<ErrorDisplay {...saveError} onClose={async () => setSaveError(null)}
                                        title="Could not save tournament details"/>) : null}
            {addPlayerDialogOpen ? renderCreatePlayerDialog(season) : null}
        </div>);
    } catch (e) {
        /* istanbul ignore next */
        onError(e);
    }
}
