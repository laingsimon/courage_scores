import {useApp} from "../../common/AppContainer";
import {renderDate} from "../../../helpers/rendering";
import {TournamentMatchDto} from "../../../interfaces/models/dtos/Game/TournamentMatchDto";
import {TournamentGameDto} from "../../../interfaces/models/dtos/Game/TournamentGameDto";
import {useTournament} from "../TournamentContainer";
import {MatchSayg} from "../MatchSayg";
import {TournamentRoundDto} from "../../../interfaces/models/dtos/Game/TournamentRoundDto";
import {PatchTournamentDto} from "../../../interfaces/models/dtos/Game/PatchTournamentDto";
import {PatchTournamentRoundDto} from "../../../interfaces/models/dtos/Game/PatchTournamentRoundDto";
import {GameMatchOptionDto} from "../../../interfaces/models/dtos/Game/GameMatchOptionDto";

export interface IMasterDrawProps {
    matches: TournamentMatchDto[];
    host: string;
    opponent: string;
    gender: string;
    date: string;
    notes: string;
    patchData?: (patch: PatchTournamentDto | PatchTournamentRoundDto, nestInRound?: boolean) => Promise<any>;
    readOnly?: boolean;
}

export function MasterDraw({matches, host, opponent, gender, date, notes, patchData, readOnly}: IMasterDrawProps) {
    const {onError} = useApp();
    const {tournamentData, setTournamentData, setEditTournament } = useTournament();
    const matchOptions: GameMatchOptionDto = {
        numberOfLegs: tournamentData.bestOf,
    };

    async function onChange(updatedRound: TournamentRoundDto) {
        const newTournamentData: TournamentGameDto = Object.assign({}, tournamentData);
        newTournamentData.round = updatedRound;

        await setTournamentData(newTournamentData);
    }

    async function patchRoundData(patch: PatchTournamentDto | PatchTournamentRoundDto, nestInRound?: boolean) {
        if (!nestInRound) {
            // e.g. 180s/hi-checks, which don't apply to rounds, so can be pass up without including the nested round info.
            await patchData(patch, nestInRound);
            return;
        }

        const roundPatch: PatchTournamentRoundDto = patch as PatchTournamentRoundDto;
        await patchData(roundPatch, nestInRound);
    }

    try {
        return (<div className="page-break-after" datatype="master-draw">
            <h2 onClick={setEditTournament ? async () => await setEditTournament('matches') : null}>Master draw</h2>
            <div className="d-flex flex-row">
                <div>
                    <table className="table">
                        <thead>
                        <tr onClick={setEditTournament ? async () => await setEditTournament('matches') : null}>
                            <th>#</th>
                            <th>{host}</th>
                            <th>v</th>
                            <th>{opponent}</th>
                            <th className="d-print-none"></th>
                        </tr>
                        </thead>
                        <tbody>
                        {matches.map((m: TournamentMatchDto, index: number) => {
                            return (<tr key={index}>
                                <td onClick={setEditTournament ? async () => await setEditTournament('matches') : null}>{index + 1}</td>
                                <td onClick={setEditTournament ? async () => await setEditTournament('matches') : null}>{m.sideA.name}</td>
                                <td onClick={setEditTournament ? async () => await setEditTournament('matches') : null}>v</td>
                                <td onClick={setEditTournament ? async () => await setEditTournament('matches') : null}>{m.sideB.name}</td>
                                <td className="d-print-none">
                                    <MatchSayg
                                        match={m}
                                        round={tournamentData.round}
                                        onChange={onChange}
                                        matchOptions={matchOptions}
                                        matchIndex={index}
                                        patchData={patchRoundData}
                                        readOnly={readOnly} />
                                </td>
                            </tr>);
                        })}
                        </tbody>
                        {setEditTournament ? (<tfoot className="d-print-none">
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
                <div className="px-5" datatype="details" onClick={setEditTournament ? async () => await setEditTournament('details') : null}>
                    <div>Gender: <span className="fw-bold">{gender}</span></div>
                    <div>Date: <span className="fw-bold">{renderDate(date)}</span></div>
                    {notes ? (<div>Notes: <span className="fw-bold">{notes}</span></div>) : null}

                    {setEditTournament ? (<div className="d-print-none alert alert-warning p-2 m-3 ms-0">
                        Click to edit details
                    </div>) : null}
                </div>
            </div>
        </div>);
    } catch (e) {
        /* istanbul ignore next */
        onError(e);
    }
}