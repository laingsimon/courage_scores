using CourageScores.Models.Dtos.Team;

namespace CourageScores.Services.Identity;

public interface IAccessService
{
    Task<bool> CanEditTeam(TeamDto team);
    Task<bool> CanDeleteTeam(Models.Cosmos.Team.Team team);
}