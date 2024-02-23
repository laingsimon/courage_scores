using System.Diagnostics.CodeAnalysis;
using CourageScores.Models.Dtos.Live;

namespace CourageScores.Services.Live;

[ExcludeFromCodeCoverage]
public class CompositeWebSocketMessageProcessor : IWebSocketMessageProcessor
{
    private readonly IWebSocketMessageProcessor[] _processors;

    public CompositeWebSocketMessageProcessor(IWebSocketMessageProcessor[] processors)
    {
        _processors = processors;
    }

    public void Disconnected(IWebSocketContract socket)
    {
        foreach (var processor in _processors)
        {
            processor.Disconnected(socket);
        }
    }

    public async Task PublishUpdate(IWebSocketContract source, Guid id, LiveDataType dataType, object dto, CancellationToken token)
    {
        foreach (var processor in _processors)
        {
            if (token.IsCancellationRequested)
            {
                return;
            }

            await processor.PublishUpdate(source, id, dataType, dto, token);
        }
    }
}