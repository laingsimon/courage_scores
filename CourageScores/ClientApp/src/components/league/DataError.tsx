import { Link } from 'react-router';
import { useDivisionData } from './DivisionDataContainer';
import { DataErrorDto } from '../../interfaces/models/dtos/Division/DataErrorDto';

export interface IDataErrorProps {
    dataError: DataErrorDto;
}

export function DataError({ dataError }: IDataErrorProps) {
    const { id: divisionId } = useDivisionData();
    const root = `/division/${divisionId}`;

    return (
        <li>
            {dataError.message}
            {dataError.gameId ? (
                <div>
                    <Link to={`/score/${dataError.gameId}`}>View fixture</Link>
                </div>
            ) : null}
            {dataError.tournamentId ? (
                <div>
                    <Link to={`/tournament/${dataError.tournamentId}`}>
                        View tournament
                    </Link>
                </div>
            ) : null}
            {dataError.teamId && !dataError.playerId ? (
                <div>
                    <Link to={`${root}/team:${dataError.teamId}`}>
                        View team
                    </Link>
                </div>
            ) : null}
            {dataError.playerId && dataError.teamId ? (
                <div>
                    <Link
                        to={`${root}/player:${dataError.playerId}@${dataError.teamId}`}>
                        View player
                    </Link>
                </div>
            ) : null}
        </li>
    );
}
