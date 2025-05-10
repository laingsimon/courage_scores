import {TournamentGameDto} from "../../interfaces/models/dtos/Game/TournamentGameDto";
import {TournamentMatchDto} from "../../interfaces/models/dtos/Game/TournamentMatchDto";
import {useEffect, useState} from "react";
import {RecordedScoreAsYouGoDto} from "../../interfaces/models/dtos/Game/Sayg/RecordedScoreAsYouGoDto";
import {LegDto} from "../../interfaces/models/dtos/Game/Sayg/LegDto";
import {any, sum} from "../../helpers/collections";
import {useDependencies} from "../common/IocContainer";
import {UntypedPromise} from "../../interfaces/UntypedPromise";
import {Link} from "react-router";
import {Loading} from "../common/Loading";
import {useApp} from "../common/AppContainer";

export interface ILiveSuperleagueTournamentDisplayProps {
    id: string;
    data?: TournamentGameDto;
    onRemove?(): UntypedPromise;
    showLoading?: boolean;
    refreshRequired?: boolean;
    refreshComplete(): UntypedPromise;
}

interface IMatchSaygLookup {
    [matchId: string]: RecordedScoreAsYouGoDto;
}

export function LiveSuperleagueTournamentDisplay({id, data, onRemove, showLoading, refreshRequired, refreshComplete}: ILiveSuperleagueTournamentDisplayProps) {
    const {saygApi, tournamentApi} = useDependencies();
    const {fullScreen} = useApp();
    const [matchSaygData, setMatchSaygData] = useState<IMatchSaygLookup>({});
    const [initialData, setInitialData] = useState<TournamentGameDto | undefined | null>(undefined);
    const tournament = data ?? initialData;

    useEffect(() => {
        if (initialData === undefined || refreshRequired) {
            // noinspection JSIgnoredPromiseFromCall
            fetchInitialData(id);

            if (refreshRequired) {
                // noinspection JSIgnoredPromiseFromCall
                refreshComplete();
            }
        }
    });

    useEffect(() => {
        if (tournament) {
            // noinspection JSIgnoredPromiseFromCall
            getLatestMatchData(tournament?.round?.matches || []);
        }
    }, [tournament]);

    async function fetchInitialData(id: string) {
        const response = await tournamentApi.get(id);
        setInitialData(response);
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
        setMatchSaygData(matchSaygData);
    }

    function sumOf(match: TournamentMatchDto, player: 'home' | 'away', prop: string): number {
        const matchSayg: RecordedScoreAsYouGoDto = matchSaygData[match.id];
        if (!matchSayg) {
            return Number.NaN;
        }

        const legs = matchSayg.legs;
        const value: number = sum(Object.values(legs), (leg: LegDto) => leg[player][prop]);
        if (!Number.isNaN(value)) {
            return value;
        }

        throw new Error(`Cannot calculate the sum of ${prop} for ${player}, value results in NaN`);
    }

    function getAverage(match: TournamentMatchDto, player: 'home' | 'away'): string | number {
        const average = sumOf(match, player, 'score') / (sumOf(match, player, 'noOfDarts') / 3);
        const appropriateAverage = (average / 3);
        return Number.isNaN(appropriateAverage) ? '-' : appropriateAverage.toFixed(2);
    }

    function getScore(match: TournamentMatchDto, player: 'home' | 'away'): number {
        const side = player === 'home' ? 'scoreA' : 'scoreB';
        return match[side]!;
    }

    function isWinner(match: TournamentMatchDto, player: 'home' | 'away'): boolean {
        const score = getScore(match, player);
        const bestOf = tournament?.bestOf ?? 7;
        return score > (bestOf / 2.0);
    }

    function firstInitialAndLastNames(name?: string): string | undefined {
        const names: string[] = name?.split(' ') ?? [];
        if (names.length === 1) {
            return name;
        }

        return names.map((name, index) => {
            return index === names.length - 1 ? name : name[0]
        }).join(' ');
    }

    if (!tournament) {
        return showLoading ? (<div className="flex-grow-1 bg-white">
            <Loading />
        </div>) : null;
    }

    const totals = {
        home: 0,
        away: 0,
    };
    return (<div className={`d-flex flex-column justify-content-center${refreshRequired ? ' opacity-50' : ''}`}>
        <h3 className="flex-grow-0 flex-shrink-0 text-center">
            {onRemove ? (<button className="btn btn-sm btn-secondary me-2" onClick={onRemove}>❌</button>) : null}
            {fullScreen.isFullScreen ? tournament.type : <Link to={`/tournament/${tournament.id}`}>{tournament.type}</Link>}
        </h3>
        <table className="table">
            <thead>
            <tr>
                <th>Avg</th>
                <th>{tournament.host}</th>
                <th className="text-center" colSpan={3}>Score</th>
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

                return (<tr key={m.id}>
                    <td className={`text-danger ${homeWinner ? 'fw-bold' : ''}`}>{getAverage(m, 'home')}</td>
                    <td className={`text-end ${homeWinner ? 'fw-bold' : ''}`}>{firstInitialAndLastNames(m.sideA.name)}</td>
                    <td className={`text-end ${homeWinner ? 'fw-bold' : ''}`}>{getScore(m, 'home')}</td>
                    <td>-</td>
                    <td className={awayWinner ? 'fw-bold' : ''}>{getScore(m, 'away')}</td>
                    <td className={awayWinner ? 'fw-bold' : ''}>{firstInitialAndLastNames(m.sideB.name)}</td>
                    <td className={`text-danger ${awayWinner ? 'fw-bold' : ''}`}>{getAverage(m, 'away')}</td>
                </tr>);
            })}
            </tbody>
            {any(tournament.round?.matches) ? (
            <tfoot>
                <tr>
                    <td className="text-end text-secondary" colSpan={3}>{totals.home}</td>
                    <td></td>
                    <td className="text-secondary" colSpan={3}>{totals.home}</td>
                </tr>
            </tfoot>) : null}
        </table>
    </div>);
}