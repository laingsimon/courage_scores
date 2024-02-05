import {TeamPlayerDto} from "../../interfaces/models/dtos/Team/TeamPlayerDto";
import {GameMatchDto} from "../../interfaces/models/dtos/Game/GameMatchDto";
import {GameMatchOptionDto} from "../../interfaces/models/dtos/Game/GameMatchOptionDto";
import {ICreatePlayerFor} from "./Score";

export interface IMatchType {
    matchOptions: GameMatchOptionDto;
    otherMatches: GameMatchDto[];
    setCreatePlayerFor: (index: ICreatePlayerFor) => Promise<any>;
    homePlayers: TeamPlayerDto[];
    awayPlayers: TeamPlayerDto[];
}