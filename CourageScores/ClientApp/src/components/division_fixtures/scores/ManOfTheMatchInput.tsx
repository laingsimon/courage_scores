import {ISelectablePlayer, PlayerSelection} from "../../division_players/PlayerSelection";
import React from "react";
import {distinct, sortBy} from "../../../helpers/collections";
import {useApp} from "../../../AppContainer";
import {IGameDto} from "../../../interfaces/models/dtos/Game/IGameDto";
import {IGameMatchDto} from "../../../interfaces/models/dtos/Game/IGameMatchDto";
import {IGamePlayerDto} from "../../../interfaces/models/dtos/Game/IGamePlayerDto";

export interface IManOfTheMatchInputProps {
    fixtureData: IGameDto;
    access: string;
    saving: boolean;
    setFixtureData: (newData: IGameDto) => Promise<any>;
    disabled?: boolean;
}

export function ManOfTheMatchInput({fixtureData, access, saving, setFixtureData, disabled}: IManOfTheMatchInputProps) {
    const {account, onError} = useApp();

    async function manOfTheMatchChanged(player: IGamePlayerDto, team: 'home' | 'away') {
        try {
            const newFixtureData: IGameDto = Object.assign({}, fixtureData);
            newFixtureData[team].manOfTheMatch = player ? player.id : undefined;

            await setFixtureData(newFixtureData);
        } catch (e) {
            /* istanbul ignore next */
            onError(e);
        }
    }

    function applicablePlayers(side: string): ISelectablePlayer[] {
        const property: string = side + 'Players';

        const players: ISelectablePlayer[] = fixtureData.matches.flatMap((match: IGameMatchDto) => {
            const matchPlayers: ISelectablePlayer[] = [];

            (match[property] || []).forEach((player: IGamePlayerDto) => {
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