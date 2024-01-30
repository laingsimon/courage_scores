import React, {useState} from 'react';
import {EditSide} from "./EditSide";
import {count, isEmpty} from "../../../helpers/collections";
import {ITournamentSideDto} from "../../../interfaces/models/dtos/Game/ITournamentSideDto";
import {ITournamentPlayerDto} from "../../../interfaces/models/dtos/Game/ITournamentPlayerDto";

export interface ITournamentSideProps {
    side: ITournamentSideDto;
    onChange?: (editSide: ITournamentSideDto) => Promise<any>;
    winner?: boolean;
    readOnly?: boolean;
    onRemove: () => Promise<any>;
}

export function TournamentSide({side, onChange, winner, readOnly, onRemove}: ITournamentSideProps) {
    const [editSide, setEditSide] = useState(null);

    function renderPlayers() {
        if (isEmpty(side.players || [])) {
            return null;
        }

        if (count(side.players || []) === 1 && side.players[0].name === side.name) {
            return null;
        }

        return (<ol className="no-list-indent">
            {(side.players || []).map((p: ITournamentPlayerDto) => (<li key={p.id} className={side.noShow ? 'text-decoration-line-through' : ''}>
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
            onChange={async (side: ITournamentSideDto) => setEditSide(side)}
            onClose={async () => setEditSide(null)}
            onApply={async () => {
                if (onChange) {
                    await onChange(editSide);
                }
                setEditSide(null);
            }}
            onDelete={async () => {
                await onRemove();
                setEditSide(null);
            }}/>);
    }

    return (<div className={`position-relative p-1 m-1 ${winner ? 'bg-winner' : 'bg-light'}`}
                 style={{flexBasis: '100px', flexGrow: 1, flexShrink: 1}}>
        {renderSideName()}
        {renderPlayers()}
        {readOnly ? null : (<div className="position-absolute-bottom-right">
            <button className="btn btn-sm btn-primary" onClick={() => setEditSide(side)}>✏️</button>
        </div>)}
        {editSide ? renderEditSide() : null}
    </div>);
}
