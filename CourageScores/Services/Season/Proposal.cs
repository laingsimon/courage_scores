using CourageScores.Models.Dtos.Team;

namespace CourageScores.Services.Season;

public class Proposal : IEquatable<Proposal>
{
    public TeamDto Home { get; }
    public TeamDto Away { get; }

    public Proposal(TeamDto home, TeamDto away)
    {
        Home = home;
        Away = away;
    }

    public override int GetHashCode()
    {
        return Home.GetHashCode() + Away.GetHashCode();
    }

    public override bool Equals(object? other)
    {
        return Equals(other as Proposal);
    }

    public bool Equals(Proposal? other)
    {
        return other != null
               && other.Home.Id == Home.Id
               && other.Away.Id == Away.Id;
    }

    public override string ToString()
    {
        return $"{Home.Name} vs {Away.Name}";
    }
}