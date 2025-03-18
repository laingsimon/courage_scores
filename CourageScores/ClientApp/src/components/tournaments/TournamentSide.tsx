import {useState} from 'react';
import {EditSide, ISaveSideOptions} from "./EditSide";
import {count, isEmpty} from "../../helpers/collections";
import {TournamentSideDto} from "../../interfaces/models/dtos/Game/TournamentSideDto";
import {TournamentPlayerDto} from "../../interfaces/models/dtos/Game/TournamentPlayerDto";
import {UntypedPromise} from "../../interfaces/UntypedPromise";

export interface ITournamentSideProps {
    side: TournamentSideDto;
    onChange?(editSide: TournamentSideDto, options: ISaveSideOptions): UntypedPromise;
    winner?: boolean;
    readOnly?: boolean;
    onRemove(): UntypedPromise;
    showEditSide?: boolean;
    showDeleteSide?: boolean;
}

export function TournamentSide({side, onChange, winner, readOnly, onRemove, showEditSide, showDeleteSide}: ITournamentSideProps) {
    const [editSide, setEditSide] = useState<TournamentSideDto | null>(null);

    function renderPlayers() {
        if (isEmpty(side.players)) {
            return null;
        }

        if (count(side.players) === 1 && side.players![0].name === side.name) {
            return null;
        }

        return (<ol className="no-list-indent">
            {(side.players || []).map((p: TournamentPlayerDto) => (<li key={p.id} className={side.noShow ? 'text-decoration-line-through' : ''}>
                {p.name}
            </li>))}
        </ol>);
    }

    function renderEditSide() {
        return (<EditSide
            side={editSide!}
            onChange={async (side: TournamentSideDto) => setEditSide(side)}
            onClose={async () => setEditSide(null)}
            onApply={async (options: ISaveSideOptions) => {
                if (onChange) {
                    await onChange(editSide!, options);
                }
                setEditSide(null);
            }}
            onDelete={async () => {
                await onRemove();
                setEditSide(null);
            }}/>);
    }

    async function deleteSide() {
        if (confirm(`Are you sure you want to remove ${side.name}?`)) {
            await onRemove();
        }
    }

    return (<div className={`d-flex flex-row p-1 m-1 ${winner ? 'bg-winner' : 'bg-light'}`}
                 style={{flexBasis: '100px', flexGrow: 1, flexShrink: 1}}>
        <strong className={side.noShow ? 'text-decoration-line-through' : ''}>{side.name}</strong>
        {renderPlayers()}
        {!readOnly && (showDeleteSide || showEditSide) ? (<div className="d-flex justify-content-end pe-1 align-content-end flex-grow-1 flex-shrink-1">
            {showDeleteSide ? (<button className="btn btn-sm btn-danger" onClick={deleteSide}>🗑️</button>) : null}
            {showEditSide ? (<button className="btn btn-sm btn-primary" onClick={() => setEditSide(side)}>✏️</button>) : null}
        </div>) : null}
        {editSide ? renderEditSide() : null}
    </div>);
}