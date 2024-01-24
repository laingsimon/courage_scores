export interface IMatchDartCountProps {
    homeCount: number;
    awayCount: number;
    singlePlayer?: boolean;
}

export function MatchDartCount({homeCount, awayCount, singlePlayer}: IMatchDartCountProps) {
    if (homeCount + awayCount === 0) {
        return null
    }

    return (<tr>
        <td>
            Match darts
        </td>
        <td className={`${homeCount > awayCount ? '' : 'bg-winner'} fw-bold`}>
            {homeCount}
        </td>
        {singlePlayer ? null : (<td className={`${homeCount > awayCount ? 'bg-winner' : ''} fw-bold`}>
            {awayCount}
        </td>)}
    </tr>);
}