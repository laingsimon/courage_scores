import React, {useEffect, useState} from 'react';
import {useParams} from "react-router-dom";
import {DivisionControls} from "../league/DivisionControls";
import {ErrorDisplay} from "../common/ErrorDisplay";
import {any, sortBy} from "../../helpers/collections";
import {propChanged} from "../../helpers/events";
import {Loading} from "../common/Loading";
import {EditTournament} from "./EditTournament";
import {useDependencies} from "../common/IocContainer";
import {useApp} from "../common/AppContainer";
import {Dialog} from "../common/Dialog";
import {EditPlayerDetails} from "../division_players/EditPlayerDetails";
import {EMPTY_ID} from "../../helpers/projection";
import {TournamentContainer} from "./TournamentContainer";
import {SuperLeaguePrintout} from "./superleague/SuperLeaguePrintout";
import {PrintableSheet} from "./PrintableSheet";
import {LoadingSpinnerSmall} from "../common/LoadingSpinnerSmall";
import {TournamentGameDto} from "../../interfaces/models/dtos/Game/TournamentGameDto";
import {IClientActionResultDto} from "../common/IClientActionResultDto";
import {DivisionDataDto} from "../../interfaces/models/dtos/Division/DivisionDataDto";
import {DivisionFixtureDateDto} from "../../interfaces/models/dtos/Division/DivisionFixtureDateDto";
import {TournamentPlayerDto} from "../../interfaces/models/dtos/Game/TournamentPlayerDto";
import {TournamentSideDto} from "../../interfaces/models/dtos/Game/TournamentSideDto";
import {TeamDto} from "../../interfaces/models/dtos/Team/TeamDto";
import {GameMatchOptionDto} from "../../interfaces/models/dtos/Game/GameMatchOptionDto";
import {SeasonDto} from "../../interfaces/models/dtos/Season/SeasonDto";
import {DivisionDto} from "../../interfaces/models/dtos/DivisionDto";
import {EditTeamPlayerDto} from "../../interfaces/models/dtos/Team/EditTeamPlayerDto";
import {ILiveOptions} from "../../live/ILiveOptions";
import {ISelectablePlayer} from "../common/PlayerSelection";
import {PatchTournamentDto} from "../../interfaces/models/dtos/Game/PatchTournamentDto";
import {PatchTournamentRoundDto} from "../../interfaces/models/dtos/Game/PatchTournamentRoundDto";
import {TeamPlayerDto} from "../../interfaces/models/dtos/Team/TeamPlayerDto";
import {TeamSeasonDto} from "../../interfaces/models/dtos/Team/TeamSeasonDto";
import {DivisionDataFilter} from "../../interfaces/models/dtos/Division/DivisionDataFilter";
import {EditTournamentGameDto} from "../../interfaces/models/dtos/Game/EditTournamentGameDto";
import {TournamentDetails} from "./TournamentDetails";
import {TournamentRoundDto} from "../../interfaces/models/dtos/Game/TournamentRoundDto";

export interface ITournamentPlayerMap {
    [id: string]: {};
}

export function Tournament() {
    const {tournamentId} = useParams();
    const {appLoading, account, seasons, onError, teams, reloadTeams, divisions} = useApp();
    const {divisionApi, tournamentApi, webSocket} = useDependencies();
    const canManageTournaments: boolean = account && account.access && account.access.manageTournaments;
    const canManagePlayers: boolean = account && account.access && account.access.managePlayers;
    const canEnterTournamentResults = account && account.access && account.access.enterTournamentResults;
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
    const [editTournament, setEditTournament] = useState<string>(null);

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
                .flatMap((side: TournamentSideDto) => side.players || [])
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
            .map((t: TeamDto) => t.seasons.filter((ts: TeamSeasonDto) => ts.seasonId === tournamentData.seasonId && !ts.deleted)[0])
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

    async function updateTournamentData(newData: TournamentGameDto) {
        try {
            const matchOptionsHaveChanged = tournamentData && tournamentData.bestOf !== newData.bestOf;
            if (matchOptionsHaveChanged && newData.round) {
                updateMatchOptions(newData.round, newData.bestOf);
            }

            setTournamentData(newData);
            setAllPlayers(getAllPlayers(newData));
        } catch (e) {
            onError(e);
        }
    }

    function updateMatchOptions(round: TournamentRoundDto, numberOfLegs: number) {
        round.matchOptions.forEach((matchOptions: GameMatchOptionDto) => {
            matchOptions.numberOfLegs = numberOfLegs;
        });

        if (round.nextRound) {
            updateMatchOptions(round.nextRound, numberOfLegs);
        }
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
            {canManageTournaments && tournamentData && editTournament === 'details'
                ? (<Dialog onClose={async () => setEditTournament(null)}>
                    <TournamentDetails
                        tournamentData={tournamentData}
                        disabled={saving}
                        setTournamentData={async (data: TournamentGameDto) => updateTournamentData(data)} />
                </Dialog>)
                : null}
            {tournamentData ? (<div className="content-background p-3">
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
                    saving={saving}
                    editTournament={editTournament}
                    setEditTournament={canManageTournaments ? async (value: string) => setEditTournament(value) : null}
                    liveOptions={liveOptions}>
                    {canManageTournaments && tournamentData.singleRound ? (<EditTournament canSave={true} saving={saving} />) : null}
                    {tournamentData.singleRound && !canManageTournaments ? (<SuperLeaguePrintout division={division} readOnly={true}/>) : null}
                    {tournamentData.singleRound && canManageTournaments ? (<div>
                        <SuperLeaguePrintout division={division} patchData={applyPatch} />
                    </div>) : null}
                    {tournamentData.singleRound
                        ? null
                        : (<PrintableSheet
                            printOnly={false}
                            patchData={applyPatch}
                            editable={canEnterTournamentResults || canManageTournaments} />)}
                </TournamentContainer>
                {canManageTournaments || canEnterTournamentResults ? (
                    <button className="btn btn-primary d-print-none margin-right" onClick={saveTournament}>
                        {saving ? (<LoadingSpinnerSmall/>) : null}
                        Save
                    </button>) : null}
                {canManagePlayers ? (
                    <button className="btn btn-primary d-print-none margin-right" onClick={() => setAddPlayerDialogOpen(true)}>Add
                        player</button>) : null}
                {canManageTournaments && tournamentData.singleRound
                    ? (<button className="btn btn-primary d-print-none margin-right" onClick={() => setEditTournament('details')}>
                        Edit
                    </button>) : null}
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
