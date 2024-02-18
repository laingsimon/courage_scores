import React, {useState} from "react";
import {BootstrapDropdown, IBootstrapDropdownItem} from "../common/BootstrapDropdown";
import {Dialog} from "../common/Dialog";
import {EditMatchOptions} from "../common/EditMatchOptions";
import {useApp} from "../common/AppContainer";
import {DataMap} from "../../helpers/collections";
import {TournamentMatchDto} from "../../interfaces/models/dtos/Game/TournamentMatchDto";
import {TournamentRoundDto} from "../../interfaces/models/dtos/Game/TournamentRoundDto";
import {GameMatchOptionDto} from "../../interfaces/models/dtos/Game/GameMatchOptionDto";
import {TournamentSideDto} from "../../interfaces/models/dtos/Game/TournamentSideDto";
import {TournamentPlayerDto} from "../../interfaces/models/dtos/Game/TournamentPlayerDto";
import {PatchTournamentDto} from "../../interfaces/models/dtos/Game/PatchTournamentDto";
import {PatchTournamentRoundDto} from "../../interfaces/models/dtos/Game/PatchTournamentRoundDto";
import {MatchSayg} from "./MatchSayg";

export interface ITournamentRoundMatchProps {
    readOnly?: boolean;
    match: TournamentMatchDto;
    hasNextRound?: boolean;
    sideMap: DataMap<TournamentSideDto>;
    exceptSelected: (side: TournamentSideDto, matchIndex: number, sideAOrB: string) => boolean;
    matchIndex: number;
    onChange?: (round: TournamentRoundDto) => Promise<any>;
    round: TournamentRoundDto;
    matchOptions: GameMatchOptionDto;
    onMatchOptionsChanged: (newOptions: GameMatchOptionDto) => Promise<any>;
    onHiCheck?: (player: TournamentPlayerDto, score: number) => Promise<any>;
    on180?: (player: TournamentPlayerDto) => Promise<any>;
    patchData: (patch: PatchTournamentDto | PatchTournamentRoundDto, nestInRound?: boolean) => Promise<any>;
}

export function TournamentRoundMatch({ readOnly, match, hasNextRound, sideMap, exceptSelected, matchIndex, onChange,
                                         round, matchOptions, onMatchOptionsChanged, onHiCheck, on180, patchData }: ITournamentRoundMatchProps) {
    const {onError} = useApp();
    const scoreA: number = match.scoreA;
    const scoreB: number = match.scoreB;
    const scoreARecorded: boolean = hasScore(match.scoreA);
    const scoreBRecorded: boolean = hasScore(match.scoreB);
    const hasBothScores: boolean = scoreARecorded && scoreBRecorded;
    const [matchOptionsDialogOpen, setMatchOptionsDialogOpen] = useState<boolean>(false);

    function sideSelection(side: TournamentSideDto): IBootstrapDropdownItem {
        return {
            value: side.id,
            text: side.name
        };
    }

    function hasScore(score: number) {
        return score !== null && score !== undefined;
    }

    async function updateMatch(property: string, sideId: string) {
        try {
            const newRound = Object.assign({}, round);
            const match = newRound.matches[matchIndex];
            match[property] = sideMap[sideId];

            if (onChange) {
                await onChange(newRound);
            }
        } catch (e) {
            /* istanbul ignore next */
            onError(e);
        }
    }

    async function changeScore(event: React.ChangeEvent<HTMLInputElement>, property: string) {
        try {
            const newRound: TournamentRoundDto = Object.assign({}, round);
            const match: TournamentMatchDto = newRound.matches[matchIndex];
            match[property] = Number.parseInt(event.target.value || '0');

            if (onChange) {
                await onChange(newRound);
            }
        } catch (e) {
            /* istanbul ignore next */
            onError(e);
        }
    }

    async function removeMatch() {
        if (!window.confirm('Are you sure you want to remove this match?')) {
            return;
        }

        const newRound: TournamentRoundDto = Object.assign({}, round);
        newRound.matches = round.matches || [];
        newRound.matches.splice(matchIndex, 1);

        if (onChange) {
            await onChange(newRound);
        }
    }

    function renderMatchSettingsDialog() {
        return (<Dialog title="Edit match options" slim={true} onClose={async () => setMatchOptionsDialogOpen(false)}>
            <EditMatchOptions
                matchOptions={matchOptions}
                onMatchOptionsChanged={onMatchOptionsChanged}
                hideNumberOfPlayers={true}/>
        </Dialog>);
    }

    function isWinner(scoreA: number): boolean {
        const numberOfLegs: number = matchOptions ? matchOptions.numberOfLegs : 5;
        return scoreA > (numberOfLegs / 2.0);
    }

    return (<tr className="bg-light">
        <td className={hasBothScores && isWinner(scoreA) ? 'bg-winner' : ''}>
            {readOnly || hasNextRound
                ? (match.sideA.name || sideMap[match.sideA.id].name)
                : (<BootstrapDropdown
                    readOnly={readOnly}
                    value={match.sideA ? match.sideA.id : null}
                    options={sideMap.filter((s: TournamentSideDto) => exceptSelected(s, matchIndex, 'sideA')).map(sideSelection)}
                    onChange={(side) => updateMatch('sideA', side)}
                    slim={true}
                    className="margin-right"/>)}
            <MatchSayg
                match={match}
                round={round}
                on180={on180}
                onHiCheck={onHiCheck}
                onChange={onChange}
                matchOptions={matchOptions}
                matchIndex={matchIndex}
                patchData={patchData}
                readOnly={readOnly} />
        </td>
        <td className={hasBothScores && isWinner(scoreA) ? 'narrow-column bg-winner' : 'narrow-column'}>
            {readOnly || hasNextRound
                ? scoreA || (scoreARecorded ? '0' : '')
                : (<input type="number" value={scoreARecorded ? (match.scoreA || '0') : ''}
                          max={matchOptions.numberOfLegs} min="0" onChange={(event: React.ChangeEvent<HTMLInputElement>) => changeScore(event, 'scoreA')}/>)}
        </td>
        <td className="narrow-column">vs</td>
        <td className={hasBothScores && isWinner(scoreB) ? 'narrow-column bg-winner' : 'narrow-column'}>
            {readOnly || hasNextRound
                ? scoreB || (scoreBRecorded ? '0' : '')
                : (<input type="number" value={scoreBRecorded ? (match.scoreB || '0') : ''}
                          max={matchOptions.numberOfLegs} min="0" onChange={(event: React.ChangeEvent<HTMLInputElement>) => changeScore(event, 'scoreB')}/>)}
        </td>
        <td className={hasBothScores && isWinner(scoreB) ? 'bg-winner' : ''}>
            {readOnly || hasNextRound
                ? (match.sideB.name || sideMap[match.sideB.id].name)
                : (<BootstrapDropdown
                    readOnly={readOnly}
                    value={match.sideB ? match.sideB.id : null}
                    options={sideMap.filter((s: TournamentSideDto) => exceptSelected(s, matchIndex, 'sideB')).map(sideSelection)}
                    onChange={(side) => updateMatch('sideB', side)}
                    slim={true}
                    className="margin-right"/>)}
        </td>
        {readOnly || hasNextRound ? null : (<td className="text-end">
            {matchOptionsDialogOpen ? renderMatchSettingsDialog() : null}

            <button className="btn btn-danger btn-sm" onClick={() => removeMatch()}>🗑</button>
            <button title={`${matchOptions.numberOfLegs} leg/s. Starting score: ${matchOptions.startingScore}`}
                    className="btn btn-sm" onClick={() => setMatchOptionsDialogOpen(true)}>🛠
            </button>
        </td>)}
    </tr>);
}