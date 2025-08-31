using TypeScriptMapper;

namespace CourageScores.Formatters;

[ExcludeFromTypeScript]
public interface ICalendarProvider
{
    Task<Calendar> GetCalendar(CancellationToken token);
}
