using CourageScores.Models.Cosmos.Season.Creation;
using CourageScores.Models.Dtos.Season.Creation;

namespace CourageScores.Models.Adapters.Season.Creation;

public class SharedAddressAdapter : ISimpleAdapter<SharedAddress, SharedAddressDto>
{
    public Task<SharedAddressDto> Adapt(SharedAddress model, CancellationToken token)
    {
        return Task.FromResult(new SharedAddressDto
        {
            Teams = model.Teams.Select(p => new TeamPlaceholderDto(p)).ToList(),
        });
    }

    public Task<SharedAddress> Adapt(SharedAddressDto dto, CancellationToken token)
    {
        return Task.FromResult(new SharedAddress
        {
            Teams = dto.Teams.Select(t => t.Key.Trim()).ToList(),
        });
    }
}