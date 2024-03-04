import {any, isEmpty} from "../../helpers/collections";
import {useApp} from "../common/AppContainer";
import {GameDto} from "../../interfaces/models/dtos/Game/GameDto";

export interface IMergeHiCheckAnd180sProps {
    fixtureData: GameDto;
    data: GameDto;
    setFixtureData(data: GameDto): Promise<any>;
}

export function MergeHiCheckAnd180s({fixtureData, data, setFixtureData}: IMergeHiCheckAnd180sProps) {
    const {onError} = useApp();

    function getRecordsToMerge(team: string, record: string): any[] {
        const submission: GameDto = data[team + 'Submission'];
        if (!submission) {
            return [];
        }

        return submission[record];
    }

    async function mergeRecords(team: string, record: string) {
        try {
            const newFixtureData: GameDto = Object.assign({}, fixtureData);
            const submission: GameDto = data[team + 'Submission'];

            newFixtureData[record] = submission[record];

            await setFixtureData(newFixtureData);
        } catch (e) {
            /* istanbul ignore next */
            onError(e);
        }
    }

    try {
        return (<>
        {isEmpty(fixtureData.oneEighties || []) && (any(getRecordsToMerge('home', 'oneEighties')) || any(getRecordsToMerge('away', 'oneEighties')))
            ? (<>
                <tr>
                    <td colSpan={5} className="text-center">
                        <h6>Merge 180s</h6>
                    </td>
                </tr>
                <tr datatype="merge-180s">
                    <td colSpan={2} className="text-end">
                        {isEmpty(fixtureData.oneEighties || []) && any(getRecordsToMerge('home', 'oneEighties')) ? (<div datatype="home-180s">
                            <h6>
                                <button className="btn btn-sm btn-success margin-left"
                                        onClick={async () => await mergeRecords('home', 'oneEighties')}>Merge
                                </button>
                            </h6>
                            <ol className="d-inline-block">
                                {getRecordsToMerge('home', 'oneEighties').map(rec => (
                                    <li key={rec.id}>{rec.name}</li>))}
                            </ol>
                        </div>) : null}
                    </td>
                    <td className="overflow-hidden position-relative p-0 middle-vertical-line width-1">
                        <div className="vertical-text transform-top-left position-absolute text-nowrap"
                             style={{marginLeft: '-5px'}}>
                            <span className="text-nowrap" style={{marginLeft: '-60px'}}>Merge &rarr;</span>
                        </div>
                    </td>
                    <td colSpan={2}>
                        {isEmpty(fixtureData.oneEighties || []) && any(getRecordsToMerge('away', 'oneEighties')) ? (<div datatype="away-180s">
                            <h6>
                                <button className="btn btn-sm btn-success margin-left"
                                        onClick={async () => await mergeRecords('away', 'oneEighties')}>Merge
                                </button>
                            </h6>
                            <ol className="d-inline-block">
                                {getRecordsToMerge('away', 'oneEighties').map(rec => (
                                    <li key={rec.id}>{rec.name}</li>))}
                            </ol>
                        </div>) : null}
                    </td>
                </tr>
            </>) : null}
            {isEmpty(fixtureData.over100Checkouts || []) && (any(getRecordsToMerge('home', 'over100Checkouts')) || any(getRecordsToMerge('away', 'over100Checkouts')))
                ? (<>
                    <tr>
                        <td colSpan={5} className="text-center">
                            <h6>Merge Hi-checks</h6>
                        </td>
                    </tr>
                    <tr datatype="merge-hichecks">
                        <td colSpan={2} className="text-end">
                            {isEmpty(fixtureData.over100Checkouts || []) && any(getRecordsToMerge('home', 'over100Checkouts')) ? (<div datatype="home-hichecks">
                                <h6>
                                    <button className="btn btn-sm btn-success margin-left"
                                            onClick={async () => await mergeRecords('home', 'over100Checkouts')}>Merge
                                    </button>
                                </h6>
                                <ol className="d-inline-block">
                                    {getRecordsToMerge('home', 'over100Checkouts').map(rec => (
                                        <li key={rec.id}>{rec.name} ({rec.score})</li>))}
                                </ol>
                            </div>) : null}
                        </td>
                        <td className="overflow-hidden position-relative p-0 middle-vertical-line width-1">
                            <div className="vertical-text transform-top-left position-absolute text-nowrap"
                                 style={{marginLeft: '-5px'}}>
                                <span className="text-nowrap" style={{marginLeft: '-60px'}}>Merge &rarr;</span>
                            </div>
                        </td>
                        <td colSpan={2}>
                            {isEmpty(fixtureData.over100Checkouts || []) && any(getRecordsToMerge('away', 'over100Checkouts')) ? (<div datatype="away-hichecks">
                                <h6>
                                    <button className="btn btn-sm btn-success margin-left"
                                            onClick={async () => await mergeRecords('away', 'over100Checkouts')}>Merge
                                    </button>
                                </h6>
                                <ol className="d-inline-block">
                                    {getRecordsToMerge('away', 'over100Checkouts').map(rec => (
                                        <li key={rec.id}>{rec.name} ({rec.score})</li>))}
                                </ol>
                            </div>) : null}
                        </td>
                    </tr>
                </>) : null}
        </>);
    } catch (e) {
        /* istanbul ignore next */
        onError(e);
    }
}