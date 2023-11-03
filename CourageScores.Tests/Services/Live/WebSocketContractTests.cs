using System.Diagnostics.CodeAnalysis;
using System.Net.WebSockets;
using System.Text;
using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Game.Sayg;
using CourageScores.Services;
using CourageScores.Services.Live;
using Moq;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using NUnit.Framework;

namespace CourageScores.Tests.Services.Live;

[TestFixture]
public class WebSocketContractTests
{
    private readonly CancellationToken _token = new CancellationToken();
    private Mock<WebSocket> _socket = null!;
    private RecordingSerializerService _serializerService = null!;
    private Mock<IWebSocketMessageProcessor> _processor = null!;

    private WebSocketContract _contract = null!;
    private Guid _key;
    private Queue<ReceiveResultAndData> _receiveResults = null!;
    private WebSocketCloseStatus? _socketStatus;

    [SetUp]
    public void SetupEachTest()
    {
        _socket = new Mock<WebSocket>();
        _serializerService = new RecordingSerializerService();
        _processor = new Mock<IWebSocketMessageProcessor>();
        _key = Guid.NewGuid();
        _contract = new WebSocketContract(_socket.Object, _serializerService, _processor.Object)
        {
            DataId = _key,
        };
        _receiveResults = new Queue<ReceiveResultAndData>();
        _socket.Setup(s => s.CloseStatus).Returns(() => _socketStatus);

        _socket
            .Setup(s => s.ReceiveAsync(It.IsAny<ArraySegment<byte>>(), _token))
            .ReturnsAsync((ArraySegment<byte> buffer, CancellationToken _) =>
            {
                var receiveResultAndData = _receiveResults.Dequeue();
                Array.Copy(receiveResultAndData.Bytes, buffer.Array!, receiveResultAndData.Bytes.Length);
                _socketStatus = receiveResultAndData.ReceiveResult.CloseStatus;
                return receiveResultAndData.ReceiveResult;
            });
    }

    [Test]
    public async Task Accept_WhenSocketClosed_RemovesAndClosesSocket()
    {
        var noopDto = new LiveMessageDto
        {
            Type = MessageType.Polo,
        };
        _receiveResults.Enqueue(CreateReceiveResult(dto: noopDto));
        _receiveResults.Enqueue(CreateReceiveResult(closeStatus: WebSocketCloseStatus.NormalClosure));

        await _contract.Accept(_token);

        _processor.Verify(p => p.Unregister(_contract));
        _socket.Verify(s => s.CloseAsync(WebSocketCloseStatus.NormalClosure, "", _token));
    }

    [Test]
    public async Task Accept_GivenTaskCanceledWhenClosingSocket_DoesNotThrow()
    {
        var noopDto = new LiveMessageDto
        {
            Type = MessageType.Polo,
        };
        _receiveResults.Enqueue(CreateReceiveResult(dto: noopDto));
        _receiveResults.Enqueue(CreateReceiveResult(closeStatus: WebSocketCloseStatus.NormalClosure));
        _socket
            .Setup(s => s.CloseAsync(It.IsAny<WebSocketCloseStatus>(), It.IsAny<string?>(), _token))
            .Throws<TaskCanceledException>();

        await _contract.Accept(_token);

        _socket.Verify(s => s.CloseAsync(WebSocketCloseStatus.NormalClosure, "", _token));
        // no exception bubbles out
    }

    [Test]
    public async Task Accept_WhenExceptionEncountered_KeepsSocketAssignedAndOpen()
    {
        var noopDto = new LiveMessageDto
        {
            Type = MessageType.Polo,
        };
        _receiveResults.Enqueue(CreateReceiveResult(dto: noopDto));
        _receiveResults.Enqueue(CreateReceiveResult(data: "Invalid JSON data - will trigger an exception"));

        await _contract.Accept(_token);

        _socket.Verify(s => s.CloseAsync(It.IsAny<WebSocketCloseStatus>(), It.IsAny<string?>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Test]
    public async Task Accept_WhenExceptionEncountered_SendsErrorBackToClient()
    {
        var noopDto = new LiveMessageDto
        {
            Type = MessageType.Polo,
        };
        _receiveResults.Enqueue(CreateReceiveResult(dto: noopDto));
        _receiveResults.Enqueue(CreateReceiveResult(data: "Invalid JSON data - will trigger an exception"));

        await _contract.Accept(_token);

        _socket.Verify(s => s.SendAsync(It.IsAny<ArraySegment<byte>>(), WebSocketMessageType.Text, true, _token));
        Assert.That(_serializerService.Serialised.Count, Is.EqualTo(1));
        var serialised = _serializerService.Serialised.Cast<LiveMessageDto>().Single();
        Assert.That(serialised.Type, Is.EqualTo(MessageType.Error));
        Assert.That(serialised.Message, Is.Not.Null.Or.Empty);
    }

    [Test]
    public async Task Accept_WhenDataReceivedOver2Messages_ConsolidatesBothMessagesAndThenProcesses()
    {
        var noopDto = new LiveMessageDto
        {
            Type = MessageType.Marco,
            Message = "Some message",
        };
        var jsonData = JsonConvert.SerializeObject(noopDto);
        var chunk1 = jsonData.Substring(0, 10);
        var chunk2 = jsonData.Substring(10);
        _receiveResults.Enqueue(CreateReceiveResult(data: chunk1, endOfMessage: false));
        _receiveResults.Enqueue(CreateReceiveResult(data: chunk2, endOfMessage: true));
        _receiveResults.Enqueue(CreateReceiveResult(closeStatus: WebSocketCloseStatus.NormalClosure));

        await _contract.Accept(_token);

        _socket.Verify(s => s.SendAsync(It.IsAny<ArraySegment<byte>>(), WebSocketMessageType.Text, true, _token));
        Assert.That(_serializerService.Serialised.Count, Is.EqualTo(1));
        var serialised = _serializerService.Serialised.Cast<LiveMessageDto>().Single();
        Assert.That(serialised.Message, Is.Null);
        Assert.That(serialised.Type, Is.EqualTo(MessageType.Polo));
    }

    [Test]
    public async Task Accept_GivenPolo_SendsNothing()
    {
        var messageDto = new LiveMessageDto
        {
            Type = MessageType.Polo,
        };
        _receiveResults.Enqueue(CreateReceiveResult(dto: messageDto));
        _receiveResults.Enqueue(CreateReceiveResult(closeStatus: WebSocketCloseStatus.NormalClosure));

        await _contract.Accept(_token);

        Assert.That(_serializerService.Serialised, Is.Empty);
        _socket.Verify(s => s.SendAsync(It.IsAny<ArraySegment<byte>>(), It.IsAny<WebSocketMessageType>(), It.IsAny<bool>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Test]
    public async Task Accept_GivenMarco_SendsPolo()
    {
        var messageDto = new LiveMessageDto
        {
            Type = MessageType.Marco,
        };
        _receiveResults.Enqueue(CreateReceiveResult(dto: messageDto));
        _receiveResults.Enqueue(CreateReceiveResult(closeStatus: WebSocketCloseStatus.NormalClosure));

        await _contract.Accept(_token);

        _socket.Verify(s => s.SendAsync(It.IsAny<ArraySegment<byte>>(), WebSocketMessageType.Text, true, _token));
        Assert.That(_serializerService.Serialised.Count, Is.EqualTo(1));
        var serialised = _serializerService.Serialised.Cast<LiveMessageDto>().Single();
        Assert.That(serialised.Message, Is.Null);
        Assert.That(serialised.Type, Is.EqualTo(MessageType.Polo));
    }

    [Test]
    public async Task Accept_GivenUpdateAndNoData_SendsErrorBackToPublisherSocket()
    {
        var messageDto = new LiveMessageDto
        {
            Type = MessageType.Update,
            Data = null,
        };
        _receiveResults.Enqueue(CreateReceiveResult(dto: messageDto));
        _receiveResults.Enqueue(CreateReceiveResult(closeStatus: WebSocketCloseStatus.NormalClosure));

        await _contract.Accept(_token);

        _socket.Verify(s => s.SendAsync(It.IsAny<ArraySegment<byte>>(), WebSocketMessageType.Text, true, _token));
        Assert.That(_serializerService.Serialised.Count, Is.EqualTo(1));
        var serialised = _serializerService.Serialised.Cast<LiveMessageDto>().Single();
        Assert.That(serialised.Type, Is.EqualTo(MessageType.Error));
        Assert.That(serialised.Message, Is.EqualTo("No data supplied"));
    }

    [Test]
    public async Task Accept_GivenUpdateAndSomeData_PublishesUpdate()
    {
        var data = new RecordedScoreAsYouGoDto();
        var messageDto = new LiveMessageDto
        {
            Type = MessageType.Update,
            Data = data,
        };
        _receiveResults.Enqueue(CreateReceiveResult(dto: messageDto));
        _receiveResults.Enqueue(CreateReceiveResult(closeStatus: WebSocketCloseStatus.NormalClosure));

        await _contract.Accept(_token);

       _processor.Verify(p => p.PublishUpdate(_contract, It.IsAny<JObject>(), _token));
    }

    [Test]
    public async Task Send_GivenWebSocketExceptionWhenSendingToAClient_RemovesSocketForClient()
    {
        var messageDto = new LiveMessageDto
        {
            Type = MessageType.Update,
            Data = new RecordedScoreAsYouGoDto
            {
                Id = _key,
                YourName = "Your name",
            },
        };
        _socket
            .Setup(s => s.SendAsync(It.IsAny<ArraySegment<byte>>(), It.IsAny<WebSocketMessageType>(), It.IsAny<bool>(), It.IsAny<CancellationToken>()))
            .Throws<WebSocketException>();

        await _contract.Send(messageDto, _token);

        _socket.Verify(s => s.SendAsync(It.IsAny<ArraySegment<byte>>(), It.IsAny<WebSocketMessageType>(), It.IsAny<bool>(), It.IsAny<CancellationToken>()));
        _processor.Verify(p => p.Unregister(_contract));
    }

    private static ReceiveResultAndData CreateReceiveResult(
        bool endOfMessage = true,
        WebSocketCloseStatus? closeStatus = null,
        string data = "",
        LiveMessageDto? dto = null)
    {
        var dataBytes = Encoding.UTF8.GetBytes(dto != null
            ? JsonConvert.SerializeObject(dto)
            : data);

        return new ReceiveResultAndData(
            new WebSocketReceiveResult(
                dataBytes.Length,
                WebSocketMessageType.Text,
                endOfMessage,
                closeStatus,
                ""),
            dataBytes);
    }

    private class ReceiveResultAndData
    {
        public ReceiveResultAndData(WebSocketReceiveResult receiveResult, byte[] bytes)
        {
            ReceiveResult = receiveResult;
            Bytes = bytes;
        }

        // ReSharper disable MemberHidesStaticFromOuterClass
        public WebSocketReceiveResult ReceiveResult { get; }
        // ReSharper restore MemberHidesStaticFromOuterClass
        public byte[] Bytes { get; }
    }

    [SuppressMessage("ReSharper", "IdentifierTypo")]
    private class RecordingSerializerService : IJsonSerializerService
    {
        private readonly IJsonSerializerService _underlying = new JsonSerializerService(new JsonSerializer());

        public List<object?> Serialised { get; } = new();

        public string SerialiseToString<T>(T value)
        {
            Serialised.Add(value);
            return _underlying.SerialiseToString(value);
        }

        public T DeserialiseTo<T>(Stream stream)
        {
            return _underlying.DeserialiseTo<T>(stream);
        }

        public T DeserialiseTo<T>(string json)
        {
            return _underlying.DeserialiseTo<T>(json);
        }
    }
}