import {useState} from "react";
import {Dialog} from "../common/Dialog";
import {BootstrapDropdown, IBootstrapDropdownItem} from "../common/BootstrapDropdown";
import {propChanged, stateChanged} from "../../helpers/events";
import {TournamentSideDto} from "../../interfaces/models/dtos/Game/TournamentSideDto";
import {useTournament} from "./TournamentContainer";
import {any, sortBy} from "../../helpers/collections";
import {TournamentGameDto} from "../../interfaces/models/dtos/Game/TournamentGameDto";
import {TournamentRoundDto} from "../../interfaces/models/dtos/Game/TournamentRoundDto";
import {TournamentMatchDto} from "../../interfaces/models/dtos/Game/TournamentMatchDto";
import {createTemporaryId, repeat} from "../../helpers/projection";
import {MatchSayg} from "./MatchSayg";
import {PatchTournamentDto} from "../../interfaces/models/dtos/Game/PatchTournamentDto";
import {PatchTournamentRoundDto} from "../../interfaces/models/dtos/Game/PatchTournamentRoundDto";
import {ILayoutDataForMatch} from "./layout/ILayoutDataForMatch";
import {ILayoutDataForSide} from "./layout/ILayoutDataForSide";
import {GameMatchOptionDto} from "../../interfaces/models/dtos/Game/GameMatchOptionDto";
import {UntypedPromise} from "../../interfaces/UntypedPromise";

export interface IPrintableSheetMatchProps {
    matchData: ILayoutDataForMatch;
    roundIndex: number;
    matchIndex: number;
    possibleSides: TournamentSideDto[];
    editable?: boolean;
    patchData?(patch: PatchTournamentDto | PatchTournamentRoundDto, nestInRound?: boolean): UntypedPromise;
    round?: TournamentRoundDto;
}

interface IEditSide {
    sideId: string;
    score: string;
    designation: 'A' | 'B';
}

export function PrintableSheetMatch({ round, matchData, possibleSides, roundIndex, matchIndex, editable, patchData } : IPrintableSheetMatchProps) {
    const { tournamentData, setTournamentData, matchOptionDefaults } = useTournament();
    const matchOptions = matchData.matchOptions || { numberOfLegs: tournamentData.bestOf || matchOptionDefaults.numberOfLegs || 5 };
    const [ editSide, setEditSide ] = useState<IEditSide>(null);
    const [ bestOf, setBestOf ] = useState<string>(matchOptions.numberOfLegs ? matchOptions.numberOfLegs.toString() : '5');
    const possibleSideOptions: IBootstrapDropdownItem[] = possibleSides.sort(sortBy('name')).map((side: TournamentSideDto): IBootstrapDropdownItem => { return {
        value: side.id,
        text: side.name,
    }});
    const possibleScoreOptions: IBootstrapDropdownItem[] = repeat(Math.ceil(Number.parseInt(bestOf) / 2) + 1, (index: number): IBootstrapDropdownItem => {
        return {
            value: index,
            text: index
        };
    })
    const readOnly: boolean = !round;

    function beginEditSide(designation: 'A' | 'B') {
        // check that the round exists...
        let round: TournamentRoundDto = tournamentData.round;
        let highestRoundIndex: number = 0;

        for (let index = 0; index < roundIndex; index++) {
            if (round && any(round.matches)) {
                highestRoundIndex++;
            }

            round = round ? round.nextRound : null;
        }

        if (roundIndex > highestRoundIndex) {
            alert('Finish entering data for the previous rounds first');
            return;
        }

        const side: ILayoutDataForSide = matchData['side' + designation];
        const editSide: IEditSide = {
            sideId: side.id,
            score: (designation === 'A' ? matchData.scoreA : matchData.scoreB) || '0',
            designation: designation,
        };

        if (!editSide.sideId && side.mnemonic) {
            // find the side with this name
            const preSelectSide: IBootstrapDropdownItem = possibleSideOptions.filter(o => o.text === side.mnemonic)[0];
            if (preSelectSide) {
                editSide.sideId = preSelectSide.value;
            }
        }

        setEditSide(editSide);
    }

    function renderSide(side: ILayoutDataForSide, type: 'A' | 'B') {
        return <div className="no-wrap pe-3">
            {side.link && !editable ? (<span datatype={`side${type}name`}>{side.link}</span>) : (<span datatype={`side${type}name`}>{side.name}</span>)}
            {side.mnemonic ? <span className="text-secondary-50 opacity-75 small" datatype={`side${type}mnemonic`}>{side.mnemonic && side.showMnemonic ? side.mnemonic : null}</span> : null}
            {!side.name && (!side.mnemonic || !side.showMnemonic) ? <>&nbsp;</>: null}
        </div>
    }

    function getEmptyRound(): TournamentRoundDto {
        return {
            id: createTemporaryId(),
            matches: [],
            matchOptions: [],
        };
    }

    function getEditableRound(newTournamentData: TournamentGameDto, addIfNotExists?: boolean) {
        let newRound: TournamentRoundDto = newTournamentData.round || getEmptyRound();
        newTournamentData.round = newRound;

        for (let index = 0; index < roundIndex; index++) {
            const nextRound: TournamentRoundDto = Object.assign({}, newRound.nextRound || (addIfNotExists ? getEmptyRound() : null));
            newRound.nextRound = nextRound;
            newRound = nextRound;

            if (!newRound) {
                break;
            }
        }

        return newRound;
    }

    async function onSave() {
        if (!editSide.sideId) {
            window.alert('Select a side first');
            return;
        }

        const newBestOf = Number.parseInt(bestOf);
        if (!Number.isFinite(newBestOf)) {
            window.alert('Best of is invalid');
            return;
        }

        const newTournamentData: TournamentGameDto = Object.assign({}, tournamentData);
        const newRound: TournamentRoundDto = getEditableRound(newTournamentData, true);

        let currentMatch: TournamentMatchDto;
        let currentMatchOptions: GameMatchOptionDto;
        if (matchIndex >= newRound.matches.length) {
            currentMatch = {
                id: createTemporaryId(),
                sideB: { id: null, name: null },
                sideA: { id: null, name: null },
            };
            currentMatchOptions = Object.assign({}, matchOptionDefaults);
            newRound.matches.push(currentMatch);
            newRound.matchOptions.push(currentMatchOptions);
        } else {
            currentMatch = newRound.matches[matchIndex];
            currentMatchOptions = newRound.matchOptions[matchIndex];
        }
        const newMatch: TournamentMatchDto = Object.assign({}, currentMatch);
        const newMatchOptions: GameMatchOptionDto = Object.assign({}, currentMatchOptions);

        newMatch['side' + editSide.designation] = possibleSides.filter((s: TournamentSideDto) => s.id === editSide.sideId)[0];
        newMatch['score' + editSide.designation] = Number.parseInt(editSide.score);
        newMatchOptions.numberOfLegs = newBestOf;

        newRound.matches[matchIndex] = newMatch;
        newRound.matchOptions[matchIndex] = newMatchOptions;

        await setTournamentData(newTournamentData);
        setEditSide(null);
    }

    async function onRemove() {
        const newTournamentData: TournamentGameDto = Object.assign({}, tournamentData);
        const newRound: TournamentRoundDto = getEditableRound(newTournamentData, true);

        const currentMatch: TournamentMatchDto = newRound.matches[matchIndex];
        const newMatch: TournamentMatchDto = Object.assign({}, currentMatch);

        newMatch['side' + editSide.designation] = { players: [] };
        newMatch['score' + editSide.designation] = null;

        if ((!newMatch.sideA || !newMatch.sideA.id) && (!newMatch.sideB || !newMatch.sideB.id)) {
            // match is empty, it can be removed
            newRound.matches = newRound.matches.filter((_: TournamentMatchDto, index: number) => index !== matchIndex);
        } else {
            newRound.matches[matchIndex] = newMatch;
        }

        await setTournamentData(newTournamentData);
        setEditSide(null);
    }

    async function onChange(updatedRound: TournamentRoundDto) {
        const newTournamentData: TournamentGameDto = Object.assign({}, tournamentData);
        const newRound: TournamentRoundDto = getEditableRound(newTournamentData, false);

        // NOTE: This approach prevents the need to create a whole-new find-the-parent-of-the-round method
        // Instead we patch across every property from the provided round into an editable version
        for (const updatedRoundKey in updatedRound) {
            newRound[updatedRoundKey] = updatedRound[updatedRoundKey];
        }
        // Unset any properties that are in newRound but not in updatedRound
        for (const newRoundKey in newRound) {
            if (updatedRound[newRoundKey] === undefined) {
                delete newRound[newRoundKey];
            }
        }

        await setTournamentData(newTournamentData);
    }

    async function patchRoundData(patch: PatchTournamentDto | PatchTournamentRoundDto, nestInRound?: boolean) {
        if (!nestInRound) {
            // e.g. 180s/hi-checks, which don't apply to rounds, so can be pass up without including the nested round info.
            await patchData(patch, nestInRound);
            return;
        }

        let nestedPatch: PatchTournamentRoundDto = patch as PatchTournamentRoundDto;
        for (let index = 0; index < roundIndex; index++) {
            nestedPatch = {
                nextRound: nestedPatch
            };
        }

        await patchData(nestedPatch, nestInRound);
    }

    function renderEditSideDialog() {
        const oppositeSideId = editSide.designation === 'A'
            ? matchData.sideB ? matchData.sideB.id : null
            : matchData.sideA ? matchData.sideA.id : null;

        return (<Dialog title="Edit match" className="d-print-none">
            <div className="form-group input-group mb-3 d-print-none">
                <div className="input-group-prepend">
                    <span className="input-group-text">Side</span>
                </div>
                <BootstrapDropdown
                    value={editSide.sideId}
                    options={possibleSideOptions.filter((s: IBootstrapDropdownItem) => s.value !== oppositeSideId)}
                    onChange={propChanged(editSide, setEditSide, 'sideId')}
                    className="margin-right" />

                <div className="input-group-prepend">
                    <span className="input-group-text">Score</span>
                </div>
                <BootstrapDropdown
                    value={editSide.score}
                    options={possibleScoreOptions}
                    slim={true}
                    onChange={propChanged(editSide, setEditSide, 'score')} />
            </div>
            <div>
                Best of <input value={bestOf} name="bestOf" type="number" min="1" className="width-50" onChange={stateChanged(setBestOf)} /> legs
            </div>
            <div className="modal-footer px-0 pb-0 mt-3">
                <div className="left-aligned mx-0">
                    <button className="btn btn-secondary" onClick={() => setEditSide(null)}>Close</button>
                </div>
                {matchData['side' + editSide.designation] && matchData['side' + editSide.designation].id ? (<button className="btn btn-danger" onClick={onRemove}>
                    Remove
                </button>) : null}
                <button className="btn btn-primary" onClick={onSave}>
                    Save
                </button>
            </div>
        </Dialog>)
    }

    return (<>
        {editSide ? renderEditSideDialog() : null}
        <div datatype="match"
             className={`p-0 border-solid border-1 m-1 position-relative`}>
            {matchData.mnemonic && !matchData.hideMnemonic
                ? (<span datatype="match-mnemonic" className="position-absolute right-0 opacity-75">
                        <span className="small rounded-circle bg-secondary opacity-75 text-light p-1 position-absolute"
                              style={{left: -10, top: -10}}>
                            {matchData.mnemonic}
                        </span>
                    </span>)
                : null}
            {matchData.numberOfSidesOnTheNight
                ? (<span datatype="match-mnemonic" className="position-absolute left-0 opacity-75">
                        <span
                            className="small rounded-circle bg-light border-solid border-1 border-info p-1 position-absolute text-center"
                            style={{left: -10, top: -10, minWidth: '28px'}}>
                            {matchData.numberOfSidesOnTheNight}
                        </span>
                    </span>)
                : null}
            <div datatype="sideA"
                 onClick={editable ? () => beginEditSide('A') : null}
                 className={`d-flex flex-row justify-content-between p-2 min-width-150 ${matchData.winner === 'sideA' ? 'bg-winner fw-bold' : ''}`}>
                {renderSide(matchData.sideA, 'A')}
                <div datatype="scoreA">{matchData.scoreA || ''}</div>
            </div>
            <div className="text-center dotted-line-through">
                        <span className="px-3 bg-white position-relative">
                            vs
                            {matchData.match ? (<MatchSayg
                                match={matchData.match}
                                round={round}
                                onChange={onChange}
                                matchOptions={matchOptions}
                                matchIndex={matchIndex}
                                patchData={patchRoundData}
                                readOnly={readOnly}
                                showViewSayg={true}/>) : null}
                        </span>
            </div>
            <div datatype="sideB"
                 onClick={editable ? () => beginEditSide('B') : null}
                 className={`d-flex flex-row justify-content-between p-2 min-width-150 ${matchData.winner === 'sideB' ? 'bg-winner fw-bold' : ''}`}>
                {renderSide(matchData.sideB, 'B')}
                <div datatype="scoreB">{matchData.scoreB || ''}</div>
            </div>
        </div>
    </>);
}
