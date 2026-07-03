using System.Net;
using AutoFixture;
using CourageScores.Models.Adapters.Identity;
using CourageScores.Models.Cosmos.Identity;
using CourageScores.Models.Dtos.Identity;
using Microsoft.AspNetCore.Http;
using NUnit.Framework;

namespace CourageScores.Tests.Models.Adapters.Identity;

[TestFixture]
public class ServiceAccountSessionAdapterTests
{
    private readonly CancellationToken _token = CancellationToken.None;
    private ServiceAccountSessionAdapter _adapter = null!;
    private DefaultHttpContext _httpContext = null!;

    [SetUp]
    public void SetupEachTest()
    {
        var fixture = AutoFixture.Create();
        _httpContext = new DefaultHttpContext
        {
            Connection =
            {
                RemoteIpAddress = IPAddress.Parse("1.2.3.4"),
            }
        };
        var httpContextAccessor = fixture.FreezeMock<IHttpContextAccessor>();

        _adapter = fixture.Create<ServiceAccountSessionAdapter>();

        httpContextAccessor.Setup(a => a.HttpContext).Returns(_httpContext);
    }

    [Test]
    public async Task Adapt_GivenModel_SetsPropertiesCorrectly()
    {
        var model = new ServiceAccountSession
        {
            VerificationValue = "cookie-value",
            FriendlyName = "friendly-name",
            PinFromApprover = "pin",
            ServiceIpAddress = "ip-address",
            ServiceUserAgent = "user-agent",
            ApprovedBy = "approved-by",
            LastRequest = new DateTime(2001, 02, 03),
            Message = "message",
            RejectedBy = "rejected-by",
            TransientUsername = "username",
            Id = Guid.NewGuid(),
            Updated = new DateTime(2002, 03, 04),
        };

        var dto = await _adapter.Adapt(model, _token);

        Assert.That(dto.ApprovedBy, Is.EqualTo(model.ApprovedBy));
        Assert.That(dto.VerificationValue, Is.EqualTo(model.VerificationValue));
        Assert.That(dto.Id, Is.EqualTo(model.Id));
        Assert.That(dto.LastRequest, Is.EqualTo(model.LastRequest));
        Assert.That(dto.Message, Is.EqualTo(model.Message));
        Assert.That(dto.PinFromApprover, Is.EqualTo(model.PinFromApprover));
        Assert.That(dto.RejectedBy, Is.EqualTo(model.RejectedBy));
        Assert.That(dto.ServiceIpAddress, Is.EqualTo(model.ServiceIpAddress));
        Assert.That(dto.ServiceUserAgent, Is.EqualTo(model.ServiceUserAgent));
        Assert.That(dto.TransientUsername, Is.EqualTo(model.TransientUsername));
        Assert.That(dto.LastUpdated, Is.EqualTo(model.Updated));
        Assert.That(dto.FriendlyName, Is.EqualTo(model.FriendlyName));
        Assert.That(dto.MyIpAddress, Is.EqualTo(_httpContext.Connection.RemoteIpAddress!.ToString()));
    }

    [Test]
    public async Task Adapt_GivenDto_SetsPropertiesCorrectly()
    {
        var dto = new ServiceAccountSessionDto
        {
            VerificationValue = "cookie-value",
            PinFromApprover = "pin",
            ServiceIpAddress = "ip-address",
            FriendlyName = "friendly-name",
            ServiceUserAgent = "user-agent",
            ApprovedBy = "approved-by",
            LastRequest = new DateTime(2001, 02, 03),
            Message = "message",
            RejectedBy = "rejected-by",
            TransientUsername = "username",
            Id = Guid.NewGuid(),
        };

        var model = await _adapter.Adapt(dto, _token);

        Assert.That(model.ApprovedBy, Is.EqualTo(dto.ApprovedBy));
        Assert.That(model.VerificationValue, Is.EqualTo(dto.VerificationValue));
        Assert.That(model.Id, Is.EqualTo(dto.Id));
        Assert.That(model.LastRequest, Is.EqualTo(dto.LastRequest));
        Assert.That(model.Message, Is.EqualTo(dto.Message));
        Assert.That(model.PinFromApprover, Is.EqualTo(dto.PinFromApprover));
        Assert.That(model.RejectedBy, Is.EqualTo(dto.RejectedBy));
        Assert.That(model.ServiceIpAddress, Is.EqualTo(dto.ServiceIpAddress));
        Assert.That(model.ServiceUserAgent, Is.EqualTo(dto.ServiceUserAgent));
        Assert.That(model.TransientUsername, Is.EqualTo(dto.TransientUsername));
        Assert.That(model.FriendlyName, Is.EqualTo(dto.FriendlyName));
    }
}
