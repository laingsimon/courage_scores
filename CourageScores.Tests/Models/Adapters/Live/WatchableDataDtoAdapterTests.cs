using CourageScores.Models.Adapters.Live;
using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Cosmos.Game.Sayg;
using CourageScores.Models.Dtos.Game;
using CourageScores.Models.Dtos.Game.Sayg;
using CourageScores.Models.Dtos.Live;
using CourageScores.Models.Live;
using CourageScores.Services;
using Moq;
using NUnit.Framework;

namespace CourageScores.Tests.Models.Adapters.Live;

[TestFixture]
public class WatchableDataDtoAdapterTests
{
    private static readonly DateTimeOffset LastUpdate01Jan2005 = new DateTimeOffset(2005, 01, 01, 01, 01, 01, TimeSpan.Zero);
    private static readonly DateTimeOffset LastUpdate02Feb2006 = new DateTimeOffset(2006, 02, 02, 02, 02, 02, TimeSpan.Zero);
    private static readonly TournamentGameDto Tournament = new TournamentGameDto
    {
        Id = Guid.NewGuid(),
        Type = "TYPE",
        Address = "ADDRESS",
    };
    private static readonly RecordedScoreAsYouGoDto RecordedSayg = new RecordedScoreAsYouGoDto
    {
        Id = Guid.NewGuid(),
        YourName = "CHALLENGER",
        OpponentName = "OPPONENT",
    };

    private readonly CancellationToken _token = new CancellationToken();
    private WatchableDataDtoAdapter _adapter = null!;
    private Mock<IGenericDataService<TournamentGame, TournamentGameDto>> _tournamentService = null!;
    private Mock<IGenericDataService<RecordedScoreAsYouGo, RecordedScoreAsYouGoDto>> _saygService = null!;

    [SetUp]
    public void SetupEachTest()
    {
        _tournamentService = new Mock<IGenericDataService<TournamentGame, TournamentGameDto>>();
        _saygService = new Mock<IGenericDataService<RecordedScoreAsYouGo, RecordedScoreAsYouGoDto>>();
        _adapter = new WatchableDataDtoAdapter(_tournamentService.Object, _saygService.Object);
    }

    [Test]
    public async Task Adapt_GivenSaygPublication_SetsPropertiesCorrectly()
    {
        var sayg = GetWebSocketPublication(dataType: LiveDataType.Sayg, lastUpdate: LastUpdate01Jan2005);
        var details = GetWebSocketDetail(sayg);

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
        var tournament = GetWebSocketPublication(dataType: LiveDataType.Tournament, lastUpdate: LastUpdate02Feb2006);
        var details = GetWebSocketDetail(tournament);

        var result = await _adapter.Adapt(new WatchableData(details, tournament, PublicationMode.Polling), _token);

        Assert.That(result.UserName, Is.EqualTo("username"));
        Assert.That(result.Id, Is.EqualTo(tournament.Id));
        Assert.That(result.LastUpdate, Is.EqualTo(tournament.LastUpdate));
        Assert.That(result.RelativeUrl, Is.EqualTo($"/tournament/{tournament.Id}"));
        Assert.That(result.DataType, Is.EqualTo(LiveDataType.Tournament));
        Assert.That(result.PublicationMode, Is.EqualTo(PublicationMode.Polling));
    }

    [Test]
    public async Task Adapt_GivenUnknownDataTypePublication_SetsPropertiesCorrectly()
    {
        var tournament = GetWebSocketPublication(dataType: (LiveDataType)4, lastUpdate: LastUpdate02Feb2006);
        var details = GetWebSocketDetail(tournament);

        var result = await _adapter.Adapt(new WatchableData(details, tournament, PublicationMode.Polling), _token);

        Assert.That(result.UserName, Is.EqualTo("username"));
        Assert.That(result.Id, Is.EqualTo(tournament.Id));
        Assert.That(result.LastUpdate, Is.EqualTo(tournament.LastUpdate));
        Assert.That(result.RelativeUrl, Is.EqualTo("/"));
        Assert.That(result.DataType, Is.EqualTo((LiveDataType)4));
        Assert.That(result.PublicationMode, Is.EqualTo(PublicationMode.Polling));
    }

    [Test]
    public async Task Adapt_GivenAbsoluteOriginatingUrl_SetsUrlCorrectly()
    {
        var sayg = GetWebSocketPublication(dataType: LiveDataType.Sayg, lastUpdate: LastUpdate01Jan2005);
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
        var sayg = GetWebSocketPublication(dataType: LiveDataType.Sayg, lastUpdate: LastUpdate01Jan2005);
        var details = new WebSocketDetail
        {
            OriginatingUrl = "http://localhost/a/b/c",
        };

        var result = await _adapter.Adapt(new WatchableData(details, sayg, PublicationMode.WebSocket), _token);

        Assert.That(result.AbsoluteUrl, Is.EqualTo($"http://localhost/live/match/{sayg.Id}"));
    }

    [Test]
    public async Task Adapt_GivenNullOriginatingUrl_SetsAbsoluteUrlToNull()
    {
        var sayg = GetWebSocketPublication(dataType: LiveDataType.Sayg, lastUpdate: LastUpdate01Jan2005);
        var details = new WebSocketDetail
        {
            OriginatingUrl = null,
        };

        var result = await _adapter.Adapt(new WatchableData(details, sayg, PublicationMode.WebSocket), _token);

        Assert.That(result.AbsoluteUrl, Is.Null);
    }

    [Test]
    public async Task Adapt_GivenEmptyOriginatingUrl_SetsAbsoluteUrlToNull()
    {
        var sayg = GetWebSocketPublication(dataType: LiveDataType.Sayg, lastUpdate: LastUpdate01Jan2005);
        var details = new WebSocketDetail
        {
            OriginatingUrl = "",
        };

        var result = await _adapter.Adapt(new WatchableData(details, sayg, PublicationMode.WebSocket), _token);

        Assert.That(result.AbsoluteUrl, Is.Null);
    }

    [Test]
    public async Task Adapt_GivenSaygTypeAndMissingSaygData_ReturnsNullEventDetails()
    {
        var publication = GetWebSocketPublication(dataType: LiveDataType.Sayg, lastUpdate: LastUpdate02Feb2006);
        var details = GetWebSocketDetail(publication);
        _saygService.Setup(s => s.Get(publication.Id, _token)).ReturnsAsync(() => null);

        var result = await _adapter.Adapt(new WatchableData(details, publication, PublicationMode.Polling), _token);

        Assert.That(result.EventDetails, Is.Null);
    }

    [Test]
    public async Task Adapt_GivenSaygTypeAndNullOriginatingUrl_ReturnsOpponentsOnly()
    {
        var publication = GetWebSocketPublication(id: RecordedSayg.Id, dataType: LiveDataType.Sayg, lastUpdate: LastUpdate02Feb2006);
        var details = GetWebSocketDetail(publication, originatingUrl: null);
        _saygService.Setup(s => s.Get(RecordedSayg.Id, _token)).ReturnsAsync(RecordedSayg);

        var result = await _adapter.Adapt(new WatchableData(details, publication, PublicationMode.Polling), _token);

        Assert.That(result.EventDetails, Is.Not.Null);
        Assert.That(result.EventDetails!.Type, Is.Null);
        Assert.That(result.EventDetails!.Venue, Is.Null);
        Assert.That(result.EventDetails!.Opponents, Is.EqualTo(new[] { "CHALLENGER", "OPPONENT" }));
    }

    [Test]
    public async Task Adapt_GivenSaygTypeAndEmptyOriginatingUrl_ReturnsOpponentsOnly()
    {
        var publication = GetWebSocketPublication(id: RecordedSayg.Id, dataType: LiveDataType.Sayg, lastUpdate: LastUpdate02Feb2006);
        var details = GetWebSocketDetail(publication, originatingUrl: "");
        _saygService.Setup(s => s.Get(RecordedSayg.Id, _token)).ReturnsAsync(RecordedSayg);

        var result = await _adapter.Adapt(new WatchableData(details, publication, PublicationMode.Polling), _token);

        Assert.That(result.EventDetails, Is.Not.Null);
        Assert.That(result.EventDetails!.Type, Is.Null);
        Assert.That(result.EventDetails!.Venue, Is.Null);
        Assert.That(result.EventDetails!.Opponents, Is.EqualTo(new[] { "CHALLENGER", "OPPONENT" }));
    }

    [Test]
    public async Task Adapt_GivenSaygTypeAndShortOriginatingUrl_ReturnsOpponentsOnly()
    {
        var publication = GetWebSocketPublication(id: RecordedSayg.Id, dataType: LiveDataType.Sayg, lastUpdate: LastUpdate02Feb2006);
        var details = GetWebSocketDetail(
            publication,
            originatingUrl: "http://short");  // shorter than a guid (36 chars)
        _saygService.Setup(s => s.Get(RecordedSayg.Id, _token)).ReturnsAsync(RecordedSayg);

        var result = await _adapter.Adapt(new WatchableData(details, publication, PublicationMode.Polling), _token);

        Assert.That(result.EventDetails, Is.Not.Null);
        Assert.That(result.EventDetails!.Type, Is.Null);
        Assert.That(result.EventDetails!.Venue, Is.Null);
        Assert.That(result.EventDetails!.Opponents, Is.EqualTo(new[] { "CHALLENGER", "OPPONENT" }));
    }

    [Test]
    public async Task Adapt_GivenSaygTypeAndOriginatingUrlNotContainingAGuid_ReturnsOpponentsOnly()
    {
        var publication = GetWebSocketPublication(id: RecordedSayg.Id, dataType: LiveDataType.Sayg, lastUpdate: LastUpdate02Feb2006);
        var details = GetWebSocketDetail(
            publication,
            originatingUrl: "http://some-url/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"); // invalid guid data
        _saygService.Setup(s => s.Get(RecordedSayg.Id, _token)).ReturnsAsync(RecordedSayg);

        var result = await _adapter.Adapt(new WatchableData(details, publication, PublicationMode.Polling), _token);

        Assert.That(result.EventDetails, Is.Not.Null);
        Assert.That(result.EventDetails!.Type, Is.Null);
        Assert.That(result.EventDetails!.Venue, Is.Null);
        Assert.That(result.EventDetails!.Opponents, Is.EqualTo(new[] { "CHALLENGER", "OPPONENT" }));
    }

    [Test]
    public async Task Adapt_GivenSaygTypeAndOriginatingUrlWithoutQueryString_ReturnsOpponentsAndTournamentDetails()
    {
        var publication = GetWebSocketPublication(id: RecordedSayg.Id, dataType: LiveDataType.Sayg, lastUpdate: LastUpdate02Feb2006);
        var details = GetWebSocketDetail(publication, originatingUrl: $"http://some-url/path/{Tournament.Id}");
        _saygService.Setup(s => s.Get(RecordedSayg.Id, _token)).ReturnsAsync(RecordedSayg);
        _tournamentService.Setup(s => s.Get(Tournament.Id, _token)).ReturnsAsync(Tournament);

        var result = await _adapter.Adapt(new WatchableData(details, publication, PublicationMode.Polling), _token);

        Assert.That(result.EventDetails, Is.Not.Null);
        Assert.That(result.EventDetails!.Type, Is.EqualTo("TYPE"));
        Assert.That(result.EventDetails!.Venue, Is.EqualTo("ADDRESS"));
        Assert.That(result.EventDetails!.Opponents, Is.EqualTo(new[] { "CHALLENGER", "OPPONENT" }));
    }

    [Test]
    public async Task Adapt_GivenSaygTypeAndOriginatingUrlWithQueryString_ReturnsOpponentsAndTournamentDetails()
    {
        var publication = GetWebSocketPublication(id: RecordedSayg.Id, dataType: LiveDataType.Sayg, lastUpdate: LastUpdate02Feb2006);
        var details = GetWebSocketDetail(publication, originatingUrl: $"http://some-url/path/{Tournament.Id}/?some-query-string");
        _saygService.Setup(s => s.Get(RecordedSayg.Id, _token)).ReturnsAsync(RecordedSayg);
        _tournamentService.Setup(s => s.Get(Tournament.Id, _token)).ReturnsAsync(Tournament);

        var result = await _adapter.Adapt(new WatchableData(details, publication, PublicationMode.Polling), _token);

        Assert.That(result.EventDetails, Is.Not.Null);
        Assert.That(result.EventDetails!.Type, Is.EqualTo("TYPE"));
        Assert.That(result.EventDetails!.Venue, Is.EqualTo("ADDRESS"));
        Assert.That(result.EventDetails!.Opponents, Is.EqualTo(new[] { "CHALLENGER", "OPPONENT" }));
    }

    [Test]
    public async Task Adapt_GivenTournamentTypeAndMissingTournamentData_ReturnsNullEventDetails()
    {
        var publication = GetWebSocketPublication(dataType: LiveDataType.Tournament, lastUpdate: LastUpdate02Feb2006);
        var details = GetWebSocketDetail(publication);
        _tournamentService.Setup(s => s.Get(publication.Id, _token)).ReturnsAsync(() => null);

        var result = await _adapter.Adapt(new WatchableData(details, publication, PublicationMode.Polling), _token);

        Assert.That(result.EventDetails, Is.Null);
    }

    [Test]
    public async Task Adapt_GivenTournamentTypeAndTournamentData_ReturnsAddressAndType()
    {
        var publication = GetWebSocketPublication(id: Tournament.Id, dataType: LiveDataType.Tournament, lastUpdate: LastUpdate02Feb2006);
        var details = GetWebSocketDetail(publication);
        _tournamentService.Setup(s => s.Get(Tournament.Id, _token)).ReturnsAsync(Tournament);

        var result = await _adapter.Adapt(new WatchableData(details, publication, PublicationMode.Polling), _token);

        Assert.That(result.EventDetails, Is.Not.Null);
        Assert.That(result.EventDetails!.Type, Is.EqualTo("TYPE"));
        Assert.That(result.EventDetails!.Venue, Is.EqualTo("ADDRESS"));
    }

    private static WebSocketDetail GetWebSocketDetail(WebSocketPublication publication, string? originatingUrl = "url")
    {
        return new WebSocketDetail
        {
            Publishing =
            {
                publication,
            },
            Connected = new DateTimeOffset(2001, 02, 03, 04, 05, 06, TimeSpan.Zero),
            Id = Guid.NewGuid(),
            Subscriptions =
            {
                Guid.NewGuid(),
            },
            LastReceipt = new DateTimeOffset(2010, 03, 03, 03, 03, 03, TimeSpan.Zero),
            LastSent = new DateTimeOffset(2020, 04, 04, 04, 04, 04, TimeSpan.Zero),
            OriginatingUrl = originatingUrl,
            ReceivedMessages = 1,
            SentMessages = 2,
            UserName = "username",
        };
    }

    private static WebSocketPublication GetWebSocketPublication(Guid? id = null, LiveDataType dataType = LiveDataType.Sayg, DateTimeOffset? lastUpdate = null)
    {
        return new WebSocketPublication
        {
            Id = id ?? Guid.NewGuid(),
            DataType = dataType,
            LastUpdate = lastUpdate ?? new DateTimeOffset(2005, 01, 01, 01, 01, 01, TimeSpan.Zero),
        };
    }
}