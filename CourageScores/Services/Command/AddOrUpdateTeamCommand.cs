using CourageScores.Models.Dtos.Team;

namespace CourageScores.Services.Command;

public class AddOrUpdateTeamCommand : AddOrUpdateCommand<Models.Cosmos.Team.Team, EditTeamDto>
{
    protected override Task ApplyUpdates(Models.Cosmos.Team.Team team, EditTeamDto update, CancellationToken token)
    {
        team.Name = update.Name;
        team.Address = update.Address;
        team.DivisionId = update.DivisionId;
        return Task.CompletedTask;
    }
}