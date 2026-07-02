using CourageScores.Models.Adapters.Identity;
using CourageScores.Models.Cosmos.Identity;
using CourageScores.Models.Dtos.Identity;
using Moq;
using NUnit.Framework;

namespace CourageScores.Tests.Models.Adapters.Identity;

public class UserAdapterTests
{
    private readonly CancellationToken _token = CancellationToken.None;
    private Mock<IAccessLevelAdapter> _accessLevelAdapter = null!;
    private UserAdapter _adapter = null!;

    [SetUp]
    public void SetupEachTest()
    {
        _accessLevelAdapter = new Mock<IAccessLevelAdapter>();
        _adapter = new UserAdapter(_accessLevelAdapter.Object);

        _accessLevelAdapter
            .Setup(a => a.AddAccess(It.IsAny<User>(), It.IsAny<UserDto>(), _token))
            .ReturnsAsync((User source, UserDto _, CancellationToken _) => source);
        _accessLevelAdapter
            .Setup(a => a.AddAccess(It.IsAny<UserDto>(), It.IsAny<User>(), _token))
            .ReturnsAsync((UserDto source, User _, CancellationToken _) => source);
    }

    [Test]
    public async Task Adapt_GivenModel_SetsPropertiesSuccessfully()
    {
        var model = new User
        {
            TeamId = Guid.NewGuid(),
            Id = Guid.NewGuid(),
            Name = "name",
            EmailAddress = "email@somewhere.com",
            GivenName = "Simon",
            Transient = true,
        };

        var result = await _adapter.Adapt(model, _token);

        Assert.That(result.TeamId, Is.EqualTo(model.TeamId));
        Assert.That(result.Name, Is.EqualTo(model.Name));
        Assert.That(result.EmailAddress, Is.EqualTo(model.EmailAddress));
        Assert.That(result.GivenName, Is.EqualTo(model.GivenName));
        Assert.That(result.Transient, Is.True);
        _accessLevelAdapter.Verify(a => a.AddAccess(It.IsAny<UserDto>(), model, _token));
    }

    [Test]
    public async Task Adapt_GivenModelWithNoAccess_SetsPropertiesSuccessfully()
    {
        var model = new User
        {
            TeamId = Guid.NewGuid(),
            Id = Guid.NewGuid(),
            Name = "name",
            EmailAddress = "email@somewhere.com",
            GivenName = "Simon",
        };

        var result = await _adapter.Adapt(model, _token);

        Assert.That(result, Is.Not.Null);
        _accessLevelAdapter.Verify(a => a.AddAccess(It.IsAny<UserDto>(), model, _token));
    }

    [Test]
    public async Task Adapt_GivenDto_SetsPropertiesSuccessfully()
    {
        var dto = new UserDto
        {
            TeamId = Guid.NewGuid(),
            Name = "name",
            EmailAddress = "email@somewhere.com",
            GivenName = "Simon",
            Transient = true,
        };

        var result = await _adapter.Adapt(dto, _token);

        Assert.That(result.TeamId, Is.EqualTo(dto.TeamId));
        Assert.That(result.Name, Is.EqualTo(dto.Name));
        Assert.That(result.EmailAddress, Is.EqualTo(dto.EmailAddress));
        Assert.That(result.GivenName, Is.EqualTo(dto.GivenName));
        Assert.That(result.Transient, Is.True);
        _accessLevelAdapter.Verify(a => a.AddAccess(It.IsAny<User>(), dto, _token));
    }

    [Test]
    public async Task Adapt_GivenDto_RemovesTrailingWhitespace()
    {
        var dto = new UserDto
        {
            Name = "name   ",
            EmailAddress = "email@somewhere.com   ",
            GivenName = "Simon   ",
        };

        var result = await _adapter.Adapt(dto, _token);

        Assert.That(result.Name, Is.EqualTo("name"));
        Assert.That(result.EmailAddress, Is.EqualTo("email@somewhere.com"));
        Assert.That(result.GivenName, Is.EqualTo("Simon"));
    }
}
