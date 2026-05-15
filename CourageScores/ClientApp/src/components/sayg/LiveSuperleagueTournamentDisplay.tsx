import { TournamentGameDto } from '../../interfaces/models/dtos/Game/TournamentGameDto';
import { TournamentMatchDto } from '../../interfaces/models/dtos/Game/TournamentMatchDto';
import { useEffect, useState } from 'react';
import { RecordedScoreAsYouGoDto } from '../../interfaces/models/dtos/Game/Sayg/RecordedScoreAsYouGoDto';
import { LegDto } from '../../interfaces/models/dtos/Game/Sayg/LegDto';
import { any, isEmpty, reverse, sum } from '../../helpers/collections';
import { useDependencies } from '../common/IocContainer';
import { UntypedPromise } from '../../interfaces/UntypedPromise';
import { Link } from 'react-router';
import { Loading } from '../common/Loading';
import { useApp } from '../common/AppContainer';
import { useLive } from '../../live/LiveContainer';
import { LiveDataType } from '../../interfaces/models/dtos/Live/LiveDataType';
import { ISubscriptionRequest } from '../../live/ISubscriptionRequest';
import { IUpdateLookup } from './LiveSayg';
import { LegCompetitorScoreDto } from '../../interfaces/models/dtos/Game/Sayg/LegCompetitorScoreDto';
import { hasAccess } from '../../helpers/conditions';
import { getScoreFromThrows } from '../../helpers/sayg';
import { GameMatchOptionDto } from '../../interfaces/models/dtos/Game/GameMatchOptionDto';
import { TournamentSideDto } from '../../interfaces/models/dtos/Game/TournamentSideDto';
import { ifNaN } from '../../helpers/rendering';

export interface ILiveSuperleagueTournamentDisplayProps {
    id: string;
    data?: TournamentGameDto;
    onRemove?(): UntypedPromise;
    showLoading?: boolean;
    refreshRequired?: boolean;
    refreshComplete(): UntypedPromise;
    allUpdates: IUpdateLookup;
}

interface IMatchSaygLookup {
    [matchId: string]: RecordedScoreAsYouGoDto;
}

type SideType = 'home' | 'away';

export function LiveSuperleagueTournamentDisplay({
    id,
    data,
    onRemove,
    showLoading,
    refreshRequired,
    refreshComplete,
    allUpdates,
}: ILiveSuperleagueTournamentDisplayProps) {
    const { saygApi, tournamentApi } = useDependencies();
    const { fullScreen, account, appLoading } = useApp();
    const [matchSaygData, setMatchSaygData] = useState<IMatchSaygLookup>({});
    const [initialData, setInitialData] = useState<
        TournamentGameDto | undefined | null
    >(undefined);
    const [updatedTournament, setUpdatedTournament] = useState<
        TournamentGameDto | undefined
    >(undefined);
    const [refreshing, setRefreshing] = useState<boolean>(false);
    const [subscribing, setSubscribing] = useState<boolean>(false);
    const [pendingLiveSubscriptions, setPendingLiveSubscriptions] = useState<
        ISubscriptionRequest[]
    >([]);
    const tournament = updatedTournament ?? data ?? initialData;
    const { enableLiveUpdates, subscriptions } = useLive();
    const canUseWebSockets = hasAccess(
        account,
        (access) => access.useWebSockets,
    );
    const [scoreChanged, setScoreChanged] = useState<undefined | SideType>(
        undefined,
    );
    const [watchLiveScores, setWatchLiveScores] = useState<boolean>(true);

    useEffect(() => {
        if (initialData === undefined) {
            // noinspection JSIgnoredPromiseFromCall
            fetchInitialData(id);
        }
    });

    useEffect(() => {
        if (!updatedTournament) {
            return;
        }

        const equatableData = JSON.stringify(data);
        const equatableUpdatedTournament = JSON.stringify(updatedTournament);
        if (equatableData === equatableUpdatedTournament) {
            // clear the temporary stash of the updated tournament to ensure that <data> is used
            setUpdatedTournament(undefined);
        }
    }, [data, updatedTournament]);

    useEffect(() => {
        if (refreshRequired) {
            // noinspection JSIgnoredPromiseFromCall
            fetchInitialData(id);
        }
    }, [refreshRequired]);

    useEffect(() => {
        if (!appLoading && tournament) {
            // noinspection JSIgnoredPromiseFromCall
            getLatestMatchData(tournament?.round?.matches || []);
        }
    }, [tournament, appLoading]);

    useEffect(() => {
        if (isEmpty(pendingLiveSubscriptions) || !account) {
            console.log(
                `Finished subscribing to sayg: ${pendingLiveSubscriptions.length} left, account: ${!!account}`,
            );
            return;
        }

        // noinspection JSIgnoredPromiseFromCall
        subscribeToNextSayg();
    }, [pendingLiveSubscriptions, account]);

    useEffect(() => {
        const newMatchSaygLookup = processUpdates(allUpdates);

        const tournamentUpdate = allUpdates[id] as TournamentGameDto;
        if (tournamentUpdate) {
            setUpdatedTournament(tournamentUpdate);
            subscribeToNewMatches(tournamentUpdate, newMatchSaygLookup);
        }
    }, [allUpdates]);

    function opposite(player: SideType): SideType {
        return player === 'home' ? 'away' : 'home';
    }

    function processUpdates(allUpdates: IUpdateLookup) {
        const newMatchSaygLookup: IMatchSaygLookup = {
            ...matchSaygData,
        };
        let updated = false;
        let scoreChanged: undefined | SideType = undefined;

        for (const matchId in newMatchSaygLookup) {
            const matchSaygId = newMatchSaygLookup[matchId].id;
            const update = allUpdates[matchSaygId] as RecordedScoreAsYouGoDto;
            if (!update) {
                continue;
            }

            newMatchSaygLookup[matchId] = update;
            updated = true;

            const updatedLegs: LegDto[] = Object.values(update.legs);
            const updatedLeg: LegDto | undefined =
                updatedLegs[updatedLegs.length - 1];
            if (!updatedLeg) {
                continue;
            }

            const currentThrow = updatedLeg.currentThrow as SideType;
            const remaining: number = currentScore(
                updatedLeg,
                opposite(currentThrow),
            );

            if (remaining !== updatedLeg.startingScore) {
                scoreChanged = opposite(currentThrow);
            }
        }

        if (updated) {
            setMatchSaygData(newMatchSaygLookup);
            setScoreChanged(scoreChanged);
        }

        return newMatchSaygLookup;
    }

    function subscribeToNewMatches(
        tournamentUpdate: TournamentGameDto,
        newMatchSaygLookup: IMatchSaygLookup,
    ) {
        // find all matches and their saygIds
        // if any are not in newMatchSaygLookup, add them and subscribe (via pending)
        const allSaygIds: string[] =
            tournamentUpdate.round?.matches
                ?.filter((m: TournamentMatchDto) => !!m.saygId)
                .filter((m: TournamentMatchDto) => !hasWinner(m))
                .map((m: TournamentMatchDto) => m.saygId!) || [];
        const newSaygSubscriptions: ISubscriptionRequest[] = allSaygIds
            .filter(
                (saygId) =>
                    !any(
                        Object.values(newMatchSaygLookup),
                        (s) => s.id === saygId,
                    ),
            )
            .map((saygId) => {
                console.log(
                    `Missing sayg subscription for ${saygId}, allSaygIds: [${allSaygIds.join(', ')}]`,
                );
                return {
                    id: saygId,
                    type: LiveDataType.sayg,
                };
            });

        const newPendingSubs =
            pendingLiveSubscriptions.concat(newSaygSubscriptions);
        console.log(
            `Pending subscriptions(subscribeToNewMatches): ${newPendingSubs.length}`,
        );
        setPendingLiveSubscriptions(newPendingSubs);
    }

    async function subscribeToNextSayg() {
        /* istanbul ignore next */
        if (subscribing) {
            /* istanbul ignore next */
            return;
        }

        setSubscribing(true);
        try {
            const nextSub = pendingLiveSubscriptions[0];
            console.log(
                `Subscribing to sayg: ${nextSub.id}, remaining: ${pendingLiveSubscriptions.length - 1}`,
            );

            await enableLiveUpdates(true, nextSub);

            if (nextSub.type === LiveDataType.sayg) {
                const saygId = nextSub.id;
                const match = tournament?.round?.matches?.find(
                    (m) => m.saygId === saygId,
                );
                const saygData = await saygApi.get(saygId);
                if (match && saygData) {
                    const newMatchSaygData = Object.assign({}, matchSaygData);
                    newMatchSaygData[match.id] = saygData;
                    setMatchSaygData(newMatchSaygData);
                }
            }

            const newPendingSubs = pendingLiveSubscriptions.filter(
                (sub) => sub !== nextSub,
            );
            console.log(
                `Pending subscriptions(subscribeToNextSayg): ${newPendingSubs.length}`,
            );
            setPendingLiveSubscriptions(newPendingSubs);
        } finally {
            setSubscribing(false);
        }
    }

    async function fetchInitialData(id: string) {
        if (refreshing) {
            /* istanbul ignore next */
            return;
        }

        setRefreshing(true);
        try {
            const response = await tournamentApi.get(id);
            setInitialData(response);

            if (refreshRequired) {
                await refreshComplete();
            }
        } finally {
            setRefreshing(false);
        }
    }

    async function getLatestMatchData(matches: TournamentMatchDto[]) {
        const matchSaygData: IMatchSaygLookup = {};
        for (const match of matches) {
            if (!match.saygId) {
                continue;
            }

            const saygData = await saygApi.get(match.saygId);
            if (saygData) {
                matchSaygData[match.id] = saygData;
            }
        }

        const pendingSubscriptions = Object.values(matchSaygData).map(
            (sayg) => {
                return {
                    id: sayg.id,
                    type: LiveDataType.sayg,
                };
            },
        );
        console.log(
            `Pending subscriptions(getLatestMatchData): ${pendingSubscriptions.length}`,
        );
        setPendingLiveSubscriptions(pendingSubscriptions);
        setMatchSaygData(matchSaygData);
    }

    function sumOf(
        match: TournamentMatchDto,
        player: SideType,
        prop: string,
    ): number {
        const matchSayg: RecordedScoreAsYouGoDto = matchSaygData[match.id];
        if (!matchSayg) {
            return Number.NaN;
        }

        const legs = matchSayg.legs;
        const value: number = sum(
            Object.values(legs),
            (leg: LegDto) => leg[player][prop],
        );
        if (!Number.isNaN(value)) {
            return value;
        }

        throw new Error(
            `Cannot calculate the sum of ${prop} for ${player}, value results in NaN`,
        );
    }

    function getAverage(
        match: TournamentMatchDto,
        player: SideType,
    ): string | number {
        const average =
            sumOf(match, player, 'score') /
            (sumOf(match, player, 'noOfDarts') / 3);
        const appropriateAverage = average / 3;
        return Number.isNaN(appropriateAverage)
            ? '-'
            : appropriateAverage.toFixed(2);
    }

    function getScore(match: TournamentMatchDto, player: SideType): number {
        const side = player === 'home' ? 'scoreA' : 'scoreB';
        return match[side]!;
    }

    function isWinner(match: TournamentMatchDto, player: SideType): boolean {
        const score = getScore(match, player);

        const matchIndex = tournament?.round?.matches?.findIndex(
            (m) => m.id === match.id,
        );
        const matchOptions: GameMatchOptionDto | undefined = matchIndex
            ? tournament?.round?.matchOptions?.[matchIndex]
            : undefined;

        const saygData = matchIndex ? matchSaygData[match.id] : undefined;
        const bestOf =
            saygData?.numberOfLegs ??
            matchOptions?.numberOfLegs ??
            tournament?.bestOf ??
            7;
        return score > bestOf / 2.0;
    }

    function hasWinner(match: TournamentMatchDto): boolean {
        return isWinner(match, 'home') || isWinner(match, 'away');
    }

    function firstInitialAndLastNames(
        side?: TournamentSideDto,
    ): string | undefined {
        return (
            side?.players
                ?.map((player) => {
                    const name = player?.name;
                    const names: string[] = name?.split(' ') ?? [];
                    if (names.length === 1) {
                        return name;
                    }

                    return names
                        .map((name, index) => {
                            return index === names.length - 1 ? name : name[0];
                        })
                        .join(' ');
                })
                .join(' & ') || side?.name
        );
    }

    function currentScore(leg: LegDto, side: SideType) {
        const startingScore = leg.startingScore || 501;
        const accumulator: LegCompetitorScoreDto = leg[side];
        return (
            startingScore -
            getScoreFromThrows(startingScore, accumulator.throws || [])
        );
    }

    function lastIncompleteMatch(
        matches: TournamentMatchDto[],
    ): TournamentMatchDto | undefined {
        for (const match of reverse(matches)) {
            if (hasWinner(match)) {
                // don't look past the last winning match
                return;
            }

            if (hasSaygData(match)) {
                return match;
            }
        }
    }

    function hasSaygData(match: TournamentMatchDto): boolean {
        const matchSayg: RecordedScoreAsYouGoDto | undefined =
            matchSaygData[match.id];
        return !!matchSayg;
    }

    function matchSort(a: TournamentMatchDto, b: TournamentMatchDto) {
        const playerCountA =
            (a.sideA?.players?.length ?? 0) + (a.sideB?.players?.length ?? 0);
        const playerCountB =
            (b.sideA?.players?.length ?? 0) + (b.sideB?.players?.length ?? 0);

        const playerCountOrder = playerCountA - playerCountB; // singles before pairs
        if (playerCountOrder !== 0) {
            return playerCountOrder;
        }

        const matches = tournament?.round?.matches ?? [];
        const indexOfMatchA = matches.indexOf(a);
        const indexOfMatchB = matches.indexOf(b);
        return indexOfMatchA - indexOfMatchB;
    }

    if (!tournament) {
        return showLoading ? (
            <div className="flex-grow-1 bg-white">
                <Loading />
            </div>
        ) : null;
    }

    const totals = {
        home: 0,
        away: 0,
    };
    const matches = tournament.round?.matches || [];
    const lastMatch = lastIncompleteMatch(matches);
    const lastMatchSayg: RecordedScoreAsYouGoDto | undefined = lastMatch
        ? matchSaygData[lastMatch.id]
        : undefined;
    const lastMatchLegs = Object.values(lastMatchSayg?.legs || {});
    const lastLeg = lastMatchLegs[lastMatchLegs.length - 1];
    const tournamentSubscription = Object.values(subscriptions).find(
        (s) => s.id === tournament.id && s.type === LiveDataType.tournament,
    );
    const lastMatchSubscription = lastMatch
        ? Object.values(subscriptions).find(
              (s) => s.id === lastMatch.saygId && s.type === LiveDataType.sayg,
          )
        : null;

    return (
        <div
            className={`d-flex flex-column justify-content-center${refreshRequired ? ' opacity-50' : ''}`}>
            <h3 className="flex-grow-0 flex-shrink-0 text-center">
                {onRemove ? (
                    <button
                        className="btn btn-sm btn-secondary me-2"
                        onClick={onRemove}>
                        ❌
                    </button>
                ) : null}
                {fullScreen.isFullScreen ? (
                    tournament.type
                ) : (
                    <Link to={`/tournament/${tournament.id}`}>
                        {tournament.type}
                    </Link>
                )}
                {canUseWebSockets ? (
                    <button
                        className="ms-3 btn btn-sm btn-outline-secondary"
                        onClick={() => setWatchLiveScores(!watchLiveScores)}>
                        Scores: {watchLiveScores ? '▶️' : '⏸️'}
                    </button>
                ) : null}
                {hasAccess(account, (a) => a.showDebugOptions) ? (
                    <button
                        className="ms-3 btn btn-sm opacity-50"
                        onClick={() =>
                            window.alert(
                                `SaygId: ${lastMatchSayg?.id}\nMatch: ${lastMatchSayg?.tournamentMatchId === lastMatch?.id ? lastMatch?.id : 'Ids mismatch'}\nLegs: ${Object.values(lastMatchSayg?.legs || {}).length}`,
                            )
                        }>
                        S:
                        {tournamentSubscription?.connected === false
                            ? '⛓️‍💥'
                            : '✅'}
                        WS:{canUseWebSockets ? '✅' : '❌'}
                        M(
                        {lastMatch
                            ? matches?.findIndex((m) => m === lastMatch)
                            : '-'}
                        ):
                        {lastMatch ? '✅' : '❌'}
                        L({lastMatchLegs?.length - 1}):{lastLeg ? '✅' : '❌'}
                    </button>
                ) : null}
            </h3>
            <table className="table">
                <thead>
                    <tr>
                        <th>Avg</th>
                        <th>{tournament.host}</th>
                        <th className="text-center" colSpan={3}>
                            Score
                        </th>
                        <th>{tournament.opponent}</th>
                        <th>Avg</th>
                    </tr>
                </thead>
                <tbody>
                    {tournament.round?.matches
                        ?.sort(matchSort)
                        ?.map((m: TournamentMatchDto) => {
                            const homeWinner = isWinner(m, 'home');
                            const awayWinner = isWinner(m, 'away');
                            totals.home += getScore(m, 'home');
                            totals.away += getScore(m, 'away');

                            return (
                                <tr key={m.id}>
                                    <td
                                        className={`text-danger ${homeWinner ? 'fw-bold' : ''}`}>
                                        {getAverage(m, 'home')}
                                    </td>
                                    <td
                                        className={`text-end ${homeWinner ? 'fw-bold' : ''}`}>
                                        {firstInitialAndLastNames(m.sideA)}
                                    </td>
                                    <td
                                        className={`text-end ${homeWinner ? 'fw-bold' : ''}`}>
                                        {getScore(m, 'home')}
                                    </td>
                                    <td>-</td>
                                    <td className={awayWinner ? 'fw-bold' : ''}>
                                        {getScore(m, 'away')}
                                    </td>
                                    <td className={awayWinner ? 'fw-bold' : ''}>
                                        {firstInitialAndLastNames(m.sideB)}
                                    </td>
                                    <td
                                        className={`text-danger ${awayWinner ? 'fw-bold' : ''}`}>
                                        {getAverage(m, 'away')}
                                    </td>
                                </tr>
                            );
                        })}
                </tbody>
                {any(tournament.round?.matches) ? (
                    <tfoot>
                        <tr>
                            <td className="text-end text-secondary" colSpan={3}>
                                {ifNaN(totals.home, '')}
                            </td>
                            <td></td>
                            <td className="text-secondary" colSpan={3}>
                                {ifNaN(totals.away, '')}
                            </td>
                        </tr>
                    </tfoot>
                ) : null}
            </table>
            {lastMatch &&
            lastLeg &&
            canUseWebSockets &&
            watchLiveScores &&
            !hasWinner(lastMatch!) ? (
                <div
                    className="d-flex flex-column border-3 bg-black p-0 rounded-3"
                    datatype="live-scores"
                    data-tournamentid={tournament.id}>
                    <div className="d-flex flex-row justify-content-center bg-success text-black fs-4 rounded-top-3">
                        <span className="flex-grow-1 px-3 text-end flex-basis-0">
                            {firstInitialAndLastNames(lastMatch!.sideA)}
                            {lastMatchSubscription?.connected === false
                                ? '⛓️‍💥'
                                : null}
                        </span>
                        <span>
                            {getScore(lastMatch!, 'home')} -{' '}
                            {getScore(lastMatch!, 'away')}
                        </span>
                        <span className="flex-grow-1 px-3 text-start flex-basis-0">
                            {firstInitialAndLastNames(lastMatch!.sideB)}
                        </span>
                    </div>
                    <div
                        className="d-flex flex-row justify-content-center text-success"
                        datatype="scores">
                        <span
                            className={`flex-grow-1 p-3 text-center fs-4 ${scoreChanged === 'home' ? ' fw-bold text-flash' : ''}`}>
                            {currentScore(lastLeg, 'home')}
                        </span>
                        <span
                            className={`flex-grow-1 p-3 text-center fs-4 ${scoreChanged === 'away' ? ' fw-bold text-flash' : ''}`}>
                            {currentScore(lastLeg, 'away')}
                        </span>
                    </div>
                </div>
            ) : null}
        </div>
    );
}
