using System.Diagnostics.CodeAnalysis;
using CourageScores.Formatters;
using Newtonsoft.Json;

namespace CourageScores.Models.Dtos.Division;

[ExcludeFromCodeCoverage]
public class DivisionFixtureDto : ICalendarEventProvider
{
    public Guid Id { get; set; }
    public int? HomeScore { get; set; }
    public DivisionFixtureTeamDto HomeTeam { get; set; } = null!;
    public int? AwayScore { get; set; }
    public DivisionFixtureTeamDto? AwayTeam { get; set; }
    public bool Proposal { get; set; }
    public bool Postponed { get; set; }
    public bool IsKnockout { get; set; }
    public bool AccoladesCount { get; set; }
    public List<OtherDivisionFixtureDto> FixturesUsingAddress { get; set; } = new();
    public DivisionDto? HomeDivision { get; set; }
    public DivisionDto? AwayDivision { get; set; }

    [JsonIgnore]
    public DateTime? FromTime { get; init; }
    [JsonIgnore]
    public DateTime? ToTime { get; init; }
    [JsonIgnore]
    public DateTime? Updated { get; init; }
    [JsonIgnore]
    public Uri? Url { get; init; }

    public Task<CalendarEvent?> GetEvent(CancellationToken token)
    {
        if (AwayTeam == null || FromTime == null || ToTime == null || Updated == null)
        {
            return Task.FromResult<CalendarEvent?>(null);
        }

        var hasScores = HomeScore != null && AwayScore != null;
        return Task.FromResult<CalendarEvent?>(new CalendarEvent
        {
            Id = Id,
            Title = hasScores
                ? $"🎯 {HomeTeam.Name} {HomeScore} - {AwayScore} {AwayTeam!.Name}"
                : $"🎯 {HomeTeam.Name} v {AwayTeam!.Name}",
            Location = HomeTeam.Address,
            Confirmed = !Proposal,
            FromInclusive = FromTime.Value,
            ToExclusive = ToTime.Value,
            LastUpdated = Updated.Value,
            Version = !Proposal && !Postponed && hasScores ? 2 : 1,
            Url = Url,
            Categories = CalendarEventCategories().ToList(),
        });
    }

    private IEnumerable<string> CalendarEventCategories()
    {
        if (!string.IsNullOrEmpty(HomeDivision?.Name))
        {
            yield return HomeDivision.Name;
        }
    }
}
