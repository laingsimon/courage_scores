using CourageScores.Formatters;
using Microsoft.AspNetCore.Http;
using Moq;
using NUnit.Framework;

namespace CourageScores.Tests.Formatters;

[TestFixture]
public class CalendarWriterTests
{
    private CalendarWriter _writer = null!;
    private StringWriter _textWriter = null!;
    private CancellationToken _token;
    private Mock<IHttpContextAccessor> _httpContextAccessor = null!;
    private DefaultHttpContext _context = null!;

    [SetUp]
    public void SetupEachTest()
    {
        _context = new DefaultHttpContext();
        _httpContextAccessor = new Mock<IHttpContextAccessor>();
        _writer = new CalendarWriter(_httpContextAccessor.Object);
        _textWriter = new StringWriter();
        _token = CancellationToken.None;

        _httpContextAccessor.Setup(a => a.HttpContext).Returns(_context);
    }

    [Test]
    public async Task WriteToStream_WhenCalled_WritesBeginAndEndTags()
    {
        var calendar = new Calendar();

        await _writer.WriteToStream(calendar, _textWriter, _token);

        var content = _textWriter.GetStringBuilder().ToString();
        Assert.That(content, Does.StartWith("BEGIN:VCALENDAR" + Environment.NewLine));
        Assert.That(content, Does.EndWith("END:VCALENDAR" + Environment.NewLine));
    }

    [TestCase("", "PRODID:")]
    [TestCase("id", "PRODID:id")]
    public async Task WriteToStream_WhenCalled_WritesProdId(string id, string expected)
    {
        var calendar = new Calendar
        {
            Id = id,
        };

        await _writer.WriteToStream(calendar, _textWriter, _token);

        Assert.That(
            _textWriter.GetStringBuilder().ToString(),
            Does.Contain(expected + Environment.NewLine));
    }

    [TestCase("", "METHOD:")]
    [TestCase("method", "METHOD:method")]
    public async Task WriteToStream_WhenCalled_WritesMethod(string method, string expected)
    {
        var calendar = new Calendar
        {
            Method = method,
        };

        await _writer.WriteToStream(calendar, _textWriter, _token);

        Assert.That(
            _textWriter.GetStringBuilder().ToString(),
            Does.Contain(expected + Environment.NewLine));
    }

    [TestCase(null, "NAME:", false)]
    [TestCase("", "NAME:", false)]
    [TestCase("name", "NAME:name", true)]
    public async Task WriteToStream_WhenCalled_WritesName(string? name, string expected, bool contains)
    {
        var calendar = new Calendar
        {
            Name = name,
        };

        await _writer.WriteToStream(calendar, _textWriter, _token);

        Assert.That(
            _textWriter.GetStringBuilder().ToString(),
            contains
                ? Does.Contain(expected + Environment.NewLine)
                : Does.Not.Contain(expected));
    }

    [TestCase(null, "DESCRIPTION:", false)]
    [TestCase("", "DESCRIPTION:", false)]
    [TestCase("description", "DESCRIPTION:description", true)]
    public async Task WriteToStream_WhenCalled_WritesDescription(string? description, string expected, bool contains)
    {
        var calendar = new Calendar
        {
            Description = description,
        };

        await _writer.WriteToStream(calendar, _textWriter, _token);

        Assert.That(
            _textWriter.GetStringBuilder().ToString(),
            contains
                ? Does.Contain(expected + Environment.NewLine)
                : Does.Not.Contain(expected));
    }

    [TestCase(null, "REFRESH-INTERVAL;VALUE=DURATION:", false)]
    [TestCase("0.12:00:00.000", "REFRESH-INTERVAL;VALUE=DURATION:P12H", true)]
    public async Task WriteToStream_WhenCalled_WritesRefreshInterval(string? interval, string expected, bool contains)
    {
        var calendar = new Calendar
        {
            RefreshInterval = interval != null
                ? TimeSpan.Parse(interval)
                : null,
        };

        await _writer.WriteToStream(calendar, _textWriter, _token);

        Assert.That(
            _textWriter.GetStringBuilder().ToString(),
            contains
                ? Does.Contain(expected + Environment.NewLine)
                : Does.Not.Contain(expected));
    }

    [Test]
    public async Task WriteToStream_GivenEvent_WritesBeginAndEndEventTags()
    {
        var calendar = new Calendar
        {
            Events =
            {
                new CalendarEvent
                {
                    Title = "title",
                }
            }
        };

        await _writer.WriteToStream(calendar, _textWriter, _token);

        var content = _textWriter.GetStringBuilder().ToString();
        Assert.That(content, Does.Contain("BEGIN:VEVENT" + Environment.NewLine));
        Assert.That(content, Does.Contain("END:VEVENT" + Environment.NewLine));
    }

    [Test]
    public async Task WriteToStream_GivenEvent_WritesSummary()
    {
        var calendar = new Calendar
        {
            Events =
            {
                new CalendarEvent
                {
                    Title = "title",
                }
            }
        };

        await _writer.WriteToStream(calendar, _textWriter, _token);

        Assert.That(
            _textWriter.GetStringBuilder().ToString(),
            Does.Contain("SUMMARY:title" + Environment.NewLine));
    }

    [Test]
    public async Task WriteToStream_GivenEvent_WritesUid()
    {
        var id = Guid.NewGuid();
        var calendar = new Calendar
        {
            Events =
            {
                new CalendarEvent
                {
                    Title = "title",
                    Id = id,
                }
            }
        };

        await _writer.WriteToStream(calendar, _textWriter, _token);

        Assert.That(
            _textWriter.GetStringBuilder().ToString(),
            Does.Contain("UID:" + id + Environment.NewLine));
    }

    [Test]
    public async Task WriteToStream_GivenEvent_WritesSequence()
    {
        var calendar = new Calendar
        {
            Events =
            {
                new CalendarEvent
                {
                    Title = "title",
                    Version = 2,
                }
            }
        };

        await _writer.WriteToStream(calendar, _textWriter, _token);

        Assert.That(
            _textWriter.GetStringBuilder().ToString(),
            Does.Contain("SEQUENCE:2" + Environment.NewLine));
    }

    [TestCase(false, "STATUS:TENTATIVE")]
    [TestCase(true, "STATUS:CONFIRMED")]
    public async Task WriteToStream_GivenEvent_WritesStatus(bool confirmed, string expected)
    {
        var calendar = new Calendar
        {
            Events =
            {
                new CalendarEvent
                {
                    Title = "title",
                    Confirmed = confirmed,
                }
            }
        };

        await _writer.WriteToStream(calendar, _textWriter, _token);

        Assert.That(
            _textWriter.GetStringBuilder().ToString(),
            Does.Contain(expected + Environment.NewLine));
    }

    [TestCase(false, "TRANSP:TRANSPARENT")]
    [TestCase(true, "TRANSP:OPAQUE")]
    public async Task WriteToStream_GivenEvent_WritesPrivacy(bool @private, string expected)
    {
        var calendar = new Calendar
        {
            Events =
            {
                new CalendarEvent
                {
                    Title = "title",
                    Private = @private,
                }
            }
        };

        await _writer.WriteToStream(calendar, _textWriter, _token);

        Assert.That(
            _textWriter.GetStringBuilder().ToString(),
            Does.Contain(expected + Environment.NewLine));
    }

    [Test]
    public async Task WriteToStream_GivenEvent_WritesStartAndEndTimeInUtc()
    {
        var startTime = new DateTimeOffset(2001, 02, 03, 04, 05, 06, TimeSpan.FromHours(0)); // this is a GMT time
        var endTime = new DateTimeOffset(2003, 04, 05, 06, 07, 08, TimeSpan.FromHours(1)); // this is a BST time
        var calendar = new Calendar
        {
            Events =
            {
                new CalendarEvent
                {
                    Title = "starts in GMT ends in BST",
                    FromInclusive = startTime.DateTime,
                    ToExclusive = endTime.DateTime,
                }
            }
        };

        await _writer.WriteToStream(calendar, _textWriter, _token);

        var content = _textWriter.GetStringBuilder().ToString();
        Assert.That(
            content,
            Does.Contain("DTSTART:20010203T040506Z" + Environment.NewLine));
        Assert.That(
            content,
            Does.Contain("DTEND:20030405T050708Z" + Environment.NewLine));
    }

    [Test]
    public async Task WriteToStream_GivenEvent_WritesTimestamp()
    {
        var lastUpdated = new DateTime(2001, 02, 03, 04, 05, 06);
        var calendar = new Calendar
        {
            Events =
            {
                new CalendarEvent
                {
                    Title = "title",
                    LastUpdated = lastUpdated,
                }
            }
        };

        await _writer.WriteToStream(calendar, _textWriter, _token);

        Assert.That(
            _textWriter.GetStringBuilder().ToString(),
            Does.Contain("DTSTAMP:20010203T040506Z" + Environment.NewLine));
    }

    [TestCase("", "CATEGORIES:", false)]
    [TestCase("a", "CATEGORIES:a", true)]
    [TestCase("a,b", "CATEGORIES:a,b", true)]
    public async Task WriteToStream_GivenEvent_WritesCategories(string categories, string expected, bool contains)
    {
        var calendar = new Calendar
        {
            Events =
            {
                new CalendarEvent
                {
                    Title = "title",
                    Categories = string.IsNullOrEmpty(categories)
                        ? []
                        : categories.Split(',').ToList(),
                }
            }
        };

        await _writer.WriteToStream(calendar, _textWriter, _token);

        Assert.That(
            _textWriter.GetStringBuilder().ToString(),
            contains
                ? Does.Contain(expected + Environment.NewLine)
                : Does.Not.Contain(expected));
    }

    [TestCase(null, "URL:", false)]
    [TestCase("", "URL:", false)]
    [TestCase("https://localhost/", "URL:https://localhost/", true)]
    [TestCase("some-relative-url", "URL:https://request-host/some-relative-url", true)]
    [TestCase("/some-relative-url", "URL:https://request-host/some-relative-url", true)]
    [TestCase("some-relative-url/", "URL:https://request-host/some-relative-url/", true)]
    [TestCase("/some-relative-url/", "URL:https://request-host/some-relative-url/", true)]
    public async Task WriteToStream_GivenEvent_WritesUrl(string url, string expected, bool contains)
    {
        _context.Request.Host = new HostString("request-host");
        var calendar = new Calendar
        {
            Events =
            {
                new CalendarEvent
                {
                    Title = "title",
                    Url = string.IsNullOrEmpty(url)
                        ? null
                        : new Uri(url, url.StartsWith("http") ? UriKind.Absolute : UriKind.Relative),
                }
            }
        };

        await _writer.WriteToStream(calendar, _textWriter, _token);

        Assert.That(
            _textWriter.GetStringBuilder().ToString(),
            contains
                ? Does.Contain(expected + Environment.NewLine)
                : Does.Not.Contain(expected));
    }

    [TestCase(null, "LOCATION:", false)]
    [TestCase("", "LOCATION:", false)]
    [TestCase("location", "LOCATION:location", true)]
    public async Task WriteToStream_GivenEvent_WritesLocation(string location, string expected, bool contains)
    {
        var calendar = new Calendar
        {
            Events =
            {
                new CalendarEvent
                {
                    Title = "title",
                    Location = location,
                }
            }
        };

        await _writer.WriteToStream(calendar, _textWriter, _token);

        Assert.That(
            _textWriter.GetStringBuilder().ToString(),
            contains
                ? Does.Contain(expected + Environment.NewLine)
                : Does.Not.Contain(expected));
    }

    [TestCase(null, "DESCRIPTION:", false)]
    [TestCase("", "DESCRIPTION:", false)]
    [TestCase("desc", "DESCRIPTION:desc", true)]
    public async Task WriteToStream_GivenEvent_WritesDescription(string description, string expected, bool contains)
    {
        var calendar = new Calendar
        {
            Events =
            {
                new CalendarEvent
                {
                    Title = "title",
                    Description = description,
                }
            }
        };

        await _writer.WriteToStream(calendar, _textWriter, _token);

        Assert.That(
            _textWriter.GetStringBuilder().ToString(),
            contains
                ? Does.Contain(expected + Environment.NewLine)
                : Does.Not.Contain(expected));
    }

    //   ----------------------------------------------------------------------
    //                                                         70th character ^
    [TestCase(
        "short_input",
        "SUMMARY:short_input")]
    [TestCase(
        "short_input\nwith return lines",
        "SUMMARY:short_input\\nwith return lines")]
    [TestCase(
        "short_input\r\nwith CRLF return lines",
        "SUMMARY:short_input\\nwith CRLF return lines")]
    [TestCase(
        "input that is exactly 70 characters looooooooooooooooooooooooooooooong",
        "SUMMARY:input that is exactly 70 characters looooooooooooooooooooooooooooooong")]
    [TestCase(
        "input that is exactly  71 characters long and ends with a return line\n",
        "SUMMARY:input that is exactly  71 characters long and ends with a return line")]
    [TestCase(
        "input that that contains a return line character at character num  70\\n then more content",
        "SUMMARY:input that that contains a return line character at character num  70\\n\n  then more content")]
    public async Task WriteToStream_GivenStrings_EncodesStringAccordingToSpecification(string input, string expected)
    {
        var calendar = new Calendar
        {
            Events =
            {
                new CalendarEvent
                {
                    Title = input,
                }
            }
        };

        await _writer.WriteToStream(calendar, _textWriter, _token);

        Assert.That(
            _textWriter.GetStringBuilder().ToString(),
            Does.Contain(expected + Environment.NewLine));
    }
}
