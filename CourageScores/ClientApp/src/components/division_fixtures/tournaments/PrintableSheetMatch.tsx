import {ILayoutDataForMatch, ILayoutDataForSide} from "../../../helpers/tournaments";

export interface IPrintableSheetMatchProps {
    matchData: ILayoutDataForMatch;
    noOfMatches: number;
}

export function PrintableSheetMatch({ matchData, noOfMatches } : IPrintableSheetMatchProps) {
    function renderSide(side: ILayoutDataForSide, type: string) {
        return <div className="no-wrap pe-3" datatype={type + 'name'}>
            {side.link || (<span>&nbsp;</span>)}
            {side.mnemonic ? <span className="text-secondary-50 opacity-75 small">{side.mnemonic}</span> : null}
        </div>
    }

    return (<div datatype="match" className={`p-0 border-solid border-1 m-1 position-relative ${matchData.bye ? 'opacity-50' : ''}`}>
        {matchData.mnemonic && noOfMatches > 1 && !matchData.hideMnemonic ? (
            <span className="position-absolute right-0 opacity-75">
                                    <span
                                        className="small rounded-circle bg-secondary opacity-75 text-light p-1 position-absolute"
                                        style={{left: -10, top: -10}}>{matchData.mnemonic}</span>
                                </span>) : null}
        {matchData.bye ? (<div className="position-absolute-bottom-right">Bye</div>) : null}
        <div datatype="sideA"
             className={`d-flex flex-row justify-content-between p-2 min-width-150 ${matchData.winner === 'sideA' ? 'bg-winner fw-bold' : ''}`}>
            {renderSide(matchData.sideA, 'sideA')}
            <div datatype="scoreA">{matchData.scoreA || ''}</div>
        </div>
        {matchData.bye ? null : (<div className="text-center dotted-line-through">
                                    <span className="px-3 bg-white position-relative">
                                        vs
                                        {matchData.saygId ? (
                                            <a href={`/live/match/${matchData.saygId}`} target="_blank" rel="noreferrer"
                                               className="margin-left no-underline">👁️</a>) : null}
                                    </span>
        </div>)}
        {matchData.bye
            ? null
            : (<div datatype="sideB"
                    className={`d-flex flex-row justify-content-between p-2 min-width-150 ${matchData.winner === 'sideB' ? 'bg-winner fw-bold' : ''}`}>
                {renderSide(matchData.sideB, 'sideB')}
                <div datatype="scoreB">{matchData.scoreB || ''}</div>
            </div>)}
    </div>);
}