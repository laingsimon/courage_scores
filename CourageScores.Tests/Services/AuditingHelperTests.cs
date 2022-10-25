using CourageScores.Models.Cosmos;
using CourageScores.Models.Dtos.Identity;
using CourageScores.Services;
using CourageScores.Services.Identity;
using Microsoft.Extensions.Internal;
using Moq;
using NUnit.Framework;

namespace CourageScores.Tests.Services;

[TestFixture]
public class AuditingHelperTests
{
#pragma warning disable CS8618
    private Mock<ISystemClock> _clock;
    private Mock<IUserService> _userService;
    private AuditingHelper _helper;
#pragma warning restore CS8618

    [SetUp]
    public void Setup()
    {
        _clock = new Mock<ISystemClock>();
        _userService = new Mock<IUserService>();
        _helper = new AuditingHelper(_clock.Object, _userService.Object);
    }

    [TestCase(true, "user")]
    [TestCase(false, null)]
    public async Task SetUpdated_WhenNew_ShouldSetAuthorProperties(bool loggedIn, string expectedAuthor)
    {
        var model = new Model();
        var user = new UserDto
        {
            Name = "user"
        };
        var now = new DateTimeOffset(2001, 02, 03, 04, 05, 06, TimeSpan.Zero);
        _userService.Setup(s => s.GetUser()).ReturnsAsync(() => loggedIn ? user : null);
        _clock.Setup(c => c.UtcNow).Returns(now);

        await _helper.SetUpdated(model);

        Assert.That(model.Author, Is.EqualTo(expectedAuthor));
        Assert.That(model.Created, Is.EqualTo(now.UtcDateTime));
    }

    [TestCase(true, "user")]
    [TestCase(false, null)]
    public async Task SetUpdated_WhenNotNew_ShouldSetUpdatedProperties(bool loggedIn, string expectedEditor)
    {
        var model = new Model
        {
            Author = "author",
            Created = new DateTime(2011, 12, 13, 14, 15, 16),
        };
        var user = new UserDto
        {
            Name = "user"
        };
        var now = new DateTimeOffset(2001, 02, 03, 04, 05, 06, TimeSpan.Zero);
        _userService.Setup(s => s.GetUser()).ReturnsAsync(() => loggedIn ? user : null);
        _clock.Setup(c => c.UtcNow).Returns(now);

        await _helper.SetUpdated(model);

        Assert.That(model.Author, Is.EqualTo("author"));
        Assert.That(model.Created, Is.EqualTo(new DateTime(2011, 12, 13, 14, 15, 16)));
        Assert.That(model.Editor, Is.EqualTo(expectedEditor));
        Assert.That(model.Updated, Is.EqualTo(now.UtcDateTime));
    }

    [Test]
    public async Task SetUpdated_WhenDeleted_ShouldRemoveDeletedProperties()
    {
        var model = new Model
        {
            Author = "author",
            Created = new DateTime(2011, 12, 13, 14, 15, 16),
            Deleted = new DateTime(2011, 12, 13, 14, 15, 16),
            Remover = "remover",
        };
        var user = new UserDto
        {
            Name = "user"
        };
        var now = new DateTimeOffset(2001, 02, 03, 04, 05, 06, TimeSpan.Zero);
        _userService.Setup(s => s.GetUser()).ReturnsAsync(() => user);
        _clock.Setup(c => c.UtcNow).Returns(now);

        await _helper.SetUpdated(model);

        Assert.That(model.Author, Is.EqualTo("author"));
        Assert.That(model.Created, Is.EqualTo(new DateTime(2011, 12, 13, 14, 15, 16)));
        Assert.That(model.Deleted, Is.Null);
        Assert.That(model.Remover, Is.Null);
    }

    [Test]
    public async Task SetDeleted_WhenLoggedIn_ShouldSetDeletedProperties()
    {
        var model = new Model
        {
            Author = "author",
            Created = new DateTime(2011, 12, 13, 14, 15, 16),
        };
        var user = new UserDto
        {
            Name = "user"
        };
        var now = new DateTimeOffset(2001, 02, 03, 04, 05, 06, TimeSpan.Zero);
        _userService.Setup(s => s.GetUser()).ReturnsAsync(() => user);
        _clock.Setup(c => c.UtcNow).Returns(now);

        await _helper.SetDeleted(model);

        Assert.That(model.Remover, Is.EqualTo("user"));
        Assert.That(model.Deleted, Is.EqualTo(now.UtcDateTime));
    }

    [Test]
    public async Task SetDeleted_WhenNotLoggedIn_ShouldSetDeletedProperties()
    {
        var model = new Model
        {
            Author = "author",
            Created = new DateTime(2011, 12, 13, 14, 15, 16),
        };
        var now = new DateTimeOffset(2001, 02, 03, 04, 05, 06, TimeSpan.Zero);
        _userService.Setup(s => s.GetUser()).ReturnsAsync(() => null);
        _clock.Setup(c => c.UtcNow).Returns(now);

        await _helper.SetDeleted(model);

        Assert.That(model.Remover, Is.Null);
        Assert.That(model.Deleted, Is.EqualTo(now.UtcDateTime));
    }

    public class Model : AuditedEntity
    {

    }
}