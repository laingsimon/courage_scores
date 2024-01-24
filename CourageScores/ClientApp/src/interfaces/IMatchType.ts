import {ITeamPlayerDto} from "./serverSide/Team/ITeamPlayerDto";
import {IGameMatchDto} from "./serverSide/Game/IGameMatchDto";
import {IGameMatchOptionDto} from "./serverSide/Game/IGameMatchOptionDto";
import {ICreatePlayerFor} from "../components/division_fixtures/scores/Score";

export interface IMatchType {
    matchOptions: IGameMatchOptionDto;
    otherMatches: IGameMatchDto[];
    setCreatePlayerFor: (index: ICreatePlayerFor) => Promise<any>;
    homePlayers: ITeamPlayerDto[];
    awayPlayers: ITeamPlayerDto[];
}