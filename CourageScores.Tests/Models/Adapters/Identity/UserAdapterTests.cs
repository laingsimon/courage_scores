using CourageScores.Models.Adapters.Identity;
using CourageScores.Models.Cosmos.Identity;
using CourageScores.Models.Dtos.Identity;
using NUnit.Framework;

namespace CourageScores.Tests.Models.Adapters.Identity;

public class UserAdapterTests
{
    private readonly UserAdapter _adapter = new(new AccessAdapter());
    private readonly CancellationToken _token = new();

    [Test]
    public async Task Adapt_GivenModel_SetsPropertiesSuccessfully()
    {
        var model = new User
        {
            TeamId = Guid.NewGuid(),
            Access = new Access(),
            Id = Guid.NewGuid(),
            Name = "name",
            EmailAddress = "email@somewhere.com",
            GivenName = "Simon",
        };

        var result = await _adapter.Adapt(model, _token);

        Assert.That(result.TeamId, Is.EqualTo(model.TeamId));
        Assert.That(result.Name, Is.EqualTo(model.Name));
        Assert.That(result.EmailAddress, Is.EqualTo(model.EmailAddress));
        Assert.That(result.GivenName, Is.EqualTo(model.GivenName));
        Assert.That(result.Access, Is.Not.Null);
    }

    [Test]
    public async Task Adapt_GivenModelNotLoggedIn_SetsPropertiesSuccessfully()
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

        Assert.That(result.Access, Is.Null);
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
        };

        var result = await _adapter.Adapt(dto, _token);

        Assert.That(result.TeamId, Is.EqualTo(dto.TeamId));
        Assert.That(result.Name, Is.EqualTo(dto.Name));
        Assert.That(result.EmailAddress, Is.EqualTo(dto.EmailAddress));
        Assert.That(result.GivenName, Is.EqualTo(dto.GivenName));
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