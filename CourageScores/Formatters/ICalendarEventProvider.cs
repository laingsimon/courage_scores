using TypeScriptMapper;

namespace CourageScores.Formatters;

[ExcludeFromTypeScript]
public interface ICalendarEventProvider
{
    Task<CalendarEvent?> GetEvent(CancellationToken token);
}
