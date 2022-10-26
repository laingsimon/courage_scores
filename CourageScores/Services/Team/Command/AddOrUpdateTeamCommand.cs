using CourageScores.Models.Dtos.Team;

namespace CourageScores.Services.Team.Command;

public class AddOrUpdateTeamCommand : AddOrUpdateCommand<Models.Cosmos.Team.Team, EditTeamDto>
{
    protected override void ApplyUpdates(Models.Cosmos.Team.Team team, EditTeamDto update)
    {
        team.Name = update.Name;
        team.Address = update.Address;
        team.DivisionId = update.DivisionId;
    }
}