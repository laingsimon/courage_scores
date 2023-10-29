using System.Collections;
using System.Net.WebSockets;
using System.Text;
using CourageScores.Models.Dtos.Game.Sayg;
using CourageScores.Services;
using CourageScores.Services.Game;
using Newtonsoft.Json;
using NUnit.Framework;

namespace CourageScores.Tests.Services.Game;

[TestFixture]
public class SaygLiveServiceTests
{
    private readonly CancellationToken _token = new CancellationToken();
    private JsonSerializerService _serializerService = null!;
    private WebSocketCollection _sockets = null!;
    private SaygLiveService _service = null!;

    [SetUp]
    public void SetupEachTest()
    {
        _serializerService = new JsonSerializerService(new JsonSerializer());
        _sockets = new WebSocketCollection();
        _service = new SaygLiveService(_sockets, _serializerService);
    }

    [Test]
    public async Task Connect_WhenCalled_AddsWebSocket()
    {
        var saygId = Guid.NewGuid();
        var socketsAfterFirstReceive = Array.Empty<WebSocket>();
        var noopDto = new SaygLiveMessageDto
        {
            Type = SaygLiveMessageDto.MessageType.Polo,
        };
        var gatedReceipt = new GatedDataReceipt(releaseItems: 2)
        {
            ReceiveResult(afterRelease: () =>
            {
                socketsAfterFirstReceive = _sockets.ToArray();
            }, dto: noopDto),
        };
        var socket = new MockWebSocket(dataToReceive: gatedReceipt.GetNext);

        await _service.Connect(socket, saygId, _token);

        Assert.That(socketsAfterFirstReceive, Is.EquivalentTo(new[] { socket }));
    }

    [Test]
    public async Task Connect_WhenSocketClosed_RemovesAndClosesSocket()
    {
        var saygId = Guid.NewGuid();
        var noopDto = new SaygLiveMessageDto
        {
            Type = SaygLiveMessageDto.MessageType.Polo,
        };
        var gatedReceipt = new GatedDataReceipt(releaseItems: 2)
        {
            ReceiveResult(dto: noopDto),
            ReceiveResult(closeStatus: WebSocketCloseStatus.NormalClosure),
        };
        var socket = new MockWebSocket(dataToReceive: gatedReceipt.GetNext);

        await _service.Connect(socket, saygId, _token);

        Assert.That(_sockets, Is.Empty);
        Assert.That(socket.Closed!.Value.Item1, Is.EqualTo(WebSocketCloseStatus.NormalClosure));
    }

    [Test]
    public async Task Connect_GivenTaskCanceledWhenClosingSocket_DoesNotThrow()
    {
        var saygId = Guid.NewGuid();
        var noopDto = new SaygLiveMessageDto
        {
            Type = SaygLiveMessageDto.MessageType.Polo,
        };
        var gatedReceipt = new GatedDataReceipt(releaseItems: 2)
        {
            ReceiveResult(dto: noopDto),
            ReceiveResult(closeStatus: WebSocketCloseStatus.NormalClosure),
        };
        var socket = new MockWebSocket(dataToReceive: gatedReceipt.GetNext)
        {
            ExceptionOnClose = new TaskCanceledException(),
        };

        await _service.Connect(socket, saygId, _token);

        Assert.That(_sockets, Is.Empty);
        Assert.That(socket.Closed!.Value.Item1, Is.EqualTo(WebSocketCloseStatus.NormalClosure));
    }

    [Test]
    public async Task Connect_WhenExceptionEncountered_KeepsSocketAssignedAndOpen()
    {
        var saygId = Guid.NewGuid();
        var noopDto = new SaygLiveMessageDto
        {
            Type = SaygLiveMessageDto.MessageType.Polo,
        };
        var gatedReceipt = new GatedDataReceipt(releaseItems: 2)
        {
            ReceiveResult(dto: noopDto),
            ReceiveResult(data: "Invalid JSON data - will trigger an exception"),
        };
        var socket = new MockWebSocket(dataToReceive: gatedReceipt.GetNext);

        await _service.Connect(socket, saygId, _token);

        Assert.That(_sockets, Is.EquivalentTo(new[] { socket }));
        Assert.That(socket.Closed, Is.Null);
    }

    [Test]
    public async Task Connect_WhenExceptionEncountered_SendsErrorBackToClient()
    {
        var saygId = Guid.NewGuid();
        var noopDto = new SaygLiveMessageDto
        {
            Type = SaygLiveMessageDto.MessageType.Marco,
        };
        var gatedReceipt = new GatedDataReceipt(releaseItems: 2)
        {
            ReceiveResult(dto: noopDto),
            ReceiveResult(data: "Invalid JSON data - will trigger an exception"),
        };
        var socket = new MockWebSocket(dataToReceive: gatedReceipt.GetNext);

        await _service.Connect(socket, saygId, _token);

        Assert.That(socket.Sent, Is.Not.Null);
        Assert.That(socket.Sent!.Value.Item2, Is.EqualTo(WebSocketMessageType.Text));
        Assert.That(socket.Sent!.Value.Item3, Is.True);
        var jsonData = GetDataFrom(socket.Sent.Value.Item1);
        var dto = JsonConvert.DeserializeObject<SaygLiveMessageDto>(jsonData);
        Assert.That(dto.Type, Is.EqualTo(SaygLiveMessageDto.MessageType.Error));
        Assert.That(dto.Message, Is.Not.Null.Or.Empty);
    }

    [Test]
    public async Task Connect_WhenDataReceivedOver2Messages_ConsolidatesBothMessagesAndThenProcesses()
    {
        var saygId = Guid.NewGuid();
        var noopDto = new SaygLiveMessageDto
        {
            Type = SaygLiveMessageDto.MessageType.Marco,
            Message = "Some message",
        };
        var jsonData = JsonConvert.SerializeObject(noopDto);
        var chunk1 = jsonData.Substring(0, 10);
        var chunk2 = jsonData.Substring(10);
        var gatedReceipt = new GatedDataReceipt(releaseItems: 3)
        {
            ReceiveResult(data: chunk1, endOfMessage: false),
            ReceiveResult(data: chunk2, endOfMessage: true),
            ReceiveResult(closeStatus: WebSocketCloseStatus.NormalClosure),
        };
        var socket = new MockWebSocket(dataToReceive: gatedReceipt.GetNext);

        await _service.Connect(socket, saygId, _token);

        Assert.That(socket.Sent, Is.Not.Null);
        var dto = JsonConvert.DeserializeObject<SaygLiveMessageDto>(GetDataFrom(socket.Sent!.Value.Item1));
        Assert.That(dto.Type, Is.EqualTo(SaygLiveMessageDto.MessageType.Polo));
    }

    [Test]
    public async Task Connect_GivenPolo_SendsNothing()
    {
        var saygId = Guid.NewGuid();
        var messageDto = new SaygLiveMessageDto
        {
            Type = SaygLiveMessageDto.MessageType.Polo,
        };
        var gatedReceipt = new GatedDataReceipt(releaseItems: 2)
        {
            ReceiveResult(dto: messageDto),
            ReceiveResult(closeStatus: WebSocketCloseStatus.NormalClosure),
        };
        var socket = new MockWebSocket(dataToReceive: gatedReceipt.GetNext);

        await _service.Connect(socket, saygId, _token);

        Assert.That(socket.Sent, Is.Null);
    }

    [Test]
    public async Task Connect_GivenMarco_SendsPolo()
    {
        var saygId = Guid.NewGuid();
        var messageDto = new SaygLiveMessageDto
        {
            Type = SaygLiveMessageDto.MessageType.Marco,
        };
        var gatedReceipt = new GatedDataReceipt(releaseItems: 2)
        {
            ReceiveResult(dto: messageDto),
            ReceiveResult(closeStatus: WebSocketCloseStatus.NormalClosure),
        };
        var socket = new MockWebSocket(dataToReceive: gatedReceipt.GetNext);

        await _service.Connect(socket, saygId, _token);

        Assert.That(socket.Sent, Is.Not.Null);
        var dto = JsonConvert.DeserializeObject<SaygLiveMessageDto>(GetDataFrom(socket.Sent!.Value.Item1));
        Assert.That(dto.Type, Is.EqualTo(SaygLiveMessageDto.MessageType.Polo));
    }

    [Test]
    public async Task Connect_GivenUpdateAndNoClients_DoesNotSendToPublisherSocket()
    {
        var saygId = Guid.NewGuid();
        var messageDto = new SaygLiveMessageDto
        {
            Type = SaygLiveMessageDto.MessageType.Update,
            Data = new RecordedScoreAsYouGoDto
            {
                Id = saygId,
            },
        };
        var gatedReceipt = new GatedDataReceipt(releaseItems: 2)
        {
            ReceiveResult(dto: messageDto),
            ReceiveResult(closeStatus: WebSocketCloseStatus.NormalClosure),
        };
        var publisherSocket = new MockWebSocket(dataToReceive: gatedReceipt.GetNext);

        await _service.Connect(publisherSocket, saygId, _token);

        Assert.That(publisherSocket.Sent, Is.Null);
    }

    [Test]
    public async Task Connect_GivenUpdateAndNoData_SendsErrorBackToPublisherSocket()
    {
        var saygId = Guid.NewGuid();
        var messageDto = new SaygLiveMessageDto
        {
            Type = SaygLiveMessageDto.MessageType.Update,
            Data = null,
        };
        var gatedReceipt = new GatedDataReceipt(releaseItems: 2)
        {
            ReceiveResult(dto: messageDto),
            ReceiveResult(closeStatus: WebSocketCloseStatus.NormalClosure),
        };
        var publisherSocket = new MockWebSocket(dataToReceive: gatedReceipt.GetNext);

        await _service.Connect(publisherSocket, saygId, _token);

        Assert.That(publisherSocket.Sent, Is.Not.Null);
        var sentDto = JsonConvert.DeserializeObject<SaygLiveMessageDto>(GetDataFrom(publisherSocket.Sent!.Value.Item1));
        Assert.That(sentDto.Type, Is.EqualTo(SaygLiveMessageDto.MessageType.Error));
        Assert.That(sentDto.Message, Is.EqualTo("No data supplied"));
        Assert.That(publisherSocket.Sent.Value.Item2, Is.EqualTo(WebSocketMessageType.Text));
        Assert.That(publisherSocket.Sent.Value.Item3, Is.EqualTo(true));
    }

    [Test]
    public async Task Connect_GivenUpdateAndSomeClients_SendsToSubscriberSockets()
    {
        var saygId = Guid.NewGuid();
        var messageDto = new SaygLiveMessageDto
        {
            Type = SaygLiveMessageDto.MessageType.Update,
            Data = new RecordedScoreAsYouGoDto
            {
                Id = saygId,
                YourName = "Your name",
            },
        };
        var subscriberSocket = new MockWebSocket();
        var publisherGatedReceipt = new GatedDataReceipt(releaseItems: 2)
        {
            ReceiveResult(dto: messageDto),
            ReceiveResult(closeStatus: WebSocketCloseStatus.NormalClosure),
        };
        var publisherSocket = new MockWebSocket(dataToReceive: publisherGatedReceipt.GetNext);
        _sockets.Add(saygId, subscriberSocket);

        await _service.Connect(publisherSocket, saygId, _token);

        Assert.That(subscriberSocket.Sent, Is.Not.Null);
        var sentData = GetDataFrom(subscriberSocket.Sent!.Value.Item1);
        Assert.That(sentData, Is.EqualTo(JsonConvert.SerializeObject(messageDto)));
        Assert.That(subscriberSocket.Sent.Value.Item2, Is.EqualTo(WebSocketMessageType.Text));
        Assert.That(subscriberSocket.Sent.Value.Item3, Is.EqualTo(true));
    }

    [Test]
    public async Task Connect_GivenWebSocketExceptionWhenSendingToAClient_RemovesSocketForClientAndSendsToRemaining()
    {
        var saygId = Guid.NewGuid();
        var messageDto = new SaygLiveMessageDto
        {
            Type = SaygLiveMessageDto.MessageType.Update,
            Data = new RecordedScoreAsYouGoDto
            {
                Id = saygId,
                YourName = "Your name",
            },
        };
        var subscriberSocket1 = new MockWebSocket { ExceptionOnSend = new WebSocketException() };
        var subscriberSocket2 = new MockWebSocket();
        var publisherGatedReceipt = new GatedDataReceipt(releaseItems: 2)
        {
            ReceiveResult(dto: messageDto),
            ReceiveResult(closeStatus: WebSocketCloseStatus.NormalClosure),
        };
        var publisherSocket = new MockWebSocket(dataToReceive: publisherGatedReceipt.GetNext);
        _sockets.Add(saygId, subscriberSocket1);
        _sockets.Add(saygId, subscriberSocket2);

        await _service.Connect(publisherSocket, saygId, _token);

        Assert.That(_sockets, Is.EquivalentTo(new[] { subscriberSocket2 }));
        Assert.That(subscriberSocket1.Sent, Is.Not.Null);
        Assert.That(subscriberSocket2.Sent, Is.Not.Null);
        var sentData = GetDataFrom(subscriberSocket2.Sent!.Value.Item1);
        Assert.That(sentData, Is.EqualTo(JsonConvert.SerializeObject(messageDto)));
        Assert.That(subscriberSocket2.Sent.Value.Item2, Is.EqualTo(WebSocketMessageType.Text));
        Assert.That(subscriberSocket2.Sent.Value.Item3, Is.EqualTo(true));
    }

    [Test]
    public async Task Connect_GivenOtherExceptionWhenSendingToAClient_KeepsSocketForClientAndSendsToRemaining()
    {
        var saygId = Guid.NewGuid();
        var messageDto = new SaygLiveMessageDto
        {
            Type = SaygLiveMessageDto.MessageType.Update,
            Data = new RecordedScoreAsYouGoDto
            {
                Id = saygId,
                YourName = "Your name",
            },
        };
        var subscriberSocket1 = new MockWebSocket { ExceptionOnSend = new InvalidOperationException() };
        var subscriberSocket2 = new MockWebSocket();
        var publisherGatedReceipt = new GatedDataReceipt(releaseItems: 2)
        {
            ReceiveResult(dto: messageDto),
            ReceiveResult(closeStatus: WebSocketCloseStatus.NormalClosure),
        };
        var publisherSocket = new MockWebSocket(dataToReceive: publisherGatedReceipt.GetNext);
        _sockets.Add(saygId, subscriberSocket1);
        _sockets.Add(saygId, subscriberSocket2);

        await _service.Connect(publisherSocket, saygId, _token);

        Assert.That(_sockets, Is.EquivalentTo(new[] { subscriberSocket1, subscriberSocket2 }));
        Assert.That(subscriberSocket1.Sent, Is.Not.Null);
        Assert.That(subscriberSocket2.Sent, Is.Not.Null);
        var sentData = GetDataFrom(subscriberSocket2.Sent!.Value.Item1);
        Assert.That(sentData, Is.EqualTo(JsonConvert.SerializeObject(messageDto)));
        Assert.That(subscriberSocket2.Sent.Value.Item2, Is.EqualTo(WebSocketMessageType.Text));
        Assert.That(subscriberSocket2.Sent.Value.Item3, Is.EqualTo(true));
    }

    private static string GetDataFrom(ArraySegment<byte> buffer)
    {
        var stream = new MemoryStream();
        stream.Write(buffer.Array!, 0, buffer.Count);
        return Encoding.UTF8.GetString(stream.ToArray());
    }

    private static ReceiveResultAndData ReceiveResult(
        bool endOfMessage = true,
        WebSocketCloseStatus? closeStatus = null,
        string data = "",
        SaygLiveMessageDto? dto = null,
        Action? afterRelease = null)
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
                "desc"),
            dataBytes)
        {
            AfterRelease = afterRelease ?? (() => {}),
        };
    }

    private class MockWebSocket : WebSocket
    {
        private readonly Func<MockWebSocket, ArraySegment<byte>, Task<WebSocketReceiveResult>> _dataToReceive;

        // ReSharper disable UnusedAutoPropertyAccessor.Local
        public bool Aborted { get; private set; }
        public bool Disposed { get; private set; }
        public (WebSocketCloseStatus, string?)? Closed { get; private set; }
        public (ArraySegment<byte>, WebSocketMessageType, bool)? Sent { get; private set; }
        // ReSharper restore UnusedAutoPropertyAccessor.Local

        public WebSocketCloseStatus? MockCloseStatus { get; set; }
        public string? MockCloseStatusDescription { get; set; }
        public WebSocketState MockState { get; set; }
        public string? MockSubProtocol { get; set; }
        public Exception? ExceptionOnSend { get; set; }
        public Exception? ExceptionOnClose { get; set; }

        public override WebSocketCloseStatus? CloseStatus => MockCloseStatus;
        public override string? CloseStatusDescription => MockCloseStatusDescription;
        public override WebSocketState State => MockState;
        public override string? SubProtocol => MockSubProtocol;

        public MockWebSocket(
            WebSocketCloseStatus? closeStatus = null,
            string? closeStatusDescription = null,
            WebSocketState? state = null,
            string? subProtocol = null,
            Func<MockWebSocket, ArraySegment<byte>, Task<WebSocketReceiveResult>>? dataToReceive = null)
        {
            MockCloseStatus = closeStatus;
            MockCloseStatusDescription = closeStatusDescription;
            MockSubProtocol = subProtocol;

            if (state != null)
            {
                MockState = state.Value;
            }

            _dataToReceive = dataToReceive ?? ((_, _) => Task.FromResult(new WebSocketReceiveResult(0, WebSocketMessageType.Close, true)));
        }

        public override void Abort()
        {
            Aborted = true;
        }

        public override Task CloseAsync(WebSocketCloseStatus closeStatus, string? statusDescription, CancellationToken cancellationToken)
        {
            Closed = (closeStatus, statusDescription);
            if (ExceptionOnClose != null)
            {
                throw ExceptionOnClose;
            }

            return Task.CompletedTask;
        }

        public override Task CloseOutputAsync(WebSocketCloseStatus closeStatus, string? statusDescription, CancellationToken cancellationToken)
        {
            throw new NotSupportedException();
        }

        public override void Dispose()
        {
            Disposed = true;
        }

        public override async Task<WebSocketReceiveResult> ReceiveAsync(ArraySegment<byte> buffer, CancellationToken cancellationToken)
        {
            return await _dataToReceive(this, buffer);
        }

        public override Task SendAsync(ArraySegment<byte> buffer, WebSocketMessageType messageType, bool endOfMessage, CancellationToken cancellationToken)
        {
            Sent = (buffer, messageType, endOfMessage);
            if (ExceptionOnSend != null)
            {
                throw ExceptionOnSend;
            }

            return Task.CompletedTask;
        }
    }

    private class GatedDataReceipt : IEnumerable<ReceiveResultAndData>
    {
        private int _releaseItems;
        private readonly Queue<ReceiveResultAndData> _items = new Queue<ReceiveResultAndData>();
        private readonly AutoResetEvent _autoResetEvent;
        private ReceiveResultAndData? _lastReleasedItem;

        public GatedDataReceipt(int releaseItems = 1)
        {
            _releaseItems = releaseItems;
            _autoResetEvent = new AutoResetEvent(_releaseItems > 0);
        }

        public void Add(ReceiveResultAndData item)
        {
            _items.Enqueue(item);
        }

        IEnumerator IEnumerable.GetEnumerator()
        {
            return GetEnumerator();
        }
        public IEnumerator<ReceiveResultAndData> GetEnumerator()
        {
            return _items.GetEnumerator();
        }

        // ReSharper disable once MemberCanBePrivate.Local
        public void ReleaseNext()
        {
            _autoResetEvent.Set();
        }

        public Task<WebSocketReceiveResult> GetNext(MockWebSocket socket, ArraySegment<byte> buffer)
        {
            if (_lastReleasedItem != null)
            {
                _lastReleasedItem.AfterRelease();
                if (_releaseItems > 0)
                {
                    ReleaseNext();
                }
            }

            _autoResetEvent.WaitOne();
            var item = _items.Dequeue();
            item.BeforeRelease(socket, buffer);
            _lastReleasedItem = item;
            _releaseItems--;
            return Task.FromResult(item.ReceiveResult);
        }
    }

    private class ReceiveResultAndData
    {
        private readonly byte[] _bytes;

        public ReceiveResultAndData(WebSocketReceiveResult receiveResult, byte[] bytes)
        {
            ReceiveResult = receiveResult;
            _bytes = bytes;
        }

        // ReSharper disable MemberHidesStaticFromOuterClass
        public WebSocketReceiveResult ReceiveResult { get; }
        // ReSharper restore MemberHidesStaticFromOuterClass

        public Action AfterRelease { get; set; } = () => { };

        public void BeforeRelease(MockWebSocket mockWebSocket, ArraySegment<byte> buffer)
        {
            mockWebSocket.MockCloseStatus = ReceiveResult.CloseStatus;
            mockWebSocket.MockCloseStatusDescription = ReceiveResult.CloseStatusDescription;
            Array.Copy(_bytes, buffer.Array!, _bytes.Length);
        }
    }
}