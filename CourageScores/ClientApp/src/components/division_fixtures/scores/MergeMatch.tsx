import React from 'react';
import {useApp} from "../../../AppContainer";
import {matchEquals} from "./MatchComparer";
import {repeat} from "../../../helpers/projection";
import {IGameMatchDto} from "../../../interfaces/dtos/Game/IGameMatchDto";
import {IGameDto} from "../../../interfaces/dtos/Game/IGameDto";
import {IGamePlayerDto} from "../../../interfaces/dtos/Game/IGamePlayerDto";

export interface IMergeMatchProps {
    readOnly?: boolean;
    matches?: IGameMatchDto[];
    matchIndex: number;
    homeSubmission?: IGameDto;
    awaySubmission?: IGameDto;
    setFixtureData: (newData: IGameDto) => Promise<any>;
    fixtureData: IGameDto;
}

export function MergeMatch({readOnly, matches, matchIndex, homeSubmission, awaySubmission, setFixtureData, fixtureData}: IMergeMatchProps) {
    const {onError} = useApp();
    const homeSubmissionMatch: IGameMatchDto = homeSubmission && homeSubmission.matches && homeSubmission.matches[matchIndex];
    const awaySubmissionMatch: IGameMatchDto = awaySubmission && awaySubmission.matches && awaySubmission.matches[matchIndex];
    const publishedMatch: IGameMatchDto = matches && matches[matchIndex];
    const isPublished: boolean = publishedMatch && ((!!publishedMatch.homeScore) || (!!publishedMatch.awayScore));
    const submissionsMatch: boolean = matchEquals(homeSubmissionMatch, awaySubmissionMatch);

    async function acceptSubmission(match: IGameMatchDto) {
        try {
            const newFixtureData: IGameDto = Object.assign({}, fixtureData);
            const matchOnlyProperties: IGameMatchDto = Object.assign({}, match);

            newFixtureData.matches[matchIndex] = Object.assign({}, matchOnlyProperties, newFixtureData.matches[matchIndex]);

            await setFixtureData(newFixtureData);
        } catch (e) {
            /* istanbul ignore next */
            onError(e);
        }
    }

    function combinePlayers(homePlayers: IGamePlayerDto[], awayPlayers: IGamePlayerDto[]): {homePlayer: IGamePlayerDto, awayPlayer: IGamePlayerDto}[] {
        return repeat(
            Math.max(homePlayers.length, awayPlayers.length),
            (index: number) => {
                return {homePlayer: homePlayers[index], awayPlayer: awayPlayers[index]}
            });
    }

    function renderSubmissionMatch(match: IGameMatchDto) {
        if (!match) {
            return (<span className="text-danger">No match</span>);
        }

        return (<span>
            <div>{homeSubmission.home.name}: {match.homeScore} - {awaySubmission.away.name}: {match.awayScore}</div>
            <ol className="d-inline-block">
                {combinePlayers(match.homePlayers, match.awayPlayers).map(p => (
                    <li key={p.homePlayer.id || p.awayPlayer.id}>
                        <span className="text-nowrap">{p.homePlayer.name}</span> vs <span
                        className="text-nowrap">{p.awayPlayer.name}</span>
                    </li>))}
            </ol>
        </span>);
    }

    if (isPublished) {
        return null;
    }

    if (submissionsMatch && homeSubmissionMatch) {
        try {
            return (<tr>
                <td colSpan={5} className="text-center">
                    {renderSubmissionMatch(homeSubmissionMatch)}
                    <div className="text-center">
                        <button disabled={readOnly} onClick={async () => await acceptSubmission(homeSubmissionMatch)}
                                className="btn btn-success btn-sm margin-left">Accept
                        </button>
                    </div>
                </td>
            </tr>);
        } catch (e) {
            /* istanbul ignore next */
            onError(e);
        }
    }

    if (!homeSubmissionMatch) {
        return null;
    }

    try {
        return (<tr>
            <td colSpan={2} className="hover-highlight pe-3 text-end">
                <strong>from {homeSubmission.author}</strong>
                {renderSubmissionMatch(homeSubmissionMatch)}
                <div className="text-center">
                    <button disabled={readOnly} onClick={async () => await acceptSubmission(homeSubmissionMatch)}
                            className="btn btn-success btn-sm margin-left">Accept
                    </button>
                </div>
            </td>
            <td className="p-0">
                <div className="vertical-text transform-top-left position-absolute text-nowrap"
                     style={{marginLeft: '-15px'}}>
                    <span className="text-nowrap bg-opacity-25 fw-bold bg-success p-2 shadow-sm" style={{marginLeft: '-75px'}}>Merge &rarr;</span>
                </div>
            </td>
            <td colSpan={2} className="hover-highlight ps-3">
                <strong>from {awaySubmission.author}</strong>
                {renderSubmissionMatch(awaySubmissionMatch)}
                <div className="text-center">
                    <button disabled={readOnly} onClick={async () => await acceptSubmission(awaySubmissionMatch)}
                            className="btn btn-success btn-sm margin-left">Accept
                    </button>
                </div>
            </td>
        </tr>);
    } catch (e) {
        /* istanbul ignore next */
        onError(e);
    }
}