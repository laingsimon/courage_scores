using CourageScores.Models.Dtos.RemoteControl;
using CosmosRemoteControl = CourageScores.Models.Cosmos.RemoteControl.RemoteControl;

namespace CourageScores.Models.Adapters.RemoteControl;

public class RemoteControlAdapter : ISimpleOnewayAdapter<CosmosRemoteControl, RemoteControlDto>
{
    public Task<RemoteControlDto> Adapt(CosmosRemoteControl model, CancellationToken token)
    {
        return Task.FromResult(new RemoteControlDto
        {
            Id = model.Id,
            Created = model.Created,
            Url = model.Url,
            UrlUpdated = model.UrlUpdated,
        });
    }
}
