using System.Diagnostics.CodeAnalysis;
using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Dtos.Season;
using CosmosGame = CourageScores.Models.Cosmos.Game.Game;

namespace CourageScores.Models.Dtos.Division;

public class DivisionDataFilter : IEquatable<DivisionDataFilter>
{
    // ReSharper disable MemberCanBePrivate.Global
    // ReSharper disable UnusedAutoPropertyAccessor.Global
    public DateTime? Date { get; set; }
    public HashSet<Guid> DivisionId { get; set; } = new();
    public Guid? SeasonId { get; set; }
    public Guid? TeamId { get; set; }
    public bool ExcludeProposals { get; set; }
    public bool IgnoreDates { get; set; }
    // ReSharper restore UnusedAutoPropertyAccessor.Global
    // ReSharper restore MemberCanBePrivate.Global

    public bool IncludeGame(CosmosGame game)
    {
        return (Date == null || game.Date == Date.Value)
               && (TeamId == null || game.Home.Id == TeamId.Value || game.Away.Id == TeamId);
    }

    public bool IncludeDate(DateTime eventDate, SeasonDto season)
    {
        return IgnoreDates || (eventDate >= season.StartDate && eventDate <= season.EndDate);
    }

    public bool IncludeTournament(TournamentGame game)
    {
        return (Date == null || game.Date == Date.Value)
               && (TeamId == null || game.Sides.Any(s => s.TeamId != null && s.TeamId == TeamId));
    }

    public bool IncludeNote(FixtureDateNoteDto note)
    {
        return (Date == null || note.Date == Date.Value);
    }

    public bool IncludeTeam(Guid teamId)
    {
        return TeamId == null || teamId == TeamId.Value;
    }

    public bool Equals(DivisionDataFilter? other)
    {
        return other != null
               && Nullable.Equals(Date, other.Date)
               && DivisionId.ToHashSet().SetEquals(other.DivisionId.ToHashSet())
               && Nullable.Equals(SeasonId, other.SeasonId)
               && Nullable.Equals(TeamId, other.TeamId);
    }

    [ExcludeFromCodeCoverage]
    public override bool Equals(object? obj)
    {
        return Equals(obj as DivisionDataFilter);
    }

    public override int GetHashCode()
    {
        // ReSharper disable NonReadonlyMemberInGetHashCode
        return HashCode.Combine(
            Date,
            HashCodeOfArrayContents(DivisionId),
            SeasonId,
            TeamId);
        // ReSharper restore NonReadonlyMemberInGetHashCode
    }

    private static int HashCodeOfArrayContents<T>(IEnumerable<T> array)
    {
        var hashCode = 0;

        foreach (var item in array)
        {
            hashCode ^= item?.GetHashCode() ?? 0;
        }

        return hashCode;
    }
}