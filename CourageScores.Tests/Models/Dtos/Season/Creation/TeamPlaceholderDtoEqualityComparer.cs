using CourageScores.Models.Dtos.Season.Creation;

namespace CourageScores.Tests.Models.Dtos.Season.Creation;

public class TeamPlaceholderDtoEqualityComparer : IEqualityComparer<TeamPlaceholderDto>
{
    public bool Equals(TeamPlaceholderDto? x, TeamPlaceholderDto? y)
    {
        return x!.Key == y!.Key;
    }

    public int GetHashCode(TeamPlaceholderDto obj)
    {
        return obj.Key.GetHashCode();
    }
}