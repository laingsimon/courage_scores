export function MatchDartCount({ homeCount, awayCount }) {
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
        <td className={`${homeCount > awayCount ? 'bg-winner' : ''} fw-bold`}>
            {awayCount}
        </td>
    </tr>);
}