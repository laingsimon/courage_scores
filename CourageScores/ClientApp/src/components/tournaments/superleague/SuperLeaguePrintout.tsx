import { MasterDraw } from './MasterDraw.tsx';
import { MatchLog } from './MatchLog.tsx';
import { Summary } from './Summary.tsx';
import { MatchReport } from './MatchReport.tsx';
import { useEffect, useState } from 'react';
import { any, max } from '../../../helpers/collections.ts';
import { useDependencies } from '../../common/IocContainer.tsx';
import { useApp } from '../../common/AppContainer.tsx';
import { useTournament } from '../TournamentContainer.tsx';
import { useLocation } from 'react-router';
import {
    getNoOfLegs,
    maxNoOfThrowsAllMatches,
} from '../../../helpers/superleague.ts';
import { RefreshControl } from '../../common/RefreshControl.tsx';
import { useLive } from '../../../live/LiveContainer.tsx';
import { ISuperleagueSaygMatchMapping } from './ISuperleagueSaygMatchMapping.ts';
import { DivisionDto } from '../../../interfaces/models/dtos/DivisionDto.ts';
import { TournamentMatchDto } from '../../../interfaces/models/dtos/Game/TournamentMatchDto.ts';
import { RecordedScoreAsYouGoDto } from '../../../interfaces/models/dtos/Game/Sayg/RecordedScoreAsYouGoDto.ts';
import { ISubscription } from '../../../live/ISubscription.ts';
import { PatchTournamentDto } from '../../../interfaces/models/dtos/Game/PatchTournamentDto.ts';
import { PatchTournamentRoundDto } from '../../../interfaces/models/dtos/Game/PatchTournamentRoundDto.ts';
import { LiveDataType } from '../../../interfaces/models/dtos/Live/LiveDataType.ts';
import { Loading } from '../../common/Loading.tsx';
import { hasAccess } from '../../../helpers/conditions.ts';
import { AccessOption } from '../../../interfaces/models/dtos/Identity/AccessOption.ts';

export interface ISuperLeaguePrintoutProps {
    division: DivisionDto;
    patchData?(
        patch: PatchTournamentDto | PatchTournamentRoundDto,
        nestInRound?: boolean,
    ): Promise<boolean>;
    readOnly?: boolean;
}

interface ISaygDataMap {
    [saygId: string]: RecordedScoreAsYouGoDto | undefined;
}

export function SuperLeaguePrintout({
    division,
    patchData,
    readOnly,
}: ISuperLeaguePrintoutProps) {
    const { onError, account } = useApp();
    const {
        tournamentData,
        setEditTournament,
        setTournamentData,
        superleagueMasterDrawOnly,
    } = useTournament();
    const { saygApi, webSocket } = useDependencies();
    const location = useLocation();
    const { subscriptions } = useLive();
    const [saygDataMap, setSaygDataMap] = useState<ISaygDataMap>({});
    const [loading, setLoading] = useState<boolean>(false);
    const [finishedLoading, setFinishedLoading] = useState<boolean>(false);
    const matches: TournamentMatchDto[] =
        (tournamentData.round || {}).matches || [];
    const unloadedIds: string[] = matches
        .map((m: TournamentMatchDto) => m.saygId!)
        .filter(
            (id: string) =>
                id &&
                !any(Object.keys(saygDataMap), (key: string) => key === id),
        );
    const showWinner: boolean = location.search.indexOf('winner') !== -1;
    const kioskMode: boolean = hasAccess(account, AccessOption.kioskMode);

    useEffect(
        () => {
            if (loading) {
                return;
            }

            // noinspection JSIgnoredPromiseFromCall
            loadSaygData(unloadedIds);
        },
        // eslint-disable-next-line
        [loading, saygDataMap, unloadedIds],
    );

    useEffect(
        () => {
            if (loading) {
                return;
            }

            processLiveStateChange(subscriptions[tournamentData.id]);
        },
        // eslint-disable-next-line
        [subscriptions, loading],
    );

    function processLiveStateChange(enabled: ISubscription) {
        if (enabled) {
            for (const saygId in saygDataMap) {
                if (!subscriptions[saygId]) {
                    // noinspection JSIgnoredPromiseFromCall
                    webSocket.subscribe(
                        { id: saygId, type: LiveDataType.sayg },
                        (newSaygData: RecordedScoreAsYouGoDto) => {
                            const newSaygDataMap: ISaygDataMap = Object.assign(
                                {},
                                saygDataMap,
                            );
                            newSaygDataMap[newSaygData.id] = newSaygData;
                            setSaygDataMap(newSaygDataMap);
                        },
                        onError,
                    );
                }
            }

            return;
        }

        // foreach socket in saygSockets, close and remove it
        for (const saygId in saygDataMap) {
            if (subscriptions[saygId]) {
                // noinspection JSIgnoredPromiseFromCall
                webSocket.unsubscribe(saygId);
            }
        }
    }

    async function loadSaygData(ids: string[]) {
        if (!any(ids)) {
            setLoading(false);
            setFinishedLoading(true);
            return;
        }

        try {
            setLoading(true);
            const firstId: string = ids[0];
            const result: RecordedScoreAsYouGoDto | null =
                await saygApi.get(firstId);
            const newSaygDataMap: ISaygDataMap = Object.assign({}, saygDataMap);
            newSaygDataMap[firstId] = result || undefined;
            setSaygDataMap(newSaygDataMap);
            setLoading(false);
        } catch (e) {
            /* istanbul ignore next */
            onError(e);
        }
    }

    async function patchDataAndTriggerSaygReload(
        patch: PatchTournamentDto | PatchTournamentRoundDto,
        nestInRound?: boolean,
        saygId?: string,
    ): Promise<boolean> {
        if (!patchData) {
            return false;
        }

        const result: boolean = await patchData(patch, nestInRound);
        if (result && nestInRound) {
            if (saygId && saygDataMap[saygId]) {
                const newSaygDataMap: ISaygDataMap = Object.assign(
                    {},
                    saygDataMap,
                );
                delete newSaygDataMap[saygId];
                setSaygDataMap(newSaygDataMap); // changing this will trigger the useEffect that calls onto loadSaygData()
                // NOTE: cannot change `finishedLoading` as it closes the sayg dialog
            }
        }
        return result;
    }

    if ((any(unloadedIds) || loading) && !finishedLoading) {
        return <Loading nested={true} />;
    }

    const saygMatches: ISuperleagueSaygMatchMapping[] = matches.map(
        (m: TournamentMatchDto): ISuperleagueSaygMatchMapping => {
            return {
                match: m,
                saygData: saygDataMap[m.saygId!],
            };
        },
    );
    const noOfThrows: number = maxNoOfThrowsAllMatches(saygMatches);
    const noOfLegs: number =
        tournamentData.bestOf ||
        max(
            saygMatches,
            (map: ISuperleagueSaygMatchMapping) =>
                getNoOfLegs(map.saygData) || 0,
        );

    try {
        return (
            <div className="overflow-auto no-overflow-on-print">
                <div className="float-end">
                    <RefreshControl
                        id={tournamentData.id}
                        type={LiveDataType.tournament}
                    />
                </div>
                <MasterDraw
                    tournamentData={tournamentData}
                    setTournamentData={setTournamentData!}
                    patchData={patchDataAndTriggerSaygReload}
                    readOnly={
                        readOnly || !setEditTournament || !setTournamentData
                    }
                    kioskMode={kioskMode}
                />
                {kioskMode || superleagueMasterDrawOnly ? null : (
                    <MatchLog
                        host={tournamentData.host!}
                        opponent={tournamentData.opponent!}
                        showWinner={showWinner}
                        noOfThrows={noOfThrows}
                        saygMatches={saygMatches}
                    />
                )}
                {kioskMode || superleagueMasterDrawOnly ? null : (
                    <Summary
                        showWinner={showWinner}
                        noOfLegs={noOfLegs}
                        saygMatches={saygMatches}
                        host={tournamentData.host!}
                        opponent={tournamentData.opponent!}
                    />
                )}
                {kioskMode || superleagueMasterDrawOnly ? null : (
                    <MatchReport
                        gender={tournamentData.gender!}
                        host={tournamentData.host!}
                        opponent={tournamentData.opponent!}
                        saygMatches={saygMatches}
                        division={division}
                        showWinner={showWinner}
                        noOfThrows={noOfThrows}
                        noOfLegs={noOfLegs}
                    />
                )}
            </div>
        );
    } catch (e) {
        /* istanbul ignore next */
        onError(e);
    }
}
