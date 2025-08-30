using System.Text;
using CourageScores.Formatters;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc.Formatters;
using Microsoft.Extensions.Primitives;
using Moq;
using NUnit.Framework;

namespace CourageScores.Tests.Formatters;

[TestFixture]
public class CalendarTextOutputFormatterTests
{
    private static readonly Func<Stream, Encoding, TextWriter> WriterFactory = (_, _) => null!;

    private DefaultHttpContext _httpContext = null!;
    private CalendarTextOutputFormatter _formatter = null!;
    private OutputFormatterWriteContext _context = null!;
    private Mock<ICalendarProvider> _object = null!;
    private Mock<ICalendarWriter> _calendarWriter = null!;

    [SetUp]
    public void SetupEachTest()
    {
        _formatter = new CalendarTextOutputFormatter();
        _object = new Mock<ICalendarProvider>();
        _calendarWriter = new Mock<ICalendarWriter>();
        var serviceProvider = new Mock<IServiceProvider>();
        _httpContext = new DefaultHttpContext
        {
            RequestServices = serviceProvider.Object,
        };
        serviceProvider.Setup(s => s.GetService(typeof(ICalendarWriter))).Returns(_calendarWriter.Object);

        _context = new OutputFormatterWriteContext(_httpContext, WriterFactory, typeof(ICalendarProvider), _object.Object);
    }

    [Test]
    public void CanWriteResult_GivenNoAcceptHeader_ReturnsFalse()
    {
        _httpContext.Request.Headers.Remove("Accept");

        var result = _formatter.CanWriteResult(_context);

        Assert.That(result, Is.False);
    }

    [Test]
    public void CanWriteResult_GivenWildcardAcceptHeader_ReturnsFalse()
    {
        _httpContext.Request.Headers.Accept = "*/*";

        var result = _formatter.CanWriteResult(_context);

        Assert.That(result, Is.False);
    }

    [Test]
    public void CanWriteResult_GivenCalendarAcceptHeader_ReturnsTrue()
    {
        _httpContext.Request.Headers.Accept = CalendarTextOutputFormatter.CalendarMediaType;

        var result = _formatter.CanWriteResult(_context);

        Assert.That(result, Is.True);
    }

    [Test]
    public void CanWriteResult_GivenNoCalendarQueryString_ReturnsFalse()
    {
        _httpContext.Request.Query = new QueryCollection();

        var result = _formatter.CanWriteResult(_context);

        Assert.That(result, Is.False);
    }

    [TestCase("content-type")]
    [TestCase("CONTENT-TYPE")]
    public void CanWriteResult_GivenCalendarQueryString_ReturnsTrue(string queryStringName)
    {
        _httpContext.Request.Query = new QueryCollection(new Dictionary<string, StringValues>(StringComparer.OrdinalIgnoreCase)
        {
            { queryStringName, CalendarTextOutputFormatter.CalendarMediaType }
        });

        var result = _formatter.CanWriteResult(_context);

        Assert.That(result, Is.True);
    }

    [Test]
    public void CanWriteType_GivenOrdinaryType_ReturnsFalse()
    {
        _httpContext.Request.Headers.Accept = CalendarTextOutputFormatter.CalendarMediaType;

        var result =
            _formatter.CanWriteResult(new OutputFormatterWriteContext(_httpContext, WriterFactory, typeof(object), null));

        Assert.That(result, Is.False);
    }

    [Test]
    public void CanWriteType_GivenCalendarProviderType_ReturnsTrue()
    {
        _httpContext.Request.Headers.Accept = CalendarTextOutputFormatter.CalendarMediaType;

        var result =
            _formatter.CanWriteResult(new OutputFormatterWriteContext(_httpContext, WriterFactory, typeof(ICalendarProvider), null));

        Assert.That(result, Is.True);
    }

    [Test]
    public async Task WriteResponseBodyAsync_WritesCalendarCorrectly()
    {
        var requestCancellationToken = _httpContext.RequestAborted;
        var calendar = new Calendar { Name = "Test Calendar" };
        _httpContext.Request.Headers.Accept = CalendarTextOutputFormatter.CalendarMediaType;
        _object.Setup(o => o.GetCalendar(requestCancellationToken)).ReturnsAsync(calendar);
        _calendarWriter
            .Setup(w => w.WriteToStream(calendar, It.IsAny<TextWriter>(), requestCancellationToken))
            .Callback((Calendar _, TextWriter textWriter, CancellationToken _) => textWriter.Write("Some calendar content"));

        _httpContext.Response.Body = new MemoryStream();
        await _formatter.WriteResponseBodyAsync(_context, Encoding.UTF8);

        _calendarWriter.Verify(w => w.WriteToStream(calendar, It.IsAny<TextWriter>(), requestCancellationToken));
        _httpContext.Response.Body.Seek(0, SeekOrigin.Begin);
        var content = await new StreamReader(_httpContext.Response.Body).ReadToEndAsync(requestCancellationToken);
        Assert.That(content, Is.EqualTo("Some calendar content"));
    }
}
