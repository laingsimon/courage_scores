using CourageScores.Models.Dtos.Team;

namespace CourageScores.Services.Command;

public class AddOrUpdateTeamCommand : AddOrUpdateCommand<Models.Cosmos.Team.Team, EditTeamDto>
{
    protected override async Task ApplyUpdates(Models.Cosmos.Team.Team team, EditTeamDto update, CancellationToken token)
    {
        // TODO: find the fixtures in the given season & division (update.SeasonId & update.DivisionId) for the given team (team.Id)
        // TODO: update each fixture home/away name and address
        // TODO: abort if the address becomes the same for both home and away

        team.Name = update.Name;
        team.Address = update.Address;
        team.DivisionId = update.DivisionId;
    }
}
