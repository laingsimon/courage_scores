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
import {LiveDataType} from "../../interfaces/models/dtos/Live/LiveDataType";
import {PhotoManager} from "../common/PhotoManager";
import {UploadPhotoDto} from "../../interfaces/models/dtos/UploadPhotoDto";
import {ConfiguredFeatureDto} from "../../interfaces/models/dtos/ConfiguredFeatureDto";
import {
    DivisionTournamentFixtureDetailsDto
} from "../../interfaces/models/dtos/Division/DivisionTournamentFixtureDetailsDto";
import {useBranding} from "../common/BrandingContainer";
import {renderDate} from "../../helpers/rendering";

export interface ITournamentPlayerMap {
    [id: string]: DivisionTournamentFixtureDetailsDto;
}

export function Tournament() {
    const {tournamentId} = useParams();
    const {appLoading, account, seasons, onError, teams, reloadTeams, divisions} = useApp();
    const {divisionApi, tournamentApi, webSocket, featureApi} = useDependencies();
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
    const [warnBeforeEditDialogClose, setWarnBeforeEditDialogClose] = useState(null);
    const division: DivisionDto = tournamentData && tournamentData.divisionId ? divisions.filter(d => d.id === tournamentData.divisionId)[0] : null;
    const [editTournament, setEditTournament] = useState<string>(null);
    const [showPhotoManager, setShowPhotoManager] = useState(false);
    const [photosEnabled, setPhotosEnabled] = useState(false);
    const {setTitle} = useBranding();

    useEffect(() => {
        featureApi.getFeatures().then(features => {
            const feature: ConfiguredFeatureDto = features.filter(f => f.id === 'af2ef520-8153-42b0-9ef4-d8419daebc23')[0];
            const featureEnabled = feature && (feature.configuredValue || feature.defaultValue) === 'true';
            setPhotosEnabled(featureEnabled);
        });
    },
    // eslint-disable-next-line
    []);

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
                    divisionId: [ tournamentData.divisionId ].filter((id: string) => !!id),
                };

                const divisionData: DivisionDataDto = await divisionApi.data(filter);
                const fixtureDate: DivisionFixtureDateDto = divisionData.fixtures.filter(f => f.date === tournamentData.date)[0];
                if (fixtureDate) {
                    const tournamentFixtures: DivisionTournamentFixtureDetailsDto[] = fixtureDate.tournamentFixtures
                        .filter((f: DivisionTournamentFixtureDetailsDto) => !f.proposed && f.id !== tournamentData.id);
                    tournamentFixtures.forEach((tournamentFixture: DivisionTournamentFixtureDetailsDto) => {
                        tournamentFixture.players.forEach((playerId: string) => {
                            tournamentPlayerMap[playerId] = tournamentFixture;
                        });
                    });
                }
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
            if (!await webSocket.publish(tournamentId, LiveDataType.tournament, data)) {
                window.alert('Unable to publish updated data');
            }
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

    async function uploadPhotos(file: File): Promise<boolean> {
        const request: UploadPhotoDto = {
            id: tournamentData.id,
        };
        const result: IClientActionResultDto<TournamentGameDto> = await tournamentApi.uploadPhoto(request, file);

        if (result.success) {
            await updateTournamentData(result.result);
            return true;
        }

        setSaveError(result);
        return false;
    }

    async function deletePhotos(id: string): Promise<boolean> {
        const result: IClientActionResultDto<TournamentGameDto> = await tournamentApi.deletePhoto(tournamentData.id, id);

        if (result.success) {
            await updateTournamentData(result.result);
            return true;
        }

        setSaveError(result);
        return false;
    }

    async function closeEditTournamentDialog() {
        // if any matches exist, but have not been added, add them?
        if (warnBeforeEditDialogClose) {
            window.alert(warnBeforeEditDialogClose);
            return;
        }

        setEditTournament(null);
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

        if (tournamentData && tournamentData.singleRound) {
            setTitle(`${tournamentData.host} vs ${tournamentData.opponent} - ${renderDate(tournamentData.date)}`);
        } else if (tournamentData) {
            setTitle(`${tournamentData.type} at ${tournamentData.address} - ${renderDate(tournamentData.date)}`);
        }

        return (<div>
            <DivisionControls
                originalSeasonData={season}
                originalDivisionData={division}
                overrideMode="fixtures"/>
            {canManageTournaments && tournamentData && editTournament === 'details'
                ? (<Dialog onClose={async () => setEditTournament(null)} className="d-print-none">
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
                    setWarnBeforeEditDialogClose={async (warning: string) => setWarnBeforeEditDialogClose(warning)}
                    matchOptionDefaults={getMatchOptionDefaults(tournamentData)}
                    saving={saving}
                    editTournament={editTournament}
                    setEditTournament={canManageTournaments ? async (value: string) => setEditTournament(value) : null}
                    liveOptions={liveOptions}>
                    {canManageTournaments && tournamentData && editTournament === 'matches'
                        ? (<Dialog title="Edit sides and matches" onClose={closeEditTournamentDialog} className="d-print-none">
                            <EditTournament canSave={true} saving={saving} />
                        </Dialog>)
                        : null}
                    {tournamentData.singleRound && !canManageTournaments ? (<SuperLeaguePrintout division={division} readOnly={true}/>) : null}
                    {tournamentData.singleRound && canManageTournaments ? (<div>
                        <SuperLeaguePrintout division={division} patchData={applyPatch} />
                    </div>) : null}
                    {tournamentData.singleRound
                        ? null
                        : (<PrintableSheet
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
                {account && account.access && (account.access.uploadPhotos || account.access.viewAnyPhoto) && photosEnabled
                    ? (<button className="btn btn-primary d-print-none margin-right" onClick={() => setShowPhotoManager(true)}>📷 Photos</button>)
                    : null}
            </div>) : (<div>Tournament not found</div>)}
            {showPhotoManager ? (<PhotoManager
                doUpload={uploadPhotos}
                photos={tournamentData.photos}
                onClose={async () => setShowPhotoManager(false)}
                doDelete={deletePhotos}
                canUploadPhotos={account && account.access && account.access.uploadPhotos}
                canDeletePhotos={account && account.access && (account.access.uploadPhotos || account.access.deleteAnyPhoto)}
                canViewAllPhotos={account && account.access && account.access.viewAnyPhoto}
            />) : null}
            {saveError ? (<ErrorDisplay {...saveError} onClose={async () => setSaveError(null)}
                                        title="Could not save tournament details"/>) : null}
            {addPlayerDialogOpen ? renderCreatePlayerDialog(season) : null}
        </div>);
    } catch (e) {
        /* istanbul ignore next */
        onError(e);
    }
}
