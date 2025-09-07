using System.Diagnostics.CodeAnalysis;
using CourageScores.Formatters;

namespace CourageScores.Models.Dtos;

[ExcludeFromCodeCoverage]
public class FixtureDateNoteDto : AuditedDto, ICalendarEventProvider
{
    /// <summary>
    /// The date for which this note applies
    /// </summary>
    public DateTime Date { get; set; }

    /// <summary>
    /// The note to display
    /// </summary>
    public string Note { get; set; } = null!;

    /// <summary>
    /// The season for which this note applies
    /// </summary>
    public Guid SeasonId { get; set; }

    /// <summary>
    /// [Optional] The division for which this note applies
    /// </summary>
    public Guid? DivisionId { get; set; }

    public Task<CalendarEvent?> GetEvent(CancellationToken token)
    {
        if (Updated == null)
        {
            return Task.FromResult<CalendarEvent?>(null);
        }

        var localDate = DateTime.SpecifyKind(Date, DateTimeKind.Local);
        return Task.FromResult<CalendarEvent?>(new CalendarEvent
        {
            Title = $"🏷️ {Note}",
            FromInclusive = localDate,
            ToExclusive = localDate.AddDays(1),
            Id = Id,
            LastUpdated = Updated!.Value,
            Version = 1,
        });
    }
}
