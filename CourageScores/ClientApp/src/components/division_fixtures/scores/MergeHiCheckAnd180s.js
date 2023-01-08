import React from "react";

export function MergeHiCheckAnd180s({ fixtureData, data, setFixtureData }) {
    function getRecordsToMerge(team, record) {
        const submission = data[team + 'Submission'];
        if (!submission) {
            return [];
        }

        const firstMatch = submission.matches[0];
        if (!firstMatch) {
            return [];
        }

        return firstMatch[record];
    }

    function mergeRecords(team, record) {
        const newFixtureData = Object.assign({}, fixtureData);
        const firstMatch = Object.assign({}, newFixtureData.matches[0]);
        const submission = data[team + 'Submission'];
        const firstSubmissionMatch = submission.matches[0];
        newFixtureData.matches[0] = firstMatch;

        firstMatch[record] = firstSubmissionMatch[record];

        setFixtureData(newFixtureData);
    }

    return (<tr>
        <td colSpan="2">
            {(!fixtureData.matches[0].oneEighties || fixtureData.matches[0].oneEighties.length === 0) && (getRecordsToMerge('home', 'oneEighties').length > 0 || getRecordsToMerge('away', 'oneEighties').length > 0)
                ? (<div>
                    {getRecordsToMerge('home', 'oneEighties').length > 0 ? (<div>
                        <h6>
                            from {data.homeSubmission.editor || 'Home'}
                            <button className="btn btn-sm btn-success margin-left" onClick={() => mergeRecords('away', 'oneEighties')}>Merge</button>
                        </h6>
                        <ol>
                            {getRecordsToMerge('home', 'oneEighties').map(rec => (<li key={rec.id}>{rec.name}</li>))}
                        </ol>
                    </div>) : null}
                    {getRecordsToMerge('away', 'oneEighties').length > 0 ? (<div>
                        <h6>
                            from {data.homeSubmission.editor || 'Away'}
                            <button className="btn btn-sm btn-success margin-left" onClick={() => mergeRecords('away', 'oneEighties')}>Merge</button>
                        </h6>
                        <ol>
                            {getRecordsToMerge('away', 'oneEighties').map(rec => (<li key={rec.id}>{rec.name}</li>))}
                        </ol>
                    </div>) : null}
                </div>)
                : null}
        </td>
        <td className="overflow-hidden position-relative">
            <div className="vertical-text transform-top-left position-absolute text-nowrap" style={{ marginLeft: '-5px' }}>
                <span className="text-nowrap" style={{ marginLeft: '-60px' }}>Merge &rarr;</span>
            </div>
        </td>
        <td colSpan="2">
            {(!fixtureData.matches[0].over100Checkouts || fixtureData.matches[0].over100Checkouts.length === 0) && (getRecordsToMerge('home', 'over100Checkouts').length > 0 || getRecordsToMerge('away', 'over100Checkouts').length > 0)
                ? (<div>
                    {getRecordsToMerge('home', 'over100Checkouts').length > 0 ? (<div>
                        <h6>
                            from {data.homeSubmission.editor || 'Home'}
                            <button className="btn btn-sm btn-success margin-left" onClick={() => mergeRecords('home', 'over100Checkouts')}>Merge</button>
                        </h6>
                        <ol>
                            {getRecordsToMerge('home', 'over100Checkouts').map(rec => (<li key={rec.id}>{rec.name} ({rec.notes})</li>))}
                        </ol>
                    </div>) : null}
                    {getRecordsToMerge('away', 'over100Checkouts').length > 0 ? (<div>
                        <h6>
                            from {data.homeSubmission.editor || 'Away'}
                            <button className="btn btn-sm btn-success margin-left" onClick={() => mergeRecords('away', 'over100Checkouts')}>Merge</button>
                        </h6>
                        <ol>
                            {getRecordsToMerge('away', 'over100Checkouts').map(rec => (<li key={rec.id}>{rec.name} ({rec.notes})</li>))}
                        </ol>
                    </div>) : null}
                </div>)
                : null}
        </td>
    </tr>);
}