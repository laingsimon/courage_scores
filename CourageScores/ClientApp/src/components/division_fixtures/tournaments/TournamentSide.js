import React, {useState} from 'react';
import {EMPTY_ID} from "../../../helpers/projection";
import {useApp} from "../../../AppContainer";
import {EditSide} from "./EditSide";
import {useTournament} from "./TournamentContainer";
import {EmbedAwareLink} from "../../common/EmbedAwareLink";

export function TournamentSide({ side, onChange, winner, readOnly, onRemove }) {
    const { teams: teamMap } = useApp();
    const [ editSide, setEditSide ] = useState(null);
    const { season } = useTournament();

    function renderTeamName() {
        const team = side.teamId ? teamMap[side.teamId] : null;
        if (!team || team.name === side.name) {
            return null;
        }

        return (<div data-name="team-name" className={side.noShow ? 'text-decoration-line-through' : ''}>
            <EmbedAwareLink to={`/division/${team.divisionId}/team:${team.id}/${season.id}`}>{team.name}</EmbedAwareLink>
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
                {p.divisionId && p.divisionId !== EMPTY_ID ? (<EmbedAwareLink to={`/division/${p.divisionId}/player:${p.id}/${season.id}`}>{p.name}</EmbedAwareLink>) : p.name}
            </li>))}
        </ol>);
    }

    function renderSideName() {
        const singlePlayer = side.players && side.players.length === 1
           ? side.players[0]
           : null;

        let name = side.name;
        if (singlePlayer && singlePlayer.divisionId && singlePlayer.divisionId !== EMPTY_ID) {
            name = (<EmbedAwareLink to={`/division/${singlePlayer.divisionId}/player:${singlePlayer.id}/${season.id}`}>{side.name}</EmbedAwareLink>);
        } else if (side.teamId && teamMap[side.teamId]) {
            const team = teamMap[side.teamId];
            name = (<EmbedAwareLink to={`/division/${team.divisionId}/team:${side.teamId}/${season.id}`}>{side.name}</EmbedAwareLink>);
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
