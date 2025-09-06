namespace CourageScores.Formatters;

public interface ICalendarWriter
{
    Task WriteToStream(Calendar calendar, TextWriter textWriter, CancellationToken token);
}