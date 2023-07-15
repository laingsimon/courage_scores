import React, {useState} from 'react';
import {EditSide} from "./EditSide";

export function TournamentSide({ side, onChange, winner, readOnly, onRemove }) {
    const [ editSide, setEditSide ] = useState(null);

    function renderPlayers () {
        if (!side.players) {
            return null;
        }

        if (side.players.length === 1 && side.players[0].name === side.name) {
            return null;
        }

        return (<ol className="no-list-indent">
            {side.players.map(p => (<li key={p.id} className={side.noShow ? 'text-decoration-line-through' : ''}>
                {p.name}
            </li>))}
        </ol>);
    }

    function renderSideName() {
        return (<strong className={side.noShow ? 'text-decoration-line-through' : ''}>{side.name}</strong>);
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
        {renderPlayers()}
        {readOnly ? null : (<div className="position-absolute-bottom-right">
            <button className="btn btn-sm btn-primary" onClick={() => setEditSide(side)}>✏️</button>
        </div>)}
        {editSide ? renderEditSide() : null}
    </div>);
}
