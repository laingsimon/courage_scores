import {ITeamPlayerDto} from "./models/dtos/Team/ITeamPlayerDto";
import {IGameMatchDto} from "./models/dtos/Game/IGameMatchDto";
import {IGameMatchOptionDto} from "./models/dtos/Game/IGameMatchOptionDto";
import {ICreatePlayerFor} from "../components/division_fixtures/scores/Score";

export interface IMatchType {
    matchOptions: IGameMatchOptionDto;
    otherMatches: IGameMatchDto[];
    setCreatePlayerFor: (index: ICreatePlayerFor) => Promise<any>;
    homePlayers: ITeamPlayerDto[];
    awayPlayers: ITeamPlayerDto[];
}