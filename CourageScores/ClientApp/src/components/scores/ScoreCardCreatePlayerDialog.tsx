import { GameTeamDto } from '../../interfaces/models/dtos/Game/GameTeamDto';
import { TeamDto } from '../../interfaces/models/dtos/Team/TeamDto';
import { TeamPlayerDto } from '../../interfaces/models/dtos/Team/TeamPlayerDto';
import { getTeamSeasons } from '../../helpers/teams.ts';
import { any } from '../../helpers/collections.ts';
import { GameMatchDto } from '../../interfaces/models/dtos/Game/GameMatchDto';
import { GameDto } from '../../interfaces/models/dtos/Game/GameDto';
import { Dialog } from '../common/Dialog.tsx';
import { EditPlayerDetails } from '../division_players/EditPlayerDetails.tsx';
import { propChanged } from '../../helpers/events.ts';
import { UntypedPromise } from '../../interfaces/UntypedPromise.ts';
import { useState } from 'react';
import { useApp } from '../common/AppContainer.tsx';
import { useDependencies } from '../common/IocContainer.tsx';

export interface ICreatePlayerFor {
    side: string;
    matchIndex?: number;
    index: number;
}

interface IEditableMatchPlayer {
    name: string;
    captain?: boolean;
}

interface ScoreCardCreatePlayerDialogProps {
    setTeams: (teams: TeamDto[]) => UntypedPromise;
    createPlayerFor: ICreatePlayerFor;
    setCreatePlayerFor: (player: ICreatePlayerFor | null) => UntypedPromise;
    fixtureData: GameDto;
    setFixtureData: (fixtureData: GameDto) => UntypedPromise;
}

export const ScoreCardCreatePlayerDialog = ({
    setTeams,
    createPlayerFor,
    setCreatePlayerFor,
    fixtureData,
    setFixtureData,
}: ScoreCardCreatePlayerDialogProps) => {
    const { onError } = useApp();
    const { teamApi } = useDependencies();

    const [newPlayerDetails, setNewPlayerDetails] =
        useState<IEditableMatchPlayer>({ name: '' });

    const team: GameTeamDto =
        createPlayerFor!.side === 'home'
            ? fixtureData!.home
            : fixtureData!.away;

    async function playerCreated(
        updatedTeamDetails: TeamDto,
        playersCreated: TeamPlayerDto[],
    ) {
        await setTeams(await teamApi.getAllWithSeasonsAndPlayers());

        try {
            if (playersCreated.length > 1) {
                // multiple players created
                return;
            }

            const updatedTeamSeason = getTeamSeasons(
                updatedTeamDetails,
                fixtureData!.seasonId,
            )[0];
            if (!updatedTeamSeason) {
                onError('Could not find updated teamSeason');
                return;
            }

            const firstNewPlayer = newPlayerDetails.name.split('\n')[0]?.trim();
            const newPlayers = updatedTeamSeason.players!.filter(
                (p) =>
                    p.name.trim().toLowerCase() ===
                    firstNewPlayer.toLowerCase(),
            );
            if (!any(newPlayers)) {
                onError(
                    `Could not find new player in updated season, looking for player with name: "${firstNewPlayer}"`,
                );
                return;
            }

            const newPlayer: TeamPlayerDto = newPlayers[0];
            const match: GameMatchDto =
                fixtureData!.matches![createPlayerFor!.matchIndex!];
            const newMatch: GameMatchDto = Object.assign({}, match);
            newMatch[createPlayerFor!.side + 'Players'][
                createPlayerFor!.index
            ] = {
                id: newPlayer.id,
                name: newPlayer.name,
            };

            const newFixtureData: GameDto = Object.assign({}, fixtureData);
            fixtureData!.matches![createPlayerFor!.matchIndex!] = newMatch;
            await setFixtureData(newFixtureData);
        } catch (e) {
            /* istanbul ignore next */
            onError(e);
        } finally {
            await setCreatePlayerFor(null);
            setNewPlayerDetails({ name: '', captain: false });
        }
    }

    return (
        <Dialog title={`Create ${createPlayerFor!.side} player...`}>
            <EditPlayerDetails
                player={newPlayerDetails}
                seasonId={fixtureData!.seasonId!}
                gameId={fixtureData!.id}
                team={team}
                divisionId={fixtureData!.divisionId}
                onChange={propChanged(newPlayerDetails, setNewPlayerDetails)}
                onCancel={async () => setCreatePlayerFor(null)}
                onSaved={playerCreated}
            />
        </Dialog>
    );
};
