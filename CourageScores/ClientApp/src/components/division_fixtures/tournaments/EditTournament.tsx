import {any, sortBy} from "../../../helpers/collections";
import {propChanged} from "../../../helpers/events";
import {TournamentSide} from "./TournamentSide";
import {TournamentRound} from "./TournamentRound";
import {MultiPlayerSelection} from "../scores/MultiPlayerSelection";
import {add180, addHiCheck, remove180, removeHiCheck} from "../../common/Accolades";
import {useState} from "react";
import {useApp} from "../../../AppContainer";
import {useTournament} from "./TournamentContainer";
import {EditSide} from "./EditSide";
import {createTemporaryId} from "../../../helpers/projection";
import {TournamentRoundDto} from "../../../interfaces/models/dtos/Game/TournamentRoundDto";
import {TournamentMatchDto} from "../../../interfaces/models/dtos/Game/TournamentMatchDto";
import {TournamentSideDto} from "../../../interfaces/models/dtos/Game/TournamentSideDto";
import {TournamentGameDto} from "../../../interfaces/models/dtos/Game/TournamentGameDto";
import {PatchTournamentDto} from "../../../interfaces/models/dtos/Game/PatchTournamentDto";
import {PatchTournamentRoundDto} from "../../../interfaces/models/dtos/Game/PatchTournamentRoundDto";
import {GameMatchOptionDto} from "../../../interfaces/models/dtos/Game/GameMatchOptionDto";

export interface IEditTournamentProps {
    canSave?: boolean;
    disabled?: boolean;
    saving?: boolean;
    applyPatch: (patch: PatchTournamentDto | PatchTournamentRoundDto, nestInRound?: boolean) => Promise<any>;
}

export function EditTournament({canSave, disabled, saving, applyPatch}: IEditTournamentProps) {
    const {account} = useApp();
    const {tournamentData, setTournamentData, allPlayers, season, division} = useTournament();
    const isAdmin: boolean = account && account.access && account.access.manageTournaments;
    const readOnly: boolean = !isAdmin || !canSave || disabled || saving;
    const hasStarted: boolean = tournamentData.round && tournamentData.round.matches && any(tournamentData.round.matches);
    const winningSideId: string = hasStarted ? getWinningSide(tournamentData.round) : null;
    const [newSide, setNewSide] = useState(null);

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

    async function sideChanged(newSide: TournamentSideDto, sideIndex: number) {
        const newTournamentData: TournamentGameDto = Object.assign({}, tournamentData);
        newSide.name = (newSide.name || '').trim();
        newTournamentData.sides[sideIndex] = newSide;
        updateSideDataInRound(newTournamentData.round, newSide);
        await setTournamentData(newTournamentData);
    }

    async function removeSide(side: TournamentSideDto) {
        const newTournamentData: TournamentGameDto = Object.assign({}, tournamentData);
        newTournamentData.sides = tournamentData.sides.filter((s: TournamentSideDto) => s.id !== side.id);
        await setTournamentData(newTournamentData);
        setNewSide(null);
    }

    function updateSideDataInRound(round: TournamentRoundDto, side: TournamentSideDto) {
        if (!round) {
            return;
        }

        if (round.matches) {
            for (let index = 0; index < round.matches.length; index++) {
                const match: TournamentMatchDto = round.matches[index];
                if (match.sideA && match.sideA.id === side.id) {
                    match.sideA = side;
                } else if (match.sideB && match.sideB.id === side.id) {
                    match.sideB = side;
                }
            }
        }

        updateSideDataInRound(round.nextRound, side);
    }

    function renderEditNewSide() {
        return (<EditSide
            side={newSide}
            onChange={async (side: TournamentSideDto) => setNewSide(side)}
            onClose={async () => setNewSide(null)}
            onApply={async () => {
                const newTournamentData: TournamentGameDto = Object.assign({}, tournamentData);
                newSide.id = newSide.id || createTemporaryId();
                newSide.name = (newSide.name || '').trim();
                newTournamentData.sides.push(newSide);
                await setTournamentData(newTournamentData);
                setNewSide(null);
            }}/>);
    }

    const canShowResults: boolean = any((tournamentData.round || {}).matches || [], (match: TournamentMatchDto) => !!match.scoreA || !!match.scoreB) || !readOnly;
    return (<div className="d-print-none">
        <div>Playing:</div>
        <div className="my-1 d-flex flex-wrap">
            {tournamentData.sides.sort(sortBy('name')).map((side, sideIndex) => {
                return (<TournamentSide
                    key={sideIndex}
                    winner={winningSideId === side.id}
                    readOnly={readOnly}
                    side={side}
                    onChange={(newSide: TournamentSideDto) => sideChanged(newSide, sideIndex)}
                    onRemove={() => removeSide(side)}/>);
            })}
            {!readOnly && !hasStarted
                ? (<button className="btn btn-primary" onClick={() => setNewSide({})}>➕</button>)
                : null}
            {newSide && !readOnly && !hasStarted ? renderEditNewSide() : null}
        </div>
        {canShowResults ? (<TournamentRound
            round={tournamentData.round || {}}
            sides={tournamentData.sides.filter((s: TournamentSideDto) => !s.noShow)}
            onChange={propChanged(tournamentData, setTournamentData, 'round')}
            readOnly={readOnly}
            depth={1}
            onHiCheck={add180(tournamentData, setTournamentData)}
            on180={add180(tournamentData, setTournamentData)}
            patchData={applyPatch}
            allowNextRound={!tournamentData.singleRound}/>) : null}
        {canShowResults && any(allPlayers) ? (<table className="table">
            <tbody>
            <tr>
                <td colSpan={2} datatype="180s">
                    180s<br/>
                    <MultiPlayerSelection
                        disabled={disabled}
                        readOnly={saving}
                        allPlayers={allPlayers}
                        division={division}
                        season={season}
                        players={tournamentData.oneEighties || []}
                        onRemovePlayer={remove180(tournamentData, setTournamentData)}
                        onAddPlayer={add180(tournamentData, setTournamentData)}/>
                </td>
                <td colSpan={2} datatype="hiChecks">
                    100+ c/o<br/>
                    <MultiPlayerSelection
                        disabled={disabled}
                        readOnly={saving}
                        allPlayers={allPlayers}
                        division={division}
                        season={season}
                        players={tournamentData.over100Checkouts || []}
                        onRemovePlayer={removeHiCheck(tournamentData, setTournamentData)}
                        onAddPlayer={addHiCheck(tournamentData, setTournamentData)}
                        showScore={true}/>
                </td>
            </tr>
            </tbody>
        </table>) : null}
    </div>);
}
