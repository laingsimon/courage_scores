import React from "react";

export function MergeManOfTheMatch({ data, setData, allPlayers }) {
    function setManOfMatch(team, id) {
        const newData = Object.assign({}, data);
        newData[team].manOfTheMatch = id;

        setData(newData);
    }

    return (<tr>
        {data.home.manOfTheMatch ? (<td colSpan="2">Merged</td>) : (<td colSpan="2">
            {data.homeSubmission && data.homeSubmission.home.manOfTheMatch
                ? (<button className="btn btn-success btn-sm" onClick={() => setManOfMatch('away', data.homeSubmission.home.manOfTheMatch)}>
                    Use {allPlayers.filter(p => p.id === data.homeSubmission.home.manOfTheMatch)[0].name}
                </button>)
                : (<button className="btn btn-secondary btn-sm" disabled={true}>Nothing to merge</button>)}
        </td>)}
        <td className="width-1 p-0"></td>
        {data.away.manOfTheMatch ? (<td colSpan="2">Merged</td>) : (<td colSpan="2">
            {data.awaySubmission && data.awaySubmission.away.manOfTheMatch
                ? (<button className="btn btn-success btn-sm" onClick={() => setManOfMatch('away', data.awaySubmission.away.manOfTheMatch)}>
                    Use {allPlayers.filter(p => p.id === data.awaySubmission.away.manOfTheMatch)[0].name}
                </button>)
                : (<button className="btn btn-secondary btn-sm" disabled={true}>Nothing to merge</button>)}
        </td>)}
    </tr>);
}