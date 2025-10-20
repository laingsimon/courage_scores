using System.Diagnostics.CodeAnalysis;
using CourageScores.Common;
using CourageScores.Formatters;
using CourageScores.Models.Dtos.Season;

namespace CourageScores.Models.Dtos.Division;

[ExcludeFromCodeCoverage]
public class DivisionDataDto : ICalendarProvider
{
    private readonly string? _productName;

    public DivisionDataDto(string? productName)
    {
        _productName = productName;
    }

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
            Name = $"{_productName ?? "Courage Scores"} - {Season?.Name}",
            Description = $"{_productName ?? "Courage Scores"} fixtures and events",
            RefreshInterval = TimeSpan.FromDays(1),
        };
    }
}
