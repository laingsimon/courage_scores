using CourageScores.Models.Adapters;
using CourageScores.Models.Cosmos;
using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Identity;
using CourageScores.Services;
using Microsoft.Extensions.Internal;
using Moq;
using NUnit.Framework;

namespace CourageScores.Tests.Models.Adapters;

[TestFixture]
public class AuditingAdapterTests
{
    [Test]
    public void Adapt_WhenGivenModel_ShouldAdaptToDto()
    {
        var adapter = new Mock<IAdapter<Model, Dto>>();
        var clock = new Mock<ISystemClock>();
        var identityService = new Mock<IUserService>();
        var auditingAdapter = new AuditingAdapter<Model, Dto>(adapter.Object, clock.Object, identityService.Object);
        var model = new Model();
        var dto = new Dto();
        adapter.Setup(a => a.Adapt(model)).Returns(dto);

        var result = auditingAdapter.Adapt(model);

        Assert.That(result, Is.SameAs(dto));
    }

    [Test]
    public void Adapt_WhenGivenDto_ShouldAdaptToModel()
    {
        var adapter = new Mock<IAdapter<Model, Dto>>();
        var clock = new Mock<ISystemClock>();
        var identityService = new Mock<IUserService>();
        var auditingAdapter = new AuditingAdapter<Model, Dto>(adapter.Object, clock.Object, identityService.Object);
        var model = new Model();
        var dto = new Dto();
        adapter.Setup(a => a.Adapt(dto)).Returns(model);

        var result = auditingAdapter.Adapt(dto);

        Assert.That(result, Is.SameAs(model));
    }

    [Test]
    public void Adapt_WhenGivenDtoAndLoggedIn_ShouldSetEditorProperties()
    {
        var adapter = new Mock<IAdapter<Model, Dto>>();
        var clock = new Mock<ISystemClock>();
        var identityService = new Mock<IUserService>();
        var auditingAdapter = new AuditingAdapter<Model, Dto>(adapter.Object, clock.Object, identityService.Object);
        var model = new Model
        {
            Author = "Someone Else",
            Created = new DateTime(2001, 02, 03, 04, 05, 06),
            Editor = "Someone Else",
            Updated = new DateTime(2001, 02, 03, 04, 05, 06),
        };
        var dto = new Dto
        {
            Author = "Someone Else",
            Created = new DateTime(2001, 02, 03, 04, 05, 06),
            Editor = "Someone Else",
            Updated = new DateTime(2001, 02, 03, 04, 05, 06),
        };
        var user = new UserDto
        {
            Name = "Simon Laing",
        };
        var nowUtc = new DateTimeOffset(2010, 11, 12, 13, 14, 15, TimeSpan.Zero);
        adapter.Setup(a => a.Adapt(dto)).Returns(model);
        identityService.Setup(s => s.GetUser()).ReturnsAsync(() => user);
        clock.Setup(c => c.UtcNow).Returns(nowUtc);

        var result = auditingAdapter.Adapt(dto);

        Assert.That(result, Is.SameAs(model));
        Assert.That(result.Editor, Is.EqualTo("Simon Laing"));
        Assert.That(result.Updated, Is.EqualTo(nowUtc.UtcDateTime));
    }

    [Test]
    public void Adapt_WhenGivenDtoAndLoggedIn_ShouldSetAuthorProperties()
    {
        var adapter = new Mock<IAdapter<Model, Dto>>();
        var clock = new Mock<ISystemClock>();
        var identityService = new Mock<IUserService>();
        var auditingAdapter = new AuditingAdapter<Model, Dto>(adapter.Object, clock.Object, identityService.Object);
        var model = new Model();
        var dto = new Dto();
        var user = new UserDto
        {
            Name = "Simon Laing",
        };
        var nowUtc = new DateTimeOffset(2010, 11, 12, 13, 14, 15, TimeSpan.Zero);
        adapter.Setup(a => a.Adapt(dto)).Returns(model);
        identityService.Setup(s => s.GetUser()).ReturnsAsync(() => user);
        clock.Setup(c => c.UtcNow).Returns(nowUtc);

        var result = auditingAdapter.Adapt(dto);

        Assert.That(result, Is.SameAs(model));
        Assert.That(result.Editor, Is.EqualTo("Simon Laing"));
        Assert.That(result.Updated, Is.EqualTo(nowUtc.UtcDateTime));
        Assert.That(result.Author, Is.EqualTo("Simon Laing"));
        Assert.That(result.Created, Is.EqualTo(nowUtc.UtcDateTime));
    }

    public class Model : AuditedEntity
    {
    }
    public class Dto : AuditedDto
    {
    }
}