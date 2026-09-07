import { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { MatchPlayerSelection, NEW_PLAYER } from './MatchPlayerSelection.tsx';
import { ErrorDisplay } from '../common/ErrorDisplay.tsx';
import { DivisionControls } from '../league/DivisionControls.tsx';
import { any, elementAt, isEmpty, sortBy } from '../../helpers/collections.ts';
import { asyncCallback, asyncClear } from '../../helpers/events.ts';
import { EMPTY_ID, repeat } from '../../helpers/projection.ts';
import { renderDate } from '../../helpers/rendering.ts';
import { Loading } from '../common/Loading.tsx';
import { MergeMatch } from './MergeMatch.tsx';
import { HiCheckAnd180s } from './HiCheckAnd180s.tsx';
import { MergeManOfTheMatch } from './MergeManOfTheMatch.tsx';
import { ManOfTheMatchInput } from './ManOfTheMatchInput.tsx';
import { MergeHiCheckAnd180s } from './MergeHiCheckAnd180s.tsx';
import { ScoreCardHeading } from './ScoreCardHeading.tsx';
import { GameDetails } from './GameDetails.tsx';
import { add180, addHiCheck } from '../common/Accolades.tsx';
import { useDependencies } from '../common/IocContainer.tsx';
import { useApp } from '../common/AppContainer.tsx';
import {
    ILeagueFixtureContainerProps,
    LeagueFixtureContainer,
} from './LeagueFixtureContainer.tsx';
import {
    IMatchTypeContainerProps,
    MatchTypeContainer,
} from './MatchTypeContainer.tsx';
import {
    getMatchDefaults,
    getMatchOptionDefaults,
    getMatchOptionsLookup,
    IMatchOptionsLookup,
} from '../../helpers/matchOptions.ts';
import { PageError } from '../common/PageError.tsx';
import { LoadingSpinnerSmall } from '../common/LoadingSpinnerSmall.tsx';
import { SeasonDto } from '../../interfaces/models/dtos/Season/SeasonDto.ts';
import { DivisionDto } from '../../interfaces/models/dtos/DivisionDto.ts';
import { TeamDto } from '../../interfaces/models/dtos/Team/TeamDto.ts';
import { GameDto } from '../../interfaces/models/dtos/Game/GameDto.ts';
import { IFailedRequest } from '../common/IFailedRequest.ts';
import { GameMatchDto } from '../../interfaces/models/dtos/Game/GameMatchDto.ts';
import { TeamPlayerDto } from '../../interfaces/models/dtos/Team/TeamPlayerDto.ts';
import { GameMatchOptionDto } from '../../interfaces/models/dtos/Game/GameMatchOptionDto.ts';
import { GameTeamDto } from '../../interfaces/models/dtos/Game/GameTeamDto.ts';
import { IClientActionResultDto } from '../common/IClientActionResultDto.ts';
import { ISelectablePlayer } from '../common/PlayerSelection.ts';
import { RecordScoresDto } from '../../interfaces/models/dtos/Game/RecordScoresDto.ts';
import { PhotoManager } from '../common/PhotoManager.tsx';
import { UploadPhotoDto } from '../../interfaces/models/dtos/UploadPhotoDto.ts';
import { useBranding } from '../common/BrandingContainer.tsx';
import { NavLink } from '../common/NavLink.tsx';
import { hasAccess, hasAnyAccessLevel } from '../../helpers/conditions.ts';
import { getTeamSeasons } from '../../helpers/teams.ts';
import { AccessOption } from '../../interfaces/models/dtos/Identity/AccessOption.ts';
import {
    ICreatePlayerFor,
    ScoreCardCreatePlayerDialog,
} from './ScoreCardCreatePlayerDialog.tsx';

interface IRenamedPlayer {
    renamed?: boolean;
}

type LoadingState = 'init' | 'loading' | 'ready';
type SelectedTeam = TeamPlayerDto & ISelectablePlayer & IRenamedPlayer;
type SelectablePlayer = TeamPlayerDto & ISelectablePlayer & IRenamedPlayer;
const photoFeatureId = 'af2ef520-8153-42b0-9ef4-d8419daebc23';

export function Score() {
    const { fixtureId } = useParams();
    const { gameApi, featureApi, teamApi } = useDependencies();
    const { appLoading, account, divisions, seasons, onError } = useApp();
    const [teams, setTeams] = useState<TeamDto[] | undefined>();
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
    const [showPhotoManager, setShowPhotoManager] = useState<boolean>(false);
    const access = getAccess();
    const [photosEnabled, setPhotosEnabled] = useState<boolean>(false);
    const { setTitle } = useBranding();

    useEffect(() => {
        if (!teams) {
            teamApi.getAllWithSeasonsAndPlayers().then(setTeams);
        }
    }, []);

    function getAccess(): string {
        if (account) {
            if (hasAccess(account, AccessOption.manageScores)) {
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

            if (appLoading || !teams) {
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
        const teamData = teams?.find((t) => t.id === teamId);

        if (!teamData) {
            onError(`${teamType} team could not be found - ${teamId}`);
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
                          .map((key) => `${key}: ${failedRequest.errors![key]}`)
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

        async function onMatchChanged(newMatch: GameMatchDto) {
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
                    onMatchChanged={onMatchChanged}
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

    async function fixtureDetailsChanged(details: GameDto) {
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

    function navLink(link: string, text: string) {
        return (
            <li className="nav-item">
                <NavLink to={link}>{text}</NavLink>
            </li>
        );
    }

    function sectionHeading(text: string) {
        return (
            <tr>
                <td colSpan={5} className="text-primary fw-bold text-center">
                    {text}
                </td>
            </tr>
        );
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
                        hasAccess(account, AccessOption.inputResults)))) ||
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

        return (
            <div>
                <DivisionControls
                    originalSeasonData={season}
                    originalDivisionData={division}
                    overrideMode="fixtures"
                />
                <ul className="nav nav-tabs">
                    {navLink(
                        `/teams/${season.name}/?division=${division.name}`,
                        'Teams',
                    )}
                    {navLink(
                        `/fixtures/${season.name}/?division=${division.name}`,
                        'Fixtures',
                    )}
                    {navLink(`/score/${fixtureId}`, renderDate(data!.date))}
                    {navLink(
                        `/players/${season.name}/?division=${division.name}`,
                        'Players',
                    )}
                </ul>
                <LeagueFixtureContainer {...leagueFixtureData}>
                    <div className="content-background p-3 overflow-auto">
                        {fixtureData.address || access === 'admin' ? (
                            <GameDetails
                                saving={saving}
                                setFixtureData={fixtureDetailsChanged}
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
                                setSubmission={asyncCallback(setSubmission)}
                                setFixtureData={asyncCallback(setFixtureData)}
                                submission={submission}
                            />
                            {hasBeenPlayed ||
                            access === 'admin' ||
                            (access === 'clerk' &&
                                ((data!.away &&
                                    account?.teamId === data!.away.id) ||
                                    account?.teamId === data!.home.id)) ? (
                                <tbody>
                                    {sectionHeading('Singles')}
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
                                    {sectionHeading('Pairs')}
                                    {renderMatchPlayerSelection(5, 3, 2)}
                                    {renderMergeMatch(5)}
                                    {renderMatchPlayerSelection(6, 3, 2)}
                                    {renderMergeMatch(6)}
                                    {sectionHeading('Triples')}
                                    {renderMatchPlayerSelection(7, 3, 3)}
                                    {renderMergeMatch(7)}
                                    {access !== 'readonly' &&
                                    (!fixtureData.resultsPublished ||
                                        access === 'admin')
                                        ? sectionHeading('Man of the match')
                                        : null}
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
                        {hasAnyAccessLevel(
                            account,
                            {
                                option: AccessOption.uploadPhotos,
                                seasonId: fixtureData.seasonId,
                                divisionId: fixtureData.divisionId,
                            },
                            {
                                option: AccessOption.viewAnyPhoto,
                                seasonId: fixtureData.seasonId,
                                divisionId: fixtureData.divisionId,
                            },
                        ) && photosEnabled ? (
                            <button
                                className="btn btn-primary margin-right"
                                onClick={() => setShowPhotoManager(true)}>
                                📷 Photos
                            </button>
                        ) : null}
                    </div>
                </LeagueFixtureContainer>
                {createPlayerFor ? (
                    <ScoreCardCreatePlayerDialog
                        setTeams={asyncCallback(setTeams)}
                        createPlayerFor={createPlayerFor}
                        setCreatePlayerFor={asyncCallback(setCreatePlayerFor)}
                        fixtureData={fixtureData}
                        setFixtureData={asyncCallback(setFixtureData)}
                    />
                ) : null}
                {showPhotoManager ? (
                    <PhotoManager
                        doUpload={uploadPhotos}
                        photos={fixtureData.photos || []}
                        onClose={async () => setShowPhotoManager(false)}
                        doDelete={deletePhotos}
                        canUploadPhotos={hasAccess(
                            account,
                            AccessOption.uploadPhotos,
                        )}
                        canDeletePhotos={
                            hasAnyAccessLevel(
                                account,
                                {
                                    option: AccessOption.uploadPhotos,
                                    seasonId: fixtureData.seasonId,
                                    divisionId: fixtureData.divisionId,
                                },
                                {
                                    option: AccessOption.deleteAnyPhoto,
                                    seasonId: fixtureData.seasonId,
                                    divisionId: fixtureData.divisionId,
                                },
                            ) || access === 'admin'
                        }
                        canViewAllPhotos={
                            access === 'admin' ||
                            hasAccess(account, AccessOption.viewAnyPhoto)
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
