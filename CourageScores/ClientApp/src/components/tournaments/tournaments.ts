import {createTemporaryId} from "../../helpers/projection";
import {sortBy} from "../../helpers/collections";
import {TournamentSideDto} from "../../interfaces/models/dtos/Game/TournamentSideDto";
import {TournamentGameDto} from "../../interfaces/models/dtos/Game/TournamentGameDto";
import {TournamentRoundDto} from "../../interfaces/models/dtos/Game/TournamentRoundDto";
import {TournamentMatchDto} from "../../interfaces/models/dtos/Game/TournamentMatchDto";
import {ISaveSideOptions} from "./EditSide";
import {TournamentPlayerDto} from "../../interfaces/models/dtos/Game/TournamentPlayerDto";

export function sideChanged(tournamentData: TournamentGameDto, newSide: TournamentSideDto, sideIndex: number, _: ISaveSideOptions): TournamentGameDto {
    const newTournamentData: TournamentGameDto = Object.assign({}, tournamentData);
    newSide.name = (newSide.name || '').trim();
    newTournamentData.sides[sideIndex] = newSide;
    updateSideDataInRound(newTournamentData.round, newSide);
    return newTournamentData;
}

export function removeSide(tournamentData: TournamentGameDto, side: TournamentSideDto): TournamentGameDto {
    const newTournamentData: TournamentGameDto = Object.assign({}, tournamentData);
    newTournamentData.sides = tournamentData.sides.filter((s: TournamentSideDto) => s.id !== side.id);
    return newTournamentData;
}

export function addSide(tournamentData: TournamentGameDto, newSide: TournamentSideDto, options: ISaveSideOptions): TournamentGameDto {
    const newTournamentData: TournamentGameDto = Object.assign({}, tournamentData);
    let sidesToAdd: TournamentSideDto[];

    if (options.addAsIndividuals) {
        sidesToAdd = newSide.players.map((player: TournamentPlayerDto): TournamentSideDto => {
            return {
                id: createTemporaryId(),
                name: player.name.trim(),
                players: [ player ],
            };
        });
    } else {
        newSide.name = (newSide.name || '').trim();
        newSide.id = createTemporaryId();
        sidesToAdd = [newSide];
    }

    newTournamentData.sides = newTournamentData.sides.concat(sidesToAdd).sort(sortBy('name'));
    return newTournamentData;
}

function updateSideDataInRound(round: TournamentRoundDto, side: TournamentSideDto) {
    if (!round) {
        return;
    }

    if (round.matches) {
        for (let index = 0; index < round.matches.length; index++) {
            const match: TournamentMatchDto = round.matches[index];
            if (match.sideA && match.sideA.id === side.id) {
                match.sideA = side;
            } else if (match.sideB && match.sideB.id === side.id) {
                match.sideB = side;
            }
        }
    }

    updateSideDataInRound(round.nextRound, side);
}

