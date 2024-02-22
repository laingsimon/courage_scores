using System.Collections.Concurrent;
using CourageScores.Models.Dtos.Live;
using CourageScores.Services.Live;
using Microsoft.AspNetCore.Authentication;
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
    private Mock<ISystemClock> _clock = null!;

    [SetUp]
    public void SetupEachTest()
    {
        _socket = new Mock<IWebSocketContract>();
        _data = new ConcurrentDictionary<Guid, PollingUpdatesProcessor.UpdateData>();
        _clock = new Mock<ISystemClock>();

        _processor = new PollingUpdatesProcessor(_data, _clock.Object);
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
        _clock.Setup(c => c.UtcNow).Returns(() => times.Dequeue());

        await _processor.PublishUpdate(_socket.Object, id, "DATA", _token);

        Assert.That(_data.Keys, Has.Member(id));
        Assert.That(_data[id].Data, Is.EqualTo("DATA"));
        Assert.That(_data[id].Updated, Is.EqualTo(now));
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
        _clock.Setup(c => c.UtcNow).Returns(() => times.Dequeue());

        await _processor.PublishUpdate(_socket.Object, id, "DATA", _token);
        await _processor.PublishUpdate(_socket.Object, id, "NEW DATA", _token);

        Assert.That(_data.Keys, Has.Member(id));
        Assert.That(_data[id].Data, Is.EqualTo("NEW DATA"));
        Assert.That(_data[id].Updated, Is.EqualTo(next));
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
        _clock.Setup(c => c.UtcNow).Returns(() => times.Dequeue());
        await _processor.PublishUpdate(_socket.Object, id, "DATA", _token); // @ then

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
        _clock.Setup(c => c.UtcNow).Returns(() => times.Dequeue());
        await _processor.PublishUpdate(_socket.Object, id, "DATA", _token); // @ then

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
        _clock.Setup(c => c.UtcNow).Returns(() => times.Dequeue());
        await _processor.PublishUpdate(_socket.Object, id, "DATA", _token); // @ then

        var update = await _processor.GetUpdate(id, LiveDataType.Sayg, then.AddMinutes(-1));

        Assert.That(update, Is.Not.Null);
        Assert.That(update!.Updated, Is.EqualTo(then));
        Assert.That(update.Data, Is.EqualTo("DATA"));
    }
}