import {useApp} from "../../common/AppContainer";
import {renderDate} from "../../../helpers/rendering";
import {TournamentMatchDto} from "../../../interfaces/models/dtos/Game/TournamentMatchDto";
import {PatchTournamentDto} from "../../../interfaces/models/dtos/Game/PatchTournamentDto";
import {PatchTournamentRoundDto} from "../../../interfaces/models/dtos/Game/PatchTournamentRoundDto";
import {propChanged, valueChanged} from "../../../helpers/events";
import {BootstrapDropdown, IBootstrapDropdownItem} from "../../common/BootstrapDropdown";
import {TournamentGameDto} from "../../../interfaces/models/dtos/Game/TournamentGameDto";
import {TeamDto} from "../../../interfaces/models/dtos/Team/TeamDto";
import {UntypedPromise} from "../../../interfaces/UntypedPromise";
import {EditSuperleagueMatch} from "./EditSuperleagueMatch";
import {useState} from "react";
import {createTemporaryId} from "../../../helpers/projection";
import {any, isEmpty} from "../../../helpers/collections";
import {useTournament} from "../TournamentContainer";
import {TeamSeasonDto} from "../../../interfaces/models/dtos/Team/TeamSeasonDto";

export interface IMasterDrawProps {
    patchData?(patch: PatchTournamentDto | PatchTournamentRoundDto, nestInRound?: boolean, saygId?: string): Promise<boolean>;
    readOnly?: boolean;
    tournamentData: TournamentGameDto;
    preventScroll?: boolean;
    setTournamentData(newData: TournamentGameDto, save?: boolean): UntypedPromise;
}

export function MasterDraw({patchData, readOnly, tournamentData, preventScroll, setTournamentData}: IMasterDrawProps) {
    const {onError, teams} = useApp();
    const {matchOptionDefaults} = useTournament();
    const [newMatch, setNewMatch] = useState<TournamentMatchDto>(getEmptyMatch());
    const genderOptions: IBootstrapDropdownItem[] = [
        {text: 'Men', value: 'men'},
        {text: 'Women',value: 'women'}
    ];
    const teamOptions: IBootstrapDropdownItem[] = teams
        .filter((t: TeamDto) => {
            return !!t.seasons?.filter((ts: TeamSeasonDto) => ts.seasonId === tournamentData.seasonId && !ts.deleted)[0];
        })
        .map((t: TeamDto): IBootstrapDropdownItem => {
            return {
                text: t.name,
                value: t.name
            };
        });

    async function updateAndSaveTournamentData(data: TournamentGameDto) {
        await setTournamentData(data, true);
    }

    async function setMatch(update: TournamentMatchDto, index: number) {
        const newRound = Object.assign({}, tournamentData.round!);
        newRound.matches = tournamentData.round!.matches!.map((m, i) => i === index ? update : m);
        const newData = Object.assign({}, tournamentData);
        newData.round = newRound;

        await setTournamentData(newData, true);
    }

    async function deleteMatch(index: number) {
        if (!confirm('Are you sure you want to remove this match?')) {
            return;
        }

        const newRound = Object.assign({}, tournamentData.round!);
        newRound.matches = tournamentData.round!.matches!.filter((_, i) => i !== index);
        newRound.matchOptions = tournamentData.round!.matchOptions!.filter((_, i) => i !== index);
        const newData = Object.assign({}, tournamentData);
        newData.round = newRound;

        await setTournamentData(newData, true);
    }

    function getEmptyMatch(): TournamentMatchDto {
        return {
            id: createTemporaryId(),
            sideA: { id: createTemporaryId(), players: [] },
            sideB: { id: createTemporaryId(), players: [] },
        };
    }

    async function updateNewMatch(update: TournamentMatchDto) {
        if (!isEmpty(update.sideA.players) && !isEmpty(update.sideB.players)) {
            const newRound = Object.assign({}, tournamentData.round!);
            newRound.matches = (tournamentData.round?.matches || []).concat(update);
            const newData = Object.assign({}, tournamentData);
            newRound.matchOptions = matchOptionDefaults
                ? (newRound.matchOptions || []).concat(matchOptionDefaults)
                : (newRound.matchOptions || []);
            newData.round = newRound;

            await setTournamentData(newData, true);
            setNewMatch(getEmptyMatch());
        }
        else {
            setNewMatch(update);
        }
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
                            <th datatype="host">
                                {readOnly || any(tournamentData.round?.matches) ? tournamentData.host : <BootstrapDropdown
                                    value={tournamentData.host}
                                    onChange={propChanged(tournamentData, updateAndSaveTournamentData, 'host')}
                                    options={teamOptions.filter(to => to.value !== tournamentData.opponent)}/>}
                            </th>
                            <th>v</th>
                            <th datatype="opponent">
                                {readOnly || any(tournamentData.round?.matches) ? tournamentData.opponent : <BootstrapDropdown
                                    value={tournamentData.opponent}
                                    onChange={propChanged(tournamentData, updateAndSaveTournamentData, 'opponent')}
                                    options={teamOptions.filter(to => to.value !== tournamentData.host)}/>}
                            </th>
                            <th className="d-print-none"></th>
                        </tr>
                        </thead>)}
                        <tbody>
                        {tournamentData.round?.matches!.map((match: TournamentMatchDto, index: number) => {
                            return (<EditSuperleagueMatch
                                key={match.id}
                                index={index}
                                match={match}
                                setMatchData={async (update) => await setMatch(update, index)}
                                readOnly={readOnly}
                                preventScroll={preventScroll}
                                tournamentData={tournamentData}
                                patchData={patchData}
                                deleteMatch={async () => await deleteMatch(index)} />);
                        })}
                        {readOnly ? null : <EditSuperleagueMatch
                            match={newMatch}
                            setMatchData={updateNewMatch}
                            preventScroll={preventScroll}
                            tournamentData={tournamentData} />}
                        </tbody>
                    </table>
                </div>
                {preventScroll ? null : (<div className="px-5" datatype="details">
                    <div datatype="gender">{!readOnly
                        ? (<BootstrapDropdown
                            value={tournamentData.gender}
                            onChange={propChanged(tournamentData, updateAndSaveTournamentData, 'gender')}
                            options={genderOptions}/>)
                        : (<span className="fw-bold">Gender: {tournamentData.gender}</span>)}</div>
                    <div>Date: <span className="fw-bold">{renderDate(tournamentData.date)}</span></div>
                    {tournamentData.type ||!readOnly ? (<div datatype="type">{!readOnly
                        ? (<input
                            value={tournamentData.type || ''}
                            name="type"
                            className="form-control"
                            placeholder="e.g. Board #"
                            onChange={valueChanged(tournamentData, setTournamentData)}
                            onBlur={() => setTournamentData(tournamentData, true)} />)
                        : (<span className="fw-bold">Notes: {tournamentData.type}</span>)}</div>) : null}
                </div>)}
            </div>
        </div>);
    } catch (e) {
        /* istanbul ignore next */
        onError(e);
    }
}