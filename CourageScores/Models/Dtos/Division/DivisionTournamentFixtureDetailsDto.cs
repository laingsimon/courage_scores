using System.Diagnostics.CodeAnalysis;
using CourageScores.Formatters;
using CourageScores.Models.Dtos.Game;
using Newtonsoft.Json;

namespace CourageScores.Models.Dtos.Division;

[ExcludeFromCodeCoverage]
public class DivisionTournamentFixtureDetailsDto : ICalendarEventProvider
{
    public Guid Id { get; set; }
    public string Address { get; set; } = null!;
    public string? Notes { get; set; }
    public DateTime Date { get; set; }
    public Guid SeasonId { get; set; }
    public string? Type { get; set; }
    public TournamentSideDto? WinningSide { get; set; }
    public bool Proposed { get; set; }
    public List<Guid> Players { get; set; } = new();
    public List<TournamentSideDto> Sides { get; set; } = new();
    public bool SingleRound { get; set; }
    public List<TournamentMatchDto> FirstRoundMatches { get; set; } = new();
    public string? Opponent { get; set; }

    [JsonIgnore]
    public DateTime? Updated { get; init; }
    [JsonIgnore]
    public string? Host { get; init; }

    public Task<CalendarEvent?> GetEvent(CancellationToken cancellationToken)
    {
        if (Updated == null)
        {
            return Task.FromResult<CalendarEvent?>(null);
        }

        var localDate = DateTime.SpecifyKind(Date, DateTimeKind.Local);
        return Task.FromResult<CalendarEvent?>(new CalendarEvent
        {
            Id = Id,
            Title = CalendarEventTitle(),
            Description = CalendarDescription(),
            Categories = CalendarEventCategories().ToList(),
            FromInclusive = localDate,
            ToExclusive = localDate.AddDays(1),
            LastUpdated = Updated.Value,
            Location = Address,
            Confirmed = !Proposed,
            Version = 1,
        });
    }

    private string CalendarDescription()
    {
        var sideNames = string.Join(", ", Sides.Select(s => s.Name));
        if (SingleRound)
        {
            // only return sides for superleague tournaments
            return sideNames;
        }

        return string.Join("\n", [ Type, sideNames, Notes ]).Trim();
    }

    private string CalendarEventTitle()
    {
        if (SingleRound && !string.IsNullOrEmpty(Host) && !string.IsNullOrEmpty(Opponent))
        {
            return $"🎯 {Host} v {Opponent}";
        }

        return $"🎯 {Type}";
    }

    private IEnumerable<string> CalendarEventCategories()
    {
        if (SingleRound)
        {
            yield return "Superleague";
        }

        if (!string.IsNullOrEmpty(Type))
        {
            yield return Type;
        }
    }
}
