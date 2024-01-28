import {ITournamentPlayerDto} from './ITournamentPlayerDto'

// see CourageScores.Models.Dtos.Game.TournamentSideDto
export interface ITournamentSideDto {
    name?: string;
    teamId?: string;
    players?: ITournamentPlayerDto[];
    noShow?: boolean;
    created?: string;
    author?: string;
    updated?: string;
    editor?: string;
    deleted?: string;
    remover?: string;
    id: string;
}
