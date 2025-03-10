import {useApp} from "../../common/AppContainer";
import {renderDate} from "../../../helpers/rendering";
import {TournamentMatchDto} from "../../../interfaces/models/dtos/Game/TournamentMatchDto";
import {useTournament} from "../TournamentContainer";
import {MatchSayg} from "../MatchSayg";
import {PatchTournamentDto} from "../../../interfaces/models/dtos/Game/PatchTournamentDto";
import {PatchTournamentRoundDto} from "../../../interfaces/models/dtos/Game/PatchTournamentRoundDto";
import {GameMatchOptionDto} from "../../../interfaces/models/dtos/Game/GameMatchOptionDto";

export interface IMasterDrawProps {
    matches: TournamentMatchDto[];
    host: string;
    opponent: string;
    gender: string;
    date: string;
    type: string;
    patchData?(patch: PatchTournamentDto | PatchTournamentRoundDto, nestInRound?: boolean, saygId?: string): Promise<boolean>;
    readOnly?: boolean;
}

export function MasterDraw({matches, host, opponent, gender, date, type, patchData, readOnly}: IMasterDrawProps) {
    const {onError} = useApp();
    const {tournamentData, setEditTournament, preventScroll } = useTournament();
    const matchOptions: GameMatchOptionDto = {
        numberOfLegs: tournamentData.bestOf,
    };

    async function patchRoundData(patch: PatchTournamentDto | PatchTournamentRoundDto, nestInRound?: boolean, saygId?: string) {
        if (!nestInRound) {
            // no need to pass this up, super-league tournaments don't record 180s and hi-checks differently
            return;
        }

        const roundPatch: PatchTournamentRoundDto = patch as PatchTournamentRoundDto;
        if (patchData) {
            await patchData(roundPatch, nestInRound, saygId);
        }
    }

    try {
        return (<div className="page-break-after" datatype="master-draw">
            <h2 onClick={setEditTournament ? async () => await setEditTournament('matches') : undefined}>Master draw</h2>
            <div className="d-flex flex-row">
                <div>
                    <table className={`table${preventScroll ? ' max-height-100' : ''}`}>
                        {preventScroll ? null : (<thead>
                        <tr onClick={setEditTournament ? async () => await setEditTournament('matches') : undefined}>
                            <th>#</th>
                            <th>{host}</th>
                            <th>v</th>
                            <th>{opponent}</th>
                            <th className="d-print-none"></th>
                        </tr>
                        </thead>)}
                        <tbody>
                        {matches.map((m: TournamentMatchDto, index: number) => {
                            const oddNumberedMatch: boolean = (index + 1) % 2 !== 0;

                            return (<tr key={index}>
                                <td onClick={setEditTournament ? async () => await setEditTournament('matches') : undefined}>{index + 1}</td>
                                <td onClick={setEditTournament ? async () => await setEditTournament('matches') : undefined}>{preventScroll ? '' : m.sideA.name}</td>
                                <td onClick={setEditTournament ? async () => await setEditTournament('matches') : undefined}>v</td>
                                <td onClick={setEditTournament ? async () => await setEditTournament('matches') : undefined}>{preventScroll ? '' : m.sideB.name}</td>
                                <td className="d-print-none">
                                    <MatchSayg
                                        match={m}
                                        matchOptions={matchOptions}
                                        matchIndex={index}
                                        patchData={patchRoundData}
                                        readOnly={readOnly}
                                        showViewSayg={true}
                                        firstLegPlayerSequence={oddNumberedMatch ? ['away', 'home'] : ['home', 'away']}
                                        finalLegPlayerSequence={oddNumberedMatch ? ['away', 'home'] : ['home', 'away']}
                                        initialOneDartAverage={true} />
                                </td>
                            </tr>);
                        })}
                        </tbody>
                        {setEditTournament && !preventScroll ? (<tfoot className="d-print-none">
                        <tr>
                            <td colSpan={5} onClick={async () => await setEditTournament('matches')}>
                                <div className="alert alert-warning p-2">
                                    Click to edit matches
                                </div>
                            </td>
                        </tr>
                        </tfoot>) : null}
                    </table>
                </div>
                {preventScroll ? null : (<div className="px-5" datatype="details" onClick={setEditTournament ? async () => await setEditTournament('details') : undefined}>
                    <div>Gender: <span className="fw-bold">{gender}</span></div>
                    <div>Date: <span className="fw-bold">{renderDate(date)}</span></div>
                    {type ? (<div>Notes: <span className="fw-bold">{type}</span></div>) : null}

                    {setEditTournament ? (<div className="d-print-none alert alert-warning p-2 m-3 ms-0">
                        Click to edit details
                    </div>) : null}
                </div>)}
            </div>
        </div>);
    } catch (e) {
        /* istanbul ignore next */
        onError(e);
    }
}