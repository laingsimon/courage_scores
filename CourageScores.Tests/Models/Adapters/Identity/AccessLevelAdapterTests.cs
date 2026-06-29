using CourageScores.Models.Adapters.Identity;
using CourageScores.Models.Cosmos.Identity;
using CourageScores.Models.Dtos.Identity;
using NUnit.Framework;

namespace CourageScores.Tests.Models.Adapters.Identity;

[TestFixture]
public class AccessLevelAdapterTests
{
    private static readonly Dictionary<AccessOption, AccessLevel> Access = new()
    {
        { AccessOption.ManageDivisions, AccessLevel.Granted },
    };
    private static readonly Dictionary<AccessOption, AccessLevelDto> AccessDto = new()
    {
        { AccessOption.ManageNotes, AccessLevelDto.Granted },
    };
    private readonly CancellationToken _token = CancellationToken.None;
    private AccessLevelAdapter _adapter = null!;

    [SetUp]
    public void SetupEachTest()
    {
        _adapter = new AccessLevelAdapter();
    }

    [Test]
    public async Task AddAccess_GivenNullUpdateAccess_AdaptsAccessAndAccessLevelsToEmpty()
    {
        var source = new UpdateAccessDto();
        var target = new User();

        var result = await _adapter.AddAccess(target, source, _token);

        Assert.That(result.AccessLevels, Is.Empty);
    }

    [Test]
    public async Task AddAccess_GivenAUserAccessUpdateWithAccess_AdaptsAccessAndAccessLevels()
    {
        var source = new UpdateAccessDto { AccessLevels = AccessDto };
        var target = new User();

        var result = await _adapter.AddAccess(target, source, _token);

        Assert.That(result.AccessLevels, Is.EquivalentTo([new KeyValuePair<AccessOption, AccessLevel>(AccessOption.ManageNotes, AccessLevel.Granted)]));
    }

    [Test]
    public async Task AddAccess_GivenAUserAccessUpdateWithAccessLevels_AdaptsAccessAndAccessLevels()
    {
        var source = new UpdateAccessDto
        {
            AccessLevels = new Dictionary<AccessOption, AccessLevelDto>
            {
                { AccessOption.ManageNotes, AccessLevelDto.Granted },
            },
        };
        var target = new User();

        var result = await _adapter.AddAccess(target, source, _token);

        Assert.That(result.AccessLevels, Is.EquivalentTo([new KeyValuePair<AccessOption, AccessLevel>(AccessOption.ManageNotes, AccessLevel.Granted)]));
    }

    [Test]
    public async Task AddAccess_GivenNullUserAccess_AdaptsAccessAndAccessLevels()
    {
        var source = new UserDto();
        var target = new User();

        var result = await _adapter.AddAccess(target, source, _token);

        Assert.That(result.AccessLevels, Is.Empty);
    }

    [Test]
    public async Task AddAccess_GivenAUser_AdaptsAccessAndAccessLevels()
    {
        var source = new UserDto { AccessLevels = AccessDto };
        var target = new User();

        var result = await _adapter.AddAccess(target, source, _token);

        Assert.That(result.AccessLevels, Is.EquivalentTo([new KeyValuePair<AccessOption, AccessLevel>(AccessOption.ManageNotes, AccessLevel.Granted)]));
    }

    [Test]
    public async Task AddAccess_GivenNullUserDtoAccess_AdaptsAccessAndAccessLevels()
    {
        var source = new User();
        var target = new UserDto();

        var result = await _adapter.AddAccess(target, source, _token);

        Assert.That(result.AccessLevels, Is.Empty);
    }

    [Test]
    public async Task AddAccess_GivenAUserDto_AdaptsAccessAndAccessLevels()
    {
        var source = new User { AccessLevels = Access };
        var target = new UserDto();

        var result = await _adapter.AddAccess(target, source, _token);

        Assert.That(result.AccessLevels, Is.EquivalentTo([new KeyValuePair<AccessOption, AccessLevelDto>(AccessOption.ManageDivisions, AccessLevelDto.Granted)]));
    }
}
