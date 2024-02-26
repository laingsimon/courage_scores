using CourageScores.Models.Dtos.Live;

namespace CourageScores.Models.Adapters.Live;

public class WebSocketDtoAdapter : ISimpleOnewayAdapter<WebSocketDetail, WebSocketDto>
{
    public Task<WebSocketDto> Adapt(WebSocketDetail model, CancellationToken token)
    {
        return Task.FromResult(new WebSocketDto
        {
            Connected = model.Connected,
            Id = model.Id,
            Subscriptions = model.Subscriptions,
            LastReceipt = model.LastReceipt,
            LastSent = model.LastSent,
            OriginatingUrl = model.OriginatingUrl,
            ReceivedMessages = model.ReceivedMessages,
            SentMessages = model.SentMessages,
            UserName = model.UserName,
        });
    }
}