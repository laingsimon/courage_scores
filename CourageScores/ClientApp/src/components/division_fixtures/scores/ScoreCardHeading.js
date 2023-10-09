import React from "react";
import {useApp} from "../../../AppContainer";
import {useLeagueFixture} from "./LeagueFixtureContainer";
import {EmbedAwareLink} from "../../common/EmbedAwareLink";
import {renderDate} from "../../../helpers/rendering";
import {count} from "../../../helpers/collections";

export function ScoreCardHeading({data, access, submission, setSubmission, setFixtureData}) {
    const {account, onError, teams} = useApp();
    const {division, season} = useLeagueFixture();
    const submissionTeam = account && access === 'clerk' && account.teamId ? teams[account.teamId] : null;
    const opposingTeam = submissionTeam && data.home.id === submissionTeam.id ? data.away : data.home;
    const homeScore = getScore('home');
    const awayScore = getScore('away');
    const winner = homeScore > awayScore
        ? 'home'
        : awayScore > homeScore
            ? 'away'
            : 'draw';
    const submissionData = data[submission + 'Submission'];

    function toggleSubmission(submissionToShow) {
        try {
            if (submissionToShow === submission) {
                setSubmission(null);
                setFixtureData(data);
                return;
            }

            setSubmission(submissionToShow);
            setFixtureData(data[submissionToShow + 'Submission']);
        } catch (e) {
            /* istanbul ignore next */
            onError(e);
        }
    }

    function canShowSubmissionToggle(submission) {
        return submission
            && (access === 'admin' || (account && submission && account.teamId === submission.id && access === 'clerk'));
    }

    function getScore(side) {
        function sideWonMatch(match) {
            switch (side) {
                case 'home':
                    return match.homeScore > match.awayScore;
                case 'away':
                    return match.awayScore > match.homeScore;
                default:
                    return false;
            }
        }

        return count(data.matches, sideWonMatch);
    }

    return (<thead>
    <tr>
        <td colSpan="2" className={`text-end fw-bold width-50-pc ${winner === 'home' ? 'bg-winner' : ''}${submission === 'home' ? ' bg-warning' : ''}`}>
            {canShowSubmissionToggle(data.homeSubmission)
                ? (<span onClick={() => toggleSubmission('home')}
                         className={`btn btn-sm ${submission === 'home' ? 'btn-primary' : 'btn-outline-secondary'}`}
                         title="See home submission">📬 {data.home.name} ({getScore('home')})</span>)
                : <EmbedAwareLink to={`/division/${division.name}/team:${data.home.name}/${season.name}`}
                                  className="margin-right">{data.home.name} - {getScore('home')}</EmbedAwareLink>}
        </td>
        <td className="text-center width-1 middle-vertical-line p-0"></td>
        <td colSpan="2" className={`text-start fw-bold width-50-pc ${winner === 'away' ? 'bg-winner' : ''}${submission === 'away' ? ' bg-warning' : ''}`}>
            {canShowSubmissionToggle(data.awaySubmission)
                ? (<span onClick={() => toggleSubmission('away')}
                         className={`btn btn-sm ${submission === 'away' ? 'btn-primary' : 'btn-outline-secondary'}`}
                         title="See away submission">📬 {data.away.name} ({getScore('away')})</span>)
                : <EmbedAwareLink to={`/division/${division.name}/team:${data.away.name}/${season.name}`}
                                  className="margin-right">{getScore('away')} - {data.away.name}</EmbedAwareLink>}
        </td>
    </tr>
    {access === 'clerk' && !data.resultsPublished ? (<tr>
        <th colSpan="5">
            <div className="alert alert-warning fw-normal">
                ⚠ You are editing {submissionTeam ? <>the submission from <strong>{submissionTeam.name}</strong></> : 'your submission'}, they are not visible on the website.<br />
                <br />
                The results will be published by an administrator, or automatically if {opposingTeam ? <>someone from <strong>{opposingTeam.name}</strong></> : 'the opponent'} submits matching results.
            </div>
        </th>
    </tr>) : null}
    {access === 'admin' && submission ? (<tr>
        <th colSpan="5">
            <div className="alert alert-warning fw-normal">
                You are viewing the submission from <strong>{data[submission].name}</strong>, created by <strong>{submissionData.editor}</strong> as of <strong title={submissionData.updated}>{renderDate(submissionData.updated)}</strong>
            </div>
        </th>
    </tr>) : null}
    </thead>);
}
