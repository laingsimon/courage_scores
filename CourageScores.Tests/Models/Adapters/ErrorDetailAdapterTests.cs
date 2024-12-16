using CourageScores.Models.Adapters;
using CourageScores.Models.Cosmos;
using CourageScores.Models.Dtos;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Http;
using Moq;
using NUnit.Framework;

namespace CourageScores.Tests.Models.Adapters;

[TestFixture]
public class ErrorDetailAdapterTests
{
    private readonly CancellationToken _token = new();
    private Mock<IHttpContextAccessor> _httpContextAccessor = null!;
    private DefaultHttpContext _httpContext = null!;
    private ErrorDetailAdapter _adapter = null!;
    private Mock<TimeProvider> _clock = null!;
    private DateTimeOffset _now;

    [SetUp]
    public void SetupEachTest()
    {
        _httpContextAccessor = new Mock<IHttpContextAccessor>();
        _httpContext = new DefaultHttpContext
        {
            Request =
            {
                Headers =
                {
                    UserAgent = "some user agent",
                },
                Scheme = "https",
                Host = new HostString("courageleague.com"),
                PathBase = new PathString("/some/path"),
                QueryString = new QueryString("?some-queryString"),
            },
        };
        _clock = new Mock<TimeProvider>();
        _now = new DateTimeOffset(new DateTime(2001, 02, 03), TimeSpan.Zero);
        _adapter = new ErrorDetailAdapter(_httpContextAccessor.Object, _clock.Object);

        _httpContextAccessor.Setup(a => a.HttpContext).Returns(() => _httpContext);
        _clock.Setup(c => c.GetUtcNow()).Returns(_now);
    }

    [Test]
    public async Task Adapt_GivenExceptionDetails_ReturnsErrorDetail()
    {
        var feature = new Mock<IExceptionHandlerPathFeature>();
        var error = GetException(new Exception("message"));
        feature.Setup(f => f.Error).Returns(error);

        var result = await _adapter.Adapt(feature.Object, _token);

        Assert.That(result, Is.Not.Null);
        Assert.That(result.Id, Is.EqualTo(Guid.Empty));
        Assert.That(result.Source, Is.EqualTo(SourceSystem.Api));
        Assert.That(result.Time, Is.EqualTo(_now.UtcDateTime));
        Assert.That(result.UserAgent, Is.EqualTo("some user agent"));
        Assert.That(result.Stack, Has.Some.Contains("at CourageScores.Tests.Models.Adapters.ErrorDetailAdapterTests.GetException(Exception exception)"));
        Assert.That(result.Type, Is.EqualTo(nameof(Exception)));
        Assert.That(result.Message, Is.EqualTo("message"));
        Assert.That(result.Url, Is.EqualTo("https://courageleague.com/some/path?some-queryString"));
    }

    [Test]
    public async Task Adapt_GivenErrorDetailDto_ReturnsErrorDetail()
    {
        var dto = new ErrorDetailDto
        {
            Type = "type",
            Url = "url",
            Id = Guid.NewGuid(),
            Source = SourceSystem.Api,
            Stack = new[]
            {
                "frame1", "frame2",
            },
            Time = new DateTime(2001, 02, 03),
            UserAgent = "user-agent",
            Message = "message",
            UserName = "user",
        };

        var result = await _adapter.Adapt(dto, _token);

        Assert.That(result.Type, Is.EqualTo(dto.Type));
        Assert.That(result.Url, Is.EqualTo(dto.Url));
        Assert.That(result.Id, Is.EqualTo(dto.Id));
        Assert.That(result.Source, Is.EqualTo(dto.Source));
        Assert.That(result.Stack, Is.EqualTo(dto.Stack));
        Assert.That(result.Time, Is.EqualTo(dto.Time));
        Assert.That(result.UserAgent, Is.EqualTo(dto.UserAgent));
        Assert.That(result.Message, Is.EqualTo(dto.Message));
        Assert.That(result.UserName, Is.EqualTo(dto.UserName));
    }

    [Test]
    public async Task Adapt_GivenErrorDetail_ReturnsErrorDetailDto()
    {
        var model = new ErrorDetail
        {
            Type = "type",
            Url = "url",
            Id = Guid.NewGuid(),
            Source = SourceSystem.Api,
            Stack = new[]
            {
                "frame1", "frame2",
            },
            Time = new DateTime(2001, 02, 03),
            UserAgent = "user-agent",
            Message = "message",
            UserName = "user",
        };

        var result = await _adapter.Adapt(model, _token);

        Assert.That(result.Type, Is.EqualTo(model.Type));
        Assert.That(result.Url, Is.EqualTo(model.Url));
        Assert.That(result.Id, Is.EqualTo(model.Id));
        Assert.That(result.Source, Is.EqualTo(model.Source));
        Assert.That(result.Stack, Is.EqualTo(model.Stack));
        Assert.That(result.Time, Is.EqualTo(model.Time));
        Assert.That(result.UserAgent, Is.EqualTo(model.UserAgent));
        Assert.That(result.Message, Is.EqualTo(model.Message));
        Assert.That(result.UserName, Is.EqualTo(model.UserName));
    }

    private static Exception GetException(Exception exception)
    {
        try
        {
            throw exception;
        }
        catch (Exception exc)
        {
            return exc;
        }
    }
}