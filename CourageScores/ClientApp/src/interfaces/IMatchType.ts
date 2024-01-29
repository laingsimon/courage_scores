import {ITeamPlayerDto} from "./dtos/Team/ITeamPlayerDto";
import {IGameMatchDto} from "./dtos/Game/IGameMatchDto";
import {IGameMatchOptionDto} from "./dtos/Game/IGameMatchOptionDto";
import {ICreatePlayerFor} from "../components/division_fixtures/scores/Score";

export interface IMatchType {
    matchOptions: IGameMatchOptionDto;
    otherMatches: IGameMatchDto[];
    setCreatePlayerFor: (index: ICreatePlayerFor) => Promise<any>;
    homePlayers: ITeamPlayerDto[];
    awayPlayers: ITeamPlayerDto[];
}