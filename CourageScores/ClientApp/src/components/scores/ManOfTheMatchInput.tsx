import {
    ISelectablePlayer,
    PlayerSelection,
} from '../common/PlayerSelection.tsx';
import { distinct, sortBy } from '../../helpers/collections.ts';
import { useApp } from '../common/AppContainer.tsx';
import { GameDto } from '../../interfaces/models/dtos/Game/GameDto.ts';
import { GameMatchDto } from '../../interfaces/models/dtos/Game/GameMatchDto.ts';
import { GamePlayerDto } from '../../interfaces/models/dtos/Game/GamePlayerDto.ts';
import { UntypedPromise } from '../../interfaces/UntypedPromise.ts';

export interface IManOfTheMatchInputProps {
    fixtureData: GameDto;
    access: string;
    saving: boolean;
    setFixtureData(newData: GameDto): UntypedPromise;
    disabled?: boolean;
}

export function ManOfTheMatchInput({
    fixtureData,
    access,
    saving,
    setFixtureData,
    disabled,
}: IManOfTheMatchInputProps) {
    const { account, onError } = useApp();

    async function manOfTheMatchChanged(
        player: GamePlayerDto,
        team: 'home' | 'away',
    ) {
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

        const players: ISelectablePlayer[] = fixtureData.matches!.flatMap(
            (match: GameMatchDto) => {
                return match[property] || ([] as ISelectablePlayer[]);
            },
        );

        return distinct(players, 'id').sort(sortBy('name'));
    }

    if (!account) {
        // man of the match cannot be displayed when logged out
        return null;
    }

    try {
        return (
            <tr>
                <td colSpan={2} className="text-end">
                    {account.teamId === fixtureData.home.id ||
                    access === 'admin' ? (
                        <PlayerSelection
                            players={applicablePlayers('away')}
                            disabled={disabled || access === 'readonly'}
                            readOnly={saving}
                            selected={{ id: fixtureData.home.manOfTheMatch! }}
                            onChange={(_, player: ISelectablePlayer) =>
                                manOfTheMatchChanged(player, 'home')
                            }
                        />
                    ) : (
                        <span>n/a</span>
                    )}
                </td>
                <td className="width-1 p-0 middle-vertical-line width-1"></td>
                <td colSpan={2}>
                    {account.teamId === fixtureData.away.id ||
                    access === 'admin' ? (
                        <PlayerSelection
                            players={applicablePlayers('home')}
                            disabled={disabled || access === 'readonly'}
                            readOnly={saving}
                            selected={{ id: fixtureData.away.manOfTheMatch! }}
                            onChange={(_, player: ISelectablePlayer) =>
                                manOfTheMatchChanged(player, 'away')
                            }
                        />
                    ) : (
                        <span>n/a</span>
                    )}
                </td>
            </tr>
        );
    } catch (e) {
        /* istanbul ignore next */
        onError(e);
    }
}
