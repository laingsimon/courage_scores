using CourageScores.Models.Adapters;
using CourageScores.Models.Adapters.Identity;
using CourageScores.Models.Cosmos.Identity;
using CourageScores.Models.Dtos.Identity;
using Moq;
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
    private Mock<ISimpleAdapter<Access, AccessDto>> _accessAdapter = null!;
    private AccessLevelAdapter _adapter = null!;

    [SetUp]
    public void SetupEachTest()
    {
        _accessAdapter = new Mock<ISimpleAdapter<Access, AccessDto>>();
        _adapter = new AccessLevelAdapter(_accessAdapter.Object);

        _accessAdapter.Setup(a => a.Adapt(AccessDto, _token)).ReturnsAsync(Access);
        _accessAdapter.Setup(a => a.Adapt(Access, _token)).ReturnsAsync(AccessDto);
        _accessAdapter.Setup(a => a.Adapt(It.IsAny<AccessDto>(), _token)).ReturnsAsync(Access);
        _accessAdapter.Setup(a => a.Adapt(It.IsAny<Access>(), _token)).ReturnsAsync(AccessDto);
    }

    [Test]
    public async Task AddAccess_GivenNullUpdateAccess_AdaptsAccessAndAccessLevelsToEmpty()
    {
        var source = new UpdateAccessDto();
        var target = new User();

        var result = await _adapter.AddAccess(target, source, _token);

        Assert.That(result.Access, Is.EqualTo(Access));
        Assert.That(result.AccessLevels, Is.Empty);
    }

    [Test]
    public async Task AddAccess_GivenAUserAccessUpdateWithAccess_AdaptsAccessAndAccessLevels()
    {
        var source = new UpdateAccessDto { Access = AccessDto };
        var target = new User();

        var result = await _adapter.AddAccess(target, source, _token);

        Assert.That(result.Access, Is.EqualTo(Access));
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

        Assert.That(result.Access, Is.EqualTo(Access));
        Assert.That(result.AccessLevels, Is.EquivalentTo([new KeyValuePair<AccessOption, AccessLevel>(AccessOption.ManageNotes, AccessLevel.Granted)]));
    }

    [Test]
    public async Task AddAccess_GivenNullUserAccess_AdaptsAccessAndAccessLevels()
    {
        var source = new UserDto();
        var target = new User();

        var result = await _adapter.AddAccess(target, source, _token);

        Assert.That(result.Access, Is.EqualTo(Access));
        Assert.That(result.AccessLevels, Is.Empty);
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
    public async Task AddAccess_GivenNullUserDtoAccess_AdaptsAccessAndAccessLevels()
    {
        var source = new User();
        var target = new UserDto();

        var result = await _adapter.AddAccess(target, source, _token);

        Assert.That(result.Access, Is.EqualTo(AccessDto));
        Assert.That(result.AccessLevels, Is.Empty);
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
