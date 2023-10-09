import React from "react";
import {any, isEmpty} from "../../../helpers/collections";
import {useApp} from "../../../AppContainer";

export function MergeHiCheckAnd180s({fixtureData, data, setFixtureData}) {
    const {onError} = useApp();

    function getRecordsToMerge(team, record) {
        const submission = data[team + 'Submission'];
        if (!submission) {
            return [];
        }

        return submission[record];
    }

    function mergeRecords(team, record) {
        try {
            const newFixtureData = Object.assign({}, fixtureData);
            const submission = data[team + 'Submission'];

            newFixtureData[record] = submission[record];

            setFixtureData(newFixtureData);
        } catch (e) {
            /* istanbul ignore next */
            onError(e);
        }
    }

    try {
        return (<tr>
            <td colSpan="2" className="text-end">
                {any(getRecordsToMerge('home', 'oneEighties')) || any(getRecordsToMerge('home', 'over100Checkouts'))
                    ? (<div>
                        {isEmpty(fixtureData.oneEighties || []) && any(getRecordsToMerge('home', 'oneEighties')) ? (<div datatype="home-180s">
                            <h6>
                                from {data.homeSubmission.editor || 'Home'}
                                <button className="btn btn-sm btn-success margin-left"
                                        onClick={() => mergeRecords('home', 'oneEighties')}>Merge
                                </button>
                            </h6>
                            <ol className="d-inline-block">
                                {getRecordsToMerge('home', 'oneEighties').map(rec => (
                                    <li key={rec.id}>{rec.name}</li>))}
                            </ol>
                        </div>) : null}
                        {isEmpty(fixtureData.over100Checkouts || []) && any(getRecordsToMerge('home', 'over100Checkouts')) ? (<div datatype="home-hichecks">
                            <h6>
                                from {data.homeSubmission.editor || 'Home'}
                                <button className="btn btn-sm btn-success margin-left"
                                        onClick={() => mergeRecords('home', 'over100Checkouts')}>Merge
                                </button>
                            </h6>
                            <ol className="d-inline-block">
                                {getRecordsToMerge('home', 'over100Checkouts').map(rec => (
                                    <li key={rec.id}>{rec.name} ({rec.notes})</li>))}
                            </ol>
                        </div>) : null}
                    </div>)
                    : null}
            </td>
            <td className="overflow-hidden position-relative p-0 middle-vertical-line width-1">
                <div className="vertical-text transform-top-left position-absolute text-nowrap"
                     style={{marginLeft: '-5px'}}>
                    <span className="text-nowrap" style={{marginLeft: '-60px'}}>Merge &rarr;</span>
                </div>
            </td>
            <td colSpan="2">
                {any(getRecordsToMerge('away', 'oneEighties')) || any(getRecordsToMerge('away', 'over100Checkouts'))
                    ? (<div>
                        {isEmpty(fixtureData.oneEighties || []) && any(getRecordsToMerge('away', 'oneEighties')) ? (<div datatype="away-180s">
                            <h6>
                                from {data.awaySubmission.editor || 'Away'}
                                <button className="btn btn-sm btn-success margin-left"
                                        onClick={() => mergeRecords('away', 'oneEighties')}>Merge
                                </button>
                            </h6>
                            <ol className="d-inline-block">
                                {getRecordsToMerge('away', 'oneEighties').map(rec => (
                                    <li key={rec.id}>{rec.name}</li>))}
                            </ol>
                        </div>) : null}
                        {isEmpty(fixtureData.over100Checkouts || []) && any(getRecordsToMerge('away', 'over100Checkouts')) ? (<div datatype="away-hichecks">
                            <h6>
                                from {data.awaySubmission.editor || 'Away'}
                                <button className="btn btn-sm btn-success margin-left"
                                        onClick={() => mergeRecords('away', 'over100Checkouts')}>Merge
                                </button>
                            </h6>
                            <ol className="d-inline-block">
                                {getRecordsToMerge('away', 'over100Checkouts').map(rec => (
                                    <li key={rec.id}>{rec.name} ({rec.notes})</li>))}
                            </ol>
                        </div>) : null}
                    </div>)
                    : null}
            </td>
        </tr>);
    } catch (e) {
        /* istanbul ignore next */
        onError(e);
    }
}