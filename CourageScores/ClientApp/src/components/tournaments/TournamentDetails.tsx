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

export interface ITournamentDetailsProps {
    tournamentData: TournamentGameDto;
    setTournamentData: (data: TournamentGameDto) => Promise<any>;
    disabled?: boolean;
}

export function TournamentDetails({ tournamentData, disabled, setTournamentData }: ITournamentDetailsProps) {
    const {teams, divisions} = useApp();

    const genderOptions: IBootstrapDropdownItem[] = [
        {text: <>&nbsp;</>, value: null},
        {text: 'Men', value: 'men'},
        {text: 'Women',value: 'women'}
    ];

    function getExportTables(): { [key: string]: string[] } {
        let saygDataIds = [];
        let teamIds = [];
        let round = tournamentData.round;
        while (round) {
            saygDataIds = saygDataIds.concat(round.matches.map((m: TournamentMatchDto) => m.saygId).filter((id: string) => id));
            round = round.nextRound;
        }

        const exportRequest: { [key: string]: string[] } = {
            tournamentGame: [tournamentData.id],
            season: [tournamentData.seasonId],
        };

        if (tournamentData.divisionId) {
            exportRequest.division = [tournamentData.divisionId];
        }

        for (let i = 0; i < tournamentData.sides.length; i++) {
            const side = tournamentData.sides[i];

            if (side.teamId) {
                teamIds = teamIds.concat([side.teamId]);
            } else if (any(side.players || [])) {
                // get the team ids for the players
                // find the teamId for each player
                teamIds = teamIds.concat(side.players.map(getTeamIdForPlayer));
            }
        }

        if (any(saygDataIds)) {
            exportRequest.recordedScoreAsYouGo = saygDataIds;
        }

        teamIds = distinct(teamIds.filter(id => id));
        if (any(teamIds)) {
            exportRequest.team = teamIds;
        }

        return exportRequest;
    }

    function getTeamIdForPlayer(player: TournamentPlayerDto) {
        const teamToSeasonMaps = teams.map((t: TeamDto) => {
            return {
                teamSeason: t.seasons.filter(ts => ts.seasonId === tournamentData.seasonId)[0],
                team: t,
            }
        });
        const teamsWithPlayer = teamToSeasonMaps.filter(map => map.teamSeason && any(map.teamSeason.players, (p: TeamPlayerDto) => p.id === player.id));

        if (any(teamsWithPlayer)) {
            return teamsWithPlayer[0].team.id
        }

        return null;
    }

    return (<>
        <h4 className="pb-2 d-print-none">
            <span>Edit tournament: </span>
            <span className="me-4">{renderDate(tournamentData.date)}</span>
            <button className="btn btn-sm margin-left btn-outline-primary margin-right"
                    onClick={window.print}>🖨️
            </button>
            <ExportDataButton tables={getExportTables()}/>
        </h4>
        <div className="input-group mb-1 d-print-none">
            <div className="input-group-prepend">
                <label htmlFor="address" className="input-group-text width-75">Address</label>
            </div>
            <input id="address" className="form-control" disabled={disabled} type="text"
                   value={tournamentData.address}
                   name="address" onChange={valueChanged(tournamentData, setTournamentData)}/>
        </div>
        <div className="form-group input-group mb-1 d-print-none">
            <div className="input-group-prepend">
                <label htmlFor="type" className="input-group-text width-75">Type</label>
            </div>
            <input id="type" className="form-control" disabled={disabled}
                   value={tournamentData.type || ''} name="type"
                   onChange={valueChanged(tournamentData, setTournamentData)}
                   placeholder="Optional type for the tournament"/>

            <div className="form-check form-switch my-1 ms-2">
                <input disabled={disabled} type="checkbox" className="form-check-input margin-left"
                       name="singleRound"
                       id="singleRound"
                       checked={tournamentData.singleRound}
                       onChange={valueChanged(tournamentData, setTournamentData)}/>
                <label className="form-check-label" htmlFor="singleRound">Super league</label>
            </div>
        </div>
        <div className="form-group input-group mb-1 d-print-none">
            <label htmlFor="note-text" className="input-group-text width-75">Notes</label>
            <textarea id="note-text" className="form-control" disabled={disabled}
                      value={tournamentData.notes || ''} name="notes"
                      onChange={valueChanged(tournamentData, setTournamentData)}
                      placeholder="Notes for the tournament">
                        </textarea>
        </div>
        <div className="form-group input-group mb-3 d-print-none" datatype="tournament-options">
            <label className="input-group-text width-75">Options</label>
            <div className="form-control">
                <div className="form-check form-switch margin-right my-1">
                    <input disabled={disabled} type="checkbox" className="form-check-input"
                           name="accoladesCount" id="accoladesCount"
                           checked={tournamentData.accoladesCount}
                           onChange={valueChanged(tournamentData, setTournamentData)}/>
                    <label className="form-check-label" htmlFor="accoladesCount">Include 180s and Hi-checks
                        in players table?</label>
                </div>

                <div className="input-group mb-1" datatype="tournament-division">
                    <label className="input-group-text">Division</label>
                    <BootstrapDropdown
                        value={tournamentData.divisionId}
                        onChange={propChanged(tournamentData, setTournamentData, 'divisionId')}
                        options={[{value: null, text: 'All divisions'}].concat(divisions.map(d => {
                            return {value: d.id, text: d.name}
                        }))}
                        disabled={disabled} className="margin-right"/>

                    <label htmlFor="bestOf" className="input-group-text">Best of</label>
                    <input disabled={disabled} className="form-control no-spinner width-50 d-inline"
                           id="bestOf" type="number" min="3" value={tournamentData.bestOf || ''}
                           name="bestOf" onChange={valueChanged(tournamentData, setTournamentData, '')}
                           placeholder="Number of legs"/>
                </div>

                {tournamentData.singleRound
                    ? (<>
                        <div className="input-group mb-1" datatype="superleague-host">
                            <label htmlFor="host" className="input-group-text">Host</label>
                            <input id="host" className="form-control margin-right" disabled={disabled}
                                   value={tournamentData.host || ''} name="host"
                                   onChange={valueChanged(tournamentData, setTournamentData)}
                                   placeholder="Host name"/>

                            <label htmlFor="opponent" className="input-group-text">vs</label>
                            <input id="opponent" className="form-control" disabled={disabled}
                                   value={tournamentData.opponent || ''} name="opponent"
                                   onChange={valueChanged(tournamentData, setTournamentData)}
                                   placeholder="Opponent name"/>
                        </div>

                        <div className="input-group mb-1" datatype="superleague-gender">
                            <label htmlFor="gender" className="input-group-text width-75">Gender</label>
                            <BootstrapDropdown
                                value={tournamentData.gender}
                                onChange={propChanged(tournamentData, setTournamentData, 'gender')}
                                options={genderOptions}
                                disabled={disabled}/>
                        </div>
                    </>)
                    : null}
            </div>
        </div>
    </>);
}