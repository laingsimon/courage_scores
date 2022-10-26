using CourageScores.Models.Dtos.Team;

namespace CourageScores.Services.Team.Command;

public class AddOrUpdateTeamCommand : AddOrUpdateCommand<Models.Cosmos.Team.Team, TeamDto>
{
    protected override void ApplyUpdates(Models.Cosmos.Team.Team team, TeamDto update)
    {
        team.Name = update.Name;
        team.Address = update.Address;
        team.DivisionId = update.DivisionId;
    }
}