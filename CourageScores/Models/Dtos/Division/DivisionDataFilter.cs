namespace CourageScores.Models.Dtos.Division;

public class DivisionDataFilter : IEquatable<DivisionDataFilter>
{
    // ReSharper disable MemberCanBePrivate.Global
    // ReSharper disable UnusedAutoPropertyAccessor.Global
    public DateTime? Date { get; set; }
    public Guid? DivisionId { get; set; }
    public Guid? SeasonId { get; set; }
    public Guid? TeamId { get; set; }
    // ReSharper restore UnusedAutoPropertyAccessor.Global
    // ReSharper restore MemberCanBePrivate.Global

    public bool IncludeGame(Cosmos.Game.Game game)
    {
        return (Date == null || game.Date == Date.Value)
            && (TeamId == null || game.Home.Id == TeamId.Value || game.Away.Id == TeamId);
    }

    public bool IncludeTournament(Cosmos.Game.TournamentGame game)
    {
        return (Date == null || game.Date == Date.Value)
            && (TeamId == null || game.Sides.Any(s => s.TeamId != null && s.TeamId == TeamId));
    }

    public bool Equals(DivisionDataFilter? other)
    {
        if (ReferenceEquals(null, other)) return false;
        if (ReferenceEquals(this, other)) return true;
        return Nullable.Equals(Date, other.Date)
               && Nullable.Equals(DivisionId, other.DivisionId)
               && Nullable.Equals(SeasonId, other.SeasonId)
               && Nullable.Equals(TeamId, other.TeamId);
    }

    public override bool Equals(object? obj)
    {
        if (ReferenceEquals(null, obj)) return false;
        if (ReferenceEquals(this, obj)) return true;
        if (obj.GetType() != this.GetType()) return false;
        return Equals((DivisionDataFilter) obj);
    }

    public override int GetHashCode()
    {
        // ReSharper disable NonReadonlyMemberInGetHashCode
        return HashCode.Combine(Date, DivisionId, SeasonId, TeamId);
        // ReSharper restore NonReadonlyMemberInGetHashCode
    }
}