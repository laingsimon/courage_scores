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
            onError(e);
        }
    }

    return (<thead>
        <tr>
            <td colSpan="2" className={`text-end fw-bold width-50-pc ${winner === 'home' ? 'bg-winner' : ''}`}>
                <Link to={`/division/${data.divisionId}/team:${data.home.id}/${data.seasonId}`} className="margin-right">{data.home.name}</Link>
                {data.homeSubmission && (access === 'admin' || (account && data.home && account.teamId === data.home.id && access === 'clerk')) ? (<span onClick={() => toggleSubmission('home')} className={`btn btn-sm ${submission === 'home' ? 'btn-primary' : 'btn-outline-secondary'}`} title="See home submission">📬</span>) : null}
            </td>
            <td className="text-center width-1 p-0"></td>
            <td colSpan="2" className={`text-start fw-bold width-50-pc ${winner === 'away' ? 'bg-winner' : ''}`}>
                <Link to={`/division/${data.divisionId}/team:${data.away.id}/${data.seasonId}`} className="margin-right">{data.away.name}</Link>
                {data.awaySubmission && (access === 'admin' || (account && data.away && account.teamId === data.away.id && access === 'clerk')) ? (<span onClick={() => toggleSubmission('away')} className={`btn btn-sm ${submission === 'away' ? 'btn-primary' : 'btn-outline-secondary'}`} title="See home submission">📬</span>) : null}
            </td>
        </tr>
    </thead>);
}