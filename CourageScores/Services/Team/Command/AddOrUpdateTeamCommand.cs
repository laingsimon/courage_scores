using CourageScores.Models.Dtos.Team;

namespace CourageScores.Services.Team.Command;

public class AddOrUpdateTeamCommand : IUpdateCommand<Models.Cosmos.Team.Team, Models.Cosmos.Team.Team>
{
    private TeamDto _teamData;

    public Task<CommandOutcome<Models.Cosmos.Team.Team>> ApplyUpdate(Models.Cosmos.Team.Team item, CancellationToken token)
    {
        throw new NotImplementedException("Add or update the team details");
    }

    public AddOrUpdateTeamCommand ForTeam(TeamDto teamData)
    {
        _teamData = teamData;
        return this;
    }
}