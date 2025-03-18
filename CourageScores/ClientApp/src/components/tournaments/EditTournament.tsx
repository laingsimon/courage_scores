import {any, sortBy} from "../../helpers/collections";
import {propChanged} from "../../helpers/events";
import {TournamentSide} from "./TournamentSide";
import {TournamentRound} from "./TournamentRound";
import {useState} from "react";
import {useApp} from "../common/AppContainer";
import {useTournament} from "./TournamentContainer";
import {EditSide, ISaveSideOptions} from "./EditSide";
import {TournamentRoundDto} from "../../interfaces/models/dtos/Game/TournamentRoundDto";
import {TournamentMatchDto} from "../../interfaces/models/dtos/Game/TournamentMatchDto";
import {TournamentSideDto} from "../../interfaces/models/dtos/Game/TournamentSideDto";
import {GameMatchOptionDto} from "../../interfaces/models/dtos/Game/GameMatchOptionDto";
import {addSide, removeSide, sideChanged} from "./tournaments";
import {hasAccess} from "../../helpers/conditions";

export interface IEditTournamentProps {
    canSave?: boolean;
    disabled?: boolean;
    saving?: boolean;
}

export function EditTournament({canSave, disabled, saving}: IEditTournamentProps) {
    const {account} = useApp();
    const {tournamentData, setTournamentData, setDraggingSide, newMatch} = useTournament();
    const isAdmin: boolean = hasAccess(account, access => access.manageTournaments);
    const readOnly: boolean = !isAdmin || !canSave || disabled || saving || false;
    const winningSideId: string | undefined = getWinningSide(tournamentData.round);
    const [newSide, setNewSide] = useState<TournamentSideDto | null>(null);

    function getWinningSide(round?: TournamentRoundDto): string | undefined {
        if (round && round.nextRound) {
            return getWinningSide(round.nextRound);
        }

        if (round && round.matches && round.matches.length === 1) {
            const match: TournamentMatchDto = round.matches[0];
            const matchOptions: GameMatchOptionDto = round!.matchOptions![0];
            const bestOf: number = matchOptions ? matchOptions.numberOfLegs! : 5;
            if (match.scoreA !== null && match.scoreB !== null && match.sideA && match.sideB) {
                if (match.scoreA! > (bestOf / 2.0)) {
                    return match.sideA.id;
                } else if (match.scoreB! > (bestOf / 2.0)) {
                    return match.sideB.id;
                } else {
                    return undefined;
                }
            }
        }
    }

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

    const canShowResults: boolean = any((tournamentData.round || {}).matches, (match: TournamentMatchDto) => !!match.scoreA || !!match.scoreB) || !readOnly;
    return (<div datatype="edit-tournament">
        <div>Playing:</div>
        <div className="my-1 d-flex flex-wrap">
            {tournamentData.sides!.sort(sortBy('name')).map((side: TournamentSideDto, sideIndex: number) => {
                const allMatches = (tournamentData.round?.matches || []).concat(newMatch);
                const hasBeenSelected = (allMatches.filter(m => m.sideA?.id === side.id || m.sideB?.id === side.id) || []).length > 0

                if (hasBeenSelected) {
                    return null;
                }

                return (<TournamentSide
                    key={sideIndex}
                    winner={winningSideId === side.id}
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