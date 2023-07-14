import React, {useState} from 'react';
import {EMPTY_ID} from "../../../helpers/projection";
import {useApp} from "../../../AppContainer";
import {EditSide} from "./EditSide";
import {useTournament} from "./TournamentContainer";
import {EmbedAwareLink} from "../../common/EmbedAwareLink";

export function TournamentSide({ side, onChange, winner, readOnly, onRemove }) {
    const { teams: teamMap, divisions } = useApp();
    const [ editSide, setEditSide ] = useState(null);
    const { season, division } = useTournament();

    function renderTeamName() {
        const team = side.teamId ? teamMap[side.teamId] : null;
        if (!team || team.name === side.name) {
            return null;
        }

        const theDivision = division || getDivision(getDivisionIdForTeam(team, season.id));

        return (<div data-name="team-name" className={side.noShow ? 'text-decoration-line-through' : ''}>
            {theDivision ? (<EmbedAwareLink to={`/division/${theDivision.name}/team:${team.name}/${season.name}`}>{team.name}</EmbedAwareLink>) : team.name}
        </div>);
    }

    function renderPlayers () {
        if (!side.players) {
            return null;
        }

        if (side.players.length === 1 && side.players[0].name === side.name) {
            return null;
        }

        return (<ol className="no-list-indent">
            {side.players.map(p => (<li key={p.id} className={side.noShow ? 'text-decoration-line-through' : ''}>
                {renderPlayer(p)}
            </li>))}
        </ol>);
    }

    function getDivision(id) {
        return divisions.filter(d => d.id === id)[0];
    }

    function getDivisionIdForTeam(team, seasonId) {
        const teamSeason = team.seasons.filter(ts => ts.seasonId === seasonId)[0];
        return teamSeason ? teamSeason.divisionId : null;
    }

    function renderPlayer(p) {
        const theDivision = division || getDivision(p.divisionId);

        if (!theDivision) {
            return p.name;
        }

        return (<EmbedAwareLink to={`/division/${theDivision.name}/player:${p.name}/${season.name}`}>{p.name}</EmbedAwareLink>);
    }

    function renderSideName() {
        const singlePlayer = side.players && side.players.length === 1
           ? side.players[0]
           : null;

        let name = side.name;
        if (singlePlayer && singlePlayer.divisionId && singlePlayer.divisionId !== EMPTY_ID) {
            const theDivision = division || getDivision(singlePlayer.divisionId);
            if (theDivision) {
                name = (<EmbedAwareLink to={`/division/${theDivision.name}/player:${singlePlayer.name}/${season.name}`}>{side.name}</EmbedAwareLink>);
            }
        } else if (side.teamId && teamMap[side.teamId]) {
            const team = teamMap[side.teamId];
            const theDivision = division || getDivision(getDivisionIdForTeam(team, season.id));
            if (theDivision) {
                name = (<EmbedAwareLink to={`/division/${theDivision.name}/team:${team.name}/${season.name}`}>{side.name}</EmbedAwareLink>);
            }
        }

        return (<strong className={side.noShow ? 'text-decoration-line-through' : ''}>{name}</strong>);
    }

    function renderEditSide() {
        return (<EditSide
            side={editSide}
            onChange={(side) => setEditSide(side)}
            onClose={() => setEditSide(null)}
            onApply={async () => {
                if (onChange) {
                    await onChange(editSide);
                }
                setEditSide(null);
            }}
            onDelete={onRemove} />);
    }

    return (<div className={`position-relative p-1 m-1 ${winner ? 'bg-winner' : 'bg-light'}`} style={{ flexBasis: '100px', flexGrow: 1, flexShrink: 1 }}>
        {renderSideName()}
        {renderTeamName()}
        {renderPlayers()}
        {readOnly ? null : (<div className="position-absolute-bottom-right">
            <button className="btn btn-sm btn-primary" onClick={() => setEditSide(side)}>✏️</button>
        </div>)}
        {editSide ? renderEditSide() : null}
    </div>);
}
