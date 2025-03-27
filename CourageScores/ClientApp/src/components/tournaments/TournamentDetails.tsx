import {renderDate} from "../../helpers/rendering";
import {ExportDataButton} from "../common/ExportDataButton";
import {propChanged, valueChanged} from "../../helpers/events";
import {BootstrapDropdown, IBootstrapDropdownItem} from "../common/BootstrapDropdown";
import {TournamentMatchDto} from "../../interfaces/models/dtos/Game/TournamentMatchDto";
import {any, distinct} from "../../helpers/collections";
import {TournamentPlayerDto} from "../../interfaces/models/dtos/Game/TournamentPlayerDto";
import {TeamDto} from "../../interfaces/models/dtos/Team/TeamDto";
import {TeamPlayerDto} from "../../interfaces/models/dtos/Team/TeamPlayerDto";
import {useApp} from "../common/AppContainer";
import {TournamentGameDto} from "../../interfaces/models/dtos/Game/TournamentGameDto";
import {TeamSeasonDto} from "../../interfaces/models/dtos/Team/TeamSeasonDto";
import {TournamentRoundDto} from "../../interfaces/models/dtos/Game/TournamentRoundDto";
import {UntypedPromise} from "../../interfaces/UntypedPromise";

export interface ITournamentDetailsProps {
    tournamentData: TournamentGameDto;
    setTournamentData(data: TournamentGameDto): UntypedPromise;
    disabled?: boolean;
}

export function TournamentDetails({ tournamentData, disabled, setTournamentData }: ITournamentDetailsProps) {
    const {teams, divisions} = useApp();
    const allDivisions: IBootstrapDropdownItem = {value: null, text: 'All divisions'};

    function getExportTables(): { [key: string]: string[] } {
        let saygDataIds: string[] = [];
        let teamIds: string[] = [];
        let round: TournamentRoundDto | undefined = tournamentData.round;
        while (round) {
            saygDataIds = saygDataIds.concat(round!.matches!.filter((m: TournamentMatchDto) => m.saygId).map((m: TournamentMatchDto) => m.saygId!));
            round = round!.nextRound;
        }

        const exportRequest: { [key: string]: string[] } = {
            tournamentGame: [tournamentData.id],
            season: [tournamentData.seasonId!],
        };

        if (tournamentData.divisionId) {
            exportRequest.division = [tournamentData.divisionId];
        }

        for (const side of tournamentData.sides || []) {
            if (side.teamId) {
                teamIds = teamIds.concat([side.teamId]);
            } else if (any(side.players)) {
                // get the team ids for the players
                // find the teamId for each player
                teamIds = teamIds.concat((side.players || []).map(getTeamIdForPlayer).filter(id => id !== null));
            }
        }

        if (any(saygDataIds)) {
            exportRequest.recordedScoreAsYouGo = saygDataIds;
        }

        teamIds = distinct(teamIds.filter((id?: string) => id));
        if (any(teamIds)) {
            exportRequest.team = teamIds;
        }

        return exportRequest;
    }

    function getTeamIdForPlayer(player: TournamentPlayerDto): string | null {
        const teamToSeasonMaps = teams.map((t: TeamDto) => {
            return {
                teamSeason: t.seasons!.filter((ts: TeamSeasonDto) => ts.seasonId === tournamentData.seasonId && !ts.deleted)[0],
                team: t,
            }
        });
        const teamsWithPlayer = teamToSeasonMaps
            .filter(map => map.teamSeason && any(map.teamSeason!.players!, (p: TeamPlayerDto) => p.id === player.id));

        if (any(teamsWithPlayer)) {
            return teamsWithPlayer[0].team.id
        }

        return null;
    }

    return (<>
        <h4 className="pb-2">
            <span>Edit tournament: </span>
            <span className="me-4">{renderDate(tournamentData.date)}</span>
            <ExportDataButton tables={getExportTables()}/>
        </h4>
        <div className="input-group mb-1" datatype="address">
            <div className="input-group-prepend">
                <label htmlFor="address" className="input-group-text width-75">Address</label>
            </div>
            <input id="address" className="form-control" disabled={disabled} type="text"
                   value={tournamentData.address}
                   name="address" onChange={valueChanged(tournamentData, setTournamentData)}/>
        </div>
        <div className="form-group input-group mb-1" datatype="type">
            <div className="input-group-prepend">
                <label htmlFor="type" className="input-group-text width-75">Type</label>
            </div>
            <input id="type" className="form-control" disabled={disabled}
                   value={tournamentData.type || ''} name="type"
                   onChange={valueChanged(tournamentData, setTournamentData)}
                   placeholder="Optional type for the tournament"/>
        </div>
        <div className="form-group input-group mb-1" datatype="notes">
            <label htmlFor="note-text" className="input-group-text width-75">Notes</label>
            <textarea id="note-text" className="form-control" disabled={disabled}
                      value={tournamentData.notes || ''} name="notes"
                      onChange={valueChanged(tournamentData, setTournamentData)}
                      placeholder="Notes for the tournament" />
        </div>
        <div className="form-group input-group" datatype="tournament-options">
            <label className="input-group-text width-75">Options</label>
            <div className="form-control">
                <div className="input-group mb-1" datatype="tournament-division">
                    <label className="input-group-text">Division</label>
                    <BootstrapDropdown
                        value={tournamentData.divisionId}
                        onChange={propChanged(tournamentData, setTournamentData, 'divisionId')}
                        options={[allDivisions].concat(divisions.map(d => {
                            return {value: d.id, text: d.name}
                        }))}
                        disabled={disabled} className="margin-right"/>

                    <label htmlFor="bestOf" className="input-group-text">Best of</label>
                    <input disabled={disabled} className="form-control no-spinner width-50 d-inline"
                           id="bestOf" type="number" min="3" value={tournamentData.bestOf || ''}
                           name="bestOf" onChange={valueChanged(tournamentData, setTournamentData, '')}
                           placeholder="# legs"/>
                </div>
                <div className="form-check form-switch margin-right my-1" datatype="accolades-count">
                    <input disabled={disabled} type="checkbox" className="form-check-input"
                           name="accoladesCount" id="accoladesCount"
                           checked={tournamentData.accoladesCount}
                           onChange={valueChanged(tournamentData, setTournamentData)}/>
                    <label className="form-check-label" htmlFor="accoladesCount">Include 180s and Hi-checks
                        in players table?</label>
                </div>
                <div className="form-check form-switch margin-right my-1" datatype="exclude-from-reports">
                    <input disabled={disabled} type="checkbox" className="form-check-input"
                           name="excludeFromReports" id="excludeFromReports"
                           checked={tournamentData.excludeFromReports}
                           onChange={valueChanged(tournamentData, setTournamentData)}/>
                    <label className="form-check-label" htmlFor="excludeFromReports">Exclude from reports?</label>
                </div>
            </div>
        </div>
    </>);
}