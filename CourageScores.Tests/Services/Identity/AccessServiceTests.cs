using CourageScores.Models.Cosmos.Identity;
using CourageScores.Models.Dtos.Identity;
using CourageScores.Services.Identity;
using NUnit.Framework;

namespace CourageScores.Tests.Services.Identity;

[TestFixture]
public class AccessServiceTests
{
    private readonly CancellationToken _token = CancellationToken.None;
    private readonly AccessService _service = new AccessService();

    [Test]
    public async Task HasAccess_WhenUserHasNoAccess_ReturnsFalse()
    {
        var user = new UserDto();

        var result = await _service.HasAccess(user, AccessOption.AnalyseMatches, _token);

        Assert.That(result, Is.False);
    }

    [Test]
    public async Task HasAccess_WhenUserDtoDoesNotHaveAccess_ReturnsFalse()
    {
        var user = new UserDto
        {
            Access = new AccessDto()
        };

        var result = await _service.HasAccess(user, AccessOption.AnalyseMatches, _token);

        Assert.That(result, Is.False);
    }

    [Test]
    public async Task HasAccess_WhenUserDtoDoesHaveAccess_ReturnsTrue()
    {
        var user = new UserDto
        {
            Access = new AccessDto
            {
#pragma warning disable CS0618 // Type or member is obsolete
                AnalyseMatches = true,
#pragma warning restore CS0618 // Type or member is obsolete
            }
        };

        var result = await _service.HasAccess(user, AccessOption.AnalyseMatches, _token);

        Assert.That(result, Is.True);
    }

    [Test]
    public async Task HasAccess_WhenUserDoesNotHaveAccess_ReturnsFalse()
    {
        var user = new User
        {
            Access = new Access()
        };

        var result = await _service.HasAccess(user, AccessOption.AnalyseMatches, _token);

        Assert.That(result, Is.False);
    }

    [Test]
    public async Task HasAccess_WhenUserDoesHaveAccess_ReturnsTrue()
    {
        var user = new User
        {
            Access = new Access
            {
#pragma warning disable CS0618 // Type or member is obsolete
                AnalyseMatches = true,
#pragma warning restore CS0618 // Type or member is obsolete
            }
        };

        var result = await _service.HasAccess(user, AccessOption.AnalyseMatches, _token);

        Assert.That(result, Is.True);
    }

    [Test]
    public async Task HasAccess_GivenAnyAccessOption_DoesNotThrow([Values] AccessOption accessOption)
    {
        var user = new UserDto
        {
            Access = new AccessDto()
        };

        var result = await _service.HasAccess(user, accessOption, _token);

        Assert.That(result, Is.False);
    }

    [TestCaseSource(nameof(AccessDtoProperties))]
    public void HasAccess_GivenAnyAccessOption_DoesNotThrow(string accessDtoProperty)
    {
        var names = Enum.GetNames<AccessOption>();

        Assert.That(names, Has.Member(accessDtoProperty));
    }

    public static IEnumerable<string> AccessDtoProperties => typeof(AccessDto).GetProperties()
        .Where(p => p.PropertyType == typeof(bool))
        .Select(p => p.Name);
}
