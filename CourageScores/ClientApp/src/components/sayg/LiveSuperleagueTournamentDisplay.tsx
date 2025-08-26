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
    const { fullScreen, account } = useApp();
    const [matchSaygData, setMatchSaygData] = useState<IMatchSaygLookup>({});
    const [initialData, setInitialData] = useState<
        TournamentGameDto | undefined | null
    >(undefined);
    const [refreshing, setRefreshing] = useState<boolean>(false);
    const [subscribing, setSubscribing] = useState<boolean>(false);
    const [pendingLiveSubscriptions, setPendingLiveSubscriptions] = useState<
        ISubscriptionRequest[]
    >([]);
    const tournament = data ?? initialData;
    const { enableLiveUpdates } = useLive();
    const canUseWebSockets = hasAccess(
        account,
        (access) => access.useWebSockets,
    );
    const [scoreChanged, setScoreChanged] = useState<
        undefined | 'home' | 'away'
    >(undefined);

    useEffect(() => {
        if (initialData === undefined) {
            // noinspection JSIgnoredPromiseFromCall
            fetchInitialData(id);
        }
    });

    useEffect(() => {
        if (refreshRequired) {
            // noinspection JSIgnoredPromiseFromCall
            fetchInitialData(id);
        }
    }, [refreshRequired]);

    useEffect(() => {
        if (tournament) {
            // noinspection JSIgnoredPromiseFromCall
            getLatestMatchData(tournament?.round?.matches || []);
        }
    }, [tournament, account]);

    useEffect(() => {
        if (isEmpty(pendingLiveSubscriptions) || !account) {
            return;
        }

        // noinspection JSIgnoredPromiseFromCall
        subscribeToNextSayg();
    }, [pendingLiveSubscriptions, account]);

    useEffect(() => {
        const newMatchSaygLookup: IMatchSaygLookup = Object.assign(
            {},
            matchSaygData,
        );
        let updated = false;
        let scoreChanged: undefined | 'home' | 'away' = undefined;

        for (const matchId in newMatchSaygLookup) {
            const matchSaygId = newMatchSaygLookup[matchId].id;
            const update = allUpdates[matchSaygId] as RecordedScoreAsYouGoDto;
            if (update) {
                newMatchSaygLookup[matchId] = update;
                updated = true;

                const updatedLegs: LegDto[] = Object.values(update.legs);
                const updatedLeg: LegDto | undefined =
                    updatedLegs[updatedLegs.length - 1];
                if (updatedLeg) {
                    const currentThrow = updatedLeg.currentThrow as
                        | 'home'
                        | 'away';
                    const remaining: number = currentScore(
                        updatedLeg,
                        opposite(currentThrow),
                    );

                    if (remaining !== updatedLeg.startingScore) {
                        scoreChanged = opposite(currentThrow);
                    }
                }
            }
        }
        if (updated) {
            setMatchSaygData(newMatchSaygLookup);
            setScoreChanged(scoreChanged);
        }
        const tournamentUpdate = allUpdates[id] as TournamentGameDto;
        if (tournamentUpdate) {
            // find all matches and their saygIds
            // if any are not in newMatchSaygLookup, add them and subscribe (via pending)
            const allSaygIds: string[] =
                tournamentUpdate.round?.matches
                    ?.filter((m: TournamentMatchDto) => !!m.saygId)
                    .map((m: TournamentMatchDto) => m.saygId!) || [];
            const newSaygSubscriptions: ISubscriptionRequest[] = allSaygIds
                .filter((id) => !newMatchSaygLookup[id])
                .map((id) => {
                    return {
                        id: id,
                        type: LiveDataType.sayg,
                    };
                });
            setPendingLiveSubscriptions(
                pendingLiveSubscriptions.concat(newSaygSubscriptions),
            );
        }
    }, [allUpdates]);

    function opposite(player: 'home' | 'away'): 'away' | 'home' {
        return player === 'home' ? 'away' : 'home';
    }

    async function subscribeToNextSayg() {
        /* istanbul ignore next */
        if (subscribing) {
            /* istanbul ignore next */
            return;
        }

        setSubscribing(true);
        try {
            const firstSubscription = pendingLiveSubscriptions[0];
            await enableLiveUpdates(true, firstSubscription);
            setPendingLiveSubscriptions(
                pendingLiveSubscriptions.filter((_, index) => index > 0),
            );
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

        setPendingLiveSubscriptions(
            Object.values(matchSaygData).map((sayg) => {
                return {
                    id: sayg.id,
                    type: LiveDataType.sayg,
                };
            }),
        );
        setMatchSaygData(matchSaygData);
    }

    function sumOf(
        match: TournamentMatchDto,
        player: 'home' | 'away',
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
        player: 'home' | 'away',
    ): string | number {
        const average =
            sumOf(match, player, 'score') /
            (sumOf(match, player, 'noOfDarts') / 3);
        const appropriateAverage = average / 3;
        return Number.isNaN(appropriateAverage)
            ? '-'
            : appropriateAverage.toFixed(2);
    }

    function getScore(
        match: TournamentMatchDto,
        player: 'home' | 'away',
    ): number {
        const side = player === 'home' ? 'scoreA' : 'scoreB';
        return match[side]!;
    }

    function isWinner(
        match: TournamentMatchDto,
        player: 'home' | 'away',
    ): boolean {
        const score = getScore(match, player);
        const bestOf = tournament?.bestOf ?? 7;
        return score > bestOf / 2.0;
    }

    function hasWinner(match: TournamentMatchDto): boolean {
        return isWinner(match, 'home') || isWinner(match, 'away');
    }

    function firstInitialAndLastNames(name?: string): string | undefined {
        const names: string[] = name?.split(' ') ?? [];
        if (names.length === 1) {
            return name;
        }

        return names
            .map((name, index) => {
                return index === names.length - 1 ? name : name[0];
            })
            .join(' ');
    }

    function currentScore(leg: LegDto, side: 'home' | 'away') {
        const startingScore = leg.startingScore || 501;
        const accumulator: LegCompetitorScoreDto = leg[side];
        return (
            startingScore -
            getScoreFromThrows(startingScore, accumulator.throws || [])
        );
    }

    function lastIncompleteMatch(
        matches: TournamentMatchDto[],
    ): TournamentMatchDto | null {
        for (const match of reverse(matches)) {
            if (hasWinner(match)) {
                // don't look past the last winning match
                return null;
            }

            if (hasSaygData(match)) {
                return match;
            }
        }

        return null;
    }

    function hasSaygData(match: TournamentMatchDto): boolean {
        const matchSayg: RecordedScoreAsYouGoDto | undefined =
            matchSaygData[match.id];
        return matchSayg && Object.keys(matchSayg.legs).length >= 1;
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
        ? matchSaygData[lastMatch!.id]
        : undefined;
    const lastMatchLegs = Object.values(lastMatchSayg?.legs || {});
    const lastLeg = lastMatchLegs[lastMatchLegs.length - 1];
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
                    {tournament.round?.matches?.map((m: TournamentMatchDto) => {
                        const homeWinner = isWinner(m, 'home');
                        const awayWinner = isWinner(m, 'away');
                        if (homeWinner) {
                            totals.home++;
                        }
                        if (awayWinner) {
                            totals.away++;
                        }

                        return (
                            <tr key={m.id}>
                                <td
                                    className={`text-danger ${homeWinner ? 'fw-bold' : ''}`}>
                                    {getAverage(m, 'home')}
                                </td>
                                <td
                                    className={`text-end ${homeWinner ? 'fw-bold' : ''}`}>
                                    {firstInitialAndLastNames(m.sideA?.name)}
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
                                    {firstInitialAndLastNames(m.sideB?.name)}
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
                                {totals.home}
                            </td>
                            <td></td>
                            <td className="text-secondary" colSpan={3}>
                                {totals.home}
                            </td>
                        </tr>
                    </tfoot>
                ) : null}
            </table>
            {lastMatch &&
            lastLeg &&
            canUseWebSockets &&
            !hasWinner(lastMatch!) ? (
                <div
                    className="d-flex flex-column border-3 bg-black p-0 rounded-3"
                    datatype="live-scores">
                    <div className="d-flex flex-row justify-content-center bg-success text-black fs-4 rounded-top-3">
                        <span className="flex-grow-1 px-3 text-end flex-basis-0">
                            {firstInitialAndLastNames(lastMatch!.sideA?.name)}
                        </span>
                        <span>
                            {getScore(lastMatch!, 'home')} -{' '}
                            {getScore(lastMatch!, 'away')}
                        </span>
                        <span className="flex-grow-1 px-3 text-start flex-basis-0">
                            {firstInitialAndLastNames(lastMatch!.sideB?.name)}
                        </span>
                    </div>
                    <div className="d-flex flex-row justify-content-center text-success">
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
