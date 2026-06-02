import { TournamentPlayerDto } from '../../../interfaces/models/dtos/Game/TournamentPlayerDto.ts';
import { TournamentSideDto } from '../../../interfaces/models/dtos/Game/TournamentSideDto.ts';
import { TournamentMatchDto } from '../../../interfaces/models/dtos/Game/TournamentMatchDto.ts';
import { IComponent } from '../../../helpers/tests.tsx';
import { tournamentBuilder } from '../../../helpers/builders/tournaments.ts';

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

export function editButton(container: IComponent): IComponent {
    return container.button('✏️');
}

export function alreadyPlaying(type: string, player: TournamentPlayerDto) {
    return {
        '1': {
            [player.id]: tournamentBuilder().type(type).build(),
        },
    };
}
