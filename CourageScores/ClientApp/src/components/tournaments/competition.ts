import { TournamentRoundDto } from '../../interfaces/models/dtos/Game/TournamentRoundDto.ts';
import { GameMatchOptionDto } from '../../interfaces/models/dtos/Game/GameMatchOptionDto.ts';
import { TournamentSideDto } from '../../interfaces/models/dtos/Game/TournamentSideDto.ts';
import { any } from '../../helpers/collections.ts';
import { PlayedEngine } from './layout/PlayedEngine.ts';
import { UnplayedEngine } from './layout/UnplayedEngine.ts';
import { ILayoutEngine } from './layout/ILayoutEngine.ts';
import { ILayoutDataForRound } from './layout/ILayoutDataForRound.ts';
import { ReactElement } from 'react';

export interface ITournamentLayoutGenerationContext {
    matchOptionDefaults: GameMatchOptionDto;
    getLinkToSide(side: TournamentSideDto): ReactElement;
}

export function getLayoutData(
    round: TournamentRoundDto | undefined,
    sides: TournamentSideDto[],
    context: ITournamentLayoutGenerationContext,
): ILayoutDataForRound[] {
    const unplayedEngine: ILayoutEngine = new UnplayedEngine();
    const engine: ILayoutEngine =
        round && any(round.matches || [])
            ? new PlayedEngine(unplayedEngine)
            : unplayedEngine;

    return engine.calculate({
        sides: sides.filter((s: TournamentSideDto) => !s.noShow),
        context,
        round,
    });
}
