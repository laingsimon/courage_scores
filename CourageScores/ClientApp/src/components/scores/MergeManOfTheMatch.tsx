import {useApp} from "../common/AppContainer";
import {GameDto} from "../../interfaces/models/dtos/Game/GameDto";
import {TeamPlayerDto} from "../../interfaces/models/dtos/Team/TeamPlayerDto";
import {UntypedPromise} from "../../interfaces/UntypedPromise";

export interface IMergeManOfTheMatchProps {
    data: GameDto;
    setData(newData: GameDto): UntypedPromise;
    allPlayers: TeamPlayerDto[];
}

export function MergeManOfTheMatch({data, setData, allPlayers}: IMergeManOfTheMatchProps) {
    const {onError} = useApp();

    async function setManOfMatch(team: 'home' | 'away', id: string) {
        try {
            const newData: GameDto = Object.assign({}, data);
            newData[team].manOfTheMatch = id;

            await setData(newData);
        } catch (e) {
            /* istanbul ignore next */
            onError(e);
        }
    }

    function getName(playerId: string): string {
        const player: TeamPlayerDto = allPlayers.filter(p => p.id === playerId)[0];
        return player.name;
    }

    return (<tr>
        {data.home.manOfTheMatch ? (<td colSpan={2}>Merged</td>) : (<td colSpan={2} className="text-end">
            {data.homeSubmission && data.homeSubmission.home.manOfTheMatch
                ? (<button className="btn btn-success btn-sm" onClick={async () => await setManOfMatch('home', data.homeSubmission!.home.manOfTheMatch!)}>
                    Use {getName(data.homeSubmission.home.manOfTheMatch)}
                </button>)
                : (<button className="btn btn-secondary btn-sm" disabled={true}>Nothing to merge</button>)}
        </td>)}
        <td className="width-1 p-0 middle-vertical-line width-1"></td>
        {data.away.manOfTheMatch ? (<td colSpan={2}>Merged</td>) : (<td colSpan={2}>
            {data.awaySubmission && data.awaySubmission.away.manOfTheMatch
                ? (<button className="btn btn-success btn-sm" onClick={async () => await setManOfMatch('away', data.awaySubmission!.away.manOfTheMatch!)}>
                    Use {getName(data.awaySubmission.away.manOfTheMatch)}
                </button>)
                : (<button className="btn btn-secondary btn-sm" disabled={true}>Nothing to merge</button>)}
        </td>)}
    </tr>);
}