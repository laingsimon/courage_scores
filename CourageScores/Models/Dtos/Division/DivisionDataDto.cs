using System.Diagnostics.CodeAnalysis;
using CourageScores.Formatters;
using CourageScores.Models.Dtos.Season;
using CourageScores.Services;

namespace CourageScores.Models.Dtos.Division;

[ExcludeFromCodeCoverage]
public class DivisionDataDto : ICalendarProvider
{
    public Guid Id { get; set; }
    public string Name { get; set; } = null!;
    public DateTime? Updated { get; set; }
    public bool Superleague { get; set; }
    public List<DataErrorDto> DataErrors { get; set; } = new();
    public List<DivisionTeamDto> Teams { get; set; } = new();
    public List<DivisionFixtureDateDto> Fixtures { get; set; } = new();
    public List<DivisionPlayerDto> Players { get; set; } = new();
    public SeasonDto? Season { get; set; }

    public async Task<Calendar> GetCalendar(CancellationToken token)
    {
        return new Calendar
        {
            Events = await Fixtures.SelectManyAsync(fd => fd.GetEvents(token)).ToList(),
            Name = "Courage League",
            Description = "Courage League fixtures and events",
            RefreshInterval = TimeSpan.FromDays(1),
        };
    }
}
