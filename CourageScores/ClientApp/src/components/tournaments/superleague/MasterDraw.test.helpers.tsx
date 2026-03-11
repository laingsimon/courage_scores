import { TournamentPlayerDto } from '../../../interfaces/models/dtos/Game/TournamentPlayerDto';
import { TournamentSideDto } from '../../../interfaces/models/dtos/Game/TournamentSideDto';
import { TournamentMatchDto } from '../../../interfaces/models/dtos/Game/TournamentMatchDto';
import { findButton } from '../../../helpers/tests';
import { tournamentBuilder } from '../../../helpers/builders/tournaments';

export function equatableSide(
    name: string,
    ...players: TournamentPlayerDto[]
): TournamentSideDto {
    return {
        id: expect.any(String),
        name: name,
        players: players,
    };
}

export function equatableMatch(
    sideA: TournamentSideDto,
    sideB: TournamentSideDto,
): TournamentMatchDto {
    return {
        id: expect.any(String),
        sideA,
        sideB,
    };
}

export function withName(player: TournamentPlayerDto, name: string) {
    return {
        ...player,
        name,
    };
}

export function editButton(container: Element | null) {
    return findButton(container!, '✏️');
}

export function alreadyPlaying(type: string, player: TournamentPlayerDto) {
    return {
        '1': {
            [player.id]: tournamentBuilder().type(type).build(),
        },
    };
}
