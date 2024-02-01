import {ISelectablePlayer, PlayerSelection} from "../../division_players/PlayerSelection";
import {distinct, sortBy} from "../../../helpers/collections";
import {useApp} from "../../../AppContainer";
import {GameDto} from "../../../interfaces/models/dtos/Game/GameDto";
import {GameMatchDto} from "../../../interfaces/models/dtos/Game/GameMatchDto";
import {GamePlayerDto} from "../../../interfaces/models/dtos/Game/GamePlayerDto";

export interface IManOfTheMatchInputProps {
    fixtureData: GameDto;
    access: string;
    saving: boolean;
    setFixtureData: (newData: GameDto) => Promise<any>;
    disabled?: boolean;
}

export function ManOfTheMatchInput({fixtureData, access, saving, setFixtureData, disabled}: IManOfTheMatchInputProps) {
    const {account, onError} = useApp();

    async function manOfTheMatchChanged(player: GamePlayerDto, team: 'home' | 'away') {
        try {
            const newFixtureData: GameDto = Object.assign({}, fixtureData);
            newFixtureData[team].manOfTheMatch = player ? player.id : undefined;

            await setFixtureData(newFixtureData);
        } catch (e) {
            /* istanbul ignore next */
            onError(e);
        }
    }

    function applicablePlayers(side: string): ISelectablePlayer[] {
        const property: string = side + 'Players';

        const players: ISelectablePlayer[] = fixtureData.matches.flatMap((match: GameMatchDto) => {
            const matchPlayers: ISelectablePlayer[] = [];

            (match[property] || []).forEach((player: GamePlayerDto) => {
                matchPlayers.push(player as ISelectablePlayer);
            });

            return matchPlayers;
        });

        return distinct(players, 'id').sort(sortBy('name'));
    }

    if (!account) {
        // man of the match cannot be displayed when logged out
        return null;
    }

    try {
        return (<tr>
            <td colSpan={2} className="text-end">
                {account.teamId === fixtureData.home.id || access === 'admin' ? (<PlayerSelection
                    players={applicablePlayers('away')}
                    disabled={disabled || access === 'readonly'}
                    readOnly={saving}
                    selected={{id: fixtureData.home.manOfTheMatch}}
                    onChange={(_, player: ISelectablePlayer) => manOfTheMatchChanged(player, 'home')}/>) : (<span>n/a</span>)}
            </td>
            <td className="width-1 p-0 middle-vertical-line width-1"></td>
            <td colSpan={2}>
                {account.teamId === fixtureData.away.id || access === 'admin' ? (<PlayerSelection
                    players={applicablePlayers('home')}
                    disabled={disabled || access === 'readonly'}
                    readOnly={saving}
                    selected={{id: fixtureData.away.manOfTheMatch}}
                    onChange={(_, player: ISelectablePlayer) => manOfTheMatchChanged(player, 'away')}/>) : (<span>n/a</span>)}
            </td>
        </tr>);
    } catch (e) {
        /* istanbul ignore next */
        onError(e);
    }
}