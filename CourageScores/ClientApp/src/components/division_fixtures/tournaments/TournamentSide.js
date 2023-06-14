import React, {useState} from 'react';
import {EMPTY_ID} from "../../../helpers/projection";
import {Link} from "react-router-dom";
import {useApp} from "../../../AppContainer";
import {EditSide} from "./EditSide";
import {useTournament} from "./TournamentContainer";

export function TournamentSide({ side, onChange, winner, readOnly, onRemove }) {
    const { teams: teamMap } = useApp();
    const [ editSide, setEditSide ] = useState(null);
    const { season } = useTournament();

    function renderTeamName() {
        const team = side.teamId ? teamMap[side.teamId] : null;
        if (!team || team.name === side.name) {
            return null;
        }

        return (<div><Link to={`/division/${team.divisionId}/team:${team.id}/${season.id}`}>{team.name}</Link></div>);
    }

    function renderPlayers () {
        if (!side.players) {
            return null;
        }

        if (side.players.length === 1 && side.players[0].name === side.name) {
            return null;
        }

        return (<ol className="no-list-indent">
            {side.players.map(p => (<li key={p.id}>
                {p.divisionId && p.divisionId !== EMPTY_ID ? (<Link to={`/division/${p.divisionId}/player:${p.id}/${season.id}`}>{p.name}</Link>) : p.name}
            </li>))}
        </ol>);
    }

    function renderSideName() {
        const singlePlayer = side.players && side.players.length === 1
           ? side.players[0]
           : null;

        let name = side.name;
        if (singlePlayer && singlePlayer.divisionId && singlePlayer.divisionId !== EMPTY_ID) {
            name = (<Link to={`/division/${singlePlayer.divisionId}/player:${singlePlayer.id}/${season.id}`}>{side.name}</Link>);
        } else if (side.teamId && teamMap[side.teamId]) {
            const team = side.teamId ? teamMap[side.teamId] : null;
            name = (<Link to={`/division/${team.divisionId}/team:${team.id}/${season.id}`}>{side.name}</Link>);
        }

        return (<strong>{name}</strong>);
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

    if (!side && !readOnly) {
        return (<div className="bg-yellow p-1 m-1">
            <button className="btn btn-primary" onClick={() => setEditSide({ id: null })}>➕</button>
            {editSide ? renderEditSide() : null}
        </div>);
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
