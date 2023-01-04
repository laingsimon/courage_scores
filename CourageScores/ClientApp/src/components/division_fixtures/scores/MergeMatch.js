import React from 'react';

export function MergeMatch({ readOnly, matches, matchIndex, homeSubmission, awaySubmission, acceptSubmission }) {
    const homeSubmissionMatch = homeSubmission && homeSubmission.matches && homeSubmission.matches[matchIndex];
    const awaySubmissionMatch = awaySubmission && awaySubmission.matches && awaySubmission.matches[matchIndex];
    const publishedMatch = matches && matches[matchIndex];
    const isPublished = publishedMatch && Object.keys(publishedMatch).length >= 4; // homeScore+homePlayer + awayScore+awayPlayer = 4 properties
    const submissionsMatch = matchEquals(homeSubmissionMatch, awaySubmissionMatch);

    function matchEquals(x, y) {
        if (!x && !y) {
            return true;
        }

        if (!y || !x) {
            return false;
        }

        return x.homeScore === y.homeScore
            && x.awayScore === y.awayScore
            && playersEqual(x.homePlayers, y.homePlayers)
            && playersEqual(x.awayPlayers, y.awayPlayers);
    }

    function playersEqual(xPlayers, yPlayers) {
        if (!xPlayers && !yPlayers) {
            return true;
        }

        if (!xPlayers || !yPlayers) {
            return false;
        }

        if (xPlayers.length !== yPlayers.length) {
            return false;
        }

        for (let index = 0; index < xPlayers.length; index++) {
            const xPlayer = xPlayers[index];
            const yPlayer = yPlayers[index];

            if (xPlayer.id !== yPlayer.id) {
                return false;
            }
        }

        return true;
    }

    function combinePlayers(homePlayers, awayPlayers) {
        const players = [];

        for (let index = 0; index < Math.max(homePlayers.length, awayPlayers.length); index++) {
            players.push({ homePlayer: homePlayers[index], awayPlayer: awayPlayers[index] });
        }

        return players;
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
        return (<tr>
            <td colSpan="5">
                {renderSubmissionMatch(homeSubmissionMatch)}
                <div className="text-center">
                    <button disabled={readOnly} onClick={async () => await acceptSubmission(homeSubmissionMatch)} className="btn btn-success btn-sm margin-left">Accept</button>
                </div>
            </td>
        </tr>)
    }

    if (!homeSubmissionMatch) {
        return null;
    }

    return (<tr>
        <td colSpan="2" className="hover-highlight">
            <strong>from {homeSubmissionMatch.author}</strong>
            {renderSubmissionMatch(homeSubmissionMatch)}
            <div className="text-center">
                <button disabled={readOnly} onClick={async () => await acceptSubmission(homeSubmissionMatch)} className="btn btn-success btn-sm margin-left">Accept</button>
            </div>
        </td>
        <td>
            <div className="vertical-text transform-top-left position-absolute text-nowrap" style={{ marginLeft: '-5px' }}>
                <span className="text-nowrap" style={{ marginLeft: '-60px' }}>Merge &rarr;</span>
            </div>
        </td>
        <td colSpan="2" className="hover-highlight">
            <strong>from {awaySubmissionMatch.author}</strong>
            {renderSubmissionMatch(awaySubmissionMatch)}
            <div className="text-center">
                <button disabled={readOnly} onClick={async () => await acceptSubmission(awaySubmissionMatch)} className="btn btn-success btn-sm margin-left">Accept</button>
            </div>
        </td>
    </tr>);
}