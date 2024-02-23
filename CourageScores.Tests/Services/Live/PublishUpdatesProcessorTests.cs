using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Game.Sayg;
using CourageScores.Models.Dtos.Live;
using CourageScores.Services.Live;
using Moq;
using NUnit.Framework;

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

    [SetUp]
    public void SetupEachTest()
    {
        _publisherSocket = new Mock<IWebSocketContract>();
        _subscriberSocket = new Mock<IWebSocketContract>();
        _sockets = new List<IWebSocketContract>(new[]
        {
            _publisherSocket.Object, _subscriberSocket.Object
        });
        _processor = new PublishUpdatesProcessor(_sockets);
        _key = Guid.NewGuid();

        _publisherSocket.Setup(s => s.IsSubscribedTo(_key)).Returns(true);
        _subscriberSocket.Setup(s => s.IsSubscribedTo(_key)).Returns(true);
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