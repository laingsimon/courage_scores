using System.Collections.Concurrent;
using CourageScores.Models.Dtos.Identity;
using CourageScores.Models.Dtos.Live;
using CourageScores.Services;
using CourageScores.Services.Identity;
using CourageScores.Services.Live;
using Moq;
using NUnit.Framework;

namespace CourageScores.Tests.Services.Live;

[TestFixture]
public class PollingUpdatesProcessorTests
{
    private readonly CancellationToken _token = new CancellationToken();
    private PollingUpdatesProcessor _processor = null!;
    private ConcurrentDictionary<Guid, PollingUpdatesProcessor.UpdateData> _data = null!;
    private Mock<IWebSocketContract> _socket = null!;
    private Mock<TimeProvider> _clock = null!;
    private Mock<IUserService> _userService = null!;
    private UserDto? _user;

    [SetUp]
    public void SetupEachTest()
    {
        _socket = new Mock<IWebSocketContract>();
        _data = new ConcurrentDictionary<Guid, PollingUpdatesProcessor.UpdateData>();
        _clock = new Mock<TimeProvider>();
        _userService = new Mock<IUserService>();

        _processor = new PollingUpdatesProcessor(_data, _clock.Object, _userService.Object);

        _userService.Setup(s => s.GetUser(_token)).ReturnsAsync(() => _user);
    }

    [Test]
    public void Disconnected_WhenCalled_DoesNothing()
    {
        Assert.That(() => _processor.Disconnected(_socket.Object), Throws.Nothing);
    }

    [Test]
    public async Task PublishUpdate_GivenFirstUpdate_RecordsData()
    {
        var now = new DateTimeOffset(2020, 01, 02, 03, 04, 05, 06, TimeSpan.Zero);
        var times = new Queue<DateTimeOffset>(new[]
        {
            now,
        });
        var id = Guid.NewGuid();
        _clock.Setup(c => c.GetUtcNow()).Returns(() => times.Dequeue());
        _user = new UserDto { Name = "USER" };

        await _processor.PublishUpdate(_socket.Object, id, LiveDataType.Sayg, "DATA", _token);

        Assert.That(_data.Keys, Has.Member(id));
        Assert.That(_data[id].Data, Is.EqualTo("DATA"));
        Assert.That(_data[id].Updated, Is.EqualTo(now));
        Assert.That(_data[id].Type, Is.EqualTo(LiveDataType.Sayg));
        Assert.That(_data[id].UserName, Is.EqualTo("USER"));
    }

    [Test]
    public async Task PublishUpdate_GivenSubsequentUpdate_RecordsUpdatedData()
    {
        var now = new DateTimeOffset(2020, 01, 02, 03, 04, 05, 06, TimeSpan.Zero);
        var next = new DateTimeOffset(2021, 02, 03, 04, 05, 06, 07, TimeSpan.FromHours(1));
        var times = new Queue<DateTimeOffset>(new[]
        {
            now,
            next,
        });
        var id = Guid.NewGuid();
        _clock.Setup(c => c.GetUtcNow()).Returns(() => times.Dequeue());
        _user = new UserDto { Name = "USER" };

        await _processor.PublishUpdate(_socket.Object, id, LiveDataType.Tournament, "DATA", _token);
        await _processor.PublishUpdate(_socket.Object, id, LiveDataType.Tournament, "NEW DATA", _token);

        Assert.That(_data.Keys, Has.Member(id));
        Assert.That(_data[id].Data, Is.EqualTo("NEW DATA"));
        Assert.That(_data[id].Updated, Is.EqualTo(next));
        Assert.That(_data[id].Type, Is.EqualTo(LiveDataType.Tournament));
        Assert.That(_data[id].UserName, Is.EqualTo("USER"));
    }

    [Test]
    public async Task GetUpdate_GivenUntrackedId_ReturnsNull()
    {
        var now = new DateTimeOffset(2021, 02, 03, 04, 05, 06, 07, TimeSpan.FromHours(1));
        var id = Guid.NewGuid();

        var update = await _processor.GetUpdate(id, LiveDataType.Sayg, now);

        Assert.That(update, Is.Null);
    }

    [Test]
    public async Task GetUpdate_WhenTrackedDataUnchangedSinceDate_ReturnsMetaDataWithUpdatedDate()
    {
        var then = new DateTimeOffset(2020, 01, 02, 03, 04, 05, 06, TimeSpan.Zero);
        var now = new DateTimeOffset(2021, 02, 03, 04, 05, 06, 07, TimeSpan.FromHours(1));
        var times = new Queue<DateTimeOffset>(new[]
        {
            then,
            now,
        });
        var id = Guid.NewGuid();
        _clock.Setup(c => c.GetUtcNow()).Returns(() => times.Dequeue());
        await _processor.PublishUpdate(_socket.Object, id, LiveDataType.Sayg, "DATA", _token); // @ then

        var update = await _processor.GetUpdate(id, LiveDataType.Sayg, now);

        Assert.That(update, Is.Not.Null);
        Assert.That(update!.Updated, Is.EqualTo(then));
        Assert.That(update.Data, Is.Null);
    }

    [Test]
    public async Task GetUpdate_GivenNullSinceAndDataTracked_ReturnsData()
    {
        var then = new DateTimeOffset(2020, 01, 02, 03, 04, 05, 06, TimeSpan.Zero);
        var now = new DateTimeOffset(2021, 02, 03, 04, 05, 06, 07, TimeSpan.FromHours(1));
        var times = new Queue<DateTimeOffset>(new[]
        {
            then,
            now,
        });
        var id = Guid.NewGuid();
        _clock.Setup(c => c.GetUtcNow()).Returns(() => times.Dequeue());
        await _processor.PublishUpdate(_socket.Object, id, LiveDataType.Sayg, "DATA", _token); // @ then

        var update = await _processor.GetUpdate(id, LiveDataType.Sayg, null);

        Assert.That(update, Is.Not.Null);
        Assert.That(update!.Updated, Is.EqualTo(then));
        Assert.That(update.Data, Is.EqualTo("DATA"));
    }

    [Test]
    public async Task GetUpdate_WhenTrackedDataChangedSinceDate_ReturnsData()
    {
        var then = new DateTimeOffset(2020, 01, 02, 03, 04, 05, 06, TimeSpan.Zero);
        var now = new DateTimeOffset(2021, 02, 03, 04, 05, 06, 07, TimeSpan.FromHours(1));
        var times = new Queue<DateTimeOffset>(new[]
        {
            then,
            now,
        });
        var id = Guid.NewGuid();
        _clock.Setup(c => c.GetUtcNow()).Returns(() => times.Dequeue());
        await _processor.PublishUpdate(_socket.Object, id, LiveDataType.Sayg, "DATA", _token); // @ then

        var update = await _processor.GetUpdate(id, LiveDataType.Sayg, then.AddMinutes(-1));

        Assert.That(update, Is.Not.Null);
        Assert.That(update!.Updated, Is.EqualTo(then));
        Assert.That(update.Data, Is.EqualTo("DATA"));
    }

    [Test]
    public async Task GetWatchableData_WhenNoUpdates_ReturnsEmpty()
    {
        var watchableData = await _processor.GetWatchableData(_token).ToList();

        Assert.That(watchableData, Is.Empty);
    }

    [Test]
    public async Task GetWatchableData_WhenUpdate_ReturnsWatchableData()
    {
        var updateTime = new DateTimeOffset(2020, 01, 02, 03, 04, 05, 06, TimeSpan.Zero);
        var times = new Queue<DateTimeOffset>(new[]
        {
            updateTime,
        });
        var id = Guid.NewGuid();
        _clock.Setup(c => c.GetUtcNow()).Returns(() => times.Dequeue());
        _user = new UserDto { Name = "USER" };

        await _processor.PublishUpdate(_socket.Object, id, LiveDataType.Sayg, "DATA", _token);

        var watchableData = await _processor.GetWatchableData(_token).ToList();

        Assert.That(watchableData.Select(d => d.Publication.Id), Is.EquivalentTo(new[] { id }));
        Assert.That(watchableData.Select(d => d.Publication.DataType), Is.EquivalentTo(new[] { LiveDataType.Sayg }));
        Assert.That(watchableData.Select(d => d.Publication.LastUpdate), Is.EquivalentTo(new[] { updateTime }));
        Assert.That(watchableData.Select(d => d.Connection.UserName), Is.EquivalentTo(new[] { "USER" }));
    }
}