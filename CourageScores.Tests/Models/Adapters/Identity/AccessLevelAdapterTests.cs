using CourageScores.Models.Adapters;
using CourageScores.Models.Adapters.Identity;
using CourageScores.Models.Cosmos.Identity;
using CourageScores.Models.Dtos.Identity;
using CourageScores.Services.Identity;
using NUnit.Framework;

namespace CourageScores.Tests.Models.Adapters.Identity;

[TestFixture]
public class AccessLevelAdapterTests
{
#pragma warning disable CS0618 // Type or member is obsolete
    private static readonly Access Access = new Access { ManageDivisions = true };
    private static readonly AccessDto AccessDto = new AccessDto { ManageNotes = true };
#pragma warning restore CS0618 // Type or member is obsolete

    private readonly CancellationToken _token = CancellationToken.None;
    private ISimpleAdapter<Access, AccessDto> _accessAdapter = null!;
    private AccessLevelAdapter _adapter = null!;

    [SetUp]
    public void SetupEachTest()
    {
        _accessAdapter = new MockSimpleAdapter<Access, AccessDto>(Access, AccessDto);
        _adapter = new AccessLevelAdapter(_accessAdapter);
    }

    [Test]
    public async Task AddAccess_GivenAUserAccessUpdate_AdaptsAccessAndAccessLevels()
    {
        var source = new UpdateAccessDto { Access = AccessDto };
        var target = new User();

        var result = await _adapter.AddAccess(target, source, _token);

        Assert.That(result.Access, Is.EqualTo(Access));
        Assert.That(result.AccessLevels, Is.EquivalentTo([new KeyValuePair<AccessOption, AccessLevel>(AccessOption.ManageNotes, AccessLevel.Granted)]));
    }

    [Test]
    public async Task AddAccess_GivenAUser_AdaptsAccessAndAccessLevels()
    {
        var source = new UserDto { Access = AccessDto };
        var target = new User();

        var result = await _adapter.AddAccess(target, source, _token);

        Assert.That(result.Access, Is.EqualTo(Access));
        Assert.That(result.AccessLevels, Is.EquivalentTo([new KeyValuePair<AccessOption, AccessLevel>(AccessOption.ManageNotes, AccessLevel.Granted)]));
    }

    [Test]
    public async Task AddAccess_GivenAUserDto_AdaptsAccessAndAccessLevels()
    {
        var source = new User { Access = Access };
        var target = new UserDto();

        var result = await _adapter.AddAccess(target, source, _token);

        Assert.That(result.Access, Is.EqualTo(AccessDto));
        Assert.That(result.AccessLevels, Is.EquivalentTo([new KeyValuePair<AccessOption, AccessLevelDto>(AccessOption.ManageDivisions, AccessLevelDto.Granted)]));
    }
}
