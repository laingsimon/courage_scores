import {ILayoutDataForMatch, ILayoutDataForSide} from "../../helpers/tournaments";
import {useState} from "react";
import {Dialog} from "../common/Dialog";
import {BootstrapDropdown, IBootstrapDropdownItem} from "../common/BootstrapDropdown";
import {propChanged} from "../../helpers/events";
import {TournamentSideDto} from "../../interfaces/models/dtos/Game/TournamentSideDto";
import {useTournament} from "./TournamentContainer";
import {any, sortBy} from "../../helpers/collections";
import {TournamentGameDto} from "../../interfaces/models/dtos/Game/TournamentGameDto";
import {TournamentRoundDto} from "../../interfaces/models/dtos/Game/TournamentRoundDto";
import {TournamentMatchDto} from "../../interfaces/models/dtos/Game/TournamentMatchDto";
import {createTemporaryId, repeat} from "../../helpers/projection";

export interface IPrintableSheetMatchProps {
    matchData: ILayoutDataForMatch;
    roundIndex: number;
    matchIndex: number;
    possibleSides: TournamentSideDto[];
    editable?: boolean;
}

interface IEditSide {
    sideId: string;
    score: string;
    designation: 'A' | 'B';
}

export function PrintableSheetMatch({ matchData, possibleSides, roundIndex, matchIndex, editable } : IPrintableSheetMatchProps) {
    const [ editSide, setEditSide ] = useState<IEditSide>(null);
    const { tournamentData, setTournamentData, matchOptionDefaults } = useTournament();
    const bestOf: number = tournamentData.bestOf || matchOptionDefaults.numberOfLegs || 5;
    const possibleSideOptions: IBootstrapDropdownItem[] = possibleSides.sort(sortBy('name')).map((side: TournamentSideDto): IBootstrapDropdownItem => { return {
        value: side.id,
        text: side.name,
    }});
    const possibleScoreOptions: IBootstrapDropdownItem[] = repeat(Math.ceil(bestOf / 2) + 1, (index: number): IBootstrapDropdownItem => {
        return {
            value: index,
            text: index
        };
    })

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
            {side.mnemonic ? <span className="text-secondary-50 opacity-75 small" datatype={`side${type}mnemonic`}>{side.mnemonic}</span> : null}
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

        const newTournamentData: TournamentGameDto = Object.assign({}, tournamentData);
        const newRound: TournamentRoundDto = getEditableRound(newTournamentData, true);

        let currentMatch: TournamentMatchDto;
        if (matchIndex >= newRound.matches.length) {
            currentMatch = {
                id: createTemporaryId(),
                sideB: { id: null, name: null },
                sideA: { id: null, name: null },
            };
            newRound.matches.push(currentMatch);
            newRound.matchOptions.push(matchOptionDefaults);
        } else {
            currentMatch = newRound.matches[matchIndex];
        }
        const newMatch: TournamentMatchDto = Object.assign({}, currentMatch);

        newMatch['side' + editSide.designation] = possibleSides.filter((s: TournamentSideDto) => s.id === editSide.sideId)[0];
        newMatch['score' + editSide.designation] = Number.parseInt(editSide.score);

        newRound.matches[matchIndex] = newMatch;

        await setTournamentData(newTournamentData);
        setEditSide(null);
    }

    async function onRemove() {
        const newTournamentData: TournamentGameDto = Object.assign({}, tournamentData);
        const newRound: TournamentRoundDto = getEditableRound(newTournamentData, true);

        let currentMatch: TournamentMatchDto = newRound.matches[matchIndex];
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

    function renderEditSideDialog() {
        const oppositeSideId = editSide.designation === 'A'
            ? matchData.sideB ? matchData.sideB.id : null
            : matchData.sideA ? matchData.sideA.id : null;

        return (<Dialog title="Edit side">
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
                Best of {bestOf} legs
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
                     className={`p-0 border-solid border-1 m-1 position-relative ${matchData.bye ? 'opacity-50' : ''}`}>
            {matchData.mnemonic && !matchData.hideMnemonic
                ? (<span datatype="match-mnemonic" className="position-absolute right-0 opacity-75">
                        <span className="small rounded-circle bg-secondary opacity-75 text-light p-1 position-absolute" style={{left: -10, top: -10}}>
                            {matchData.mnemonic}
                        </span>
                    </span>)
                : null}
            {matchData.bye ? (<div className="position-absolute-bottom-right">Bye</div>) : null}
            <div datatype="sideA"
                 onClick={editable ? () => beginEditSide('A') : null}
                 className={`d-flex flex-row justify-content-between p-2 min-width-150 ${matchData.winner === 'sideA' ? 'bg-winner fw-bold' : ''}`}>
                {renderSide(matchData.sideA, 'A')}
                <div datatype="scoreA">{matchData.scoreA || ''}</div>
            </div>
            {matchData.bye
                ? null
                : (<div className="text-center dotted-line-through">
                        <span className="px-3 bg-white position-relative">
                            vs
                            {matchData.saygId
                                ? (<a href={`/live/match/${matchData.saygId}`} target="_blank" rel="noreferrer" className="margin-left no-underline">👁️</a>)
                                : null}
                        </span>
                    </div>)}
            {matchData.bye
                ? null
                : (<div datatype="sideB"
                        onClick={editable ? () => beginEditSide('B') : null}
                        className={`d-flex flex-row justify-content-between p-2 min-width-150 ${matchData.winner === 'sideB' ? 'bg-winner fw-bold' : ''}`}>
                    {renderSide(matchData.sideB, 'B')}
                    <div datatype="scoreB">{matchData.scoreB || ''}</div>
                </div>)}
        </div>
    </>);
}