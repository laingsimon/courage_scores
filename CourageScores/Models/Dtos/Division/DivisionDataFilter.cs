using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Dtos.Season;
using CosmosGame = CourageScores.Models.Cosmos.Game.Game;

namespace CourageScores.Models.Dtos.Division;

public record DivisionDataFilter(
    DateTime? Date = null,
    Guid[]? DivisionId = null,
    Guid? SeasonId = null,
    Guid? TeamId = null,
    bool ExcludeProposals = false,
    bool IgnoreDates = false) : DivisionDataFilterWithoutDivisionId(Date, SeasonId, TeamId, ExcludeProposals, IgnoreDates)
{
    public bool AnyDivision()
    {
        return DivisionId == null || !DivisionId.Any();
    }

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
        return Date == null || note.Date == Date.Value;
    }

    public bool IncludeTeam(Guid teamId)
    {
        return TeamId == null || teamId == TeamId.Value;
    }

    public virtual bool Equals(DivisionDataFilter? other)
    {
        return GetEquatableFilter().Equals(other?.GetEquatableFilter()) &&
               (DivisionId ?? []).SequenceEqual(other.DivisionId ?? []);
    }

    public override int GetHashCode()
    {
        return HashCode.Combine(GetEquatableFilter(), DivisionId?.GetHashCode());
    }

    private DivisionDataFilterWithoutDivisionId GetEquatableFilter()
    {
        return new DivisionDataFilterWithoutDivisionId(Date, SeasonId, TeamId, ExcludeProposals, IgnoreDates);
    }
}

public record DivisionDataFilterWithoutDivisionId(
    DateTime? Date = null,
    Guid? SeasonId = null,
    Guid? TeamId = null,
    bool ExcludeProposals = false,
    bool IgnoreDates = false);
