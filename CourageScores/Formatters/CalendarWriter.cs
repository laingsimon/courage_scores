namespace CourageScores.Formatters;

public class CalendarWriter : ICalendarWriter
{
    public async Task WriteToStream(Calendar calendar, TextWriter textWriter, CancellationToken token)
    {
        await textWriter.WriteLineAsync("BEGIN:VCALENDAR");
        await textWriter.WriteLineAsync("VERSION:2.0");
        await textWriter.WriteLineAsync($"PRODID:{calendar.Id}");
        await textWriter.WriteLineAsync("CALSCALE:GREGORIAN");
        await textWriter.WriteLineAsync($"METHOD:{EncodeValue(calendar.Method)}");

        if (!string.IsNullOrEmpty(calendar.Name))
        {
            await textWriter.WriteLineAsync($"NAME:{EncodeValue(calendar.Name)}");
            await textWriter.WriteLineAsync($"X-WR-CALNAME:{EncodeValue(calendar.Name)}");
        }

        if (!string.IsNullOrEmpty(calendar.Description))
        {
            await textWriter.WriteLineAsync($"DESCRIPTION:{EncodeValue(calendar.Description)}");
            await textWriter.WriteLineAsync($"X-WR-CALDESC:{EncodeValue(calendar.Description)}");
        }

        if (calendar.RefreshInterval != null)
        {
            await textWriter.WriteLineAsync($"REFRESH-INTERVAL;VALUE=DURATION:{FormatTimeSpanAsInterval(calendar.RefreshInterval.Value)}");
            await textWriter.WriteLineAsync($"X-PUBLISHED-TTL:{FormatTimeSpanAsInterval(calendar.RefreshInterval.Value)}");
        }

        foreach (var calendarEvent in calendar.Events)
        {
            token.ThrowIfCancellationRequested();
            await WriteToStream(calendarEvent, textWriter);
        }

        await textWriter.WriteLineAsync("END:VCALENDAR");
    }

    private static async Task WriteToStream(CalendarEvent calendarEvent, TextWriter textWriter)
    {
        await textWriter.WriteLineAsync("BEGIN:VEVENT");
        await textWriter.WriteLineAsync($"SUMMARY:{EncodeValue(calendarEvent.Title)}");
        await textWriter.WriteLineAsync($"UID:{calendarEvent.Id}");
        await textWriter.WriteLineAsync($"SEQUENCE:{calendarEvent.Version}");
        await textWriter.WriteLineAsync($"STATUS:{(calendarEvent.Confirmed ? "CONFIRMED" : "TENTATIVE")}");
        await textWriter.WriteLineAsync($"TRANSP:{(calendarEvent.Private ? "OPAQUE" : "TRANSPARENT")}");
        await textWriter.WriteLineAsync($"DTSTART:{FormatDateTime(calendarEvent.FromInclusive)}");
        await textWriter.WriteLineAsync($"DTEND:{FormatDateTime(calendarEvent.ToExclusive)}");
        await textWriter.WriteLineAsync($"DTSTAMP:{FormatDateTime(calendarEvent.LastUpdated)}");
        if (calendarEvent.Categories.Count > 0)
        {
            await textWriter.WriteLineAsync($"CATEGORIES:{string.Join(",", calendarEvent.Categories.Select(EncodeValue))}");
        }

        if (calendarEvent.Url != null)
        {
            await textWriter.WriteLineAsync($"URL:{EncodeValue(calendarEvent.Url.ToString())}");
        }

        if (!string.IsNullOrEmpty(calendarEvent.Location))
        {
            await textWriter.WriteLineAsync($"LOCATION:{EncodeValue(calendarEvent.Location)}");
        }

        await WriteNoReminder(textWriter);

        await textWriter.WriteLineAsync("END:VEVENT");
    }

    private static async Task WriteNoReminder(TextWriter textWriter)
    {
        await textWriter.WriteLineAsync("BEGIN:VALARM");
        await textWriter.WriteLineAsync("ACTION:NONE");
        await textWriter.WriteLineAsync("END:VALARM");
    }

    private static string FormatDateTime(DateTime dateTime)
    {
        return dateTime.ToString("yyyyMMddTHHmmss");
    }

    private static string FormatTimeSpanAsInterval(TimeSpan interval)
    {
        return $"P{interval.TotalHours}H";
    }

    private static string EncodeValue(string value)
    {
        // See https://icalendar.org/iCalendar-RFC-5545/3-1-content-lines.html

        var singleLine = value.Trim().Replace("\r", "").Replace("\n", "\\n");
        // split the line into 70char blocks, with a ' ' at the start of any following line
        var lines = new List<string>();
        while (singleLine.Length > 70)
        {
            var line = singleLine.Substring(0, 70);
            if (line.EndsWith("\\") && singleLine.Length >= 71)
            {
                // include the n from a \\n in the block
                line += singleLine.Substring(70, 1);
            }

            lines.Add(line);

            singleLine = singleLine.Substring(line.Length);
        }

        if (singleLine.Length > 0)
        {
            lines.Add(singleLine);
        }

        return string.Join("\n", lines.Select((line, index) => index == 0 ? line : " " + line));
    }
}
