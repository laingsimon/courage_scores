import React from 'react';
import {useApp} from "../../../AppContainer";
import {matchEquals} from "./MatchComparer";
import {repeat} from "../../../helpers/projection";

export function MergeMatch({ readOnly, matches, matchIndex, homeSubmission, awaySubmission, setFixtureData, fixtureData }) {
    const { onError } = useApp();
    const homeSubmissionMatch = homeSubmission && homeSubmission.matches && homeSubmission.matches[matchIndex];
    const awaySubmissionMatch = awaySubmission && awaySubmission.matches && awaySubmission.matches[matchIndex];
    const publishedMatch = matches && matches[matchIndex];
    const isPublished = publishedMatch && Object.keys(publishedMatch).length >= 4; // homeScore+homePlayer + awayScore+awayPlayer = 4 properties
    const submissionsMatch = matchEquals(homeSubmissionMatch, awaySubmissionMatch);

    function acceptSubmission(match) {
        try {
            const newFixtureData = Object.assign({}, fixtureData);
            const matchOnlyProperties = Object.assign({}, match);

            newFixtureData.matches[matchIndex] = Object.assign(matchOnlyProperties, newFixtureData.matches[matchIndex]);

            setFixtureData(newFixtureData);
        } catch (e) {
            /* istanbul ignore next */
            onError(e);
        }
    }

    function combinePlayers(homePlayers, awayPlayers) {
        return repeat(
            Math.max(homePlayers.length, awayPlayers.length),
            index => { return { homePlayer: homePlayers[index], awayPlayer: awayPlayers[index] } });
    }

    function renderSubmissionMatch(match) {
        if (!match) {
            return (<span className="text-danger">No match</span>);
        }

        return (<span>
            <div>{homeSubmission.home.name}: {match.homeScore} - {awaySubmission.away.name}: {match.awayScore}</div>
            <ol>
                {combinePlayers(match.homePlayers, match.awayPlayers).map(p => (<li key={p.homePlayer.id || p.awayPlayer.id}>
                    <span className="text-nowrap">{p.homePlayer.name}</span> vs <span className="text-nowrap">{p.awayPlayer.name}</span>
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
                <td colSpan="5">
                    {renderSubmissionMatch(homeSubmissionMatch)}
                    <div className="text-center">
                        <button disabled={readOnly} onClick={() => acceptSubmission(homeSubmissionMatch)} className="btn btn-success btn-sm margin-left">Accept</button>
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
            <td colSpan="2" className="hover-highlight">
                <strong>from {homeSubmission.author}</strong>
                {renderSubmissionMatch(homeSubmissionMatch)}
                <div className="text-center">
                    <button disabled={readOnly} onClick={() => acceptSubmission(homeSubmissionMatch)}
                            className="btn btn-success btn-sm margin-left">Accept
                    </button>
                </div>
            </td>
            <td>
                <div className="vertical-text transform-top-left position-absolute text-nowrap"
                     style={{marginLeft: '-5px'}}>
                    <span className="text-nowrap" style={{marginLeft: '-60px'}}>Merge &rarr;</span>
                </div>
            </td>
            <td colSpan="2" className="hover-highlight">
                <strong>from {awaySubmission.author} xx</strong>
                {renderSubmissionMatch(awaySubmissionMatch)}
                <div className="text-center">
                    <button disabled={readOnly} onClick={() => acceptSubmission(awaySubmissionMatch)}
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