using CourageScores.Models.Dtos.Season.Creation;

namespace CourageScores.Models.Adapters.Season.Creation;

public class SharedAddressAdapter : ISimpleAdapter<List<string>, List<TeamPlaceholderDto>>
{
    public Task<List<TeamPlaceholderDto>> Adapt(List<string> model, CancellationToken token)
    {
        return Task.FromResult(new List<TeamPlaceholderDto>(model.Select(p => new TeamPlaceholderDto(p))));
    }

    public Task<List<string>> Adapt(List<TeamPlaceholderDto> dto, CancellationToken token)
    {
        return Task.FromResult(new List<string>(dto.Select(t => t.Key.Trim())));
    }
}