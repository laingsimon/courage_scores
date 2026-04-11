import { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { MatchPlayerSelection, NEW_PLAYER } from './MatchPlayerSelection';
import { ErrorDisplay } from '../common/ErrorDisplay';
import { DivisionControls } from '../league/DivisionControls';
import { any, elementAt, isEmpty, sortBy } from '../../helpers/collections';
import { asyncCallback, asyncClear, propChanged } from '../../helpers/events';
import { EMPTY_ID, repeat } from '../../helpers/projection';
import { renderDate } from '../../helpers/rendering';
import { Loading } from '../common/Loading';
import { MergeMatch } from './MergeMatch';
import { HiCheckAnd180s } from './HiCheckAnd180s';
import { MergeManOfTheMatch } from './MergeManOfTheMatch';
import { ManOfTheMatchInput } from './ManOfTheMatchInput';
import { MergeHiCheckAnd180s } from './MergeHiCheckAnd180s';
import { ScoreCardHeading } from './ScoreCardHeading';
import { GameDetails } from './GameDetails';
import { add180, addHiCheck } from '../common/Accolades';
import { useDependencies } from '../common/IocContainer';
import { useApp } from '../common/AppContainer';
import { Dialog } from '../common/Dialog';
import { EditPlayerDetails } from '../division_players/EditPlayerDetails';
import {
    ILeagueFixtureContainerProps,
    LeagueFixtureContainer,
} from './LeagueFixtureContainer';
import {
    IMatchTypeContainerProps,
    MatchTypeContainer,
} from './MatchTypeContainer';
import {
    getMatchDefaults,
    getMatchOptionDefaults,
    getMatchOptionsLookup,
    IMatchOptionsLookup,
} from '../../helpers/matchOptions';
import { PageError } from '../common/PageError';
import { LoadingSpinnerSmall } from '../common/LoadingSpinnerSmall';
import { DebugOptions } from '../common/DebugOptions';
import { SeasonDto } from '../../interfaces/models/dtos/Season/SeasonDto';
import { DivisionDto } from '../../interfaces/models/dtos/DivisionDto';
import { TeamDto } from '../../interfaces/models/dtos/Team/TeamDto';
import { GameDto } from '../../interfaces/models/dtos/Game/GameDto';
import { IFailedRequest } from '../common/IFailedRequest';
import { GameMatchDto } from '../../interfaces/models/dtos/Game/GameMatchDto';
import { TeamPlayerDto } from '../../interfaces/models/dtos/Team/TeamPlayerDto';
import { GameMatchOptionDto } from '../../interfaces/models/dtos/Game/GameMatchOptionDto';
import { GameTeamDto } from '../../interfaces/models/dtos/Game/GameTeamDto';
import { IClientActionResultDto } from '../common/IClientActionResultDto';
import { ISelectablePlayer } from '../common/PlayerSelection';
import { RecordScoresDto } from '../../interfaces/models/dtos/Game/RecordScoresDto';
import { PhotoManager } from '../common/PhotoManager';
import { UploadPhotoDto } from '../../interfaces/models/dtos/UploadPhotoDto';
import { useBranding } from '../common/BrandingContainer';
import { NavLink } from '../common/NavLink';
import { hasAccess } from '../../helpers/conditions';
import { getTeamSeasons } from '../../helpers/teams';

export interface ICreatePlayerFor {
    side: string;
    matchIndex?: number;
    index: number;
}

interface IRenamedPlayer {
    renamed?: boolean;
}

interface IEditableMatchPlayer {
    name: string;
    captain?: boolean;
}

type LoadingState = 'init' | 'loading' | 'ready';
type SelectedTeam = TeamPlayerDto & ISelectablePlayer & IRenamedPlayer;
type SelectablePlayer = TeamPlayerDto & ISelectablePlayer & IRenamedPlayer;
const photoFeatureId = 'af2ef520-8153-42b0-9ef4-d8419daebc23';

export function Score() {
    const { fixtureId } = useParams();
    const { gameApi, featureApi } = useDependencies();
    const {
        appLoading,
        account,
        divisions,
        seasons,
        onError,
        teams,
        reloadTeams,
    } = useApp();
    const [loading, setLoading] = useState<LoadingState>('init');
    const [data, setData] = useState<GameDto | null>(null);
    const [fixtureData, setFixtureData] = useState<GameDto | null>(null);
    const [homeTeam, setHomeTeam] = useState<SelectedTeam[]>([]);
    const [awayTeam, setAwayTeam] = useState<SelectedTeam[]>([]);
    const [allPlayers, setAllPlayers] = useState<ISelectablePlayer[]>([]);
    const [saving, setSaving] = useState<boolean>(false);
    const [saveError, setSaveError] = useState<
        IClientActionResultDto<GameDto> | undefined
    >(undefined);
    const [submission, setSubmission] = useState<string | undefined>(undefined);
    const [createPlayerFor, setCreatePlayerFor] =
        useState<ICreatePlayerFor | null>(null);
    const [newPlayerDetails, setNewPlayerDetails] =
        useState<IEditableMatchPlayer>({ name: '' });
    const [showPhotoManager, setShowPhotoManager] = useState<boolean>(false);
    const access = getAccess();
    const [photosEnabled, setPhotosEnabled] = useState<boolean>(false);
    const { setTitle } = useBranding();

    function renderCreatePlayerDialog() {
        const team: GameTeamDto =
            createPlayerFor!.side === 'home'
                ? fixtureData!.home
                : fixtureData!.away;

        async function playerCreated(
            updatedTeamDetails: TeamDto,
            playersCreated: TeamPlayerDto[],
        ) {
            await reloadTeams();

            try {
                if (playersCreated.length > 1) {
                    // multiple players created
                    return;
                }

                const updatedTeamSeason = getTeamSeasons(
                    updatedTeamDetails,
                    fixtureData!.seasonId,
                )[0];
                if (!updatedTeamSeason) {
                    onError('Could not find updated teamSeason');
                    return;
                }

                const newPlayers: TeamPlayerDto[] =
                    updatedTeamSeason.players!.filter(
                        (p: TeamPlayerDto) =>
                            p.name === newPlayerDetails.name.trim(),
                    );
                if (!any(newPlayers)) {
                    onError(
                        `Could not find new player in updated season, looking for player with name: "${newPlayerDetails.name.trim()}"`,
                    );
                    return;
                }

                const newPlayer: TeamPlayerDto = newPlayers[0];
                const match: GameMatchDto =
                    fixtureData!.matches![createPlayerFor!.matchIndex!];
                const newMatch: GameMatchDto = Object.assign({}, match);
                newMatch[createPlayerFor!.side + 'Players'][
                    createPlayerFor!.index
                ] = {
                    id: newPlayer.id,
                    name: newPlayer.name,
                };

                const newFixtureData: GameDto = Object.assign({}, fixtureData);
                fixtureData!.matches![createPlayerFor!.matchIndex!] = newMatch;
                setFixtureData(newFixtureData);
            } catch (e) {
                /* istanbul ignore next */
                onError(e);
            } finally {
                setCreatePlayerFor(null);
                setNewPlayerDetails({ name: '', captain: false });
            }
        }

        return (
            <Dialog title={`Create ${createPlayerFor!.side} player...`}>
                <EditPlayerDetails
                    player={newPlayerDetails}
                    seasonId={fixtureData!.seasonId!}
                    gameId={fixtureData!.id}
                    team={team}
                    divisionId={fixtureData!.divisionId}
                    onChange={propChanged(
                        newPlayerDetails,
                        setNewPlayerDetails,
                    )}
                    onCancel={async () => setCreatePlayerFor(null)}
                    onSaved={playerCreated}
                />
            </Dialog>
        );
    }

    function getAccess(): string {
        if (account && account.access) {
            if (account.access.manageScores) {
                return 'admin';
            } else if (account.teamId) {
                return 'clerk';
            }
        }

        return 'readonly';
    }

    useEffect(
        () => {
            featureApi.getFeatures().then((features) => {
                const photos = features.find((f) => f.id === photoFeatureId);
                const config = photos?.configuredValue || photos?.defaultValue;
                setPhotosEnabled(config === 'true');
            });
        },
        // eslint-disable-next-line
        [],
    );

    useEffect(
        () => {
            /* istanbul ignore next */
            if (loading !== 'init') {
                /* istanbul ignore next */
                return;
            }

            if (appLoading) {
                return;
            }

            if (!seasons || !seasons.length) {
                onError('App has finished loading, no seasons are available');
                return;
            }

            if (!teams || !teams.length) {
                onError('App has finished loading, no teams are available');
                return;
            }

            if (!divisions || !divisions.length) {
                onError('App has finished loading, no divisions are available');
                return;
            }

            setLoading('loading');
            // noinspection JSIgnoredPromiseFromCall
            loadFixtureData();
        },
        // eslint-disable-next-line
        [appLoading, seasons, teams, divisions],
    );

    function loadTeamPlayers(
        teamId: string,
        seasonId: string,
        teamType: string,
        matches: GameMatchDto[],
    ): SelectablePlayer[] | undefined {
        const teamData = teams.find((t: TeamDto) => t.id === teamId);

        if (!teamData) {
            onError(`${teamType} team could not be found - ${teamId}`);
            return;
        }

        if (!teamData.seasons) {
            onError(`${teamType} team has no seasons`);
            return;
        }

        const teamSeason = getTeamSeasons(teamData, seasonId)[0];
        if (!teamSeason) {
            onError(
                `${teamType} team has not registered for this season: ${seasonId}`,
            );
            return;
        }

        const players: SelectablePlayer[] = [...teamSeason.players!]; // copy the players list

        for (const match of matches) {
            const matchPlayers = match[teamType + 'Players'];
            for (const matchPlayer of matchPlayers) {
                const correspondingPlayer = players.find(
                    (p: SelectablePlayer) => p.id === matchPlayer.id,
                );
                if (
                    correspondingPlayer &&
                    correspondingPlayer.name !== matchPlayer.name &&
                    !correspondingPlayer.renamed
                ) {
                    correspondingPlayer.name = `${correspondingPlayer.name} (nee ${matchPlayer.name})`;
                    correspondingPlayer.renamed = true;
                }
                if (correspondingPlayer && correspondingPlayer.captain) {
                    matchPlayer.captain = correspondingPlayer.captain;
                }
            }
        }

        players.sort(sortBy('name'));
        players.push({
            id: NEW_PLAYER,
            name: 'Add a player...',
        });
        return players;
    }

    useEffect(
        () => {
            if (fixtureData && loading !== 'init') {
                loadPlayerData(fixtureData);
            }
        },
        // eslint-disable-next-line
        [teams],
    );

    function loadPlayerData(gameData: GameDto) {
        const homeTeamPlayers: SelectablePlayer[] =
            loadTeamPlayers(
                gameData.home.id,
                gameData.seasonId!,
                'home',
                gameData.matches!,
            ) || [];
        const awayTeamPlayers: SelectablePlayer[] =
            loadTeamPlayers(
                gameData.away.id,
                gameData.seasonId!,
                'away',
                gameData.matches!,
            ) || [];

        setHomeTeam(homeTeamPlayers);
        setAwayTeam(awayTeamPlayers);

        const allPlayers = homeTeamPlayers
            .concat(awayTeamPlayers)
            .filter((p: TeamPlayerDto) => p.id !== NEW_PLAYER);
        allPlayers.sort(sortBy('name'));
        setAllPlayers(allPlayers);
    }

    async function loadFixtureData() {
        const gameData: GameDto | null = await gameApi.get(fixtureId!);

        try {
            if (!gameData) {
                onError('Game could not be found');
                return;
            }

            const failedRequest = gameData as IFailedRequest;
            if (failedRequest.status) {
                /* istanbul ignore next */
                console.log(gameData);
                const suffix: string = failedRequest.errors
                    ? ' -- ' +
                      Object.keys(failedRequest.errors)
                          .map(
                              (key: string) =>
                                  `${key}: ${failedRequest.errors![key]}`,
                          )
                          .join(', ')
                    : '';
                onError(
                    `Error accessing fixture: Code: ${failedRequest.status}${suffix}`,
                );
                return;
            }

            if (!gameData.home || !gameData.away) {
                onError('Either home or away team are undefined for this game');
                return;
            }

            if (access === 'admin' || access === 'clerk') {
                loadPlayerData(gameData);
            }

            const patchedGameData = addMatchesAndMatchOptions(gameData);
            setFixtureData(patchedGameData);
            setData(patchedGameData);
        } catch (e) {
            /* istanbul ignore next */
            onError(e);
        } finally {
            setLoading('ready');
        }
    }

    function addMatchesAndMatchOptions(gameData: GameDto): GameDto {
        if (!gameData.matchOptions || isEmpty(gameData.matchOptions)) {
            const matchOptions: IMatchOptionsLookup = getMatchOptionsLookup(
                gameData.matchOptions!,
                gameData.isKnockout,
            );
            gameData.matchOptions = repeat(8, (m) =>
                getMatchOptionDefaults(m, matchOptions),
            );
        }

        if (!gameData.matches || isEmpty(gameData.matches)) {
            gameData.matches = repeat(8, getMatchDefaults);
        }

        return gameData;
    }

    async function saveScores() {
        /* istanbul ignore next */
        if (saving) {
            /* istanbul ignore next */
            return;
        }

        try {
            setSaving(true);
            const update = fixtureData as RecordScoresDto;
            update.lastUpdated = fixtureData!.updated;
            const response = await gameApi.updateScores(fixtureId!, update);

            if (!response.success) {
                setSaveError(response);
            } else {
                setData(response.result!);
                setFixtureData(response.result!);
            }
        } catch (e) {
            /* istanbul ignore next */
            onError(e);
        } finally {
            setSaving(false);
        }
    }

    async function unpublish() {
        /* istanbul ignore next */
        if (saving) {
            /* istanbul ignore next */
            return;
        }

        try {
            setSaving(true);

            const newData: GameDto = Object.assign({}, data);
            newData.matches = repeat(8, () => ({}));
            newData.home.manOfTheMatch = undefined;
            newData.away.manOfTheMatch = undefined;
            newData.oneEighties = [];
            newData.over100Checkouts = [];
            newData.resultsPublished = false;
            setData(newData);
            if (submission) {
                setFixtureData(newData[submission + 'Submission']);
            } else {
                setFixtureData(newData);
            }

            alert(
                'Results have been unpublished, but NOT saved. Re-merge the changes then click save for them to be saved',
            );
        } catch (e) {
            /* istanbul ignore next */
            onError(e);
        } finally {
            setSaving(false);
        }
    }

    function renderMatchPlayerSelection(
        index: number,
        _: number,
        playerCount: number,
    ) {
        const matchesExceptIndex = fixtureData!.matches!.filter(
            (_: GameMatchDto, matchIndex: number) => {
                const matchOptions = getMatchOptionDefaults(
                    matchIndex,
                    getMatchOptionsLookup(
                        fixtureData!.matchOptions!,
                        fixtureData!.isKnockout,
                    ),
                );

                return (
                    matchIndex !== index &&
                    matchOptions.playerCount === playerCount
                );
            },
        );

        function onMatchChanged(newMatch: GameMatchDto, index: number) {
            const newFixtureData: GameDto = Object.assign({}, fixtureData);
            newFixtureData.matches![index] = newMatch;

            setFixtureData(newFixtureData);
        }

        async function onMatchOptionsChanged(matchOptions: GameMatchOptionDto) {
            const newFixtureData: GameDto = Object.assign({}, fixtureData);
            newFixtureData.matchOptions![index] = matchOptions;

            setFixtureData(newFixtureData);
        }

        async function onCreatePlayer(forMatchPlayerIndex: ICreatePlayerFor) {
            forMatchPlayerIndex.matchIndex = index;
            setCreatePlayerFor(forMatchPlayerIndex);
        }

        const matchTypeProps: IMatchTypeContainerProps = {
            matchOptions:
                elementAt(fixtureData!.matchOptions || [], index) ||
                getMatchOptionDefaults(
                    index,
                    getMatchOptionsLookup(
                        fixtureData!.matchOptions!,
                        fixtureData!.isKnockout,
                    ),
                ),
            otherMatches: matchesExceptIndex,
            setCreatePlayerFor: onCreatePlayer,
            homePlayers: homeTeam,
            awayPlayers: awayTeam,
        };

        return (
            <MatchTypeContainer {...matchTypeProps}>
                <MatchPlayerSelection
                    match={fixtureData!.matches![index]}
                    onMatchChanged={async (newMatch: GameMatchDto) =>
                        onMatchChanged(newMatch, index)
                    }
                    onMatchOptionsChanged={onMatchOptionsChanged}
                    on180={add180(
                        fixtureData!,
                        asyncCallback<GameDto>(setFixtureData),
                    )}
                    onHiCheck={addHiCheck(
                        fixtureData!,
                        asyncCallback<GameDto>(setFixtureData),
                    )}
                />
            </MatchTypeContainer>
        );
    }

    function renderMergeMatch(index: number) {
        if (
            !fixtureData!.resultsPublished &&
            access === 'admin' &&
            submission === null &&
            (data?.homeSubmission || data?.awaySubmission)
        ) {
            return (
                <MergeMatch
                    readOnly={saving}
                    matchIndex={index}
                    matches={fixtureData!.matches}
                    homeSubmission={fixtureData!.homeSubmission}
                    awaySubmission={fixtureData!.awaySubmission}
                    setFixtureData={asyncCallback<GameDto>(setFixtureData)}
                    fixtureData={fixtureData!}
                />
            );
        }
    }

    function renderManOfTheMatchInput() {
        if (
            access !== 'readonly' &&
            (!fixtureData?.resultsPublished || access === 'admin')
        ) {
            return (
                <ManOfTheMatchInput
                    fixtureData={fixtureData!}
                    saving={saving}
                    access={access}
                    disabled={access === 'admin' && !!submission}
                    setFixtureData={asyncCallback<GameDto>(setFixtureData)}
                />
            );
        }
    }

    function renderMergeManOfTheMatch() {
        if (submission) {
            return null;
        }

        function hasManOfTheMatch(
            data: GameDto | undefined,
            side: string,
        ): string | undefined {
            if (!data) {
                return undefined;
            }

            const dataSide: GameTeamDto = data[side] || {};
            return dataSide.manOfTheMatch;
        }

        if (
            !fixtureData!.resultsPublished &&
            access === 'admin' &&
            (data?.homeSubmission || data?.awaySubmission) &&
            ((!hasManOfTheMatch(data, 'home') &&
                hasManOfTheMatch(data?.homeSubmission, 'home')) ||
                (!hasManOfTheMatch(data, 'away') &&
                    hasManOfTheMatch(data?.awaySubmission, 'away')))
        ) {
            return (
                <MergeManOfTheMatch
                    data={data}
                    setData={asyncCallback<GameDto>(setData)}
                    allPlayers={allPlayers}
                />
            );
        }
    }

    function render180sAndHiCheckInput() {
        return (
            <HiCheckAnd180s
                saving={saving || (access === 'admin' && !!submission)}
                access={access}
                fixtureData={fixtureData!}
                setFixtureData={asyncCallback<GameDto>(setFixtureData)}
            />
        );
    }

    function renderMerge180sAndHiCheck() {
        if (
            !fixtureData?.resultsPublished &&
            access === 'admin' &&
            (data?.homeSubmission || data?.awaySubmission)
        ) {
            return (
                <MergeHiCheckAnd180s
                    data={data}
                    fixtureData={fixtureData!}
                    setFixtureData={asyncCallback<GameDto>(setFixtureData)}
                />
            );
        }
    }

    async function uploadPhotos(file: File): Promise<boolean> {
        const request: UploadPhotoDto = {
            id: fixtureId,
        };
        const result = await gameApi.uploadPhoto(request, file);

        if (result.success) {
            const patchedGameData = addMatchesAndMatchOptions(result.result!);
            setFixtureData(patchedGameData);
            setData(patchedGameData);
            return true;
        }

        setSaveError(result);
        return false;
    }

    async function deletePhotos(id: string): Promise<boolean> {
        const result = await gameApi.deletePhoto(fixtureId!, id);

        if (result.success) {
            const patchedGameData = addMatchesAndMatchOptions(result.result!);
            setFixtureData(patchedGameData);
            setData(patchedGameData);
            return true;
        }

        setSaveError(result);
        return false;
    }

    function fixtureDetailsChanged(details: GameDto) {
        const wasKnockout = fixtureData!.isKnockout;

        if (details.isKnockout !== wasKnockout) {
            const matchOptionsLookup = getMatchOptionsLookup(
                [],
                details.isKnockout,
            );

            // set the match options - number of legs
            const numberOfLegsPerMatch = matchOptionsLookup.numberOfLegs;

            for (const index in numberOfLegsPerMatch) {
                const numberOfLegs: number = numberOfLegsPerMatch[index];
                const matchOptions = details.matchOptions![index];
                matchOptions.numberOfLegs = numberOfLegs;
            }
        }

        setFixtureData(details);
    }

    if (loading !== 'ready') {
        return <Loading />;
    }

    if (!fixtureData || !fixtureData.matches) {
        return (
            <PageError error="Unable to load score card, fixture data not loaded" />
        );
    }

    const hasBeenPlayed: boolean = any(
        fixtureData.matches,
        (m: GameMatchDto) => (m.homeScore || 0) + (m.awayScore || 0) > 0,
    );

    try {
        const season: SeasonDto = seasons.filter(
            (s) => s.id === fixtureData.seasonId,
        )[0] || { id: EMPTY_ID, name: 'Not found' };
        const division: DivisionDto = divisions.filter(
            (d) => d.id === fixtureData.divisionId,
        )[0] || { id: EMPTY_ID, name: 'Not found' };

        const editable: boolean =
            (!saving &&
                ((access === 'admin' && !submission) ||
                    (!fixtureData.resultsPublished &&
                        account?.access?.inputResults === true))) ||
            false;
        const leagueFixtureData: ILeagueFixtureContainerProps = {
            season: season,
            division: division,
            homePlayers: homeTeam,
            awayPlayers: awayTeam,
            readOnly: !editable,
            disabled:
                access === 'readonly' ||
                (fixtureData.resultsPublished && access !== 'admin') ||
                (access === 'admin' && !!submission),
            home: data!.home,
            away: data!.away,
        };

        setTitle(
            `${fixtureData.home.name} vs ${fixtureData.away.name} - ${renderDate(fixtureData.date)}`,
        );
        const accountTeam = account
            ? teams.find((t) => t.id === account.teamId)
            : undefined;

        return (
            <div>
                <DivisionControls
                    originalSeasonData={season}
                    originalDivisionData={division}
                    overrideMode="fixtures"
                />
                <ul className="nav nav-tabs">
                    <li className="nav-item">
                        <NavLink
                            to={`/teams/${season.name}/?division=${division.name}`}>
                            Teams
                        </NavLink>
                    </li>
                    <li className="nav-item">
                        <NavLink
                            to={`/fixtures/${season.name}/?division=${division.name}`}>
                            Fixtures
                        </NavLink>
                    </li>
                    <li className="nav-item">
                        <NavLink className="active" to={`/score/${fixtureId}`}>
                            {renderDate(data!.date)}
                        </NavLink>
                    </li>
                    <li className="nav-item">
                        <NavLink
                            to={`/players/${season.name}/?division=${division.name}`}>
                            Players
                        </NavLink>
                    </li>
                </ul>
                <LeagueFixtureContainer {...leagueFixtureData}>
                    <div className="content-background p-3 overflow-auto">
                        {fixtureData.address || access === 'admin' ? (
                            <GameDetails
                                saving={saving}
                                setFixtureData={async (data: GameDto) =>
                                    fixtureDetailsChanged(data)
                                }
                                access={access}
                                fixtureData={fixtureData}
                                season={season}
                            />
                        ) : null}
                        <table
                            className={`table${(access === 'admin' && !submission) || access === 'clerk' ? ' minimal-padding' : ''}`}>
                            <ScoreCardHeading
                                access={access}
                                data={data!}
                                setSubmission={async (value: string) =>
                                    setSubmission(value)
                                }
                                setFixtureData={async (value: GameDto) =>
                                    setFixtureData(value)
                                }
                                submission={submission}
                            />
                            {hasBeenPlayed ||
                            access === 'admin' ||
                            (account &&
                                access === 'clerk' &&
                                ((data!.away &&
                                    account.teamId === data!.away.id) ||
                                    account.teamId === data!.home.id)) ? (
                                <tbody>
                                    <tr>
                                        <td
                                            colSpan={5}
                                            className="text-primary fw-bold text-center">
                                            Singles
                                        </td>
                                    </tr>
                                    {renderMatchPlayerSelection(0, 5, 1)}
                                    {renderMergeMatch(0)}
                                    {renderMatchPlayerSelection(1, 5, 1)}
                                    {renderMergeMatch(1)}
                                    {renderMatchPlayerSelection(2, 5, 1)}
                                    {renderMergeMatch(2)}
                                    {renderMatchPlayerSelection(3, 5, 1)}
                                    {renderMergeMatch(3)}
                                    {renderMatchPlayerSelection(4, 5, 1)}
                                    {renderMergeMatch(4)}
                                    <tr>
                                        <td
                                            colSpan={5}
                                            className="text-primary fw-bold text-center">
                                            Pairs
                                        </td>
                                    </tr>
                                    {renderMatchPlayerSelection(5, 3, 2)}
                                    {renderMergeMatch(5)}
                                    {renderMatchPlayerSelection(6, 3, 2)}
                                    {renderMergeMatch(6)}
                                    <tr>
                                        <td
                                            colSpan={5}
                                            className="text-primary fw-bold text-center">
                                            Triples
                                        </td>
                                    </tr>
                                    {renderMatchPlayerSelection(7, 3, 3)}
                                    {renderMergeMatch(7)}
                                    {access !== 'readonly' &&
                                    (!fixtureData.resultsPublished ||
                                        access === 'admin') ? (
                                        <tr>
                                            <td
                                                colSpan={5}
                                                className="text-center border-0">
                                                Man of the match
                                            </td>
                                        </tr>
                                    ) : null}
                                    {renderManOfTheMatchInput()}
                                    {renderMergeManOfTheMatch()}
                                    {render180sAndHiCheckInput()}
                                    {renderMerge180sAndHiCheck()}
                                </tbody>
                            ) : (
                                <tbody>
                                    <tr>
                                        <td colSpan={5}>No scores, yet</td>
                                    </tr>
                                </tbody>
                            )}
                        </table>
                        {access !== 'readonly' &&
                        ((!data?.resultsPublished && access === 'clerk') ||
                            (access === 'admin' && !submission)) ? (
                            <button
                                className="btn btn-primary margin-right"
                                onClick={saveScores}>
                                {saving ? <LoadingSpinnerSmall /> : null}
                                Save
                            </button>
                        ) : null}
                        {access === 'admin' &&
                        data?.resultsPublished &&
                        (data?.homeSubmission || data?.awaySubmission) ? (
                            <button
                                className="btn btn-warning margin-right"
                                onClick={unpublish}>
                                Unpublish
                            </button>
                        ) : null}
                        {(account?.access?.uploadPhotos ||
                            account?.access?.viewAnyPhoto) &&
                        photosEnabled ? (
                            <button
                                className="btn btn-primary margin-right"
                                onClick={() => setShowPhotoManager(true)}>
                                📷 Photos
                            </button>
                        ) : null}
                        <DebugOptions>
                            <span className="dropdown-item">
                                Access: {access}
                            </span>
                            {account ? (
                                <span className="dropdown-item">
                                    Team: {accountTeam?.name || account.teamId}
                                </span>
                            ) : null}
                            <span className="dropdown-item">
                                Data:{' '}
                                {fixtureData?.resultsPublished
                                    ? 'published'
                                    : 'draft'}
                            </span>
                            <span className="dropdown-item">
                                Editable: {editable ? 'Yes' : 'No'}
                                <span> | </span>
                                Disabled:{' '}
                                {leagueFixtureData.disabled ? 'Yes' : 'No'}
                                <span> | </span>
                                InputResults:{' '}
                                {account?.access?.inputResults ? 'Yes' : 'No'}
                            </span>
                        </DebugOptions>
                    </div>
                </LeagueFixtureContainer>
                {createPlayerFor ? renderCreatePlayerDialog() : null}
                {showPhotoManager ? (
                    <PhotoManager
                        doUpload={uploadPhotos}
                        photos={fixtureData.photos || []}
                        onClose={async () => setShowPhotoManager(false)}
                        doDelete={deletePhotos}
                        canUploadPhotos={hasAccess(
                            account,
                            (a) => a.uploadPhotos,
                        )}
                        canDeletePhotos={
                            hasAccess(
                                account,
                                (a) => a.uploadPhotos || a.deleteAnyPhoto,
                            ) || access === 'admin'
                        }
                        canViewAllPhotos={
                            access === 'admin' ||
                            hasAccess(account, (access) => access.viewAnyPhoto)
                        }
                    />
                ) : null}
                {saveError ? (
                    <ErrorDisplay
                        {...saveError}
                        onClose={asyncClear(setSaveError)}
                        title="Could not save score"
                    />
                ) : null}
            </div>
        );
    } catch (e) {
        /* istanbul ignore next */
        onError(e);
    }
}
