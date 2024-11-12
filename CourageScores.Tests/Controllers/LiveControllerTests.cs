using CourageScores.Controllers;
using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Live;
using CourageScores.Services.Live;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Primitives;
using Moq;
using NUnit.Framework;

namespace CourageScores.Tests.Controllers;

[TestFixture]
public class LiveControllerTests
{
    private readonly CancellationToken _token = new CancellationToken();
    private Mock<ILiveService> _service = null!;
    private Mock<IConfiguration> _configuration = null!;
    private LiveController _controller = null!;

    [SetUp]
    public void SetupEachTest()
    {
        _service = new Mock<ILiveService>();
        _configuration = new Mock<IConfiguration>();
        _controller = new LiveController(_service.Object, _configuration.Object);
        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext(),
        };
    }

    [Test]
    public async Task GetUpdate_GivenNoLastModifiedHeader_CallsGetUpdateWithQueryStringValue()
    {
        var id = Guid.NewGuid();
        _service
            .Setup(s => s.GetUpdate(id, LiveDataType.Sayg, It.IsAny<DateTimeOffset?>(), _token))
            .ReturnsAsync(new ActionResultDto<UpdatedDataDto?>());

        await _controller.GetUpdate(id, LiveDataType.Sayg, _token);

        _service.Verify(s => s.GetUpdate(id, LiveDataType.Sayg, null, _token));
    }

    [Test]
    public async Task GetUpdate_GivenLastModifiedHeader_CallsGetUpdateWithHeaderValue()
    {
        var id = Guid.NewGuid();
        var lastUpdatedHeader = new DateTimeOffset(2002, 03, 04, 05, 06, 07, TimeSpan.Zero);
        _controller.Request.Headers.IfModifiedSince = new StringValues(lastUpdatedHeader.ToString("R"));
        _service
            .Setup(s => s.GetUpdate(id, LiveDataType.Sayg, It.IsAny<DateTimeOffset?>(), _token))
            .ReturnsAsync(new ActionResultDto<UpdatedDataDto?>());

        await _controller.GetUpdate(id, LiveDataType.Sayg, _token);

        _service.Verify(s => s.GetUpdate(id, LiveDataType.Sayg, lastUpdatedHeader, _token));
    }

    [Test]
    public async Task GetUpdate_WhenNullResultFromService_ReturnsNotFound()
    {
        var id = Guid.NewGuid();
        var lastUpdatedHeader = new DateTimeOffset(2001, 02, 03, 04, 05, 06, TimeSpan.Zero);
        _controller.Request.Headers.IfModifiedSince = new StringValues(lastUpdatedHeader.ToString("R"));
        _service
            .Setup(s => s.GetUpdate(id, LiveDataType.Sayg, lastUpdatedHeader, _token))
            .ReturnsAsync(new ActionResultDto<UpdatedDataDto?>());

        await _controller.GetUpdate(id, LiveDataType.Sayg, _token);

        Assert.That(_controller.Response.StatusCode, Is.EqualTo(StatusCodes.Status404NotFound));
    }

    [Test]
    public async Task GetUpdate_WhenNullDataFromService_ReturnsNotModifiedAndSetsLastModifiedHeader()
    {
        var id = Guid.NewGuid();
        var lastUpdatedHeader = new DateTimeOffset(2001, 02, 03, 04, 05, 06, TimeSpan.Zero);
        var updated = new DateTimeOffset(2001, 01, 01, 01, 01, 01, TimeSpan.Zero);
        _controller.Request.Headers.IfModifiedSince = new StringValues(lastUpdatedHeader.ToString("R"));
        _service
            .Setup(s => s.GetUpdate(id, LiveDataType.Sayg, lastUpdatedHeader, _token))
            .ReturnsAsync(new ActionResultDto<UpdatedDataDto?>
            {
                Result = new UpdatedDataDto
                {
                    Data = null,
                    LastUpdate = updated,
                }
            });

        await _controller.GetUpdate(id, LiveDataType.Sayg, _token);

        Assert.That(_controller.Response.Headers.LastModified.ToString(), Is.EqualTo("Mon, 01 Jan 2001 01:01:01 GMT"));
        Assert.That(_controller.Response.StatusCode, Is.EqualTo(StatusCodes.Status304NotModified));
    }

    [Test]
    public async Task GetUpdate_WhenDataFromService_ReturnsOKAndSetsLastModifiedHeader()
    {
        var id = Guid.NewGuid();
        var lastUpdatedHeader = new DateTimeOffset(2001, 02, 03, 04, 05, 06, TimeSpan.Zero);
        var updated = new DateTimeOffset(2020, 01, 01, 01, 01, 01, TimeSpan.Zero);
        _controller.Request.Headers.IfModifiedSince = new StringValues(lastUpdatedHeader.ToString("R"));
        _service
            .Setup(s => s.GetUpdate(id, LiveDataType.Sayg, lastUpdatedHeader, _token))
            .ReturnsAsync(new ActionResultDto<UpdatedDataDto?>
            {
                Result = new UpdatedDataDto
                {
                    Data = "SOME DATA",
                    LastUpdate = updated,
                }
            });

        await _controller.GetUpdate(id, LiveDataType.Sayg, _token);

        Assert.That(_controller.Response.StatusCode, Is.EqualTo(StatusCodes.Status200OK));
        Assert.That(_controller.Response.Headers.LastModified.ToString(), Is.EqualTo("Wed, 01 Jan 2020 01:01:01 GMT"));
    }
}