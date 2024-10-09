import {useApp} from "../common/AppContainer";
import {matchEquals} from "./MatchComparer";
import {repeat} from "../../helpers/projection";
import {GameMatchDto} from "../../interfaces/models/dtos/Game/GameMatchDto";
import {GameDto} from "../../interfaces/models/dtos/Game/GameDto";
import {GamePlayerDto} from "../../interfaces/models/dtos/Game/GamePlayerDto";
import {UntypedPromise} from "../../interfaces/UntypedPromise";

export interface IMergeMatchProps {
    readOnly?: boolean;
    matches?: GameMatchDto[];
    matchIndex: number;
    homeSubmission?: GameDto;
    awaySubmission?: GameDto;
    setFixtureData(newData: GameDto): UntypedPromise;
    fixtureData: GameDto;
}

export function MergeMatch({readOnly, matches, matchIndex, homeSubmission, awaySubmission, setFixtureData, fixtureData}: IMergeMatchProps) {
    const {onError} = useApp();
    const homeSubmissionMatch: GameMatchDto = homeSubmission && homeSubmission.matches && homeSubmission.matches[matchIndex];
    const awaySubmissionMatch: GameMatchDto = awaySubmission && awaySubmission.matches && awaySubmission.matches[matchIndex];
    const publishedMatch: GameMatchDto = matches && matches[matchIndex];
    const isPublished: boolean = publishedMatch && ((!!publishedMatch.homeScore) || (!!publishedMatch.awayScore));
    const submissionsMatch: boolean = matchEquals(homeSubmissionMatch, awaySubmissionMatch);

    async function acceptSubmission(match: GameMatchDto) {
        try {
            const newFixtureData: GameDto = Object.assign({}, fixtureData);
            const matchOnlyProperties: GameMatchDto = Object.assign({}, match);

            newFixtureData.matches[matchIndex] = Object.assign({}, matchOnlyProperties, newFixtureData.matches[matchIndex]);

            await setFixtureData(newFixtureData);
        } catch (e) {
            /* istanbul ignore next */
            onError(e);
        }
    }

    function combinePlayers(homePlayers: GamePlayerDto[], awayPlayers: GamePlayerDto[]): {homePlayer: GamePlayerDto, awayPlayer: GamePlayerDto}[] {
        return repeat(
            Math.max(homePlayers.length, awayPlayers.length),
            (index: number) => {
                return {homePlayer: homePlayers[index], awayPlayer: awayPlayers[index]}
            });
    }

    function renderSubmissionMatch(match: GameMatchDto) {
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