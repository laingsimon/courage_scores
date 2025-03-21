import {useState} from 'react';
import {EditSide, ISaveSideOptions} from "./EditSide";
import {count, isEmpty} from "../../helpers/collections";
import {TournamentSideDto} from "../../interfaces/models/dtos/Game/TournamentSideDto";
import {TournamentPlayerDto} from "../../interfaces/models/dtos/Game/TournamentPlayerDto";
import {UntypedPromise} from "../../interfaces/UntypedPromise";
import {useTournament} from "./TournamentContainer";

export interface ITournamentSideProps {
    side: TournamentSideDto;
    onChange?(editSide: TournamentSideDto, options: ISaveSideOptions): UntypedPromise;
    readOnly?: boolean;
    onRemove(): UntypedPromise;
    showEditSide?: boolean;
    showDeleteSide?: boolean;
    onStartDrag?(side: TournamentSideDto): UntypedPromise;
}

export function TournamentSide({side, onChange, readOnly, onRemove, showEditSide, showDeleteSide, onStartDrag}: ITournamentSideProps) {
    const [editSide, setEditSide] = useState<TournamentSideDto | null>(null);
    const {playerIdToTeamMap} = useTournament();

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

    function renderSingleTeamName() {
        if (count(side.players) !== 1 || side.players![0].name !== side.name) {
            return null;
        }

        const singlePlayer: TournamentPlayerDto = side.players![0];
        const team = playerIdToTeamMap[singlePlayer.id];
        return team ? (<div>{team.name}</div>) : null;
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

    return (<div className="d-flex flex-column p-1 m-1 bg-light"
                 draggable={!!onStartDrag}
                 onDragStart={async () => await onStartDrag!(side)}
                 style={{flexBasis: '100px', flexGrow: 1, flexShrink: 1}}>
        <strong className={side.noShow ? 'text-decoration-line-through' : ''}>{side.name}</strong>
        {renderSingleTeamName()}
        {renderPlayers()}
        {!readOnly && (showDeleteSide || showEditSide) ? (<div className="d-flex justify-content-end pe-1 align-content-end flex-grow-1 flex-shrink-1">
            {showDeleteSide ? (<button className="btn btn-sm btn-danger" onClick={deleteSide}>🗑️</button>) : null}
            {showEditSide ? (<button className="btn btn-sm btn-primary" onClick={() => setEditSide(side)}>✏️</button>) : null}
        </div>) : null}
        {editSide ? renderEditSide() : null}
    </div>);
}