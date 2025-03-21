import {any} from "../../helpers/collections";
import {propChanged} from "../../helpers/events";
import {TournamentSide} from "./TournamentSide";
import {TournamentRound} from "./TournamentRound";
import {useState} from "react";
import {useApp} from "../common/AppContainer";
import {useTournament} from "./TournamentContainer";
import {EditSide, ISaveSideOptions} from "./EditSide";
import {TournamentMatchDto} from "../../interfaces/models/dtos/Game/TournamentMatchDto";
import {TournamentSideDto} from "../../interfaces/models/dtos/Game/TournamentSideDto";
import {addSide, removeSide, sideChanged} from "./tournaments";
import {hasAccess} from "../../helpers/conditions";

export interface IEditTournamentProps {
    canSave?: boolean;
    disabled?: boolean;
    saving?: boolean;
}

export function EditTournament({canSave, disabled, saving}: IEditTournamentProps) {
    const {account} = useApp();
    const {tournamentData, setTournamentData, setDraggingSide, newMatch, playerIdToTeamMap} = useTournament();
    const isAdmin: boolean = hasAccess(account, access => access.manageTournaments);
    const readOnly: boolean = !isAdmin || !canSave || disabled || saving || false;
    const [newSide, setNewSide] = useState<TournamentSideDto | null>(null);

    function renderEditNewSide() {
        return (<EditSide
            side={newSide!}
            onChange={async (side: TournamentSideDto) => setNewSide(side)}
            onClose={async () => setNewSide(null)}
            onApply={async (options: ISaveSideOptions) => {
                await setTournamentData!(addSide(tournamentData, newSide!, options));
                setNewSide(null);
            }}
            initialAddAsIndividuals={tournamentData.singleRound}
            initialAddMultiplePlayers={tournamentData.singleRound} />);
    }

    function sortByTeam(x: TournamentSideDto, y: TournamentSideDto): number {
        const xTeam = x.players?.length === 1 ? playerIdToTeamMap[x.players[0].id] : null;
        const yTeam = y.players?.length === 1 ? playerIdToTeamMap[y.players[0].id] : null;

        if (xTeam && yTeam) {
            const result = xTeam.name.localeCompare(yTeam.name);
            if (result === 0) {
                return x.name?.localeCompare(y.name || '') || 0;
            }

            return result;
        }

        return x.name?.localeCompare(y.name || '') || 0;
    }

    const canShowResults: boolean = any((tournamentData.round || {}).matches, (match: TournamentMatchDto) => !!match.scoreA || !!match.scoreB) || !readOnly;
    return (<div datatype="edit-tournament">
        <div>Playing:</div>
        <div className="my-1 d-flex flex-wrap">
            {tournamentData.sides!.sort(sortByTeam).map((side: TournamentSideDto, sideIndex: number) => {
                const allMatches = (tournamentData.round?.matches || []).concat(newMatch);
                const hasBeenSelected = (allMatches.filter(m => m.sideA?.id === side.id || m.sideB?.id === side.id) || []).length > 0

                if (hasBeenSelected) {
                    return null;
                }

                return (<TournamentSide
                    key={sideIndex}
                    readOnly={readOnly}
                    side={side}
                    onChange={async (newSide: TournamentSideDto, options: ISaveSideOptions) => await setTournamentData!(sideChanged(tournamentData, newSide, sideIndex, options))}
                    onRemove={async () => {
                        await setTournamentData!(removeSide(tournamentData, side));
                        setNewSide(null);
                    }}
                    showEditSide={!tournamentData.singleRound}
                    showDeleteSide={tournamentData.singleRound && !hasBeenSelected}
                    onStartDrag={hasBeenSelected ? undefined : setDraggingSide} />);
            })}
            {readOnly
                ? null
                : (<button className="btn btn-primary" onClick={() => setNewSide({id: ''})}>➕</button>)}
            {newSide && !readOnly ? renderEditNewSide() : null}
        </div>
        {canShowResults ? (<TournamentRound
            round={tournamentData.round || {}}
            sides={tournamentData.sides!.filter((s: TournamentSideDto) => !s.noShow)}
            onChange={propChanged(tournamentData, setTournamentData!, 'round')}
            readOnly={readOnly} />) : null}
    </div>);
}