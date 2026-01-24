using CourageScores.Common;
using CourageScores.Models.Adapters;
using CourageScores.Models.Dtos.Identity;
using CourageScores.Models.Dtos.RemoteControl;
using CourageScores.Repository;
using CourageScores.Services.Identity;
using CourageScores.Services.RemoteControl;
using Moq;
using NUnit.Framework;
using CosmosRemoteControl = CourageScores.Models.Cosmos.RemoteControl.RemoteControl;

namespace CourageScores.Tests.Services.RemoteControl;

[TestFixture]
public class RemoteControlServiceTests
{
    private readonly CancellationToken _token = CancellationToken.None;
    private RemoteControlService _service = null!;
    private Mock<IUserService> _userService = null!;
    private Mock<IGenericRepository<CosmosRemoteControl>> _repository = null!;
    private Mock<ISimpleOnewayAdapter<CosmosRemoteControl, RemoteControlDto>> _adapter = null!;
    private UserDto? _user;
    private CosmosRemoteControl _deletedUnexpiredEntry = null!;
    private CosmosRemoteControl _deletedExpiredEntry = null!;
    private CosmosRemoteControl _unexpiredEntry = null!;
    private CosmosRemoteControl _expiredEntry = null!;
    private RemoteControlDto _dto = null!;

    [SetUp]
    public void SetupEachTest()
    {
        _userService = new Mock<IUserService>();
        _repository = new Mock<IGenericRepository<CosmosRemoteControl>>();
        _adapter = new Mock<ISimpleOnewayAdapter<CosmosRemoteControl, RemoteControlDto>>();
        _service = new RemoteControlService(_userService.Object, _repository.Object, _adapter.Object);

        _user = null;
        _userService.Setup(s => s.GetUser(_token)).ReturnsAsync(() => _user);
        _deletedUnexpiredEntry = new CosmosRemoteControl
        {
            Id = Guid.NewGuid(),
            Created = DateTime.UtcNow,
            Deleted = true,
        };
        _deletedExpiredEntry = new CosmosRemoteControl
        {
            Id = Guid.NewGuid(),
            Created = DateTime.UtcNow.AddDays(-2),
            Deleted = true,
        };
        _unexpiredEntry = new CosmosRemoteControl
        {
            Id = Guid.NewGuid(),
            Created = DateTime.UtcNow.AddMinutes(-10),
        };
        _expiredEntry = new CosmosRemoteControl
        {
            Id = Guid.NewGuid(),
            Created = DateTime.UtcNow.AddDays(-2),
        };
        _dto = new RemoteControlDto();

        var allEntries = new[]
        {
            _deletedExpiredEntry, _deletedUnexpiredEntry,
            _expiredEntry, _unexpiredEntry
        };
        _repository
            .Setup(r => r.GetAll(_token))
            .Returns(TestUtilities.AsyncEnumerable(allEntries));
        _repository
            .Setup(r => r.Get(It.IsAny<Guid>(), _token))
            .ReturnsAsync((Guid id, CancellationToken _) => allEntries.FirstOrDefault(e => e.Id == id));
        _adapter
            .Setup(a => a.Adapt(It.IsAny<CosmosRemoteControl>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(_dto);
    }

    [Test]
    public async Task Create_WhenTooManyActiveEntries_ReturnsTooManyEntries()
    {
        var entries = Enumerable.Range(0, 100)
            .Select(i => new CosmosRemoteControl { Deleted = false, Pin = i.ToString() })
            .ToArray();
        _repository
            .Setup(r => r.GetAll(_token))
            .Returns(TestUtilities.AsyncEnumerable(entries));

        var result = await _service.Create("pin", _token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Errors, Is.EquivalentTo(["Too many entries"]));
        await VerifyNoCreation();
    }

    [Test]
    public async Task Create_WhenTooManyDeletedEntries_CreatesEntry()
    {
        var entries = Enumerable.Range(0, 100)
            .Select(i => new CosmosRemoteControl { Deleted = true, Pin = i.ToString() })
            .ToArray();
        _repository
            .Setup(r => r.GetAll(_token))
            .Returns(TestUtilities.AsyncEnumerable(entries));

        var result = await _service.Create("pin", _token);

        Assert.That(result.Success, Is.True);
        Assert.That(result.Result, Is.SameAs(_dto));
        await VerifyCreation();
    }

    [Test]
    public async Task Create_WhenNoEntries_CreatesEntry()
    {
        _repository
            .Setup(r => r.GetAll(_token))
            .Returns(TestUtilities.AsyncEnumerable<CosmosRemoteControl>());

        var result = await _service.Create("pin", _token);

        Assert.That(result.Success, Is.True);
        Assert.That(result.Result, Is.SameAs(_dto));
        await VerifyCreation();
    }

    [Test]
    public async Task Create_WhenSomeEntriesExpired_DeletesExpiredEntries()
    {
        await _service.Create("pin", _token);

        VerifyDeletion(_expiredEntry);
    }

    [Test]
    public async Task Create_WhenPinIsNullOrEmpty_DoesNotCreateEntry()
    {
        var result = await _service.Create("", _token);

        Assert.That(result.Success, Is.False);
        await VerifyNoCreation();
    }

    [Test]
    public async Task Delete_WhenEntryDoesNotExist_ReturnsUnsuccessful()
    {
        await _service.Delete(Guid.NewGuid(), "anything", _token);

        VerifyDeletion(_expiredEntry);
    }

    [Test]
    public async Task Delete_WhenEntryIsDeleted_ReturnsUnsuccessful()
    {
        await _service.Delete(_deletedUnexpiredEntry.Id, _deletedUnexpiredEntry.Pin, _token);

        VerifyDeletion(_expiredEntry);
        VerifyNoUpdate(_deletedUnexpiredEntry);
    }

    [Test]
    public async Task Delete_WhenEntryIsNotDeleted_DeletesExpiredEntries()
    {
        await _service.Delete(_unexpiredEntry.Id, _unexpiredEntry.Pin, _token);

        VerifyDeletion(_expiredEntry);
    }

    [Test]
    public async Task Delete_WhenEntryExistsButPinIncorrect_DoesNotDeleteEntry()
    {
        await _service.Delete(_unexpiredEntry.Id, "incorrect pin", _token);

        VerifyDeletion(_expiredEntry);
        VerifyNoUpdate(_unexpiredEntry);
    }

    [Test]
    public async Task Delete_WhenEntryExistsAndPinCorrect_DeletesEntry()
    {
        await _service.Delete(_unexpiredEntry.Id, _unexpiredEntry.Pin, _token);

        VerifyDeletion(_expiredEntry, _unexpiredEntry);
    }

    [TestCase(true)]
    [TestCase(false)]
    public async Task Delete_WhenEntryExists_DeletesExpiredEntries(bool pinCorrect)
    {
        var pin = pinCorrect ? _unexpiredEntry.Pin : "incorrect";
        await _service.Delete(_unexpiredEntry.Id, pin, _token);

        VerifyDeletion(_expiredEntry);
        if (pinCorrect)
        {
            VerifyDeletion(_unexpiredEntry);
        }
    }

    [Test]
    public async Task Get_WhenEntryDoesNotExist_ReturnsNullAndDeletesExpiredEntries()
    {
        var result = await _service.Get(Guid.NewGuid(), "anything", _token);

        Assert.That(result.Success, Is.False);
        VerifyDeletion(_expiredEntry);
    }

    [Test]
    public async Task Get_WhenEntryIsDeleted_ReturnsNullAndDeletesExpiredEntries()
    {
        var result = await _service.Get(_deletedUnexpiredEntry.Id, _deletedUnexpiredEntry.Pin, _token);

        Assert.That(result.Success, Is.False);
        VerifyDeletion(_expiredEntry);
    }

    [Test]
    public async Task Get_WhenPinIsIncorrect_ReturnsUnsuccessfulAndDeletesExpiredEntries()
    {
        var result = await _service.Get(_unexpiredEntry.Id, "incorrect", _token);

        Assert.That(result.Success, Is.False);
        VerifyDeletion(_expiredEntry);
    }

    [Test]
    public async Task Get_WhenPinIsCorrect_ReturnsEntryDetailsAndDeletesExpiredEntries()
    {
        var result = await _service.Get(_unexpiredEntry.Id, _unexpiredEntry.Pin, _token);

        Assert.That(result.Success, Is.True);
        Assert.That(result.Result, Is.SameAs(_dto));
        VerifyDeletion(_expiredEntry);
    }

    [Test]
    public async Task Update_WhenNotLoggedIn_ReturnsNotPermitted()
    {
        var update = new RemoteControlUpdateDto
        {
            Pin = _unexpiredEntry.Pin,
            Url = "/a/valid/url",
        };

        var result = await _service.Update(_unexpiredEntry.Id, update, _token);

        Assert.That(result.Success, Is.False);
        VerifyDeletion(_expiredEntry);
        VerifyNoUpdate(_unexpiredEntry);
    }

    [Test]
    public async Task Update_WhenEntryDoesNotExist_ReturnsNullAndDeletesExpiredEntries()
    {
        var update = new RemoteControlUpdateDto
        {
            Pin = "any-pin",
            Url = "/a/valid/url",
        };
        _user = new UserDto();

        var result = await _service.Update(Guid.NewGuid(), update, _token);

        Assert.That(result.Success, Is.False);
        VerifyDeletion(_expiredEntry);
    }

    [Test]
    public async Task Update_WhenEntryIsDeleted_ReturnsNullAndDeletesExpiredEntries()
    {
        var update = new RemoteControlUpdateDto
        {
            Pin = _deletedUnexpiredEntry.Pin,
            Url = "/a/valid/url",
        };
        _user = new UserDto();

        var result = await _service.Update(_deletedUnexpiredEntry.Id, update, _token);

        Assert.That(result.Success, Is.False);
        VerifyDeletion(_expiredEntry);
        VerifyNoUpdate(_deletedUnexpiredEntry);
    }

    [Test]
    public async Task Update_WhenPinIsIncorrect_ReturnsUnsuccessfulAndDeletesExpiredEntries()
    {
        var update = new RemoteControlUpdateDto
        {
            Pin = "incorrect pin",
            Url = "/a/valid/url",
        };
        _user = new UserDto();

        var result = await _service.Update(_unexpiredEntry.Id, update, _token);

        Assert.That(result.Success, Is.False);
        VerifyDeletion(_expiredEntry);
    }

    [Test]
    public async Task Update_WhenPinIsCorrect_UpdatesAndReturnsEntryDetailsAndDeletesExpiredEntries()
    {
        var update = new RemoteControlUpdateDto
        {
            Pin = _unexpiredEntry.Pin,
            Url = "/a/valid/url",
        };
        _user = new UserDto();

        var result = await _service.Update(_unexpiredEntry.Id, update, _token);

        Assert.That(result.Success, Is.True);
        VerifyDeletion(_expiredEntry);
        _repository
            .Verify(r => r.Upsert(
                It.Is<CosmosRemoteControl>(rc => rc.Deleted == false && rc.Url == update.Url && rc.UrlUpdated != null),
                _token));
    }

    [TestCase("")]
    [TestCase("https://somewhere-else")]
    [TestCase("somewhere-else")]
    [TestCase("/../somewhere-else")]
    public async Task Update_WhenUrlIsInvalid_UpdatesAndReturnsEntryDetailsAndDeletesExpiredEntries(string url)
    {
        var update = new RemoteControlUpdateDto
        {
            Pin = _unexpiredEntry.Pin,
            Url = url,
        };
        _user = new UserDto();

        var result = await _service.Update(_unexpiredEntry.Id, update, _token);

        Assert.That(result.Success, Is.False);
        VerifyDeletion(_expiredEntry);
    }

    private void VerifyDeletion(params CosmosRemoteControl[] remoteControls)
    {
        foreach (var remoteControl in remoteControls)
        {
            _repository
                .Verify(r => r
                    .Upsert(
                        It.Is<CosmosRemoteControl>(rc => rc.Id == remoteControl.Id && rc.Deleted),
                        _token));
        }
    }

    private async Task VerifyNoCreation()
    {
        var ids = await _repository.Object.GetAll(_token).SelectAsync(rc => rc.Id).ToList();

        _repository
            .Verify(r => r
                .Upsert(
                    It.Is<CosmosRemoteControl>(rc => !ids.Contains(rc.Id)),
                    It.IsAny<CancellationToken>()),
                Times.Never);
    }

    private void VerifyNoUpdate(CosmosRemoteControl remoteControl)
    {
        _repository
            .Verify(r => r
                    .Upsert(
                        It.Is<CosmosRemoteControl>(rc => rc.Id == remoteControl.Id),
                        It.IsAny<CancellationToken>()),
                Times.Never);
    }

    private async Task VerifyCreation()
    {
        var ids = await _repository.Object.GetAll(_token).SelectAsync(rc => rc.Id).ToList();

        _repository
            .Verify(r => r
                    .Upsert(
                        It.Is<CosmosRemoteControl>(rc => !ids.Contains(rc.Id)),
                        _token));
    }
}
