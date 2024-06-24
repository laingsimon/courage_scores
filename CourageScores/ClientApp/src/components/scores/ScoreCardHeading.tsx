import {useApp} from "../common/AppContainer";
import {useLeagueFixture} from "./LeagueFixtureContainer";
import {renderDate} from "../../helpers/rendering";
import {count} from "../../helpers/collections";
import {GameDto} from "../../interfaces/models/dtos/Game/GameDto";
import {GameMatchDto} from "../../interfaces/models/dtos/Game/GameMatchDto";
import {GameMatchOptionDto} from "../../interfaces/models/dtos/Game/GameMatchOptionDto";
import {Link} from "react-router-dom";
import {TeamDto} from "../../interfaces/models/dtos/Team/TeamDto";

export interface IScoreCardHeadingProps {
    data: GameDto;
    access: string;
    submission?: string;
    setSubmission(submissionToShow: string): Promise<any>;
    setFixtureData(data: GameDto): Promise<any>;
}

export function ScoreCardHeading({data, access, submission, setSubmission, setFixtureData}: IScoreCardHeadingProps) {
    const {account, onError, teams} = useApp();
    const {division, season} = useLeagueFixture();
    const submissionTeam: TeamDto = account && access === 'clerk' && account.teamId ? teams[account.teamId] : null;
    const opposingTeam = submissionTeam && data.home.id === submissionTeam.id ? data.away : data.home;
    const homeScore = getScore(data, 'home');
    const awayScore = getScore(data, 'away');
    const winner = homeScore > awayScore
        ? 'home'
        : awayScore > homeScore
            ? 'away'
            : 'draw';
    const submissionData = data[submission + 'Submission'];

    async function toggleSubmission(submissionToShow: string) {
        try {
            if (submissionToShow === submission) {
                await setSubmission(null);
                await setFixtureData(data);
                return;
            }

            await setSubmission(submissionToShow);
            await setFixtureData(data[submissionToShow + 'Submission']);
        } catch (e) {
            /* istanbul ignore next */
            onError(e);
        }
    }

    function canShowSubmissionToggle(submission: GameDto) {
        return submission
            && (access === 'admin' || (account && submission && account.teamId === submission.id && access === 'clerk'));
    }

    function getScore(data: GameDto, side: string): number {
        function sideWonMatch(match: GameMatchDto, index: number): boolean {
            const matchOptions: GameMatchOptionDto = data.matchOptions[index];
            const defaultNumberOfLegs: number = 5;
            const numberOfLegs: number = matchOptions ? matchOptions.numberOfLegs : defaultNumberOfLegs;

            switch (side) {
                case 'home':
                    return match.homeScore > (numberOfLegs / 2.0);
                case 'away':
                    return match.awayScore > (numberOfLegs / 2.0);
                default:
                    return false;
            }
        }

        return count(data.matches, sideWonMatch);
    }

    return (<thead>
    <tr>
        <td colSpan={2} className={`text-end fw-bold width-50-pc ${winner === 'home' ? 'bg-winner' : ''}${submission === 'home' ? ' bg-warning' : ''}`}>
            {canShowSubmissionToggle(data.homeSubmission)
                ? (<span onClick={async () => await toggleSubmission('home')}
                         className={`btn btn-sm ${submission === 'home' ? 'btn-primary' : 'btn-outline-secondary'}`}
                         title="See home submission">📬 {data.home.name} ({getScore(data.homeSubmission, 'home')}-{getScore(data.homeSubmission, 'away')})</span>)
                : <Link to={`/division/${division.name}/team:${data.home.name}/${season.name}`}
                                  className="margin-right">{data.home.name} - {homeScore}</Link>}
        </td>
        <td className="text-center width-1 middle-vertical-line p-0"></td>
        <td colSpan={2} className={`text-start fw-bold width-50-pc ${winner === 'away' ? 'bg-winner' : ''}${submission === 'away' ? ' bg-warning' : ''}`}>
            {canShowSubmissionToggle(data.awaySubmission)
                ? (<span onClick={async () => await toggleSubmission('away')}
                         className={`btn btn-sm ${submission === 'away' ? 'btn-primary' : 'btn-outline-secondary'}`}
                         title="See away submission">📬 {data.away.name} ({getScore(data.awaySubmission, 'home')}-{getScore(data.awaySubmission, 'away')})</span>)
                : <Link to={`/division/${division.name}/team:${data.away.name}/${season.name}`}
                                  className="margin-right">{awayScore} - {data.away.name}</Link>}
        </td>
    </tr>
    {access === 'clerk' && !data.resultsPublished ? (<tr>
        <th colSpan={5}>
            <div className="alert alert-warning fw-normal">
                ⚠ You are editing {submissionTeam ? <>the submission from <strong>{submissionTeam.name}</strong></> : 'your submission'}, they are not visible on the website.<br />
                <br />
                The results will be published by an administrator, or automatically if someone from <strong>{opposingTeam.name}</strong> submits matching results.
            </div>
        </th>
    </tr>) : null}
    {access === 'admin' && submission ? (<tr>
        <th colSpan={5}>
            <div className="alert alert-warning fw-normal">
                You are viewing the submission from <strong>{data[submission].name}</strong>, created by <strong>{submissionData.editor}</strong> as of <strong title={submissionData.updated}>{renderDate(submissionData.updated)}</strong>
            </div>
        </th>
    </tr>) : null}
    </thead>);
}
