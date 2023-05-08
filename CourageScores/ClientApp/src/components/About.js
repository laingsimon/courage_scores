import {useApp} from "../AppContainer";

export function About() {
    const { build } = useApp();
    const dateTime = new Date(build.date);

    return (<div className="light-background p-3">
        <h3>About</h3>
        <p>
            Built for, and in consultation with, the <a href="http://www.thecourageleague.co.uk">Courage League</a> to modernise and streamline the method of recording and presenting fixtures and results.
        </p>

        <p>
            <strong>Custodians</strong>: Dave Jewell, Jon Green
        </p>

        <p>
            <strong>Author & Maintainer</strong>: <a target="_blank" rel="noreferrer" href="https://github.com/laingsimon">Simon Laing ↗</a>
        </p>

        <p>
            <strong>License</strong>: <a target="_blank" rel="noreferrer" href="https://github.com/laingsimon/courage_scores/blob/main/LICENSE">Apache License 2.0</a>
        </p>

        <table className="table">
            <thead>
            <tr>
                <th colSpan="2">Version Information</th>
            </tr>
            </thead>
            <tbody>
            <tr>
                <th>Branch</th>
                <td>{build.branch}</td>
            </tr>
            <tr>
                <th>Version</th>
                <td>
                    {build.version
                        ? (<a href={`https://github.com/laingsimon/courage_scores/commit/${build.version}`}>{build.version ? build.version.substring(0, 8) : build.version}</a>)
                        : <span>Unknown</span>}
                </td>
            </tr>
            <tr>
                <th>Date</th>
                <td title={build.date}>{dateTime.toLocaleDateString()} {dateTime.toLocaleTimeString()}</td>
            </tr>
            </tbody>
        </table>
    </div>);
}