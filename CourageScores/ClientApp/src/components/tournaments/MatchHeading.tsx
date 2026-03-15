import { useSayg } from '../sayg/SaygLoadingContainer';
import { TournamentMatchDto } from '../../interfaces/models/dtos/Game/TournamentMatchDto';
import { DebugOptions } from '../common/DebugOptions';
import { useDependencies } from '../common/IocContainer';

export interface ISuperleagueMatchHeadingProps {
    match: TournamentMatchDto;
}

export function MatchHeading({ match }: ISuperleagueMatchHeadingProps) {
    const { sayg } = useSayg();
    const { settings } = useDependencies();
    const home: string | undefined = match.sideA?.name;
    const away: string | undefined = match.sideB?.name;

    return (
        <h5 className="modal-header justify-content-center">
            {home} vs {away} - best of {sayg.numberOfLegs}
            <DebugOptions text="ℹ️">
                <span className="dropdown-item">
                    Match scores: {match.scoreA} - {match.scoreB}
                </span>
                <span className="dropdown-item">
                    Best of: (Sayg={sayg.numberOfLegs})
                </span>
                <span className="dropdown-item">Match id: {match.id}</span>
                <span className="dropdown-item">Match id: {match.id}</span>
                <a
                    target="_blank"
                    rel="noreferrer"
                    href={`${settings.apiHost}/api/Sayg/${sayg.id}`}
                    className="dropdown-item">
                    <strong>Sayg data</strong>
                    <small className="d-block">{sayg.id}</small>
                </a>
            </DebugOptions>
        </h5>
    );
}
