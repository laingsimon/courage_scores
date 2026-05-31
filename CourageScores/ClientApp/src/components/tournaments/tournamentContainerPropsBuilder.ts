/* istanbul ignore file */

import { ITournamentContainerProps } from './TournamentContainer.tsx';
import { TournamentGameDto } from '../../interfaces/models/dtos/Game/TournamentGameDto.ts';
import { DivisionDto } from '../../interfaces/models/dtos/DivisionDto.ts';
import { GameMatchOptionDto } from '../../interfaces/models/dtos/Game/GameMatchOptionDto.ts';
import { noop } from '../../helpers/tests.tsx';
import { TeamPlayerDto } from '../../interfaces/models/dtos/Team/TeamPlayerDto.ts';
import { ITournamentPlayerMap } from './Tournament.ts';
import { tournamentBuilder } from '../../helpers/builders/tournaments.ts';
import { UntypedPromise } from '../../interfaces/UntypedPromise.ts';
import { TournamentMatchDto } from '../../interfaces/models/dtos/Game/TournamentMatchDto.ts';

export class tournamentContainerPropsBuilder {
    private readonly props: ITournamentContainerProps;

    constructor(initProps?: Partial<ITournamentContainerProps>) {
        this.props = Object.assign(
            {
                setDraggingSide: noop,
                saveTournament: noop,
                setEditTournament: noop,
                setTournamentData: noop,
                setWarnBeforeEditDialogClose: noop,
                newMatch: {
                    id: '',
                },
                setNewMatch: noop,
                tournamentData: tournamentBuilder().build(),
                playerIdToTeamMap: {},
                alreadyPlaying: {},
                setSuperleagueMasterDrawOnly: noop,
            },
            initProps,
        );
    }

    public withTournament(
        tournamentData: TournamentGameDto,
    ): tournamentContainerPropsBuilder {
        return new tournamentContainerPropsBuilder(
            Object.assign({}, this.props, {
                tournamentData,
            }),
        );
    }

    public withDivision(
        division: DivisionDto,
    ): tournamentContainerPropsBuilder {
        return new tournamentContainerPropsBuilder(
            Object.assign({}, this.props, {
                division,
            }),
        );
    }

    public withMatchOptionDefaults(
        defaults: GameMatchOptionDto,
    ): tournamentContainerPropsBuilder {
        return new tournamentContainerPropsBuilder(
            Object.assign({}, this.props, {
                matchOptionDefaults: defaults,
            }),
        );
    }

    public withAllPlayers(
        allPlayers: TeamPlayerDto[],
    ): tournamentContainerPropsBuilder {
        return new tournamentContainerPropsBuilder(
            Object.assign({}, this.props, {
                allPlayers,
            }),
        );
    }

    public withAlreadyPlaying(
        alreadyPlaying: ITournamentPlayerMap,
    ): tournamentContainerPropsBuilder {
        return new tournamentContainerPropsBuilder(
            Object.assign({}, this.props, {
                alreadyPlaying,
            }),
        );
    }

    public withSetNewMatch(
        setNewMatch: (match: TournamentMatchDto) => UntypedPromise,
    ): tournamentContainerPropsBuilder {
        return new tournamentContainerPropsBuilder(
            Object.assign({}, this.props, {
                setNewMatch,
            }),
        );
    }

    public withNewMatch(
        newMatch: TournamentMatchDto,
    ): tournamentContainerPropsBuilder {
        return new tournamentContainerPropsBuilder(
            Object.assign({}, this.props, {
                newMatch,
            }),
        );
    }

    public build(): ITournamentContainerProps {
        return this.props;
    }
}
