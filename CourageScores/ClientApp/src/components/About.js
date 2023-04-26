import {useApp} from "../AppContainer";

export function About() {
    const { build } = useApp();

    return (<div className="light-background p-3">
        <h3>About</h3>
        <p>
            Built for and in consultation with the Courage League to fulfil their needs for recording fixture results more effectively.
        </p>

        <p>
            Custodians: Dave Jewell, Jon Green
        </p>

        <p>
            Author & Maintainer: <a target="_blank" rel="noreferrer" href="https://github.com/laingsimon">Simon Laing ↗</a>
        </p>

        <p>
            License: <a target="_blank" rel="noreferrer" href="https://github.com/laingsimon/courage_scores/blob/main/LICENSE">Apache License 2.0</a>
        </p>

        <table className="table">
            <thead>
            <tr>
                <th colSpan="2">Version</th>
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
                    <a href={`https://github.com/laingsimon/courage_scores/commit/${build.version}`}>{build.version ? build.version.substring(0, 8) : build.version}</a>
                </td>
            </tr>
            <tr>
                <th>Date</th>
                <td>{build.date}</td>
            </tr>
            </tbody>
        </table>
    </div>);
}