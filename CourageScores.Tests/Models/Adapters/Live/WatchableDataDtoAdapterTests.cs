using CourageScores.Models.Adapters.Live;
using CourageScores.Models.Dtos.Live;
using CourageScores.Models.Live;
using NUnit.Framework;

namespace CourageScores.Tests.Models.Adapters.Live;

[TestFixture]
public class WatchableDataDtoAdapterTests
{
    private readonly CancellationToken _token = new CancellationToken();
    private readonly WatchableDataDtoAdapter _adapter = new WatchableDataDtoAdapter();

    [Test]
    public async Task Adapt_GivenSaygPublication_SetsPropertiesCorrectly()
    {
        var sayg = new WebSocketPublication
        {
            Id = Guid.NewGuid(),
            DataType = LiveDataType.Sayg,
            LastUpdate = new DateTimeOffset(2005, 01, 01, 01, 01, 01, TimeSpan.Zero),
        };
        var details = new WebSocketDetail
        {
            Publishing =
            {
                sayg,
            },
            Connected = new DateTimeOffset(2001, 02, 03, 04, 05, 06, TimeSpan.Zero),
            Id = Guid.NewGuid(),
            Subscriptions = { Guid.NewGuid() },
            LastReceipt = new DateTimeOffset(2010, 03, 03, 03, 03, 03, TimeSpan.Zero),
            LastSent = new DateTimeOffset(2020, 04, 04, 04, 04, 04, TimeSpan.Zero),
            OriginatingUrl = "url",
            ReceivedMessages = 1,
            SentMessages = 2,
            UserName = "username",
        };

        var result = await _adapter.Adapt(new WatchableData(details, sayg, PublicationMode.WebSocket), _token);

        Assert.That(result.UserName, Is.EqualTo("username"));
        Assert.That(result.Id, Is.EqualTo(sayg.Id));
        Assert.That(result.LastUpdate, Is.EqualTo(sayg.LastUpdate));
        Assert.That(result.RelativeUrl, Is.EqualTo($"/live/match/{sayg.Id}"));
        Assert.That(result.DataType, Is.EqualTo(LiveDataType.Sayg));
        Assert.That(result.PublicationMode, Is.EqualTo(PublicationMode.WebSocket));
    }

    [Test]
    public async Task Adapt_GivenTournamentPublication_SetsPropertiesCorrectly()
    {
        var tournament = new WebSocketPublication
        {
            Id = Guid.NewGuid(),
            DataType = LiveDataType.Tournament,
            LastUpdate = new DateTimeOffset(2006, 02, 02, 02, 02, 02, TimeSpan.Zero),
        };
        var details = new WebSocketDetail
        {
            Publishing =
            {
                tournament,
            },
            Connected = new DateTimeOffset(2001, 02, 03, 04, 05, 06, TimeSpan.Zero),
            Id = Guid.NewGuid(),
            Subscriptions = { Guid.NewGuid() },
            LastReceipt = new DateTimeOffset(2010, 03, 03, 03, 03, 03, TimeSpan.Zero),
            LastSent = new DateTimeOffset(2020, 04, 04, 04, 04, 04, TimeSpan.Zero),
            OriginatingUrl = "url",
            ReceivedMessages = 1,
            SentMessages = 2,
            UserName = "username",
        };

        var result = await _adapter.Adapt(new WatchableData(details, tournament, PublicationMode.Polling), _token);

        Assert.That(result.UserName, Is.EqualTo("username"));
        Assert.That(result.Id, Is.EqualTo(tournament.Id));
        Assert.That(result.LastUpdate, Is.EqualTo(tournament.LastUpdate));
        Assert.That(result.RelativeUrl, Is.EqualTo($"/tournament/{tournament.Id}"));
        Assert.That(result.DataType, Is.EqualTo(LiveDataType.Tournament));
        Assert.That(result.PublicationMode, Is.EqualTo(PublicationMode.Polling));
    }

    [Test]
    public async Task Adapt_GivenAbsoluteOriginatingUrl_SetsUrlCorrectly()
    {
        var sayg = new WebSocketPublication
        {
            Id = Guid.NewGuid(),
            DataType = LiveDataType.Sayg,
            LastUpdate = new DateTimeOffset(2005, 01, 01, 01, 01, 01, TimeSpan.Zero),
        };
        var details = new WebSocketDetail
        {
            OriginatingUrl = "http://localhost:44426/a/b/c",
        };

        var result = await _adapter.Adapt(new WatchableData(details, sayg, PublicationMode.WebSocket), _token);

        Assert.That(result.AbsoluteUrl, Is.EqualTo($"http://localhost:44426/live/match/{sayg.Id}"));
    }

    [Test]
    public async Task Adapt_GivenAbsoluteOriginatingUrlWithCustomPort_SetsUrlCorrectly()
    {
        var sayg = new WebSocketPublication
        {
            Id = Guid.NewGuid(),
            DataType = LiveDataType.Sayg,
            LastUpdate = new DateTimeOffset(2005, 01, 01, 01, 01, 01, TimeSpan.Zero),
        };
        var details = new WebSocketDetail
        {
            OriginatingUrl = "http://localhost/a/b/c",
        };

        var result = await _adapter.Adapt(new WatchableData(details, sayg, PublicationMode.WebSocket), _token);

        Assert.That(result.AbsoluteUrl, Is.EqualTo($"http://localhost/live/match/{sayg.Id}"));
    }
}