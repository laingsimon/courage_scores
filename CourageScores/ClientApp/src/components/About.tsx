import {useApp} from "../AppContainer";
import {renderDate} from "../helpers/rendering";
import {useBranding} from "../BrandingContainer";

export function About() {
    const {build} = useApp();
    const {name, website, custodians} = useBranding();

    return (<div className="content-background p-3">
        <h3>About</h3>
        <p>
            Built for, and in consultation with, the <a href={website}>{name}</a> to modernise and streamline the method
            of recording and presenting fixtures and results.
        </p>

        <p>
            <strong>Custodians</strong>: <span className="csv-nodes">{(custodians || []).map((custodian, index) => <span
            key={index}>{custodian}</span>)}</span>
        </p>

        <p>
            <strong>Author & Maintainer</strong>: <a target="_blank" rel="noreferrer"
                                                     href="https://github.com/laingsimon">Simon Laing ↗</a>
        </p>

        <p>
            <strong>License</strong>: <a target="_blank" rel="noreferrer"
                                         href="https://github.com/laingsimon/courage_scores/blob/main/LICENSE">Apache
            License 2.0</a>
        </p>

        <p>
            <strong>Credits</strong>: <a target="_blank" rel="noreferrer"
                                         href="https://github.com/laingsimon/courage_scores/wiki/credits">Credits</a>
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
                        ? (
                            <a href={`https://github.com/laingsimon/courage_scores/commit/${build.version}`}>{build.version.substring(0, 8)}</a>)
                        : <span>Unknown</span>}
                </td>
            </tr>
            <tr>
                <th>Date</th>
                <td title={build.date}>{renderDate(build.date)} {new Date(build.date).toLocaleTimeString()}</td>
            </tr>
            </tbody>
        </table>
    </div>);
}
