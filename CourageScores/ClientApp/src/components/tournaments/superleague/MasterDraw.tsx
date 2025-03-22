import {useApp} from "../../common/AppContainer";
import {renderDate} from "../../../helpers/rendering";
import {TournamentMatchDto} from "../../../interfaces/models/dtos/Game/TournamentMatchDto";
import {useTournament} from "../TournamentContainer";
import {MatchSayg} from "../MatchSayg";
import {PatchTournamentDto} from "../../../interfaces/models/dtos/Game/PatchTournamentDto";
import {PatchTournamentRoundDto} from "../../../interfaces/models/dtos/Game/PatchTournamentRoundDto";
import {GameMatchOptionDto} from "../../../interfaces/models/dtos/Game/GameMatchOptionDto";
import {propChanged, valueChanged} from "../../../helpers/events";
import {BootstrapDropdown, IBootstrapDropdownItem} from "../../common/BootstrapDropdown";
import {TournamentGameDto} from "../../../interfaces/models/dtos/Game/TournamentGameDto";
import {TeamDto} from "../../../interfaces/models/dtos/Team/TeamDto";

export interface IMasterDrawProps {
    matches: TournamentMatchDto[];
    patchData?(patch: PatchTournamentDto | PatchTournamentRoundDto, nestInRound?: boolean, saygId?: string): Promise<boolean>;
    readOnly?: boolean;
}

export function MasterDraw({matches, patchData, readOnly}: IMasterDrawProps) {
    const {onError, teams} = useApp();
    const {tournamentData, setEditTournament, preventScroll, setTournamentData } = useTournament();
    const matchOptions: GameMatchOptionDto = {
        numberOfLegs: tournamentData.bestOf,
    };
    const unselected: IBootstrapDropdownItem = {text: <>&nbsp;</>, value: null};
    const genderOptions: IBootstrapDropdownItem[] = [
        unselected,
        {text: 'Men', value: 'men'},
        {text: 'Women',value: 'women'}
    ];
    const teamOptions: IBootstrapDropdownItem[] = teams
        .filter((t: TeamDto) => {
            return !!t.seasons?.filter(ts => ts.seasonId === tournamentData.seasonId)[0];
        })
        .map((t: TeamDto): IBootstrapDropdownItem => {
            return {
                text: t.name,
                value: t.name
            };
        });

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

    async function updateAndSaveTournamentData(data: TournamentGameDto) {
        await setTournamentData!(data, true);
    }

    try {
        return (<div className="page-break-after" datatype="master-draw">
            <h2>Master draw</h2>
            <div className="d-flex flex-row">
                <div>
                    <table className={`table${preventScroll ? ' max-height-100' : ''}`}>
                        {preventScroll ? null : (<thead>
                        <tr>
                            <th>#</th>
                            <th>
                                <BootstrapDropdown
                                    value={tournamentData.host}
                                    onChange={propChanged(tournamentData, updateAndSaveTournamentData, 'host')}
                                    options={teamOptions}/>
                            </th>
                            <th>v</th>
                            <th>
                                <BootstrapDropdown
                                    value={tournamentData.opponent}
                                    onChange={propChanged(tournamentData, updateAndSaveTournamentData, 'opponent')}
                                    options={teamOptions}/>
                            </th>
                            <th className="d-print-none"></th>
                        </tr>
                        </thead>)}
                        <tbody>
                        {matches.map((m: TournamentMatchDto, index: number) => {
                            const oddNumberedMatch: boolean = (index + 1) % 2 !== 0;

                            return (<tr key={index} onClick={setEditTournament ? async () => await setEditTournament('matches') : undefined}>
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
                {preventScroll ? null : (<div className="px-5" datatype="details">
                    <div>Gender: {!readOnly
                        ? (<BootstrapDropdown
                            value={tournamentData.gender}
                            onChange={propChanged(tournamentData, updateAndSaveTournamentData, 'gender')}
                            options={genderOptions}/>)
                        : (<span className="fw-bold">gender</span>)}</div>
                    <div>Date: <span className="fw-bold">{renderDate(tournamentData.date)}</span></div>
                    {tournamentData.type ||!readOnly ? (<div>Notes: {!readOnly
                        ? (<input
                            value={tournamentData.type}
                            name="type"
                            className="form-control"
                            onChange={valueChanged(tournamentData, updateAndSaveTournamentData)} />)
                        : (<span className="fw-bold">{tournamentData.type}</span>)}</div>) : null}
                </div>)}
            </div>
        </div>);
    } catch (e) {
        /* istanbul ignore next */
        onError(e);
    }
}