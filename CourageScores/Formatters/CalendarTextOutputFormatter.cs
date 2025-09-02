using System.Net.Mime;
using System.Text;
using Microsoft.AspNetCore.Mvc.Formatters;
using Microsoft.Net.Http.Headers;

namespace CourageScores.Formatters;

public class CalendarTextOutputFormatter : TextOutputFormatter
{
    public const string CalendarMediaType = "text/calendar";

    public CalendarTextOutputFormatter()
    {
        SupportedMediaTypes.Add(MediaTypeHeaderValue.Parse(CalendarMediaType));
        SupportedEncodings.Add(Encoding.UTF8);
    }

    public override bool CanWriteResult(OutputFormatterCanWriteContext context)
    {
        if (!base.CanWriteResult(context))
        {
            return false;
        }

        var request = context.HttpContext.Request;
        var hasCalendarRequestMediaType = request.Headers.Accept.Any(h => h?.Equals(CalendarMediaType) == true);
        var hasCalendarFormatQueryString = request.Query.TryGetValue("content-type", out var contentType) &&
                                            contentType.Equals(CalendarMediaType);
        return hasCalendarRequestMediaType || hasCalendarFormatQueryString;
    }

    protected override bool CanWriteType(Type? type)
    {
        return typeof(ICalendarProvider).IsAssignableFrom(type);
    }

    public override async Task WriteResponseBodyAsync(OutputFormatterWriteContext context, Encoding selectedEncoding)
    {
        var httpContext = context.HttpContext;
        var token = httpContext.RequestAborted;
        var serviceProvider = httpContext.RequestServices;
        var calendarWriter = serviceProvider.GetRequiredService<ICalendarWriter>();
        var calendarProvider = (ICalendarProvider)context.Object!;
        var calendar = await calendarProvider.GetCalendar(token);

        using var buffer = new StringWriter();
        await calendarWriter.WriteToStream(calendar, buffer, token);

        var contentDisposition = new ContentDisposition
        {
            FileName = calendar.Name + ".ics",
            CreationDate = DateTime.UtcNow,
            Inline = false,
            Size = buffer.GetStringBuilder().Length,
        };
        httpContext.Response.Headers.Append(HeaderNames.ContentDisposition, contentDisposition.ToString());
        await httpContext.Response.WriteAsync(buffer.GetStringBuilder().ToString(), selectedEncoding, cancellationToken: token);
    }
}
