import {Link} from "react-router-dom";
import React from "react";
import {useApp} from "../../../AppContainer";

export function ScoreCardHeading({ data, access, winner, submission, setSubmission, setFixtureData }) {
    const { account, onError } = useApp();

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

    return (<thead>
        <tr>
            <td colSpan="2" className={`text-end fw-bold width-50-pc ${winner === 'home' ? 'bg-winner' : ''}`}>
                <Link to={`/division/${data.divisionId}/team:${data.home.id}/${data.seasonId}`} className="margin-right">{data.home.name}</Link>
                {canShowSubmissionToggle(data.homeSubmission)
                    ? (<span onClick={() => toggleSubmission('home')} className={`btn btn-sm ${submission === 'home' ? 'btn-primary' : 'btn-outline-secondary'}`} title="See home submission">📬</span>)
                    : null}
            </td>
            <td className="text-center width-1 p-0"></td>
            <td colSpan="2" className={`text-start fw-bold width-50-pc ${winner === 'away' ? 'bg-winner' : ''}`}>
                <Link to={`/division/${data.divisionId}/team:${data.away.id}/${data.seasonId}`} className="margin-right">{data.away.name}</Link>
                {canShowSubmissionToggle(data.awaySubmission)
                    ? (<span onClick={() => toggleSubmission('away')} className={`btn btn-sm ${submission === 'away' ? 'btn-primary' : 'btn-outline-secondary'}`} title="See away submission">📬</span>)
                    : null}
            </td>
        </tr>
    </thead>);
}