using CourageScores.Models.Dtos.Season.Creation;
using CourageScores.Services.Identity;

namespace CourageScores.Models.Adapters.Season.Creation;

public class SharedAddressAdapter : ISimpleAdapter<List<string>, List<TeamPlaceholderDto>>
{
    public Task<List<TeamPlaceholderDto>> Adapt(List<string> model, UserAccessContext context, CancellationToken token)
    {
        return Task.FromResult(new List<TeamPlaceholderDto>(model.Select(p => new TeamPlaceholderDto(p))));
    }

    public Task<List<string>> Adapt(List<TeamPlaceholderDto> dto, UserAccessContext context, CancellationToken token)
    {
        return Task.FromResult(new List<string>(dto.Select(t => t.Key.TrimOrDefault())));
    }
}
