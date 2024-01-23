import {MultiPlayerSelection} from "./MultiPlayerSelection";
import React from "react";
import {any, distinct, sortBy} from "../../../helpers/collections";
import {add180, addHiCheck, remove180, removeHiCheck} from "../../common/Accolades";
import {useApp} from "../../../AppContainer";
import {useLeagueFixture} from "./LeagueFixtureContainer";
import {IGameDto} from "../../../interfaces/serverSide/Game/IGameDto";
import {IGamePlayerDto} from "../../../interfaces/serverSide/Game/IGamePlayerDto";
import {IGameMatchDto} from "../../../interfaces/serverSide/Game/IGameMatchDto";
import {ISelectablePlayer} from "../../division_players/PlayerSelection";

export interface IHiCheckAnd180sProps {
    access: string;
    saving: boolean;
    fixtureData: IGameDto;
    setFixtureData: (newData: IGameDto) => Promise<any>;
}

export function HiCheckAnd180s({access, saving, fixtureData, setFixtureData}: IHiCheckAnd180sProps) {
    const {onError} = useApp();
    const {division, season} = useLeagueFixture();

    function getApplicablePlayers(): ISelectablePlayer[] {
        const players: IGamePlayerDto[] = fixtureData.matches.flatMap((match: IGameMatchDto) => {
            const matchPlayers: IGamePlayerDto[] = [];

            (match.homePlayers || []).forEach((player: IGamePlayerDto) => {
                matchPlayers.push(player);
            });

            (match.awayPlayers || []).forEach((player: IGamePlayerDto) => {
                matchPlayers.push(player);
            });

            return matchPlayers;
        });

        return distinct(players, 'id').sort(sortBy('name'));
    }

    try {
        const applicablePlayers: ISelectablePlayer[] = getApplicablePlayers();

        if (!any(applicablePlayers)) {
            return (<tr>
                <td colSpan={5} className="text-center">
                    Select some player/s to add 180s and hi-checks
                </td>
            </tr>)
        }

        return (<tr>
            <td colSpan={2} className="text-end">
                180s<br/>
                <MultiPlayerSelection
                    disabled={access === 'readonly'}
                    readOnly={saving || (fixtureData.resultsPublished && access !== 'admin')}
                    allPlayers={applicablePlayers}
                    players={fixtureData.oneEighties || []}
                    onRemovePlayer={remove180(fixtureData, setFixtureData)}
                    onAddPlayer={add180(fixtureData, setFixtureData)}
                    division={division}
                    season={season}/>
            </td>
            <td className="width-1 p-0"></td>
            <td colSpan={2}>
                100+ c/o<br/>
                <MultiPlayerSelection
                    disabled={access === 'readonly'}
                    readOnly={saving || (fixtureData.resultsPublished && access !== 'admin')}
                    allPlayers={applicablePlayers}
                    players={fixtureData.over100Checkouts || []}
                    onRemovePlayer={removeHiCheck(fixtureData, setFixtureData)}
                    onAddPlayer={addHiCheck(fixtureData, setFixtureData)}
                    showNotes={true}
                    division={division}
                    season={season}
                    dropdownClassName="hi-check-player-dropdown"/>
            </td>
        </tr>);
    } catch (e) {
        /* istanbul ignore next */
        onError(e);
    }
}