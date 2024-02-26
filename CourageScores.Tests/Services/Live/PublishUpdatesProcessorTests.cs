using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Game.Sayg;
using CourageScores.Models.Dtos.Live;
using CourageScores.Models.Live;
using CourageScores.Services.Live;
using Microsoft.AspNetCore.Authentication;
using Moq;
using NUnit.Framework;
using DateTimeOffset = System.DateTimeOffset;

namespace CourageScores.Tests.Services.Live;

[TestFixture]
public class PublishUpdatesProcessorTests
{
    private readonly CancellationToken _token = new CancellationToken();
    private List<IWebSocketContract> _sockets = null!;
    private Mock<IWebSocketContract> _publisherSocket = null!;
    private Mock<IWebSocketContract> _subscriberSocket = null!;
    private PublishUpdatesProcessor _processor = null!;
    private Guid _key;
    private WebSocketDetail _publisherDetails = null!;
    private Mock<ISystemClock> _clock = null!;
    private DateTimeOffset _now;

    [SetUp]
    public void SetupEachTest()
    {
        _publisherSocket = new Mock<IWebSocketContract>();
        _subscriberSocket = new Mock<IWebSocketContract>();
        _sockets = new List<IWebSocketContract>(new[]
        {
            _publisherSocket.Object, _subscriberSocket.Object
        });
        _clock = new Mock<ISystemClock>();
        _processor = new PublishUpdatesProcessor(_sockets, _clock.Object);
        _key = Guid.NewGuid();
        _publisherDetails = new WebSocketDetail();

        _publisherSocket.Setup(s => s.IsSubscribedTo(_key)).Returns(true);
        _subscriberSocket.Setup(s => s.IsSubscribedTo(_key)).Returns(true);
        _publisherSocket.Setup(s => s.Details).Returns(_publisherDetails);
        _clock.Setup(c => c.UtcNow).Returns(() => _now);
    }

    [Test]
    public async Task PublishUpdate_GivenNoPublicationDetailsForId_AddsPublicationDetails()
    {
        var data = new RecordedScoreAsYouGoDto
        {
            Id = _key,
        };
        _now = new DateTimeOffset(2001, 02, 03, 04, 05, 06, TimeSpan.Zero);

        await _processor.PublishUpdate(_publisherSocket.Object, _key, LiveDataType.Sayg, data, _token);

        Assert.That(_publisherDetails.Publishing.Select(p => p.Id), Is.EquivalentTo(new[] { _key }));
        Assert.That(_publisherDetails.Publishing.Select(p => p.DataType), Is.EquivalentTo(new[] { LiveDataType.Sayg }));
        Assert.That(_publisherDetails.Publishing.Select(p => p.LastUpdate), Is.EquivalentTo(new[] { new DateTimeOffset(2001, 02, 03, 04, 05, 06, TimeSpan.Zero) }));
    }

    [Test]
    public async Task PublishUpdate_GivenPublicationDetailsForId_UpdatesPublicationDetails()
    {
        var data = new RecordedScoreAsYouGoDto
        {
            Id = _key,
        };
        _publisherDetails.Publishing.Add(new WebSocketPublication
        {
            Id = _key,
            DataType = LiveDataType.Sayg,
            LastUpdate = new DateTimeOffset(2000, 01, 01, 0, 0, 0, TimeSpan.Zero),
        });
        _now = new DateTimeOffset(2001, 02, 03, 04, 05, 06, TimeSpan.Zero);

        await _processor.PublishUpdate(_publisherSocket.Object, _key, LiveDataType.Sayg, data, _token);

        Assert.That(_publisherDetails.Publishing.Select(p => p.Id), Is.EquivalentTo(new[] { _key }));
        Assert.That(_publisherDetails.Publishing.Select(p => p.DataType), Is.EquivalentTo(new[] { LiveDataType.Sayg }));
        Assert.That(_publisherDetails.Publishing.Select(p => p.LastUpdate), Is.EquivalentTo(new[] { new DateTimeOffset(2001, 02, 03, 04, 05, 06, TimeSpan.Zero) }));
    }

    [Test]
    public async Task PublishUpdate_GivenUpdateAndNoClients_DoesNotSendToPublisherSocket()
    {
        var data = new RecordedScoreAsYouGoDto
        {
            Id = _key,
        };

        await _processor.PublishUpdate(_publisherSocket.Object, _key, LiveDataType.Sayg, data, _token);

        _publisherSocket.Verify(s => s.Send(It.IsAny<LiveMessageDto>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Test]
    public async Task PublishUpdate_GivenUpdateAndSomeClients_SendsToSubscriberSockets()
    {
        var data = new RecordedScoreAsYouGoDto
        {
            Id = _key,
            YourName = "Your Name",
        };

        await _processor.PublishUpdate(_publisherSocket.Object, _key, LiveDataType.Sayg, data, _token);

        _subscriberSocket.Verify(s => s.Send(
            It.Is<LiveMessageDto>(dto => dto.Type == MessageType.Update && dto.Data == data),
            _token));
    }

    [Test]
    public async Task PublishUpdate_WhenExceptionOnFirstClient_SendsToSubsequentSockets()
    {
        var errorSocket = new Mock<IWebSocketContract>();
        var data = new RecordedScoreAsYouGoDto
        {
            Id = _key,
            YourName = "Your Name",
        };
        _sockets.Insert(0, errorSocket.Object);
        errorSocket.Setup(s => s.Send(It.IsAny<LiveMessageDto>(), _token)).Throws<InvalidOperationException>();
        errorSocket.Setup(s => s.IsSubscribedTo(_key)).Returns(true);

        await _processor.PublishUpdate(_publisherSocket.Object, _key, LiveDataType.Sayg, data, _token);

        errorSocket.Verify(s => s.Send(
            It.IsAny<LiveMessageDto>(),
            _token));
        _subscriberSocket.Verify(s => s.Send(
            It.IsAny<LiveMessageDto>(),
            _token));
    }

    [Test]
    public void Disconnected_WhenCalled_RemovesSocket()
    {
        _processor.Disconnected(_publisherSocket.Object);

        Assert.That(_sockets, Is.EquivalentTo(new[] { _subscriberSocket.Object }));
    }
}