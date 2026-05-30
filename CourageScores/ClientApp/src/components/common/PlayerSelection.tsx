import {
    BootstrapDropdown,
    IBootstrapDropdownItem,
} from './BootstrapDropdown.tsx';
import { UntypedPromise } from '../../interfaces/UntypedPromise.ts';

export interface ISelectablePlayer {
    id: string;
    name: string;
}

export interface IPlayerSelectionProps {
    players: ISelectablePlayer[];
    disabled?: boolean;
    selected?: { id: string };
    onChange?(
        element: Element,
        selected: ISelectablePlayer | null,
    ): UntypedPromise;
    except?: string[];
    readOnly?: boolean;
    className?: string;
    placeholder?: string;
}

export function PlayerSelection({
    players,
    disabled,
    selected,
    onChange,
    except,
    readOnly,
    className,
    placeholder,
}: IPlayerSelectionProps) {
    const empty: IBootstrapDropdownItem = {
        value: '',
        text: placeholder ? <span>{placeholder}</span> : <span>&nbsp;</span>,
        className: 'text-warning',
    };

    function findPlayer(playerId?: string): ISelectablePlayer | null {
        if (!playerId) {
            return null;
        }

        return players.filter((p: ISelectablePlayer) => p.id === playerId)[0];
    }

    function playerName(player: ISelectablePlayer) {
        const otherPlayersWithSameName = players
            .filter((p) => p.id !== player.id)
            .filter(
                (p) =>
                    p.name.trim().toLowerCase() ===
                    player.name.trim().toLowerCase(),
            );

        return otherPlayersWithSameName.length === 0
            ? player.name
            : `${player.name} (${player.id.substring(0, 8)})`;
    }

    return (
        <span>
            <BootstrapDropdown
                disabled={disabled}
                readOnly={readOnly}
                className={className}
                value={(selected || {}).id || ''}
                onChange={async (value: string) =>
                    onChange ? await onChange(this, findPlayer(value)) : null
                }
                options={[empty].concat(
                    players
                        .filter(
                            (p: ISelectablePlayer) =>
                                (except || []).indexOf(p.id) === -1,
                        )
                        .map((p: ISelectablePlayer): IBootstrapDropdownItem => {
                            return { value: p.id, text: playerName(p) };
                        }),
                )}
            />
        </span>
    );
}
