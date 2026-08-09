using CourageScores.Models.Dtos;
using CourageScores.Services.Identity;

namespace CourageScores.Models.Adapters;

public class DivisionAdapter : IAdapter<Cosmos.Division, DivisionDto>
{
    public Task<DivisionDto> Adapt(Cosmos.Division model, UserAccessContext context, CancellationToken token)
    {
        return Task.FromResult(new DivisionDto
        {
            Id = model.Id,
            Name = model.Name.TrimOrDefault(),
            Superleague = model.Superleague,
        }.AddAuditProperties(model));
    }

    public Task<Cosmos.Division> Adapt(DivisionDto dto, UserAccessContext context, CancellationToken token)
    {
        return Task.FromResult(new Cosmos.Division
        {
            Id = dto.Id,
            Name = dto.Name.TrimOrDefault(),
            Superleague = dto.Superleague,
        }.AddAuditProperties(dto));
    }
}
