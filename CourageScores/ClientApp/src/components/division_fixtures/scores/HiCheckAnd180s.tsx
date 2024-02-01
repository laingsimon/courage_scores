import {MultiPlayerSelection} from "./MultiPlayerSelection";
import {any, distinct, sortBy} from "../../../helpers/collections";
import {add180, addHiCheck, remove180, removeHiCheck} from "../../common/Accolades";
import {useApp} from "../../../AppContainer";
import {useLeagueFixture} from "./LeagueFixtureContainer";
import {GameDto} from "../../../interfaces/models/dtos/Game/GameDto";
import {GamePlayerDto} from "../../../interfaces/models/dtos/Game/GamePlayerDto";
import {GameMatchDto} from "../../../interfaces/models/dtos/Game/GameMatchDto";
import {ISelectablePlayer} from "../../division_players/PlayerSelection";

export interface IHiCheckAnd180sProps {
    access: string;
    saving: boolean;
    fixtureData: GameDto;
    setFixtureData: (newData: GameDto) => Promise<any>;
}

export function HiCheckAnd180s({access, saving, fixtureData, setFixtureData}: IHiCheckAnd180sProps) {
    const {onError} = useApp();
    const {division, season} = useLeagueFixture();

    function getApplicablePlayers(): ISelectablePlayer[] {
        const players: GamePlayerDto[] = fixtureData.matches.flatMap((match: GameMatchDto) => {
            const matchPlayers: GamePlayerDto[] = [];

            (match.homePlayers || []).forEach((player: GamePlayerDto) => {
                matchPlayers.push(player);
            });

            (match.awayPlayers || []).forEach((player: GamePlayerDto) => {
                matchPlayers.push(player);
            });

            return matchPlayers;
        });

        return distinct(players, 'id').sort(sortBy('name'));
    }

    try {
        const applicablePlayers: ISelectablePlayer[] = getApplicablePlayers();

        if (!any(applicablePlayers)) {
            return (<tr>
                <td colSpan={5} className="text-center">
                    Select some player/s to add 180s and hi-checks
                </td>
            </tr>)
        }

        return (<tr>
            <td colSpan={2} className="text-end">
                180s<br/>
                <MultiPlayerSelection
                    disabled={access === 'readonly'}
                    readOnly={saving || (fixtureData.resultsPublished && access !== 'admin')}
                    allPlayers={applicablePlayers}
                    players={fixtureData.oneEighties || []}
                    onRemovePlayer={remove180(fixtureData, setFixtureData)}
                    onAddPlayer={add180(fixtureData, setFixtureData)}
                    division={division}
                    season={season}/>
            </td>
            <td className="width-1 p-0"></td>
            <td colSpan={2}>
                100+ c/o<br/>
                <MultiPlayerSelection
                    disabled={access === 'readonly'}
                    readOnly={saving || (fixtureData.resultsPublished && access !== 'admin')}
                    allPlayers={applicablePlayers}
                    players={fixtureData.over100Checkouts || []}
                    onRemovePlayer={removeHiCheck(fixtureData, setFixtureData)}
                    onAddPlayer={addHiCheck(fixtureData, setFixtureData)}
                    showScore={true}
                    division={division}
                    season={season}
                    dropdownClassName="hi-check-player-dropdown"/>
            </td>
        </tr>);
    } catch (e) {
        /* istanbul ignore next */
        onError(e);
    }
}