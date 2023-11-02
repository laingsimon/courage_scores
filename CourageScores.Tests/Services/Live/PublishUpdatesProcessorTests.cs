using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Game.Sayg;
using CourageScores.Services.Live;
using Moq;
using NUnit.Framework;

namespace CourageScores.Tests.Services.Live;

[TestFixture]
public class PublishUpdatesProcessorTests
{
    private readonly CancellationToken _token = new CancellationToken();
    private Mock<IGroupedCollection<IWebSocketContract>> _sockets = null!;
    private Mock<IWebSocketContract> _publisherSocket = null!;
    private Mock<IWebSocketContract> _subscriberSocket = null!;
    private PublishUpdatesProcessor _processor = null!;
    private List<IWebSocketContract> _activeSockets = null!;
    private Guid _key;

    [SetUp]
    public void SetupEachTest()
    {
        _sockets = new Mock<IGroupedCollection<IWebSocketContract>>();
        _processor = new PublishUpdatesProcessor(_sockets.Object);
        _publisherSocket = new Mock<IWebSocketContract>();
        _subscriberSocket = new Mock<IWebSocketContract>();
        _activeSockets = new List<IWebSocketContract>(new[]
        {
            _publisherSocket.Object, _subscriberSocket.Object
        });
        _key = Guid.NewGuid();

        _sockets.Setup(s => s.GetItems(_key)).Returns(() => _activeSockets.ToArray());
        _publisherSocket.Setup(s => s.DataId).Returns(_key);
        _subscriberSocket.Setup(s => s.DataId).Returns(_key);
    }

    [Test]
    public async Task PublishUpdate_GivenUpdateAndNoClients_DoesNotSendToPublisherSocket()
    {
        var data = new RecordedScoreAsYouGoDto
        {
            Id = _key,
        };

        await _processor.PublishUpdate(_publisherSocket.Object, data, _token);

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

        await _processor.PublishUpdate(_publisherSocket.Object, data, _token);

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
        _activeSockets.Insert(0, errorSocket.Object);
        errorSocket.Setup(s => s.Send(It.IsAny<LiveMessageDto>(), _token)).Throws<InvalidOperationException>();

        await _processor.PublishUpdate(_publisherSocket.Object, data, _token);

        errorSocket.Verify(s => s.Send(
            It.IsAny<LiveMessageDto>(),
            _token));
        _subscriberSocket.Verify(s => s.Send(
            It.IsAny<LiveMessageDto>(),
            _token));
    }

    [Test]
    public void Unregister_WhenCalled_RemovesSocket()
    {
        _publisherSocket.Setup(s => s.DataId).Returns(_key);

        _processor.Unregister(_publisherSocket.Object);

        _sockets.Verify(s => s.Remove(_key, _publisherSocket.Object));
    }
}