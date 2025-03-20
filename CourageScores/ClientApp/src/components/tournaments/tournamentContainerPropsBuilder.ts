/* istanbul ignore file */

import {ITournamentContainerProps} from "./TournamentContainer";
import {TournamentGameDto} from "../../interfaces/models/dtos/Game/TournamentGameDto";
import {DivisionDto} from "../../interfaces/models/dtos/DivisionDto";
import {GameMatchOptionDto} from "../../interfaces/models/dtos/Game/GameMatchOptionDto";
import {noop} from "../../helpers/tests";
import {TeamPlayerDto} from "../../interfaces/models/dtos/Team/TeamPlayerDto";
import {ITournamentPlayerMap} from "./Tournament";
import {tournamentBuilder} from "../../helpers/builders/tournaments";
import {UntypedPromise} from "../../interfaces/UntypedPromise";
import {TournamentMatchDto} from "../../interfaces/models/dtos/Game/TournamentMatchDto";

export class tournamentContainerPropsBuilder
{
    private readonly props: ITournamentContainerProps;

    constructor(initProps?: Partial<ITournamentContainerProps>) {
        this.props = Object.assign({
            preventScroll: false,
            setPreventScroll: noop,
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
        }, initProps);
    }

    public withTournament(tournamentData: TournamentGameDto): tournamentContainerPropsBuilder {
        return new tournamentContainerPropsBuilder(Object.assign({}, this.props, {
            tournamentData
        }));
    }

    public withDivision(division: DivisionDto): tournamentContainerPropsBuilder {
        return new tournamentContainerPropsBuilder(Object.assign({}, this.props, {
            division
        }));
    }

    public withMatchOptionDefaults(defaults: GameMatchOptionDto): tournamentContainerPropsBuilder {
        return new tournamentContainerPropsBuilder(Object.assign({}, this.props, {
            matchOptionDefaults: defaults,
        }));
    }

    public withAllPlayers(allPlayers: TeamPlayerDto[]): tournamentContainerPropsBuilder {
        return new tournamentContainerPropsBuilder(Object.assign({}, this.props, {
            allPlayers,
        }));
    }

    public withAlreadyPlaying(alreadyPlaying: ITournamentPlayerMap): tournamentContainerPropsBuilder {
        return new tournamentContainerPropsBuilder(Object.assign({}, this.props, {
            alreadyPlaying,
        }));
    }

    public withSetNewMatch(setNewMatch: (match: TournamentMatchDto) => UntypedPromise): tournamentContainerPropsBuilder {
        return new tournamentContainerPropsBuilder(Object.assign({}, this.props, {
            setNewMatch,
        }));
    }

    public withNewMatch(newMatch: TournamentMatchDto): tournamentContainerPropsBuilder {
        return new tournamentContainerPropsBuilder(Object.assign({}, this.props, {
            newMatch,
        }));
    }

    public build(): ITournamentContainerProps {
        return this.props;
    }
}