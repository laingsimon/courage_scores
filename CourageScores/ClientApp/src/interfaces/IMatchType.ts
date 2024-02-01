import {TeamPlayerDto} from "./models/dtos/Team/TeamPlayerDto";
import {GameMatchDto} from "./models/dtos/Game/GameMatchDto";
import {GameMatchOptionDto} from "./models/dtos/Game/GameMatchOptionDto";
import {ICreatePlayerFor} from "../components/division_fixtures/scores/Score";

export interface IMatchType {
    matchOptions: GameMatchOptionDto;
    otherMatches: GameMatchDto[];
    setCreatePlayerFor: (index: ICreatePlayerFor) => Promise<any>;
    homePlayers: TeamPlayerDto[];
    awayPlayers: TeamPlayerDto[];
}