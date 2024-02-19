import {any, sortBy} from "../../helpers/collections";
import {propChanged} from "../../helpers/events";
import {TournamentSide} from "./TournamentSide";
import {TournamentRound} from "./TournamentRound";
import {useState} from "react";
import {useApp} from "../common/AppContainer";
import {useTournament} from "./TournamentContainer";
import {EditSide} from "./EditSide";
import {TournamentRoundDto} from "../../interfaces/models/dtos/Game/TournamentRoundDto";
import {TournamentMatchDto} from "../../interfaces/models/dtos/Game/TournamentMatchDto";
import {TournamentSideDto} from "../../interfaces/models/dtos/Game/TournamentSideDto";
import {GameMatchOptionDto} from "../../interfaces/models/dtos/Game/GameMatchOptionDto";
import {addSide, removeSide, sideChanged} from "../../helpers/tournaments";

export interface IEditTournamentProps {
    canSave?: boolean;
    disabled?: boolean;
    saving?: boolean;
}

export function EditTournament({canSave, disabled, saving}: IEditTournamentProps) {
    const {account} = useApp();
    const {tournamentData, setTournamentData} = useTournament();
    const isAdmin: boolean = account && account.access && account.access.manageTournaments;
    const readOnly: boolean = !isAdmin || !canSave || disabled || saving;
    const hasStarted: boolean = tournamentData.round && tournamentData.round.matches && any(tournamentData.round.matches);
    const winningSideId: string = hasStarted ? getWinningSide(tournamentData.round) : null;
    const [newSide, setNewSide] = useState<TournamentSideDto>(null);

    function getWinningSide(round: TournamentRoundDto): string {
        if (round && round.nextRound) {
            return getWinningSide(round.nextRound);
        }

        if (round && round.matches && round.matches.length === 1) {
            const match: TournamentMatchDto = round.matches[0];
            const matchOptions: GameMatchOptionDto = round.matchOptions[0];
            const bestOf: number = matchOptions ? matchOptions.numberOfLegs : 5;
            if (match.scoreA !== null && match.scoreB !== null && match.sideA && match.sideB) {
                if (match.scoreA > (bestOf / 2.0)) {
                    return match.sideA.id;
                } else if (match.scoreB > (bestOf / 2.0)) {
                    return match.sideB.id;
                } else {
                    return null;
                }
            }

            return null;
        }
    }

    function renderEditNewSide() {
        return (<EditSide
            side={newSide}
            onChange={async (side: TournamentSideDto) => setNewSide(side)}
            onClose={async () => setNewSide(null)}
            onApply={async () => {
                await setTournamentData(addSide(tournamentData, newSide));
                setNewSide(null);
            }}/>);
    }

    const canShowResults: boolean = any((tournamentData.round || {}).matches || [], (match: TournamentMatchDto) => !!match.scoreA || !!match.scoreB) || !readOnly;
    return (<div className="d-print-none" datatype="edit-tournament">
        <div>Playing:</div>
        <div className="my-1 d-flex flex-wrap">
            {tournamentData.sides.sort(sortBy('name')).map((side, sideIndex) => {
                return (<TournamentSide
                    key={sideIndex}
                    winner={winningSideId === side.id}
                    readOnly={readOnly}
                    side={side}
                    onChange={async (newSide: TournamentSideDto) => await setTournamentData(sideChanged(tournamentData, newSide, sideIndex))}
                    onRemove={async () => {
                        await setTournamentData(removeSide(tournamentData, side));
                        setNewSide(null);
                    }}/>);
            })}
            {!readOnly && !hasStarted
                ? (<button className="btn btn-primary" onClick={() => setNewSide({ id: null })}>➕</button>)
                : null}
            {newSide && !readOnly && !hasStarted ? renderEditNewSide() : null}
        </div>
        {canShowResults ? (<TournamentRound
            round={tournamentData.round || {}}
            sides={tournamentData.sides.filter((s: TournamentSideDto) => !s.noShow)}
            onChange={propChanged(tournamentData, setTournamentData, 'round')}
            readOnly={readOnly}
            depth={1} />) : null}
    </div>);
}
